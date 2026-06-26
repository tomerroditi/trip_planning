// MCP tool surface (spec §7). Each tool generates/returns ids (Claude never
// invents them), prefers update over duplicate, lets coordinates flow through,
// and returns the updated trip state so Claude stays grounded after a write.
//
// All tools call into db/queries.ts. The same TripState they return is what
// GET /api/trip/:id returns, so one set of types serves both paths.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as q from "../db/queries";

export interface ToolContext {
  db: () => D1Database;
  defaultTripId: () => string;
}

type TextResult = { content: { type: "text"; text: string }[] };

function ok(payload: unknown): TextResult {
  return { content: [{ type: "text", text: JSON.stringify(payload) }] };
}

function fail(message: string): TextResult {
  return { content: [{ type: "text", text: JSON.stringify({ ok: false, error: message }) }] };
}

const planItemShape = z.object({
  title: z.string(),
  type: z.string().optional(),
  tag: z.string().optional(),
  done: z.boolean().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  notes: z.string().optional(),
  linked_booking_id: z.string().optional(),
  linked_accommodation_id: z.string().optional(),
});

export function registerTools(server: McpServer, ctx: ToolContext): void {
  const DB = () => ctx.db();
  const tid = (trip_id?: string) => trip_id || ctx.defaultTripId();

  // Return the affected entity alongside the freshly-read full trip state.
  async function withState(trip_id: string, extra: Record<string, unknown> = {}): Promise<TextResult> {
    await q.ensureSeed(DB(), trip_id);
    const state = await q.getTripState(DB(), trip_id);
    if (!state) return fail(`Trip '${trip_id}' not found.`);
    return ok({ ok: true, ...extra, state });
  }

  // ----- read -----------------------------------------------------------
  server.tool(
    "get_trip",
    "Load the full trip: metadata, segments, day-by-day plan, accommodations, bookings, budget, documents and notes. Call this first to load context before making changes. trip_id is optional — omit it to use the default trip.",
    { trip_id: z.string().optional() },
    async ({ trip_id }) => {
      const id = tid(trip_id);
      await q.ensureSeed(DB(), id);
      const state = await q.getTripState(DB(), id);
      return state ? ok(state) : fail(`Trip '${id}' not found.`);
    },
  );

  // ----- accommodations -------------------------------------------------
  server.tool(
    "add_accommodation",
    "Add a place you're staying. Pass lat/lng so it appears on the map; if unknown, leave them out and it lists without a pin. status is one of Booked, Pending, To book.",
    {
      trip_id: z.string().optional(),
      name: z.string(),
      location_name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      check_in: z.string().optional(),
      check_out: z.string().optional(),
      dates_label: z.string().optional(),
      nights: z.number().optional(),
      booking_ref: z.string().optional(),
      cost: z.number().optional(),
      currency: z.string().optional(),
      status: z.enum(["Booked", "Pending", "To book"]).optional(),
      segment_id: z.string().optional(),
      url: z.string().optional(),
      notes: z.string().optional(),
    },
    async (args) => {
      const id = tid(args.trip_id);
      const accId = await q.addAccommodation(DB(), { ...args, trip_id: id });
      return withState(id, { accommodation_id: accId });
    },
  );

  server.tool(
    "update_accommodation",
    "Update fields on an existing accommodation (e.g. change check-in, mark as Booked, add a confirmation). Use this for corrections rather than adding a second stay.",
    {
      id: z.string(),
      trip_id: z.string().optional(),
      name: z.string().optional(),
      location_name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      check_in: z.string().optional(),
      check_out: z.string().optional(),
      dates_label: z.string().optional(),
      nights: z.number().optional(),
      booking_ref: z.string().optional(),
      cost: z.number().optional(),
      currency: z.string().optional(),
      status: z.enum(["Booked", "Pending", "To book"]).optional(),
      url: z.string().optional(),
      notes: z.string().optional(),
    },
    async ({ id, trip_id, ...fields }) => {
      await q.updateAccommodation(DB(), id, fields);
      return withState(tid(trip_id), { accommodation_id: id });
    },
  );

  server.tool(
    "remove_accommodation",
    "Delete an accommodation by id.",
    { id: z.string(), trip_id: z.string().optional() },
    async ({ id, trip_id }) => {
      await q.removeAccommodation(DB(), id);
      return withState(tid(trip_id), { removed: id });
    },
  );

  // ----- bookings -------------------------------------------------------
  server.tool(
    "add_booking",
    "Add a flight, activity, restaurant, transport or other booking. Pass lat/lng for geo-located bookings (they appear on the map). type is one of flight, activity, restaurant, transport, other.",
    {
      trip_id: z.string().optional(),
      type: z.enum(["flight", "activity", "restaurant", "transport", "other"]),
      title: z.string(),
      date: z.string().optional(),
      time: z.string().optional(),
      location_name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      confirmation: z.string().optional(),
      cost: z.number().optional(),
      currency: z.string().optional(),
      url: z.string().optional(),
      notes: z.string().optional(),
    },
    async (args) => {
      const id = tid(args.trip_id);
      const bookingId = await q.addBooking(DB(), { ...args, trip_id: id });
      return withState(id, { booking_id: bookingId });
    },
  );

  server.tool(
    "update_booking",
    "Update fields on an existing booking (e.g. add a confirmation code, change the time).",
    {
      id: z.string(),
      trip_id: z.string().optional(),
      type: z.enum(["flight", "activity", "restaurant", "transport", "other"]).optional(),
      title: z.string().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
      location_name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      confirmation: z.string().optional(),
      cost: z.number().optional(),
      currency: z.string().optional(),
      url: z.string().optional(),
      notes: z.string().optional(),
    },
    async ({ id, trip_id, ...fields }) => {
      await q.updateBooking(DB(), id, fields);
      return withState(tid(trip_id), { booking_id: id });
    },
  );

  server.tool(
    "remove_booking",
    "Delete a booking by id.",
    { id: z.string(), trip_id: z.string().optional() },
    async ({ id, trip_id }) => {
      await q.removeBooking(DB(), id);
      return withState(tid(trip_id), { removed: id });
    },
  );

  // ----- days + plan items ---------------------------------------------
  server.tool(
    "set_day_plan",
    "Replace the ordered plan for a single day (by ISO date) with the provided list of items. Idempotent per day — safe to re-send a corrected day. Optionally set day-level metadata (title, location_name + lat/lng for the map, the drive leg).",
    {
      trip_id: z.string().optional(),
      date: z.string().describe("ISO date, e.g. 2026-10-08"),
      items: z.array(planItemShape),
      title: z.string().optional(),
      location_name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      date_short: z.string().optional(),
      label: z.string().optional(),
      drive_kind: z.enum(["DRIVE", "FLY", ""]).optional(),
      drive_label: z.string().optional(),
      drive_meta: z.string().optional(),
      segment_id: z.string().optional(),
    },
    async ({ trip_id, date, items, ...dayMeta }) => {
      const id = tid(trip_id);
      await q.setDayPlan(DB(), id, date, items, dayMeta);
      return withState(id, { date });
    },
  );

  server.tool(
    "set_day",
    "Set or update the day-level metadata for an ISO date without touching its plan items: title, the map anchor (location_name + lat/lng), and the drive leg (drive_kind DRIVE|FLY, drive_label, drive_meta). Creates the day if it doesn't exist.",
    {
      trip_id: z.string().optional(),
      date: z.string(),
      title: z.string().optional(),
      label: z.string().optional(),
      date_short: z.string().optional(),
      location_name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      drive_kind: z.enum(["DRIVE", "FLY", ""]).optional(),
      drive_label: z.string().optional(),
      drive_meta: z.string().optional(),
      segment_id: z.string().optional(),
      notes: z.string().optional(),
    },
    async ({ trip_id, date, ...fields }) => {
      const id = tid(trip_id);
      const dayId = await q.setDay(DB(), id, date, fields);
      return withState(id, { day_id: dayId, date });
    },
  );

  server.tool(
    "add_plan_item",
    "Append one activity/stop to a day (by ISO date). Pass lat/lng to place it on the map. Creates the day if needed.",
    {
      trip_id: z.string().optional(),
      date: z.string(),
      title: z.string(),
      type: z.string().optional(),
      tag: z.string().optional(),
      done: z.boolean().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      notes: z.string().optional(),
      linked_booking_id: z.string().optional(),
      linked_accommodation_id: z.string().optional(),
    },
    async ({ trip_id, date, ...item }) => {
      const id = tid(trip_id);
      const itemId = await q.addPlanItem(DB(), id, date, item);
      return withState(id, { plan_item_id: itemId, date });
    },
  );

  server.tool(
    "update_plan_item",
    "Update fields on a plan item by id — including done (tick it off), title, tag, times, notes or coordinates.",
    {
      id: z.string(),
      trip_id: z.string().optional(),
      title: z.string().optional(),
      type: z.string().optional(),
      tag: z.string().optional(),
      done: z.boolean().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      notes: z.string().optional(),
      linked_booking_id: z.string().optional(),
      linked_accommodation_id: z.string().optional(),
    },
    async ({ id, trip_id, ...fields }) => {
      await q.updatePlanItem(DB(), id, fields);
      return withState(tid(trip_id), { plan_item_id: id });
    },
  );

  server.tool(
    "remove_plan_item",
    "Delete a plan item by id.",
    { id: z.string(), trip_id: z.string().optional() },
    async ({ id, trip_id }) => {
      await q.removePlanItem(DB(), id);
      return withState(tid(trip_id), { removed: id });
    },
  );

  // ----- segments -------------------------------------------------------
  server.tool(
    "add_segment",
    "Add a new chapter/segment to the trip (e.g. a region). color is a hex used for its map markers and accents.",
    {
      trip_id: z.string().optional(),
      name: z.string(),
      color: z.string().optional(),
      soft_color: z.string().optional(),
      day_range: z.string().optional(),
      base: z.string().optional(),
      nights_label: z.string().optional(),
      summary: z.string().optional(),
    },
    async (args) => {
      const id = tid(args.trip_id);
      const segId = await q.addSegment(DB(), { ...args, trip_id: id });
      return withState(id, { segment_id: segId });
    },
  );

  // ----- budget ---------------------------------------------------------
  server.tool(
    "set_budget_category",
    "Set a budget category's planned and/or actual amount (in the trip currency). Matches an existing category by name, otherwise creates it.",
    {
      trip_id: z.string().optional(),
      name: z.string(),
      planned: z.number().optional(),
      actual: z.number().optional(),
      color: z.string().optional(),
    },
    async (args) => {
      const id = tid(args.trip_id);
      const catId = await q.setBudgetCategory(DB(), { ...args, trip_id: id });
      return withState(id, { budget_category_id: catId });
    },
  );

  // ----- documents ------------------------------------------------------
  server.tool(
    "add_document",
    "Save a document or reference link to the trip vault. kind is one of Ticket, PDF, Link, Image, Doc. category groups it (e.g. Flights, Stays, Activities, Info, Admin).",
    {
      trip_id: z.string().optional(),
      title: z.string(),
      url: z.string().optional(),
      subtitle: z.string().optional(),
      kind: z.enum(["Ticket", "PDF", "Link", "Image", "Doc"]).optional(),
      category: z.string().optional(),
    },
    async (args) => {
      const id = tid(args.trip_id);
      const docId = await q.addDocument(DB(), { ...args, trip_id: id });
      return withState(id, { document_id: docId });
    },
  );

  server.tool(
    "remove_document",
    "Delete a document by id.",
    { id: z.string(), trip_id: z.string().optional() },
    async ({ id, trip_id }) => {
      await q.removeDocument(DB(), id);
      return withState(tid(trip_id), { removed: id });
    },
  );

  // ----- notes ----------------------------------------------------------
  server.tool(
    "add_note",
    "Add a note to the trip. Pass an ISO date to attach it to a day, or omit it for a trip-level note.",
    {
      trip_id: z.string().optional(),
      text: z.string(),
      date: z.string().optional(),
    },
    async ({ trip_id, text, date }) => {
      const id = tid(trip_id);
      const noteId = await q.addNote(DB(), id, text, date);
      return withState(id, { note_id: noteId });
    },
  );

  server.tool(
    "remove_note",
    "Delete a note by id.",
    { id: z.string(), trip_id: z.string().optional() },
    async ({ id, trip_id }) => {
      await q.removeNote(DB(), id);
      return withState(tid(trip_id), { removed: id });
    },
  );
}
