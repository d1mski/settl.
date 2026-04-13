import { useEffect, useState } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { Coordinates } from '../../types';
import { iconA, iconB } from '../../utils/mapIcons';

const DEFAULT_CENTER: [number, number] = [30, 20];

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
  onChangeA: (coords: Coordinates) => void;
  onChangeB: (coords: Coordinates) => void;
  activeSlot: 'a' | 'b';
  compareMode: boolean;
}

function ClickHandler({
  activeSlot,
  onChangeA,
  onChangeB,
}: {
  activeSlot: 'a' | 'b';
  onChangeA: (c: Coordinates) => void;
  onChangeB: (c: Coordinates) => void;
}) {
  useMapEvents({
    click(e) {
      const c = { lat: e.latlng.lat, lon: e.latlng.lng };
      if (activeSlot === 'b') onChangeB(c);
      else onChangeA(c);
    },
  });
  return null;
}

function FitToCoords({
  coordsA,
  coordsB,
}: {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (coordsA && coordsB) {
      const bounds: [[number, number], [number, number]] = [
        [coordsA.lat, coordsA.lon],
        [coordsB.lat, coordsB.lon],
      ];
      map.fitBounds(bounds, { padding: [120, 120], maxZoom: 14, animate: true });
    } else if (coordsA) {
      map.setView([coordsA.lat, coordsA.lon], Math.max(map.getZoom(), 16), {
        animate: true,
      });
    } else if (coordsB) {
      map.setView([coordsB.lat, coordsB.lon], Math.max(map.getZoom(), 16), {
        animate: true,
      });
    }
  }, [coordsA?.lat, coordsA?.lon, coordsB?.lat, coordsB?.lon, map]);
  return null;
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const t1 = setTimeout(() => map.invalidateSize({ animate: false }), 0);
    const t2 = setTimeout(() => map.invalidateSize({ animate: false }), 100);
    const t3 = setTimeout(() => map.invalidateSize({ animate: false }), 400);
    const ro = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    ro.observe(container);
    const onResize = () => map.invalidateSize({ animate: false });
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
}

export function MapCanvas({
  coordsA,
  coordsB,
  onChangeA,
  onChangeB,
  activeSlot,
  compareMode,
}: Props) {
  const [initial] = useState<{ center: [number, number]; zoom: number }>(
    () => ({
      center: coordsA ? [coordsA.lat, coordsA.lon] : DEFAULT_CENTER,
      zoom: coordsA ? 16 : 3,
    }),
  );

  const showLine = compareMode && coordsA && coordsB;

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={initial.center}
        zoom={initial.zoom}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <TileLayer
          attribution=""
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          opacity={0.85}
        />
        <ClickHandler
          activeSlot={activeSlot}
          onChangeA={onChangeA}
          onChangeB={onChangeB}
        />
        <FitToCoords coordsA={coordsA} coordsB={coordsB} />
        <MapInvalidator />

        {showLine && (
          <Polyline
            positions={[
              [coordsA!.lat, coordsA!.lon],
              [coordsB!.lat, coordsB!.lon],
            ]}
            pathOptions={{
              color: '#7eeaff',
              weight: 1.2,
              opacity: 0.55,
              dashArray: '4 6',
            }}
          />
        )}

        {coordsA && (
          <Marker
            position={[coordsA.lat, coordsA.lon]}
            icon={iconA}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onChangeA({ lat: ll.lat, lon: ll.lng });
              },
            }}
          />
        )}
        {coordsB && (
          <Marker
            position={[coordsB.lat, coordsB.lon]}
            icon={iconB}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                onChangeB({ lat: ll.lat, lon: ll.lng });
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
