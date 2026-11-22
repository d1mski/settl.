import { fetchJson } from './fetcher';
import { Semaphore } from './semaphore';
import { sleep } from './sleep';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
];

const gate = new Semaphore(2);

/** POSTs an Overpass QL query, trying each mirror in turn, at most two queries at once. */
export function fetchOverpass<T>(query: string, signal: AbortSignal, timeoutMs: number): Promise<T> {
  return gate.run(async () => {
    let lastErr: unknown = null;
    for (let i = 0; i < ENDPOINTS.length; i++) {
      if (signal.aborted) throw new DOMException('aborted', 'AbortError');
      try {
        return await fetchJson<T>(ENDPOINTS[i], {
          signal,
          timeoutMs,
          init: {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
          },
        });
      } catch (err) {
        if (signal.aborted) throw err;
        lastErr = err;
        // Abortable, so an abandoned retry never sleeps on a gate slot.
        if (i < ENDPOINTS.length - 1) await sleep(800 * (i + 1), signal);
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Overpass unreachable');
  });
}
