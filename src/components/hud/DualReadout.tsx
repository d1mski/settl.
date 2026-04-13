import type { ReactNode } from 'react';

interface Props {
  label: string;
  valueA: ReactNode;
  valueB: ReactNode;
  hintA?: string;
  hintB?: string;
  delta?: ReactNode;
  deltaTone?: 'good' | 'warn' | 'risk' | 'neutral';
}

const DELTA_TONE: Record<NonNullable<Props['deltaTone']>, string> = {
  good: 'text-good',
  warn: 'text-warn',
  risk: 'text-risk',
  neutral: 'text-muted',
};

export function DualReadout({
  label,
  valueA,
  valueB,
  hintA,
  hintB,
  delta,
  deltaTone = 'neutral',
}: Props) {
  return (
    <div className="border border-edge bg-bg/60 px-3 py-2.5">
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-[9px] font-mono uppercase tracking-widest text-muted">{label}</div>
        {delta !== undefined && delta !== null && (
          <div className={`text-[9px] font-mono uppercase tracking-widest ${DELTA_TONE[deltaTone]}`}>
            Δ {delta}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="border-l-2 border-cyan pl-2">
          <div className="text-base font-mono font-semibold text-cyan tabular-nums leading-tight">
            {valueA}
          </div>
          {hintA && <div className="text-[9px] font-mono text-muted uppercase tracking-wider mt-0.5">{hintA}</div>}
        </div>
        <div className="border-l-2 border-amber pl-2">
          <div className="text-base font-mono font-semibold text-amber tabular-nums leading-tight">
            {valueB}
          </div>
          {hintB && <div className="text-[9px] font-mono text-muted uppercase tracking-wider mt-0.5">{hintB}</div>}
        </div>
      </div>
    </div>
  );
}
