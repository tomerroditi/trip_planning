// Phone layout chrome: a compact top bar and a fixed bottom tab bar with a
// "More" sheet for the secondary tabs. Desktop keeps the Sidebar; these render
// only under the mobile breakpoint (see App.tsx).

import { useState, type ReactNode } from "react";
import type { TripState } from "../types";
import { NAV, type Tab } from "../nav";
import { C, FREDOKA } from "../theme";
import { countdownDays } from "../derive";
import { dateRangeLabel } from "../format";
import { timeAgo } from "../format";

const PRIMARY = NAV.filter((n) => n.primary);
const SECONDARY = NAV.filter((n) => !n.primary);

export function MobileHeader({
  state,
  refreshing,
  lastUpdated,
  onRefresh,
}: {
  state: TripState;
  refreshing: boolean;
  lastUpdated: number | null;
  onRefresh: () => void;
}) {
  return (
    <header
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "0 14px",
        paddingTop: "env(safe-area-inset-top)",
        height: "calc(56px + env(safe-area-inset-top))",
        background: C.page,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          background: C.green,
          color: C.page,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FREDOKA,
          fontWeight: 600,
          fontSize: 17,
          flexShrink: 0,
        }}
      >
        k
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FREDOKA,
            fontWeight: 600,
            fontSize: 16,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {state.trip.name}
        </div>
        <div style={{ fontSize: 11, color: C.muted3 }}>
          {refreshing ? "Updating…" : `Updated ${timeAgo(lastUpdated)}`}
        </div>
      </div>
      <button
        onClick={onRefresh}
        aria-label="Refresh"
        className="ghost-btn"
        style={{
          border: `1px solid ${C.border}`,
          background: C.panel,
          color: C.muted4,
          width: 38,
          height: 38,
          borderRadius: 11,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          className={refreshing ? "spin" : undefined}
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      </button>
    </header>
  );
}

export function BottomNav({
  state,
  tab,
  setTab,
}: {
  state: TripState;
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const [sheet, setSheet] = useState(false);
  const onSecondary = SECONDARY.some((n) => n.tab === tab);

  return (
    <>
      {sheet && <MoreSheet state={state} tab={tab} setTab={setTab} close={() => setSheet(false)} />}
      <nav
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "stretch",
          background: C.panel,
          borderTop: `1px solid ${C.border}`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {PRIMARY.map((n) => (
          <NavBtn key={n.tab} active={tab === n.tab} label={n.short} icon={n.icon} onClick={() => { setSheet(false); setTab(n.tab); }} />
        ))}
        <NavBtn
          active={onSecondary || sheet}
          label="More"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
              <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          }
          onClick={() => setSheet((v) => !v)}
        />
      </nav>
    </>
  );
}

function NavBtn({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "9px 0 8px",
        color: active ? C.green : C.muted3,
        fontFamily: "inherit",
        fontWeight: 600,
        fontSize: 10.5,
        minHeight: 54,
      }}
    >
      <span style={{ display: "flex" }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MoreSheet({
  state,
  tab,
  setTab,
  close,
}: {
  state: TripState;
  tab: Tab;
  setTab: (t: Tab) => void;
  close: () => void;
}) {
  const countdown = countdownDays(state.trip.start_date);
  const range = dateRangeLabel(state.trip.start_date, state.trip.end_date);

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,34,28,.34)",
        zIndex: 40,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: C.page,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: "10px 16px calc(20px + env(safe-area-inset-bottom))",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 3, background: C.track, margin: "6px auto 14px" }} />
        <div
          style={{
            background: C.green,
            color: C.page,
            borderRadius: 16,
            padding: "14px 16px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 10, letterSpacing: ".12em", fontWeight: 600, color: "rgba(244,239,228,.66)" }}>STARTS IN</div>
            <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 26, lineHeight: 1.1 }}>{countdown} days</div>
          </div>
          <div style={{ fontSize: 12, color: "rgba(244,239,228,.8)", textAlign: "right" }}>{range}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SECONDARY.map((n) => {
            const active = tab === n.tab;
            return (
              <button
                key={n.tab}
                onClick={() => { setTab(n.tab); close(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  border: `1px solid ${active ? C.green : C.border}`,
                  background: active ? C.green : C.card,
                  color: active ? C.page : C.muted5,
                  cursor: "pointer",
                  padding: "14px 14px",
                  borderRadius: 14,
                  fontFamily: "inherit",
                  fontWeight: 600,
                  fontSize: 14,
                  textAlign: "left",
                }}
              >
                {n.icon}
                <span>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
