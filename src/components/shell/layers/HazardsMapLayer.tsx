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
        // Fire is the most prominent data marker: r8 = 16px = half the 32px target reticle.
        const radius = 8;
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

// FRP (fire radiative power, MW) → plain-language fire intensity.
function intensityLabel(frp: number): string {
  if (frp < 10) return 'LOW';
  if (frp < 50) return 'MODERATE';
  if (frp < 300) return 'HIGH';
  return 'EXTREME';
}

// FIRMS confidence: VIIRS uses l/n/h, MODIS uses 0–100.
function confidenceLabel(conf: string): string {
  const c = conf.toLowerCase();
  if (c === 'l' || c === 'n' || c === 'h') {
    return { l: 'LOW', n: 'LIKELY', h: 'CONFIRMED' }[c]!;
  }
  const num = Number(conf);
  if (Number.isFinite(num)) return num < 30 ? 'LOW' : num < 80 ? 'LIKELY' : 'CONFIRMED';
  return conf.toUpperCase();
}

function niceDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function FirePopup({ fire, slot }: { fire: WildfireEvent; slot: 'A' | 'B' }) {
  const isFirms = fire.source === 'FIRMS';
  const heading = fire.title ?? 'ACTIVE FIRE';
  const sourceLine = isFirms ? 'DETECTED BY SATELLITE' : 'REPORTED FIRE EVENT';
  return (
    <Popup>
      <div className="font-mono text-[10px] leading-snug" style={{ maxWidth: 220 }}>
        <div className="font-bold uppercase tracking-wide">{heading}</div>
        <div className="uppercase text-gray-500 mt-0.5">
          {sourceLine} · {niceDate(fire.date)}
        </div>
        {fire.frp != null && <div>INTENSITY: {intensityLabel(fire.frp)}</div>}
        {fire.confidence && <div>DETECTION: {confidenceLabel(fire.confidence)}</div>}
        <div className={slot === 'A' ? 'text-cyan-600' : 'text-amber-600'}>
          {fire.distanceKm.toFixed(1)} KM FROM TARGET {slot}
        </div>
      </div>
    </Popup>
  );
}
