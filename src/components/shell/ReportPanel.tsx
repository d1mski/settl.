import { useMemo } from 'react';
import {
  Sun,
  Wind,
  Sunrise,
  TriangleAlert,
  Gauge,
  Globe,
  Microscope,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Coordinates, TabId } from '../../types';
import type { OverviewSeverity } from '../../utils/overviewSeverity';
import {
  SEVERITY_TONE,
  deriveClimateSeverity,
  deriveWindSeverity,
  deriveSunSeverity,
  deriveHazardsSeverity,
  deriveAirSeverity,
  deriveContextSeverity,
} from '../../utils/overviewSeverity';
import { StatusDot } from '../hud/StatusDot';
import { useOpenMeteo } from '../../hooks/useOpenMeteo';
import { useAirQuality } from '../../hooks/useAirQuality';
import { useEarthquakes } from '../../hooks/useEarthquakes';
import { useWildfires } from '../../hooks/useWildfires';
import { useOverpassFeatures, type NearbyFeature } from '../../hooks/useOverpassFeatures';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ReportPanelProps {
  coordsA: Coordinates | null;
  resolvedA: string | null;
  countryA: string | null;
  onDrillDown: (tab: TabId) => void;
}

interface Metric {
  value: string;
  label: string;
}

interface Chapter {
  id: TabId;
  icon: LucideIcon;
  label: string;
  question: string;
  answer: string;
  severity: OverviewSeverity;
  severityLabel: string;
  metrics: Metric[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function avg(arr: number[]): number {
  const valid = arr.filter(Number.isFinite);
  if (valid.length === 0) return NaN;
  let s = 0;
  for (const v of valid) s += v;
  return s / valid.length;
}

function sum(arr: number[]): number {
  let s = 0;
  for (const v of arr) if (Number.isFinite(v)) s += v;
  return s;
}

function maxVal(arr: number[]): number {
  const valid = arr.filter(Number.isFinite);
  if (valid.length === 0) return NaN;
  return Math.max(...valid);
}

function fmt(n: number, decimals = 0): string {
  return Number.isFinite(n) ? n.toFixed(decimals) : '--';
}

function severityLabel(s: OverviewSeverity): string {
  if (s === 'ok') return 'OK';
  if (s === 'watch') return 'Watch';
  if (s === 'alert') return 'Alert';
  return '';
}

function nearestBySubtype(features: NearbyFeature[] | null, subtype: string): NearbyFeature | null {
  if (!features) return null;
  return features
    .filter(f => f.subtype === subtype)
    .sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ReportPanel({ coordsA, resolvedA, countryA, onDrillDown }: ReportPanelProps) {
  const climate = useOpenMeteo(coordsA);
  const aqi = useAirQuality(coordsA);
  const earthquakes = useEarthquakes(coordsA);
  const wildfires = useWildfires(coordsA);
  const features = useOverpassFeatures(coordsA);

  const climateResult = deriveClimateSeverity(climate);
  const windResult = deriveWindSeverity(climate);
  const sunResult = deriveSunSeverity(climate);
  const hazardsResult = deriveHazardsSeverity(earthquakes, wildfires);
  const airResult = deriveAirSeverity(aqi);
  const contextResult = deriveContextSeverity(features);

  const emergency = useMemo(() => {
    const featData = features.data;
    const hospital = nearestBySubtype(featData, 'hospital');
    const police = nearestBySubtype(featData, 'police');
    const fireStation = nearestBySubtype(featData, 'fire_station');
    const allFound = hospital !== null && police !== null && fireStation !== null;
    const severity: OverviewSeverity = featData === null ? 'unavailable' : allFound ? 'ok' : 'watch';
    return {
      severity,
      metrics: [
        { value: hospital ? `${hospital.distanceKm.toFixed(1)} km` : 'None nearby', label: 'Hospital' },
        { value: police ? `${police.distanceKm.toFixed(1)} km` : 'None nearby', label: 'Police' },
        { value: fireStation ? `${fireStation.distanceKm.toFixed(1)} km` : 'None nearby', label: 'Fire Station' },
      ],
    };
  }, [features.data]);

  const chapters = useMemo<Chapter[]>(() => {
    const d = climate.data?.daily;
    const aqiData = aqi.data;
    const eqData = earthquakes.data;
    const wfData = wildfires.data;
    const featData = features.data;

    /* Climate */
    const climateMetrics: Metric[] = d
      ? [
          { value: fmt(avg(d.temperatureMean), 1) + '\u00B0', label: 'Mean temp' },
          { value: fmt(sum(d.precipitationSum), 0) + ' mm', label: 'Total precip' },
          { value: fmt(maxVal(d.uvIndexMax), 0), label: 'Peak UV' },
          { value: fmt(sum(d.sunshineDuration) / 3600, 0) + ' h', label: 'Sunshine hrs' },
        ]
      : [
          { value: '--', label: 'Mean temp' },
          { value: '--', label: 'Total precip' },
          { value: '--', label: 'Peak UV' },
          { value: '--', label: 'Sunshine hrs' },
        ];

    /* Wind */
    const windMetrics: Metric[] = d
      ? [
          { value: fmt(maxVal(d.windGustsMax), 0) + ' km/h', label: 'Max gust' },
          { value: fmt(avg(d.windSpeedMax), 1) + ' km/h', label: 'Avg wind speed' },
        ]
      : [
          { value: '--', label: 'Max gust' },
          { value: '--', label: 'Avg wind speed' },
        ];

    /* Sun Exposure */
    const sunMetrics: Metric[] = d
      ? [
          { value: fmt(maxVal(d.uvIndexMax), 0), label: 'Peak UV index' },
          { value: fmt(avg(d.sunshineDuration) / 3600, 1) + ' h', label: 'Daily sunshine avg' },
        ]
      : [
          { value: '--', label: 'Peak UV index' },
          { value: '--', label: 'Daily sunshine avg' },
        ];

    /* Hazards */
    const eqCount = eqData?.length ?? 0;
    const wfCount = wfData?.length ?? 0;
    const maxMag = eqData && eqData.length > 0
      ? Math.max(...eqData.map(e => e.magnitude))
      : NaN;
    const hazardsMetrics: Metric[] = [
      { value: eqData ? String(eqCount) : '--', label: 'Quakes nearby' },
      { value: wfData ? String(wfCount) : '--', label: 'Active fires' },
      ...(Number.isFinite(maxMag) ? [{ value: fmt(maxMag, 1), label: 'Max magnitude' }] : []),
    ];

    /* Air Quality */
    const airMetrics: Metric[] = aqiData && aqiData.length > 0
      ? [
          { value: fmt(avg(aqiData.map(s => s.pm25)), 1), label: 'PM2.5 mean' },
          { value: fmt(avg(aqiData.map(s => s.pm10)), 1), label: 'PM10 mean' },
          { value: fmt(avg(aqiData.map(s => s.no2)), 1), label: 'NO\u2082 mean' },
          { value: fmt(avg(aqiData.map(s => s.o3)), 1), label: 'O\u2083 mean' },
        ]
      : [
          { value: '--', label: 'PM2.5 mean' },
          { value: '--', label: 'PM10 mean' },
          { value: '--', label: 'NO\u2082 mean' },
          { value: '--', label: 'O\u2083 mean' },
        ];

    /* Context */
    const contextMetrics: Metric[] = [
      { value: featData ? String(featData.length) : '--', label: 'Places nearby' },
    ];

    return [
      {
        id: 'climate' as TabId,
        icon: Sun,
        label: 'Climate',
        question: "What's the climate like?",
        answer: 'Annual averages from historical weather model data.',
        severity: climateResult.severity,
        severityLabel: severityLabel(climateResult.severity),
        metrics: climateMetrics,
      },
      {
        id: 'wind' as TabId,
        icon: Wind,
        label: 'Wind',
        question: 'How windy does it get?',
        answer: 'Wind speed and gust extremes from the past year.',
        severity: windResult.severity,
        severityLabel: severityLabel(windResult.severity),
        metrics: windMetrics,
      },
      {
        id: 'sun' as TabId,
        icon: Sunrise,
        label: 'Sun Exposure',
        question: 'How much sunlight throughout the year?',
        answer: 'UV exposure and sunshine duration from weather data.',
        severity: sunResult.severity,
        severityLabel: severityLabel(sunResult.severity),
        metrics: sunMetrics,
      },
      {
        id: 'hazards' as TabId,
        icon: TriangleAlert,
        label: 'Hazards',
        question: 'What about seismic and wildfire risk?',
        answer: 'Earthquake history from USGS, active fires from NASA satellite data.',
        severity: hazardsResult.severity,
        severityLabel: severityLabel(hazardsResult.severity),
        metrics: hazardsMetrics,
      },
      {
        id: 'air' as TabId,
        icon: Gauge,
        label: 'Air Quality',
        question: 'How clean is the air?',
        answer: 'Pollution levels compared to WHO guidelines.',
        severity: airResult.severity,
        severityLabel: severityLabel(airResult.severity),
        metrics: airMetrics,
      },
      {
        id: 'context' as TabId,
        icon: Globe,
        label: 'Context',
        question: "What's nearby?",
        answer: 'Points of interest and amenities from OpenStreetMap.',
        severity: contextResult.severity,
        severityLabel: severityLabel(contextResult.severity),
        metrics: contextMetrics,
      },
    ];
  }, [climate.data, aqi.data, earthquakes.data, wildfires.data, features.data, climateResult, windResult, sunResult, hazardsResult, airResult, contextResult]);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="px-6 pt-6 pb-4">
        <span className="text-[9px] font-mono uppercase tracking-widest text-muted">
          Location Report
        </span>
        <h1 className="text-[1.5rem] font-body font-semibold text-ink mt-1 leading-tight">
          {resolvedA ?? 'Acquiring\u2026'}
        </h1>
        {countryA && (
          <span className="text-[0.85rem] text-muted font-body">{countryA}</span>
        )}
      </div>

      {/* Chapter nav */}
      <nav
        className="px-6 pb-3 flex gap-3 overflow-x-auto border-b border-edge"
        style={{ scrollbarWidth: 'none' }}
      >
        <a
          href="#report-emergency"
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted hover:text-ink transition-colors whitespace-nowrap"
        >
          <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.4} />
          Emergency
        </a>
        {chapters.map(ch => (
          <a
            key={ch.id}
            href={`#report-${ch.id}`}
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted hover:text-ink transition-colors whitespace-nowrap"
          >
            <ch.icon className="w-3.5 h-3.5" strokeWidth={1.4} />
            {ch.label}
          </a>
        ))}
      </nav>

      {/* Emergency section */}
      <section
        id="report-emergency"
        className="px-6 py-5 border-b border-edge cursor-pointer hover:bg-edge/20 transition-colors"
        onClick={() => onDrillDown('context')}
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-muted" strokeWidth={1.4} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
            Emergency
          </span>
          {emergency.severity !== 'unavailable' && (
            <StatusDot
              tone={SEVERITY_TONE[emergency.severity as keyof typeof SEVERITY_TONE]}
              label={severityLabel(emergency.severity)}
            />
          )}
        </div>
        <h2 className="text-[1.05rem] font-body font-semibold text-ink leading-snug">
          How close are emergency services?
        </h2>
        <p className="text-[0.85rem] text-muted font-body mt-1">
          Distance to the nearest hospital, police station, and fire station.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {emergency.metrics.map((m, i) => (
            <div key={i} className="bg-void border border-edge rounded-[10px] px-3 py-2">
              <span className="text-[1.25rem] font-mono font-semibold text-ink">
                {m.value}
              </span>
              <span className="block text-[10px] font-mono text-muted mt-0.5">
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Chapter sections */}
      {chapters.map(ch => (
        <section
          key={ch.id}
          id={`report-${ch.id}`}
          className="px-6 py-5 border-b border-edge cursor-pointer hover:bg-edge/20 transition-colors"
          onClick={() => onDrillDown(ch.id)}
        >
          <div className="flex items-center gap-2 mb-1">
            <ch.icon className="w-4 h-4 text-muted" strokeWidth={1.4} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
              {ch.label}
            </span>
            {ch.severity !== 'unavailable' && (
              <StatusDot
                tone={SEVERITY_TONE[ch.severity as keyof typeof SEVERITY_TONE]}
                label={ch.severityLabel}
              />
            )}
          </div>
          <h2 className="text-[1.05rem] font-body font-semibold text-ink leading-snug">
            {ch.question}
          </h2>
          <p className="text-[0.85rem] text-muted font-body mt-1">{ch.answer}</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {ch.metrics.map((m, i) => (
              <div key={i} className="bg-void border border-edge rounded-[10px] px-3 py-2">
                <span className="text-[1.25rem] font-mono font-semibold text-ink">
                  {m.value}
                </span>
                <span className="block text-[10px] font-mono text-muted mt-0.5">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Go deeper CTA */}
      <div
        onClick={() => onDrillDown('climate')}
        className="mx-6 my-5 p-4 bg-void border border-edge rounded-[10px] flex items-center gap-3 cursor-pointer hover:border-cyan/40 transition-colors"
      >
        <Microscope className="w-5 h-5 text-cyan shrink-0" strokeWidth={1.4} />
        <div className="flex-1">
          <div className="text-[0.85rem] font-body font-semibold text-ink">Go deeper</div>
          <div className="text-[10px] text-muted font-mono">
            Heatmaps, wind rose, sun paths, pollutant breakdowns and more.
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-cyan shrink-0" strokeWidth={1.4} />
      </div>
    </div>
  );
}
