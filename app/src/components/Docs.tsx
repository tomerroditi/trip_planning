import { useState } from "react";
import type { TripState } from "../types";
import { C, CAT_OPTIONS, FREDOKA, KIND } from "../theme";

export function Docs({ state }: { state: TripState }) {
  const [filter, setFilter] = useState<string>("all");
  const docs = state.documents;

  const count = (c: string) => (c === "all" ? docs.length : docs.filter((d) => d.category === c).length);
  const visible = docs.filter((d) => filter === "all" || d.category === filter);
  const linkCount = docs.filter((d) => d.kind === "Link").length;

  const filters = ["all", ...CAT_OPTIONS];

  return (
    <div className="fade-up page-scroll">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 24, margin: 0 }}>Documents &amp; links</h2>
          <p style={{ fontSize: 13.5, color: C.muted, margin: "6px 0 0" }}>
            {docs.length} items · {linkCount} links · stored for the trip
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filters.map((c) => {
            const active = filter === c;
            const label = c === "all" ? `All (${count("all")})` : `${c} (${count(c)})`;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
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
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid-responsive" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginTop: 20 }}>
        {visible.map((d) => {
          const km = KIND[d.kind] || KIND.Doc;
          const hasUrl = !!d.url && d.url !== "#";
          return (
            <div key={d.id} style={{ background: C.card, border: `1px solid ${C.borderSoft}`, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: km.bg, color: km.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 600, fontSize: 12, letterSpacing: ".03em" }}>{km.code}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                <div style={{ fontSize: 12.5, color: C.muted2, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.subtitle}</div>
              </div>
              {hasUrl ? (
                <a href={d.url!} target="_blank" rel="noopener" className="link-btn" style={{ flexShrink: 0, textDecoration: "none", border: `1px solid #E0DAC9`, color: C.green, fontFamily: "inherit", fontWeight: 600, fontSize: 12.5, padding: "8px 13px", borderRadius: 10 }}>Open ↗</a>
              ) : (
                <span style={{ flexShrink: 0, fontSize: 12, color: C.muted3, fontWeight: 600, padding: "8px 6px" }}>On file</span>
              )}
            </div>
          );
        })}
        {visible.length === 0 && <div style={{ fontSize: 13, color: C.muted3 }}>No documents in this filter.</div>}
      </div>
    </div>
  );
}
