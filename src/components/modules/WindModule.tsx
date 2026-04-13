import { useMemo, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ClimateData, Coordinates } from '../../types';
import { useOpenMeteo } from '../../hooks/useOpenMeteo';
import { buildMonthlyAggregates, type MonthlyAggregate } from '../../utils/climateAggregation';
import {
  buildWindRose,
  DIRECTION_LABELS,
  summariseSeasonalWind,
  type SeasonalWind,
  type WindRoseMatrix,
} from '../../utils/windRoseData';
import { WindRose } from '../charts/WindRose';
import { StatReadout } from '../hud/StatReadout';
import { DualReadout } from '../hud/DualReadout';
import { SectionHeader } from '../hud/SectionHeader';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { GridResolutionWarning } from '../GridResolutionWarning';
import { signedFixed, deltaTone } from '../../utils/compareUtils';

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
  compareMode: boolean;
}

const AXIS_PROPS = { stroke: '#3d4759', fontSize: 9, fontFamily: 'JetBrains Mono, monospace', tickLine: false };
const GRID_PROPS = { stroke: '#1a2338', strokeDasharray: '2 4', vertical: false } as const;
const TOOLTIP_STYLE = {
  background: '#080b15',
  border: '1px solid #2d3a55',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  borderRadius: 0,
  padding: '6px 10px',
};

interface Derived {
  data: ClimateData;
  rose10m: WindRoseMatrix;
  rose100m: WindRoseMatrix | null;
  monthly: MonthlyAggregate[];
  seasonal: SeasonalWind;
  channelingDeg: number | null;
}

function angleDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function deriveOne(data: ClimateData | null): Derived | null {
  if (!data) return null;
  const rose10m = buildWindRose(
    data.hourly.windSpeed10m ?? [],
    data.hourly.windDirection10m ?? [],
  );
  const speed100 = data.hourly.windSpeed100m ?? [];
  const dir100 = data.hourly.windDirection100m ?? [];
  const has100m = speed100.length > 0 && speed100.some((v) => Number.isFinite(v));
  const rose100m = has100m ? buildWindRose(speed100, dir100) : null;
  let channelingDeg: number | null = null;
  if (rose100m) {
    const prev10 = rose10m.prevailingDirection * 22.5;
    const prev100 = rose100m.prevailingDirection * 22.5;
    channelingDeg = angleDiff(prev10, prev100);
  }
  return {
    data,
    rose10m,
    rose100m,
    monthly: buildMonthlyAggregates(data),
    seasonal: summariseSeasonalWind(data.hourly),
    channelingDeg,
  };
}

export function WindModule({ coordsA, coordsB, compareMode }: Props) {
  const stateA = useOpenMeteo(coordsA);
  const stateB = useOpenMeteo(coordsB);

  const a = useMemo(() => deriveOne(stateA.data), [stateA.data]);
  const b = useMemo(() => deriveOne(stateB.data), [stateB.data]);

  if (!coordsA) return <EmptyState />;
  if (stateA.status === 'loading' || stateA.status === 'idle') return <LoadingSkeleton />;
  if (stateA.status === 'error' || !a) return <ErrorState error={stateA.error} />;

  const isCompare = compareMode && coordsA && coordsB;
  if (isCompare) {
    if (stateB.status === 'loading' || stateB.status === 'idle') return <LoadingSkeleton />;
    if (stateB.status === 'error' || !b) return <ErrorState error={stateB.error} />;
    return <CompareView a={a} b={b} />;
  }
  return <SingleView d={a} />;
}

function SingleView({ d }: { d: Derived }) {
  const { rose10m, rose100m, monthly, seasonal, channelingDeg } = d;
  const calmPct = rose10m.total > 0 ? (rose10m.calmCount / rose10m.total) * 100 : 0;
  const prevailing = DIRECTION_LABELS[rose10m.prevailingDirection];
  const prevailing100 = rose100m
    ? DIRECTION_LABELS[rose100m.prevailingDirection]
    : null;

  return (
    <div className="space-y-5">
      <GridResolutionWarning resolved={d.data.resolved} />

      <Section
        code="01"
        title="WIND ROSE"
        subtitle={rose100m ? '10M SURFACE | 100M FREE-ATMOSPHERE · 12 MO' : '16 SECTORS · 5 SPEED BINS · 12 MO'}
      >
        {rose100m ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <RoseCard title="10 M · SURFACE" subtitle="AS YOU FEEL IT" matrix={rose10m} />
              <RoseCard title="100 M · FREE-ATMOSPHERE" subtitle="SYNOPTIC FLOW" matrix={rose100m} />
            </div>
            {channelingDeg !== null && channelingDeg > 30 && (
              <div className="mt-3 border border-warn/40 bg-warn/5 px-3 py-2">
                <div className="text-[9px] font-mono uppercase tracking-widest text-warn flex items-center gap-2">
                  <span>⚠ TERRAIN CHANNELING</span>
                  <span className="flex-1 h-px bg-warn/30" />
                </div>
                <div className="text-[10px] font-mono text-ink mt-1">
                  Surface wind prevails {prevailing} but synoptic flow above the boundary layer is {prevailing100}.
                  A {channelingDeg.toFixed(0)}° divergence indicates local terrain (coastline, valley, ridge) is redirecting airflow near ground.
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center md:flex-row md:items-start md:gap-5">
            <WindRose matrix={rose10m} />
            <div className="grid gap-2 w-full md:w-44 mt-3 md:mt-0">
              <StatReadout label="PREVAILING" value={prevailing} hint={`${(rose10m.prevailingDirection * 22.5).toFixed(0)}°`} tone="cyan" compact />
              <StatReadout label="CALM %" value={`${calmPct.toFixed(1)}%`} hint="< 0.5 KM/H" compact />
              <StatReadout label="WINTER MEAN" value={`${seasonal.winterMeanSpeed.toFixed(1)} KM/H`} hint={`${seasonal.winterMeanTemp.toFixed(1)}°C MEAN`} tone={seasonal.windChillFlag ? 'warn' : 'neutral'} compact />
              <StatReadout label="SAMPLES" value={rose10m.total} hint="HOURLY OBS" compact />
            </div>
          </div>
        )}
      </Section>

      {rose100m && (
        <Section code="02" title="SURFACE READOUT" subtitle="10M · AS YOU FEEL IT">
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            <StatReadout label="PREVAILING" value={prevailing} hint={`${(rose10m.prevailingDirection * 22.5).toFixed(0)}°`} tone="cyan" compact />
            <StatReadout label="CALM %" value={`${calmPct.toFixed(1)}%`} hint="< 0.5 KM/H" compact />
            <StatReadout label="WINTER MEAN" value={`${seasonal.winterMeanSpeed.toFixed(1)} KM/H`} hint={`${seasonal.winterMeanTemp.toFixed(1)}°C MEAN`} tone={seasonal.windChillFlag ? 'warn' : 'neutral'} compact />
            <StatReadout label="SAMPLES" value={rose10m.total} hint="HOURLY OBS" compact />
          </div>
        </Section>
      )}

      {seasonal.windChillFlag && (
        <div className="border border-warn/50 bg-warn/5 px-3 py-2">
          <div className="text-[9px] font-mono uppercase tracking-widest text-warn flex items-center gap-2">
            <span>⚠ WIND CHILL FLAG</span>
            <span className="flex-1 h-px bg-warn/30" />
          </div>
          <div className="text-[10px] font-mono text-ink mt-1">
            Winter mean wind significant at sub-5°C — perceived temperature deficit expected.
          </div>
        </div>
      )}

      <Section code="03" title="MONTHLY VELOCITY" subtitle="MEAN + GUST · KM/H">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="label" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#7eeaff', fontSize: 9, textTransform: 'uppercase' }} />
            <Bar dataKey="windMean" name="MEAN" fill="#7eeaff" />
            <Bar dataKey="gustMax" name="GUST" fill="#ffb347" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function CompareView({ a, b }: { a: Derived; b: Derived }) {
  const calmA = a.rose10m.total ? (a.rose10m.calmCount / a.rose10m.total) * 100 : 0;
  const calmB = b.rose10m.total ? (b.rose10m.calmCount / b.rose10m.total) * 100 : 0;
  const prevA = DIRECTION_LABELS[a.rose10m.prevailingDirection];
  const prevB = DIRECTION_LABELS[b.rose10m.prevailingDirection];

  const merged = useMemo(
    () =>
      a.monthly.map((m, i) => ({
        label: m.label,
        meanA: m.windMean,
        meanB: b.monthly[i].windMean,
        gustA: m.gustMax,
        gustB: b.monthly[i].gustMax,
      })),
    [a.monthly, b.monthly],
  );

  return (
    <div className="space-y-5">
      <Section code="01" title="WIND ROSE · 10M SURFACE" subtitle="A | B · 16 SECTORS · 12 MO">
        <div className="grid gap-3 md:grid-cols-2">
          <SubChart label="A">
            <WindRose matrix={a.rose10m} size={260} />
          </SubChart>
          <SubChart label="B">
            <WindRose matrix={b.rose10m} size={260} />
          </SubChart>
        </div>
      </Section>

      {a.rose100m && b.rose100m && (
        <Section code="02" title="WIND ROSE · 100M FREE-ATMOSPHERE" subtitle="A | B · SYNOPTIC FLOW">
          <div className="grid gap-3 md:grid-cols-2">
            <SubChart label="A">
              <WindRose matrix={a.rose100m} size={260} />
            </SubChart>
            <SubChart label="B">
              <WindRose matrix={b.rose100m} size={260} />
            </SubChart>
          </div>
          {(a.channelingDeg !== null || b.channelingDeg !== null) && (
            <div className="mt-3 text-[9px] font-mono uppercase tracking-widest text-muted">
              ※ Channeling: A {a.channelingDeg?.toFixed(0) ?? '—'}° · B {b.channelingDeg?.toFixed(0) ?? '—'}°
              — divergence between surface & upper flow signals local terrain redirection.
            </div>
          )}
        </Section>
      )}

      <Section code="03" title="WIND READOUT" subtitle="A ↔ B · 10M SURFACE">
        <div className="grid gap-2 md:grid-cols-2">
          <DualReadout
            label="PREVAILING"
            valueA={`${prevA}`}
            valueB={`${prevB}`}
            hintA={`${(a.rose10m.prevailingDirection * 22.5).toFixed(0)}°`}
            hintB={`${(b.rose10m.prevailingDirection * 22.5).toFixed(0)}°`}
          />
          <DualReadout
            label="CALM %"
            valueA={`${calmA.toFixed(1)}%`}
            valueB={`${calmB.toFixed(1)}%`}
            delta={`${signedFixed(calmB - calmA, 1)}%`}
            deltaTone={deltaTone(calmB - calmA, 'higher-good', 1)}
          />
          <DualReadout
            label="WINTER MEAN"
            valueA={`${a.seasonal.winterMeanSpeed.toFixed(1)} KM/H`}
            valueB={`${b.seasonal.winterMeanSpeed.toFixed(1)} KM/H`}
            delta={`${signedFixed(b.seasonal.winterMeanSpeed - a.seasonal.winterMeanSpeed)}`}
            deltaTone={deltaTone(b.seasonal.winterMeanSpeed - a.seasonal.winterMeanSpeed, 'higher-bad', 2)}
          />
          <DualReadout
            label="WINTER TEMP"
            valueA={`${a.seasonal.winterMeanTemp.toFixed(1)}°C`}
            valueB={`${b.seasonal.winterMeanTemp.toFixed(1)}°C`}
            delta={`${signedFixed(b.seasonal.winterMeanTemp - a.seasonal.winterMeanTemp)}°C`}
            deltaTone={deltaTone(b.seasonal.winterMeanTemp - a.seasonal.winterMeanTemp, 'higher-good', 1)}
          />
        </div>
      </Section>

      <Section code="04" title="MONTHLY MEAN" subtitle="KM/H · A vs B">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={merged} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="label" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#7eeaff', fontSize: 9, textTransform: 'uppercase' }} />
            <Bar dataKey="meanA" name="A" fill="#7eeaff" />
            <Bar dataKey="meanB" name="B" fill="#ffb347" />
          </BarChart>
        </ResponsiveContainer>
      </Section>
    </div>
  );
}

function RoseCard({
  title,
  subtitle,
  matrix,
}: {
  title: string;
  subtitle: string;
  matrix: WindRoseMatrix;
}) {
  const prev = DIRECTION_LABELS[matrix.prevailingDirection];
  return (
    <div className="border border-edge bg-bg/40">
      <div className="px-2 py-1 border-b border-edge flex items-center gap-2">
        <span className="text-[9px] font-mono uppercase tracking-widest text-cyan">{title}</span>
        <span className="text-[8px] font-mono uppercase tracking-widest text-muted">· {subtitle}</span>
        <span className="flex-1" />
        <span className="text-[8px] font-mono uppercase tracking-widest text-cyan tabular-nums">
          PREV {prev}
        </span>
      </div>
      <div className="p-2">
        <WindRose matrix={matrix} size={260} />
      </div>
    </div>
  );
}

function Section({ code, title, subtitle, children }: { code: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div>
      <SectionHeader code={code} title={title} subtitle={subtitle} />
      <div className="border border-edge bg-bg/40 p-3">{children}</div>
    </div>
  );
}

function SubChart({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border border-edge bg-bg/40">
      <div className="px-2 py-1 border-b border-edge text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5">
        <span className={`inline-block w-1.5 h-1.5 ${label === 'A' ? 'bg-cyan' : 'bg-amber'}`} />
        <span className={label === 'A' ? 'text-cyan' : 'text-amber'}>TGT · {label}</span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-edge bg-bg/40 p-6 text-center">
      <div className="text-[10px] font-mono uppercase tracking-widest text-cyan/70 mb-1">▸ AWAITING TARGET</div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted">SET COORD VIA INPUT OR MAP CLICK</div>
    </div>
  );
}

function ErrorState({ error }: { error: string | null }) {
  return (
    <div className="border border-risk/50 bg-risk/5 p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-risk mb-1">✖ FETCH FAILED</div>
      {error && <div className="text-[10px] font-mono text-ink break-words">{error}</div>}
    </div>
  );
}
