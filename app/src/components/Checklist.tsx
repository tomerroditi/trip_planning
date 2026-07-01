// Checklist / packing tab. Add, tick and delete items grouped by category.
// Managed in-app via the write API (and by Claude via MCP). Optimistic.

import { useState } from "react";
import type { ChecklistItem, TripState } from "../types";
import type { UseTrip } from "../useTrip";
import { write } from "../api";
import { C, FREDOKA } from "../theme";

const CATEGORIES = ["Packing", "To book", "Documents", "Health", "Tech", "Other"] as const;

const CAT_COLOR: Record<string, string> = {
  Packing: "#5C8A4E",
  "To book": "#B0503A",
  Documents: "#4E7E97",
  Health: "#A9791C",
  Tech: "#7D93A8",
  Other: "#8A8F80",
};

// Sensible starter items so an empty checklist isn't a dead end.
const DEFAULTS: { text: string; category: string }[] = [
  { text: "Passport & travel insurance", category: "Documents" },
  { text: "Driver's licence (for the campervan)", category: "Documents" },
  { text: "Book remaining accommodation", category: "To book" },
  { text: "Travel adapter & chargers", category: "Tech" },
  { text: "Rain jacket & warm layers", category: "Packing" },
  { text: "Hiking shoes", category: "Packing" },
  { text: "Reusable water bottle", category: "Packing" },
  { text: "Any prescriptions & first-aid kit", category: "Health" },
];

export function Checklist({ state, trip }: { state: TripState; trip: UseTrip }) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState<string>("Packing");
  const [busy, setBusy] = useState(false);

  const items = state.checklist;
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const add = async (t: string, category: string) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await trip.apply(
        (s) => s, // server returns the row with its id; no reliable optimistic id
        () => write.addChecklist(trip.tripId, { text: trimmed, category }),
      );
    } finally {
      setBusy(false);
    }
  };

  const toggle = (item: ChecklistItem) =>
    trip.apply(
      (s) => ({ ...s, checklist: s.checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)) }),
      () => write.patchChecklist(trip.tripId, item.id, { done: !item.done }),
    );

  const remove = (id: string) =>
    trip.apply(
      (s) => ({ ...s, checklist: s.checklist.filter((c) => c.id !== id) }),
      () => write.removeChecklist(trip.tripId, id),
    );

  const seedDefaults = async () => {
    setBusy(true);
    try {
      // Sequential so positions stay ordered and we don't hammer the Worker.
      for (const d of DEFAULTS) await write.addChecklist(trip.tripId, d);
      trip.refresh();
    } finally {
      setBusy(false);
    }
  };

  const byCat = CATEGORIES.map((c) => ({ cat: c, list: items.filter((i) => (i.category || "Other") === c) })).filter(
    (g) => g.list.length,
  );
  const otherCats = items.filter((i) => !CATEGORIES.includes((i.category as (typeof CATEGORIES)[number]) ?? "Other"));

  return (
    <div className="fade-up page-scroll">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 24, margin: 0 }}>Checklist</h2>
          <p style={{ fontSize: 13.5, color: C.muted, margin: "6px 0 0" }}>
            {items.length ? `${done} of ${items.length} done` : "Packing & pre-trip to-dos"}
          </p>
        </div>
        {items.length > 0 && (
          <div style={{ minWidth: 160 }}>
            <div style={{ height: 9, borderRadius: 6, background: C.track, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: C.greenMid, borderRadius: 6, transition: "width .4s" }} />
            </div>
            <div style={{ fontSize: 12, color: C.muted2, marginTop: 5, textAlign: "right", fontWeight: 600 }}>{pct}%</div>
          </div>
        )}
      </div>

      {/* Add row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void add(text, cat).then(() => setText(""));
        }}
        style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an item…"
          style={{
            flex: 1,
            minWidth: 180,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "11px 14px",
            fontFamily: "inherit",
            fontSize: 14,
            background: "#fff",
            color: C.ink,
          }}
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 12px", fontFamily: "inherit", fontSize: 14, background: "#fff", color: C.muted5, fontWeight: 600 }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="btn-green"
          style={{
            border: "none",
            cursor: busy || !text.trim() ? "default" : "pointer",
            background: text.trim() ? C.green : "#B9C2B2",
            color: C.page,
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: 14,
            padding: "11px 18px",
            borderRadius: 12,
          }}
        >
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <div style={{ marginTop: 26, background: C.panel, border: `1px dashed ${C.border}`, borderRadius: 18, padding: "26px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Nothing on the list yet</div>
          <div style={{ fontSize: 13.5, color: C.muted, margin: "6px 0 16px" }}>Add items above, or start from a sensible packing template.</div>
          <button
            onClick={seedDefaults}
            disabled={busy}
            style={{ border: `1px solid ${C.green}`, background: "#fff", color: C.green, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "11px 18px", borderRadius: 12 }}
          >
            {busy ? "Adding…" : "Add starter checklist"}
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          {byCat.map((g) => (
            <Group key={g.cat} title={g.cat} color={CAT_COLOR[g.cat]} list={g.list} onToggle={toggle} onRemove={remove} />
          ))}
          {otherCats.length > 0 && (
            <Group title="Other" color={CAT_COLOR.Other} list={otherCats} onToggle={toggle} onRemove={remove} />
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  color,
  list,
  onToggle,
  onRemove,
}: {
  title: string;
  color: string;
  list: ChecklistItem[];
  onToggle: (i: ChecklistItem) => void;
  onRemove: (id: string) => void;
}) {
  const done = list.filter((i) => i.done).length;
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderBottom: `1px solid ${C.borderSoft}` }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
        <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 15.5 }}>{title}</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted3, fontWeight: 600 }}>
          {done}/{list.length}
        </span>
      </div>
      <div style={{ padding: "4px 10px 8px" }}>
        {list.map((item) => (
          <div key={item.id} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 10 }}>
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => onToggle(item)}
              style={{ width: 19, height: 19, accentColor: color, cursor: "pointer", flexShrink: 0 }}
            />
            <span style={{ flex: 1, fontSize: 14.5, color: item.done ? "#AAB0A2" : C.ink2, textDecoration: item.done ? "line-through" : "none" }}>
              {item.text}
            </span>
            {item.date && (
              <span style={{ fontSize: 11, color: "#B0503A", fontWeight: 600, whiteSpace: "nowrap" }}>📌 {item.date.slice(5)}</span>
            )}
            <button
              onClick={() => onRemove(item.id)}
              aria-label="Delete item"
              className="link-btn"
              style={{ border: "none", background: "transparent", cursor: "pointer", color: C.muted3, fontSize: 17, lineHeight: 1, padding: "2px 6px", borderRadius: 8, flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
