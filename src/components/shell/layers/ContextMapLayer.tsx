import { CircleMarker, Popup } from 'react-leaflet';
import type { Coordinates } from '../../../types';
import { useWikipedia } from '../../../hooks/useWikipedia';
import {
  useOverpassFeatures,
  type FeatureCategory,
  type NearbyFeature,
} from '../../../hooks/useOverpassFeatures';
import { useReverseGeocode } from '../../../hooks/useNominatim';
import type { WikiArticle } from '../../../types';

const CATEGORY_COLORS: Record<FeatureCategory, string> = {
  amenity: '#66ffa3',
  industrial: '#ffb347',
  airport: '#ff4d5e',
  water: '#7eeaff',
  park: '#66ffa3',
  place: '#e8eef5',
  transit: '#a5d8ff',
  other: '#6a768b',
  hazard: '#ff6b35',
};

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
}

export function ContextMapLayer({ coordsA, coordsB }: Props) {
  const geoA = useReverseGeocode(coordsA);
  const geoB = useReverseGeocode(coordsB);
  const wikiA = useWikipedia(coordsA, geoA.result?.countryCode ?? null);
  const wikiB = useWikipedia(coordsB, geoB.result?.countryCode ?? null);
  const featuresA = useOverpassFeatures(coordsA);
  const featuresB = useOverpassFeatures(coordsB);

  return (
    <>
      {featuresA.data && (
        <FeaturePins features={featuresA.data} slot="A" tone="cyan" />
      )}
      {featuresB.data && (
        <FeaturePins features={featuresB.data} slot="B" tone="amber" />
      )}
      {wikiA.data && <WikiPins articles={wikiA.data} slot="A" color="#7eeaff" />}
      {wikiB.data && <WikiPins articles={wikiB.data} slot="B" color="#ffb347" />}
    </>
  );
}

function FeaturePins({
  features,
  slot,
  tone,
}: {
  features: NearbyFeature[];
  slot: 'A' | 'B';
  tone: 'cyan' | 'amber';
}) {
  return (
    <>
      {features
        .filter((f) => Number.isFinite(f.lat) && Number.isFinite(f.lon))
        .slice(0, 160)
        .map((f) => {
          const color = CATEGORY_COLORS[f.category];
          const dist = typeof f.distanceKm === 'number' ? f.distanceKm.toFixed(2) : '—';
          return (
            <CircleMarker
              key={`feat-${slot}-${f.elementType}-${f.id}`}
              center={[f.lat, f.lon]}
              radius={4}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: slot === 'A' ? 0.7 : 0.5,
                weight: 1,
                dashArray: slot === 'B' ? '2 2' : undefined,
              }}
            >
              <Popup>
                <div className="font-mono text-[10px] leading-snug">
                  <div className="font-bold">{f.name ?? f.subtype}</div>
                  <div className="uppercase text-gray-500">
                    {f.category} · {f.subtype}
                  </div>
                  <div className={tone === 'cyan' ? 'text-cyan-600' : 'text-amber-600'}>
                    {dist} KM · TGT·{slot}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
    </>
  );
}

function WikiPins({
  articles,
  slot,
  color,
}: {
  articles: WikiArticle[];
  slot: 'A' | 'B';
  color: string;
}) {
  return (
    <>
      {articles
        .filter((a) => Number.isFinite(a.lat) && Number.isFinite(a.lon))
        .slice(0, 12)
        .map((article) => {
          const dist = typeof article.distanceKm === 'number'
            ? article.distanceKm.toFixed(1)
            : '—';
          return (
        <CircleMarker
          key={`wiki-${slot}-${article.language}-${article.pageid}`}
          center={[article.lat, article.lon]}
          radius={7}
          pathOptions={{
            color,
            fillColor: color,
            fillOpacity: 0.12,
            weight: 2,
          }}
        >
          <Popup>
            <div
              className="font-mono text-[10px] leading-snug"
              style={{ maxWidth: 240 }}
            >
              <div className="font-bold uppercase tracking-wide">
                {article.title}
              </div>
              <div className="uppercase text-gray-500 mt-0.5">
                {article.language.toUpperCase()} · {dist}
                KM · TGT·{slot}
              </div>
              {article.extract && (
                <div className="mt-1.5 leading-relaxed line-clamp-4">
                  {article.extract}
                </div>
              )}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1.5 underline"
                style={{ color }}
              >
                OPEN ARTICLE →
              </a>
            </div>
          </Popup>
        </CircleMarker>
          );
        })}
    </>
  );
}
