import type { Coordinates } from '../types';

const EARTH_RADIUS_M = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function haversine(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function bearing(a: Coordinates, b: Coordinates): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const CARDINALS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
];

export function cardinal(bearingDegrees: number): string {
  const normalized = ((bearingDegrees % 360) + 360) % 360;
  return CARDINALS[Math.round(normalized / 22.5) % 16];
}

function isValidCoord(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
  );
}

export function parseCoordinates(input: string): Coordinates | null {
  if (!input) return null;
  const cleaned = input.trim();

  const decimal = cleaned.match(
    /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/,
  );
  if (decimal) {
    const lat = parseFloat(decimal[1]);
    const lon = parseFloat(decimal[2]);
    if (isValidCoord(lat, lon)) return { lat, lon };
  }

  const dmsPattern =
    /(\d+)\s*[°d]\s*(\d+)\s*['′m]\s*(\d+(?:\.\d+)?)\s*["″s]?\s*([NSEW])/gi;
  const matches = [...cleaned.matchAll(dmsPattern)];
  if (matches.length === 2) {
    const parts = matches.map((m) => {
      const deg = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const sec = parseFloat(m[3]);
      const hem = m[4].toUpperCase();
      let val = deg + min / 60 + sec / 3600;
      if (hem === 'S' || hem === 'W') val = -val;
      return { val, hem };
    });
    const latEntry = parts.find((p) => p.hem === 'N' || p.hem === 'S');
    const lonEntry = parts.find((p) => p.hem === 'E' || p.hem === 'W');
    if (latEntry && lonEntry && isValidCoord(latEntry.val, lonEntry.val)) {
      return { lat: latEntry.val, lon: lonEntry.val };
    }
  }

  return null;
}

export function formatCoordinate(c: Coordinates, digits = 4): string {
  return `${c.lat.toFixed(digits)}, ${c.lon.toFixed(digits)}`;
}

export function formatDistanceKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 2 : 1)} km`;
}

// Nominatim display_name returns a comma-separated admin hierarchy that often
// repeats the same place across multiple nested divisions (e.g. "Municipal Unit
// of Patras, Municipality of Patras, Achaia Regional Unit, Western Greece,
// Peloponnese, Western Greece and the Ionian, Greece"). This compacts it to the
// most specific tokens plus the country, dropping any token that is a case-
// insensitive substring of one already kept.
export function simplifyAddress(displayName: string | null, maxFront = 2): string {
  if (!displayName) return '';
  const parts = displayName
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];

  const country = parts[parts.length - 1];
  const front = parts.slice(0, -1);
  const kept: string[] = [];

  for (const part of front) {
    // Skip pure postal codes (all digits, optional spaces)
    if (/^\d[\d\s-]*$/.test(part)) continue;
    const lower = part.toLowerCase();
    const redundant = kept.some((k) => {
      const kLower = k.toLowerCase();
      return kLower === lower || kLower.includes(lower) || lower.includes(kLower);
    });
    if (redundant) continue;
    kept.push(part);
    if (kept.length >= maxFront) break;
  }

  return [...kept, country].join(', ');
}
