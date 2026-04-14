export const fmtTooltipNum =
  (unit = '', decimals = 1) =>
  (value: number | string): string => {
    const v = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(v)) return String(value);
    const rounded = v.toFixed(decimals);
    return unit ? `${rounded} ${unit}` : rounded;
  };
