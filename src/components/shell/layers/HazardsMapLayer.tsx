import { CircleMarker, Polygon, Popup } from 'react-leaflet';
import type { Coordinates, WildfireEvent } from '../../../types';
import { useWildfires } from '../../../hooks/useWildfires';

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
}

export function HazardsMapLayer({ coordsA, coordsB }: Props) {
  const firesA = useWildfires(coordsA);
  const firesB = useWildfires(coordsB);

  return (
    <>
      {firesA.data && <FireShapes fires={firesA.data} slot="A" />}
      {firesB.data && <FireShapes fires={firesB.data} slot="B" />}
    </>
  );
}

function FireShapes({ fires, slot }: { fires: WildfireEvent[]; slot: 'A' | 'B' }) {
  return (
    <>
      {fires.map((fire) => {
        const ringColor = '#ff4d5e';
        const fillColor = '#ff6b42';
        if (fire.polygon && fire.polygon.length >= 3) {
          return (
            <Polygon
              key={`fire-${slot}-${fire.id}`}
              positions={fire.polygon.map((c) => [c.lat, c.lon])}
              pathOptions={{
                color: ringColor,
                fillColor,
                fillOpacity: 0.28,
                weight: 1.5,
                dashArray: slot === 'B' ? '3 3' : undefined,
              }}
            >
              <FirePopup fire={fire} slot={slot} />
            </Polygon>
          );
        }
        const radius = fire.source === 'FIRMS' ? 3.5 : 6;
        return (
          <CircleMarker
            key={`fire-${slot}-${fire.id}`}
            center={[fire.lat, fire.lon]}
            radius={radius}
            pathOptions={{
              color: ringColor,
              fillColor,
              fillOpacity: 0.65,
              weight: 1.2,
              dashArray: slot === 'B' ? '2 2' : undefined,
            }}
          >
            <FirePopup fire={fire} slot={slot} />
          </CircleMarker>
        );
      })}
    </>
  );
}

function FirePopup({ fire, slot }: { fire: WildfireEvent; slot: 'A' | 'B' }) {
  return (
    <Popup>
      <div className="font-mono text-[10px] leading-snug" style={{ maxWidth: 220 }}>
        <div className="font-bold uppercase tracking-wide">
          {fire.title ?? `${fire.source} HOTSPOT`}
        </div>
        <div className="uppercase text-gray-500 mt-0.5">
          {fire.source} · {fire.date.slice(0, 10)}
        </div>
        {fire.brightness != null && (
          <div>BRIGHTNESS: {fire.brightness.toFixed(0)} K</div>
        )}
        {fire.frp != null && <div>FRP: {fire.frp.toFixed(1)} MW</div>}
        {fire.confidence && <div>CONF: {fire.confidence.toUpperCase()}</div>}
        <div className={slot === 'A' ? 'text-cyan-600' : 'text-amber-600'}>
          {fire.distanceKm.toFixed(1)} KM · TGT·{slot}
        </div>
      </div>
    </Popup>
  );
}
