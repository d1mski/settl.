import type { Slot } from '../../hooks/useUrlState';

interface Props {
  compareMode: boolean;
  activeSlot: Slot;
}

export function MapHud({
  compareMode,
  activeSlot,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Active slot indicator (when compare mode is on) */}
      {compareMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 border border-edge bg-void/85 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1.5">
          <span className="text-[8px] font-mono uppercase tracking-widest text-muted">CLICK SETS</span>
          <span
            className={`text-[10px] font-mono font-semibold ${activeSlot === 'b' ? 'text-amber' : 'text-cyan'}`}
          >
            {activeSlot === 'b' ? 'TGT·B' : 'TGT·A'}
          </span>
        </div>
      )}
    </div>
  );
}
