// Write API for the app's own in-app editing (ticking items done, editing a
// note, adjusting a budget actual, managing the checklist, adding a booking or
// stay found in the Explore tab). Both this and the MCP tools call into
// db/queries.ts, so the write paths stay consistent.
//
// The read API (GET) is public; these mutations are open too — this is a
// personal planner served same-origin by the app (see README §Auth). If you
// set MCP_BEARER_TOKEN, it guards /mcp only, not these routes; lock the app
// down at the edge (Cloudflare Access) if you deploy it publicly.
//
//   PATCH  /api/trip/:id/plan-item/:itemId       { done?, notes?, title?, tag? }
//   PATCH  /api/trip/:id/booking/:bookingId      { ...booking fields }
//   POST   /api/trip/:id/booking                 { type, title, ... }  → { id }
//   PATCH  /api/trip/:id/accommodation/:accId    { status?, cost?, ... }
//   POST   /api/trip/:id/accommodation           { name, ... }          → { id }
//   PATCH  /api/trip/:id/budget-category/:catId  { planned?, actual? }
//   POST   /api/trip/:id/checklist               { text, category?, date? } → { id }
//   PATCH  /api/trip/:id/checklist/:cid          { done?, text?, category? }
//   DELETE /api/trip/:id/checklist/:cid
//   POST   /api/trip/:id/note                     { text, date? }         → { id }
//   DELETE /api/trip/:id/note/:noteId
//
// Every successful mutation returns the fresh full TripState under `state`, so
// the client can reconcile without a second round-trip.

import type { Env } from "../env";
import { defaultTripId } from "../env";
import * as q from "../db/queries";
import { json, jsonError } from "../lib/http";

// Fields the client is allowed to set, per entity. Anything else is dropped
// before it reaches queries.ts (which additionally restricts to real columns).
const ALLOWED: Record<string, string[]> = {
  planItem: ["done", "notes", "title", "tag", "type", "start_time", "end_time"],
  booking: ["type", "title", "date", "time", "location_name", "lat", "lng", "confirmation", "cost", "currency", "url", "notes"],
  accommodation: ["name", "location_name", "check_in", "check_out", "dates_label", "nights", "booking_ref", "cost", "currency", "status", "url", "notes", "lat", "lng"],
  budget: ["planned", "actual", "color"],
  checklist: ["text", "category", "done", "date"],
};

function pick(body: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function handleWrite(url: URL, request: Request, env: Env): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method;

  // /api/trip/:id/<resource>[/:rid]
  const m = path.match(/^\/api\/trip\/([^/]+)\/([a-z-]+)(?:\/([^/]+))?$/);
  if (!m) return jsonError("Not found", 404);

  const tripId = decodeURIComponent(m[1]) || defaultTripId(env);
  const resource = m[2];
  const rid = m[3] ? decodeURIComponent(m[3]) : null;
  const DB = env.DB;

  await q.ensureSeed(DB, tripId);

  const withState = async (extra: Record<string, unknown> = {}) => {
    const state = await q.getTripState(DB, tripId);
    if (!state) return jsonError(`Trip '${tripId}' not found.`, 404);
    return json({ ok: true, ...extra, state });
  };

  const body = method === "GET" || method === "DELETE" ? {} : await readBody(request);

  switch (resource) {
    case "plan-item": {
      if (method !== "PATCH" || !rid) break;
      await q.updatePlanItem(DB, rid, pick(body, ALLOWED.planItem));
      return withState();
    }
    case "booking": {
      if (method === "POST") {
        if (!body.title || !body.type) return jsonError("booking requires type and title", 422);
        const id = await q.addBooking(DB, { trip_id: tripId, ...(pick(body, ALLOWED.booking) as { type: string; title: string }) });
        return withState({ id });
      }
      if (method === "PATCH" && rid) {
        await q.updateBooking(DB, rid, pick(body, ALLOWED.booking));
        return withState();
      }
      if (method === "DELETE" && rid) {
        await q.removeBooking(DB, rid);
        return withState();
      }
      break;
    }
    case "accommodation": {
      if (method === "POST") {
        if (!body.name) return jsonError("accommodation requires name", 422);
        const id = await q.addAccommodation(DB, { trip_id: tripId, ...(pick(body, ALLOWED.accommodation) as { name: string }) });
        return withState({ id });
      }
      if (method === "PATCH" && rid) {
        await q.updateAccommodation(DB, rid, pick(body, ALLOWED.accommodation));
        return withState();
      }
      if (method === "DELETE" && rid) {
        await q.removeAccommodation(DB, rid);
        return withState();
      }
      break;
    }
    case "budget-category": {
      if (method !== "PATCH" || !rid) break;
      await q.updateBudgetCategoryById(DB, rid, pick(body, ALLOWED.budget));
      return withState();
    }
    case "checklist": {
      if (method === "POST") {
        if (!body.text) return jsonError("checklist item requires text", 422);
        const id = await q.addChecklistItem(DB, {
          trip_id: tripId,
          text: String(body.text),
          category: body.category ? String(body.category) : undefined,
          date: body.date ? String(body.date) : undefined,
        });
        return withState({ id });
      }
      if (method === "PATCH" && rid) {
        await q.updateChecklistItem(DB, rid, pick(body, ALLOWED.checklist));
        return withState();
      }
      if (method === "DELETE" && rid) {
        await q.removeChecklistItem(DB, rid);
        return withState();
      }
      break;
    }
    case "note": {
      if (method === "POST") {
        if (!body.text) return jsonError("note requires text", 422);
        const id = await q.addNote(DB, tripId, String(body.text), body.date ? String(body.date) : undefined);
        return withState({ id });
      }
      if (method === "DELETE" && rid) {
        await q.removeNote(DB, rid);
        return withState();
      }
      break;
    }
  }

  return jsonError(`Unsupported ${method} on ${resource}`, 405);
}
