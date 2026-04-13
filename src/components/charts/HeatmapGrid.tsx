import type { HeatmapData } from '../../utils/climateAggregation';

interface Props {
  data: HeatmapData;
  scaleMin?: number;
  scaleMax?: number;
}

const MONTH_LABELS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const COLD = { r: 126, g: 234, b: 255 };
const MID = { r: 26, g: 35, b: 56 };
const HOT = { r: 255, g: 77, b: 94 };

function lerp(a: typeof COLD, b: typeof COLD, t: number): string {
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function temperatureColor(temp: number, min: number, max: number): string {
  if (max - min < 0.01) return 'rgb(26,35,56)';
  const t = (temp - min) / (max - min);
  if (t < 0.5) return lerp(COLD, MID, t * 2);
  return lerp(MID, HOT, (t - 0.5) * 2);
}

export function HeatmapGrid({ data, scaleMin, scaleMax }: Props) {
  const cellW = 22;
  const cellH = 20;
  const marginLeft = 38;
  const marginTop = 22;
  const marginBottom = 22;
  const width = marginLeft + 24 * cellW + 8;
  const height = marginTop + 12 * cellH + marginBottom;
  const effMin = scaleMin ?? data.minTemp;
  const effMax = scaleMax ?? data.maxTemp;
  const isShared = scaleMin !== undefined || scaleMax !== undefined;

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Temperature heatmap, 12 months by 24 hours"
      >
        {Array.from({ length: 24 }, (_, hour) => {
          if (hour % 3 !== 0) return null;
          return (
            <text
              key={`h-${hour}`}
              x={marginLeft + hour * cellW + cellW / 2}
              y={marginTop - 8}
              textAnchor="middle"
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
              fill="#6a768b"
              letterSpacing="0.05em"
            >
              {hour.toString().padStart(2, '0')}
            </text>
          );
        })}

        {MONTH_LABELS.map((label, m) => (
          <text
            key={`m-${m}`}
            x={marginLeft - 6}
            y={marginTop + m * cellH + cellH / 2 + 3}
            textAnchor="end"
            fontSize={9}
            fontFamily="JetBrains Mono, monospace"
            fill="#6a768b"
            letterSpacing="0.05em"
          >
            {label}
          </text>
        ))}

        {data.cells.map((row, m) =>
          row.map((cell, h) => {
            const x = marginLeft + h * cellW;
            const y = marginTop + m * cellH;
            if (cell.count === 0) {
              return (
                <rect
                  key={`c-${m}-${h}`}
                  x={x}
                  y={y}
                  width={cellW - 1}
                  height={cellH - 1}
                  fill="#0d121e"
                  stroke="#1a2338"
                  strokeWidth={0.5}
                />
              );
            }
            return (
              <rect
                key={`c-${m}-${h}`}
                x={x}
                y={y}
                width={cellW - 1}
                height={cellH - 1}
                fill={temperatureColor(cell.tempMean, effMin, effMax)}
              >
                <title>
                  {MONTH_LABELS[m]} {h.toString().padStart(2, '0')}:00 ·{' '}
                  {cell.tempMean.toFixed(1)}°C
                </title>
              </rect>
            );
          }),
        )}

        <text
          x={marginLeft}
          y={height - 4}
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill="#7eeaff"
          letterSpacing="0.05em"
        >
          {data.minTemp.toFixed(1)}°C
        </text>
        <text
          x={marginLeft + 12 * cellW}
          y={height - 4}
          fontSize={8}
          fontFamily="JetBrains Mono, monospace"
          fill="#6a768b"
          textAnchor="middle"
          letterSpacing="0.1em"
        >
          {isShared
            ? `SCALE ${effMin.toFixed(0)}…${effMax.toFixed(0)}°C`
            : `RANGE ${(data.maxTemp - data.minTemp).toFixed(1)}°C`}
        </text>
        <text
          x={marginLeft + 24 * cellW - 4}
          y={height - 4}
          fontSize={9}
          fontFamily="JetBrains Mono, monospace"
          fill="#ff4d5e"
          textAnchor="end"
          letterSpacing="0.05em"
        >
          {data.maxTemp.toFixed(1)}°C
        </text>
      </svg>
    </div>
  );
}
