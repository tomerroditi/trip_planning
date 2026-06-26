# Kiwiroute — a conversational trip planner

You plan a trip by **talking to Claude**. Claude writes structured trip data —
where you're staying, your bookings, the day-by-day plan — into a database via a
custom **MCP server**. A separate **React + Leaflet web app** renders that data,
including a real map, in a normal browser tab. The two stay in sync through the
database.

Everything except Claude runs on **Cloudflare's free tier** from a single Worker.

> **Why split it this way?** Claude's artifact sandbox blocks external map tiles,
> so Leaflet renders blank there. By keeping *chat + data writes* in Claude and
> *rendering* in our own full-browser app, the map just works. The database is
> the shared source of truth.

```
You (claude.ai)  ──plain language──▶  Claude
                                        │  decides which tools to call
                                        ▼
                          MCP server  (Cloudflare Worker, /mcp)
                                        │  add_booking, set_day_plan, …
                                        ▼
                                   D1 database  ◀── shared source of truth
                                        │  read (/api/trip)
                                        ▼
                       Web app  (React + Leaflet, static assets)
                                        │  renders map + itinerary, polls for changes
                                        ▼
                       You review & refine ──▶ (loop back to chat)
```

---

## What's in the box

A single Cloudflare Worker serves three things from one deploy:

| Route            | Serves                                                       |
| ---------------- | ----------------------------------------------------------- |
| `/mcp`, `/sse`   | The MCP server Claude connects to (Streamable HTTP + legacy SSE) |
| `/api/*`         | A JSON read API the app polls                                |
| everything else  | The built React app (Cloudflare static assets, SPA fallback) |

The bundled trip is **"Aotearoa Road Trip" — New Zealand's South Island,
4–17 Oct 2026**: 5 segments, 14 days, ~40 planned stops, 10 stays, a budget and a
document vault. It renders on first load with no manual seeding.

## Repository layout

```
trip-planner/
├── wrangler.toml            # Worker config: D1, the McpAgent Durable Object, static assets
├── schema.sql               # canonical schema (generated from the migration)
├── migrations/0001_init.sql # D1 schema (wrangler d1 migrations apply)
├── seed/seed.sql            # generated, idempotent seed for the NZ trip
├── scripts/gen-seed.ts      # regenerates schema.sql + seed/seed.sql from src/db/seed.ts
├── shared/                  # types + geo helpers shared by Worker and app
│   ├── types.ts             # the data contract (TripState etc.)
│   └── geo.ts               # offline gazetteer + name normalisation
├── src/                     # the Worker
│   ├── index.ts             # routes /mcp, /sse, /api/*, falls back to assets
│   ├── env.ts               # binding types
│   ├── mcp/server.ts        # TripMcp (McpAgent subclass)
│   ├── mcp/tools.ts         # the MCP tool surface
│   ├── api/trip.ts          # GET /api/trip[/:id[/days]], /api/health
│   ├── db/schema.ts         # typed row interfaces
│   ├── db/queries.ts        # the single place that touches SQL
│   ├── db/seed.ts           # typed seed (source of truth) + ensureSeed builder
│   └── lib/                 # id generation, HTTP helpers
├── app/                     # React + Leaflet frontend (Vite)
│   └── src/                 # Sidebar, Header, Overview, Itinerary, MapRoute, Budget, Stays, Docs
└── test/                    # vitest: data layer runs against real SQLite
```

`db/queries.ts` is the **only** module that writes SQL — both the MCP tools and
the read API call into it, so the write and read paths can't drift.

---

## Prerequisites

- Node 22+
- A Cloudflare account (free). `npx wrangler login`, or set `CLOUDFLARE_API_TOKEN`
  / `CLOUDFLARE_ACCOUNT_ID` in the environment.

```bash
npm install
```

## Deploy

```bash
# 1. Create the D1 database and paste the printed database_id into wrangler.toml
npm run db:create
#    → copy "database_id" into the [[d1_databases]] block

# 2. Create the tables on the remote database
npm run db:migrate            # wrangler d1 migrations apply trip-planner --remote

# 3. (optional) Load the New Zealand trip. The Worker also seeds lazily on first
#    read, so this is only needed if you want the data present up front.
npm run db:seed               # regenerates seed/seed.sql, then executes it --remote

# 4. Build the app and deploy the Worker (one command)
npm run deploy                # builds app/dist, then `wrangler deploy`
```

`npm run deploy` runs `gen:seed` + `vite build` + `wrangler deploy`. Note the
deployed URL — your endpoints are `https://<worker>.<subdomain>.workers.dev/mcp`
and `…/` for the app.

## Connect it to Claude

1. In **claude.ai → Settings → Connectors → Add custom connector**.
2. Paste your `/mcp` URL: `https://<worker>.<subdomain>.workers.dev/mcp`.
3. Enable the connector in a conversation via the **+** menu.
4. Open the app URL (`https://<worker>.<subdomain>.workers.dev/`) in a browser tab.
5. Chat: *"Move our Queenstown check-in to the 9th and add a jet-boat booking on
   the 8th."* Watch the itinerary and map update — the app polls every ~12s and
   refetches when you focus the tab (there's also a refresh button in the header).

> Claude always calls `get_trip` first to load context, then makes targeted
> `add_*` / `update_*` / `set_day_plan` calls. Each tool returns the updated trip
> state so Claude stays grounded.

## Local development

```bash
# Terminal A — the Worker (MCP + API + assets) on a local D1
npm run db:migrate:local      # create local tables once
npm run dev                   # wrangler dev → http://localhost:8787

# Terminal B — the app with hot reload (proxies /api, /mcp to wrangler)
npm run dev:app               # vite → http://localhost:5173
```

Quick checks:

```bash
curl localhost:8787/api/health
curl localhost:8787/api/trip | jq '.trip.name, (.segments | length)'
```

## Verify

```bash
npm run typecheck   # tsc for the Worker and the app
npm test            # vitest — data layer runs against real SQLite via better-sqlite3
npm run build       # regenerate seed + build app/dist
npx wrangler deploy --dry-run   # bundle the Worker and validate bindings
```

---

## MCP tool surface

Tools generate and return ids (Claude never invents them), prefer updates over
duplicates, let coordinates flow through to the map, and return the updated
`TripState`. `trip_id` is optional on every tool — omit it to use the default
trip.

| Tool | Purpose |
| ---- | ------- |
| `get_trip` | Load the full trip (metadata, segments → days → items, stays, bookings, budget, docs, notes). |
| `add_accommodation` / `update_accommodation` / `remove_accommodation` | Manage stays. `status` ∈ Booked/Pending/To book. |
| `add_booking` / `update_booking` / `remove_booking` | Flights, activities, restaurants, transport. Geo-located ones appear on the map. |
| `set_day_plan` | Replace a day's ordered items (idempotent per ISO date); can also set day metadata. |
| `set_day` | Set day-level metadata (title, map anchor, drive leg) without touching items. |
| `add_plan_item` / `update_plan_item` / `remove_plan_item` | Per-item edits, including ticking `done`. |
| `add_segment` | Add a new chapter/region. |
| `set_budget_category` | Set a category's planned/actual (matched by name). |
| `add_document` / `remove_document` | The document & links vault. |
| `add_note` / `remove_note` | Trip- or day-level notes. |

## Read API

```
GET /api/health         → { ok: true }
GET /api/trip           → full TripState for the default trip
GET /api/trip/:id       → full TripState for a trip
GET /api/trip/:id/days  → plan items grouped by day (convenience)
```

Responses are `Cache-Control: no-store` (the trip changes during a session) and
CORS-open for reads. The app reads same-origin.

## Data model

Core tables follow the spec — `trips`, `accommodations`, `bookings`,
`plan_items`, `notes` — extended with `segments` (the trip's chapters), `days`
(per-day title / drive leg / map anchor), `budget_categories`, and `documents`
so the full design renders. See `migrations/0001_init.sql`.

Coordinates: Claude supplies `lat`/`lng` when it knows a place, so the item gets
a pin. Known South Island place names also resolve from an offline gazetteer
(`shared/geo.ts`) as a fallback; anything unrecognised is listed without a pin.

## Auth

v1 ships an **unauthenticated MCP endpoint** — fine for a personal planner; don't
share the `/mcp` URL. To lock it down, set a bearer token:

```bash
npx wrangler secret put MCP_BEARER_TOKEN
```

When set, `/mcp` and `/sse` require `Authorization: Bearer <token>`; the read API
stays public. For full OAuth, swap in Cloudflare's `workers-oauth-provider`
(the McpAgent integrates with it) — that's the cleaner long-term path.

## Notes

- **Map tiles** use CARTO's OSM-based Voyager basemap, loaded directly by the
  browser. Swap the tile URL in `app/src/components/MapRoute.tsx` for plain OSM
  or a keyed provider (MapTiler/Stadia) if you prefer.
- **In-app editing** is intentionally read-only in v1 — editing happens through
  conversation with Claude. The app reflects writes live via polling.
- **Multiple trips**: the schema already supports them; v1 defaults to one
  (`DEFAULT_TRIP_ID`). View another with `?trip=<id>` in the app URL.
- **Free-tier headroom**: ~100K Worker requests/day and millions of D1 rows
  read/day — far beyond a personal planner.
