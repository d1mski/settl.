import { useCallback, useState } from 'react';
import type { Coordinates, TabId } from './types';
import type { Slot } from './hooks/useUrlState';
import { MapCanvas } from './components/shell/MapCanvas';
import { MapHud } from './components/shell/MapHud';
import { LocationIntelCard } from './components/shell/LocationIntelCard';
import { BuildingCard } from './components/shell/BuildingCard';
import { ModuleSheet } from './components/shell/ModuleSheet';
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

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-void overflow-hidden">
        <div className="flex-1 relative flex overflow-hidden">
          {/* Map area */}
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

            <div className="absolute top-6 bottom-14 left-6 z-30 pointer-events-auto w-[360px] flex flex-col justify-between gap-3">
              <div className="flex flex-col gap-3">
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

                <BuildingCard coords={state.coordsA} slot="A" />
                {compareMode && <BuildingCard coords={state.coordsB} slot="B" />}
              </div>

              <RiskPanel coords={state.coordsA} />
            </div>
          </div>

          {/* Right panel — always visible */}
          <ModuleSheet
            active={state.tab}
            coordsA={state.coordsA}
            coordsB={state.coordsB}
            compareMode={compareMode}
            view={viewMode}
            resolvedA={geocodedA?.cleanAddress ?? null}
            countryA={geocodedA?.countryCode ?? null}
            onToggleView={toggleView}
            onSelect={selectTab}
            onDrillDown={handleDrillDown}
          />
        </div>

        <BottomStrip
          coordsA={state.coordsA}
          coordsB={state.coordsB}
          resolvingA={resolvingA}
          resolvedA={geocodedA?.cleanAddress ?? null}
          compareMode={compareMode}
        />
      </div>
    </ErrorBoundary>
  );
}
