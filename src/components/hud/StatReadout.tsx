import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'risk' | 'cyan' | 'amber';
  compact?: boolean;
}

const TONE_CLASS: Record<NonNullable<Props['tone']>, string> = {
  neutral: 'text-ink',
  good: 'text-good',
  warn: 'text-warn',
  risk: 'text-risk',
  cyan: 'text-cyan',
  amber: 'text-amber',
};

const TONE_ACCENT: Record<NonNullable<Props['tone']>, string> = {
  neutral: 'before:bg-edge-bright',
  good: 'before:bg-good',
  warn: 'before:bg-warn',
  risk: 'before:bg-risk',
  cyan: 'before:bg-cyan',
  amber: 'before:bg-amber',
};

export function StatReadout({
  label,
  value,
  hint,
  tone = 'neutral',
  compact = false,
}: Props) {
  return (
    <div
      className={`relative border border-edge bg-bg/60 ${compact ? 'px-2 py-1.5' : 'px-3 py-2.5'} before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] ${TONE_ACCENT[tone]}`}
    >
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className={`${compact ? 'text-sm' : 'text-lg'} font-mono font-semibold mt-0.5 ${TONE_CLASS[tone]} tabular-nums`}>
        {value}
      </div>
      {hint && (
        <div className="text-[9px] font-mono uppercase tracking-wider text-muted mt-0.5">
          {hint}
        </div>
      )}
    </div>
  );
}
