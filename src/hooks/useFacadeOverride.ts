import { useCallback, useSyncExternalStore } from 'react';
import type { BuildingFacade, Coordinates } from '../types';

type FacadeLabel = BuildingFacade['label'];
type Slot = 'A' | 'B';

const store = new Map<string, FacadeLabel>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function key(coords: Coordinates | null, slot: Slot): string | null {
  if (!coords) return null;
  return `${slot}|${coords.lat.toFixed(5)}|${coords.lon.toFixed(5)}`;
}

export function useFacadeOverride(
  coords: Coordinates | null,
  slot: Slot,
): [FacadeLabel | null, (v: FacadeLabel | null) => void] {
  const k = key(coords, slot);
  const getSnapshot = useCallback(
    () => (k ? (store.get(k) ?? null) : null),
    [k],
  );
  const value = useSyncExternalStore(subscribe, getSnapshot);
  const set = useCallback(
    (v: FacadeLabel | null) => {
      if (!k) return;
      if (v === null) {
        if (!store.has(k)) return;
        store.delete(k);
      } else {
        if (store.get(k) === v) return;
        store.set(k, v);
      }
      emit();
    },
    [k],
  );
  return [value, set];
}
