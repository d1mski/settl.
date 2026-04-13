import { useEffect, useRef, useState } from 'react';
import type { Coordinates } from '../types';

const MIN_INTERVAL_MS = 1100;
const BASE = 'https://nominatim.openstreetmap.org';
const CONTACT = 'blindspot-dev';

let lastRequestAt = 0;
const pending: Array<() => void> = [];
let draining = false;

function drain() {
  if (draining) return;
  draining = true;
  void (async () => {
    while (pending.length > 0) {
      const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - Date.now());
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      const fn = pending.shift();
      if (fn) {
        lastRequestAt = Date.now();
        fn();
      }
    }
    draining = false;
  })();
}

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    pending.push(() => {
      fn().then(resolve, reject);
    });
    drain();
  });
}

export interface GeocodeResult {
  coords: Coordinates;
  displayName: string;
  countryCode: string | null;
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: { country_code?: string };
  error?: string;
}

interface NominatimSearchRow {
  lat: string;
  lon: string;
  display_name: string;
  address?: { country_code?: string };
}

export async function reverseGeocode(
  coords: Coordinates,
  signal?: AbortSignal,
): Promise<GeocodeResult> {
  return throttled(async () => {
    const url =
      `${BASE}/reverse?lat=${coords.lat}&lon=${coords.lon}` +
      `&format=json&zoom=18&addressdetails=1&email=${CONTACT}`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Nominatim reverse failed: HTTP ${res.status}`);
    }
    const data = (await res.json()) as NominatimReverseResponse;
    if (data.error) throw new Error(`Nominatim: ${data.error}`);
    return {
      coords,
      displayName: data.display_name ?? '',
      countryCode: data.address?.country_code?.toUpperCase() ?? null,
    };
  });
}

export async function forwardGeocode(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  return throttled(async () => {
    const url =
      `${BASE}/search?q=${encodeURIComponent(query)}` +
      `&format=json&limit=5&addressdetails=1&email=${CONTACT}`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Nominatim search failed: HTTP ${res.status}`);
    }
    const rows = (await res.json()) as NominatimSearchRow[];
    return rows.map((row) => ({
      coords: { lat: parseFloat(row.lat), lon: parseFloat(row.lon) },
      displayName: row.display_name,
      countryCode: row.address?.country_code?.toUpperCase() ?? null,
    }));
  });
}

export function useReverseGeocode(coords: Coordinates | null) {
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!coords) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }
    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setLoading(true);
    setError(null);
    reverseGeocode(coords, ctrl.signal)
      .then((r) => {
        if (ctrl.signal.aborted) return;
        setResult(r);
        setLoading(false);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [coords?.lat, coords?.lon]);

  return { result, loading, error };
}
