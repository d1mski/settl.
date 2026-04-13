import type { Coordinates } from '../../types';
import type { Slot } from '../../hooks/useUrlState';
import { computeCompareGeometry, formatDistance } from '../../utils/compareUtils';

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
  compareMode: boolean;
  activeSlot: Slot;
  resolvedA: string | null;
  resolvingA: boolean;
}

export function MapHud({
  coordsA,
  coordsB,
  compareMode,
  activeSlot,
  resolvedA,
  resolvingA,
}: Props) {
  const compare = compareMode && coordsA && coordsB
    ? computeCompareGeometry(coordsA, coordsB)
    : null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Corner brackets on map viewport */}
      <span className="absolute top-0 left-0 w-8 h-8 border-t border-l border-cyan/30" />
      <span className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan/30" />
      <span className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-cyan/30" />
      <span className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-cyan/30" />

      {/* Center reticle (hidden when both pins set since they have their own reticles) */}
      {!compare && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="120" height="120" viewBox="0 0 120 120" className="opacity-30">
            <g stroke="#7eeaff" strokeWidth="0.8" fill="none">
              <circle cx="60" cy="60" r="28" strokeDasharray="2 4" />
              <circle cx="60" cy="60" r="1.5" fill="#7eeaff" />
              <line x1="60" y1="0" x2="60" y2="26" />
              <line x1="60" y1="94" x2="60" y2="120" />
              <line x1="0" y1="60" x2="26" y2="60" />
              <line x1="94" y1="60" x2="120" y2="60" />
              <line x1="60" y1="20" x2="60" y2="24" strokeWidth="1.5" />
              <line x1="60" y1="96" x2="60" y2="100" strokeWidth="1.5" />
              <line x1="20" y1="60" x2="24" y2="60" strokeWidth="1.5" />
              <line x1="96" y1="60" x2="100" y2="60" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      )}

      {/* Active slot indicator (when compare mode is on) */}
      {compareMode && (
        <div className="absolute top-6 right-[88px] border border-edge bg-void/85 backdrop-blur-sm px-2 py-1 flex items-center gap-1.5">
          <span className="text-[8px] font-mono uppercase tracking-widest text-muted">CLICK SETS</span>
          <span
            className={`text-[10px] font-mono font-semibold ${activeSlot === 'b' ? 'text-amber' : 'text-cyan'}`}
          >
            {activeSlot === 'b' ? 'TGT·B' : 'TGT·A'}
          </span>
        </div>
      )}

      {/* Bottom-center telemetry readout */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
        {compare ? (
          <div className="border border-edge bg-void/80 backdrop-blur-sm px-4 py-1.5 flex items-center gap-3 text-[10px] font-mono tracking-widest">
            <span className="text-cyan">A</span>
            <span className="text-edge-bright">↔</span>
            <span className="text-amber">B</span>
            <span className="text-edge-bright">·</span>
            <span className="text-ink">{formatDistance(compare.distanceKm)}</span>
            <span className="text-muted">@</span>
            <span className="text-ink">
              {compare.bearingAtoB.toFixed(0)}° {compare.cardinalAtoB}
            </span>
          </div>
        ) : (
          <div className="border border-cyan/30 bg-void/80 backdrop-blur-sm px-4 py-1.5 flex items-center gap-4 text-[10px] font-mono tracking-widest">
            {coordsA ? (
              <>
                <span className="text-cyan tabular-nums">
                  {coordsA.lat >= 0 ? 'N' : 'S'}
                  {Math.abs(coordsA.lat).toFixed(5)}°
                </span>
                <span className="text-edge-bright">·</span>
                <span className="text-cyan tabular-nums">
                  {coordsA.lon >= 0 ? 'E' : 'W'}
                  {Math.abs(coordsA.lon).toFixed(5)}°
                </span>
                <span className="text-edge-bright">·</span>
                <span className="text-muted uppercase truncate max-w-[360px]">
                  {resolvingA ? 'RESOLVING...' : (resolvedA ?? 'NO FIX')}
                </span>
              </>
            ) : (
              <span className="text-muted uppercase">NO TARGET ACQUIRED — CLICK MAP TO SET PIN</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
