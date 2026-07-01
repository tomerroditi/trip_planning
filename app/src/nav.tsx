// Single source of truth for the app's tabs — used by the desktop sidebar and
// the mobile bottom nav so they can't drift. `primary` marks the tabs that get
// a slot in the mobile bottom bar; the rest live behind the "More" sheet.

import type { ReactNode } from "react";

export type Tab =
  | "overview"
  | "today"
  | "itinerary"
  | "map"
  | "budget"
  | "stays"
  | "checklist"
  | "explore"
  | "docs";

export interface NavItem {
  tab: Tab;
  label: string; // sidebar / sheet label
  short: string; // bottom-bar label
  icon: ReactNode;
  primary?: boolean; // shown in the mobile bottom bar
}

const s = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;

export const NAV: NavItem[] = [
  {
    tab: "overview",
    label: "Overview",
    short: "Home",
    icon: (
      <svg {...s}>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    tab: "today",
    label: "Today",
    short: "Today",
    primary: true,
    icon: (
      <svg {...s}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
      </svg>
    ),
  },
  {
    tab: "itinerary",
    label: "Itinerary",
    short: "Plan",
    primary: true,
    icon: (
      <svg {...s}>
        <circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
        <line x1="9" y1="6" x2="20" y2="6" />
        <line x1="9" y1="12" x2="20" y2="12" />
        <line x1="9" y1="18" x2="20" y2="18" />
      </svg>
    ),
  },
  {
    tab: "map",
    label: "Map & route",
    short: "Map",
    primary: true,
    icon: (
      <svg {...s}>
        <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.4" />
      </svg>
    ),
  },
  {
    tab: "budget",
    label: "Budget",
    short: "Budget",
    primary: true,
    icon: (
      <svg {...s}>
        <circle cx="9" cy="12" r="5.5" />
        <path d="M14 7.2a5.5 5.5 0 0 1 0 9.6" />
      </svg>
    ),
  },
  {
    tab: "stays",
    label: "Stays",
    short: "Stays",
    icon: (
      <svg {...s}>
        <path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
        <line x1="3" y1="18" x2="3" y2="21" />
        <line x1="21" y1="18" x2="21" y2="21" />
        <path d="M7 11V8.5A1.5 1.5 0 0 1 8.5 7h7A1.5 1.5 0 0 1 17 8.5V11" />
      </svg>
    ),
  },
  {
    tab: "checklist",
    label: "Checklist",
    short: "List",
    icon: (
      <svg {...s}>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
      </svg>
    ),
  },
  {
    tab: "explore",
    label: "Explore",
    short: "Explore",
    icon: (
      <svg {...s}>
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    tab: "docs",
    label: "Docs & links",
    short: "Docs",
    icon: (
      <svg {...s}>
        <path d="M14 3v5h5" />
        <path d="M6 3h8l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="16.5" x2="13" y2="16.5" />
      </svg>
    ),
  },
];
