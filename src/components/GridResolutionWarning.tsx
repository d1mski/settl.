import { TriangleAlert } from 'lucide-react';
import type { ResolvedLocation } from '../types';
import { formatDistanceKm } from '../utils/coordinates';
import { useElevation } from '../hooks/useElevation';

interface Props {
  resolved: ResolvedLocation;
}

// Open-Meteo ERA5-Seamless grid is ~9 km over land, ~25 km over water.
// A 1-5 km drift is normal; only flag as alarming when the drift or the
// elevation delta would meaningfully bias the readings.
const HORIZONTAL_INFO_M = 2000;
const HORIZONTAL_WARN_M = 15000;
const ELEVATION_INFO_M = 80;
const ELEVATION_WARN_M = 250;
const LAPSE_RATE_PER_100M = 0.65;

export function GridResolutionWarning({ resolved }: Props) {
  const { elevation: pinElevation } = useElevation(resolved.requested);
  const horizontal = resolved.distanceMeters;
  const gridElevation = Math.round(resolved.elevation);

  const hasPinElevation = pinElevation !== null;
  const elevationDelta = hasPinElevation ? Math.round(pinElevation - gridElevation) : 0;
  const elevationDeltaAbs = Math.abs(elevationDelta);
  const estimatedTempBias = (elevationDeltaAbs / 100) * LAPSE_RATE_PER_100M;

  const horizontalNotable = horizontal >= HORIZONTAL_INFO_M;
  const elevationNotable = hasPinElevation && elevationDeltaAbs >= ELEVATION_INFO_M;

  if (!horizontalNotable && !elevationNotable) return null;

  const horizontalSevere = horizontal >= HORIZONTAL_WARN_M;
  const elevationSevere = hasPinElevation && elevationDeltaAbs >= ELEVATION_WARN_M;
  const severe = horizontalSevere || elevationSevere;

  if (!severe) {
    return (
      <div className="text-[9px] font-mono uppercase tracking-widest text-dim mb-3 flex flex-wrap items-center gap-2">
        <span>◦ MODEL</span>
        <span className="text-muted">{resolved.model}</span>
        <span className="text-dim">·</span>
        <span className="text-muted">{resolved.modelResolutionKm} KM</span>
        <span className="text-dim">·</span>
        <span className="text-muted">DRIFT {formatDistanceKm(horizontal)}</span>
        {hasPinElevation && (
          <>
            <span className="text-dim">·</span>
            <span className="text-muted">
              Δ ALT {elevationDelta >= 0 ? '+' : ''}{elevationDelta} M
            </span>
          </>
        )}
        <span className="flex-1 h-px bg-edge" />
      </div>
    );
  }

  return (
    <div className="border border-warn/60 bg-warn/5 text-warn px-3 py-2 mb-3">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-1">
            <TriangleAlert size={12} strokeWidth={1.4} className="shrink-0" />
            MODEL BIAS WARNING
          </span>
        <span className="flex-1 h-px bg-warn/30" />
      </div>
      <div className="text-[10px] font-mono mt-1 leading-relaxed text-ink space-y-1">
        <div>
          <span className="text-muted">MODEL</span>{' '}
          <span className="text-cyan">{resolved.model}</span>{' '}
          <span className="text-muted">·</span>{' '}
          <span className="text-cyan">{resolved.modelResolutionKm} KM GRID</span>
        </div>
        {horizontalSevere && (
          <div>
            <span className="text-muted">DRIFT</span>{' '}
            <span className="text-warn">{formatDistanceKm(horizontal)}</span>{' '}
            <span className="text-muted">from pin to grid cell centre</span>
          </div>
        )}
        {elevationSevere && hasPinElevation && (
          <div>
            <span className="text-muted">TERRAIN</span>{' '}
            <span className="text-warn">
              Δ {elevationDelta >= 0 ? '+' : ''}{elevationDelta} M
            </span>{' '}
            <span className="text-muted">(pin {Math.round(pinElevation!)} m · grid {gridElevation} m)</span>
          </div>
        )}
        {elevationSevere && (
          <div className="text-muted">
            Temperature readings likely biased by{' '}
            <span className="text-ink">~{estimatedTempBias.toFixed(1)}°C</span>{' '}
            vs actual (lapse rate 0.65°C/100m). Mountain/valley microclimate not captured.
          </div>
        )}
      </div>
    </div>
  );
}
