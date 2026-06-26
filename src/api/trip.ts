// Read API (spec §8). The frontend never touches D1 directly — it reads JSON
// from here. Responses are the same shapes the MCP tools return.
//
//   GET /api/health          → { ok: true }
//   GET /api/trip            → full state for the default trip
//   GET /api/trip/:id        → full state for a trip
//   GET /api/trip/:id/days   → plan items grouped by day (convenience)

import type { Env } from "../env";
import { defaultTripId } from "../env";
import { ensureSeed, getDayGroups, getTripState } from "../db/queries";
import { json, jsonError } from "../lib/http";

export async function handleApi(url: URL, _request: Request, env: Env): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, ""); // tolerate trailing slash

  if (path === "/api/health") {
    return json({ ok: true, service: "trip-planner", time: new Date().toISOString() });
  }

  // /api/trip  or  /api/trip/:id  or  /api/trip/:id/days
  const m = path.match(/^\/api\/trip(?:\/([^/]+))?(?:\/(days))?$/);
  if (m) {
    const tripId = decodeURIComponent(m[1] ?? "") || defaultTripId(env);
    const sub = m[2];

    await ensureSeed(env.DB, tripId);

    if (sub === "days") {
      const days = await getDayGroups(env.DB, tripId);
      return json(days);
    }

    const state = await getTripState(env.DB, tripId);
    if (!state) return jsonError(`Trip '${tripId}' not found.`, 404);
    return json(state);
  }

  return jsonError("Not found", 404);
}
