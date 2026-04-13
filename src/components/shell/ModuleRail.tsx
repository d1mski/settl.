import type { TabId } from '../../types';
import { TAB_ORDER } from '../../types';

const ICONS: Record<TabId, JSX.Element> = {
  climate: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5L7 17M17 7l1.5-1.5" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  wind: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 8h11a3 3 0 100-6 3 3 0 00-2.83 2" />
      <path d="M3 16h15a3 3 0 110 6 3 3 0 01-2.83-2" />
      <path d="M3 12h9" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  hazards: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M12 3l9 16H3L12 3z" />
      <path d="M12 10v4M12 17v0.5" strokeLinecap="round" />
    </svg>
  ),
  air: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M3 8c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 3 1" />
      <path d="M3 14c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 3 1" />
      <path d="M3 20c2 0 3-1 5-1s3 1 5 1 3-1 5-1 3 1 3 1" />
    </svg>
  ),
  context: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9M12 3c-3 3-4.5 6-4.5 9s1.5 6 4.5 9" />
    </svg>
  ),
};

const CODES: Record<TabId, string> = {
  climate: '03',
  wind: '04',
  sun: '05',
  hazards: '06',
  air: '07',
  context: '08',
};

const LABELS: Record<TabId, string> = {
  climate: 'CLM',
  wind: 'WND',
  sun: 'SUN',
  hazards: 'HZD',
  air: 'AIR',
  context: 'CTX',
};

interface Props {
  active: TabId | null;
  onSelect: (tab: TabId) => void;
  coordsReady: boolean;
}

export function ModuleRail({ active, onSelect, coordsReady }: Props) {
  return (
    <div className="h-full w-[72px] border-l border-edge bg-rail/90 backdrop-blur-sm flex flex-col">
      <div className="border-b border-edge py-2 text-center">
        <div className="text-[8px] font-mono uppercase tracking-widest text-muted">MOD</div>
      </div>

      <div className="flex-1 flex flex-col gap-px py-2">
        {TAB_ORDER.map((id) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              disabled={!coordsReady}
              className={`group relative flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive
                  ? 'bg-cyan/10 text-cyan'
                  : 'text-muted hover:text-ink hover:bg-edge/40'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
              title={id.toUpperCase()}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-cyan" />
              )}
              <span className="text-[8px] font-mono text-dim">§{CODES[id]}</span>
              <span className="w-5 h-5">{ICONS[id]}</span>
              <span className="text-[8px] font-mono tracking-widest">{LABELS[id]}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-edge py-2 text-center">
        <div className="text-[8px] font-mono uppercase tracking-widest text-dim">v0.1</div>
      </div>
    </div>
  );
}
