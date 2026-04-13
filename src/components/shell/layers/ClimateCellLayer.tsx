import { Rectangle, Tooltip } from 'react-leaflet';
import type { Coordinates, ResolvedLocation } from '../../../types';
import { useOpenMeteo } from '../../../hooks/useOpenMeteo';

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
}

export function ClimateCellLayer({ coordsA, coordsB }: Props) {
  const stateA = useOpenMeteo(coordsA);
  const stateB = useOpenMeteo(coordsB);

  return (
    <>
      {stateA.data && (
        <CellRectangle
          resolved={stateA.data.resolved}
          color="#7eeaff"
          slot="A"
        />
      )}
      {stateB.data && (
        <CellRectangle
          resolved={stateB.data.resolved}
          color="#ffb347"
          slot="B"
        />
      )}
    </>
  );
}

function CellRectangle({
  resolved,
  color,
  slot,
}: {
  resolved: ResolvedLocation;
  color: string;
  slot: 'A' | 'B';
}) {
  const { lat, lon } = resolved.resolved;
  const halfKm = resolved.modelResolutionKm / 2;
  const dLat = halfKm / 111;
  const dLon = halfKm / (111 * Math.cos((lat * Math.PI) / 180));
  const bounds: [[number, number], [number, number]] = [
    [lat - dLat, lon - dLon],
    [lat + dLat, lon + dLon],
  ];

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.06,
        weight: 1.2,
        dashArray: slot === 'B' ? '4 4' : '2 3',
        opacity: 0.6,
      }}
    >
      <Tooltip direction="top" offset={[0, -6]} opacity={0.9} sticky>
        <span className="font-mono text-[10px]">
          TGT·{slot} · {resolved.model} · {resolved.modelResolutionKm} KM CELL
        </span>
      </Tooltip>
    </Rectangle>
  );
}
