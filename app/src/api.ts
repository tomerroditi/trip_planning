// Fetch wrapper for the read API. Same-origin in production (the Worker serves
// both the app and /api); in dev, vite proxies /api to wrangler.

import type { TripState } from "./types";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

// Optional ?trip=<id> in the page URL selects a non-default trip.
export function tripIdFromUrl(): string | null {
  try {
    return new URLSearchParams(window.location.search).get("trip");
  } catch {
    return null;
  }
}

export async function fetchTrip(tripId?: string | null): Promise<TripState> {
  const path = tripId ? `/api/trip/${encodeURIComponent(tripId)}` : "/api/trip";
  const res = await fetch(BASE + path, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    let detail = "";
    try {
      detail = ((await res.json()) as { error?: string }).error ?? "";
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Failed to load trip (${res.status})`);
  }
  return (await res.json()) as TripState;
}

// ---------------------------------------------------------------------------
// Write API — in-app editing. Every mutation resolves to the fresh TripState
// the Worker returns, so the caller can reconcile optimistic updates.
// ---------------------------------------------------------------------------

type Method = "POST" | "PATCH" | "DELETE";

// The trip id the write routes need. The default trip is addressable by its
// real id too; the read path lets us omit it, but writes always include it.
export const DEFAULT_TRIP_ID = "nz-south-island";

export function effectiveTripId(tripId?: string | null): string {
  return tripId || DEFAULT_TRIP_ID;
}

async function mutate(
  tripId: string | null | undefined,
  resource: string,
  method: Method,
  body?: unknown,
): Promise<{ state: TripState; id?: string }> {
  const id = effectiveTripId(tripId);
  const path = `/api/trip/${encodeURIComponent(id)}/${resource}`;
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    state?: TripState;
    id?: string;
  };
  if (!res.ok || data.ok === false || !data.state) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return { state: data.state, id: data.id };
}

export const write = {
  patchPlanItem: (trip: string | null | undefined, itemId: string, fields: Record<string, unknown>) =>
    mutate(trip, `plan-item/${encodeURIComponent(itemId)}`, "PATCH", fields),

  patchBooking: (trip: string | null | undefined, bookingId: string, fields: Record<string, unknown>) =>
    mutate(trip, `booking/${encodeURIComponent(bookingId)}`, "PATCH", fields),
  addBooking: (trip: string | null | undefined, fields: Record<string, unknown>) =>
    mutate(trip, "booking", "POST", fields),

  patchAccommodation: (trip: string | null | undefined, accId: string, fields: Record<string, unknown>) =>
    mutate(trip, `accommodation/${encodeURIComponent(accId)}`, "PATCH", fields),
  addAccommodation: (trip: string | null | undefined, fields: Record<string, unknown>) =>
    mutate(trip, "accommodation", "POST", fields),

  patchBudget: (trip: string | null | undefined, catId: string, fields: Record<string, unknown>) =>
    mutate(trip, `budget-category/${encodeURIComponent(catId)}`, "PATCH", fields),

  addChecklist: (trip: string | null | undefined, fields: Record<string, unknown>) =>
    mutate(trip, "checklist", "POST", fields),
  patchChecklist: (trip: string | null | undefined, cid: string, fields: Record<string, unknown>) =>
    mutate(trip, `checklist/${encodeURIComponent(cid)}`, "PATCH", fields),
  removeChecklist: (trip: string | null | undefined, cid: string) =>
    mutate(trip, `checklist/${encodeURIComponent(cid)}`, "DELETE"),
};
