import { useState } from "react";
import type { TripState } from "../types";
import { C, FREDOKA, fmtMoney } from "../theme";
import { budgetTotals } from "../derive";

export function Budget({ state }: { state: TripState }) {
  const [mode, setMode] = useState<"planned" | "actual">("planned");
  const currency = state.trip.currency || "NZD";
  const cap = state.trip.budget_cap ?? 0;
  const view = budgetTotals(state, mode);
  const travellers = (state.trip.travellers || "").split("&").filter((s) => s.trim()).length || 2;

  return (
    <div className="fade-up" style={{ height: "100%", overflowY: "auto", padding: "28px 30px 50px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 24, margin: 0 }}>Budget</h2>
          <p style={{ fontSize: 13.5, color: C.muted, margin: "6px 0 0" }}>
            {travellers} travellers · all amounts in {currency}
          </p>
        </div>
        <div style={{ display: "flex", background: "#EEE9DA", borderRadius: 13, padding: 4, gap: 4 }}>
          {(["planned", "actual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: 13,
                padding: "9px 18px",
                borderRadius: 10,
                background: mode === m ? "#FFFFFF" : "transparent",
                color: mode === m ? C.green : C.muted,
              }}
            >
              {m === "planned" ? "Planned" : "Spent so far"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 22 }}>
        <div style={{ background: C.green, color: C.page, borderRadius: 20, padding: "22px 24px" }}>
          <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, color: "rgba(244,239,228,.66)" }}>Total budget</div>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 38, marginTop: 8, lineHeight: 1 }}>{fmtMoney(cap, currency)}</div>
          <div style={{ fontSize: 13, color: "rgba(244,239,228,.78)", marginTop: 6 }}>the cap for the trip</div>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 20, padding: "22px 24px" }}>
          <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, color: C.muted3 }}>{mode === "planned" ? "Planned spend" : "Spent so far"}</div>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 38, marginTop: 8, lineHeight: 1, color: C.ink }}>{fmtMoney(view.total, currency)}</div>
          <div style={{ height: 9, borderRadius: 6, background: C.track, marginTop: 12, overflow: "hidden" }}>
            <div style={{ height: "100%", width: view.totalPct, background: C.greenMid, borderRadius: 6, transition: "width .4s" }} />
          </div>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 20, padding: "22px 24px" }}>
          <div style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, color: C.muted3 }}>Remaining</div>
          <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 38, marginTop: 8, lineHeight: 1, color: view.remain >= 0 ? "#2F6B3E" : "#B0503A" }}>{fmtMoney(view.remain, currency)}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>under the cap</div>
        </div>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 20, padding: "8px 24px 12px" }}>
        {state.budget_categories.map((cat) => {
          const amt = mode === "planned" ? cat.planned : cat.actual;
          const pct = cap ? Math.round((amt / cap) * 100) + "%" : "0%";
          return (
            <div key={cat.id} style={{ padding: "15px 0", borderBottom: "1px solid #EFEADC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: cat.color }} />
                  <span style={{ fontWeight: 600, fontSize: 14.5 }}>{cat.name}</span>
                </div>
                <div style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 15 }}>{fmtMoney(amt, currency)}</div>
              </div>
              <div style={{ height: 9, borderRadius: 6, background: "#EAE4D4", overflow: "hidden" }}>
                <div style={{ height: "100%", width: pct, background: cat.color, borderRadius: 6, transition: "width .4s" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
        <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 18, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13.5, color: C.muted5, fontWeight: 600 }}>Per person</span>
          <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 22 }}>{fmtMoney(view.perPerson, currency)}</span>
        </div>
        <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 18, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13.5, color: C.muted5, fontWeight: 600 }}>Per day</span>
          <span style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 22 }}>{fmtMoney(view.perDay, currency)}</span>
        </div>
      </div>
    </div>
  );
}
