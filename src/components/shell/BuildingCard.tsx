import type { Coordinates } from '../../types';
import { useOverpassBuilding } from '../../hooks/useOverpass';
import { cardinal } from '../../utils/coordinates';
import { BuildingCompass } from '../charts/BuildingCompass';
import { Panel } from '../hud/Panel';

interface Props {
  coords: Coordinates | null;
  slot: 'A' | 'B';
}

export function BuildingCard({ coords, slot }: Props) {
  const state = useOverpassBuilding(coords);
  if (!coords) return null;

  const tone = slot === 'A' ? 'text-cyan' : 'text-amber';
  const bg = slot === 'A' ? 'bg-cyan' : 'bg-amber';

  return (
    <Panel className="w-[360px]">
      <div className="px-4 py-2 border-b border-edge flex items-center gap-2">
        <span className={`inline-block w-1.5 h-1.5 ${bg}`} />
        <span className="text-[9px] font-mono uppercase tracking-widest text-muted">
          §BLD · {slot === 'A' ? 'FIX A' : 'FIX B'}
        </span>
        <span className="flex-1 h-px bg-edge" />
        <span className={`text-[8px] font-mono uppercase tracking-widest ${tone}`}>
          OSM FOOTPRINT
        </span>
      </div>

      <div className="p-3">
        {state.status === 'loading' || state.status === 'idle' ? (
          <div className="text-[9px] font-mono uppercase tracking-widest text-dim py-4 text-center">
            ▸ QUERYING OVERPASS
          </div>
        ) : state.status === 'error' ? (
          <div className="text-[9px] font-mono uppercase tracking-widest text-risk py-2">
            ✖ OVERPASS FAULT
          </div>
        ) : !state.data || !state.data.found ? (
          <div className="border border-warn/30 bg-warn/5 px-3 py-2">
            <div className="text-[9px] font-mono uppercase tracking-widest text-warn">
              ※ NO OSM FOOTPRINT ≤400M
            </div>
            <div className="text-[9px] font-mono text-muted mt-0.5">
              Area appears un-mapped on OSM. Dense building data requires
              community-mapped polygons — small villages often have gaps.
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <BuildingCompass building={state.data} size={150} />
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-0.5 text-[10px] font-mono min-w-0">
                <span className="text-muted">AXIS</span>
                <span className={`${tone} tabular-nums`}>
                  {state.data.longestEdgeBearing.toFixed(0)}°{' '}
                  <span className="text-muted">
                    {cardinal(state.data.longestEdgeBearing)}
                  </span>
                </span>
                <span className="text-muted">AREA</span>
                <span className="text-ink tabular-nums">
                  {state.data.areaSqm.toFixed(0)} m²
                </span>
                {state.data.levels !== null && (
                  <>
                    <span className="text-muted">LVL</span>
                    <span className="text-ink tabular-nums">{state.data.levels}</span>
                  </>
                )}
                {state.data.type && (
                  <>
                    <span className="text-muted">TYPE</span>
                    <span className="text-ink uppercase truncate">{state.data.type}</span>
                  </>
                )}
                <span className="text-muted">FRNT</span>
                <span className={`${tone}`}>
                  {state.data.facades[0]?.cardinal ?? '—'}
                </span>
              </div>
            </div>
            {state.data.matchDistanceM !== null &&
              state.data.matchDistanceM > 40 && (
                <div className="mt-2 text-[9px] font-mono uppercase tracking-widest text-warn/80">
                  ⚠ NEAREST FOOTPRINT {state.data.matchDistanceM.toFixed(0)}M FROM PIN
                </div>
              )}
          </>
        )}
      </div>
    </Panel>
  );
}
