const YEARS = [1, 5, 10] as const;

interface YearSelectorProps {
  years: 1 | 5 | 10;
  onYearsChange?: (y: 1 | 5 | 10) => void;
}

export function YearSelector({ years, onYearsChange }: YearSelectorProps) {
  return (
    <div className="flex bg-void border border-edge rounded-md p-0.5 w-fit">
      {YEARS.map(y => (
        <button
          key={y}
          onClick={() => onYearsChange?.(y)}
          className={`px-3 py-1 rounded text-[10px] font-mono font-semibold tracking-wider transition-all ${
            years === y ? 'bg-panel text-ink shadow-sm' : 'text-muted cursor-pointer'
          }`}
        >
          {y}YR
        </button>
      ))}
    </div>
  );
}
