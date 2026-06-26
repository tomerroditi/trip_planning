// Shared data contract between the Worker (write path via MCP, read path via
// /api/trip) and the React app. The MCP tools return the same shapes the read
// API returns, so a single set of types serves both — see the spec, §7/§8.
//
// These are pure types with no runtime or environment dependencies, so they
// can be imported from both the Worker (workers-types) and the browser (DOM).

export type DriveKind = "DRIVE" | "FLY" | "";
export type StayStatus = "Booked" | "Pending" | "To book";
export type BookingType =
  | "flight"
  | "activity"
  | "restaurant"
  | "transport"
  | "other";
export type PlanItemType =
  | "drive"
  | "hike"
  | "sightseeing"
  | "meal"
  | "rest"
  | "other"
  | "";
export type DocumentKind = "Ticket" | "PDF" | "Link" | "Image" | "Doc";

export interface Trip {
  id: string;
  name: string;
  start_date: string | null; // ISO date
  end_date: string | null;
  travellers: string | null; // e.g. "Shir & Tomer"
  budget_cap: number | null; // total budget ceiling
  currency: string | null; // e.g. "NZD"
  created_at: string;
}

export interface Segment {
  id: string;
  trip_id: string;
  position: number;
  name: string;
  color: string; // marker / accent colour
  soft_color: string; // soft tint used for tag backgrounds
  day_range: string; // e.g. "Days 1–3"
  base: string; // e.g. "Christchurch · Tekapo · Aoraki"
  nights_label: string; // e.g. "3 days · 2 nights"
  summary: string;
}

export interface Day {
  id: string;
  trip_id: string;
  segment_id: string | null;
  date: string | null; // ISO date (groups items into a day)
  position: number; // order within the trip
  label: string; // e.g. "Day 2"
  date_short: string; // e.g. "Sun 5 Oct"
  title: string; // e.g. "Tekapo & the night sky"
  location_name: string | null; // map anchor for the day
  lat: number | null;
  lng: number | null;
  drive_kind: DriveKind;
  drive_label: string; // e.g. "Christchurch → Tekapo"
  drive_meta: string; // e.g. "2h 45m · 227 km"
  notes: string | null;
}

export interface PlanItem {
  id: string;
  trip_id: string;
  day_id: string | null;
  date: string | null; // ISO date (mirrors the parent day)
  position: number; // order within the day
  title: string;
  type: PlanItemType;
  tag: string; // short label shown as a chip, e.g. "Book", "Eat"
  done: boolean;
  lat: number | null;
  lng: number | null;
  start_time: string | null; // HH:MM
  end_time: string | null;
  notes: string | null;
  linked_booking_id: string | null;
  linked_accommodation_id: string | null;
}

export interface Accommodation {
  id: string;
  trip_id: string;
  segment_id: string | null;
  name: string;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  check_in: string | null; // ISO date
  check_out: string | null;
  dates_label: string | null; // human label, e.g. "8–9 Oct"
  nights: number | null;
  booking_ref: string | null; // confirmation code
  cost: number | null;
  currency: string | null;
  status: StayStatus;
  url: string | null;
  notes: string | null;
}

export interface Booking {
  id: string;
  trip_id: string;
  type: BookingType;
  title: string;
  date: string | null; // ISO date
  time: string | null; // HH:MM
  location_name: string | null;
  lat: number | null; // geo-located bookings appear on the map
  lng: number | null;
  confirmation: string | null;
  cost: number | null;
  currency: string | null;
  url: string | null;
  notes: string | null;
}

export interface BudgetCategory {
  id: string;
  trip_id: string;
  position: number;
  name: string;
  color: string;
  planned: number;
  actual: number;
}

export interface DocumentItem {
  id: string;
  trip_id: string;
  title: string;
  subtitle: string | null;
  kind: DocumentKind;
  category: string; // e.g. "Flights", "Stays", "Activities", "Info", "Admin"
  url: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  trip_id: string;
  date: string | null; // null = trip-level note
  text: string;
  created_at: string;
}

// A day with its ordered plan items inlined.
export interface DayWithItems extends Day {
  items: PlanItem[];
}

// A segment with its ordered days (each with items) inlined.
export interface SegmentWithDays extends Segment {
  days: DayWithItems[];
}

// The full trip state — the object `get_trip` and `GET /api/trip/:id` return.
export interface TripState {
  trip: Trip;
  segments: SegmentWithDays[];
  accommodations: Accommodation[];
  bookings: Booking[];
  budget_categories: BudgetCategory[];
  documents: DocumentItem[];
  notes: Note[];
}

// Convenience shape for GET /api/trip/:id/days.
export interface DayGroup {
  date: string | null;
  label: string;
  date_short: string;
  title: string;
  segment_id: string | null;
  items: PlanItem[];
}
