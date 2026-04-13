import { useEffect, useRef, useState } from 'react';
import type { AqiSample, Coordinates, ModuleState } from '../types';
import { initialModuleState } from '../types';
import { fetchJson } from '../utils/fetcher';

const BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const HOURLY_VARS = [
  'european_aqi',
  'pm10',
  'pm2_5',
  'nitrogen_dioxide',
  'ozone',
];

interface AirQualityResponse {
  hourly: {
    time: string[];
    european_aqi: number[];
    pm10: number[];
    pm2_5: number[];
    nitrogen_dioxide: number[];
    ozone: number[];
  };
}

const cache = new Map<string, AqiSample[]>();

function makeKey(coords: Coordinates): string {
  return `${coords.lat.toFixed(4)}|${coords.lon.toFixed(4)}`;
}

function buildUrl(coords: Coordinates): string {
  const params = new URLSearchParams({
    latitude: coords.lat.toString(),
    longitude: coords.lon.toString(),
    hourly: HOURLY_VARS.join(','),
    past_days: '92',
    timezone: 'auto',
  });
  return `${BASE}?${params.toString()}`;
}

async function fetchAqi(
  coords: Coordinates,
  signal: AbortSignal,
): Promise<AqiSample[]> {
  const url = buildUrl(coords);
  const raw = await fetchJson<AirQualityResponse>(url, { signal, timeoutMs: 20000 });
  const { time, european_aqi, pm10, pm2_5, nitrogen_dioxide, ozone } = raw.hourly;
  const samples: AqiSample[] = [];
  for (let i = 0; i < time.length; i++) {
    samples.push({
      time: time[i],
      europeanAqi: european_aqi[i] ?? 0,
      pm10: pm10[i] ?? 0,
      pm25: pm2_5[i] ?? 0,
      no2: nitrogen_dioxide[i] ?? 0,
      o3: ozone[i] ?? 0,
    });
  }
  return samples;
}

export function useAirQuality(
  coords: Coordinates | null,
): ModuleState<AqiSample[]> {
  const [state, setState] = useState<ModuleState<AqiSample[]>>(() =>
    initialModuleState<AqiSample[]>(),
  );
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!coords) {
      setState(initialModuleState<AqiSample[]>());
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

    fetchAqi(coords, ctrl.signal)
      .then((samples) => {
        if (ctrl.signal.aborted) return;
        cache.set(key, samples);
        setState({ status: 'success', data: samples, error: null });
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
