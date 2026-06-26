// Loads the trip and keeps it live: polls every 12s, refetches when the window
// regains focus/visibility, and exposes a manual refresh (spec §9).

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTrip, tripIdFromUrl } from "./api";
import type { TripState } from "./types";

const POLL_MS = 12000;

export interface UseTrip {
  state: TripState | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  lastUpdated: number | null;
  refresh: () => void;
}

export function useTrip(): UseTrip {
  const tripId = useRef<string | null>(tripIdFromUrl());
  const [state, setState] = useState<TripState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchTrip(tripId.current);
      setState(data);
      setError(null);
      setLastUpdated(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load trip");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const iv = window.setInterval(() => void load(), POLL_MS);
    const onFocus = () => void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { state, error, loading, refreshing, lastUpdated, refresh: () => void load() };
}
