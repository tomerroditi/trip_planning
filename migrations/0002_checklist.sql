-- Trip Planner — D1 schema (migration 0002): checklist / packing items.
--
-- A simple per-trip checklist (packing, pre-trip todos, "to book"). Items can
-- optionally be pinned to a date so they surface in the Today view. Managed
-- from the app (write API) and by Claude (MCP tools); rendered in the app's
-- Checklist tab and the Today view.

CREATE TABLE IF NOT EXISTS checklist_items (
  id         TEXT PRIMARY KEY,
  trip_id    TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  position   INTEGER NOT NULL DEFAULT 0,
  text       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Packing', -- Packing | To book | Documents | Health | Tech | Other
  done       INTEGER NOT NULL DEFAULT 0,       -- 0 | 1
  date       TEXT,                             -- optional ISO date to pin to a day
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_check_trip ON checklist_items(trip_id, position);
