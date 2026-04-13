import { useEffect, useRef, useState } from 'react';
import type { Coordinates } from '../types';
import { formatCoordinate, parseCoordinates } from '../utils/coordinates';
import { forwardGeocode, type GeocodeResult } from '../hooks/useNominatim';

interface Props {
  value: Coordinates | null;
  resolvedLabel: string | null;
  resolving: boolean;
  onChange: (coords: Coordinates | null) => void;
}

export function LocationInput({
  value,
  resolvedLabel,
  resolving,
  onChange,
}: Props) {
  const [raw, setRaw] = useState(value ? formatCoordinate(value) : '');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value) setRaw(formatCoordinate(value));
  }, [value?.lat, value?.lon]);

  async function handleSubmit() {
    setError(null);
    setSuggestions([]);
    const text = raw.trim();
    if (!text) {
      onChange(null);
      return;
    }
    const parsed = parseCoordinates(text);
    if (parsed) {
      onChange(parsed);
      return;
    }

    setSearching(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const results = await forwardGeocode(text, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (results.length === 0) {
        setError(`No match for "${text}"`);
      } else if (results.length === 1) {
        onChange(results[0].coords);
      } else {
        setSuggestions(results);
      }
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-4">
      <label className="text-xs text-muted uppercase tracking-wide">
        Location
      </label>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder={
            'Coordinates, DMS, or address — e.g. 38.2885, 21.7706 · Patras, Greece'
          }
          className="flex-1 bg-bg border border-border rounded px-3 py-2 text-ink font-mono text-sm outline-none focus:border-locA"
        />
        <button
          onClick={handleSubmit}
          disabled={searching}
          className="px-4 py-2 rounded border border-border bg-bg text-ink text-sm hover:border-locA disabled:opacity-50"
        >
          {searching ? 'Searching…' : 'Go'}
        </button>
      </div>

      {error && <div className="text-xs text-risk mt-2">{error}</div>}

      {suggestions.length > 0 && (
        <div className="mt-2 rounded border border-border bg-bg overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                onChange(s.coords);
                setSuggestions([]);
              }}
              className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-border/40 border-b border-border last:border-b-0"
            >
              <div className="font-medium">{s.displayName}</div>
              <div className="text-muted font-mono">
                {formatCoordinate(s.coords)}
              </div>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="mt-2 text-xs text-muted">
          <span className="font-mono">{formatCoordinate(value, 5)}</span>
          {resolving && (
            <span className="ml-2 text-locA">Resolving address…</span>
          )}
          {resolvedLabel && !resolving && (
            <span className="ml-2 text-ink">· {resolvedLabel}</span>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-muted">
        Tip: click anywhere on the map below or drag the pin to pick a location.
      </div>
    </section>
  );
}
