import { useEffect, useRef, useState } from 'react';
import type { BuildingData, Coordinates, ModuleState } from '../types';
import { initialModuleState } from '../types';
import { fetchJson } from '../utils/fetcher';
import { analyseBuildingPolygon, emptyBuilding } from '../utils/buildingOrientation';
import { haversine } from '../utils/coordinates';
import { cacheGet, cacheSet, TTL } from '../utils/persistentCache';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

interface OverpassWay {
  type: 'way';
  id: number;
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: Record<string, string>;
}

interface OverpassElement {
  type: string;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const cache = new Map<string, BuildingData>();

function makeKey(coords: Coordinates): string {
  return `${coords.lat.toFixed(5)}|${coords.lon.toFixed(5)}`;
}

async function fetchFromEndpoint(
  url: string,
  query: string,
  signal: AbortSignal,
): Promise<OverpassResponse> {
  return fetchJson<OverpassResponse>(url, {
    signal,
    timeoutMs: 20000,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    },
  });
}

async function fetchBuilding(
  coords: Coordinates,
  signal: AbortSignal,
): Promise<BuildingData> {
  const query =
    `[out:json][timeout:10];way["building"](around:60,${coords.lat},${coords.lon});out body geom;`;

  let lastErr: unknown = null;
  for (const endpoint of ENDPOINTS) {
    if (signal.aborted) throw new DOMException('aborted', 'AbortError');
    try {
      const data = await fetchFromEndpoint(endpoint, query, signal);
      return interpretResponse(coords, data);
    } catch (err) {
      if (signal.aborted) throw err;
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error('Overpass unreachable');
}

function interpretResponse(
  query: Coordinates,
  data: OverpassResponse,
): BuildingData {
  const ways = data.elements.filter(
    (e): e is OverpassWay =>
      e.type === 'way' &&
      Array.isArray((e as OverpassWay).geometry) &&
      ((e as OverpassWay).geometry?.length ?? 0) >= 3,
  );

  if (ways.length === 0) return emptyBuilding();

  let best: OverpassWay | null = null;
  let bestDist = Infinity;
  for (const way of ways) {
    const geom = way.geometry ?? [];
    let latSum = 0;
    let lonSum = 0;
    for (const p of geom) {
      latSum += p.lat;
      lonSum += p.lon;
    }
    const centroid = { lat: latSum / geom.length, lon: lonSum / geom.length };
    const d = haversine(query, centroid);
    if (d < bestDist) {
      bestDist = d;
      best = way;
    }
  }

  if (!best || !best.geometry) return emptyBuilding();

  const polygon: Coordinates[] = best.geometry.map((g) => ({
    lat: g.lat,
    lon: g.lon,
  }));
  const analysis = analyseBuildingPolygon(polygon);

  const levelsTag = best.tags?.['building:levels'];
  const parsedLevels = levelsTag ? parseInt(levelsTag, 10) : NaN;
  const rawType = best.tags?.building;
  const type = rawType && rawType !== 'yes' ? rawType : null;

  return {
    found: true,
    polygon: analysis.polygon,
    areaSqm: analysis.areaSqm,
    levels: Number.isFinite(parsedLevels) ? parsedLevels : null,
    type,
    longestEdgeBearing: analysis.longestEdgeBearing,
    facades: analysis.facades,
  };
}

export function useOverpassBuilding(
  coords: Coordinates | null,
): ModuleState<BuildingData> {
  const [state, setState] = useState<ModuleState<BuildingData>>(() =>
    initialModuleState<BuildingData>(),
  );
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!coords) {
      setState(initialModuleState<BuildingData>());
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

    void (async () => {
      const persistent = await cacheGet<BuildingData>(key);
      if (ctrl.signal.aborted) return;
      if (persistent) {
        cache.set(key, persistent);
        setState({ status: 'success', data: persistent, error: null });
        return;
      }
      try {
        const data = await fetchBuilding(coords, ctrl.signal);
        if (ctrl.signal.aborted) return;
        cache.set(key, data);
        void cacheSet(key, data, TTL.overpassBuilding);
        setState({ status: 'success', data, error: null });
      } catch (err: unknown) {
        if (ctrl.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', data: null, error: message });
      }
    })();

    return () => ctrl.abort();
  }, [coords?.lat, coords?.lon]);

  return state;
}
