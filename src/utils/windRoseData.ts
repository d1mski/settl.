import type { HourlyWeather } from '../types';

export const SPEED_BUCKET_UPPER = [5, 10, 20, 30];
export const SPEED_BUCKET_LABELS = ['0–5', '5–10', '10–20', '20–30', '30+'];
export const DIRECTION_LABELS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
];

export interface WindRoseMatrix {
  counts: number[][];
  directionTotals: number[];
  total: number;
  calmCount: number;
  prevailingDirection: number;
  maxDirectionCount: number;
}

export function buildWindRose(
  windSpeeds: number[],
  windDirections: number[],
): WindRoseMatrix {
  const counts: number[][] = Array.from({ length: 16 }, () => [0, 0, 0, 0, 0]);
  const directionTotals = new Array<number>(16).fill(0);
  let total = 0;
  let calmCount = 0;

  const n = Math.min(windSpeeds.length, windDirections.length);
  for (let i = 0; i < n; i++) {
    const speed = windSpeeds[i];
    const dir = windDirections[i];
    if (!Number.isFinite(speed) || !Number.isFinite(dir)) continue;
    total += 1;
    if (speed < 0.5) {
      calmCount += 1;
      continue;
    }
    const shifted = ((dir + 11.25) % 360 + 360) % 360;
    const dirIdx = Math.floor(shifted / 22.5) % 16;

    let bucket = 4;
    for (let b = 0; b < SPEED_BUCKET_UPPER.length; b++) {
      if (speed <= SPEED_BUCKET_UPPER[b]) {
        bucket = b;
        break;
      }
    }
    counts[dirIdx][bucket] += 1;
    directionTotals[dirIdx] += 1;
  }

  let prevailing = 0;
  let max = 0;
  for (let i = 0; i < 16; i++) {
    if (directionTotals[i] > max) {
      max = directionTotals[i];
      prevailing = i;
    }
  }

  return {
    counts,
    directionTotals,
    total,
    calmCount,
    prevailingDirection: prevailing,
    maxDirectionCount: max,
  };
}

export interface SeasonalWind {
  winterMeanSpeed: number;
  winterMeanTemp: number;
  windChillFlag: boolean;
}

export function summariseSeasonalWind(hourly: HourlyWeather): SeasonalWind {
  let speedSum = 0;
  let speedCount = 0;
  let tempSum = 0;
  let tempCount = 0;
  const n = hourly.time.length;
  for (let i = 0; i < n; i++) {
    const t = hourly.time[i];
    if (!t) continue;
    const month = parseInt(t.slice(5, 7), 10);
    if (month !== 12 && month !== 1 && month !== 2) continue;
    const speed = hourly.windSpeed10m[i];
    const temp = hourly.temperature2m[i];
    if (Number.isFinite(speed)) {
      speedSum += speed;
      speedCount += 1;
    }
    if (Number.isFinite(temp)) {
      tempSum += temp;
      tempCount += 1;
    }
  }
  const winterMeanSpeed = speedCount ? speedSum / speedCount : 0;
  const winterMeanTemp = tempCount ? tempSum / tempCount : 0;
  const windChillFlag = winterMeanTemp < 5 && winterMeanSpeed > 15;
  return { winterMeanSpeed, winterMeanTemp, windChillFlag };
}
