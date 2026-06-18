import type { LucideIcon } from 'lucide-react';
import { StatusDot } from '../hud/StatusDot';
import { LoadingSkeleton } from './LoadingSkeleton';
import { SEVERITY_TONE } from '../../utils/overviewSeverity';

export interface ChapterCardProps {
  icon: LucideIcon;
  label: string;
  metric: string | null;       // null = loading; '--' = no location
  unit?: string;
  severity: 'ok' | 'watch' | 'alert' | 'unavailable';
  onClick: () => void;
}

export function ChapterCard({ icon: Icon, label, metric, unit, severity, onClick }: ChapterCardProps) {
  const isPlaceholder = metric === '--';
  const isLoading = metric === null;
  const isUnavailable = severity === 'unavailable';
  const isInteractive = !isPlaceholder && !isLoading && !isUnavailable;

  const baseClasses =
    'bg-panel border border-edge rounded-[10px] px-4 py-2 min-h-[44px] transition-shadow duration-150 flex flex-col gap-1';
  const interactiveClasses = isInteractive
    ? 'cursor-pointer hover:shadow-[0_0_0_2px_rgb(var(--c-cyan)/0.25)]'
    : 'cursor-default';
  const unavailableClasses = isUnavailable ? 'opacity-60' : '';

  function handleClick() {
    if (isInteractive) onClick();
  }

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${unavailableClasses}`}
      onClick={handleClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Row 1: icon + label */}
      <div className="flex items-center gap-1">
        <Icon
          className={`w-5 h-5 ${isInteractive ? 'text-ink' : 'text-muted'}`}
          aria-hidden
        />
        <span className="font-[Karla,sans-serif] text-[1.05rem] font-semibold text-ink leading-none">
          {label}
        </span>
      </div>

      {/* Row 2: metric area */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isPlaceholder ? (
        <div className="flex items-baseline gap-1">
          <span className="font-[JetBrains_Mono,monospace] text-[1.5rem] text-muted leading-none">
            --
          </span>
        </div>
      ) : isUnavailable ? (
        <div className="flex items-baseline gap-1">
          <span className="font-[Karla,sans-serif] text-[0.85rem] text-muted leading-none">
            Data unavailable
          </span>
        </div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="font-[JetBrains_Mono,monospace] text-[1.5rem] text-ink leading-none">
            {metric}
          </span>
          {unit && (
            <span className="font-[Karla,sans-serif] text-[0.85rem] text-muted leading-none">
              {unit}
            </span>
          )}
        </div>
      )}

      {/* Row 3: StatusDot — only for ok/watch/alert */}
      {!isLoading && !isPlaceholder && !isUnavailable && (
        <StatusDot
          tone={SEVERITY_TONE[severity as 'ok' | 'watch' | 'alert']}
          pulse={severity === 'alert'}
          label={severity === 'ok' ? 'OK' : severity === 'watch' ? 'WATCH' : 'ALERT'}
        />
      )}
    </div>
  );
}
