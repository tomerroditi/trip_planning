import type { CSSProperties, ReactNode } from "react";
import type { Tab } from "../App";
import type { TripState } from "../types";
import { C, FREDOKA } from "../theme";
import { countdownDays, initials } from "../derive";
import { dateRangeLabel } from "../format";

const ICONS: Record<Tab, ReactNode> = {
  overview: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  ),
  itinerary: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
    </svg>
  ),
  map: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  ),
  budget: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="12" r="5.5" />
      <path d="M14 7.2a5.5 5.5 0 0 1 0 9.6" />
    </svg>
  ),
  stays: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
      <line x1="3" y1="18" x2="3" y2="21" />
      <line x1="21" y1="18" x2="21" y2="21" />
      <path d="M7 11V8.5A1.5 1.5 0 0 1 8.5 7h7A1.5 1.5 0 0 1 17 8.5V11" />
    </svg>
  ),
  docs: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 3v5h5" />
      <path d="M6 3h8l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="16.5" x2="13" y2="16.5" />
    </svg>
  ),
};

const NAV: { tab: Tab; label: string }[] = [
  { tab: "overview", label: "Overview" },
  { tab: "itinerary", label: "Itinerary" },
  { tab: "map", label: "Map & route" },
  { tab: "budget", label: "Budget" },
  { tab: "stays", label: "Stays" },
  { tab: "docs", label: "Docs & links" },
];

export function Sidebar({
  state,
  tab,
  setTab,
}: {
  state: TripState;
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const countdown = countdownDays(state.trip.start_date);
  const [init1, init2] = initials(state.trip.travellers);
  const range = dateRangeLabel(state.trip.start_date, state.trip.end_date);

  return (
    <aside
      style={{
        width: 250,
        flexShrink: 0,
        background: C.panel,
        borderRight: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "22px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px 24px" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: C.green,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.page,
            fontFamily: FREDOKA,
            fontWeight: 600,
            fontSize: 20,
          }}
        >
          k
        </div>
        <div>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 18, lineHeight: 1 }}>Kiwiroute</div>
          <div style={{ fontSize: 10.5, color: C.muted3, letterSpacing: ".12em", marginTop: 4 }}>
            TRIP PLANNER
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map(({ tab: t, label }) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="nav-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                width: "100%",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "11px 13px",
                borderRadius: 13,
                fontFamily: "inherit",
                fontSize: 14.5,
                fontWeight: 600,
                background: active ? C.green : "transparent",
                color: active ? C.page : C.muted5,
              }}
            >
              {ICONS[t]}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "auto",
          background: C.green,
          borderRadius: 17,
          padding: "16px 17px",
          color: C.page,
        }}
      >
        <div style={{ fontSize: 10.5, letterSpacing: ".13em", fontWeight: 600, color: "rgba(244,239,228,.66)" }}>
          STARTS IN
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 5 }}>
          <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 32, lineHeight: 1 }}>{countdown}</span>
          <span style={{ fontSize: 13, color: "rgba(244,239,228,.8)" }}>days</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(244,239,228,.72)", marginTop: 4 }}>{range}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 15, padding: "0 4px" }}>
        <div style={{ display: "flex" }}>
          <div style={avatar("#C2873F")}>{init1}</div>
          <div style={{ ...avatar("#5C8A4E"), marginLeft: -9 }}>{init2}</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{state.trip.travellers || "Travellers"}</div>
          <div style={{ fontSize: 11.5, color: C.muted3 }}>Couple trip</div>
        </div>
      </div>
    </aside>
  );
}

function avatar(bg: string): CSSProperties {
  return {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: bg,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: 13,
    border: "2px solid #FBF8F1",
  };
}
