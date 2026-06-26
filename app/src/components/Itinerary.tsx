import { useState } from "react";
import { resolveLoc } from "../../../shared/geo";
import type { DayWithItems, TripState } from "../types";
import { C, FREDOKA } from "../theme";

export function Itinerary({ state }: { state: TripState }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <div className="fade-up" style={{ height: "100%", overflowY: "auto", padding: "24px 30px 60px" }}>
      {state.segments.map((seg) => {
        const open = !collapsed[seg.id];
        return (
          <div key={seg.id} style={{ marginBottom: 18, borderRadius: 21, background: C.panel, border: `1px solid ${C.borderSoft}`, overflow: "hidden" }}>
            <button
              onClick={() => toggle(seg.id)}
              className="seg-toggle"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, border: "none", cursor: "pointer", background: "transparent", padding: "17px 22px", textAlign: "left" }}
            >
              <span style={{ width: 13, height: 13, borderRadius: 4, background: seg.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 18 }}>{seg.name}</span>
                  {seg.day_range && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.muted2, background: "#EEE9DA", padding: "3px 10px", borderRadius: 20 }}>{seg.day_range}</span>
                  )}
                </div>
                {seg.summary && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{seg.summary}</div>}
              </div>
              <span style={{ fontSize: 15, color: C.muted3, width: 18, textAlign: "center" }}>{open ? "▾" : "▸"}</span>
            </button>

            {open && (
              <div style={{ padding: "2px 22px 12px" }}>
                {seg.days.map((day) => (
                  <DayRow key={day.id} day={day} segColor={seg.color} segSoft={seg.soft_color} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayRow({ day, segColor, segSoft }: { day: DayWithItems; segColor: string; segSoft: string }) {
  const located = day.lat != null || !!resolveLoc(day.location_name);
  const driveBg = day.drive_kind === "FLY" ? "#E7EEF2" : "#F4ECDD";
  const driveFg = day.drive_kind === "FLY" ? "#3E6B8E" : "#A8744A";

  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ width: 52, flexShrink: 0, textAlign: "center", paddingTop: 16 }}>
        <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 13, color: segColor }}>{day.label}</div>
        <div style={{ fontSize: 11, color: C.muted3, marginTop: 3 }}>{day.date_short}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 16, padding: "15px 17px", marginBottom: 10 }}>
        {day.drive_kind && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12, color: "#8A8F80", marginBottom: 11, paddingBottom: 11, borderBottom: "1px dashed #E6E0D2", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".06em", color: driveFg, background: driveBg, padding: "3px 8px", borderRadius: 6 }}>{day.drive_kind}</span>
            {day.drive_label && <span style={{ fontWeight: 600, color: C.muted4 }}>{day.drive_label}</span>}
            {day.drive_meta && <span>· {day.drive_meta}</span>}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 16.5 }}>{day.title}</div>
          {day.location_name && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${C.borderSoft}`, background: C.panel, fontSize: 12, color: C.muted4, padding: "5px 11px", borderRadius: 20 }}>
              <svg width="11" height="13" viewBox="0 0 24 24" fill="none" stroke={located ? segColor : "#C2BCAC"} strokeWidth="2.4">
                <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.4" />
              </svg>
              {day.location_name}
            </span>
          )}
        </div>
        <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 1 }}>
          {day.items.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 7px", borderRadius: 10, width: "100%" }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 7,
                  flexShrink: 0,
                  border: `2px solid ${item.done ? segColor : "#CBD2C2"}`,
                  background: item.done ? segColor : "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {item.done ? "✓" : ""}
              </span>
              <span style={{ flex: 1, fontSize: 14, color: item.done ? "#AAB0A2" : C.ink2, textDecoration: item.done ? "line-through" : "none" }}>{item.title}</span>
              {item.tag && (
                <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: ".03em", color: segColor, background: segSoft, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{item.tag}</span>
              )}
            </div>
          ))}
          {day.items.length === 0 && <div style={{ fontSize: 13, color: C.muted3, padding: "4px 7px" }}>No activities yet — ask Claude to add some.</div>}
        </div>
      </div>
    </div>
  );
}
