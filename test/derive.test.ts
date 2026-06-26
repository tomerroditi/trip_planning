import { describe, expect, it } from "vitest";
import { makeD1 } from "./helpers/d1";
import { ensureSeed, getTripState } from "../src/db/queries";
import { TRIP } from "../src/db/seed";
import { normLoc, resolveLoc } from "../shared/geo";
import { budgetTotals, computeStops, countdownDays, initials } from "../app/src/derive";
import { dateRangeLabel, timeAgo, totalDays } from "../app/src/format";

type DB = Parameters<typeof getTripState>[0];

async function seededState() {
  const DB = makeD1() as unknown as DB;
  await ensureSeed(DB, TRIP.id);
  return (await getTripState(DB, TRIP.id))!;
}

describe("geo", () => {
  it("normalises place names", () => {
    expect(normLoc("Aoraki / Mt Cook")).toBe("aoraki mt cook");
    expect(normLoc("Arthur's Pass")).toBe("arthurs pass");
  });
  it("resolves known places and falls back gracefully", () => {
    expect(resolveLoc("Queenstown")).toEqual([-45.0312, 168.6626]);
    expect(resolveLoc("Lake Wanaka")).toEqual([-44.7032, 169.1321]);
    expect(resolveLoc("Nowhereville")).toBeNull();
  });
});

describe("format", () => {
  it("formats a date range within one month", () => {
    expect(dateRangeLabel("2026-10-04", "2026-10-17")).toBe("4 – 17 Oct 2026");
  });
  it("formats a date range across months", () => {
    expect(dateRangeLabel("2026-09-28", "2026-10-03")).toBe("28 Sep – 3 Oct 2026");
  });
  it("counts inclusive days", () => {
    expect(totalDays("2026-10-04", "2026-10-17")).toBe(14);
  });
  it("renders relative time", () => {
    expect(timeAgo(null)).toBe("—");
    expect(timeAgo(Date.now())).toBe("just now");
  });
});

describe("derive", () => {
  it("computes a non-negative countdown", () => {
    expect(countdownDays("2026-10-04")).toBeGreaterThanOrEqual(0);
    expect(countdownDays(null)).toBe(0);
  });

  it("derives initials from the travellers field", () => {
    expect(initials("Shir & Tomer")).toEqual(["S", "T"]);
    expect(initials("Alex")).toEqual(["A", "A"]);
  });

  it("builds a deduped, ordered stop list from the seeded trip", async () => {
    const state = await seededState();
    const stops = computeStops(state);
    const names = stops.map((s) => s.name);
    // Te Anau is the location for two days (7 and 9) but appears once.
    expect(names.filter((n) => n === "Te Anau").length).toBe(1);
    // Every stop in the seed has coordinates.
    expect(stops.every((s) => s.coords)).toBe(true);
    // First stop is the first day's location.
    expect(stops[0].name).toBe("Christchurch");
  });

  it("totals the budget and splits per person / per day", async () => {
    const state = await seededState();
    const planned = budgetTotals(state, "planned");
    expect(planned.total).toBe(3400 + 2520 + 1650 + 1180 + 980 + 300);
    expect(planned.remain).toBe((state.trip.budget_cap ?? 0) - planned.total);
    expect(planned.perPerson).toBeCloseTo(planned.total / 2);
    expect(planned.perDay).toBeCloseTo(planned.total / 14);

    const actual = budgetTotals(state, "actual");
    expect(actual.total).toBe(3400 + 1980 + 1650 + 760 + 540 + 120);
  });
});
