import { Sun, Wind, Sunrise, TriangleAlert, Gauge, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Coordinates, TabId } from '../../types';
import type { OverviewSeverity, SeverityResult } from '../../utils/overviewSeverity';
import {
  deriveClimateSeverity,
  deriveWindSeverity,
  deriveSunSeverity,
  deriveHazardsSeverity,
  deriveAirSeverity,
  deriveContextSeverity,
} from '../../utils/overviewSeverity';
import { ChapterCard } from '../ui/ChapterCard';
import { useOpenMeteo } from '../../hooks/useOpenMeteo';
import { useAirQuality } from '../../hooks/useAirQuality';
import { useEarthquakes } from '../../hooks/useEarthquakes';
import { useWildfires } from '../../hooks/useWildfires';
import { useOverpassFeatures } from '../../hooks/useOverpassFeatures';

interface ReportPanelProps {
  coordsA: Coordinates | null;
  onDrillDown: (tab: TabId) => void;
}

export function ReportPanel({ coordsA, onDrillDown }: ReportPanelProps) {
  // All hooks called unconditionally at top level (hooks rules)
  const climate = useOpenMeteo(coordsA);
  const aqi = useAirQuality(coordsA);
  const earthquakes = useEarthquakes(coordsA);
  const wildfires = useWildfires(coordsA);
  const features = useOverpassFeatures(coordsA);

  // Derive severity from hook data
  const climateResult = deriveClimateSeverity(climate);
  const windResult = deriveWindSeverity(climate);     // wind data is in ClimateData
  const sunResult = deriveSunSeverity(climate);       // UV data is in ClimateData
  const hazardsResult = deriveHazardsSeverity(earthquakes, wildfires);
  const airResult = deriveAirSeverity(aqi);
  const contextResult = deriveContextSeverity(features);

  const placeholder = coordsA === null;
  const toMetric = (result: SeverityResult): string | null =>
    placeholder ? '--' : result.metric;

  const CARDS: Array<{
    tabId: TabId;
    icon: LucideIcon;
    label: string;
    result: SeverityResult;
  }> = [
    { tabId: 'climate', icon: Sun,           label: 'Climate',      result: climateResult },
    { tabId: 'wind',    icon: Wind,          label: 'Wind',         result: windResult },
    { tabId: 'sun',     icon: Sunrise,       label: 'Sun Exposure', result: sunResult },
    { tabId: 'hazards', icon: TriangleAlert, label: 'Hazards',      result: hazardsResult },
    { tabId: 'air',     icon: Gauge,         label: 'Air Quality',  result: airResult },
    { tabId: 'context', icon: Globe,         label: 'Context',      result: contextResult },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 pt-6">
      {CARDS.map(({ tabId, icon, label, result }) => (
        <ChapterCard
          key={tabId}
          icon={icon}
          label={label}
          metric={toMetric(result)}
          unit={result.unit}
          severity={result.severity as OverviewSeverity}
          onClick={() => onDrillDown(tabId)}
        />
      ))}
      {placeholder && (
        <p className="text-center text-muted text-[0.85rem] font-body mt-2">
          Set a location to see data
        </p>
      )}
    </div>
  );
}
