import { useMemo, type ReactNode } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Coordinates } from '../../types';
import { useSunData, hoursSunlitOnFacade, type SunData } from '../../hooks/useSunCalc';
import { useOverpassBuilding } from '../../hooks/useOverpass';
import { useFacadeOverride } from '../../hooks/useFacadeOverride';
import { rotateFacades } from '../../utils/buildingOrientation';
import { SunPathArc } from '../charts/SunPathArc';
import { StatReadout } from '../hud/StatReadout';
import { DualReadout } from '../hud/DualReadout';
import { SectionHeader } from '../hud/SectionHeader';
import { signedFixed, deltaTone } from '../../utils/compareUtils';
import { fmtTooltipNum } from '../../utils/chartFmt';

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

function formatTime(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SunModule({ coordsA, coordsB, compareMode }: Props) {
  const sunA = useSunData(coordsA);
  const sunB = useSunData(coordsB);
  const buildingA = useOverpassBuilding(coordsA);
  const buildingB = useOverpassBuilding(coordsB);
  const [overrideA] = useFacadeOverride(coordsA, 'A');
  const [overrideB] = useFacadeOverride(coordsB, 'B');

  if (!coordsA) return <EmptyState />;
  if (!sunA) return <div className="text-[10px] font-mono uppercase tracking-widest text-cyan/70">▸ COMPUTING ...</div>;

  const isCompare = compareMode && coordsA && coordsB;
  if (isCompare && !sunB) {
    return <div className="text-[10px] font-mono uppercase tracking-widest text-cyan/70">▸ COMPUTING ...</div>;
  }

  const facadesA = buildingA.data?.found
    ? rotateFacades(buildingA.data.facades, overrideA)
    : [];
  const facadesB = buildingB.data?.found
    ? rotateFacades(buildingB.data.facades, overrideB)
    : [];

  if (isCompare && sunB) {
    return <CompareView a={sunA} b={sunB} facadesA={facadesA} facadesB={facadesB} />;
  }

  return <SingleView sun={sunA} facades={facadesA} />;
}

function SingleView({
  sun,
  facades,
}: {
  sun: SunData;
  facades: { label: string; bearing: number; cardinal: string }[];
}) {
  return (
    <div className="space-y-5">
      <Section code="01" title="SUN PATH" subtitle="WINTER · EQUINOX · SUMMER">
        <div className="overflow-x-auto">
          <SunPathArc winter={sun.winter} equinox={sun.equinox} summer={sun.summer} />
        </div>
      </Section>

      <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
        <StatReadout label="WINTER DAYLIGHT" value={`${sun.winter.daylightHours.toFixed(1)} H`} hint={`MAX ${sun.winter.maxAltitude.toFixed(0)}°`} tone={sun.winter.daylightHours < 8 ? 'warn' : 'cyan'} compact />
        <StatReadout label="SUMMER DAYLIGHT" value={`${sun.summer.daylightHours.toFixed(1)} H`} hint={`MAX ${sun.summer.maxAltitude.toFixed(0)}°`} tone="amber" compact />
        <StatReadout label="GOLDEN HR" value={formatTime(sun.todayGoldenHourStart)} hint={`END ${formatTime(sun.todayGoldenHourEnd)}`} compact />
        <StatReadout label="BLUE HR END" value={formatTime(sun.todayBlueHourEnd)} hint="TODAY" compact />
      </div>

      <Section code="02" title="DAYLIGHT DURATION" subtitle="HOURS · 15TH OF MONTH">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={sun.monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="label" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} domain={[0, 24]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#7eeaff', fontSize: 9, textTransform: 'uppercase' }} formatter={fmtTooltipNum('h')} />
            <Area type="monotone" dataKey="hours" stroke="#ffb347" strokeWidth={1.6} fill="#ffb347" fillOpacity={0.18} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {facades.length > 0 ? (
        <Section code="03" title="FACADE SUNLIGHT" subtitle="DIRECT HOURS · OSM FOOTPRINT">
          <FacadeTable facades={facades} sun={sun} />
        </Section>
      ) : (
        <div className="text-[9px] font-mono uppercase tracking-widest text-dim">
          ※ OPEN BUILDING MOD TO SET ORIENTATION FOR FACADE BREAKDOWN
        </div>
      )}
    </div>
  );
}

function CompareView({
  a,
  b,
  facadesA,
  facadesB,
}: {
  a: SunData;
  b: SunData;
  facadesA: { label: string; bearing: number; cardinal: string }[];
  facadesB: { label: string; bearing: number; cardinal: string }[];
}) {
  const merged = useMemo(
    () =>
      a.monthly.map((m, i) => ({
        label: m.label,
        hoursA: m.hours,
        hoursB: b.monthly[i].hours,
      })),
    [a.monthly, b.monthly],
  );

  return (
    <div className="space-y-5">
      <Section code="01" title="SUN PATH" subtitle="A | B · WINTER · EQUINOX · SUMMER">
        <div className="grid gap-3 md:grid-cols-2">
          <SubChart label="A">
            <SunPathArc winter={a.winter} equinox={a.equinox} summer={a.summer} width={300} height={170} />
          </SubChart>
          <SubChart label="B">
            <SunPathArc winter={b.winter} equinox={b.equinox} summer={b.summer} width={300} height={170} />
          </SubChart>
        </div>
      </Section>

      <Section code="02" title="DAYLIGHT READOUT" subtitle="A ↔ B">
        <div className="grid gap-2 md:grid-cols-2">
          <DualReadout
            label="WINTER DAYLIGHT"
            valueA={`${a.winter.daylightHours.toFixed(1)} H`}
            valueB={`${b.winter.daylightHours.toFixed(1)} H`}
            delta={`${signedFixed(b.winter.daylightHours - a.winter.daylightHours)} H`}
            deltaTone={deltaTone(b.winter.daylightHours - a.winter.daylightHours, 'higher-good', 0.5)}
          />
          <DualReadout
            label="SUMMER DAYLIGHT"
            valueA={`${a.summer.daylightHours.toFixed(1)} H`}
            valueB={`${b.summer.daylightHours.toFixed(1)} H`}
            delta={`${signedFixed(b.summer.daylightHours - a.summer.daylightHours)} H`}
            deltaTone={deltaTone(b.summer.daylightHours - a.summer.daylightHours, 'higher-good', 0.5)}
          />
          <DualReadout
            label="WINTER MAX ALT"
            valueA={`${a.winter.maxAltitude.toFixed(0)}°`}
            valueB={`${b.winter.maxAltitude.toFixed(0)}°`}
            delta={`${signedFixed(b.winter.maxAltitude - a.winter.maxAltitude, 0)}°`}
            deltaTone={deltaTone(b.winter.maxAltitude - a.winter.maxAltitude, 'higher-good', 2)}
          />
          <DualReadout
            label="SUMMER MAX ALT"
            valueA={`${a.summer.maxAltitude.toFixed(0)}°`}
            valueB={`${b.summer.maxAltitude.toFixed(0)}°`}
            delta={`${signedFixed(b.summer.maxAltitude - a.summer.maxAltitude, 0)}°`}
            deltaTone={deltaTone(b.summer.maxAltitude - a.summer.maxAltitude, 'higher-good', 2)}
          />
        </div>
      </Section>

      <Section code="03" title="DAYLIGHT DURATION" subtitle="HOURS · A vs B">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={merged} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="label" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} domain={[0, 24]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#7eeaff', fontSize: 9, textTransform: 'uppercase' }} formatter={fmtTooltipNum('h')} />
            <Line type="monotone" dataKey="hoursA" name="A" stroke="#7eeaff" strokeWidth={1.8} dot={false} />
            <Line type="monotone" dataKey="hoursB" name="B" stroke="#ffb347" strokeWidth={1.8} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Section>

      {(facadesA.length > 0 || facadesB.length > 0) && (
        <Section code="04" title="FACADE SUNLIGHT" subtitle="WHERE OSM FOOTPRINT AVAILABLE">
          <div className="grid gap-3 md:grid-cols-2">
            {facadesA.length > 0 && (
              <SubChart label="A">
                <FacadeTable facades={facadesA} sun={a} />
              </SubChart>
            )}
            {facadesB.length > 0 && (
              <SubChart label="B">
                <FacadeTable facades={facadesB} sun={b} />
              </SubChart>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

function FacadeTable({
  facades,
  sun,
}: {
  facades: { label: string; bearing: number; cardinal: string }[];
  sun: SunData;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="text-muted uppercase tracking-widest text-left border-b border-edge">
            <th className="py-1.5 pr-2 font-normal">FACADE</th>
            <th className="py-1.5 pr-2 font-normal">BRG</th>
            <th className="py-1.5 pr-2 font-normal text-cyan">WTR</th>
            <th className="py-1.5 pr-2 font-normal text-ink">EQX</th>
            <th className="py-1.5 pr-2 font-normal text-amber">SMR</th>
          </tr>
        </thead>
        <tbody>
          {facades.map((f) => (
            <tr key={f.label} className="border-b border-edge/50">
              <td className="py-1.5 pr-2 text-ink">{f.label.toUpperCase()}</td>
              <td className="py-1.5 pr-2 text-muted">{f.cardinal}</td>
              <td className="py-1.5 pr-2 text-cyan tabular-nums">{hoursSunlitOnFacade(f.bearing, sun.winter)}H</td>
              <td className="py-1.5 pr-2 text-ink tabular-nums">{hoursSunlitOnFacade(f.bearing, sun.equinox)}H</td>
              <td className="py-1.5 pr-2 text-amber tabular-nums">{hoursSunlitOnFacade(f.bearing, sun.summer)}H</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ code, title, subtitle, children }: { code: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div>
      <SectionHeader code={code} title={title} subtitle={subtitle} />
      <div className="border border-edge bg-bg/40 p-3 rounded-md">{children}</div>
    </div>
  );
}

function SubChart({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border border-edge bg-bg/40 rounded-md">
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
    <div className="border border-edge bg-bg/40 p-6 text-center rounded-md">
      <div className="text-[10px] font-mono uppercase tracking-widest text-cyan/70 mb-1">▸ AWAITING TARGET</div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted">SET COORD VIA INPUT OR MAP CLICK</div>
    </div>
  );
}
