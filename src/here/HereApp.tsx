import { useCallback, useEffect, useMemo, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import type { Coordinates } from '../types';
import { useOpenMeteo } from '../hooks/useOpenMeteo';
import { useCompassHeading } from '../hooks/useCompassHeading';
import { buildMonthlyAggregates, type MonthlyAggregate } from '../utils/climateAggregation';
import { buildMonthRose, DIRECTION_LABELS } from '../utils/windRoseData';
import { WindRose } from '../components/charts/WindRose';
import { StatReadout } from '../components/hud/StatReadout';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WIND = '#7eeaff';
const RAIN = '#a5d8ff';
const SUN = '#ffb347';

type Geo =
  | { status: 'locating' }
  | { status: 'ok'; coords: Coordinates; accuracy: number }
  | { status: 'error'; message: string };

function useHere() {
  const [geo, setGeo] = useState<Geo>({ status: 'locating' });
  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setGeo({ status: 'error', message: 'This browser has no location access.' });
      return;
    }
    setGeo({ status: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ status: 'ok', coords: { lat: p.coords.latitude, lon: p.coords.longitude }, accuracy: p.coords.accuracy }),
      (e) => setGeo({
        status: 'error',
        message: e.code === e.PERMISSION_DENIED
          ? 'Location permission denied. Allow it in your browser settings, then retry.'
          : 'Could not get a location fix. Retry.',
      }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 },
    );
  }, []);
  useEffect(locate, [locate]);
  return { geo, locate };
}

interface Summary {
  wind: number;
  gust: number;
  rain: number;
  wetDays: number;
  sun: number;
  days: number;
  high: number;
  low: number;
}

function summarise(monthly: MonthlyAggregate[], month: number | null): Summary {
  if (month !== null) {
    const m = monthly[month];
    return {
      wind: m.windMean, gust: m.gustMax, rain: m.rainSum, wetDays: m.rainDays, sun: m.sunshineHours,
      days: new Date(2025, month + 1, 0).getDate(), high: m.avgHigh, low: m.avgLow,
    };
  }
  const avg = (f: (m: MonthlyAggregate) => number) => monthly.reduce((s, m) => s + f(m), 0) / 12;
  const sum = (f: (m: MonthlyAggregate) => number) => monthly.reduce((s, m) => s + f(m), 0);
  return {
    wind: avg((m) => m.windMean), gust: Math.max(...monthly.map((m) => m.gustMax)),
    rain: sum((m) => m.rainSum), wetDays: sum((m) => m.rainDays), sun: sum((m) => m.sunshineHours),
    days: 365, high: avg((m) => m.avgHigh), low: avg((m) => m.avgLow),
  };
}

export function HereApp() {
  const { geo, locate } = useHere();
  const coords = geo.status === 'ok' ? geo.coords : null;
  const weather = useOpenMeteo(coords);
  const compass = useCompassHeading();
  const [month, setMonth] = useState<number | null>(() => new Date().getMonth());

  const monthly = useMemo(() => (weather.data ? buildMonthlyAggregates(weather.data, 1) : null), [weather.data]);
  const rose = useMemo(() => (weather.data ? buildMonthRose(weather.data.hourly, month) : null), [weather.data, month]);

  return (
    <main className="min-h-[100dvh] max-w-md mx-auto px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),24px)] font-mono">
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-cyan">settl. here</div>
          <div className="text-[9px] uppercase tracking-widest text-muted truncate">
            {geo.status === 'ok'
              ? `${geo.coords.lat.toFixed(4)}, ${geo.coords.lon.toFixed(4)} · ±${Math.round(geo.accuracy)} M`
              : geo.status === 'locating' ? 'Finding you…' : 'No location'}
          </div>
        </div>
        <button
          type="button"
          onClick={locate}
          aria-label="Locate again"
          className="border border-edge bg-void p-2 rounded-md text-cyan hover:border-cyan transition-colors"
        >
          <LocateFixed size={16} strokeWidth={1.6} />
        </button>
      </header>

      {geo.status === 'error' && <Notice tone="risk" text={geo.message} />}
      {geo.status === 'locating' && <Notice tone="muted" text="Waiting for GPS…" />}
      {coords && weather.status === 'error' && <Notice tone="risk" text={weather.error ?? 'Weather fetch failed.'} />}
      {coords && (weather.status === 'loading' || weather.status === 'idle') && <Notice tone="muted" text="Loading a year of weather for this spot…" />}

      {monthly && rose && (
        <>
          {compass.needsPermission && (
            <div className="flex justify-center mb-2">
              <button
                type="button"
                onClick={compass.request}
                className="text-[9px] font-mono uppercase tracking-widest border border-edge bg-void px-3 py-1.5 rounded-md text-amber hover:border-amber hover:bg-amber/5 transition-colors"
              >
                Align to compass
              </button>
            </div>
          )}

          <WindRose matrix={rose} size={300} heading={compass.heading} />

          <div className="grid grid-cols-[repeat(12,1fr)_auto] gap-1 mt-4" role="tablist" aria-label="Month">
            {MONTHS.map((m, i) => (
              <MonthButton key={m} label={m[0]} title={m} active={month === i} onClick={() => setMonth(i)} />
            ))}
            <MonthButton label="YR" title="Whole year" active={month === null} onClick={() => setMonth(null)} />
          </div>

          <MonthStats s={summarise(monthly, month)} prevailing={DIRECTION_LABELS[rose.prevailingDirection]} label={month === null ? 'YEAR' : MONTHS[month].toUpperCase()} />

          <div className="space-y-3 mt-4 border border-edge bg-bg/40 p-3 rounded-md">
            <Strip label="Wind" unit="km/h mean" color={WIND} values={monthly.map((m) => m.windMean)} month={month} onPick={setMonth} />
            <Strip label="Rain" unit="mm" color={RAIN} values={monthly.map((m) => m.rainSum)} month={month} onPick={setMonth} />
            <Strip label="Sun" unit="hours" color={SUN} values={monthly.map((m) => m.sunshineHours)} month={month} onPick={setMonth} />
          </div>

          <div className="mt-3 text-[8px] uppercase tracking-widest text-dim text-center">
            Last 12 months hourly · {weather.data?.resolved.model} · Open-Meteo
          </div>
        </>
      )}
    </main>
  );
}

function MonthStats({ s, prevailing, label }: { s: Summary; prevailing: string; label: string }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <StatReadout label={`Wind · ${label}`} value={`${s.wind.toFixed(0)} KM/H`} hint={`Gust ${s.gust.toFixed(0)} · from ${prevailing}`} tone="cyan" compact />
      <StatReadout label={`Rain · ${label}`} value={`${s.rain.toFixed(0)} MM`} hint={`${s.wetDays.toFixed(0)} wet days`} compact />
      <StatReadout label={`Sun · ${label}`} value={`${s.sun.toFixed(0)} H`} hint={`${(s.sun / s.days).toFixed(1)} h / day`} tone="amber" compact />
      <StatReadout label={`Temp · ${label}`} value={`${s.high.toFixed(0)}° / ${s.low.toFixed(0)}°`} hint="Avg high / low" compact />
    </div>
  );
}

function MonthButton({ label, title, active, onClick }: { label: string; title: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      title={title}
      onClick={onClick}
      className={`text-[10px] font-mono uppercase border rounded-md py-1.5 px-1 transition-colors ${
        active ? 'border-cyan text-cyan bg-cyan/10' : 'border-edge text-muted bg-void'
      }`}
    >
      {label}
    </button>
  );
}

function Strip({ label, unit, color, values, month, onPick }: {
  label: string;
  unit: string;
  color: string;
  values: number[];
  month: number | null;
  onPick: (m: number) => void;
}) {
  const max = Math.max(...values, 1e-9);
  return (
    <div>
      <div className="flex justify-between text-[9px] uppercase tracking-widest">
        <span className="text-ink">{label}</span>
        <span className="text-muted">{unit}</span>
      </div>
      <div className="flex items-end gap-1 h-10 mt-1">
        {values.map((v, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            aria-label={`${MONTHS[i]}: ${v.toFixed(0)} ${unit}`}
            className="flex-1 h-full flex items-end"
          >
            <span
              className="w-full rounded-sm transition-opacity"
              style={{ height: `${Math.max(6, (v / max) * 100)}%`, background: color, opacity: month === null || month === i ? 1 : 0.3 }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function Notice({ tone, text }: { tone: 'risk' | 'muted'; text: string }) {
  return (
    <div className={`border p-4 rounded-md text-[10px] uppercase tracking-widest ${tone === 'risk' ? 'border-risk/50 bg-risk/5 text-risk' : 'border-edge bg-bg/40 text-muted'}`}>
      {text}
    </div>
  );
}
