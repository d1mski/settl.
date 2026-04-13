import type { WindRoseMatrix } from '../../utils/windRoseData';
import { SPEED_BUCKET_LABELS, DIRECTION_LABELS } from '../../utils/windRoseData';

interface Props {
  matrix: WindRoseMatrix;
  size?: number;
}

const BUCKET_COLORS = ['#3d4759', '#7eeaff', '#a5d8ff', '#ffb347', '#ff4d5e'];

const SIZE = 360;
const CENTER = SIZE / 2;
const OUTER_RADIUS = 132;
const LABEL_RADIUS = OUTER_RADIUS + 16;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  };
}

function wedgePath(a0: number, a1: number, r0: number, r1: number): string {
  const p1 = polar(a0, r1);
  const p2 = polar(a1, r1);
  if (r0 <= 0.001) {
    return `M ${CENTER} ${CENTER} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r1} ${r1} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
  }
  const p3 = polar(a1, r0);
  const p4 = polar(a0, r0);
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r1} ${r1} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)} A ${r0} ${r0} 0 0 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)} Z`;
}

export function WindRose({ matrix, size = SIZE }: Props) {
  const scale = matrix.maxDirectionCount > 0 ? OUTER_RADIUS / matrix.maxDirectionCount : 0;

  const wedges: Array<{ path: string; color: string; tooltip: string }> = [];
  for (let d = 0; d < 16; d++) {
    const centerAngle = d * 22.5;
    const a0 = centerAngle - 11.25;
    const a1 = centerAngle + 11.25;
    let r0 = 0;
    for (let b = 0; b < 5; b++) {
      const count = matrix.counts[d][b];
      if (count === 0) continue;
      const r1 = r0 + count * scale;
      wedges.push({
        path: wedgePath(a0, a1, r0, r1),
        color: BUCKET_COLORS[b],
        tooltip: `${DIRECTION_LABELS[d]} · ${SPEED_BUCKET_LABELS[b]} km/h · ${count} h`,
      });
      r0 = r1;
    }
  }

  const rings = [0.25, 0.5, 0.75, 1].map((f) => OUTER_RADIUS * f);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        {rings.map((r, i) => (
          <circle
            key={i}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="#1a2338"
            strokeWidth={1}
            strokeDasharray={i === rings.length - 1 ? '0' : '2 4'}
          />
        ))}

        {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map((angle) => {
          const a = polar(angle, OUTER_RADIUS);
          const b = polar(angle + 180, OUTER_RADIUS);
          return (
            <line
              key={angle}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#1a2338"
              strokeWidth={angle % 90 === 0 ? 1 : 0.5}
              strokeDasharray={angle % 90 === 0 ? '0' : '1 3'}
            />
          );
        })}

        {wedges.map((w, i) => (
          <path
            key={i}
            d={w.path}
            fill={w.color}
            fillOpacity={0.85}
            stroke="#080b15"
            strokeWidth={0.6}
          >
            <title>{w.tooltip}</title>
          </path>
        ))}

        {(['N', 'E', 'S', 'W'] as const).map((label, i) => {
          const p = polar(i * 90, LABEL_RADIUS);
          return (
            <text
              key={label}
              x={p.x}
              y={p.y + 4}
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
      </svg>

      <div className="mt-3 flex flex-wrap justify-center gap-3 text-[9px]">
        {SPEED_BUCKET_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5"
              style={{ background: BUCKET_COLORS[i] }}
            />
            <span className="font-mono text-muted uppercase tracking-widest">{label} km/h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
