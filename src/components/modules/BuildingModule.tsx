import { useMemo, useState, type ReactNode } from 'react';
import type { BuildingData, BuildingFacade, Coordinates } from '../../types';
import { useOverpassBuilding } from '../../hooks/useOverpass';
import { cardinal } from '../../utils/coordinates';
import { BuildingCompass } from '../charts/BuildingCompass';
import { StatReadout } from '../hud/StatReadout';
import { DualReadout } from '../hud/DualReadout';
import { SectionHeader } from '../hud/SectionHeader';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { signedFixed, deltaTone } from '../../utils/compareUtils';

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
  compareMode: boolean;
}

export function BuildingModule({ coordsA, coordsB, compareMode }: Props) {
  const a = useOverpassBuilding(coordsA);
  const b = useOverpassBuilding(coordsB);

  if (!coordsA) return <EmptyState />;

  if (a.status === 'loading' || a.status === 'idle') return <LoadingSkeleton />;
  if (a.status === 'error' || !a.data) return <ErrorState error={a.error} />;

  const isCompare = compareMode && coordsA && coordsB;

  if (isCompare) {
    if (b.status === 'loading' || b.status === 'idle') return <LoadingSkeleton />;
    if (b.status === 'error' || !b.data) return <ErrorState error={b.error} />;
    return <CompareView a={a.data} b={b.data} />;
  }

  return <SingleView data={a.data} />;
}

function SingleView({ data }: { data: BuildingData }) {
  const [manualBearing, setManualBearing] = useState(0);

  const manualFacades = useMemo<BuildingFacade[]>(() => {
    const front = manualBearing;
    return (
      [
        ['Front', front],
        ['Right', (front + 90) % 360],
        ['Rear', (front + 180) % 360],
        ['Left', (front + 270) % 360],
      ] as const
    ).map(([label, bearing]) => ({ label, bearing, cardinal: cardinal(bearing) }));
  }, [manualBearing]);

  if (!data.found) {
    return (
      <div className="space-y-5">
        <div className="border border-warn/40 bg-warn/5 px-3 py-2">
          <div className="text-[9px] font-mono uppercase tracking-widest text-warn flex items-center gap-2">
            <span>※ NO OSM FOOTPRINT</span>
            <span className="flex-1 h-px bg-warn/30" />
          </div>
          <div className="text-[10px] font-mono text-ink mt-1">
            No building polygon within 60 m. Set front-door bearing manually for facade cross-reference.
          </div>
        </div>

        <Section code="01" title="MANUAL BEARING" subtitle="FRONT-DOOR DIRECTION">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={359}
              value={manualBearing}
              onChange={(e) => setManualBearing(parseInt(e.target.value, 10))}
              className="flex-1 accent-cyan"
            />
            <div className="font-mono text-cyan text-sm tabular-nums w-24 text-right">
              {manualBearing}° · {cardinal(manualBearing)}
            </div>
          </div>
        </Section>

        <Section code="02" title="DERIVED FACADES" subtitle="MANUAL · 90° ROTATIONS">
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            {manualFacades.map((f) => (
              <StatReadout key={f.label} label={f.label.toUpperCase()} value={f.cardinal} hint={`${f.bearing.toFixed(0)}°`} tone="cyan" compact />
            ))}
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Section code="01" title="FOOTPRINT" subtitle="OSM POLYGON · COMPASS PROJECTION">
        <div className="grid gap-4 md:grid-cols-[auto_1fr] items-start">
          <BuildingCompass building={data} />
          <div className="grid gap-2 self-start">
            <StatReadout label="LONG AXIS" value={`${data.longestEdgeBearing.toFixed(0)}°`} hint={cardinal(data.longestEdgeBearing)} tone="cyan" compact />
            <StatReadout label="AREA" value={`${data.areaSqm.toFixed(0)} m²`} hint={(data.type ?? 'BUILDING').toUpperCase()} compact />
            {data.levels !== null && <StatReadout label="LEVELS" value={data.levels} compact />}
          </div>
        </div>
      </Section>

      <Section code="02" title="FACADE DIRECTIONS" subtitle="GEOMETRIC · ROTATE TO MATCH FRONT DOOR">
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
          {data.facades.map((f) => (
            <StatReadout key={f.label} label={f.label.toUpperCase()} value={f.cardinal} hint={`${f.bearing.toFixed(0)}°`} tone="cyan" compact />
          ))}
        </div>
      </Section>

      <div className="text-[9px] font-mono uppercase tracking-widest text-dim">
        ※ FACADE LABELS ARE GEOMETRIC PLACEHOLDERS · SUN/WIND MOD CROSS-REF THESE BEARINGS
      </div>
    </div>
  );
}

function CompareView({ a, b }: { a: BuildingData; b: BuildingData }) {
  return (
    <div className="space-y-5">
      <Section code="01" title="FOOTPRINTS" subtitle="A | B · OSM POLYGONS">
        <div className="grid gap-3 md:grid-cols-2">
          <SubChart label="A">
            {a.found ? (
              <BuildingCompass building={a} size={220} />
            ) : (
              <div className="text-[10px] font-mono uppercase tracking-widest text-dim p-4 text-center">
                NO OSM POLYGON
              </div>
            )}
          </SubChart>
          <SubChart label="B">
            {b.found ? (
              <BuildingCompass building={b} size={220} />
            ) : (
              <div className="text-[10px] font-mono uppercase tracking-widest text-dim p-4 text-center">
                NO OSM POLYGON
              </div>
            )}
          </SubChart>
        </div>
      </Section>

      {(a.found || b.found) && (
        <Section code="02" title="STRUCTURE READOUT" subtitle="A ↔ B">
          <div className="grid gap-2 md:grid-cols-2">
            <DualReadout
              label="LONG AXIS"
              valueA={a.found ? `${a.longestEdgeBearing.toFixed(0)}°` : '—'}
              valueB={b.found ? `${b.longestEdgeBearing.toFixed(0)}°` : '—'}
              hintA={a.found ? cardinal(a.longestEdgeBearing) : ''}
              hintB={b.found ? cardinal(b.longestEdgeBearing) : ''}
            />
            <DualReadout
              label="FOOTPRINT"
              valueA={a.found ? `${a.areaSqm.toFixed(0)} m²` : '—'}
              valueB={b.found ? `${b.areaSqm.toFixed(0)} m²` : '—'}
              delta={
                a.found && b.found
                  ? `${signedFixed(b.areaSqm - a.areaSqm, 0)} m²`
                  : undefined
              }
              deltaTone={
                a.found && b.found
                  ? deltaTone(b.areaSqm - a.areaSqm, 'neutral', 0)
                  : 'neutral'
              }
            />
            <DualReadout
              label="LEVELS"
              valueA={a.found && a.levels !== null ? a.levels : '—'}
              valueB={b.found && b.levels !== null ? b.levels : '—'}
            />
            <DualReadout
              label="TYPE"
              valueA={a.found ? (a.type ?? 'BLDG').toUpperCase() : '—'}
              valueB={b.found ? (b.type ?? 'BLDG').toUpperCase() : '—'}
            />
          </div>
        </Section>
      )}

      {(a.found || b.found) && (
        <Section code="03" title="FACADES" subtitle="GEOMETRIC ROTATIONS">
          <div className="grid gap-3 md:grid-cols-2">
            {a.found && (
              <SubChart label="A">
                <FacadeList facades={a.facades} />
              </SubChart>
            )}
            {b.found && (
              <SubChart label="B">
                <FacadeList facades={b.facades} />
              </SubChart>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

function FacadeList({ facades }: { facades: BuildingFacade[] }) {
  return (
    <div className="grid gap-1 text-[10px] font-mono">
      {facades.map((f) => (
        <div key={f.label} className="flex items-center justify-between border border-edge bg-bg/60 px-2 py-1">
          <span className="text-muted uppercase tracking-widest">{f.label}</span>
          <span className="text-ink">{f.cardinal} · {f.bearing.toFixed(0)}°</span>
        </div>
      ))}
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
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted">SET COORD TO DETECT FOOTPRINT</div>
    </div>
  );
}

function ErrorState({ error }: { error: string | null }) {
  return (
    <div className="border border-risk/50 bg-risk/5 p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-risk mb-1">✖ OVERPASS FAULT</div>
      {error && <div className="text-[10px] font-mono text-ink break-words">{error}</div>}
    </div>
  );
}
