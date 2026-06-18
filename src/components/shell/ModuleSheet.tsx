import { Suspense, lazy, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Coordinates, TabId } from '../../types';
import { TAB_LABELS } from '../../types';
import { ReportPanel } from './ReportPanel';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { StatusDot } from '../hud/StatusDot';
import { computeCompareGeometry, formatDistance } from '../../utils/compareUtils';

const ClimateModule = lazy(() =>
  import('../modules/ClimateModule').then((m) => ({ default: m.ClimateModule })),
);
const WindModule = lazy(() =>
  import('../modules/WindModule').then((m) => ({ default: m.WindModule })),
);
const SunModule = lazy(() =>
  import('../modules/SunModule').then((m) => ({ default: m.SunModule })),
);
const HazardsModule = lazy(() =>
  import('../modules/HazardsModule').then((m) => ({ default: m.HazardsModule })),
);
const AirQualityModule = lazy(() =>
  import('../modules/AirQualityModule').then((m) => ({ default: m.AirQualityModule })),
);
const ContextModule = lazy(() =>
  import('../modules/ContextModule').then((m) => ({ default: m.ContextModule })),
);


const MODULE_SUBTITLES: Record<TabId, string> = {
  climate: 'THERMAL · PRECIP · UV',
  wind: 'ROSE · GUSTS · CALM %',
  sun: 'SUN PATH · FACADE · GOLDEN',
  hazards: 'SEISMIC + WILDFIRE NRT',
  air: 'AQI · PM2.5/10 · NO2 · O3',
  context: 'WIKI · AMENITIES · NUISANCE',
};

interface Props {
  active: TabId | null;
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
  compareMode: boolean;
  onClose: () => void;
  view: 'overview' | 'advanced';
  onDrillDown: (tab: TabId) => void;
}

export function ModuleSheet({ active, coordsA, coordsB, compareMode, onClose, view, onDrillDown }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const compare = compareMode && coordsA && coordsB
    ? computeCompareGeometry(coordsA, coordsB)
    : null;

  return (
    <AnimatePresence>
      {(active !== null || view === 'overview') && (
        <motion.aside
          key={view === 'overview' ? 'overview' : active}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 right-[32px] bottom-0 w-[min(680px,calc(100vw-200px))] bg-panel/95 backdrop-blur-md border-l border-edge shadow-panel-strong rounded-l-lg flex flex-col z-20"
        >
          <header className="border-b border-edge px-5 py-3 flex items-center justify-between shrink-0 bg-rail/50">
            <div className="flex items-baseline gap-3">
              <div>
                {view === 'overview' ? (
                  <div className="text-[13px] font-mono uppercase tracking-widest text-ink">
                    LOCATION REPORT
                  </div>
                ) : (
                  <>
                    <div className="text-[13px] font-mono uppercase tracking-widest text-ink flex items-baseline gap-2">
                      {active && TAB_LABELS[active].toUpperCase()}
                      {compare && (
                        <span className="text-[9px] font-mono text-amber tracking-widest">
                          · COMPARE A↔B
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-muted mt-0.5">
                      {active && MODULE_SUBTITLES[active]}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {compare ? (
                <div className="text-[9px] font-mono uppercase tracking-widest text-muted text-right">
                  <div>Δ {formatDistance(compare.distanceKm)}</div>
                  <div className="text-amber">
                    {compare.bearingAtoB.toFixed(0)}° {compare.cardinalAtoB}
                  </div>
                </div>
              ) : (
                <StatusDot tone={coordsA ? 'cyan' : 'muted'} label={coordsA ? 'LIVE' : 'IDLE'} />
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 border border-edge bg-void text-muted hover:text-cyan hover:border-cyan transition-colors flex items-center justify-center text-sm"
                title="Close (ESC)"
              >
                ×
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {view === 'overview' ? (
              <motion.div
                key="overview"
                className="flex-1 overflow-y-auto overflow-x-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
              >
                <ReportPanel coordsA={coordsA} onDrillDown={onDrillDown} />
              </motion.div>
            ) : (
              <motion.div
                key="advanced"
                className="flex-1 overflow-y-auto overflow-x-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
              >
                <div className="p-5 stagger">
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSkeleton />}>
                      {active === 'climate' && (
                        <ClimateModule coordsA={coordsA} coordsB={coordsB} compareMode={compareMode} />
                      )}
                      {active === 'wind' && (
                        <WindModule coordsA={coordsA} coordsB={coordsB} compareMode={compareMode} />
                      )}
                      {active === 'sun' && (
                        <SunModule coordsA={coordsA} coordsB={coordsB} compareMode={compareMode} />
                      )}
                      {active === 'hazards' && (
                        <HazardsModule coordsA={coordsA} coordsB={coordsB} compareMode={compareMode} />
                      )}
                      {active === 'air' && (
                        <AirQualityModule coordsA={coordsA} coordsB={coordsB} compareMode={compareMode} />
                      )}
                      {active === 'context' && (
                        <ContextModule coordsA={coordsA} coordsB={coordsB} compareMode={compareMode} />
                      )}
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="border-t border-edge px-5 py-2 text-[9px] font-mono uppercase tracking-widest text-dim flex items-center justify-between shrink-0">
            <span>ESC TO CLOSE</span>
            <span>
              {view === 'overview'
                ? 'OVW · REPORT'
                : `MOD · ${active?.toUpperCase() ?? ''}${compare ? ' · CMP' : ''}`}
            </span>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
