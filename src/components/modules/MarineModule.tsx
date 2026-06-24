import type { ReactNode } from 'react';
import type { Coordinates } from '../../types';
import { useMarine, wmoSeverity } from '../../hooks/useMarine';
import { StatReadout } from '../hud/StatReadout';
import { SectionHeader } from '../hud/SectionHeader';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

// SingleView only — no CompareView, no DualReadout (D-03; mirrors Phase 09 webcams precedent)

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;   // accepted for signature parity, IGNORED (D-03 SingleView-only)
  compareMode: boolean;          // accepted for signature parity, IGNORED
}

export function MarineModule({ coordsA }: Props) {
  const state = useMarine(coordsA);

  if (!coordsA) return <EmptyState />;
  if (state.status === 'loading' || state.status === 'idle') return <LoadingSkeleton />;
  if (state.status === 'error' || !state.data) return <ErrorState error={state.error} />;

  const sev = wmoSeverity(state.data.waveHeight);
  const TONE = { ok: 'good', watch: 'warn', alert: 'risk', unavailable: 'neutral' } as const;
  const BADGE = { ok: 'OK', watch: 'WATCH', alert: 'ALERT', unavailable: 'N/A' } as const;

  return (
    <div className="space-y-5">
      <SectionContainer code="01" title="SEA STATE" subtitle={`LIVE · ${state.data.observationTime}`}>
        <div>
          <div className={`text-2xl font-mono font-semibold tabular-nums ${TONE[sev] === 'good' ? 'text-good' : TONE[sev] === 'warn' ? 'text-warn' : TONE[sev] === 'risk' ? 'text-risk' : 'text-ink'}`}>
            {BADGE[sev]}
          </div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-muted mt-1">
            {'OK <2.5 · Watch 2.5–4 · Alert >4 (m)'}
          </div>
        </div>
      </SectionContainer>

      <div className="grid gap-2 grid-cols-2">
        <StatReadout
          label="WAVE HEIGHT"
          value={state.data.waveHeight !== null ? `${state.data.waveHeight.toFixed(2)} m` : '—'}
          tone={TONE[sev]}
        />
        <StatReadout
          label="SEA SURFACE TEMP"
          value={state.data.seaSurfaceTemp !== null ? `${state.data.seaSurfaceTemp.toFixed(1)}°C` : '—'}
          tone="cyan"
        />
      </div>
    </div>
  );
}

function SectionContainer({
  code,
  title,
  subtitle,
  children,
}: {
  code: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <SectionHeader code={code} title={title} subtitle={subtitle} />
      <div className="border border-edge bg-bg/40 p-3 rounded-md">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-edge bg-bg/40 p-6 text-center rounded-md">
      <div className="text-[10px] font-mono uppercase tracking-widest text-cyan/70 mb-1">▸ AWAITING TARGET</div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted">
        SET COORD VIA INPUT OR MAP CLICK
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string | null }) {
  return (
    <div className="border border-risk/50 bg-risk/5 p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-risk mb-1">✖ FETCH FAILED</div>
      {error && <div className="text-[10px] font-mono text-ink break-words">{error}</div>}
    </div>
  );
}
