import type { ResolvedLocation } from '../types';
import { formatDistanceKm } from '../utils/coordinates';

interface Props {
  resolved: ResolvedLocation;
}

export function GridResolutionWarning({ resolved }: Props) {
  const distance = resolved.distanceMeters;
  if (distance < 500) return null;
  const severe = distance > 5000;
  const tone = severe
    ? 'border-warn/60 bg-warn/5 text-warn'
    : 'border-edge bg-bg/40 text-muted';

  return (
    <div className={`border ${tone} px-3 py-2 mb-3`}>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-mono uppercase tracking-widest">
          ⚠ GRID DRIFT
        </span>
        <span className="flex-1 h-px bg-current opacity-30" />
      </div>
      <div className="text-[10px] font-mono mt-1 leading-relaxed">
        API resolved to{' '}
        <span className="tabular-nums text-cyan">
          {resolved.resolved.lat.toFixed(4)}, {resolved.resolved.lon.toFixed(4)}
        </span>{' '}
        — <span className="text-ink">{formatDistanceKm(distance)}</span> from your pin · ALT{' '}
        <span className="text-ink">{Math.round(resolved.elevation)} m</span>
        {severe && ' · DATA REFLECTS GRID CELL, NOT EXACT TARGET'}
      </div>
    </div>
  );
}
