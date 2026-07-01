// Explore — search live flight & stay prices, then add a pick to the trip.
//
// The app is served by a Cloudflare Worker with no travel-provider API keys, so
// "live search" here means deep-linking into the providers' own live results
// (Google Flights, Kayak, Booking.com, Airbnb, Google Hotels) with the trip's
// dates and places pre-filled — opened in a new tab. Whatever you settle on,
// "Add to trip" records it as a booking / stay via the write API so it shows up
// on the itinerary, map and budget. (Claude can also search and add these
// directly in chat through the connected flight/hotel MCP connectors.)

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { TripState } from "../types";
import type { UseTrip } from "../useTrip";
import { write } from "../api";
import { C, FREDOKA } from "../theme";

type Mode = "flights" | "stays";

const enc = encodeURIComponent;

function flightLinks(from: string, to: string, depart: string, ret: string, pax: number) {
  const rangeText = ret ? `${depart} through ${ret}` : `on ${depart}`;
  const q = `Flights from ${from || "my city"} to ${to} ${rangeText} for ${pax} ${pax === 1 ? "passenger" : "passengers"}`;
  const kayakPath = ret ? `${enc(from || to)}-${enc(to)}/${depart}/${ret}` : `${enc(from || to)}-${enc(to)}/${depart}`;
  return [
    { name: "Google Flights", url: `https://www.google.com/travel/flights?q=${enc(q)}`, color: "#4E7E97" },
    { name: "Kayak", url: `https://www.kayak.com/flights/${kayakPath}?sort=bestflight_a`, color: "#B0503A" },
    { name: "Skyscanner", url: `https://www.skyscanner.net/transport/flights/?adults=${pax}&query=${enc(to)}`, color: "#5C8A4E" },
  ];
}

function stayLinks(dest: string, checkin: string, checkout: string, guests: number) {
  return [
    {
      name: "Booking.com",
      url: `https://www.booking.com/searchresults.html?ss=${enc(dest)}&checkin=${checkin}&checkout=${checkout}&group_adults=${guests}`,
      color: "#4E7E97",
    },
    {
      name: "Airbnb",
      url: `https://www.airbnb.com/s/${enc(dest)}/homes?checkin=${checkin}&checkout=${checkout}&adults=${guests}`,
      color: "#B0503A",
    },
    {
      name: "Google Hotels",
      url: `https://www.google.com/travel/search?q=${enc(`hotels in ${dest} ${checkin} to ${checkout}`)}`,
      color: "#5C8A4E",
    },
  ];
}

export function Explore({ state, trip }: { state: TripState; trip: UseTrip }) {
  const [mode, setMode] = useState<Mode>("flights");
  const firstPlace =
    state.segments.flatMap((s) => s.days).find((d) => d.location_name)?.location_name || "";
  const travellers = (state.trip.travellers || "").split("&").filter((s) => s.trim()).length || 2;

  return (
    <div className="fade-up page-scroll">
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontFamily: FREDOKA, fontWeight: 600, fontSize: 24, margin: 0 }}>Explore</h2>
        <p style={{ fontSize: 13.5, color: C.muted, margin: "6px 0 0" }}>
          Search live flight & stay prices, then add your pick to the trip.
        </p>
      </div>

      <div style={{ display: "inline-flex", background: "#EEE9DA", borderRadius: 13, padding: 4, gap: 4, marginBottom: 18 }}>
        {(["flights", "stays"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 13.5,
              padding: "9px 20px",
              borderRadius: 10,
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? C.green : C.muted,
            }}
          >
            {m === "flights" ? "✈️ Flights" : "🏨 Stays"}
          </button>
        ))}
      </div>

      {mode === "flights" ? (
        <FlightSearch state={state} trip={trip} defaultTo={firstPlace} pax={travellers} />
      ) : (
        <StaySearch state={state} trip={trip} defaultDest={firstPlace} guests={travellers} />
      )}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 12.5, color: C.muted2, marginTop: 12, lineHeight: 1.5 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", color: C.muted3, textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  border: `1px solid ${C.border}`,
  borderRadius: 11,
  padding: "10px 12px",
  fontFamily: "inherit",
  fontSize: 14,
  background: "#fff",
  color: C.ink,
  width: "100%",
};

function ProviderButtons({ links }: { links: { name: string; url: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
      {links.map((l) => (
        <a
          key={l.name}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${l.color}`,
            color: l.color,
            background: "#fff",
            fontWeight: 600,
            fontSize: 13.5,
            padding: "10px 15px",
            borderRadius: 11,
          }}
        >
          Search on {l.name} ↗
        </a>
      ))}
    </div>
  );
}

function AddedFlash({ show }: { show: string | null }) {
  if (!show) return null;
  return (
    <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: "#2F6B3E", background: "#E4F0E4", border: "1px solid #CFE6CF", borderRadius: 11, padding: "10px 14px" }}>
      ✓ {show}
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 18, padding: "20px 22px" }}>{children}</div>;
}

function FlightSearch({ state, trip, defaultTo, pax }: { state: TripState; trip: UseTrip; defaultTo: string; pax: number }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(defaultTo);
  const [depart, setDepart] = useState(state.trip.start_date || "");
  const [ret, setRet] = useState(state.trip.end_date || "");
  const [travellers, setTravellers] = useState(pax);
  const [flash, setFlash] = useState<string | null>(null);

  const links = useMemo(() => flightLinks(from, to, depart, ret, travellers), [from, to, depart, ret, travellers]);

  const addBooking = () => {
    if (!to.trim()) return;
    const title = `Flight ${from ? `${from} → ` : "to "}${to}`;
    setFlash(null);
    void trip
      .apply(
        (s) => s,
        () => write.addBooking(trip.tripId, { type: "flight", title, date: depart || null, location_name: to, notes: "Added from Explore" }),
      )
      .then(() => setFlash(`Added “${title}” to your bookings.`));
  };

  return (
    <Panel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="grid-responsive">
        <Field label="From">
          <input style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your city / airport" />
        </Field>
        <Field label="To">
          <input style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} placeholder="Destination" />
        </Field>
        <Field label="Depart">
          <input style={inputStyle} type="date" value={depart} onChange={(e) => setDepart(e.target.value)} />
        </Field>
        <Field label="Return">
          <input style={inputStyle} type="date" value={ret} onChange={(e) => setRet(e.target.value)} />
        </Field>
        <Field label="Travellers">
          <input style={inputStyle} type="number" min={1} max={9} value={travellers} onChange={(e) => setTravellers(Math.max(1, Number(e.target.value) || 1))} />
        </Field>
      </div>

      <ProviderButtons links={links} />

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderSoft}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={addBooking}
          disabled={!to.trim()}
          className="btn-green"
          style={{ border: "none", cursor: to.trim() ? "pointer" : "default", background: to.trim() ? C.green : "#B9C2B2", color: C.page, fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "11px 18px", borderRadius: 12 }}
        >
          + Add flight to trip
        </button>
        <span style={{ fontSize: 12.5, color: C.muted3 }}>Records a booking you can fill in with the fare & confirmation later.</span>
      </div>

      <AddedFlash show={flash} />
      <Note>
        Prices open live on the provider. Prefer to book by chatting? Ask Claude — the connected flight connectors can search and add fares straight to your trip.
      </Note>
    </Panel>
  );
}

function StaySearch({ state, trip, defaultDest, guests }: { state: TripState; trip: UseTrip; defaultDest: string; guests: number }) {
  const [dest, setDest] = useState(defaultDest);
  const [checkin, setCheckin] = useState(state.trip.start_date || "");
  const [checkout, setCheckout] = useState(state.trip.end_date || "");
  const [g, setG] = useState(guests);
  const [flash, setFlash] = useState<string | null>(null);

  const unbooked = state.accommodations.filter((a) => a.status !== "Booked" && a.location_name);
  const links = useMemo(() => stayLinks(dest, checkin, checkout, g), [dest, checkin, checkout, g]);

  const addStay = () => {
    if (!dest.trim()) return;
    setFlash(null);
    void trip
      .apply(
        (s) => s,
        () =>
          write.addAccommodation(trip.tripId, {
            name: `Stay in ${dest}`,
            location_name: dest,
            check_in: checkin || null,
            check_out: checkout || null,
            status: "To book",
            notes: "Added from Explore",
          }),
      )
      .then(() => setFlash(`Added a “To book” stay in ${dest}.`));
  };

  return (
    <Panel>
      {unbooked.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".04em", color: C.muted3, textTransform: "uppercase", marginBottom: 8 }}>
            Still to book
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {unbooked.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setDest(a.location_name || "");
                  if (a.check_in) setCheckin(a.check_in);
                  if (a.check_out) setCheckout(a.check_out);
                }}
                style={{ border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 12.5, color: C.muted5, padding: "7px 12px", borderRadius: 20 }}
              >
                {a.location_name} · {a.dates_label || "dates TBD"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="grid-responsive">
        <Field label="Destination">
          <input style={inputStyle} value={dest} onChange={(e) => setDest(e.target.value)} placeholder="City or area" />
        </Field>
        <Field label="Guests">
          <input style={inputStyle} type="number" min={1} max={16} value={g} onChange={(e) => setG(Math.max(1, Number(e.target.value) || 1))} />
        </Field>
        <Field label="Check-in">
          <input style={inputStyle} type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
        </Field>
        <Field label="Check-out">
          <input style={inputStyle} type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} />
        </Field>
      </div>

      <ProviderButtons links={links} />

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderSoft}`, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={addStay}
          disabled={!dest.trim()}
          className="btn-green"
          style={{ border: "none", cursor: dest.trim() ? "pointer" : "default", background: dest.trim() ? C.green : "#B9C2B2", color: C.page, fontFamily: "inherit", fontWeight: 600, fontSize: 14, padding: "11px 18px", borderRadius: 12 }}
        >
          + Add stay to trip
        </button>
        <span style={{ fontSize: 12.5, color: C.muted3 }}>Adds a “To book” stay you can confirm once you've picked a place.</span>
      </div>

      <AddedFlash show={flash} />
      <Note>Prices open live on the provider. Ask Claude to compare and add a specific hotel via the connected stay connectors.</Note>
    </Panel>
  );
}
