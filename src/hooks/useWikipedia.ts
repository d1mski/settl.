import type { Coordinates, ModuleState, WikiArticle } from '../types';
import { fetchJson } from '../utils/fetcher';
import { haversine } from '../utils/coordinates';
import { TTL } from '../utils/persistentCache';
import { useCachedResource } from './useCachedResource';

interface GeoSearchResponse {
  query: {
    geosearch: Array<{
      pageid: number;
      title: string;
      lat: number;
      lon: number;
      dist: number;
    }>;
  };
}

interface ExtractsResponse {
  query: {
    pages: Record<
      string,
      { pageid: number; title: string; extract?: string }
    >;
  };
}

function makeKey(coords: Coordinates, countryCode: string | null): string {
  return `${coords.lat.toFixed(3)}|${coords.lon.toFixed(3)}|${countryCode ?? '-'}`;
}

async function geosearch(
  lang: string,
  coords: Coordinates,
  signal: AbortSignal,
): Promise<WikiArticle[]> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&list=geosearch` +
    `&gscoord=${coords.lat}|${coords.lon}&gsradius=10000&gslimit=10&format=json&origin=*`;
  const res = await fetchJson<GeoSearchResponse>(url, { signal, timeoutMs: 15000 });
  return res.query.geosearch.map((row) => ({
    pageid: row.pageid,
    title: row.title,
    lat: row.lat,
    lon: row.lon,
    distanceKm: haversine(coords, { lat: row.lat, lon: row.lon }) / 1000,
    language: lang,
    url: `https://${lang}.wikipedia.org/?curid=${row.pageid}`,
  }));
}

async function fetchExtracts(
  lang: string,
  articles: WikiArticle[],
  signal: AbortSignal,
): Promise<void> {
  if (articles.length === 0) return;
  const ids = articles.map((a) => a.pageid).join('|');
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&pageids=${ids}` +
    `&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
  const res = await fetchJson<ExtractsResponse>(url, { signal, timeoutMs: 15000 });
  for (const a of articles) {
    const page = res.query.pages[a.pageid.toString()];
    if (page?.extract) a.extract = page.extract.slice(0, 400);
  }
}

async function fetchBoth(
  coords: Coordinates,
  _countryCode: string | null,
  signal: AbortSignal,
): Promise<WikiArticle[]> {
  // English only — local lang produced duplicate entries in different scripts
  const langs = ['en'];

  const byLang = await Promise.all(
    langs.map(async (lang) => {
      const articles = await geosearch(lang, coords, signal);
      await fetchExtracts(lang, articles, signal);
      return articles;
    }),
  );

  const merged: WikiArticle[] = [];
  const seen = new Set<string>();
  for (const list of byLang) {
    for (const article of list) {
      const key = `${article.language}|${article.pageid}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(article);
    }
  }
  merged.sort((a, b) => a.distanceKm - b.distanceKm);
  return merged;
}

export function useWikipedia(
  coords: Coordinates | null,
  countryCode: string | null,
): ModuleState<WikiArticle[]> {
  return useCachedResource(
    coords && makeKey(coords, countryCode),
    (signal) => fetchBoth(coords!, countryCode, signal),
    TTL.wikipedia,
  );
}
