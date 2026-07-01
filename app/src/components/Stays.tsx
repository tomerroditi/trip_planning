import { useState } from "react";
import type { Accommodation, StayStatus, TripState } from "../types";
import type { UseTrip } from "../useTrip";
import { write } from "../api";
import { C, FREDOKA, fmtMoney, statusStyle } from "../theme";

type Filter = "all" | "Booked" | "Pending" | "To book";

export function Stays({ state, trip }: { state: TripState; trip: UseTrip }) {
  const [filter, setFilter] = useState<Filter>("all");
  const segById = new Map(state.segments.map((s) => [s.id, s]));
  const stays = state.accommodations;

  const setStatus = (id: string, status: StayStatus) => {
    trip.apply(
      (s) => ({
        ...s,
        accommodations: s.accommodations.map((a) => (a.id === id ? { ...a, status } : a)),
      }),
      () => write.patchAccommodation(trip.tripId, id, { status }),
    );
  };

  const count = (f: Filter) => (f === "all" ? stays.length : stays.filter((s) => s.status === f).length);
  const visible = stays.filter((s) => filter === "all" || s.status === filter);
  const nights = stays.reduce((a, s) => a + (s.nights ?? 0), 0);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${count("all")})` },
    { key: "Booked", label: `Booked (${count("Booked")})` },
    { key: "Pending", label: `Pending (${count("Pending")})` },
    { key: "To book", label: `To book (${count("To book")})` },
  ];

  return (
    <div className="fade-up page-scroll">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 24, margin: 0 }}>Stays</h2>
          <p style={{ fontSize: 13.5, color: C.muted, margin: "6px 0 0" }}>
            {nights} nights of accommodation across the loop
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  border: `1px solid ${C.border}`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  fontSize: 13,
                  padding: "8px 15px",
                  borderRadius: 11,
                  background: active ? C.green : "#FFFFFF",
                  color: active ? C.page : C.muted5,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginTop: 22 }}>
        {visible.map((st) => (
          <StayCard key={st.id} st={st} segName={(st.segment_id && segById.get(st.segment_id)?.name) || ""} segColor={(st.segment_id && segById.get(st.segment_id)?.color) || C.greenMid} currency={state.trip.currency || "NZD"} onStatus={(s) => setStatus(st.id, s)} />
        ))}
        {visible.length === 0 && <div style={{ fontSize: 13, color: C.muted3 }}>No stays in this filter.</div>}
      </div>
    </div>
  );
}

function StayCard({ st, segName, segColor, currency, onStatus }: { st: Accommodation; segName: string; segColor: string; currency: string; onStatus: (s: StayStatus) => void }) {
  const ss = statusStyle(st.status);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 18, padding: "19px 21px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: segColor }}>{segName}</div>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 18, marginTop: 4 }}>{st.name}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>{st.location_name}</div>
        </div>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <select
            value={st.status}
            onChange={(e) => onStatus(e.target.value as StayStatus)}
            title="Change status"
            style={{
              appearance: "none",
              WebkitAppearance: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".02em",
              color: ss.fg,
              background: ss.bg,
              border: "none",
              padding: "6px 24px 6px 12px",
              borderRadius: 20,
            }}
          >
            <option value="Booked">Booked</option>
            <option value="Pending">Pending</option>
            <option value="To book">To book</option>
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 9, color: ss.fg }}>▾</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 22, marginTop: 17, paddingTop: 15, borderTop: "1px solid #EFEADC" }}>
        <Field label="DATES" value={st.dates_label || "TBD"} />
        <Field label="NIGHTS" value={String(st.nights ?? "—")} />
        <Field label="TOTAL" value={st.cost != null ? fmtMoney(st.cost, st.currency || currency) : "—"} />
        {st.booking_ref && (
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.muted3, fontWeight: 600, letterSpacing: ".04em" }}>CONF</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: C.muted4 }}>{st.booking_ref}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted3, fontWeight: 600, letterSpacing: ".04em" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{value}</div>
    </div>
  );
}
