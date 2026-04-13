import { useEffect, useRef, useState } from 'react';
import type {
  ClimateData,
  Coordinates,
  DailyWeather,
  HourlyWeather,
  ModuleState,
  ResolvedLocation,
} from '../types';
import { initialModuleState } from '../types';
import { fetchJson } from '../utils/fetcher';
import { haversine } from '../utils/coordinates';
import { cacheGet, cacheSet, TTL } from '../utils/persistentCache';

const BASE = 'https://archive-api.open-meteo.com/v1/archive';

const HOURLY_VARS = [
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'rain',
  'snowfall',
  'cloud_cover',
  'shortwave_radiation',
];

const DAILY_VARS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'temperature_2m_mean',
  'precipitation_sum',
  'rain_sum',
  'snowfall_sum',
  'precipitation_hours',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'wind_direction_10m_dominant',
  'sunshine_duration',
  'uv_index_max',
];

const cache = new Map<string, ClimateData>();

function makeKey(coords: Coordinates, start: string, end: string): string {
  return `${coords.lat.toFixed(4)}|${coords.lon.toFixed(4)}|${start}|${end}`;
}

function defaultDateRange(): { start: string; end: string } {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 7);
  const start = new Date(end);
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  return { start: isoDate(start), end: isoDate(end) };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  hourly: Record<string, number[] | string[]>;
  daily: Record<string, number[] | string[]>;
}

const MODEL = 'era5_seamless';
const MODEL_DISPLAY = 'ERA5-SEAMLESS';
const MODEL_RESOLUTION_KM = 9;

function buildUrl(coords: Coordinates, start: string, end: string): string {
  const params = new URLSearchParams({
    latitude: coords.lat.toString(),
    longitude: coords.lon.toString(),
    start_date: start,
    end_date: end,
    hourly: HOURLY_VARS.join(','),
    daily: DAILY_VARS.join(','),
    timezone: 'auto',
    windspeed_unit: 'kmh',
    temperature_unit: 'celsius',
    precipitation_unit: 'mm',
    models: MODEL,
  });
  return `${BASE}?${params.toString()}`;
}

function arr(obj: Record<string, number[] | string[]>, key: string): number[] {
  return (obj[key] as number[]) ?? [];
}

function strArr(obj: Record<string, number[] | string[]>, key: string): string[] {
  return (obj[key] as string[]) ?? [];
}

async function fetchOpenMeteo(
  coords: Coordinates,
  start: string,
  end: string,
  signal: AbortSignal,
): Promise<ClimateData> {
  const url = buildUrl(coords, start, end);
  const raw = await fetchJson<OpenMeteoResponse>(url, { signal, timeoutMs: 25000 });

  const resolved: Coordinates = { lat: raw.latitude, lon: raw.longitude };
  const distanceMeters = haversine(coords, resolved);

  const resolvedLoc: ResolvedLocation = {
    requested: coords,
    resolved,
    elevation: raw.elevation,
    distanceMeters,
    model: MODEL_DISPLAY,
    modelResolutionKm: MODEL_RESOLUTION_KM,
  };

  const hourly: HourlyWeather = {
    time: strArr(raw.hourly, 'time'),
    windSpeed10m: arr(raw.hourly, 'wind_speed_10m'),
    windDirection10m: arr(raw.hourly, 'wind_direction_10m'),
    windGusts10m: arr(raw.hourly, 'wind_gusts_10m'),
    temperature2m: arr(raw.hourly, 'temperature_2m'),
    relativeHumidity2m: arr(raw.hourly, 'relative_humidity_2m'),
    precipitation: arr(raw.hourly, 'precipitation'),
    rain: arr(raw.hourly, 'rain'),
    snowfall: arr(raw.hourly, 'snowfall'),
    cloudCover: arr(raw.hourly, 'cloud_cover'),
    shortwaveRadiation: arr(raw.hourly, 'shortwave_radiation'),
  };

  const daily: DailyWeather = {
    time: strArr(raw.daily, 'time'),
    temperatureMax: arr(raw.daily, 'temperature_2m_max'),
    temperatureMin: arr(raw.daily, 'temperature_2m_min'),
    temperatureMean: arr(raw.daily, 'temperature_2m_mean'),
    precipitationSum: arr(raw.daily, 'precipitation_sum'),
    rainSum: arr(raw.daily, 'rain_sum'),
    snowfallSum: arr(raw.daily, 'snowfall_sum'),
    precipitationHours: arr(raw.daily, 'precipitation_hours'),
    windSpeedMax: arr(raw.daily, 'wind_speed_10m_max'),
    windGustsMax: arr(raw.daily, 'wind_gusts_10m_max'),
    windDirectionDominant: arr(raw.daily, 'wind_direction_10m_dominant'),
    sunshineDuration: arr(raw.daily, 'sunshine_duration'),
    uvIndexMax: arr(raw.daily, 'uv_index_max'),
  };

  return { resolved: resolvedLoc, hourly, daily };
}

export function useOpenMeteo(coords: Coordinates | null): ModuleState<ClimateData> {
  const [state, setState] = useState<ModuleState<ClimateData>>(() =>
    initialModuleState<ClimateData>(),
  );
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!coords) {
      setState(initialModuleState<ClimateData>());
      return;
    }
    const { start, end } = defaultDateRange();
    const key = makeKey(coords, start, end);
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
      const persistent = await cacheGet<ClimateData>(key);
      if (ctrl.signal.aborted) return;
      if (persistent) {
        cache.set(key, persistent);
        setState({ status: 'success', data: persistent, error: null });
        return;
      }
      try {
        const data = await fetchOpenMeteo(coords, start, end, ctrl.signal);
        if (ctrl.signal.aborted) return;
        cache.set(key, data);
        void cacheSet(key, data, TTL.openMeteoArchive);
        setState({ status: 'success', data, error: null });
      } catch (err: unknown) {
        if (ctrl.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', data: null, error: message });
      }
    })();

    return () => {
      ctrl.abort();
    };
  }, [coords?.lat, coords?.lon]);

  return state;
}
