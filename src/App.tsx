import { useCallback, useState } from 'react';
import type { Coordinates, TabId } from './types';
import type { Slot } from './hooks/useUrlState';
import { MapCanvas } from './components/shell/MapCanvas';
import { MapHud } from './components/shell/MapHud';
import { LocationIntelCard } from './components/shell/LocationIntelCard';
import { BuildingCard } from './components/shell/BuildingCard';
import { ModuleSheet } from './components/shell/ModuleSheet';
import { MobileSheet } from './components/shell/MobileSheet';
import { BottomStrip } from './components/shell/BottomStrip';
import { RiskPanel } from './components/hud/RiskPanel';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useUrlState } from './hooks/useUrlState';
import { useReverseGeocode } from './hooks/useNominatim';

export default function App() {
  const { state, update } = useUrlState();
  const { result: geocodedA, loading: resolvingA } = useReverseGeocode(state.coordsA);
  const { result: geocodedB, loading: resolvingB } = useReverseGeocode(state.coordsB);
  const [viewMode, setViewMode] = useState<'overview' | 'advanced'>('overview');

  const compareMode = state.coordsB !== null;

  const setCoordsA = useCallback(
    (coords: Coordinates | null) => {
      update({ coordsA: coords });
    },
    [update],
  );

  const setCoordsB = useCallback(
    (coords: Coordinates | null) => {
      update({ coordsB: coords });
    },
    [update],
  );

  const setSlot = useCallback(
    (slot: Slot) => {
      update({ slot });
    },
    [update],
  );

  const enableCompare = useCallback(() => {
    update({ slot: 'b' });
  }, [update]);

  const disableCompare = useCallback(() => {
    update({ coordsB: null, slot: 'a' });
  }, [update]);

  const selectTab = useCallback(
    (tab: TabId) => {
      update({ tab });
      setViewMode('advanced');
    },
    [update],
  );

  const toggleView = useCallback(() => setViewMode(v => v === 'overview' ? 'advanced' : 'overview'), []);

  const handleDrillDown = useCallback((tab: TabId) => {
    update({ tab });
    setViewMode('advanced');
  }, [update]);

  const moduleSheetProps = {
    active: state.tab,
    coordsA: state.coordsA,
    coordsB: state.coordsB,
    compareMode,
    view: viewMode,
    resolvedA: geocodedA?.cleanAddress ?? null,
    countryA: geocodedA?.countryCode ?? null,
    onToggleView: toggleView,
    onSelect: selectTab,
    onDrillDown: handleDrillDown,
  };

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] w-screen flex flex-col bg-void md:overflow-hidden">
        <div className="flex-1 relative flex min-h-0">
          {/* Map fills the whole area on mobile AND desktop-left */}
          <div className="flex-1 relative">
            <MapCanvas
              coordsA={state.coordsA}
              coordsB={state.coordsB}
              onChangeA={setCoordsA}
              onChangeB={setCoordsB}
              activeSlot={state.slot}
              compareMode={compareMode}
              activeTab={state.tab}
            />
            <MapHud
              compareMode={compareMode}
              activeSlot={state.slot}
            />

            {/* Floating column — LIVE classes verbatim */}
            <div className="absolute z-30 top-3 left-3 right-3 md:top-6 md:bottom-14 md:left-6 md:right-auto md:w-[360px] flex flex-col md:justify-between gap-3 pointer-events-none">
              <div className="flex flex-col gap-3 pointer-events-auto">
                <LocationIntelCard
                  coordsA={state.coordsA}
                  coordsB={state.coordsB}
                  resolvedA={geocodedA?.cleanAddress ?? null}
                  countryA={geocodedA?.countryCode ?? null}
                  resolvingA={resolvingA}
                  resolvedB={geocodedB?.cleanAddress ?? null}
                  countryB={geocodedB?.countryCode ?? null}
                  resolvingB={resolvingB}
                  activeSlot={state.slot}
                  compareMode={compareMode}
                  onSetSlot={setSlot}
                  onChangeA={setCoordsA}
                  onChangeB={setCoordsB}
                  onEnableCompare={enableCompare}
                  onDisableCompare={disableCompare}
                />
                {/* Building cards: DESKTOP ONLY */}
                <div className="hidden md:flex md:flex-col gap-3">
                  <BuildingCard coords={state.coordsA} slot="A" />
                  {compareMode && <BuildingCard coords={state.coordsB} slot="B" />}
                </div>
              </div>
              {/* Risk: DESKTOP ONLY */}
              <div className="hidden md:block pointer-events-auto">
                <RiskPanel coords={state.coordsA} />
              </div>
            </div>
          </div>

          {/* Desktop right panel — gate hidden md:flex (see ModuleSheet change) */}
          <ModuleSheet {...moduleSheetProps} />
        </div>

        {/* Mobile bottom sheet — md:hidden, hosts ModuleSheet content */}
        <MobileSheet hasLocation={state.coordsA !== null}>
          <ModuleSheet {...moduleSheetProps} embedded />
        </MobileSheet>

        <BottomStrip
          coordsA={state.coordsA}
          coordsB={state.coordsB}
          resolvingA={resolvingA}
          resolvedA={geocodedA?.cleanAddress ?? null}
          compareMode={compareMode}
          className="hidden md:flex"
        />
      </div>
    </ErrorBoundary>
  );
}
