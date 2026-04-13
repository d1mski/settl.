import { useEffect, useRef, useState } from 'react';
import type { Coordinates } from '../../types';
import type { Slot } from '../../hooks/useUrlState';
import type { BaseMap } from './MapCanvas';
import { formatCoordinate, parseCoordinates } from '../../utils/coordinates';
import { forwardGeocode, type GeocodeResult } from '../../hooks/useNominatim';
import { Panel } from '../hud/Panel';

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
  resolvedA: string | null;
  countryA: string | null;
  resolvingA: boolean;
  resolvedB: string | null;
  countryB: string | null;
  resolvingB: boolean;
  activeSlot: Slot;
  compareMode: boolean;
  baseMap: BaseMap;
  onBaseMapChange: (base: BaseMap) => void;
  onSetSlot: (slot: Slot) => void;
  onChangeA: (coords: Coordinates | null) => void;
  onChangeB: (coords: Coordinates | null) => void;
  onEnableCompare: () => void;
  onDisableCompare: () => void;
}

export function LocationIntelCard({
  coordsA,
  coordsB,
  resolvedA,
  countryA,
  resolvingA,
  resolvedB,
  countryB,
  resolvingB,
  activeSlot,
  compareMode,
  baseMap,
  onBaseMapChange,
  onSetSlot,
  onChangeA,
  onChangeB,
  onEnableCompare,
  onDisableCompare,
}: Props) {
  const currentValue = activeSlot === 'b' ? coordsB : coordsA;
  const setCurrent = activeSlot === 'b' ? onChangeB : onChangeA;

  const [raw, setRaw] = useState(currentValue ? formatCoordinate(currentValue) : '');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setRaw(currentValue ? formatCoordinate(currentValue) : '');
  }, [activeSlot, currentValue?.lat, currentValue?.lon]);

  async function handleSubmit() {
    setError(null);
    setSuggestions([]);
    const text = raw.trim();
    if (!text) {
      setCurrent(null);
      return;
    }
    const parsed = parseCoordinates(text);
    if (parsed) {
      setCurrent(parsed);
      return;
    }
    setSearching(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const results = await forwardGeocode(text, ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (results.length === 0) setError(`NO MATCH · "${text.toUpperCase()}"`);
      else if (results.length === 1) setCurrent(results[0].coords);
      else setSuggestions(results);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setError((err instanceof Error ? err.message : String(err)).toUpperCase());
    } finally {
      setSearching(false);
    }
  }

  return (
    <Panel className="w-[360px]">
      {/* Wordmark */}
      <div className="px-4 pt-3 pb-2 border-b border-edge flex items-center justify-between">
        <div>
          <div className="font-display text-[17px] leading-none tracking-[0.08em] text-ink lowercase">
            blind·spot
          </div>
          <div className="text-[8px] font-mono uppercase tracking-widest text-muted mt-1">
            LOCATION INTELLIGENCE TERMINAL
          </div>
        </div>
        {!compareMode ? (
          <button
            onClick={onEnableCompare}
            className="text-[8px] font-mono uppercase tracking-widest border border-edge bg-void px-2 py-1 text-amber hover:border-amber hover:bg-amber/5 transition-colors"
            title="Add comparison location"
          >
            + CMP
          </button>
        ) : (
          <button
            onClick={onDisableCompare}
            className="text-[8px] font-mono uppercase tracking-widest border border-edge bg-void px-2 py-1 text-muted hover:border-risk hover:text-risk transition-colors"
            title="Exit compare mode"
          >
            × CMP
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-4 space-y-3">
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-muted mb-1.5 flex items-center gap-2">
            <span>§01 · INPUT</span>
            <span className="flex-1 h-px bg-edge" />
            {compareMode && (
              <SlotToggle activeSlot={activeSlot} onSetSlot={onSetSlot} />
            )}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder={
                activeSlot === 'b' ? 'TGT B · COORD / DMS / ADDR' : 'TGT A · COORD / DMS / ADDR'
              }
              className={`flex-1 min-w-0 bg-void border px-2.5 py-1.5 text-[11px] font-mono text-ink outline-none placeholder:text-dim tracking-wider transition-colors ${
                activeSlot === 'b'
                  ? 'border-amber/50 focus:border-amber'
                  : 'border-edge focus:border-cyan'
              }`}
            />
            <button
              onClick={handleSubmit}
              disabled={searching}
              className={`shrink-0 px-3 py-1.5 border bg-void text-[10px] font-mono uppercase tracking-widest transition-colors disabled:opacity-40 ${
                activeSlot === 'b'
                  ? 'border-amber/50 text-amber hover:border-amber hover:bg-amber/5'
                  : 'border-edge text-cyan hover:border-cyan hover:bg-cyan/5'
              }`}
            >
              {searching ? '...' : 'EXEC'}
            </button>
            <ThemeToggle baseMap={baseMap} onBaseMapChange={onBaseMapChange} />
          </div>

          {error && (
            <div className="mt-2 text-[9px] font-mono tracking-wider text-risk border-l border-risk pl-2">
              {error}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mt-2 border border-edge divide-y divide-edge">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrent(s.coords);
                    setSuggestions([]);
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-cyan/5 transition-colors"
                >
                  <div className="text-[10px] font-mono text-ink truncate">{s.displayName}</div>
                  <div className="text-[9px] font-mono text-muted">{formatCoordinate(s.coords)}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <FixBlock
          label="FIX A"
          coords={coordsA}
          resolved={resolvedA}
          country={countryA}
          resolving={resolvingA}
          tone="cyan"
          active={activeSlot === 'a'}
          onActivate={() => onSetSlot('a')}
        />

        {compareMode && (
          <FixBlock
            label="FIX B"
            coords={coordsB}
            resolved={resolvedB}
            country={countryB}
            resolving={resolvingB}
            tone="amber"
            active={activeSlot === 'b'}
            onActivate={() => onSetSlot('b')}
          />
        )}

        <div className="text-[8px] font-mono uppercase tracking-widest text-dim pt-2 border-t border-edge">
          ↩ EXEC · MAP CLICK = SET ACTIVE TGT · DRAG PIN = NUDGE
        </div>
      </div>
    </Panel>
  );
}

function ThemeToggle({
  baseMap,
  onBaseMapChange,
}: {
  baseMap: BaseMap;
  onBaseMapChange: (base: BaseMap) => void;
}) {
  return (
    <div className="shrink-0 flex border border-edge">
      <button
        onClick={() => onBaseMapChange('dark')}
        title="Dark basemap"
        aria-label="Dark basemap"
        className={`w-7 flex items-center justify-center transition-colors ${
          baseMap === 'dark'
            ? 'bg-cyan/15 text-cyan'
            : 'bg-void text-muted hover:text-ink'
        }`}
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
        </svg>
      </button>
      <button
        onClick={() => onBaseMapChange('light')}
        title="Light basemap"
        aria-label="Light basemap"
        className={`w-7 flex items-center justify-center transition-colors border-l border-edge ${
          baseMap === 'light'
            ? 'bg-cyan/15 text-cyan'
            : 'bg-void text-muted hover:text-ink'
        }`}
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>
    </div>
  );
}

function SlotToggle({
  activeSlot,
  onSetSlot,
}: {
  activeSlot: Slot;
  onSetSlot: (slot: Slot) => void;
}) {
  return (
    <div className="flex border border-edge text-[8px] font-mono uppercase tracking-widest">
      <button
        onClick={() => onSetSlot('a')}
        className={`px-1.5 py-0.5 transition-colors ${
          activeSlot === 'a' ? 'bg-cyan/15 text-cyan' : 'text-muted hover:text-ink'
        }`}
      >
        TGT·A
      </button>
      <button
        onClick={() => onSetSlot('b')}
        className={`px-1.5 py-0.5 transition-colors border-l border-edge ${
          activeSlot === 'b' ? 'bg-amber/15 text-amber' : 'text-muted hover:text-ink'
        }`}
      >
        TGT·B
      </button>
    </div>
  );
}

function FixBlock({
  label,
  coords,
  resolved,
  country,
  resolving,
  tone,
  active,
  onActivate,
}: {
  label: string;
  coords: Coordinates | null;
  resolved: string | null;
  country: string | null;
  resolving: boolean;
  tone: 'cyan' | 'amber';
  active: boolean;
  onActivate: () => void;
}) {
  const toneText = tone === 'cyan' ? 'text-cyan' : 'text-amber';
  const toneBg = tone === 'cyan' ? 'bg-cyan' : 'bg-amber';
  return (
    <button
      onClick={onActivate}
      className={`w-full text-left transition-colors ${active ? '' : 'opacity-70 hover:opacity-100'}`}
    >
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted mb-1.5 flex items-center gap-2">
        <span className={`inline-block w-1.5 h-1.5 ${toneBg}`} />
        <span>§02 · {label}</span>
        {active && <span className={`text-[8px] ${toneText}`}>· ACTIVE</span>}
        <span className="flex-1 h-px bg-edge" />
      </div>
      {coords ? (
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[10px] font-mono">
          <span className="text-muted">LAT</span>
          <span className={`${toneText} tabular-nums`}>
            {coords.lat >= 0 ? 'N' : 'S'}
            {Math.abs(coords.lat).toFixed(5)}°
          </span>
          <span className="text-muted">LON</span>
          <span className={`${toneText} tabular-nums`}>
            {coords.lon >= 0 ? 'E' : 'W'}
            {Math.abs(coords.lon).toFixed(5)}°
          </span>
          <span className="text-muted">CC</span>
          <span className="text-ink">{country ?? '—'}</span>
          <span className="text-muted">LOC</span>
          <span className="text-ink truncate" title={resolved ?? ''}>
            {resolving ? (
              <span className={`${toneText} opacity-70`}>RESOLVING...</span>
            ) : (
              resolved ?? '—'
            )}
          </span>
        </div>
      ) : (
        <div className="text-[9px] font-mono uppercase tracking-wider text-dim">
          NO {label} · CLICK MAP OR ENTER COORD
        </div>
      )}
    </button>
  );
}
