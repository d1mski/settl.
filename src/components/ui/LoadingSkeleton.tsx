export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-mono uppercase tracking-widest text-cyan animate-pulse">
          ▸ ACQUIRING DATA
        </span>
        <span className="flex-1 h-px bg-edge" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-32 bg-edge animate-pulse" />
        <div className="h-32 border border-edge bg-bg/40 animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 border border-edge bg-bg/40 animate-pulse" />
          <div className="h-16 border border-edge bg-bg/40 animate-pulse" />
          <div className="h-16 border border-edge bg-bg/40 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
