import { useEffect, useState } from "react";
import type { Tab } from "../App";
import type { TripState } from "../types";
import { C, FREDOKA } from "../theme";
import { progress } from "../derive";
import { dateRangeLabel, timeAgo, totalDays } from "../format";

export function Header({
  state,
  setTab,
  refreshing,
  lastUpdated,
  onRefresh,
}: {
  state: TripState;
  tab: Tab;
  setTab: (t: Tab) => void;
  refreshing: boolean;
  lastUpdated: number | null;
  onRefresh: () => void;
}) {
  // Re-render every 5s so the "updated Xs ago" label stays fresh between polls.
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = window.setInterval(() => setTick((n) => n + 1), 5000);
    return () => window.clearInterval(iv);
  }, []);

  const { done, total, pct } = progress(state);
  const days = totalDays(state.trip.start_date, state.trip.end_date);
  const segCount = state.segments.filter((s) => s.id !== "__unsorted__").length;
  const chip = `${dateRangeLabel(state.trip.start_date, state.trip.end_date).replace(/ \d{4}$/, "")} · ${days} days · ${segCount} segments`;

  return (
    <header
      style={{
        height: 80,
        flexShrink: 0,
        borderBottom: `1px solid ${C.border}`,
        background: C.page,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 30px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h1 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 23, margin: 0, lineHeight: 1 }}>
          {state.trip.name}
        </h1>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: C.muted4,
            background: C.panel,
            border: `1px solid ${C.border}`,
            padding: "6px 12px",
            borderRadius: 20,
          }}
        >
          {chip}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: C.muted2, fontWeight: 600 }}>
            {done} of {total} planned
          </div>
          <div
            style={{
              width: 150,
              height: 7,
              borderRadius: 5,
              background: C.track,
              marginTop: 5,
              overflow: "hidden",
            }}
          >
            <div style={{ height: "100%", width: pct, background: C.greenMid, borderRadius: 5, transition: "width .4s" }} />
          </div>
        </div>

        <button
          onClick={() => setTab("itinerary")}
          className="btn-green"
          style={{
            border: "none",
            cursor: "pointer",
            background: C.green,
            color: C.page,
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: 13.5,
            padding: "11px 16px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Itinerary</span>
        </button>

        <button
          onClick={onRefresh}
          title="Refresh — the trip updates as you chat with Claude"
          className="ghost-btn"
          style={{
            border: `1px solid ${C.border}`,
            cursor: "pointer",
            background: C.panel,
            color: C.muted4,
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: 12.5,
            padding: "9px 13px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <svg
            className={refreshing ? "spin" : undefined}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          <span>{refreshing ? "Updating…" : `Updated ${timeAgo(lastUpdated)}`}</span>
        </button>
      </div>
    </header>
  );
}
