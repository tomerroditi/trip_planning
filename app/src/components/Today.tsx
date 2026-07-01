// "Today" — the screen you open while travelling. Figures out where you are in
// the trip (before / during / after), then surfaces the current day's plan,
// where you're sleeping, the weather, and any checklist items pinned to today.

import type { CSSProperties, ReactNode } from "react";
import type { Tab } from "../nav";
import type { DayWithItems, SegmentWithDays, TripState } from "../types";
import type { UseTrip } from "../useTrip";
import { write } from "../api";
import { C, FREDOKA } from "../theme";
import { countdownDays } from "../derive";
import { useWeather, weatherGlyph } from "../weather";

function todayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

interface Ctx {
  phase: "before" | "during" | "after";
  today: string;
  dayIndex: number; // 1-based within trip, when during
  total: number;
  current: { day: DayWithItems; seg: SegmentWithDays } | null;
  next: { day: DayWithItems; seg: SegmentWithDays } | null;
}

function buildCtx(state: TripState): Ctx {
  const today = todayIso();
  const flat: { day: DayWithItems; seg: SegmentWithDays }[] = [];
  for (const seg of state.segments) for (const day of seg.days) flat.push({ day, seg });
  const dated = flat.filter((f) => f.day.date);
  const total = flat.length;

  const start = state.trip.start_date;
  const end = state.trip.end_date;
  let phase: Ctx["phase"] = "before";
  if (start && today >= start) phase = end && today > end ? "after" : "during";

  const currentIdx = dated.findIndex((f) => f.day.date === today);
  const current = currentIdx >= 0 ? dated[currentIdx] : null;
  const next =
    dated.find((f) => (f.day.date as string) >= today) ?? null;

  const dayIndex = current ? flat.indexOf(current) + 1 : 0;
  return { phase, today, dayIndex, total, current, next };
}

// The stay whose date window contains `date` (check_in inclusive, check_out
// exclusive — you sleep there the nights up to but not including checkout).
function stayFor(state: TripState, date: string) {
  return (
    state.accommodations.find(
      (a) => a.check_in && a.check_out && date >= a.check_in && date < a.check_out,
    ) ?? state.accommodations.find((a) => a.check_in === date) ?? null
  );
}

export function Today({ state, setTab, trip }: { state: TripState; setTab: (t: Tab) => void; trip: UseTrip }) {
  const ctx = buildCtx(state);
  const focus = ctx.current ?? ctx.next;
  const countdown = countdownDays(state.trip.start_date);
  const pinned = state.checklist.filter((c) => c.date === ctx.today);

  const toggleItem = (itemId: string, done: boolean) =>
    trip.apply(
      (s) => ({
        ...s,
        segments: s.segments.map((seg) => ({
          ...seg,
          days: seg.days.map((d) => ({ ...d, items: d.items.map((it) => (it.id === itemId ? { ...it, done } : it)) })),
        })),
      }),
      () => write.patchPlanItem(trip.tripId, itemId, { done }),
    );

  const toggleCheck = (id: string, done: boolean) =>
    trip.apply(
      (s) => ({ ...s, checklist: s.checklist.map((c) => (c.id === id ? { ...c, done } : c)) }),
      () => write.patchChecklist(trip.tripId, id, { done }),
    );

  const stay = focus?.day.date ? stayFor(state, focus.day.date) : null;

  return (
    <div className="fade-up page-scroll">
      {/* Phase banner */}
      <div
        style={{
          background: C.green,
          color: C.page,
          borderRadius: 22,
          padding: "22px 24px",
          backgroundImage: "radial-gradient(circle at 90% -30%, rgba(255,255,255,.12), transparent 45%)",
        }}
      >
        <div style={{ fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, color: "rgba(244,239,228,.7)" }}>
          {ctx.phase === "during" ? `Day ${ctx.dayIndex} of ${ctx.total}` : ctx.phase === "after" ? "Trip complete" : "Not started yet"}
        </div>
        <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 30, lineHeight: 1.1, marginTop: 8 }}>
          {ctx.phase === "during"
            ? focus?.day.title || "Today"
            : ctx.phase === "after"
              ? "Hope it was epic ✨"
              : `${countdown} days to go`}
        </div>
        {focus && (
          <div style={{ fontSize: 14, color: "rgba(244,239,228,.85)", marginTop: 6 }}>
            {ctx.phase === "during" ? "Today" : `Next up · ${focus.day.date_short}`} · {focus.day.location_name || focus.seg.name}
          </div>
        )}
      </div>

      {focus ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16, marginTop: 16 }}>
          <FocusDayCard
            day={focus.day}
            seg={focus.seg}
            heading={ctx.phase === "during" ? "Today's plan" : `Next: ${focus.day.label}`}
            onToggle={toggleItem}
          />

          <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {stay ? (
              <Card>
                <CardLabel>{ctx.phase === "during" ? "Tonight you're in" : "First stay"}</CardLabel>
                <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 18, marginTop: 6 }}>{stay.name}</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{stay.location_name} · {stay.dates_label}</div>
                <button onClick={() => setTab("stays")} style={linkBtn}>All stays →</button>
              </Card>
            ) : (
              <Card>
                <CardLabel>Where you're sleeping</CardLabel>
                <div style={{ fontSize: 13.5, color: C.muted, marginTop: 8 }}>No stay booked for this night yet.</div>
                <button onClick={() => setTab("stays")} style={linkBtn}>Open stays →</button>
              </Card>
            )}

            <TodayChecklistCard pinned={pinned.length} total={state.checklist.length} done={state.checklist.filter((c) => c.done).length} onOpen={() => setTab("checklist")} />
          </div>

          {pinned.length > 0 && (
            <Card>
              <CardLabel>Pinned to today</CardLabel>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                {pinned.map((c) => (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 4px", cursor: "pointer" }}>
                    <input type="checkbox" checked={c.done} onChange={() => toggleCheck(c.id, !c.done)} style={{ width: 18, height: 18, accentColor: C.green }} />
                    <span style={{ fontSize: 14, color: c.done ? "#AAB0A2" : C.ink2, textDecoration: c.done ? "line-through" : "none" }}>{c.text}</span>
                  </label>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, color: C.muted }}>No day-by-day plan yet. Ask Claude to build your itinerary, or open the Itinerary tab.</div>
          <button onClick={() => setTab("itinerary")} style={linkBtn}>Open itinerary →</button>
        </Card>
      )}
    </div>
  );
}

function FocusDayCard({
  day,
  seg,
  heading,
  onToggle,
}: {
  day: DayWithItems;
  seg: SegmentWithDays;
  heading: string;
  onToggle: (id: string, done: boolean) => void;
}) {
  const w = useWeather(day.lat, day.lng, day.date);
  const glyph = w.data ? weatherGlyph(w.data.code) : null;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <CardLabel>{heading}</CardLabel>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, marginTop: 6 }}>{day.title || day.label}</div>
          {day.drive_kind && day.drive_label && (
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>
              {day.drive_kind === "FLY" ? "✈️" : "🚗"} {day.drive_label}
              {day.drive_meta ? ` · ${day.drive_meta}` : ""}
            </div>
          )}
        </div>
        <WeatherBadge glyph={glyph} w={w} />
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 1 }}>
        {day.items.map((it) => (
          <button
            key={it.id}
            onClick={() => onToggle(it.id, !it.done)}
            className="row-hover"
            style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 6px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" }}
          >
            <span
              style={{
                width: 21,
                height: 21,
                borderRadius: 7,
                flexShrink: 0,
                border: `2px solid ${it.done ? seg.color : "#CBD2C2"}`,
                background: it.done ? seg.color : "#fff",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {it.done ? "✓" : ""}
            </span>
            <span style={{ flex: 1, fontSize: 14.5, color: it.done ? "#AAB0A2" : C.ink2, textDecoration: it.done ? "line-through" : "none" }}>{it.title}</span>
            {it.start_time && <span style={{ fontSize: 12, color: C.muted3, fontVariantNumeric: "tabular-nums" }}>{it.start_time}</span>}
          </button>
        ))}
        {day.items.length === 0 && <div style={{ fontSize: 13.5, color: C.muted3, padding: "6px" }}>No activities planned for this day yet.</div>}
      </div>
    </Card>
  );
}

function WeatherBadge({ glyph, w }: { glyph: { icon: string; label: string } | null; w: ReturnType<typeof useWeather> }) {
  if (w.loading) return <span style={{ fontSize: 12, color: C.muted3 }}>…</span>;
  if (glyph && w.data)
    return (
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 22, lineHeight: 1 }}>{glyph.icon}</div>
        <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 15, marginTop: 2 }}>
          {w.data.tMax}° <span style={{ color: C.muted3, fontWeight: 500 }}>/ {w.data.tMin}°</span>
        </div>
        {w.data.precipProb != null && w.data.precipProb > 5 && (
          <div style={{ fontSize: 11, color: "#4E7E97" }}>💧 {w.data.precipProb}%</div>
        )}
      </div>
    );
  if (w.outOfRange)
    return <span style={{ fontSize: 11, color: C.muted3, maxWidth: 96, textAlign: "right" }}>Forecast nearer the date</span>;
  return null;
}

function TodayChecklistCard({ pinned, total, done, onOpen }: { pinned: number; total: number; done: number; onOpen: () => void }) {
  return (
    <Card>
      <CardLabel>Checklist</CardLabel>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
        <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 24 }}>{done}</span>
        <span style={{ fontSize: 13, color: C.muted2 }}>of {total} done</span>
      </div>
      {pinned > 0 && <div style={{ fontSize: 12.5, color: "#B0503A", marginTop: 4 }}>{pinned} pinned to today</div>}
      <button onClick={onOpen} style={linkBtn}>Open checklist →</button>
    </Card>
  );
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 18, padding: "18px 20px", ...style }}>
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600, color: C.muted3 }}>{children}</div>;
}

const linkBtn: CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 600,
  fontSize: 13,
  color: C.green,
  padding: "10px 0 0",
};
