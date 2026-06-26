// Derived view values, ported from the design's renderVals(). Pure functions of
// the trip state so components stay declarative.

import { normLoc, resolveLoc, type LatLng } from "../../shared/geo";
import type { TripState } from "./types";
import { C } from "./theme";

export function countdownDays(startDate: string | null): number {
  if (!startDate) return 0;
  const [y, m, d] = startDate.split("-").map(Number);
  const start = Date.UTC(y, (m || 1) - 1, d || 1);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.ceil((start - today) / 86400000));
}

export function progress(state: TripState): { done: number; total: number; pct: string } {
  let done = 0;
  let total = 0;
  for (const seg of state.segments)
    for (const day of seg.days)
      for (const it of day.items) {
        total++;
        if (it.done) done++;
      }
  return { done, total, pct: total ? Math.round((done / total) * 100) + "%" : "0%" };
}

export interface Stop {
  name: string;
  color: string;
  coords: LatLng | null;
  sources: string[];
}

// Build the map's stop list from the itinerary days, stays and geo-located
// bookings — deduped by place name, in first-appearance order.
export function computeStops(state: TripState): Stop[] {
  const order: Stop[] = [];
  const seen = new Map<string, Stop>();
  const segColor = new Map(state.segments.map((s) => [s.id, s.color]));

  const push = (
    name: string | null,
    color: string,
    source: string,
    lat: number | null,
    lng: number | null,
  ) => {
    if (!name) return;
    const key = normLoc(name);
    if (!key) return;
    const coords: LatLng | null = lat != null && lng != null ? [lat, lng] : resolveLoc(name);
    const existing = seen.get(key);
    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      if (!existing.coords && coords) existing.coords = coords;
      return;
    }
    const stop: Stop = { name, color, coords, sources: [source] };
    seen.set(key, stop);
    order.push(stop);
  };

  for (const seg of state.segments)
    for (const day of seg.days) push(day.location_name, seg.color, "Itinerary", day.lat, day.lng);
  for (const a of state.accommodations)
    push(a.location_name, (a.segment_id && segColor.get(a.segment_id)) || C.greenMid, "Stay", a.lat, a.lng);
  for (const b of state.bookings)
    if (b.lat != null && b.lng != null) push(b.location_name, "#C2873F", "Booking", b.lat, b.lng);

  return order;
}

export interface BudgetView {
  total: number;
  remain: number;
  totalPct: string;
  perPerson: number;
  perDay: number;
}

export function budgetTotals(
  state: TripState,
  mode: "planned" | "actual",
): BudgetView {
  const cap = state.trip.budget_cap ?? 0;
  const total = state.budget_categories.reduce(
    (a, c) => a + (mode === "planned" ? c.planned : c.actual),
    0,
  );
  const travellers = (state.trip.travellers || "").split("&").filter((s) => s.trim()).length || 1;
  let days = state.segments.reduce((a, s) => a + s.days.length, 0);
  if (!days) days = 1;
  return {
    total,
    remain: cap - total,
    totalPct: cap ? Math.round((total / cap) * 100) + "%" : "0%",
    perPerson: total / travellers,
    perDay: total / days,
  };
}

export function initials(travellers: string | null): [string, string] {
  const parts = (travellers || "").split("&").map((x) => x.trim()).filter(Boolean);
  const a = ((parts[0] || "M")[0] || "M").toUpperCase();
  const b = ((parts[1] || parts[0] || "T")[0] || "T").toUpperCase();
  return [a, b];
}
