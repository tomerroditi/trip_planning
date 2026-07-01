// Typed row interfaces — the exact shape D1 returns for each table. These map
// 1:1 to the columns in migrations/0001_init.sql. Booleans are stored as 0/1
// integers in SQLite; queries.ts converts rows into the richer API types from
// shared/types.ts (e.g. done: 0|1 → boolean). Keeping the raw row types here
// keeps the SQL ↔ TypeScript contract explicit.

export interface TripRow {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  travellers: string | null;
  budget_cap: number | null;
  currency: string | null;
  created_at: string;
}

export interface SegmentRow {
  id: string;
  trip_id: string;
  position: number;
  name: string;
  color: string;
  soft_color: string;
  day_range: string;
  base: string;
  nights_label: string;
  summary: string;
}

export interface DayRow {
  id: string;
  trip_id: string;
  segment_id: string | null;
  date: string | null;
  position: number;
  label: string;
  date_short: string;
  title: string;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  drive_kind: string;
  drive_label: string;
  drive_meta: string;
  notes: string | null;
}

export interface PlanItemRow {
  id: string;
  trip_id: string;
  day_id: string | null;
  date: string | null;
  position: number;
  title: string;
  type: string;
  tag: string;
  done: number; // 0 | 1
  lat: number | null;
  lng: number | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  linked_booking_id: string | null;
  linked_accommodation_id: string | null;
}

export interface AccommodationRow {
  id: string;
  trip_id: string;
  segment_id: string | null;
  name: string;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  check_in: string | null;
  check_out: string | null;
  dates_label: string | null;
  nights: number | null;
  booking_ref: string | null;
  cost: number | null;
  currency: string | null;
  status: string;
  url: string | null;
  notes: string | null;
}

export interface BookingRow {
  id: string;
  trip_id: string;
  type: string;
  title: string;
  date: string | null;
  time: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  confirmation: string | null;
  cost: number | null;
  currency: string | null;
  url: string | null;
  notes: string | null;
}

export interface BudgetCategoryRow {
  id: string;
  trip_id: string;
  position: number;
  name: string;
  color: string;
  planned: number;
  actual: number;
}

export interface DocumentRow {
  id: string;
  trip_id: string;
  title: string;
  subtitle: string | null;
  kind: string;
  category: string;
  url: string | null;
  created_at: string;
}

export interface NoteRow {
  id: string;
  trip_id: string;
  date: string | null;
  text: string;
  created_at: string;
}

export interface ChecklistRow {
  id: string;
  trip_id: string;
  position: number;
  text: string;
  category: string;
  done: number; // 0 | 1
  date: string | null;
  created_at: string;
}
