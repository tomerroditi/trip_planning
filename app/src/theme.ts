// Palette, status styles and document-kind badges, ported from the design.

import type { DocumentKind, StayStatus } from "./types";

export const C = {
  page: "#F4EFE4",
  panel: "#FBF8F1",
  card: "#FFFFFF",
  border: "#E6E0D2",
  borderSoft: "#ECE6D7",
  green: "#2F5D3A",
  greenHover: "#274d31",
  greenMid: "#5C8A4E",
  ink: "#283228",
  ink2: "#3A4337",
  muted: "#7A8176",
  muted2: "#8A9182",
  muted3: "#9AA08F",
  muted4: "#6E7568",
  muted5: "#5A6357",
  track: "#E4DECE",
};

export const FREDOKA = "'Fredoka', system-ui, sans-serif";
export const DM = "'DM Sans', system-ui, sans-serif";

export function statusStyle(status: StayStatus | string): { fg: string; bg: string } {
  if (status === "Booked") return { fg: "#2F6B3E", bg: "#E4F0E4" };
  if (status === "Pending") return { fg: "#A9791C", bg: "#F6ECD6" };
  return { fg: "#B0503A", bg: "#F6E2DA" }; // To book
}

export const KIND: Record<DocumentKind, { code: string; fg: string; bg: string }> = {
  Ticket: { code: "TKT", fg: "#A8744A", bg: "#F4ECDD" },
  PDF: { code: "PDF", fg: "#B0503A", bg: "#F6E2DA" },
  Link: { code: "WEB", fg: "#4E7E97", bg: "#E7EEF2" },
  Image: { code: "IMG", fg: "#5C8A4E", bg: "#EAF0E2" },
  Doc: { code: "DOC", fg: "#7D93A8", bg: "#ECEEF3" },
};

export const CAT_OPTIONS = ["Flights", "Stays", "Activities", "Info", "Admin"];

// Format a money amount in the trip currency, design-style ("NZ$1,234").
export function fmtMoney(n: number, currency = "NZD"): string {
  const prefix = currency === "NZD" ? "NZ$" : currency === "USD" ? "$" : currency + " ";
  return prefix + Math.round(n).toLocaleString("en-US");
}
