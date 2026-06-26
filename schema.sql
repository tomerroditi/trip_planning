-- GENERATED from migrations/0001_init.sql — do not edit by hand.
-- One-shot schema for `wrangler d1 execute trip-planner --file=schema.sql`.

--
-- Extends the spec's core model (trips, accommodations, bookings, plan_items,
-- notes) with the tables the Kiwiroute design needs: segments (the trip's
-- chapters), days (per-day metadata: title, drive leg, map anchor),
-- budget_categories, and documents. All write paths (MCP tools) and the read
-- API go through src/db/queries.ts, so this is the single source of the
-- data contract.

CREATE TABLE IF NOT EXISTS trips (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  start_date  TEXT,                    -- ISO date
  end_date    TEXT,
  travellers  TEXT,                    -- e.g. "Shir & Tomer"
  budget_cap  REAL,                    -- total budget ceiling
  currency    TEXT,                    -- e.g. "NZD"
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The trip's chapters. Days and accommodations belong to a segment.
CREATE TABLE IF NOT EXISTS segments (
  id           TEXT PRIMARY KEY,
  trip_id      TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL DEFAULT 0,
  name         TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#5C8A4E',
  soft_color   TEXT NOT NULL DEFAULT '#EAF0E2',
  day_range    TEXT NOT NULL DEFAULT '',
  base         TEXT NOT NULL DEFAULT '',
  nights_label TEXT NOT NULL DEFAULT '',
  summary      TEXT NOT NULL DEFAULT ''
);

-- One row per day of the trip. Holds the day-level metadata the itinerary
-- renders (title, the drive leg, the map anchor) and groups plan_items.
CREATE TABLE IF NOT EXISTS days (
  id            TEXT PRIMARY KEY,
  trip_id       TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  segment_id    TEXT REFERENCES segments(id) ON DELETE SET NULL,
  date          TEXT,                  -- ISO date (groups items into a day)
  position      INTEGER NOT NULL DEFAULT 0,
  label         TEXT NOT NULL DEFAULT '',   -- e.g. "Day 2"
  date_short    TEXT NOT NULL DEFAULT '',   -- e.g. "Sun 5 Oct"
  title         TEXT NOT NULL DEFAULT '',
  location_name TEXT,                  -- map anchor for the day
  lat           REAL,
  lng           REAL,
  drive_kind    TEXT NOT NULL DEFAULT '',   -- DRIVE | FLY | ''
  drive_label   TEXT NOT NULL DEFAULT '',   -- e.g. "Christchurch → Tekapo"
  drive_meta    TEXT NOT NULL DEFAULT '',   -- e.g. "2h 45m · 227 km"
  notes         TEXT
);

-- Ordered stops/activities within a single day.
CREATE TABLE IF NOT EXISTS plan_items (
  id                      TEXT PRIMARY KEY,
  trip_id                 TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_id                  TEXT REFERENCES days(id) ON DELETE CASCADE,
  date                    TEXT,        -- ISO date (mirrors the parent day)
  position                INTEGER NOT NULL DEFAULT 0,
  title                   TEXT NOT NULL,
  type                    TEXT NOT NULL DEFAULT '',  -- drive|hike|sightseeing|meal|rest|other
  tag                     TEXT NOT NULL DEFAULT '',  -- short chip, e.g. "Book"
  done                    INTEGER NOT NULL DEFAULT 0, -- 0 | 1
  lat                     REAL,
  lng                     REAL,
  start_time              TEXT,
  end_time                TEXT,
  notes                   TEXT,
  linked_booking_id       TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  linked_accommodation_id TEXT REFERENCES accommodations(id) ON DELETE SET NULL
);

-- Where you're staying. Geo-located for the map.
CREATE TABLE IF NOT EXISTS accommodations (
  id            TEXT PRIMARY KEY,
  trip_id       TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  segment_id    TEXT REFERENCES segments(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  location_name TEXT,
  lat           REAL,
  lng           REAL,
  check_in      TEXT,                  -- ISO date
  check_out     TEXT,
  dates_label   TEXT,                  -- human label, e.g. "8–9 Oct"
  nights        INTEGER,
  booking_ref   TEXT,                  -- confirmation code
  cost          REAL,
  currency      TEXT,
  status        TEXT NOT NULL DEFAULT 'To book', -- Booked | Pending | To book
  url           TEXT,
  notes         TEXT
);

-- Flights, activities, restaurants, transport, etc.
CREATE TABLE IF NOT EXISTS bookings (
  id            TEXT PRIMARY KEY,
  trip_id       TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,         -- flight | activity | restaurant | transport | other
  title         TEXT NOT NULL,
  date          TEXT,                  -- ISO date
  time          TEXT,                  -- HH:MM, optional
  location_name TEXT,
  lat           REAL,                  -- geo-located bookings appear on the map
  lng           REAL,
  confirmation  TEXT,
  cost          REAL,
  currency      TEXT,
  url           TEXT,
  notes         TEXT
);

-- Budget broken down by category, with planned vs actual amounts.
CREATE TABLE IF NOT EXISTS budget_categories (
  id        TEXT PRIMARY KEY,
  trip_id   TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL DEFAULT 0,
  name      TEXT NOT NULL,
  color     TEXT NOT NULL DEFAULT '#5C8A4E',
  planned   REAL NOT NULL DEFAULT 0,
  actual    REAL NOT NULL DEFAULT 0
);

-- Tickets, confirmations and reference links.
CREATE TABLE IF NOT EXISTS documents (
  id         TEXT PRIMARY KEY,
  trip_id    TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  subtitle   TEXT,
  kind       TEXT NOT NULL DEFAULT 'Link', -- Ticket | PDF | Link | Image | Doc
  category   TEXT NOT NULL DEFAULT 'Info',
  url        TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  trip_id    TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date       TEXT,                     -- optional; null = trip-level note
  text       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_seg_trip   ON segments(trip_id, position);
CREATE INDEX IF NOT EXISTS idx_day_trip   ON days(trip_id, position);
CREATE INDEX IF NOT EXISTS idx_day_seg    ON days(segment_id);
CREATE INDEX IF NOT EXISTS idx_plan_day   ON plan_items(day_id, position);
CREATE INDEX IF NOT EXISTS idx_plan_trip  ON plan_items(trip_id, date, position);
CREATE INDEX IF NOT EXISTS idx_acc_trip   ON accommodations(trip_id);
CREATE INDEX IF NOT EXISTS idx_book_trip  ON bookings(trip_id, date);
CREATE INDEX IF NOT EXISTS idx_cat_trip   ON budget_categories(trip_id, position);
CREATE INDEX IF NOT EXISTS idx_doc_trip   ON documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_notes_trip ON notes(trip_id);
