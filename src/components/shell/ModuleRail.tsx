import { Sun, Sunrise, Wind, TriangleAlert, Gauge, Globe, LayoutDashboard, List } from 'lucide-react';
import type { TabId } from '../../types';
import { TAB_ORDER } from '../../types';

const ICONS: Record<TabId, JSX.Element> = {
  climate: <Sun className="w-full h-full" strokeWidth={1.4} />,
  wind:    <Wind className="w-full h-full" strokeWidth={1.4} />,
  sun:     <Sunrise className="w-full h-full" strokeWidth={1.4} />,
  hazards: <TriangleAlert className="w-full h-full" strokeWidth={1.4} />,
  air:     <Gauge className="w-full h-full" strokeWidth={1.4} />,
  context: <Globe className="w-full h-full" strokeWidth={1.4} />,
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
  view: 'overview' | 'advanced';
  onToggleView: () => void;
}

export function ModuleRail({ active, onSelect, coordsReady, view, onToggleView }: Props) {
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

      <div className="border-t border-edge mt-auto" />
      <button
        onClick={onToggleView}
        title={view === 'overview' ? 'Advanced view' : 'Overview'}
        aria-label={view === 'overview' ? 'Switch to Advanced view' : 'Switch to Overview'}
        className="flex flex-col items-center justify-center gap-1 py-3 text-muted hover:text-ink hover:bg-edge/40 transition-colors"
      >
        <span className="w-5 h-5">
          {view === 'overview'
            ? <List className="w-full h-full" strokeWidth={1.4} />
            : <LayoutDashboard className="w-full h-full" strokeWidth={1.4} />
          }
        </span>
        <span className="text-[8px] font-mono tracking-widest">
          {view === 'overview' ? 'ADV' : 'OVW'}
        </span>
      </button>

      <div className="border-t border-edge py-2 text-center">
        <div className="text-[8px] font-mono uppercase tracking-widest text-dim">v0.1</div>
      </div>
    </div>
  );
}
