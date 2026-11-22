// src/hooks/useFlood.ts
// No-river behavior: desert → HTTP 200 all-zeros; ocean → HTTP 200 all-nulls
// No HTTP 400 case detected — both return 200 (unlike Marine API in Phase 10)

import type { Coordinates, ModuleState } from '../types';
import { fetchJson } from '../utils/fetcher';
import { TTL } from '../utils/persistentCache';
import { useCachedResource } from './useCachedResource';

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

export function isNotApplicable(discharge: (number | null)[]): boolean {
  // Desert case: all zeros. Ocean case: all nulls. Both = not-applicable.
  return discharge.every(v => v === null || v === 0);
}

type FloodFetchResult =
  | { notApplicable: true }
  | { notApplicable: false; samples: FloodSample[] };

// Fetch + not-applicable classification run together behind the shared
// in-flight promise so concurrent subscribers see one network request and
// one classification pass (see sharedFetch).
async function fetchAndClassify(
  coords: Coordinates,
  signal: AbortSignal,
): Promise<FloodFetchResult> {
  const url = buildUrl(coords);
  const raw = await fetchJson<FloodResponse>(url, { signal, timeoutMs: 20000 });

  if (isNotApplicable(raw.daily.river_discharge)) {
    return { notApplicable: true };
  }

  const samples: FloodSample[] = raw.daily.time.map((t, i) => ({
    time: t,
    riverDischarge: raw.daily.river_discharge[i],
    p25: raw.daily.river_discharge_p25[i],
    p75: raw.daily.river_discharge_p75[i],
  }));
  return { notApplicable: false, samples };
}

const NOT_APPLICABLE = 'not-applicable';

export function useFlood(
  coords: Coordinates | null,
): ModuleState<FloodSample[]> & { notApplicable: boolean } {
  // "No river within range" is a successful result, so it caches like any other.
  const s = useCachedResource<FloodSample[] | typeof NOT_APPLICABLE>(
    coords && makeKey(coords),
    async (signal) => {
      const r = await fetchAndClassify(coords!, signal);
      return r.notApplicable ? NOT_APPLICABLE : r.samples;
    },
    TTL.openMeteoFlood,
  );
  if (s.data === NOT_APPLICABLE) return { status: 'success', data: [], error: null, notApplicable: true };
  return { status: s.status, data: s.data, error: s.error, notApplicable: false };
}
