// The single place that touches SQL. Both the MCP write tools (src/mcp) and the
// read API (src/api) call into here, so the data contract stays consistent
// across the write and read paths (spec §4).

import type {
  Accommodation,
  Booking,
  BudgetCategory,
  Day,
  DayGroup,
  DayWithItems,
  DocumentItem,
  Note,
  PlanItem,
  Segment,
  SegmentWithDays,
  Trip,
  TripState,
} from "../../shared/types";
import type { PlanItemRow } from "./schema";
import { newId } from "../lib/id";
import { buildSeedRows, SEED_TABLES, TRIP as SEED_TRIP } from "./seed";

// Allowed columns per table. Inserts/updates are restricted to these, so an
// unexpected key can never reach the SQL string.
const COLUMNS = {
  trips: ["id", "name", "start_date", "end_date", "travellers", "budget_cap", "currency", "created_at"],
  segments: ["id", "trip_id", "position", "name", "color", "soft_color", "day_range", "base", "nights_label", "summary"],
  days: ["id", "trip_id", "segment_id", "date", "position", "label", "date_short", "title", "location_name", "lat", "lng", "drive_kind", "drive_label", "drive_meta", "notes"],
  plan_items: ["id", "trip_id", "day_id", "date", "position", "title", "type", "tag", "done", "lat", "lng", "start_time", "end_time", "notes", "linked_booking_id", "linked_accommodation_id"],
  accommodations: ["id", "trip_id", "segment_id", "name", "location_name", "lat", "lng", "check_in", "check_out", "dates_label", "nights", "booking_ref", "cost", "currency", "status", "url", "notes"],
  bookings: ["id", "trip_id", "type", "title", "date", "time", "location_name", "lat", "lng", "confirmation", "cost", "currency", "url", "notes"],
  budget_categories: ["id", "trip_id", "position", "name", "color", "planned", "actual"],
  documents: ["id", "trip_id", "title", "subtitle", "kind", "category", "url", "created_at"],
  notes: ["id", "trip_id", "date", "text", "created_at"],
} as const;

type TableName = keyof typeof COLUMNS;
type Row = Record<string, unknown>;

function param(v: unknown): string | number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number" || typeof v === "string") return v;
  return String(v);
}

function insertStmt(DB: D1Database, table: TableName, row: Row): D1PreparedStatement {
  const cols = (COLUMNS[table] as readonly string[]).filter((c) => row[c] !== undefined);
  const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`;
  return DB.prepare(sql).bind(...cols.map((c) => param(row[c])));
}

function updateStmt(DB: D1Database, table: TableName, id: string, fields: Row): D1PreparedStatement | null {
  const cols = (COLUMNS[table] as readonly string[]).filter((c) => c !== "id" && fields[c] !== undefined);
  if (cols.length === 0) return null;
  const sql = `UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`;
  return DB.prepare(sql).bind(...cols.map((c) => param(fields[c])), id);
}

// ---------------------------------------------------------------------------
// Row → API type mappers
// ---------------------------------------------------------------------------

function toPlanItem(r: PlanItemRow): PlanItem {
  return {
    id: r.id,
    trip_id: r.trip_id,
    day_id: r.day_id,
    date: r.date,
    position: r.position,
    title: r.title,
    type: (r.type || "") as PlanItem["type"],
    tag: r.tag || "",
    done: r.done === 1,
    lat: r.lat,
    lng: r.lng,
    start_time: r.start_time,
    end_time: r.end_time,
    notes: r.notes,
    linked_booking_id: r.linked_booking_id,
    linked_accommodation_id: r.linked_accommodation_id,
  };
}

async function selectAll<T>(DB: D1Database, sql: string, ...binds: unknown[]): Promise<T[]> {
  const stmt = binds.length ? DB.prepare(sql).bind(...binds.map(param)) : DB.prepare(sql);
  const { results } = await stmt.all<T>();
  return results ?? [];
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getTrip(DB: D1Database, tripId: string): Promise<Trip | null> {
  const row = await DB.prepare("SELECT * FROM trips WHERE id = ?").bind(tripId).first<Trip>();
  return row ?? null;
}

export async function getTripState(DB: D1Database, tripId: string): Promise<TripState | null> {
  const trip = await getTrip(DB, tripId);
  if (!trip) return null;

  const [segments, days, itemRows, accommodations, bookings, budget_categories, documents, notes] =
    await Promise.all([
      selectAll<Segment>(DB, "SELECT * FROM segments WHERE trip_id = ? ORDER BY position, name", tripId),
      selectAll<Day>(DB, "SELECT * FROM days WHERE trip_id = ? ORDER BY position", tripId),
      selectAll<PlanItemRow>(DB, "SELECT * FROM plan_items WHERE trip_id = ? ORDER BY position, rowid", tripId),
      selectAll<Accommodation>(DB, "SELECT * FROM accommodations WHERE trip_id = ? ORDER BY rowid", tripId),
      selectAll<Booking>(DB, "SELECT * FROM bookings WHERE trip_id = ? ORDER BY date, rowid", tripId),
      selectAll<BudgetCategory>(DB, "SELECT * FROM budget_categories WHERE trip_id = ? ORDER BY position", tripId),
      selectAll<DocumentItem>(DB, "SELECT * FROM documents WHERE trip_id = ? ORDER BY created_at DESC, rowid", tripId),
      selectAll<Note>(DB, "SELECT * FROM notes WHERE trip_id = ? ORDER BY created_at DESC, rowid", tripId),
    ]);

  const items = itemRows.map(toPlanItem);
  const itemsByDay = new Map<string, PlanItem[]>();
  for (const it of items) {
    const key = it.day_id ?? "";
    const arr = itemsByDay.get(key) ?? [];
    arr.push(it);
    itemsByDay.set(key, arr);
  }

  const daysBySegment = new Map<string, DayWithItems[]>();
  for (const d of days) {
    const withItems: DayWithItems = { ...d, items: itemsByDay.get(d.id) ?? [] };
    const key = d.segment_id ?? "__none__";
    const arr = daysBySegment.get(key) ?? [];
    arr.push(withItems);
    daysBySegment.set(key, arr);
  }

  const segmentsWithDays: SegmentWithDays[] = segments.map((s) => ({
    ...s,
    days: daysBySegment.get(s.id) ?? [],
  }));

  // Days not attached to a segment still surface, grouped under a trailing
  // synthetic segment so no data is lost in the itinerary view.
  const orphanDays = daysBySegment.get("__none__");
  if (orphanDays && orphanDays.length) {
    segmentsWithDays.push({
      id: "__unsorted__",
      trip_id: tripId,
      position: segments.length,
      name: "More days",
      color: "#8A8F80",
      soft_color: "#EEE9DA",
      day_range: "",
      base: "",
      nights_label: "",
      summary: "Days not yet assigned to a segment.",
      days: orphanDays,
    });
  }

  return {
    trip,
    segments: segmentsWithDays,
    accommodations,
    bookings,
    budget_categories,
    documents,
    notes,
  };
}

export async function getDayGroups(DB: D1Database, tripId: string): Promise<DayGroup[]> {
  const days = await selectAll<Day>(DB, "SELECT * FROM days WHERE trip_id = ? ORDER BY position", tripId);
  const itemRows = await selectAll<PlanItemRow>(DB, "SELECT * FROM plan_items WHERE trip_id = ? ORDER BY position, rowid", tripId);
  const items = itemRows.map(toPlanItem);
  return days.map((d) => ({
    date: d.date,
    label: d.label,
    date_short: d.date_short,
    title: d.title,
    segment_id: d.segment_id,
    items: items.filter((i) => i.day_id === d.id),
  }));
}

// ---------------------------------------------------------------------------
// Seeding — runs once against an empty database so the app renders the NZ trip
// on first load without a manual seed step. seed/seed.sql does the same thing
// for the `wrangler d1 execute` path.
// ---------------------------------------------------------------------------

export async function tripExists(DB: D1Database, tripId: string): Promise<boolean> {
  const row = await DB.prepare("SELECT 1 AS x FROM trips WHERE id = ?").bind(tripId).first<{ x: number }>();
  return !!row;
}

export async function ensureSeed(DB: D1Database, tripId: string = SEED_TRIP.id): Promise<void> {
  if (tripId !== SEED_TRIP.id) return; // only the bundled trip is auto-seeded
  if (await tripExists(DB, tripId)) return;

  const rows = buildSeedRows(tripId);
  const stmts: D1PreparedStatement[] = [];
  for (const table of SEED_TABLES) {
    if (table === "trip") {
      stmts.push(insertStmt(DB, "trips", rows.trip));
    } else {
      for (const row of rows[table] as Row[]) {
        stmts.push(insertStmt(DB, table as TableName, row));
      }
    }
  }
  await DB.batch(stmts);
}

// ---------------------------------------------------------------------------
// Accommodations
// ---------------------------------------------------------------------------

export interface AccommodationInput {
  trip_id: string;
  name: string;
  location_name?: string;
  lat?: number;
  lng?: number;
  check_in?: string;
  check_out?: string;
  dates_label?: string;
  nights?: number;
  booking_ref?: string;
  cost?: number;
  currency?: string;
  status?: string;
  segment_id?: string;
  url?: string;
  notes?: string;
}

export async function addAccommodation(DB: D1Database, input: AccommodationInput): Promise<string> {
  const id = newId("acc");
  await insertStmt(DB, "accommodations", {
    id,
    status: "To book",
    currency: null,
    ...input,
  }).run();
  return id;
}

export async function updateAccommodation(DB: D1Database, id: string, fields: Row): Promise<void> {
  const stmt = updateStmt(DB, "accommodations", id, fields);
  if (stmt) await stmt.run();
}

export async function removeAccommodation(DB: D1Database, id: string): Promise<void> {
  await DB.prepare("DELETE FROM accommodations WHERE id = ?").bind(id).run();
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export interface BookingInput {
  trip_id: string;
  type: string;
  title: string;
  date?: string;
  time?: string;
  location_name?: string;
  lat?: number;
  lng?: number;
  confirmation?: string;
  cost?: number;
  currency?: string;
  url?: string;
  notes?: string;
}

export async function addBooking(DB: D1Database, input: BookingInput): Promise<string> {
  const id = newId("book");
  await insertStmt(DB, "bookings", { id, ...input }).run();
  return id;
}

export async function updateBooking(DB: D1Database, id: string, fields: Row): Promise<void> {
  const stmt = updateStmt(DB, "bookings", id, fields);
  if (stmt) await stmt.run();
}

export async function removeBooking(DB: D1Database, id: string): Promise<void> {
  await DB.prepare("DELETE FROM bookings WHERE id = ?").bind(id).run();
}

// ---------------------------------------------------------------------------
// Days + plan items
// ---------------------------------------------------------------------------

async function lastSegmentId(DB: D1Database, tripId: string): Promise<string | null> {
  const row = await DB.prepare(
    "SELECT id FROM segments WHERE trip_id = ? ORDER BY position DESC LIMIT 1",
  )
    .bind(tripId)
    .first<{ id: string }>();
  return row?.id ?? null;
}

async function nextPosition(DB: D1Database, table: TableName, where: string, ...binds: unknown[]): Promise<number> {
  const row = await DB.prepare(
    `SELECT COALESCE(MAX(position), -1) + 1 AS p FROM ${table} WHERE ${where}`,
  )
    .bind(...binds.map(param))
    .first<{ p: number }>();
  return row?.p ?? 0;
}

export interface DayInput {
  title?: string;
  label?: string;
  date_short?: string;
  location_name?: string;
  lat?: number;
  lng?: number;
  drive_kind?: string;
  drive_label?: string;
  drive_meta?: string;
  segment_id?: string;
  notes?: string;
}

// Find the day for a date, creating one if it doesn't exist yet.
export async function getOrCreateDay(
  DB: D1Database,
  tripId: string,
  date: string,
  extra: DayInput = {},
): Promise<string> {
  const existing = await DB.prepare("SELECT id FROM days WHERE trip_id = ? AND date = ? LIMIT 1")
    .bind(tripId, date)
    .first<{ id: string }>();
  if (existing) {
    if (Object.keys(extra).length) await updateStmt(DB, "days", existing.id, extra as Row)?.run();
    return existing.id;
  }
  const id = newId("day");
  const position = await nextPosition(DB, "days", "trip_id = ?", tripId);
  const segment_id = extra.segment_id ?? (await lastSegmentId(DB, tripId));
  await insertStmt(DB, "days", {
    id,
    trip_id: tripId,
    date,
    position,
    label: extra.label ?? `Day ${position + 1}`,
    date_short: extra.date_short ?? "",
    title: extra.title ?? "",
    location_name: extra.location_name ?? null,
    lat: extra.lat ?? null,
    lng: extra.lng ?? null,
    drive_kind: extra.drive_kind ?? "",
    drive_label: extra.drive_label ?? "",
    drive_meta: extra.drive_meta ?? "",
    segment_id,
    notes: extra.notes ?? null,
  }).run();
  return id;
}

// Upsert the day-level metadata for a date.
export async function setDay(DB: D1Database, tripId: string, date: string, fields: DayInput): Promise<string> {
  return getOrCreateDay(DB, tripId, date, fields);
}

export interface PlanItemInput {
  title: string;
  type?: string;
  tag?: string;
  done?: boolean;
  lat?: number;
  lng?: number;
  start_time?: string;
  end_time?: string;
  notes?: string;
  linked_booking_id?: string;
  linked_accommodation_id?: string;
}

function planItemRow(tripId: string, dayId: string, date: string, position: number, item: PlanItemInput): Row {
  return {
    id: newId("item"),
    trip_id: tripId,
    day_id: dayId,
    date,
    position,
    title: item.title,
    type: item.type ?? "",
    tag: item.tag ?? "",
    done: item.done ? 1 : 0,
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    start_time: item.start_time ?? null,
    end_time: item.end_time ?? null,
    notes: item.notes ?? null,
    linked_booking_id: item.linked_booking_id ?? null,
    linked_accommodation_id: item.linked_accommodation_id ?? null,
  };
}

// Replace the ordered plan_items for a single date (idempotent per day, spec §7).
export async function setDayPlan(
  DB: D1Database,
  tripId: string,
  date: string,
  items: PlanItemInput[],
  dayMeta: DayInput = {},
): Promise<void> {
  const dayId = await getOrCreateDay(DB, tripId, date, dayMeta);
  const stmts: D1PreparedStatement[] = [DB.prepare("DELETE FROM plan_items WHERE day_id = ?").bind(dayId)];
  items.forEach((item, i) => {
    stmts.push(insertStmt(DB, "plan_items", planItemRow(tripId, dayId, date, i, item)));
  });
  await DB.batch(stmts);
}

export async function addPlanItem(
  DB: D1Database,
  tripId: string,
  date: string,
  item: PlanItemInput,
  dayMeta: DayInput = {},
): Promise<string> {
  const dayId = await getOrCreateDay(DB, tripId, date, dayMeta);
  const position = await nextPosition(DB, "plan_items", "day_id = ?", dayId);
  const row = planItemRow(tripId, dayId, date, position, item);
  await insertStmt(DB, "plan_items", row).run();
  return row.id as string;
}

export async function updatePlanItem(DB: D1Database, id: string, fields: Row): Promise<void> {
  const patch: Row = { ...fields };
  if (typeof patch.done === "boolean") patch.done = patch.done ? 1 : 0;
  const stmt = updateStmt(DB, "plan_items", id, patch);
  if (stmt) await stmt.run();
}

export async function removePlanItem(DB: D1Database, id: string): Promise<void> {
  await DB.prepare("DELETE FROM plan_items WHERE id = ?").bind(id).run();
}

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

export interface SegmentInput {
  trip_id: string;
  name: string;
  color?: string;
  soft_color?: string;
  day_range?: string;
  base?: string;
  nights_label?: string;
  summary?: string;
}

export async function addSegment(DB: D1Database, input: SegmentInput): Promise<string> {
  const id = newId("seg");
  const position = await nextPosition(DB, "segments", "trip_id = ?", input.trip_id);
  await insertStmt(DB, "segments", {
    id,
    position,
    color: "#5C8A4E",
    soft_color: "#EAF0E2",
    day_range: "",
    base: "",
    nights_label: "",
    summary: "",
    ...input,
  }).run();
  return id;
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export interface BudgetInput {
  trip_id: string;
  name: string;
  color?: string;
  planned?: number;
  actual?: number;
}

// Upsert a budget category by name (case-insensitive), so re-stating a figure
// updates rather than duplicates.
export async function setBudgetCategory(DB: D1Database, input: BudgetInput): Promise<string> {
  const existing = await DB.prepare(
    "SELECT id FROM budget_categories WHERE trip_id = ? AND lower(name) = lower(?) LIMIT 1",
  )
    .bind(input.trip_id, input.name)
    .first<{ id: string }>();
  if (existing) {
    await updateStmt(DB, "budget_categories", existing.id, {
      color: input.color,
      planned: input.planned,
      actual: input.actual,
    })?.run();
    return existing.id;
  }
  const id = newId("cat");
  const position = await nextPosition(DB, "budget_categories", "trip_id = ?", input.trip_id);
  await insertStmt(DB, "budget_categories", {
    id,
    position,
    color: "#5C8A4E",
    planned: 0,
    actual: 0,
    ...input,
  }).run();
  return id;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface DocumentInput {
  trip_id: string;
  title: string;
  subtitle?: string;
  kind?: string;
  category?: string;
  url?: string;
}

export async function addDocument(DB: D1Database, input: DocumentInput): Promise<string> {
  const id = newId("doc");
  await insertStmt(DB, "documents", {
    id,
    kind: "Link",
    category: "Info",
    created_at: new Date().toISOString(),
    ...input,
  }).run();
  return id;
}

export async function removeDocument(DB: D1Database, id: string): Promise<void> {
  await DB.prepare("DELETE FROM documents WHERE id = ?").bind(id).run();
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export async function addNote(DB: D1Database, tripId: string, text: string, date?: string): Promise<string> {
  const id = newId("note");
  await insertStmt(DB, "notes", {
    id,
    trip_id: tripId,
    text,
    date: date ?? null,
    created_at: new Date().toISOString(),
  }).run();
  return id;
}

export async function removeNote(DB: D1Database, id: string): Promise<void> {
  await DB.prepare("DELETE FROM notes WHERE id = ?").bind(id).run();
}
