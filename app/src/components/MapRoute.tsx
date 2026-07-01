import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { normLoc } from "../../../shared/geo";
import { computeStops, type Stop } from "../derive";
import { useIsMobile } from "../hooks";
import { C, FREDOKA } from "../theme";
import type { TripState } from "../types";

function pinHtml(color: string, n: number): string {
  return (
    `<div style="width:28px;height:28px;border-radius:50% 50% 50% 2px;transform:rotate(45deg);background:${color};` +
    `box-shadow:0 2px 6px rgba(0,0,0,.32);display:flex;align-items:center;justify-content:center;">` +
    `<span style="transform:rotate(-45deg);color:#fff;font:600 12px DM Sans,sans-serif;">${n}</span></div>`
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export function MapRoute({ state }: { state: TripState }) {
  const stops = useMemo(() => computeStops(state), [state]);
  const located = useMemo(() => stops.filter((s) => s.coords), [stops]);
  const [selected, setSelected] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stopLayer = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.LayerGroup | null>(null);
  const markers = useRef<Record<string, L.Marker>>({});

  // Init the map once when the tab mounts.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { scrollWheelZoom: true, zoomControl: true }).setView([-44.0, 169.9], 6);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    }).addTo(map);
    stopLayer.current = L.layerGroup().addTo(map);
    routeLayer.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const t = window.setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        /* ignore */
      }
    }, 220);
    return () => {
      window.clearTimeout(t);
      try {
        map.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
      stopLayer.current = null;
      routeLayer.current = null;
      markers.current = {};
    };
  }, []);

  // Leaflet needs to recompute its size when the panel changes shape (the
  // desktop↔mobile layout swap resizes the map container).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = window.setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        /* ignore */
      }
    }, 240);
    return () => window.clearTimeout(t);
  }, [isMobile]);

  // (Re)draw markers and the route whenever the located stops change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !stopLayer.current || !routeLayer.current) return;
    stopLayer.current.clearLayers();
    routeLayer.current.clearLayers();
    markers.current = {};
    const pts: [number, number][] = [];
    located.forEach((s, i) => {
      const coords = s.coords!;
      pts.push(coords);
      const icon = L.divIcon({ className: "", iconSize: [30, 30], iconAnchor: [15, 28], popupAnchor: [0, -26], html: pinHtml(s.color, i + 1) });
      const m = L.marker(coords, { icon }).addTo(stopLayer.current!);
      m.bindPopup(`<b>${escapeHtml(s.name)}</b><br>${escapeHtml(s.sources.join(" · "))}`);
      m.on("click", () => setSelected(s.name));
      markers.current[normLoc(s.name)] = m;
    });
    if (pts.length > 1) {
      L.polyline(pts.concat([pts[0]]), { color: C.green, weight: 3, opacity: 0.6, dashArray: "1 9", lineCap: "round" }).addTo(routeLayer.current);
    }
    if (pts.length) map.fitBounds(pts, { padding: [45, 45] });
    window.setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        /* ignore */
      }
    }, 120);
  }, [located]);

  function focus(s: Stop) {
    setSelected(s.name);
    const map = mapRef.current;
    if (map && s.coords) {
      map.flyTo(s.coords, 9, { duration: 0.8 });
      const m = markers.current[normLoc(s.name)];
      if (m) m.openPopup();
    }
  }

  let pinIdx = 0;

  return (
    <div className="fade-up" style={{ height: "100%", display: "flex", flexDirection: isMobile ? "column" : "row" }}>
      <div
        style={{
          width: isMobile ? "100%" : 344,
          flexShrink: 0,
          order: isMobile ? 2 : 0,
          flex: isMobile ? "1 1 auto" : "0 0 auto",
          minHeight: 0,
          borderRight: isMobile ? "none" : `1px solid ${C.border}`,
          borderTop: isMobile ? `1px solid ${C.border}` : "none",
          display: "flex",
          flexDirection: "column",
          background: C.panel,
        }}
      >
        <div style={{ padding: isMobile ? "14px 16px 10px" : "20px 22px 14px" }}>
          <h2 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 20, margin: 0 }}>Route &amp; stops</h2>
          <p style={{ fontSize: 13, color: C.muted, margin: "6px 0 0" }}>
            {located.length} places · auto-built from your itinerary &amp; stays
          </p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 14px 18px" }}>
          {stops.map((s) => {
            const onMap = !!s.coords;
            const num = onMap ? ++pinIdx : "–";
            const sel = selected === s.name;
            const sub = onMap ? s.sources.join(" · ") : `${s.sources.join(" · ")} · no pin — name not recognised`;
            return (
              <button
                key={s.name}
                onClick={() => focus(s)}
                className="stop-card"
                style={{
                  display: "flex",
                  gap: 13,
                  alignItems: "flex-start",
                  width: "100%",
                  border: `1px solid ${sel ? (onMap ? s.color : "#C2BCAC") : C.border}`,
                  background: sel ? "#FFFFFF" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: "12px 13px",
                  borderRadius: 14,
                  marginBottom: 8,
                }}
              >
                <span style={{ width: 27, height: 27, borderRadius: 9, flexShrink: 0, background: onMap ? s.color : "#C2BCAC", color: "#fff", fontFamily: FREDOKA, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>{num}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.name}</div>
                  <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{sub}</div>
                </div>
              </button>
            );
          })}
          {stops.length === 0 && <div style={{ fontSize: 13, color: C.muted3, padding: "8px 4px" }}>No stops yet.</div>}
        </div>
      </div>
      <div
        style={{
          order: isMobile ? 1 : 0,
          flex: isMobile ? "0 0 auto" : 1,
          height: isMobile ? "44vh" : "auto",
          position: "relative",
          minWidth: 0,
        }}
      >
        <div ref={mapEl} style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", left: 18, bottom: 18, zIndex: 500, background: "rgba(251,248,241,.95)", border: `1px solid ${C.border}`, borderRadius: 13, padding: "11px 15px", fontSize: 12, color: C.muted4, backdropFilter: "blur(4px)" }}>
          <div style={{ fontWeight: 600, color: C.ink, marginBottom: 4 }}>Your live route</div>
          Pins build from your itinerary &amp; stays · click to fly
        </div>
      </div>
    </div>
  );
}
