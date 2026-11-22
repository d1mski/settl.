import { useEffect, useState } from 'react';
import type { ModuleState } from '../types';
import { initialModuleState } from '../types';
import { cacheGet, cacheSet } from '../utils/persistentCache';
import { createSharedMap, sharedFetch, type SharedMap } from '../utils/sharedFetch';

// One memory cache and in-flight map for every data hook. Keys already have to
// be unique across hooks because they double as IndexedDB keys.
const memory = new Map<string, unknown>();
const inflight = createSharedMap<unknown>();

export const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

/**
 * Memory cache, then IndexedDB, then one shared network fetch per key.
 * Concurrent mounts with the same key share a request; it is aborted only when
 * the last subscriber unmounts or moves to another key. A null key means idle.
 */
export function useCachedResource<T>(
  key: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  ttlMs: number,
  describeError: (err: unknown) => string = errorText,
): ModuleState<T> {
  const [state, setState] = useState<ModuleState<T>>(initialModuleState<T>);

  useEffect(() => {
    if (key === null) {
      setState(initialModuleState<T>());
      return;
    }
    if (memory.has(key)) {
      setState({ status: 'success', data: memory.get(key) as T, error: null });
      return;
    }

    let cancelled = false;
    let release: (() => void) | null = null;
    setState({ status: 'loading', data: null, error: null });

    void (async () => {
      const persistent = await cacheGet<T>(key);
      if (cancelled) return;
      if (persistent !== null) {
        memory.set(key, persistent);
        setState({ status: 'success', data: persistent, error: null });
        return;
      }

      const sub = sharedFetch(inflight as SharedMap<T>, key, async (signal) => {
        const data = await fetcher(signal);
        memory.set(key, data);
        void cacheSet(key, data, ttlMs);
        return data;
      });
      release = sub.release;
      sub.promise
        .then((data) => {
          if (!cancelled) setState({ status: 'success', data, error: null });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setState({ status: 'error', data: null, error: describeError(err) });
        });
    })();

    return () => {
      cancelled = true;
      release?.();
    };
    // fetcher is a fresh closure every render; the key captures everything it reads.
  }, [key]);

  return state;
}
