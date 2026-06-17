import React, { useEffect, useRef, useState } from 'react';
import type { Coordinates } from '../../types';
import type { Slot } from '../../hooks/useUrlState';
import { formatCoordinate, parseCoordinates } from '../../utils/coordinates';
import { forwardGeocode, type GeocodeResult } from '../../hooks/useNominatim';
import { Panel } from '../hud/Panel';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeMode } from '../../contexts/ThemeContext';
import { useFontScale } from '../../contexts/FontScaleContext';
import { useSavedLocations } from '../../hooks/useSavedLocations';

const HeartOutline = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const HeartFilled = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

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

  const { locations, isSaved, toggle, remove } = useSavedLocations();
  const [capWarning, setCapWarning] = useState(false);

  const currentSaved = coordsA ? isSaved(coordsA.lat, coordsA.lon) : false;

  function handleHeartToggle() {
    if (!coordsA) return;
    const label = resolvedA ?? `${coordsA.lat.toFixed(5)}, ${coordsA.lon.toFixed(5)}`;
    const result = toggle({ label, lat: coordsA.lat, lon: coordsA.lon });
    if (result.rejected) {
      setCapWarning(true);
      setTimeout(() => setCapWarning(false), 3000);
    } else {
      setCapWarning(false);
    }
  }

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
          <div className="font-mono text-[17px] font-bold leading-none tracking-tight text-ink lowercase">
            settl<span className="text-cyan">.</span>
          </div>
          <div className="text-[8px] font-mono uppercase tracking-widest text-muted mt-1">
            LOCATION INTELLIGENCE
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
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <FontScaleControl />
            </div>
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

        {coordsA && (
          <div className="flex items-center gap-2 -mt-1">
            <button
              onClick={handleHeartToggle}
              disabled={resolvingA}
              aria-label={currentSaved ? 'Remove saved location' : 'Save location'}
              aria-pressed={currentSaved}
              className={`p-1 rounded transition-colors ${
                currentSaved
                  ? 'text-rose-400 hover:text-rose-300'
                  : 'text-muted hover:text-ink'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {currentSaved ? <HeartFilled /> : <HeartOutline />}
            </button>
            <span className="text-[8px] font-mono uppercase tracking-widest text-muted">
              {currentSaved ? 'SAVED' : 'SAVE LOCATION'}
            </span>
            {capWarning && (
              <span className="text-[8px] font-mono uppercase tracking-widest text-risk">
                MAX 10 REACHED
              </span>
            )}
          </div>
        )}

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

        {locations.length > 0 && (
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted mb-1.5 flex items-center gap-2">
              <span>SAVED · {locations.length}/10</span>
              <span className="flex-1 h-px bg-edge" />
            </div>
            <div className="space-y-0.5">
              {locations.map(loc => (
                <div key={loc.id} className="flex items-center gap-1 group">
                  <button
                    onClick={() => onChangeA({ lat: loc.lat, lon: loc.lon })}
                    className="flex-1 text-left px-2 py-1 text-[10px] font-mono text-ink truncate rounded hover:bg-cyan/5 transition-colors"
                    title={`${loc.label} (${loc.lat.toFixed(5)}, ${loc.lon.toFixed(5)})`}
                  >
                    {loc.label}
                  </button>
                  <button
                    onClick={() => remove(loc.id)}
                    aria-label={`Remove ${loc.label}`}
                    className="shrink-0 p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-risk transition-all"
                  >
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[8px] font-mono uppercase tracking-widest text-dim pt-2 border-t border-edge">
          ↩ EXEC · MAP CLICK = SET ACTIVE TGT · DRAG PIN = NUDGE
        </div>
      </div>
    </Panel>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const modes: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      mode: 'light',
      label: 'Light theme',
      icon: (
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ),
    },
    {
      mode: 'system',
      label: 'System theme',
      icon: (
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      ),
    },
    {
      mode: 'dark',
      label: 'Dark theme',
      icon: (
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="shrink-0 flex border border-edge rounded-md overflow-hidden">
      {modes.map(({ mode, label, icon }, i) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          title={label}
          aria-label={label}
          className={`w-7 h-7 flex items-center justify-center transition-colors ${
            i > 0 ? 'border-l border-edge' : ''
          } ${
            theme === mode
              ? 'bg-cyan/15 text-cyan'
              : 'bg-void text-muted hover:text-ink'
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function FontScaleControl() {
  const { scale, increase, decrease } = useFontScale();

  return (
    <div className="shrink-0 flex items-center border border-edge rounded-md overflow-hidden">
      <button
        onClick={decrease}
        disabled={scale <= 0.8}
        aria-label="Decrease font size"
        title="Decrease font size"
        className="w-7 h-7 flex items-center justify-center transition-colors bg-void text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span className="text-[10px] font-bold leading-none">A-</span>
      </button>
      <span className="px-1.5 text-[9px] text-muted tabular-nums min-w-[32px] text-center border-x border-edge bg-void/50">
        {Math.round(scale * 100)}%
      </span>
      <button
        onClick={increase}
        disabled={scale >= 1.4}
        aria-label="Increase font size"
        title="Increase font size"
        className="w-7 h-7 flex items-center justify-center transition-colors bg-void text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <span className="text-[10px] font-bold leading-none">A+</span>
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
