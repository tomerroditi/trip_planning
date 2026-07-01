import { useState } from "react";
import { useTrip } from "./useTrip";
import { useIsMobile } from "./hooks";
import { C, FREDOKA } from "./theme";
import type { Tab } from "./nav";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileHeader, BottomNav } from "./components/MobileNav";
import { Overview } from "./components/Overview";
import { Today } from "./components/Today";
import { Itinerary } from "./components/Itinerary";
import { MapRoute } from "./components/MapRoute";
import { Budget } from "./components/Budget";
import { Stays } from "./components/Stays";
import { Checklist } from "./components/Checklist";
import { Explore } from "./components/Explore";
import { Docs } from "./components/Docs";

export type { Tab } from "./nav";

export default function App() {
  const trip = useTrip();
  const { state, error, loading, refreshing, lastUpdated, refresh } = trip;
  const [tab, setTab] = useState<Tab>("overview");
  const isMobile = useIsMobile();

  if (loading && !state) return <Splash />;
  if (!state) return <ErrorScreen error={error ?? "No trip found."} onRetry={refresh} />;

  const content = (
    <main style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
      {tab === "overview" && <Overview state={state} setTab={setTab} />}
      {tab === "today" && <Today state={state} setTab={setTab} trip={trip} />}
      {tab === "itinerary" && <Itinerary state={state} trip={trip} />}
      {tab === "map" && <MapRoute state={state} />}
      {tab === "budget" && <Budget state={state} trip={trip} />}
      {tab === "stays" && <Stays state={state} trip={trip} />}
      {tab === "checklist" && <Checklist state={state} trip={trip} />}
      {tab === "explore" && <Explore state={state} trip={trip} />}
      {tab === "docs" && <Docs state={state} />}
    </main>
  );

  if (isMobile) {
    return (
      <div
        className="app-shell"
        style={{ display: "flex", flexDirection: "column", width: "100%", background: C.page, color: C.ink, overflow: "hidden" }}
      >
        <MobileHeader state={state} refreshing={refreshing} lastUpdated={lastUpdated} onRefresh={refresh} />
        {content}
        <BottomNav state={state} tab={tab} setTab={setTab} />
      </div>
    );
  }

  return (
    <div
      className="app-shell"
      style={{ display: "flex", width: "100%", background: C.page, color: C.ink, overflow: "hidden" }}
    >
      <Sidebar state={state} tab={tab} setTab={setTab} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header state={state} tab={tab} setTab={setTab} refreshing={refreshing} lastUpdated={lastUpdated} onRefresh={refresh} />
        {content}
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div
      className="app-shell"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: C.page }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: C.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.page,
          fontFamily: FREDOKA,
          fontWeight: 600,
          fontSize: 24,
        }}
      >
        k
      </div>
      <div style={{ color: C.muted, fontSize: 14 }}>Loading your trip…</div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div
      className="app-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        background: C.page,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: FREDOKA, fontSize: 22, color: C.ink }}>Couldn't load the trip</div>
      <div style={{ color: C.muted, fontSize: 14, maxWidth: 420 }}>{error}</div>
      <button
        onClick={onRetry}
        className="btn-green"
        style={{
          border: "none",
          cursor: "pointer",
          background: C.green,
          color: C.page,
          fontFamily: "inherit",
          fontWeight: 600,
          fontSize: 14,
          padding: "10px 18px",
          borderRadius: 12,
        }}
      >
        Try again
      </button>
    </div>
  );
}
