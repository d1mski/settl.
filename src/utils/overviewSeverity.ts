import type { ModuleState, ClimateData, AqiSample, EarthquakeEvent, WildfireEvent } from '../types';
import type { NearbyFeature } from '../hooks/useOverpassFeatures';
import { countExtremeDays } from './climateAggregation';

export type OverviewSeverity = 'ok' | 'watch' | 'alert' | 'unavailable';

export const SEVERITY_TONE = {
  ok: 'good',
  watch: 'warn',
  alert: 'risk',
} as const satisfies Record<string, 'good' | 'warn' | 'risk'>;

export interface SeverityResult {
  severity: OverviewSeverity;
  metric: string | null;
  unit?: string;
}

export function deriveClimateSeverity(state: ModuleState<ClimateData>): SeverityResult {
  if (state.status !== 'success' || state.data === null) {
    return { severity: 'unavailable', metric: null };
  }
  const { daily } = state.data;
  const extremes = countExtremeDays(daily);
  const heatDays = extremes.above35;
  const maxTemp = Math.max(...daily.temperatureMax.filter(Number.isFinite));
  const metric = Number.isFinite(maxTemp) ? `${maxTemp.toFixed(0)}` : null;
  if (metric === null) return { severity: 'unavailable', metric: null };
  let severity: OverviewSeverity;
  if (heatDays > 30) severity = 'alert';
  else if (heatDays >= 5) severity = 'watch';
  else severity = 'ok';
  return { severity, metric, unit: '°C' };
}

export function deriveWindSeverity(state: ModuleState<ClimateData>): SeverityResult {
  if (state.status !== 'success' || state.data === null) {
    return { severity: 'unavailable', metric: null };
  }
  const { daily } = state.data;
  const maxGust = Math.max(...daily.windGustsMax.filter(Number.isFinite));
  if (!Number.isFinite(maxGust)) return { severity: 'unavailable', metric: null };
  const metric = `${maxGust.toFixed(0)}`;
  let severity: OverviewSeverity;
  if (maxGust > 90) severity = 'alert';
  else if (maxGust >= 60) severity = 'watch';
  else severity = 'ok';
  return { severity, metric, unit: 'km/h' };
}

export function deriveSunSeverity(state: ModuleState<ClimateData>): SeverityResult {
  if (state.status !== 'success' || state.data === null) {
    return { severity: 'unavailable', metric: null };
  }
  const { daily } = state.data;
  const maxUv = Math.max(...daily.uvIndexMax.filter(Number.isFinite));
  if (!Number.isFinite(maxUv)) return { severity: 'unavailable', metric: null };
  const metric = `UV ${maxUv.toFixed(0)}`;
  let severity: OverviewSeverity;
  if (maxUv >= 8) severity = 'alert';
  else if (maxUv >= 6) severity = 'watch';
  else severity = 'ok';
  return { severity, metric, unit: '' };
}

export function deriveHazardsSeverity(
  earthquakes: ModuleState<EarthquakeEvent[]>,
  wildfires: ModuleState<WildfireEvent[]>,
): SeverityResult {
  const eqError = earthquakes.status === 'error';
  const wfError = wildfires.status === 'error';
  if (eqError && wfError) return { severity: 'unavailable', metric: null };

  const eqLoading = earthquakes.status === 'idle' || earthquakes.status === 'loading';
  const wfLoading = wildfires.status === 'idle' || wildfires.status === 'loading';
  if (eqLoading && earthquakes.data === null && wfLoading && wildfires.data === null) {
    return { severity: 'unavailable', metric: null };
  }

  // Assess earthquake severity directly
  const MS_YEAR = 365 * 24 * 3600 * 1000;
  const now = Date.now();
  let hasCriticalEq = false;
  let hasWatchEq = false;

  const eqData = earthquakes.data ?? [];
  const recentEqs = eqData.filter((e) => now - new Date(e.date).getTime() < 3 * MS_YEAR);
  const strongEqs = eqData.filter((e) => e.magnitude >= 5);
  if (recentEqs.length >= 2 || strongEqs.length > 0) hasWatchEq = true;
  if (strongEqs.some((e) => now - new Date(e.date).getTime() < 5 * MS_YEAR && e.magnitude >= 6)) {
    hasCriticalEq = true;
  }

  // Assess wildfire severity directly
  let hasCriticalWf = false;
  let hasWatchWf = false;
  const wfData = wildfires.data ?? [];
  const recentWf = wfData.filter((w) => now - new Date(w.date).getTime() < MS_YEAR);
  if (recentWf.length > 0) {
    const nearest = recentWf.reduce((a, b) => (a.distanceKm < b.distanceKm ? a : b));
    if (nearest.distanceKm < 30) hasCriticalWf = true;
    else hasWatchWf = true;
  }

  if (hasCriticalEq || hasCriticalWf) return { severity: 'alert', metric: 'HIGH', unit: '' };
  if (hasWatchEq || hasWatchWf) return { severity: 'watch', metric: 'MOD', unit: '' };
  return { severity: 'ok', metric: 'LOW', unit: '' };
}

export function deriveAirSeverity(state: ModuleState<AqiSample[]>): SeverityResult {
  if (state.status !== 'success' || state.data === null || state.data.length === 0) {
    return { severity: 'unavailable', metric: null };
  }
  const mean = state.data.reduce((s, d) => s + d.pm25, 0) / state.data.length;
  const metric = `${mean.toFixed(1)}`;
  let severity: OverviewSeverity;
  if (mean > 15) severity = 'alert';
  else if (mean >= 5) severity = 'watch';
  else severity = 'ok';
  return { severity, metric, unit: 'ug/m3' };
}

export function deriveContextSeverity(state: ModuleState<NearbyFeature[]>): SeverityResult {
  if (state.status !== 'success' || state.data === null) {
    return { severity: 'unavailable', metric: null };
  }
  const count = state.data.length;
  return { severity: 'ok', metric: `${count}`, unit: 'places' };
}
