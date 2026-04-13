import { useEffect, useRef, useState } from 'react';
import type { Coordinates, ModuleState, WildfireEvent } from '../types';
import { initialModuleState } from '../types';
import { fetchJson } from '../utils/fetcher';
import { haversine } from '../utils/coordinates';
import { cacheGet, cacheSet } from '../utils/persistentCache';

const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const FIRMS_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
const FIRMS_MAP_KEY = import.meta.env.VITE_FIRMS_MAP_KEY ?? '';
const FIRMS_SOURCE = 'VIIRS_SNPP_NRT';
const FIRMS_DAY_RANGE = 7;
const BBOX_HALF_DEG = 2.0;
const WILDFIRE_TTL_MS = 6 * 60 * 60 * 1000;

function bbox(coords: Coordinates) {
  return {
    minLon: coords.lon - BBOX_HALF_DEG,
    minLat: coords.lat - BBOX_HALF_DEG,
    maxLon: coords.lon + BBOX_HALF_DEG,
    maxLat: coords.lat + BBOX_HALF_DEG,
  };
}

interface EonetGeometry {
  date: string;
  type: 'Point' | 'Polygon';
  coordinates: number[] | number[][][];
  magnitudeValue?: number;
  magnitudeUnit?: string;
}

interface EonetEvent {
  id: string;
  title: string;
  categories: Array<{ id: string; title: string }>;
  geometry: EonetGeometry[];
}

interface EonetResponse {
  events: EonetEvent[];
}

function pointFromCoords(coords: number[]): { lat: number; lon: number } {
  return { lon: coords[0], lat: coords[1] };
}

async function fetchEonet(
  center: Coordinates,
  signal: AbortSignal,
): Promise<WildfireEvent[]> {
  const b = bbox(center);
  // EONET bbox order: W,N,E,S
  const bboxStr = `${b.minLon},${b.maxLat},${b.maxLon},${b.minLat}`;
  const url = `${EONET_URL}?category=wildfires&status=open&bbox=${bboxStr}&limit=50`;
  try {
    const res = await fetchJson<EonetResponse>(url, { signal, timeoutMs: 15000 });
    const out: WildfireEvent[] = [];
    for (const ev of res.events) {
      const latest = ev.geometry[ev.geometry.length - 1];
      if (!latest) continue;

      let lat: number;
      let lon: number;
      let polygon: Coordinates[] | null = null;

      if (latest.type === 'Point') {
        const p = pointFromCoords(latest.coordinates as number[]);
        lat = p.lat;
        lon = p.lon;
      } else if (latest.type === 'Polygon') {
        const rings = latest.coordinates as number[][][];
        if (!rings[0] || rings[0].length < 3) continue;
        polygon = rings[0].map((c) => ({ lat: c[1], lon: c[0] }));
        // Centroid for distance calc
        let sumLat = 0;
        let sumLon = 0;
        for (const p of polygon) {
          sumLat += p.lat;
          sumLon += p.lon;
        }
        lat = sumLat / polygon.length;
        lon = sumLon / polygon.length;
      } else {
        continue;
      }

      out.push({
        id: `eonet:${ev.id}`,
        source: 'EONET',
        title: ev.title,
        lat,
        lon,
        date: latest.date,
        distanceKm: haversine(center, { lat, lon }) / 1000,
        magnitudeValue: latest.magnitudeValue ?? null,
        magnitudeUnit: latest.magnitudeUnit ?? null,
        brightness: null,
        confidence: null,
        frp: null,
        polygon,
      });
    }
    return out;
  } catch (err) {
    if (signal.aborted) throw err;
    return [];
  }
}

async function fetchFirms(
  center: Coordinates,
  signal: AbortSignal,
): Promise<WildfireEvent[]> {
  if (!FIRMS_MAP_KEY) return [];
  const b = bbox(center);
  // FIRMS area order: W,S,E,N
  const areaStr = `${b.minLon},${b.minLat},${b.maxLon},${b.maxLat}`;
  const url = `${FIRMS_URL}/${FIRMS_MAP_KEY}/${FIRMS_SOURCE}/${areaStr}/${FIRMS_DAY_RANGE}`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map((s) => s.trim());

    const latIdx = header.indexOf('latitude');
    const lonIdx = header.indexOf('longitude');
    if (latIdx < 0 || lonIdx < 0) return [];

    const brightIdx =
      header.indexOf('bright_ti4') >= 0 ? header.indexOf('bright_ti4') : header.indexOf('brightness');
    const confIdx = header.indexOf('confidence');
    const dateIdx = header.indexOf('acq_date');
    const timeIdx = header.indexOf('acq_time');
    const frpIdx = header.indexOf('frp');

    const out: WildfireEvent[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const lat = parseFloat(parts[latIdx]);
      const lon = parseFloat(parts[lonIdx]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      out.push({
        id: `firms:${lat.toFixed(4)}:${lon.toFixed(4)}:${parts[dateIdx] ?? ''}:${parts[timeIdx] ?? ''}`,
        source: 'FIRMS',
        title: null,
        lat,
        lon,
        date: dateIdx >= 0 ? `${parts[dateIdx]}T${parts[timeIdx] ?? ''}` : '',
        distanceKm: haversine(center, { lat, lon }) / 1000,
        magnitudeValue: null,
        magnitudeUnit: null,
        brightness: brightIdx >= 0 ? parseFloat(parts[brightIdx]) : null,
        confidence: confIdx >= 0 ? parts[confIdx] ?? null : null,
        frp: frpIdx >= 0 ? parseFloat(parts[frpIdx]) : null,
        polygon: null,
      });
    }
    return out;
  } catch (err) {
    if (signal.aborted) throw err;
    return [];
  }
}

const cache = new Map<string, WildfireEvent[]>();

function makeKey(coords: Coordinates): string {
  return `wildfire:${coords.lat.toFixed(3)}|${coords.lon.toFixed(3)}`;
}

async function fetchAll(
  coords: Coordinates,
  signal: AbortSignal,
): Promise<WildfireEvent[]> {
  const [eonet, firms] = await Promise.all([
    fetchEonet(coords, signal),
    fetchFirms(coords, signal),
  ]);
  const seen = new Set<string>();
  const merged: WildfireEvent[] = [];
  for (const ev of [...eonet, ...firms]) {
    if (seen.has(ev.id)) continue;
    seen.add(ev.id);
    merged.push(ev);
  }
  merged.sort((a, b) => a.distanceKm - b.distanceKm);
  return merged;
}

export function useWildfires(
  coords: Coordinates | null,
): ModuleState<WildfireEvent[]> {
  const [state, setState] = useState<ModuleState<WildfireEvent[]>>(() =>
    initialModuleState<WildfireEvent[]>(),
  );
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!coords) {
      setState(initialModuleState<WildfireEvent[]>());
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
      const persistent = await cacheGet<WildfireEvent[]>(key);
      if (ctrl.signal.aborted) return;
      if (persistent) {
        cache.set(key, persistent);
        setState({ status: 'success', data: persistent, error: null });
        return;
      }
      try {
        const events = await fetchAll(coords, ctrl.signal);
        if (ctrl.signal.aborted) return;
        cache.set(key, events);
        void cacheSet(key, events, WILDFIRE_TTL_MS);
        setState({ status: 'success', data: events, error: null });
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
