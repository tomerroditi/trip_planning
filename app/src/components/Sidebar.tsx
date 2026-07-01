import type { CSSProperties } from "react";
import type { TripState } from "../types";
import { NAV, type Tab } from "../nav";
import { C, FREDOKA } from "../theme";
import { countdownDays, initials } from "../derive";
import { dateRangeLabel } from "../format";

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

      <div style={{ display: "flex", flexDirection: "column", gap: 3, overflowY: "auto", minHeight: 0 }}>
        {NAV.map(({ tab: t, label, icon }) => {
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
                padding: "10px 13px",
                borderRadius: 13,
                fontFamily: "inherit",
                fontSize: 14.5,
                fontWeight: 600,
                background: active ? C.green : "transparent",
                color: active ? C.page : C.muted5,
                flexShrink: 0,
              }}
            >
              {icon}
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
