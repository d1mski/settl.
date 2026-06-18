import { useMemo, useCallback, type ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import type { Coordinates, WikiArticle } from '../../types';
import { useWikipedia } from '../../hooks/useWikipedia';
import { useReverseGeocode } from '../../hooks/useNominatim';
import {
  nearestByType,
  useOverpassFeatures,
  type NearbyFeature,
} from '../../hooks/useOverpassFeatures';
import { SectionHeader } from '../hud/SectionHeader';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

interface Props {
  coordsA: Coordinates | null;
  coordsB: Coordinates | null;
  compareMode: boolean;
}

const HAZARD_KEYWORDS = ['flood', 'fire', 'landslide', 'tsunami', 'earthquake', 'eruption'];

export function ContextModule({ coordsA, coordsB, compareMode }: Props) {
  const geoA = useReverseGeocode(coordsA);
  const geoB = useReverseGeocode(coordsB);
  const wikiA = useWikipedia(coordsA, geoA.result?.countryCode ?? null);
  const wikiB = useWikipedia(coordsB, geoB.result?.countryCode ?? null);
  const featuresA = useOverpassFeatures(coordsA);
  const featuresB = useOverpassFeatures(coordsB);

  if (!coordsA) return <EmptyState />;

  const isCompare = compareMode && coordsA && coordsB;

  if (isCompare) {
    return (
      <CompareView
        wikiA={wikiA.data ?? []}
        wikiB={wikiB.data ?? []}
        wikiAStatus={wikiA.status}
        wikiBStatus={wikiB.status}
        featuresA={featuresA.data ?? []}
        featuresB={featuresB.data ?? []}
        featuresAStatus={featuresA.status}
        featuresBStatus={featuresB.status}
      />
    );
  }

  return (
    <SingleView
      wiki={wikiA.data ?? []}
      wikiStatus={wikiA.status}
      wikiError={wikiA.error}
      features={featuresA.data ?? []}
      featuresStatus={featuresA.status}
      featuresError={featuresA.error}
    />
  );
}

function SingleView({
  wiki,
  wikiStatus,
  wikiError,
  features,
  featuresStatus,
  featuresError,
}: {
  wiki: WikiArticle[];
  wikiStatus: string;
  wikiError: string | null;
  features: NearbyFeature[];
  featuresStatus: string;
  featuresError: string | null;
}) {
  const hazardMentions = useMemo(() => collectHazards(wiki), [wiki]);
  const nearest = useMemo(() => nearestByType(features), [features]);
  const featureCounts = useMemo(() => summariseFeatures(features), [features]);

  return (
    <div className="space-y-5">
      <OverlayHint />

      <Section code="01" title="WIKIPEDIA INTEL" subtitle="GEOTAGGED · ≤10KM · EN + LOCAL">
        <WikiList wiki={wiki} status={wikiStatus} error={wikiError} />
      </Section>

      {hazardMentions.length > 0 && <HazardBanner hits={hazardMentions} />}

      <Section code="02" title="NEARBY FEATURES" subtitle="CATEGORY COUNTS · OVERLAID ON MAP">
        {featuresStatus === 'loading' || featuresStatus === 'idle' ? (
          <LoadingSkeleton />
        ) : featuresStatus === 'error' ? (
          <div className="text-[10px] font-mono text-risk break-words">{featuresError}</div>
        ) : (
          <FeatureCounts counts={featureCounts} />
        )}
      </Section>

      {nearest.length > 0 && featuresStatus === 'success' && (
        <Section code="03" title="DISTANCE TO NEAREST" subtitle="ESSENTIAL SERVICES · ≤12KM">
          <NearestTable nearest={nearest} />
        </Section>
      )}
    </div>
  );
}

function CompareView({
  wikiA,
  wikiB,
  wikiAStatus,
  wikiBStatus,
  featuresA,
  featuresB,
  featuresAStatus,
  featuresBStatus,
}: {
  wikiA: WikiArticle[];
  wikiB: WikiArticle[];
  wikiAStatus: string;
  wikiBStatus: string;
  featuresA: NearbyFeature[];
  featuresB: NearbyFeature[];
  featuresAStatus: string;
  featuresBStatus: string;
}) {
  const nearestA = useMemo(() => nearestByType(featuresA), [featuresA]);
  const nearestB = useMemo(() => nearestByType(featuresB), [featuresB]);
  const countsA = useMemo(() => summariseFeatures(featuresA), [featuresA]);
  const countsB = useMemo(() => summariseFeatures(featuresB), [featuresB]);

  return (
    <div className="space-y-5">
      <OverlayHint />

      <Section code="01" title="WIKIPEDIA INTEL" subtitle="A | B · GEOTAGGED ≤10KM">
        <div className="grid gap-3 md:grid-cols-2">
          <SubChart label="A">
            <WikiList wiki={wikiA} status={wikiAStatus} error={null} compact />
          </SubChart>
          <SubChart label="B">
            <WikiList wiki={wikiB} status={wikiBStatus} error={null} compact />
          </SubChart>
        </div>
      </Section>

      <Section code="02" title="NEARBY FEATURES" subtitle="A | B · CATEGORY COUNTS">
        <div className="grid gap-3 md:grid-cols-2">
          <SubChart label="A">
            {featuresAStatus === 'loading' || featuresAStatus === 'idle' ? (
              <LoadingSkeleton />
            ) : (
              <FeatureCounts counts={countsA} />
            )}
          </SubChart>
          <SubChart label="B">
            {featuresBStatus === 'loading' || featuresBStatus === 'idle' ? (
              <LoadingSkeleton />
            ) : (
              <FeatureCounts counts={countsB} />
            )}
          </SubChart>
        </div>
      </Section>

      <Section code="03" title="DISTANCE TO NEAREST" subtitle="A vs B · ≤12KM">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-muted uppercase tracking-widest text-left border-b border-edge">
                <th className="py-1.5 pr-2 font-normal">CATEGORY</th>
                <th className="py-1.5 pr-2 font-normal text-cyan">A · DIST</th>
                <th className="py-1.5 pr-2 font-normal text-amber">B · DIST</th>
              </tr>
            </thead>
            <tbody>
              {nearestA.map(({ label }, i) => {
                const fA = nearestA[i].feature;
                const fB = nearestB[i].feature;
                return (
                  <tr key={label} className="border-b border-edge/50">
                    <td className="py-1.5 pr-2 text-ink uppercase">{label}</td>
                    <td
                      className={`py-1.5 pr-2 text-cyan tabular-nums${fA ? ' cursor-pointer hover:bg-cyan/5' : ''}`}
                      onClick={fA ? () => window.dispatchEvent(new CustomEvent('settl-flyto', { detail: { lat: fA.lat, lon: fA.lon } })) : undefined}
                    >
                      {fA ? (
                        <span className="inline-flex items-center gap-1">
                          {`${fA.distanceKm.toFixed(2)} KM`}
                          <MapPin className="w-3 h-3 text-cyan/60" strokeWidth={1.4} />
                        </span>
                      ) : '—'}
                    </td>
                    <td
                      className={`py-1.5 pr-2 text-amber tabular-nums${fB ? ' cursor-pointer hover:bg-cyan/5' : ''}`}
                      onClick={fB ? () => window.dispatchEvent(new CustomEvent('settl-flyto', { detail: { lat: fB.lat, lon: fB.lon } })) : undefined}
                    >
                      {fB ? (
                        <span className="inline-flex items-center gap-1">
                          {`${fB.distanceKm.toFixed(2)} KM`}
                          <MapPin className="w-3 h-3 text-amber/60" strokeWidth={1.4} />
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

interface FeatureCountRow {
  category: string;
  count: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  amenity: '#66ffa3',
  industrial: '#ffb347',
  airport: '#ff4d5e',
  water: '#7eeaff',
  park: '#66ffa3',
  transit: '#a5d8ff',
};

function summariseFeatures(features: NearbyFeature[]): FeatureCountRow[] {
  const map = new Map<string, number>();
  for (const f of features) {
    if (f.category === 'other' || f.category === 'place') continue;
    map.set(f.category, (map.get(f.category) ?? 0) + 1);
  }
  const rows: FeatureCountRow[] = [];
  for (const [category, count] of map.entries()) {
    rows.push({ category, count, color: CATEGORY_COLORS[category] ?? '#6a768b' });
  }
  rows.sort((a, b) => b.count - a.count);
  return rows;
}

function FeatureCounts({ counts }: { counts: FeatureCountRow[] }) {
  if (counts.length === 0) {
    return (
      <div className="text-[9px] font-mono uppercase tracking-widest text-dim">
        NO TAGGED FEATURES IN RANGE
      </div>
    );
  }
  const max = Math.max(...counts.map((c) => c.count));
  return (
    <div className="space-y-1">
      {counts.map((row, i) => (
        <div key={`${row.category}-${i}`} className="flex items-center gap-2">
          <div className="w-16 text-[9px] font-mono uppercase tracking-widest text-muted shrink-0">
            {row.category}
          </div>
          <div className="flex-1 h-3 bg-void/50 border border-edge relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${(row.count / max) * 100}%`,
                background: row.color,
                opacity: 0.55,
              }}
            />
          </div>
          <div className="text-[10px] font-mono tabular-nums text-ink w-8 text-right">
            {row.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function OverlayHint() {
  return (
    <div className="border border-cyan/30 bg-cyan/5 px-3 py-1.5">
      <div className="text-[9px] font-mono uppercase tracking-widest text-cyan/80">
        ※ WIKI PINS + FEATURE MARKERS OVERLAID ON MAIN MAP
      </div>
    </div>
  );
}

function collectHazards(wiki: WikiArticle[]): Array<{ title: string; keyword: string }> {
  const hits: Array<{ title: string; keyword: string }> = [];
  for (const a of wiki) {
    if (!a.extract) continue;
    const lower = a.extract.toLowerCase();
    for (const kw of HAZARD_KEYWORDS) {
      if (lower.includes(kw)) {
        hits.push({ title: a.title, keyword: kw });
        break;
      }
    }
  }
  return hits;
}

function HazardBanner({ hits }: { hits: Array<{ title: string; keyword: string }> }) {
  return (
    <div className="border border-warn/40 bg-warn/5 px-3 py-2">
      <div className="text-[9px] font-mono uppercase tracking-widest text-warn flex items-center gap-2">
        <span>※ HAZARD KEYWORDS DETECTED</span>
        <span className="flex-1 h-px bg-warn/30" />
      </div>
      <div className="text-[10px] font-mono text-ink mt-1 space-y-0.5">
        {hits.map((h, i) => (
          <div key={i}>
            <span className="text-warn uppercase">[{h.keyword}]</span>{' '}
            <span className="text-muted">{h.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WikiList({
  wiki,
  status,
  error,
  compact,
}: {
  wiki: WikiArticle[];
  status: string;
  error: string | null;
  compact?: boolean;
}) {
  if (status === 'loading' || status === 'idle') return <LoadingSkeleton />;
  if (status === 'error' && error) return <div className="text-[10px] font-mono text-risk break-words">{error}</div>;
  if (wiki.length === 0) return <div className="text-[9px] font-mono uppercase tracking-widest text-dim">NO ARTICLES IN RANGE</div>;
  const limit = compact ? 5 : 8;
  return (
    <div className="grid gap-1.5">
      {wiki.slice(0, limit).map((article) => (
        <a
          key={`${article.language}-${article.pageid}`}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-edge bg-void/40 px-2 py-1.5 hover:border-cyan/60 hover:bg-cyan/5 transition-colors"
        >
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-[11px] font-mono text-ink truncate">{article.title}</div>
            <div className="text-[9px] font-mono text-cyan tabular-nums shrink-0 uppercase tracking-widest">
              {typeof article.distanceKm === 'number' ? `${article.distanceKm.toFixed(1)}KM` : '—'}
            </div>
          </div>
          {!compact && article.extract && (
            <div className="text-[10px] font-mono text-muted mt-1 line-clamp-3 leading-relaxed">
              {article.extract}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}

function NearestTable({ nearest }: { nearest: ReturnType<typeof nearestByType> }) {
  const flyTo = useCallback((lat: number, lon: number) => {
    window.dispatchEvent(new CustomEvent('settl-flyto', { detail: { lat, lon } }));
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] font-mono">
        <thead>
          <tr className="text-muted uppercase tracking-widest text-left border-b border-edge">
            <th className="py-2 pr-3 font-normal">CATEGORY</th>
            <th className="py-2 pr-3 font-normal">NAME</th>
            <th className="py-2 pr-3 font-normal text-right">DIST</th>
          </tr>
        </thead>
        <tbody>
          {nearest.map(({ label, feature }) => (
            <tr
              key={label}
              className={`border-b border-edge/50${feature ? ' cursor-pointer hover:bg-cyan/5' : ''}`}
              onClick={feature ? () => flyTo(feature.lat, feature.lon) : undefined}
            >
              <td className="py-2 pr-3 text-ink uppercase">{label}</td>
              <td className="py-2 pr-3 text-muted truncate max-w-[220px]">
                {feature ? feature.name ?? feature.subtype : '—'}
              </td>
              <td className="py-2 pr-3 text-cyan tabular-nums text-right">
                {feature ? (
                  <span className="inline-flex items-center gap-1">
                    {`${feature.distanceKm.toFixed(2)} KM`}
                    <MapPin className="w-3 h-3 text-cyan/60" strokeWidth={1.4} />
                  </span>
                ) : 'NONE'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ code, title, subtitle, children }: { code: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div>
      <SectionHeader code={code} title={title} subtitle={subtitle} />
      <div className="border border-edge bg-bg/40 p-3">{children}</div>
    </div>
  );
}

function SubChart({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border border-edge bg-bg/40">
      <div className="px-2 py-1 border-b border-edge text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5">
        <span className={`inline-block w-1.5 h-1.5 ${label === 'A' ? 'bg-cyan' : 'bg-amber'}`} />
        <span className={label === 'A' ? 'text-cyan' : 'text-amber'}>TGT · {label}</span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-edge bg-bg/40 p-6 text-center">
      <div className="text-[10px] font-mono uppercase tracking-widest text-cyan/70 mb-1">▸ AWAITING TARGET</div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted">SET COORD TO QUERY LOCAL CONTEXT</div>
    </div>
  );
}
