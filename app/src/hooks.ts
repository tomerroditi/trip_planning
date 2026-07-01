// Small shared hooks.

import { useEffect, useState } from "react";

// Reactive CSS media query. SSR-safe-ish (defaults to false before mount).
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && "matchMedia" in window ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

// The breakpoint below which we switch to the phone layout (bottom nav, single
// column). 820px keeps small tablets on the desktop shell.
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 820px)");
}
