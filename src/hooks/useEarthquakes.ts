import type { Coordinates, EarthquakeEvent, ModuleState } from '../types';
import { fetchJson } from '../utils/fetcher';
import { haversine } from '../utils/coordinates';
import { TTL } from '../utils/persistentCache';
import { useCachedResource } from './useCachedResource';

const BASE = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

interface USGSFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number | null;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface USGSResponse {
  features: USGSFeature[];
}

function makeKey(coords: Coordinates): string {
  return `${coords.lat.toFixed(3)}|${coords.lon.toFixed(3)}`;
}

function buildUrl(coords: Coordinates): string {
  const end = new Date();
  end.setDate(end.getDate() + 1); // USGS reads bare dates as 00:00 UTC — exclusive of today without this
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 10);
  const params = new URLSearchParams({
    format: 'geojson',
    latitude: coords.lat.toString(),
    longitude: coords.lon.toString(),
    maxradiuskm: '100',
    starttime: start.toISOString().slice(0, 10),
    endtime: end.toISOString().slice(0, 10),
    minmagnitude: '3.0',
    orderby: 'magnitude',
    limit: '200',
  });
  return `${BASE}?${params.toString()}`;
}

async function fetchEvents(
  coords: Coordinates,
  signal: AbortSignal,
): Promise<EarthquakeEvent[]> {
  const url = buildUrl(coords);
  const data = await fetchJson<USGSResponse>(url, { signal, timeoutMs: 20000 });
  const events: EarthquakeEvent[] = [];
  for (const f of data.features) {
    const [lon, lat, depth] = f.geometry.coordinates;
    const mag = f.properties.mag;
    const time = f.properties.time;
    if (mag === null || time === null) continue;
    events.push({
      id: f.id,
      magnitude: mag,
      depth,
      distanceKm: haversine(coords, { lat, lon }) / 1000,
      date: new Date(time).toISOString(),
      place: f.properties.place ?? '',
      lat,
      lon,
    });
  }
  return events;
}

export function useEarthquakes(coords: Coordinates | null): ModuleState<EarthquakeEvent[]> {
  return useCachedResource(
    coords && makeKey(coords),
    (signal) => fetchEvents(coords!, signal),
    TTL.earthquakes,
  );
}
