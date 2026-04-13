interface FetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  init?: RequestInit;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number | null,
    public url: string,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export async function fetchJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const { signal, timeoutMs = 20000, init = {} } = opts;

  const timeoutCtrl = new AbortController();
  const timeoutId = setTimeout(() => timeoutCtrl.abort(), timeoutMs);
  const combined = mergeSignals(signal, timeoutCtrl.signal);

  try {
    const res = await fetch(url, {
      ...init,
      signal: combined,
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new FetchError(`HTTP ${res.status} ${res.statusText}`, res.status, url);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (timeoutCtrl.signal.aborted) {
        throw new FetchError(`Timed out after ${timeoutMs}ms`, null, url);
      }
      throw err;
    }
    if (err instanceof FetchError) throw err;
    throw new FetchError(
      err instanceof Error ? err.message : String(err),
      null,
      url,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function mergeSignals(
  a: AbortSignal | undefined,
  b: AbortSignal,
): AbortSignal {
  if (!a) return b;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (a.aborted || b.aborted) ctrl.abort();
  else {
    a.addEventListener('abort', onAbort, { once: true });
    b.addEventListener('abort', onAbort, { once: true });
  }
  return ctrl.signal;
}
