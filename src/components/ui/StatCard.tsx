import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'neutral' | 'good' | 'warn' | 'risk';
}

export function StatCard({ label, value, hint, tone = 'neutral' }: Props) {
  const toneClass = {
    neutral: 'text-ink',
    good: 'text-good',
    warn: 'text-warn',
    risk: 'text-risk',
  }[tone];

  return (
    <div className="rounded border border-border bg-bg/50 p-3">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className={`mt-1 text-xl font-mono font-semibold ${toneClass}`}>{value}</div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}
