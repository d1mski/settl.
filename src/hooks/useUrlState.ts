import { useCallback, useEffect, useState } from 'react';
import type { Coordinates, TabId } from '../types';
import { TAB_ORDER } from '../types';

export type Slot = 'a' | 'b';

export interface UrlState {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
  tab: TabId;
  slot: Slot;
}

const DEFAULT_STATE: UrlState = {
  coordsA: null,
  coordsB: null,
  tab: 'climate',
  slot: 'a',
};

function parseLatLon(latStr: string | null, lonStr: string | null): Coordinates | null {
  if (latStr === null || lonStr === null) return null;
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

function readUrl(): UrlState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  const params = new URLSearchParams(window.location.search);
  const coordsA = parseLatLon(params.get('lat'), params.get('lon'));
  const coordsB = parseLatLon(params.get('latB'), params.get('lonB'));
  const rawTab = params.get('tab');
  const tab: TabId = TAB_ORDER.includes(rawTab as TabId)
    ? (rawTab as TabId)
    : 'climate';
  const rawSlot = params.get('slot');
  const slot: Slot = rawSlot === 'b' ? 'b' : 'a';
  return { coordsA, coordsB, tab, slot };
}

function writeUrl(state: UrlState) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);

  if (state.coordsA) {
    params.set('lat', state.coordsA.lat.toFixed(5));
    params.set('lon', state.coordsA.lon.toFixed(5));
  } else {
    params.delete('lat');
    params.delete('lon');
  }
  if (state.coordsB) {
    params.set('latB', state.coordsB.lat.toFixed(5));
    params.set('lonB', state.coordsB.lon.toFixed(5));
  } else {
    params.delete('latB');
    params.delete('lonB');
  }
  params.set('tab', state.tab);
  if (state.slot === 'b') params.set('slot', 'b');
  else params.delete('slot');

  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', next);
}

export function useUrlState() {
  const [state, setState] = useState<UrlState>(() => readUrl());

  const update = useCallback((patch: Partial<UrlState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      writeUrl(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = () => setState(readUrl());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return { state, update };
}
