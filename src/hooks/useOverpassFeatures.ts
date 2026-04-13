import { useEffect, useRef, useState } from 'react';
import type { Coordinates, ModuleState } from '../types';
import { initialModuleState } from '../types';
import { fetchJson } from '../utils/fetcher';
import { haversine } from '../utils/coordinates';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export type FeatureCategory =
  | 'amenity'
  | 'industrial'
  | 'airport'
  | 'water'
  | 'park'
  | 'place'
  | 'transit'
  | 'other';

export interface NearbyFeature {
  id: number;
  elementType: 'node' | 'way';
  category: FeatureCategory;
  subtype: string;
  name: string | null;
  lat: number;
  lon: number;
  distanceKm: number;
}

interface OverpassElement {
  type: 'node' | 'way';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const cache = new Map<string, NearbyFeature[]>();

function makeKey(coords: Coordinates): string {
  return `${coords.lat.toFixed(4)}|${coords.lon.toFixed(4)}`;
}

function buildQuery(lat: number, lon: number): string {
  return `[out:json][timeout:20];(
node["amenity"](around:1500,${lat},${lon});
way["amenity"](around:1500,${lat},${lon});
node["shop"](around:1500,${lat},${lon});
way["shop"](around:1500,${lat},${lon});
node["public_transport"](around:1500,${lat},${lon});
way["landuse"="industrial"](around:2500,${lat},${lon});
way["landuse"="commercial"](around:2500,${lat},${lon});
node["aeroway"="aerodrome"](around:8000,${lat},${lon});
way["aeroway"="aerodrome"](around:8000,${lat},${lon});
way["natural"="water"](around:1500,${lat},${lon});
way["leisure"="park"](around:1500,${lat},${lon});
);out center tags;`;
}

function categorise(tags: Record<string, string>): {
  category: FeatureCategory;
  subtype: string;
} {
  if (tags.aeroway === 'aerodrome') return { category: 'airport', subtype: 'aerodrome' };
  if (tags.landuse === 'industrial') return { category: 'industrial', subtype: 'industrial' };
  if (tags.landuse === 'commercial') return { category: 'industrial', subtype: 'commercial' };
  if (tags.natural === 'water') return { category: 'water', subtype: 'water' };
  if (tags.leisure === 'park') return { category: 'park', subtype: 'park' };
  if (tags.public_transport) return { category: 'transit', subtype: tags.public_transport };
  if (tags.amenity) return { category: 'amenity', subtype: tags.amenity };
  if (tags.shop) return { category: 'amenity', subtype: `shop:${tags.shop}` };
  return { category: 'other', subtype: 'other' };
}

async function tryEndpoint(
  url: string,
  query: string,
  signal: AbortSignal,
): Promise<OverpassResponse> {
  return fetchJson<OverpassResponse>(url, {
    signal,
    timeoutMs: 25000,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    },
  });
}

async function fetchFeatures(
  coords: Coordinates,
  signal: AbortSignal,
): Promise<NearbyFeature[]> {
  const query = buildQuery(coords.lat, coords.lon);
  let lastErr: unknown = null;
  for (const endpoint of ENDPOINTS) {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    try {
      const data = await tryEndpoint(endpoint, query, signal);
      return interpret(coords, data);
    } catch (err) {
      if (signal.aborted) throw err;
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Overpass unreachable');
}

function interpret(coords: Coordinates, data: OverpassResponse): NearbyFeature[] {
  const out: NearbyFeature[] = [];
  for (const el of data.elements) {
    const tags = el.tags ?? {};
    if (Object.keys(tags).length === 0) continue;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat === undefined || lon === undefined) continue;
    const { category, subtype } = categorise(tags);
    if (category === 'other') continue;
    out.push({
      id: el.id,
      elementType: el.type,
      category,
      subtype,
      name: tags.name ?? null,
      lat,
      lon,
      distanceKm: haversine(coords, { lat, lon }) / 1000,
    });
  }
  out.sort((a, b) => a.distanceKm - b.distanceKm);
  return out;
}

export function useOverpassFeatures(
  coords: Coordinates | null,
): ModuleState<NearbyFeature[]> {
  const [state, setState] = useState<ModuleState<NearbyFeature[]>>(() =>
    initialModuleState<NearbyFeature[]>(),
  );
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!coords) {
      setState(initialModuleState<NearbyFeature[]>());
      return;
    }
    const key = makeKey(coords);
    const cached = cache.get(key);
    if (cached) {
      setState({ status: 'success', data: cached, error: null });
      return;
    }

    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setState({ status: 'loading', data: null, error: null });

    fetchFeatures(coords, ctrl.signal)
      .then((features) => {
        if (ctrl.signal.aborted) return;
        cache.set(key, features);
        setState({ status: 'success', data: features, error: null });
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', data: null, error: message });
      });

    return () => ctrl.abort();
  }, [coords?.lat, coords?.lon]);

  return state;
}

const SUBTYPE_PATTERNS: Record<string, (f: NearbyFeature) => boolean> = {
  hospital: (f) => f.subtype === 'hospital' || f.subtype === 'clinic',
  supermarket: (f) =>
    f.subtype === 'shop:supermarket' || f.subtype === 'supermarket',
  school: (f) => f.subtype === 'school' || f.subtype === 'kindergarten',
  pharmacy: (f) => f.subtype === 'pharmacy',
  transit: (f) => f.category === 'transit',
};

export function nearestByType(
  features: NearbyFeature[],
): Array<{ label: string; feature: NearbyFeature | null }> {
  const labels = Object.keys(SUBTYPE_PATTERNS);
  return labels.map((label) => {
    const predicate = SUBTYPE_PATTERNS[label];
    const match = features.find(predicate) ?? null;
    return { label, feature: match };
  });
}
