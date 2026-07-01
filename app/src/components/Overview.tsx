import type { Tab } from "../App";
import type { TripState } from "../types";
import { C, FREDOKA, fmtMoney, statusStyle } from "../theme";
import { budgetTotals, computeStops, countdownDays } from "../derive";
import { dateRangeLabel, totalDays } from "../format";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function Overview({ state, setTab }: { state: TripState; setTab: (t: Tab) => void }) {
  const trip = state.trip;
  const segs = state.segments.filter((s) => s.id !== "__unsorted__");
  const days = totalDays(trip.start_date, trip.end_date);
  const countdown = countdownDays(trip.start_date);
  const currency = trip.currency || "NZD";
  const cap = trip.budget_cap ?? 0;
  const budget = budgetTotals(state, "planned");
  const pinCount = computeStops(state).filter((s) => s.coords).length;
  const startCity = segs[0]?.days[0]?.location_name || "home";

  const [, mo] = (trip.start_date || "").split("-").map(Number);
  const monthYear = mo ? `${MONTHS[mo - 1]} ${trip.start_date!.slice(0, 4)}` : "";

  const segColor = new Map(state.segments.map((s) => [s.id, s.color]));
  const upcoming = state.accommodations.filter((a) => a.status !== "Booked").slice(0, 4);
  const snapCats = state.budget_categories.slice(0, 4);

  return (
    <div className="fade-up page-scroll">
      {/* Hero */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 26,
          background: C.green,
          color: C.page,
          padding: "36px 38px",
          backgroundImage:
            "radial-gradient(circle at 88% -20%, rgba(255,255,255,.12), transparent 46%),radial-gradient(circle at 10% 130%, rgba(194,135,63,.28), transparent 42%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 26, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 580 }}>
            <div style={{ fontSize: 11.5, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(244,239,228,.66)", fontWeight: 600 }}>
              {segs.length}-stop loop · {monthYear}
            </div>
            <h2 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 48, lineHeight: 1.02, margin: "13px 0 0" }}>{trip.name}</h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "rgba(244,239,228,.84)", margin: "15px 0 0" }}>
              {trip.travellers ? `${trip.travellers} · ` : ""}
              {days} days from {startCity}, looping the South Island's alpine lakes, fiords and glaciers.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              {[dateRangeLabel(trip.start_date, trip.end_date), `${days} days`, `${pinCount} stops`].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    background: "rgba(255,255,255,.12)",
                    border: "1px solid rgba(255,255,255,.16)",
                    padding: "8px 14px",
                    borderRadius: 22,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right", background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 20, padding: "20px 24px", minWidth: 148 }}>
            <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(244,239,228,.68)", fontWeight: 600 }}>Countdown</div>
            <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 54, lineHeight: 1, marginTop: 8 }}>{countdown}</div>
            <div style={{ fontSize: 13, color: "rgba(244,239,228,.8)", marginTop: 2 }}>days to go</div>
          </div>
        </div>
      </div>

      {/* Segments */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 15 }}>
          <h3 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, margin: 0 }}>
            {segs.length === 5 ? "Five segments" : `${segs.length} segments`}
          </h3>
          <span style={{ fontSize: 13, color: C.muted2 }}>The trip, chaptered</span>
        </div>
        <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(segs.length, 5)}, 1fr)`, gap: 13 }}>
          {segs.map((seg) => (
            <div key={seg.id} style={{ borderRadius: 18, overflow: "hidden", background: C.card, border: `1px solid ${C.borderSoft}` }}>
              <div style={{ height: 8, background: seg.color }} />
              <div style={{ padding: "15px 15px 17px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.muted3 }}>{seg.day_range}</div>
                <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 16, marginTop: 6, lineHeight: 1.12 }}>{seg.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 1.4 }}>{seg.base}</div>
                <div style={{ fontSize: 11.5, color: C.muted3, marginTop: 6 }}>{seg.nights_label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attention + budget snapshot */}
      <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 18, marginTop: 28 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 20, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 18, margin: 0 }}>Needs your attention</h3>
            <button onClick={() => setTab("stays")} style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13, color: C.green }}>
              View stays →
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.length === 0 && <div style={{ fontSize: 13, color: C.muted }}>Everything's booked. 🎉</div>}
            {upcoming.map((st) => {
              const ss = statusStyle(st.status);
              return (
                <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 14, background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 14, padding: "13px 15px" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: (st.segment_id && segColor.get(st.segment_id)) || C.greenMid, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{st.name}</div>
                    <div style={{ fontSize: 12, color: C.muted2, marginTop: 2 }}>
                      {st.location_name} · {st.dates_label}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ss.fg, background: ss.bg, padding: "5px 11px", borderRadius: 20, whiteSpace: "nowrap" }}>{st.status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 20, padding: "22px 24px" }}>
          <h3 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 18, margin: "0 0 16px" }}>Budget snapshot</h3>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 34, color: C.green }}>{fmtMoney(budget.total, currency)}</span>
            <span style={{ fontSize: 13, color: C.muted2 }}>planned of {fmtMoney(cap, currency)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 6, background: C.track, margin: "14px 0 18px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: budget.totalPct, background: C.green, borderRadius: 6 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {snapCats.map((cat) => (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: C.muted5 }}>{cat.name}</span>
                <span style={{ fontWeight: 600 }}>{fmtMoney(cat.planned, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
