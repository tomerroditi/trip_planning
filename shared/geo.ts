// A small offline gazetteer for the South Island (and a few NZ landmarks), plus
// name-normalisation helpers. Used two ways:
//   - at seed time, to resolve coordinates for known places (src/db/seed.ts)
//   - in the app, as a fallback so a day/stay whose location Claude didn't geo-
//     locate still gets a pin when its name is recognised (app map).
//
// Coordinates Claude supplies via MCP always win; this is only a fallback.

export type LatLng = [number, number];

export const GAZ: Record<string, LatLng> = {
  christchurch: [-43.532, 172.6306],
  "lake tekapo": [-44.0049, 170.4787],
  tekapo: [-44.0049, 170.4787],
  "aoraki mt cook": [-43.734, 170.0964],
  "mt cook": [-43.734, 170.0964],
  "mount cook": [-43.734, 170.0964],
  aoraki: [-43.734, 170.0964],
  wanaka: [-44.7032, 169.1321],
  "lake wanaka": [-44.7032, 169.1321],
  queenstown: [-45.0312, 168.6626],
  glenorchy: [-44.847, 168.3826],
  arrowtown: [-44.939, 168.833],
  cromwell: [-45.0383, 169.198],
  "te anau": [-45.4144, 167.718],
  "milford sound": [-44.6414, 167.8974],
  milford: [-44.6414, 167.8974],
  "doubtful sound": [-45.333, 167.167],
  "fox glacier": [-43.4646, 170.0176],
  "franz josef": [-43.3886, 170.183],
  hokitika: [-42.7167, 170.9667],
  greymouth: [-42.45, 171.21],
  punakaiki: [-42.1148, 171.3344],
  haast: [-43.881, 169.042],
  "arthurs pass": [-42.945, 171.5636],
  "hanmer springs": [-42.523, 172.828],
  kaikoura: [-42.4, 173.68],
  akaroa: [-43.804, 172.968],
  twizel: [-44.2588, 170.0964],
  omarama: [-44.486, 169.97],
  oamaru: [-45.0966, 170.9714],
  timaru: [-44.3904, 171.2373],
  geraldine: [-44.093, 171.241],
  methven: [-43.633, 171.65],
  dunedin: [-45.8788, 170.5028],
  invercargill: [-46.4132, 168.3538],
  gore: [-46.1028, 168.944],
  nelson: [-41.2706, 173.284],
  picton: [-41.2906, 174.001],
  blenheim: [-41.5134, 173.9612],
  auckland: [-36.8485, 174.7633],
  wellington: [-41.2865, 174.7762],
  rotorua: [-38.1368, 176.2497],
  taupo: [-38.6857, 176.0702],
  napier: [-39.4928, 176.912],
  "stewart island": [-46.9, 168.12],
};

export const PLACE_NAMES = [
  "Christchurch",
  "Lake Tekapo",
  "Twizel",
  "Aoraki / Mt Cook",
  "Omarama",
  "Wanaka",
  "Queenstown",
  "Glenorchy",
  "Arrowtown",
  "Cromwell",
  "Te Anau",
  "Milford Sound",
  "Doubtful Sound",
  "Fox Glacier",
  "Franz Josef",
  "Hokitika",
  "Greymouth",
  "Punakaiki",
  "Haast",
  "Arthur's Pass",
  "Hanmer Springs",
  "Kaikoura",
  "Akaroa",
  "Oamaru",
  "Dunedin",
  "Invercargill",
  "Nelson",
  "Picton",
];

export function normLoc(s: string | null | undefined): string {
  return (s || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveLoc(name: string | null | undefined): LatLng | null {
  const k = normLoc(name);
  if (!k) return null;
  if (GAZ[k]) return GAZ[k];
  const k2 = k.replace(/^lake /, "");
  if (GAZ[k2]) return GAZ[k2];
  const first = k.split(" ")[0];
  if (GAZ[first]) return GAZ[first];
  return null;
}
