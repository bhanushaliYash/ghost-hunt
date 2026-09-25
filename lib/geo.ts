/**
 * Country centroids for the threat map. We plot a public country code,
 * not a street address, and we do not ask the browser for geolocation.
 */

const CENTROIDS: Record<string, [number, number]> = {
  US: [39.8, -98.5],
  CA: [56.1, -106.3],
  MX: [23.6, -102.5],
  BR: [-14.2, -51.9],
  AR: [-38.4, -63.6],
  GB: [54.0, -2.5],
  IE: [53.1, -8.0],
  FR: [46.2, 2.2],
  DE: [51.2, 10.4],
  NL: [52.1, 5.3],
  BE: [50.5, 4.5],
  LU: [49.8, 6.1],
  ES: [40.5, -3.7],
  PT: [39.4, -8.2],
  IT: [41.9, 12.6],
  CH: [46.8, 8.2],
  AT: [47.5, 14.6],
  SE: [60.1, 18.6],
  NO: [60.5, 8.5],
  FI: [61.9, 25.7],
  DK: [56.3, 9.5],
  PL: [51.9, 19.1],
  CZ: [49.8, 15.5],
  UA: [48.4, 31.2],
  RO: [45.9, 24.9],
  BG: [42.7, 25.5],
  RU: [61.5, 105.3],
  TR: [39.0, 35.2],
  CN: [35.9, 104.2],
  HK: [22.3, 114.2],
  TW: [23.7, 121.0],
  JP: [36.2, 138.3],
  KR: [35.9, 127.8],
  IN: [20.6, 79.0],
  SG: [1.35, 103.8],
  AU: [-25.3, 133.8],
  NZ: [-40.9, 174.9],
  VN: [14.1, 108.3],
  ID: [-0.8, 113.9],
  TH: [15.9, 100.9],
  MY: [4.2, 101.9],
  PH: [12.9, 121.8],
  IR: [32.4, 53.7],
  PK: [30.4, 69.3],
  IL: [31.0, 34.9],
  AE: [23.4, 53.8],
  ZA: [-30.6, 22.9],
  NG: [9.1, 8.7],
  EG: [26.8, 30.8],
  KE: [0.02, 37.9],
};

const NAMES: Record<string, string> = {
  "united states": "US",
  usa: "US",
  "united kingdom": "GB",
  uk: "GB",
  germany: "DE",
  france: "FR",
  netherlands: "NL",
  russia: "RU",
  china: "CN",
  india: "IN",
  brazil: "BR",
  ukraine: "UA",
  canada: "CA",
  australia: "AU",
  japan: "JP",
  "south korea": "KR",
  singapore: "SG",
};

export function countryCode(raw: string | null | undefined): string {
  if (!raw) return "";
  const text = raw.trim();
  if (/^[A-Za-z]{2}$/.test(text)) return text.toUpperCase();
  return NAMES[text.toLowerCase()] ?? "";
}

export function centroid(code: string): [number, number] | null {
  return CENTROIDS[code] ?? null;
}

/** Spread points that share a country so markers do not stack into one dot. */
export function jitter(seed: string, lat: number, lng: number): [number, number] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const dLat = ((hash % 100) / 50 - 1) * 1.4;
  const dLng = (((hash >> 8) % 100) / 50 - 1) * 1.8;
  return [lat + dLat, lng + dLng];
}
