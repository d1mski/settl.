// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const idb = new Map<string, unknown>();
vi.mock('../utils/persistentCache', () => ({
  cacheGet: vi.fn(async (k: string) => idb.get(k) ?? null),
  cacheSet: vi.fn(async (k: string, v: unknown) => void idb.set(k, v)),
}));

import { useCachedResource } from './useCachedResource';
import type { ModuleState } from '../types';

type Call = { key: string; signal: AbortSignal; resolve: (v: string) => void; reject: (e: unknown) => void };
let calls: Call[] = [];
let seen: ModuleState<string>[] = [];

function fetcherFor(key: string) {
  return (signal: AbortSignal) =>
    new Promise<string>((resolve, reject) => {
      calls.push({ key, signal, resolve, reject });
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
    });
}

function Probe({ k }: { k: string | null }) {
  seen.push(useCachedResource(k, fetcherFor(k ?? ''), 1000));
  return null;
}

afterEach(() => {
  cleanup();
  calls = [];
  seen = [];
});

// Keys are unique per test: the memory cache is module-level.
describe('useCachedResource', () => {
  it('shares one fetch across concurrent mounts, then serves from memory', async () => {
    const view = render(<><Probe k="a" /><Probe k="a" /><Probe k="a" /></>);
    await waitFor(() => expect(calls).toHaveLength(1));
    calls[0].resolve('A');
    await waitFor(() => expect(seen.at(-1)).toEqual({ status: 'success', data: 'A', error: null }));
    expect(idb.get('a')).toBe('A');

    view.rerender(<><Probe k="a" /><Probe k="a" /><Probe k="a" /><Probe k="a" /></>);
    await new Promise((r) => setTimeout(r, 20));
    expect(calls).toHaveLength(1);
  });

  it('aborts only when the last subscriber leaves', async () => {
    const view = render(<><Probe k="b" /><Probe k="b" /></>);
    await waitFor(() => expect(calls).toHaveLength(1));
    view.rerender(<Probe k="b" />);
    await new Promise((r) => setTimeout(r, 20));
    expect(calls[0].signal.aborted).toBe(false);
    view.unmount();
    expect(calls[0].signal.aborted).toBe(true);
  });

  it('aborts the old request when the key changes', async () => {
    const view = render(<Probe k="c1" />);
    await waitFor(() => expect(calls).toHaveLength(1));
    view.rerender(<Probe k="c2" />);
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[0].signal.aborted).toBe(true);
    expect(calls[1].key).toBe('c2');
  });

  it('hydrates from IndexedDB without fetching', async () => {
    idb.set('d', 'D');
    render(<Probe k="d" />);
    await waitFor(() => expect(seen.at(-1)?.data).toBe('D'));
    expect(calls).toHaveLength(0);
  });

  it('reports errors and stays idle for a null key', async () => {
    render(<><Probe k="e" /><Probe k={null} /></>);
    await waitFor(() => expect(calls).toHaveLength(1));
    calls[0].reject(new Error('boom'));
    await waitFor(() => expect(seen.some((s) => s.error === 'boom')).toBe(true));
    expect(seen.some((s) => s.status === 'idle')).toBe(true);
  });
});
