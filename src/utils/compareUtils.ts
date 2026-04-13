import type { Coordinates } from '../types';
import { bearing, cardinal, haversine } from './coordinates';

export interface CompareGeometry {
  distanceKm: number;
  bearingAtoB: number;
  bearingBtoA: number;
  cardinalAtoB: string;
}

export function computeCompareGeometry(a: Coordinates, b: Coordinates): CompareGeometry {
  const distanceKm = haversine(a, b) / 1000;
  const bAtoB = bearing(a, b);
  return {
    distanceKm,
    bearingAtoB: bAtoB,
    bearingBtoA: (bAtoB + 180) % 360,
    cardinalAtoB: cardinal(bAtoB),
  };
}

export function formatDistance(km: number): string {
  if (km < 1) return `${(km * 1000).toFixed(0)} M`;
  if (km < 10) return `${km.toFixed(2)} KM`;
  if (km < 100) return `${km.toFixed(1)} KM`;
  return `${km.toFixed(0)} KM`;
}

export function deltaTone(
  delta: number,
  direction: 'higher-bad' | 'higher-good' | 'neutral' = 'neutral',
  threshold = 0,
): 'good' | 'warn' | 'risk' | 'neutral' {
  if (Math.abs(delta) <= threshold) return 'neutral';
  if (direction === 'higher-bad') return delta > 0 ? 'warn' : 'good';
  if (direction === 'higher-good') return delta > 0 ? 'good' : 'warn';
  return 'neutral';
}

export function signedFixed(n: number, digits = 1): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}`;
}
