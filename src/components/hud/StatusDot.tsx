interface Props {
  tone?: 'cyan' | 'good' | 'warn' | 'risk' | 'muted';
  pulse?: boolean;
  label?: string;
}

const COLOR: Record<NonNullable<Props['tone']>, string> = {
  cyan: '#7eeaff',
  good: '#66ffa3',
  warn: '#ffb347',
  risk: '#ff4d5e',
  muted: '#6a768b',
};

export function StatusDot({ tone = 'cyan', pulse = true, label }: Props) {
  const color = COLOR[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-flex w-2 h-2">
        {pulse && (
          <span
            className="absolute inset-0 rounded-full opacity-60"
            style={{
              background: color,
              animation: 'pulse-dot 2s ease-in-out infinite',
            }}
          />
        )}
        <span
          className="relative inline-block w-2 h-2 rounded-full"
          style={{ background: color }}
        />
      </span>
      {label && (
        <span className="text-[9px] font-mono uppercase tracking-widest text-muted">
          {label}
        </span>
      )}
    </span>
  );
}
