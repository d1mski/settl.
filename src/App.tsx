import { useCallback, useEffect, useState } from 'react';
import type { Coordinates, TabId } from './types';
import type { Slot } from './hooks/useUrlState';
import { MapCanvas, type BaseMap } from './components/shell/MapCanvas';
import { MapHud } from './components/shell/MapHud';
import { LocationIntelCard } from './components/shell/LocationIntelCard';
import { BuildingCard } from './components/shell/BuildingCard';
import { ModuleRail } from './components/shell/ModuleRail';
import { ModuleSheet } from './components/shell/ModuleSheet';
import { BottomStrip } from './components/shell/BottomStrip';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useUrlState } from './hooks/useUrlState';
import { useReverseGeocode } from './hooks/useNominatim';

export default function App() {
  const { state, update } = useUrlState();
  const { result: geocodedA, loading: resolvingA } = useReverseGeocode(state.coordsA);
  const { result: geocodedB, loading: resolvingB } = useReverseGeocode(state.coordsB);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [baseMap, setBaseMap] = useState<BaseMap>('dark');

  useEffect(() => {
    const el = document.documentElement;
    if (baseMap === 'light') el.classList.add('theme-light');
    else el.classList.remove('theme-light');
    return () => {
      // leave class in place between renders; only cleanup on unmount
    };
  }, [baseMap]);

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

  const handleSelect = useCallback(
    (tab: TabId) => {
      if (sheetOpen && state.tab === tab) {
        setSheetOpen(false);
        return;
      }
      update({ tab });
      setSheetOpen(true);
    },
    [sheetOpen, state.tab, update],
  );

  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const activeTab = sheetOpen ? state.tab : null;

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-void overflow-hidden">
        <div className="flex-1 relative flex">
          <div className="flex-1 relative">
            <MapCanvas
              coordsA={state.coordsA}
              coordsB={state.coordsB}
              onChangeA={setCoordsA}
              onChangeB={setCoordsB}
              activeSlot={state.slot}
              compareMode={compareMode}
              baseMap={baseMap}
              activeTab={activeTab}
            />
            <MapHud
              coordsA={state.coordsA}
              coordsB={state.coordsB}
              compareMode={compareMode}
              activeSlot={state.slot}
            />

            <div className="absolute top-6 left-6 z-30 pointer-events-auto flex flex-col gap-3 max-h-[calc(100vh-96px)] overflow-y-auto overflow-x-hidden pr-1">
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
                baseMap={baseMap}
                onBaseMapChange={setBaseMap}
                onSetSlot={setSlot}
                onChangeA={setCoordsA}
                onChangeB={setCoordsB}
                onEnableCompare={enableCompare}
                onDisableCompare={disableCompare}
              />

              <BuildingCard coords={state.coordsA} slot="A" />
              {compareMode && <BuildingCard coords={state.coordsB} slot="B" />}
            </div>

            <ModuleSheet
              active={activeTab}
              coordsA={state.coordsA}
              coordsB={state.coordsB}
              compareMode={compareMode}
              onClose={closeSheet}
            />
          </div>

          <ModuleRail
            active={activeTab}
            onSelect={handleSelect}
            coordsReady={state.coordsA !== null}
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
