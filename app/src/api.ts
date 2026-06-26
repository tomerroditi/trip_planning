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
