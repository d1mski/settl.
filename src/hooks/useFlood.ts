// src/hooks/useFlood.ts
// Pattern mirrors useAirQuality.ts exactly — verified 2026-06-22
// No-river behavior: desert → HTTP 200 all-zeros; ocean → HTTP 200 all-nulls
// No HTTP 400 case detected — both return 200 (unlike Marine API in Phase 10)

import { useEffect, useRef, useState } from 'react';
import type { Coordinates, ModuleState } from '../types';
import { initialModuleState } from '../types';
import { fetchJson } from '../utils/fetcher';
import { cacheGet, cacheSet, TTL } from '../utils/persistentCache';

const BASE = 'https://flood-api.open-meteo.com/v1/flood';
const DAILY_VARS = ['river_discharge', 'river_discharge_p25', 'river_discharge_p75'];

export interface FloodSample {
  time: string;
  riverDischarge: number | null;  // m³/s; null = ocean/uncovered; 0 = desert/no-river-in-5km
  p25: number | null;
  p75: number | null;
}

interface FloodResponse {
  daily: {
    time: string[];
    river_discharge: (number | null)[];
    river_discharge_p25: (number | null)[];
    river_discharge_p75: (number | null)[];
  };
}

const cache = new Map<string, FloodSample[]>();
// Separate sentinel for not-applicable to avoid null ambiguity
const notApplicableCache = new Set<string>();

function makeKey(coords: Coordinates): string {
  return `flood|${coords.lat.toFixed(4)}|${coords.lon.toFixed(4)}`;
}

function buildUrl(coords: Coordinates): string {
  const params = new URLSearchParams({
    latitude: coords.lat.toString(),
    longitude: coords.lon.toString(),
    daily: DAILY_VARS.join(','),
    past_days: '92',
  });
  return `${BASE}?${params.toString()}`;
}

function isNotApplicable(discharge: (number | null)[]): boolean {
  // Desert case: all zeros. Ocean case: all nulls. Both = not-applicable.
  return discharge.every(v => v === null || v === 0);
}

export function useFlood(
  coords: Coordinates | null,
): ModuleState<FloodSample[]> & { notApplicable: boolean } {
  const [state, setState] = useState<ModuleState<FloodSample[]>>(
    () => initialModuleState<FloodSample[]>(),
  );
  const [notApplicable, setNotApplicable] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!coords) {
      setState(initialModuleState<FloodSample[]>());
      setNotApplicable(false);
      return;
    }
    const key = makeKey(coords);

    if (notApplicableCache.has(key)) {
      setState({ status: 'success', data: [], error: null });
      setNotApplicable(true);
      return;
    }
    const cached = cache.get(key);
    if (cached) {
      setState({ status: 'success', data: cached, error: null });
      setNotApplicable(false);
      return;
    }

    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setState({ status: 'loading', data: null, error: null });
    setNotApplicable(false);

    void (async () => {
      // Check persistent cache
      const persistent = await cacheGet<FloodSample[] | 'not-applicable'>(key);
      if (ctrl.signal.aborted) return;
      if (persistent === 'not-applicable') {
        notApplicableCache.add(key);
        setState({ status: 'success', data: [], error: null });
        setNotApplicable(true);
        return;
      }
      if (persistent) {
        cache.set(key, persistent);
        setState({ status: 'success', data: persistent, error: null });
        return;
      }

      try {
        const url = buildUrl(coords);
        const raw = await fetchJson<FloodResponse>(url, { signal: ctrl.signal, timeoutMs: 20000 });
        if (ctrl.signal.aborted) return;

        if (isNotApplicable(raw.daily.river_discharge)) {
          notApplicableCache.add(key);
          void cacheSet(key, 'not-applicable', TTL.openMeteoFlood);
          setState({ status: 'success', data: [], error: null });
          setNotApplicable(true);
          return;
        }

        const samples: FloodSample[] = raw.daily.time.map((t, i) => ({
          time: t,
          riverDischarge: raw.daily.river_discharge[i],
          p25: raw.daily.river_discharge_p25[i],
          p75: raw.daily.river_discharge_p75[i],
        }));
        cache.set(key, samples);
        void cacheSet(key, samples, TTL.openMeteoFlood);
        setState({ status: 'success', data: samples, error: null });
        setNotApplicable(false);
      } catch (err: unknown) {
        if (ctrl.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', data: null, error: message });
      }
    })();

    return () => ctrl.abort();
  }, [coords?.lat, coords?.lon]);

  return { ...state, notApplicable };
}
