import { useEffect, useState } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { Coordinates } from '../types';

const DEFAULT_CENTER: [number, number] = [38.2885, 21.7706];

interface Props {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
}

function ClickHandler({ onChange }: { onChange: (c: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ coords }: { coords: Coordinates | null }) {
  const map = useMap();
  useEffect(() => {
    if (!coords) return;
    const targetZoom = Math.max(map.getZoom(), 17);
    map.setView([coords.lat, coords.lon], targetZoom, { animate: true });
  }, [coords?.lat, coords?.lon, map]);
  return null;
}

export function MapPreview({ value, onChange }: Props) {
  const [initial] = useState<{ center: [number, number]; zoom: number }>(
    () => ({
      center: value ? [value.lat, value.lon] : DEFAULT_CENTER,
      zoom: value ? 17 : 5,
    }),
  );

  return (
    <section className="mt-4 rounded-lg border border-border bg-card overflow-hidden">
      <div className="h-[360px] relative">
        <MapContainer
          center={initial.center}
          zoom={initial.zoom}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <ClickHandler onChange={onChange} />
          <Recenter coords={value} />
          {value && (
            <Marker
              position={[value.lat, value.lon]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const latlng = e.target.getLatLng();
                  onChange({ lat: latlng.lat, lon: latlng.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <div className="px-3 py-2 text-xs text-muted border-t border-border">
        Click to place a pin · drag the pin to nudge
      </div>
    </section>
  );
}
