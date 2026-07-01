// Loads the trip and keeps it live: polls every 12s, refetches when the window
// regains focus/visibility, and exposes a manual refresh (spec §9). Also
// supports optimistic in-app edits via apply().

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTrip, tripIdFromUrl } from "./api";
import type { TripState } from "./types";

const POLL_MS = 12000;

export interface UseTrip {
  state: TripState | null;
  tripId: string | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  lastUpdated: number | null;
  refresh: () => void;
  // Optimistically apply `optimistic(state)` locally, then run `request` (a
  // write call that resolves to the fresh server state). On failure, reload to
  // revert. Returns the request promise so callers can await/catch.
  apply: (optimistic: (s: TripState) => TripState, request: () => Promise<{ state: TripState }>) => Promise<void>;
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

  const apply = useCallback(
    async (optimistic: (s: TripState) => TripState, request: () => Promise<{ state: TripState }>) => {
      setState((prev) => (prev ? optimistic(prev) : prev));
      try {
        const { state: fresh } = await request();
        setState(fresh);
        setLastUpdated(Date.now());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save change");
        void load(); // revert to server truth
      }
    },
    [load],
  );

  return {
    state,
    tripId: tripId.current,
    error,
    loading,
    refreshing,
    lastUpdated,
    refresh: () => void load(),
    apply,
  };
}
