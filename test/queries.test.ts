import { beforeEach, describe, expect, it } from "vitest";
import { makeD1 } from "./helpers/d1";
import {
  addAccommodation,
  addBooking,
  addChecklistItem,
  addPlanItem,
  ensureSeed,
  getDayGroups,
  getTripState,
  removeAccommodation,
  removeChecklistItem,
  setBudgetCategory,
  setDayPlan,
  updateAccommodation,
  updateChecklistItem,
  updatePlanItem,
} from "../src/db/queries";
import { TRIP } from "../src/db/seed";

type DB = Parameters<typeof getTripState>[0];

function db(): DB {
  return makeD1() as unknown as DB;
}

describe("ensureSeed + getTripState", () => {
  let DB: DB;
  beforeEach(async () => {
    DB = db();
    await ensureSeed(DB, TRIP.id);
  });

  it("seeds an empty DB and nests segments → days → items", async () => {
    const state = await getTripState(DB, TRIP.id);
    expect(state).not.toBeNull();
    expect(state!.trip.name).toBe("Aotearoa Road Trip");
    expect(state!.segments.length).toBe(5);
    const totalDays = state!.segments.reduce((a, s) => a + s.days.length, 0);
    const totalItems = state!.segments.reduce((a, s) => a + s.days.reduce((b, d) => b + d.items.length, 0), 0);
    expect(totalDays).toBe(14);
    expect(totalItems).toBe(42);
    expect(state!.accommodations.length).toBe(10);
    expect(state!.budget_categories.length).toBe(6);
    expect(state!.documents.length).toBe(11);
  });

  it("orders items within a day by position", async () => {
    const state = await getTripState(DB, TRIP.id);
    const firstDay = state!.segments[0].days[0];
    const positions = firstDay.items.map((i) => i.position);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(firstDay.items[0].done).toBe(true); // first three of day 1 are pre-ticked
  });

  it("is idempotent — calling ensureSeed again does not duplicate", async () => {
    await ensureSeed(DB, TRIP.id);
    const state = await getTripState(DB, TRIP.id);
    expect(state!.segments.length).toBe(5);
    expect(state!.accommodations.length).toBe(10);
  });

  it("groups days for the /days convenience endpoint", async () => {
    const groups = await getDayGroups(DB, TRIP.id);
    expect(groups.length).toBe(14);
    expect(groups[0].items.length).toBe(3);
    expect(groups[0].date).toBe("2026-10-04");
  });
});

describe("mutations", () => {
  let DB: DB;
  beforeEach(async () => {
    DB = db();
    await ensureSeed(DB, TRIP.id);
  });

  it("add/update/remove accommodation round-trips", async () => {
    const id = await addAccommodation(DB, {
      trip_id: TRIP.id,
      name: "Lake House",
      location_name: "Queenstown",
      status: "To book",
      cost: 400,
      currency: "NZD",
    });
    let state = await getTripState(DB, TRIP.id);
    expect(state!.accommodations.find((a) => a.id === id)?.name).toBe("Lake House");

    await updateAccommodation(DB, id, { status: "Booked", booking_ref: "ABC-1" });
    state = await getTripState(DB, TRIP.id);
    const updated = state!.accommodations.find((a) => a.id === id);
    expect(updated?.status).toBe("Booked");
    expect(updated?.booking_ref).toBe("ABC-1");

    await removeAccommodation(DB, id);
    state = await getTripState(DB, TRIP.id);
    expect(state!.accommodations.find((a) => a.id === id)).toBeUndefined();
    expect(state!.accommodations.length).toBe(10);
  });

  it("set_day_plan replaces a day's items idempotently", async () => {
    const date = "2026-10-08"; // an existing day (Queenstown)
    await setDayPlan(DB, TRIP.id, date, [
      { title: "Gondola", tag: "Do" },
      { title: "Fergburger", tag: "Eat" },
    ]);
    let state = await getTripState(DB, TRIP.id);
    let day = state!.segments.flatMap((s) => s.days).find((d) => d.date === date)!;
    expect(day.items.map((i) => i.title)).toEqual(["Gondola", "Fergburger"]);

    // Re-send a corrected day → still exactly the new list, no duplication.
    await setDayPlan(DB, TRIP.id, date, [{ title: "Just relax", tag: "Rest" }]);
    state = await getTripState(DB, TRIP.id);
    day = state!.segments.flatMap((s) => s.days).find((d) => d.date === date)!;
    expect(day.items.map((i) => i.title)).toEqual(["Just relax"]);
  });

  it("add_plan_item appends, update_plan_item ticks it off", async () => {
    const date = "2026-10-05";
    const id = await addPlanItem(DB, TRIP.id, date, { title: "Hot pools", tag: "Do" });
    let state = await getTripState(DB, TRIP.id);
    let day = state!.segments.flatMap((s) => s.days).find((d) => d.date === date)!;
    expect(day.items[day.items.length - 1].title).toBe("Hot pools");
    expect(day.items[day.items.length - 1].done).toBe(false);

    await updatePlanItem(DB, id, { done: true });
    state = await getTripState(DB, TRIP.id);
    day = state!.segments.flatMap((s) => s.days).find((d) => d.date === date)!;
    expect(day.items.find((i) => i.id === id)?.done).toBe(true);
  });

  it("creates a brand-new day when planning an unused date", async () => {
    const date = "2026-10-18";
    await addPlanItem(DB, TRIP.id, date, { title: "Bonus day" });
    const state = await getTripState(DB, TRIP.id);
    const day = state!.segments.flatMap((s) => s.days).find((d) => d.date === date);
    expect(day).toBeTruthy();
    expect(day!.items[0].title).toBe("Bonus day");
  });

  it("set_budget_category updates an existing category by name", async () => {
    await setBudgetCategory(DB, { trip_id: TRIP.id, name: "Food & drink", actual: 999 });
    const state = await getTripState(DB, TRIP.id);
    const cat = state!.budget_categories.find((c) => c.name === "Food & drink");
    expect(cat?.actual).toBe(999);
    expect(state!.budget_categories.length).toBe(6); // updated, not added
  });

  it("add_booking stores a geo-located booking", async () => {
    const id = await addBooking(DB, {
      trip_id: TRIP.id,
      type: "activity",
      title: "Jet boat",
      lat: -44.847,
      lng: 168.3826,
      cost: 150,
    });
    const state = await getTripState(DB, TRIP.id);
    const b = state!.bookings.find((x) => x.id === id);
    expect(b?.title).toBe("Jet boat");
    expect(b?.lat).toBeCloseTo(-44.847);
  });

  it("add/update/remove checklist item round-trips", async () => {
    const state0 = await getTripState(DB, TRIP.id);
    expect(state0!.checklist).toEqual([]); // empty until items are added

    const id = await addChecklistItem(DB, { trip_id: TRIP.id, text: "Pack rain jacket", category: "Packing" });
    let state = await getTripState(DB, TRIP.id);
    const item = state!.checklist.find((c) => c.id === id);
    expect(item?.text).toBe("Pack rain jacket");
    expect(item?.category).toBe("Packing");
    expect(item?.done).toBe(false);

    await updateChecklistItem(DB, id, { done: true, date: "2026-10-04" });
    state = await getTripState(DB, TRIP.id);
    const done = state!.checklist.find((c) => c.id === id);
    expect(done?.done).toBe(true);
    expect(done?.date).toBe("2026-10-04");

    await removeChecklistItem(DB, id);
    state = await getTripState(DB, TRIP.id);
    expect(state!.checklist.find((c) => c.id === id)).toBeUndefined();
  });
});
