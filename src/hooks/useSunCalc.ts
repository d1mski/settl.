import { useMemo } from 'react';
import SunCalc from 'suncalc';
import type { Coordinates } from '../types';

export interface SunPathSample {
  hour: number;
  altitude: number;
  azimuth: number;
}

export interface DaySunData {
  label: string;
  date: Date;
  sunrise: Date | null;
  sunset: Date | null;
  solarNoon: Date;
  maxAltitude: number;
  samples: SunPathSample[];
  daylightHours: number;
}

export interface MonthlyDaylight {
  month: number;
  label: string;
  hours: number;
}

export interface SunData {
  winter: DaySunData;
  equinox: DaySunData;
  summer: DaySunData;
  monthly: MonthlyDaylight[];
  todayGoldenHourStart: Date | null;
  todayGoldenHourEnd: Date | null;
  todayBlueHourEnd: Date | null;
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function samplePath(date: Date, coords: Coordinates): SunPathSample[] {
  const samples: SunPathSample[] = [];
  for (let h = 0; h <= 24; h++) {
    const t = new Date(date);
    t.setHours(h, 0, 0, 0);
    const pos = SunCalc.getPosition(t, coords.lat, coords.lon);
    const altitudeDeg = (pos.altitude * 180) / Math.PI;
    const azimuthDeg = (((pos.azimuth * 180) / Math.PI + 180) % 360 + 360) % 360;
    samples.push({ hour: h, altitude: altitudeDeg, azimuth: azimuthDeg });
  }
  return samples;
}

function validDate(d: Date): Date | null {
  return Number.isFinite(d.getTime()) ? d : null;
}

function dayData(label: string, date: Date, coords: Coordinates): DaySunData {
  const times = SunCalc.getTimes(date, coords.lat, coords.lon);
  const samples = samplePath(date, coords);
  const maxAltitude = samples.reduce((m, s) => Math.max(m, s.altitude), -Infinity);

  const sunrise = validDate(times.sunrise);
  const sunset = validDate(times.sunset);

  let daylightHours = 0;
  if (sunrise && sunset) {
    daylightHours = (sunset.getTime() - sunrise.getTime()) / 3600000;
  } else {
    const noonPos = SunCalc.getPosition(times.solarNoon, coords.lat, coords.lon);
    daylightHours = noonPos.altitude > 0 ? 24 : 0;
  }

  return {
    label,
    date,
    sunrise,
    sunset,
    solarNoon: times.solarNoon,
    maxAltitude,
    samples,
    daylightHours,
  };
}

export function useSunData(coords: Coordinates | null): SunData | null {
  return useMemo(() => {
    if (!coords) return null;
    const year = new Date().getFullYear();
    const winter = dayData('Winter solstice', new Date(year, 11, 21), coords);
    const equinox = dayData('Equinox', new Date(year, 2, 20), coords);
    const summer = dayData('Summer solstice', new Date(year, 5, 21), coords);

    const monthly: MonthlyDaylight[] = Array.from({ length: 12 }, (_, m) => {
      const d = new Date(year, m, 15);
      const t = SunCalc.getTimes(d, coords.lat, coords.lon);
      const sr = validDate(t.sunrise);
      const ss = validDate(t.sunset);
      let hours = 0;
      if (sr && ss) hours = (ss.getTime() - sr.getTime()) / 3600000;
      else {
        const noonPos = SunCalc.getPosition(t.solarNoon, coords.lat, coords.lon);
        hours = noonPos.altitude > 0 ? 24 : 0;
      }
      return { month: m, label: MONTH_LABELS[m], hours };
    });

    const today = new Date();
    const todayTimes = SunCalc.getTimes(today, coords.lat, coords.lon);

    return {
      winter,
      equinox,
      summer,
      monthly,
      todayGoldenHourStart: validDate(todayTimes.goldenHour),
      todayGoldenHourEnd: validDate(todayTimes.goldenHourEnd),
      todayBlueHourEnd: validDate(todayTimes.dusk),
    };
  }, [coords?.lat, coords?.lon]);
}

export function hoursSunlitOnFacade(
  facadeBearing: number,
  day: DaySunData,
): number {
  let hours = 0;
  for (let i = 0; i < day.samples.length - 1; i++) {
    const s = day.samples[i];
    if (s.altitude <= 0) continue;
    const diff = Math.abs(((s.azimuth - facadeBearing) % 360 + 540) % 360 - 180);
    if (diff <= 90) hours += 1;
  }
  return hours;
}
