import { useState } from "react";
import { useTrip } from "./useTrip";
import { C, FREDOKA } from "./theme";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Overview } from "./components/Overview";
import { Itinerary } from "./components/Itinerary";
import { MapRoute } from "./components/MapRoute";
import { Budget } from "./components/Budget";
import { Stays } from "./components/Stays";
import { Docs } from "./components/Docs";

export type Tab = "overview" | "itinerary" | "map" | "budget" | "stays" | "docs";

export default function App() {
  const { state, error, loading, refreshing, lastUpdated, refresh } = useTrip();
  const [tab, setTab] = useState<Tab>("overview");

  if (loading && !state) return <Splash />;
  if (!state) return <ErrorScreen error={error ?? "No trip found."} onRetry={refresh} />;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: C.page,
        color: C.ink,
        overflow: "hidden",
      }}
    >
      <Sidebar state={state} tab={tab} setTab={setTab} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header
          state={state}
          tab={tab}
          setTab={setTab}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
        />
        <main style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
          {tab === "overview" && <Overview state={state} setTab={setTab} />}
          {tab === "itinerary" && <Itinerary state={state} />}
          {tab === "map" && <MapRoute state={state} />}
          {tab === "budget" && <Budget state={state} />}
          {tab === "stays" && <Stays state={state} />}
          {tab === "docs" && <Docs state={state} />}
        </main>
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: C.page,
      }}
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
      style={{
        height: "100vh",
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
