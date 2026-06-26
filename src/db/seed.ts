// The seed trip — New Zealand South Island, October 2026 ("Aotearoa Road
// Trip"). This is the single source of truth for the seed: it is used both to
// generate seed/seed.sql (scripts/gen-seed.ts) and to seed an empty database
// programmatically (ensureSeed in queries.ts), and it is covered by tests.
//
// The data mirrors the Kiwiroute design so the app has a complete trip to
// render on first run. Coordinates for known places are resolved from the
// shared gazetteer; Claude can override any of them later via MCP.

import { resolveLoc } from "../../shared/geo";

export const TRIP = {
  id: "nz-south-island",
  name: "Aotearoa Road Trip",
  start_date: "2026-10-04",
  end_date: "2026-10-17",
  travellers: "Shir & Tomer",
  budget_cap: 10500,
  currency: "NZD",
};

interface SeedItem {
  t: string;
  tag?: string;
}
interface SeedDay {
  label: string;
  date_short: string;
  title: string;
  location: string;
  drive_kind: "DRIVE" | "FLY" | "";
  drive_label: string;
  drive_meta: string;
  items: SeedItem[];
}
interface SeedSegment {
  name: string;
  color: string;
  soft: string;
  day_range: string;
  base: string;
  nights_label: string;
  summary: string;
  days: SeedDay[];
}

const SEGMENTS: SeedSegment[] = [
  {
    name: "Christchurch & the Lakes",
    color: "#4E7E97",
    soft: "#E7EEF2",
    day_range: "Days 1–3",
    base: "Christchurch · Tekapo · Aoraki",
    nights_label: "3 days · 2 nights",
    summary:
      "Land, grab the campervan and ease into turquoise lakes and the Southern Alps.",
    days: [
      {
        label: "Day 1",
        date_short: "Sat 4 Oct",
        title: "Land in Christchurch",
        location: "Christchurch",
        drive_kind: "FLY",
        drive_label: "Land at Christchurch Airport",
        drive_meta: "pick up the campervan",
        items: [
          { t: "Collect campervan & supermarket run", tag: "Setup" },
          { t: "Riverside Market for lunch", tag: "Eat" },
          { t: "Wander the Botanic Gardens" },
        ],
      },
      {
        label: "Day 2",
        date_short: "Sun 5 Oct",
        title: "Tekapo & the night sky",
        location: "Lake Tekapo",
        drive_kind: "DRIVE",
        drive_label: "Christchurch → Tekapo",
        drive_meta: "2h 45m · 227 km",
        items: [
          { t: "Church of the Good Shepherd", tag: "See" },
          { t: "Mt John summit walk", tag: "Walk" },
          { t: "Dark Sky stargazing tour", tag: "Book" },
        ],
      },
      {
        label: "Day 3",
        date_short: "Mon 6 Oct",
        title: "Aoraki / Mt Cook",
        location: "Aoraki / Mt Cook",
        drive_kind: "DRIVE",
        drive_label: "Tekapo → Mt Cook Village",
        drive_meta: "1h 5m · 105 km",
        items: [
          { t: "Hooker Valley Track (3 hrs)", tag: "Walk" },
          { t: "Tasman Glacier viewpoint" },
          { t: "Sir Edmund Hillary Centre" },
        ],
      },
    ],
  },
  {
    name: "Central Otago",
    color: "#5C8A4E",
    soft: "#EAF0E2",
    day_range: "Days 4–6",
    base: "Wanaka · Queenstown · Glenorchy",
    nights_label: "3 days · 3 nights",
    summary: "Lakeside towns, mountain passes and the adventure capital.",
    days: [
      {
        label: "Day 4",
        date_short: "Tue 7 Oct",
        title: "Lake Wanaka",
        location: "Wanaka",
        drive_kind: "DRIVE",
        drive_label: "Mt Cook → Wanaka",
        drive_meta: "2h 40m · 200 km",
        items: [
          { t: "#ThatWanakaTree at golden hour", tag: "See" },
          { t: "Rippon vineyard tasting", tag: "Eat" },
          { t: "Roys Peak sunrise (optional)", tag: "Walk" },
        ],
      },
      {
        label: "Day 5",
        date_short: "Wed 8 Oct",
        title: "Into Queenstown",
        location: "Queenstown",
        drive_kind: "DRIVE",
        drive_label: "Wanaka → Queenstown",
        drive_meta: "1h 10m · 70 km · Crown Range",
        items: [
          { t: "Skyline Gondola & luge", tag: "Do" },
          { t: "Fergburger (worth the queue)", tag: "Eat" },
          { t: "Sunset on the lakefront" },
        ],
      },
      {
        label: "Day 6",
        date_short: "Thu 9 Oct",
        title: "Glenorchy day trip",
        location: "Glenorchy",
        drive_kind: "DRIVE",
        drive_label: "Queenstown → Glenorchy",
        drive_meta: "45m · 46 km",
        items: [
          { t: "Dart River jet boat", tag: "Book" },
          { t: "Paradise & Rings filming spots", tag: "See" },
          { t: "Glenorchy lagoon boardwalk", tag: "Walk" },
        ],
      },
    ],
  },
  {
    name: "Fiordland",
    color: "#3E6B4E",
    soft: "#E5EDE7",
    day_range: "Days 7–9",
    base: "Te Anau · Milford Sound",
    nights_label: "3 days · 2 nights",
    summary:
      "The drive to Milford is the show — waterfalls, tunnels and mirror lakes.",
    days: [
      {
        label: "Day 7",
        date_short: "Fri 10 Oct",
        title: "Te Anau",
        location: "Te Anau",
        drive_kind: "DRIVE",
        drive_label: "Queenstown → Te Anau",
        drive_meta: "2h 10m · 170 km",
        items: [
          { t: "Glowworm caves boat tour", tag: "Book" },
          { t: "Stock up — last big supermarket", tag: "Setup" },
          { t: "Lakeside dinner" },
        ],
      },
      {
        label: "Day 8",
        date_short: "Sat 11 Oct",
        title: "Milford Sound",
        location: "Milford Sound",
        drive_kind: "DRIVE",
        drive_label: "Te Anau → Milford",
        drive_meta: "2h · 119 km",
        items: [
          { t: "Milford Sound nature cruise", tag: "Book" },
          { t: "Mirror Lakes & Homer Tunnel stops", tag: "See" },
          { t: "The Chasm short walk", tag: "Walk" },
        ],
      },
      {
        label: "Day 9",
        date_short: "Sun 12 Oct",
        title: "Slow day in Te Anau",
        location: "Te Anau",
        drive_kind: "",
        drive_label: "",
        drive_meta: "",
        items: [
          { t: "Kepler Track day section", tag: "Walk" },
          { t: "Laundry & campervan reset", tag: "Setup" },
          { t: "Plan the West Coast leg" },
        ],
      },
    ],
  },
  {
    name: "West Coast Glaciers",
    color: "#7D93A8",
    soft: "#ECEEF3",
    day_range: "Days 10–12",
    base: "Fox · Franz Josef · Hokitika",
    nights_label: "3 days · 3 nights",
    summary:
      "A big Haast Pass drive day, rewarded with glaciers and wild rainforest.",
    days: [
      {
        label: "Day 10",
        date_short: "Mon 13 Oct",
        title: "Haast Pass to the glaciers",
        location: "Fox Glacier",
        drive_kind: "DRIVE",
        drive_label: "Te Anau → Fox Glacier",
        drive_meta: "6h 30m · 520 km · big day",
        items: [
          { t: "Blue Pools & Roaring Billy stops", tag: "See" },
          { t: "Lake Matheson mirror sunset", tag: "Walk" },
          { t: "Early night — long drive done" },
        ],
      },
      {
        label: "Day 11",
        date_short: "Tue 14 Oct",
        title: "Franz Josef",
        location: "Franz Josef",
        drive_kind: "DRIVE",
        drive_label: "Fox → Franz Josef",
        drive_meta: "30m · 24 km",
        items: [
          { t: "Heli-hike on the glacier", tag: "Book" },
          { t: "Glacier hot pools soak", tag: "Do" },
          { t: "West Coast whitebait dinner", tag: "Eat" },
        ],
      },
      {
        label: "Day 12",
        date_short: "Wed 15 Oct",
        title: "Hokitika",
        location: "Hokitika",
        drive_kind: "DRIVE",
        drive_label: "Franz Josef → Hokitika",
        drive_meta: "1h 30m · 135 km",
        items: [
          { t: "Hokitika Gorge turquoise water", tag: "See" },
          { t: "Driftwood beach sign", tag: "See" },
          { t: "Greenstone (pounamu) browsing" },
        ],
      },
    ],
  },
  {
    name: "Coast to Christchurch",
    color: "#C2873F",
    soft: "#F4ECDD",
    day_range: "Days 13–14",
    base: "Arthur's Pass · Christchurch",
    nights_label: "2 days · 1 night",
    summary: "Over the alps through Arthur's Pass and back to where it began.",
    days: [
      {
        label: "Day 13",
        date_short: "Thu 16 Oct",
        title: "Arthur's Pass",
        location: "Arthur's Pass",
        drive_kind: "DRIVE",
        drive_label: "Hokitika → Arthur's Pass",
        drive_meta: "1h 30m · 100 km",
        items: [
          { t: "Devils Punchbowl Falls walk", tag: "Walk" },
          { t: "Watch for cheeky kea", tag: "See" },
          { t: "Otira Viaduct lookout" },
        ],
      },
      {
        label: "Day 14",
        date_short: "Fri 17 Oct",
        title: "Back to Christchurch",
        location: "Christchurch",
        drive_kind: "DRIVE",
        drive_label: "Arthur's Pass → Christchurch",
        drive_meta: "2h · 150 km",
        items: [
          { t: "Return the campervan", tag: "Setup" },
          { t: "Last flat white in the city", tag: "Eat" },
          { t: "Fly home" },
        ],
      },
    ],
  },
];

// Items pre-ticked on first run (segment-day-item indices), mirroring the
// design's seed so the progress bar starts partway along.
const DONE = new Set(["0-0-0", "0-0-1", "0-0-2", "0-1-0", "0-1-1", "1-0-0"]);

interface SeedStay {
  seg: string;
  name: string;
  location: string;
  dates: string;
  nights: number;
  cost: number;
  status: "Booked" | "Pending" | "To book";
  conf?: string;
  check_in?: string;
  check_out?: string;
}

const STAYS: SeedStay[] = [
  { seg: "Christchurch & the Lakes", name: "The George", location: "Christchurch", dates: "4 Oct", nights: 1, cost: 245, status: "Booked", conf: "GEO-88421", check_in: "2026-10-04", check_out: "2026-10-05" },
  { seg: "Christchurch & the Lakes", name: "Tekapo Lakefront Apts", location: "Lake Tekapo", dates: "5 Oct", nights: 1, cost: 210, status: "Booked", conf: "TLA-2207", check_in: "2026-10-05", check_out: "2026-10-06" },
  { seg: "Christchurch & the Lakes", name: "The Hermitage Hotel", location: "Aoraki / Mt Cook", dates: "6 Oct", nights: 1, cost: 320, status: "Pending", check_in: "2026-10-06", check_out: "2026-10-07" },
  { seg: "Central Otago", name: "Edgewater Resort", location: "Wanaka", dates: "7 Oct", nights: 1, cost: 265, status: "Booked", conf: "EDG-5510", check_in: "2026-10-07", check_out: "2026-10-08" },
  { seg: "Central Otago", name: "Hidden Lodge", location: "Queenstown", dates: "8–9 Oct", nights: 2, cost: 540, status: "Booked", conf: "HLQ-7731", check_in: "2026-10-08", check_out: "2026-10-10" },
  { seg: "Fiordland", name: "Fiordland Lakeview Motel", location: "Te Anau", dates: "10 & 12 Oct", nights: 2, cost: 300, status: "To book", check_in: "2026-10-10" },
  { seg: "West Coast Glaciers", name: "Te Weheka Boutique Hotel", location: "Fox Glacier", dates: "13 Oct", nights: 1, cost: 280, status: "Pending", check_in: "2026-10-13", check_out: "2026-10-14" },
  { seg: "West Coast Glaciers", name: "58 On Cron Motel", location: "Franz Josef", dates: "14 Oct", nights: 1, cost: 230, status: "Booked", conf: "FJ-3390", check_in: "2026-10-14", check_out: "2026-10-15" },
  { seg: "West Coast Glaciers", name: "Beachfront Hotel", location: "Hokitika", dates: "15 Oct", nights: 1, cost: 215, status: "To book", check_in: "2026-10-15", check_out: "2026-10-16" },
  { seg: "Coast to Christchurch", name: "Arthur's Pass Lodge", location: "Arthur's Pass", dates: "16 Oct", nights: 1, cost: 190, status: "Pending", check_in: "2026-10-16", check_out: "2026-10-17" },
];

const CATS = [
  { name: "International flights", planned: 3400, actual: 3400, color: "#4E7E97" },
  { name: "Accommodation", planned: 2520, actual: 1980, color: "#5C8A4E" },
  { name: "Campervan & fuel", planned: 1650, actual: 1650, color: "#3E6B4E" },
  { name: "Activities & tours", planned: 1180, actual: 760, color: "#C2873F" },
  { name: "Food & drink", planned: 980, actual: 540, color: "#B06A4A" },
  { name: "Misc & buffer", planned: 300, actual: 120, color: "#8A8F80" },
];

const DOCS = [
  { id: "d1", title: "Flights — LAX → CHC (Air NZ)", sub: "Booking NZ-7K2QP9 · departs 3 Oct", kind: "Ticket", cat: "Flights", url: "" },
  { id: "d2", title: "Return — CHC → LAX (Air NZ)", sub: "Booking NZ-7K2QP9 · departs 17 Oct", kind: "Ticket", cat: "Flights", url: "" },
  { id: "d3", title: "Maui campervan — rental agreement", sub: "Pickup CHC 4 Oct · MAUI-44120", kind: "PDF", cat: "Admin", url: "" },
  { id: "d4", title: "Hidden Lodge — confirmation", sub: "Queenstown · HLQ-7731", kind: "PDF", cat: "Stays", url: "" },
  { id: "d5", title: "The George — confirmation", sub: "Christchurch · GEO-88421", kind: "PDF", cat: "Stays", url: "" },
  { id: "d6", title: "Milford Sound cruise — e-ticket", sub: "RealNZ · 11 Oct, 1:00pm", kind: "Ticket", cat: "Activities", url: "" },
  { id: "d7", title: "Franz Josef heli-hike — voucher", sub: "14 Oct · weather dependent", kind: "PDF", cat: "Activities", url: "" },
  { id: "d8", title: "DOC — Kepler Track day guide", sub: "doc.govt.nz", kind: "Link", cat: "Info", url: "https://www.doc.govt.nz" },
  { id: "d9", title: "Driving in NZ — keep left & one-lane bridges", sub: "nzta.govt.nz", kind: "Link", cat: "Info", url: "https://www.nzta.govt.nz" },
  { id: "d10", title: "Travel insurance policy", sub: "Cover-More · POL-99812", kind: "PDF", cat: "Admin", url: "" },
  { id: "d11", title: "NZeTA + passport scans", sub: "entry requirement", kind: "Image", cat: "Admin", url: "" },
];

// Bookings (flights/activities) — the spec's bookings table. Geo-located ones
// add pins to the map; the flights anchor the budget and docs.
const BOOKINGS = [
  { type: "flight", title: "LAX → CHC (Air NZ)", date: "2026-10-03", time: "21:40", location: "Christchurch", confirmation: "NZ-7K2QP9", cost: 1700, geo: true },
  { type: "flight", title: "CHC → LAX (Air NZ)", date: "2026-10-17", time: "19:25", location: "Christchurch", confirmation: "NZ-7K2QP9", cost: 1700, geo: false },
  { type: "activity", title: "Milford Sound nature cruise", date: "2026-10-11", time: "13:00", location: "Milford Sound", confirmation: "RNZ-55021", cost: 180, geo: true },
  { type: "activity", title: "Franz Josef heli-hike", date: "2026-10-14", time: "09:30", location: "Franz Josef", confirmation: "FJH-7741", cost: 460, geo: true },
];

const NOTES = [
  { text: "Keep left! One-lane bridges give way per the arrows. Petrol is sparse past Te Anau — fill up before the Milford road.", date: null as string | null },
  { text: "Milford cruise weather can change fast — RealNZ rebooks free if it's a washout.", date: "2026-10-11" },
];

// ---------------------------------------------------------------------------
// Expansion → typed rows. Deterministic ids keep re-seeding idempotent.
// ---------------------------------------------------------------------------

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export interface SeedRows {
  trip: Record<string, unknown>;
  segments: Record<string, unknown>[];
  days: Record<string, unknown>[];
  plan_items: Record<string, unknown>[];
  accommodations: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  budget_categories: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  notes: Record<string, unknown>[];
}

export function buildSeedRows(tripId: string = TRIP.id): SeedRows {
  const segIdByName: Record<string, string> = {};
  const segments: Record<string, unknown>[] = [];
  const days: Record<string, unknown>[] = [];
  const plan_items: Record<string, unknown>[] = [];
  let dayPos = 0;

  SEGMENTS.forEach((seg, si) => {
    const segId = `seg_${si}`;
    segIdByName[seg.name] = segId;
    segments.push({
      id: segId,
      trip_id: tripId,
      position: si,
      name: seg.name,
      color: seg.color,
      soft_color: seg.soft,
      day_range: seg.day_range,
      base: seg.base,
      nights_label: seg.nights_label,
      summary: seg.summary,
    });

    seg.days.forEach((d, di) => {
      dayPos += 1;
      const dayId = `day_${dayPos}`;
      const date = addDays(TRIP.start_date, dayPos - 1);
      const coords = resolveLoc(d.location);
      days.push({
        id: dayId,
        trip_id: tripId,
        segment_id: segId,
        date,
        position: dayPos,
        label: d.label,
        date_short: d.date_short,
        title: d.title,
        location_name: d.location,
        lat: coords ? coords[0] : null,
        lng: coords ? coords[1] : null,
        drive_kind: d.drive_kind,
        drive_label: d.drive_label,
        drive_meta: d.drive_meta,
        notes: null,
      });

      d.items.forEach((it, ii) => {
        plan_items.push({
          id: `item_${dayPos}_${ii}`,
          trip_id: tripId,
          day_id: dayId,
          date,
          position: ii,
          title: it.t,
          type: "",
          tag: it.tag || "",
          done: DONE.has(`${si}-${di}-${ii}`) ? 1 : 0,
          lat: null,
          lng: null,
          start_time: null,
          end_time: null,
          notes: null,
          linked_booking_id: null,
          linked_accommodation_id: null,
        });
      });
    });
  });

  const accommodations = STAYS.map((s, i) => {
    const coords = resolveLoc(s.location);
    return {
      id: `acc_${i}`,
      trip_id: tripId,
      segment_id: segIdByName[s.seg] ?? null,
      name: s.name,
      location_name: s.location,
      lat: coords ? coords[0] : null,
      lng: coords ? coords[1] : null,
      check_in: s.check_in ?? null,
      check_out: s.check_out ?? null,
      dates_label: s.dates,
      nights: s.nights,
      booking_ref: s.conf ?? null,
      cost: s.cost,
      currency: TRIP.currency,
      status: s.status,
      url: null,
      notes: null,
    };
  });

  const bookings = BOOKINGS.map((b, i) => {
    const coords = b.geo ? resolveLoc(b.location) : null;
    return {
      id: `book_${i}`,
      trip_id: tripId,
      type: b.type,
      title: b.title,
      date: b.date,
      time: b.time,
      location_name: b.location,
      lat: coords ? coords[0] : null,
      lng: coords ? coords[1] : null,
      confirmation: b.confirmation,
      cost: b.cost,
      currency: TRIP.currency,
      url: null,
      notes: null,
    };
  });

  const budget_categories = CATS.map((c, i) => ({
    id: `cat_${i}`,
    trip_id: tripId,
    position: i,
    name: c.name,
    color: c.color,
    planned: c.planned,
    actual: c.actual,
  }));

  const documents = DOCS.map((d) => ({
    id: `doc_${d.id}`,
    trip_id: tripId,
    title: d.title,
    subtitle: d.sub,
    kind: d.kind,
    category: d.cat,
    url: d.url || null,
    created_at: TRIP.start_date + " 00:00:00",
  }));

  const notes = NOTES.map((n, i) => ({
    id: `note_${i}`,
    trip_id: tripId,
    date: n.date,
    text: n.text,
    created_at: TRIP.start_date + " 00:00:00",
  }));

  const trip = {
    id: tripId,
    name: TRIP.name,
    start_date: TRIP.start_date,
    end_date: TRIP.end_date,
    travellers: TRIP.travellers,
    budget_cap: TRIP.budget_cap,
    currency: TRIP.currency,
    created_at: TRIP.start_date + " 00:00:00",
  };

  return {
    trip,
    segments,
    days,
    plan_items,
    accommodations,
    bookings,
    budget_categories,
    documents,
    notes,
  };
}

// Order matters for FK-friendly insertion / deletion.
export const SEED_TABLES: (keyof SeedRows)[] = [
  "trip",
  "segments",
  "days",
  "plan_items",
  "accommodations",
  "bookings",
  "budget_categories",
  "documents",
  "notes",
];
