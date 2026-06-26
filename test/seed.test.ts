import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { makeDb } from "./helpers/d1";
import { buildSeedRows, SEED_TABLES, TRIP } from "../src/db/seed";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED = {
  segments: 5,
  days: 14,
  plan_items: 42,
  accommodations: 10,
  bookings: 4,
  budget_categories: 6,
  documents: 11,
  notes: 2,
};

describe("buildSeedRows", () => {
  const rows = buildSeedRows(TRIP.id);

  it("produces the expected row counts", () => {
    expect(rows.segments.length).toBe(EXPECTED.segments);
    expect(rows.days.length).toBe(EXPECTED.days);
    expect(rows.plan_items.length).toBe(EXPECTED.plan_items);
    expect(rows.accommodations.length).toBe(EXPECTED.accommodations);
    expect(rows.bookings.length).toBe(EXPECTED.bookings);
    expect(rows.budget_categories.length).toBe(EXPECTED.budget_categories);
    expect(rows.documents.length).toBe(EXPECTED.documents);
    expect(rows.notes.length).toBe(EXPECTED.notes);
  });

  it("numbers days 1..14 in order and dates them from the start date", () => {
    const positions = rows.days.map((d) => d.position);
    expect(positions).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    expect(rows.days[0].date).toBe("2026-10-04");
    expect(rows.days[13].date).toBe("2026-10-17");
  });

  it("keeps foreign keys consistent (days→segments, items→days)", () => {
    const segIds = new Set(rows.segments.map((s) => s.id));
    const dayIds = new Set(rows.days.map((d) => d.id));
    for (const d of rows.days) expect(segIds.has(d.segment_id as string)).toBe(true);
    for (const it of rows.plan_items) expect(dayIds.has(it.day_id as string)).toBe(true);
  });

  it("resolves coordinates for every day and accommodation", () => {
    for (const d of rows.days) {
      expect(typeof d.lat).toBe("number");
      expect(typeof d.lng).toBe("number");
    }
    for (const a of rows.accommodations) {
      expect(typeof a.lat).toBe("number");
      expect(typeof a.lng).toBe("number");
    }
  });

  it("pre-ticks six plan items", () => {
    const done = rows.plan_items.filter((i) => i.done === 1).length;
    expect(done).toBe(6);
  });

  it("covers every table in SEED_TABLES", () => {
    expect(SEED_TABLES).toContain("trip");
    expect(SEED_TABLES.length).toBe(9);
  });
});

describe("generated seed.sql", () => {
  it("loads into SQLite with the expected row counts", () => {
    const db = makeDb({ withSeedSql: true });
    const count = (t: string) => {
      const col = t === "trips" ? "id" : "trip_id";
      return (db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE ${col} = ?`).get(TRIP.id) as { n: number }).n;
    };
    expect(count("trips")).toBe(1);
    expect(count("segments")).toBe(EXPECTED.segments);
    expect(count("days")).toBe(EXPECTED.days);
    expect(count("plan_items")).toBe(EXPECTED.plan_items);
    expect(count("accommodations")).toBe(EXPECTED.accommodations);
    expect(count("bookings")).toBe(EXPECTED.bookings);
    expect(count("budget_categories")).toBe(EXPECTED.budget_categories);
    expect(count("documents")).toBe(EXPECTED.documents);
    expect(count("notes")).toBe(EXPECTED.notes);
  });

  it("is idempotent — re-running keeps a single copy of the trip", () => {
    const db = makeDb({ withSeedSql: true });
    db.exec(readFileSync(resolve(root, "seed/seed.sql"), "utf8"));
    const trips = (db.prepare("SELECT COUNT(*) AS n FROM trips").get() as { n: number }).n;
    const days = (db.prepare("SELECT COUNT(*) AS n FROM days").get() as { n: number }).n;
    expect(trips).toBe(1);
    expect(days).toBe(14);
  });
});
