import { describe, it, expect } from 'vitest';
import { buildMonthRose } from './windRoseData';
import type { HourlyWeather } from '../types';

const hourly = {
  time: ['2025-01-01T00:00', '2025-01-01T01:00', '2025-07-01T00:00'],
  windSpeed10m: [10, 12, 25],
  windDirection10m: [0, 0, 180],
} as unknown as HourlyWeather;

describe('buildMonthRose', () => {
  it('keeps only hours from the chosen month', () => {
    const jan = buildMonthRose(hourly, 0);
    expect(jan.total).toBe(2);
    expect(jan.prevailingDirection).toBe(0);
    const jul = buildMonthRose(hourly, 6);
    expect(jul.total).toBe(1);
    expect(jul.prevailingDirection).toBe(8);
  });
  it('uses the whole year when month is null', () => {
    expect(buildMonthRose(hourly, null).total).toBe(3);
  });
});
