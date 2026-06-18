import type { BuildingData, BuildingFacade, Coordinates } from '../../types';

interface Props {
  building: BuildingData;
  size?: number;
  onFacadeClick?: (label: BuildingFacade['label']) => void;
}

const FACADE_COLORS: Record<string, string> = {
  Front: '#ffb347',
  Right: '#a5d8ff',
  Rear: '#e8eef5',
  Left: '#7eeaff',
};

const EARTH_RADIUS_M = 6371000;

function projectAll(polygon: Coordinates[]) {
  if (polygon.length === 0) return [];
  const center = polygon[0];
  const latRad = (center.lat * Math.PI) / 180;
  return polygon.map((p) => ({
    x: ((p.lon - center.lon) * Math.PI) / 180 * EARTH_RADIUS_M * Math.cos(latRad),
    y: -((p.lat - center.lat) * Math.PI) / 180 * EARTH_RADIUS_M,
  }));
}

export function BuildingCompass({ building, size = 280, onFacadeClick }: Props) {
  if (!building.found || building.polygon.length < 3) {
    return <div className="text-[10px] font-mono uppercase tracking-widest text-muted">NO POLYGON</div>;
  }

  const projected = projectAll(building.polygon);
  const xs = projected.map((p) => p.x);
  const ys = projected.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const bboxW = maxX - minX || 1;
  const bboxH = maxY - minY || 1;

  const pad = 44;
  const scale = Math.min((size - pad * 2) / bboxW, (size - pad * 2) / bboxH);
  const cx = size / 2;
  const cy = size / 2;
  const bboxCx = (minX + maxX) / 2;
  const bboxCy = (minY + maxY) / 2;

  const svgPoints = projected.map((p) => ({
    x: cx + (p.x - bboxCx) * scale,
    y: cy + (p.y - bboxCy) * scale,
  }));

  const pathD =
    svgPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ') + ' Z';

  const compassRadius = size / 2 - 8;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={compassRadius} fill="#0d121e" stroke="#1a2338" strokeWidth={1} />
      <circle
        cx={cx}
        cy={cy}
        r={compassRadius * 0.7}
        fill="none"
        stroke="#1a2338"
        strokeDasharray="2 4"
      />
      <circle
        cx={cx}
        cy={cy}
        r={compassRadius * 0.4}
        fill="none"
        stroke="#1a2338"
        strokeDasharray="2 4"
      />

      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const r1 = deg % 90 === 0 ? compassRadius * 0.85 : compassRadius * 0.92;
        const r2 = compassRadius;
        const x1 = cx + Math.sin(rad) * r1;
        const y1 = cy - Math.cos(rad) * r1;
        const x2 = cx + Math.sin(rad) * r2;
        const y2 = cy - Math.cos(rad) * r2;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={deg % 90 === 0 ? '#7eeaff' : '#3d4759'}
            strokeOpacity={deg % 90 === 0 ? 0.6 : 0.5}
            strokeWidth={deg % 90 === 0 ? 1.5 : 0.8}
          />
        );
      })}

      {(['N', 'E', 'S', 'W'] as const).map((label, i) => {
        const deg = i * 90;
        const rad = (deg * Math.PI) / 180;
        const r = compassRadius - 18;
        const x = cx + Math.sin(rad) * r;
        const y = cy - Math.cos(rad) * r;
        return (
          <text
            key={label}
            x={x}
            y={y + 4}
            textAnchor="middle"
            fontSize={11}
            fontFamily="JetBrains Mono, monospace"
            fontWeight={600}
            fill="#7eeaff"
            letterSpacing="0.1em"
          >
            {label}
          </text>
        );
      })}

      <path
        d={pathD}
        fill="rgba(126,234,255,0.18)"
        stroke="#7eeaff"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      {building.facades.map((facade) => {
        const rad = (facade.bearing * Math.PI) / 180;
        const innerR = compassRadius * 0.5;
        const outerR = compassRadius * 0.78;
        const x1 = cx + Math.sin(rad) * innerR;
        const y1 = cy - Math.cos(rad) * innerR;
        const x2 = cx + Math.sin(rad) * outerR;
        const y2 = cy - Math.cos(rad) * outerR;
        const tx = cx + Math.sin(rad) * (outerR + 8);
        const ty = cy - Math.cos(rad) * (outerR + 8) + 3;
        const color = FACADE_COLORS[facade.label] ?? '#7eeaff';
        const clickable = Boolean(onFacadeClick);
        return (
          <g
            key={facade.label}
            style={clickable ? { cursor: 'pointer' } : undefined}
            onClick={clickable ? () => onFacadeClick?.(facade.label) : undefined}
          >
            {clickable && (
              <circle
                cx={(x1 + tx) / 2}
                cy={(y1 + ty) / 2}
                r={18}
                fill="transparent"
              />
            )}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} />
            <circle cx={x2} cy={y2} r={2.5} fill={color} />
            <text
              x={tx}
              y={ty}
              textAnchor="middle"
              fontSize={8}
              fontFamily="JetBrains Mono, monospace"
              fill={color}
              letterSpacing="0.1em"
            >
              {facade.label.toUpperCase()}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r={2} fill="#7eeaff" />
    </svg>
  );
}
