import type { DaySunData, SunPathSample } from '../../hooks/useSunCalc';

interface Props {
  winter: DaySunData;
  equinox: DaySunData;
  summer: DaySunData;
  width?: number;
  height?: number;
}

const PAD = { top: 24, right: 24, bottom: 36, left: 44 };

function pathFromSamples(
  samples: SunPathSample[],
  innerWidth: number,
  innerHeight: number,
  maxAltitude: number,
): string {
  const parts: string[] = [];
  let started = false;
  for (const s of samples) {
    if (s.altitude <= 0) {
      started = false;
      continue;
    }
    const x = PAD.left + (s.azimuth / 360) * innerWidth;
    const y = PAD.top + innerHeight - (s.altitude / maxAltitude) * innerHeight;
    parts.push(`${started ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    started = true;
  }
  return parts.join(' ');
}

export function SunPathArc({
  winter,
  equinox,
  summer,
  width = 540,
  height = 240,
}: Props) {
  const innerWidth = width - PAD.left - PAD.right;
  const innerHeight = height - PAD.top - PAD.bottom;
  const maxAltitude = Math.max(90, summer.maxAltitude, equinox.maxAltitude, winter.maxAltitude);

  const winterPath = pathFromSamples(winter.samples, innerWidth, innerHeight, maxAltitude);
  const equinoxPath = pathFromSamples(equinox.samples, innerWidth, innerHeight, maxAltitude);
  const summerPath = pathFromSamples(summer.samples, innerWidth, innerHeight, maxAltitude);

  const azimuthTicks = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  const azimuthLabels: Record<number, string> = {
    0: 'N',
    45: 'NE',
    90: 'E',
    135: 'SE',
    180: 'S',
    225: 'SW',
    270: 'W',
    315: 'NW',
    360: 'N',
  };
  const altitudeTicks = [0, 30, 60, 90];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={PAD.left}
        y={PAD.top}
        width={innerWidth}
        height={innerHeight}
        fill="rgba(13,18,30,0.4)"
      />

      {altitudeTicks.map((t) => {
        const y = PAD.top + innerHeight - (t / maxAltitude) * innerHeight;
        return (
          <g key={`alt-${t}`}>
            <line
              x1={PAD.left}
              y1={y}
              x2={PAD.left + innerWidth}
              y2={y}
              stroke="#1a2338"
              strokeDasharray="2 4"
            />
            <text
              x={PAD.left - 8}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
              fill="#6a768b"
              letterSpacing="0.05em"
            >
              {t}°
            </text>
          </g>
        );
      })}

      {azimuthTicks.map((t) => {
        const x = PAD.left + (t / 360) * innerWidth;
        return (
          <g key={`az-${t}`}>
            <line
              x1={x}
              y1={PAD.top}
              x2={x}
              y2={PAD.top + innerHeight}
              stroke="#1a2338"
            />
            <text
              x={x}
              y={PAD.top + innerHeight + 16}
              textAnchor="middle"
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
              fill="#6a768b"
              letterSpacing="0.08em"
            >
              {azimuthLabels[t]}
            </text>
          </g>
        );
      })}

      <line
        x1={PAD.left}
        y1={PAD.top + innerHeight}
        x2={PAD.left + innerWidth}
        y2={PAD.top + innerHeight}
        stroke="#3d4759"
        strokeWidth={1}
      />

      {winterPath && <path d={winterPath} fill="none" stroke="#7eeaff" strokeWidth={1.8} />}
      {equinoxPath && <path d={equinoxPath} fill="none" stroke="#e8eef5" strokeWidth={1.8} />}
      {summerPath && <path d={summerPath} fill="none" stroke="#ffb347" strokeWidth={1.8} />}

      <g transform={`translate(${PAD.left + 8}, ${PAD.top + 8})`}>
        <rect width={106} height={50} fill="#080b15" stroke="#1a2338" />
        <line x1="6" y1="14" x2="14" y2="14" stroke="#7eeaff" strokeWidth={1.8} />
        <text x={20} y={17} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="#e8eef5" letterSpacing="0.08em">
          WINTER ▾
        </text>
        <line x1="6" y1="28" x2="14" y2="28" stroke="#e8eef5" strokeWidth={1.8} />
        <text x={20} y={31} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="#e8eef5" letterSpacing="0.08em">
          EQUINOX
        </text>
        <line x1="6" y1="42" x2="14" y2="42" stroke="#ffb347" strokeWidth={1.8} />
        <text x={20} y={45} fontSize={9} fontFamily="JetBrains Mono, monospace" fill="#e8eef5" letterSpacing="0.08em">
          SUMMER ▴
        </text>
      </g>
    </svg>
  );
}
