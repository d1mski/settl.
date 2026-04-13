import type { BaseMap } from './MapCanvas';

interface Props {
  baseMap: BaseMap;
  onBaseMapChange: (base: BaseMap) => void;
}

export function LayerToggle({ baseMap, onBaseMapChange }: Props) {
  return (
    <div className="w-[180px] border border-edge bg-void/88 backdrop-blur-sm hud-brackets-full">
      <span className="bracket tl" />
      <span className="bracket tr" />
      <span className="bracket bl" />
      <span className="bracket br" />

      <div className="px-2.5 py-1.5 border-b border-edge text-[8px] font-mono uppercase tracking-widest text-muted flex items-center gap-1.5">
        <span className="text-cyan">◇</span>
        <span>MAP BASE</span>
        <span className="flex-1 h-px bg-edge" />
      </div>

      <div className="px-2.5 py-2">
        <div className="flex border border-edge">
          <button
            onClick={() => onBaseMapChange('dark')}
            className={`flex-1 px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-colors ${
              baseMap === 'dark' ? 'bg-cyan/15 text-cyan' : 'text-muted hover:text-ink'
            }`}
          >
            DARK
          </button>
          <button
            onClick={() => onBaseMapChange('light')}
            className={`flex-1 px-2 py-1 text-[9px] font-mono uppercase tracking-widest transition-colors border-l border-edge ${
              baseMap === 'light' ? 'bg-cyan/15 text-cyan' : 'text-muted hover:text-ink'
            }`}
          >
            LIGHT
          </button>
        </div>
      </div>
    </div>
  );
}
