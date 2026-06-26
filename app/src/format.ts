// Small presentation helpers for dates and times.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parse(iso: string): { d: number; m: number; y: number } | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { d, m, y };
}

// "4 – 17 Oct 2026" (same month) or "28 Sep – 3 Oct 2026" (spanning months).
export function dateRangeLabel(start: string | null, end: string | null): string {
  const a = start ? parse(start) : null;
  const b = end ? parse(end) : null;
  if (a && b) {
    if (a.m === b.m && a.y === b.y) return `${a.d} – ${b.d} ${MONTHS[a.m - 1]} ${b.y}`;
    if (a.y === b.y) return `${a.d} ${MONTHS[a.m - 1]} – ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
    return `${a.d} ${MONTHS[a.m - 1]} ${a.y} – ${b.d} ${MONTHS[b.m - 1]} ${b.y}`;
  }
  if (a) return `${a.d} ${MONTHS[a.m - 1]} ${a.y}`;
  return "";
}

export function totalDays(start: string | null, end: string | null): number {
  if (!start || !end) return 0;
  const a = parse(start);
  const b = parse(end);
  if (!a || !b) return 0;
  const ms = Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
  return Math.round(ms / 86400000) + 1; // inclusive
}

export function timeAgo(ts: number | null): string {
  if (!ts) return "—";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}
