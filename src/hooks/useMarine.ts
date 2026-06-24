// Coastal detection: Marine API returns HTTP 200 with null wave_height/SST for inland coords (verified). Gate on null values, NOT HTTP status.

import { useEffect, useRef, useState } from 'react';
import type { Coordinates, ModuleState } from '../types';
import { initialModuleState } from '../types';
import { fetchJson } from '../utils/fetcher';

const BASE = 'https://marine-api.open-meteo.com/v1/marine';
const MARINE_TTL_MS = 15 * 60 * 1000; // 15 min — Marine model updates ~15-min interval
// No idb persistence — current conditions; image-URL analogy: serve stale sea state is misleading (mirror useWebcams)

export interface MarineData {
  waveHeight: number | null;      // metres; null = inland/no data
  seaSurfaceTemp: number | null;  // °C; null = inland/no data
  observationTime: string;        // ISO8601 — current.time (D-06 "LIVE · {obs time}")
  isCoastal: boolean;             // true when waveHeight !== null OR seaSurfaceTemp !== null
}

export type WmoSeverity = 'ok' | 'watch' | 'alert' | 'unavailable';

export function wmoSeverity(waveHeight: number | null): WmoSeverity {
  if (waveHeight === null) return 'unavailable';
  if (waveHeight < 2.5) return 'ok';
  if (waveHeight <= 4.0) return 'watch';
  return 'alert';
}

// Loosely typed to match the live API response — only fields we access are typed
interface MarineApiResponse {
  current?: {
    time?: string;
    interval?: number;
    wave_height?: number | null;
    sea_surface_temperature?: number | null;
  };
}

// In-memory cache with timestamp for TTL enforcement — intentionally NOT idb
// Current conditions; stale sea state across sessions would be misleading (mirror useWebcams)
interface CacheEntry { data: MarineData; fetchedAt: number }
const cache = new Map<string, CacheEntry>();

// In-flight dedup: two simultaneous callers for the same coords produce a single network request
const inflight = new Map<string, Promise<MarineData>>();

function makeKey(coords: Coordinates): string {
  return `marine|${coords.lat.toFixed(3)}|${coords.lon.toFixed(3)}`;
}

function mapResponse(raw: MarineApiResponse): MarineData {
  const waveHeight = raw.current?.wave_height ?? null;
  const seaSurfaceTemp = raw.current?.sea_surface_temperature ?? null;
  const isCoastal = waveHeight !== null || seaSurfaceTemp !== null;
  const observationTime = raw.current?.time ?? '';
  return { waveHeight, seaSurfaceTemp, observationTime, isCoastal };
}

// sharedFetch guarantees a single network request for concurrent same-coord callers.
// Does NOT accept an external AbortSignal — passing the hook's signal would cause
// one caller unmounting to abort the in-flight request of all concurrent callers.
function sharedFetch(key: string, coords: Coordinates): Promise<MarineData> {
  const existing = inflight.get(key);
  if (existing) return existing;

  const params = new URLSearchParams({
    latitude: coords.lat.toString(),
    longitude: coords.lon.toString(),
    current: 'wave_height,sea_surface_temperature',
  });
  const url = `${BASE}?${params.toString()}`;

  const p = fetchJson<MarineApiResponse>(url, { timeoutMs: 15000 })
    .then((raw) => {
      const data = mapResponse(raw);
      cache.set(key, { data, fetchedAt: Date.now() });
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, p);
  return p;
}

export function useMarine(coords: Coordinates | null): ModuleState<MarineData> {
  const [state, setState] = useState<ModuleState<MarineData>>(
    () => initialModuleState<MarineData>(),
  );
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!coords) {
      setState(initialModuleState<MarineData>());
      return;
    }

    const key = makeKey(coords);

    // In-memory TTL check — not idb, intentionally short-lived (current conditions)
    const entry = cache.get(key);
    if (entry && Date.now() - entry.fetchedAt < MARINE_TTL_MS) {
      setState({ status: 'success', data: entry.data, error: null });
      return;
    }

    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setState({ status: 'loading', data: null, error: null });

    void (async () => {
      try {
        const data = await sharedFetch(key, coords);
        if (ctrl.signal.aborted) return;
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
