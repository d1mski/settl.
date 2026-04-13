interface Props {
  code: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({ code, title, subtitle }: Props) {
  return (
    <div className="flex items-baseline gap-3 mb-3">
      <span className="text-[9px] font-mono text-cyan/70 tracking-widest-plus">
        §{code}
      </span>
      <div className="flex-1 flex items-baseline gap-2 min-w-0">
        <span className="text-[10px] font-mono uppercase tracking-widest text-ink">
          {title}
        </span>
        {subtitle && (
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted truncate">
            · {subtitle}
          </span>
        )}
      </div>
      <span className="flex-1 h-px bg-edge" />
    </div>
  );
}
