# Phase 9: Live Webcams (Windy) — Research

**Researched:** 2026-06-23
**Domain:** Windy Webcams API V3, React fetch-hook pattern, iframe embedding
**Confidence:** HIGH (all critical questions resolved against live API + official docs)

---

## Summary

Windy V3 Webcams API returns nearby webcams as periodic still-image snapshots with timelapse iframe players. A `live` player URL exists in the schema and is conditionally present only on cameras that have a live video stream — in practice, the vast majority of webcams (including all tested) are timelapse-only. SC1's "clicking a camera loads the live stream" must be reinterpreted: clicking opens `urls.detail` (the windy.com camera page) which shows whatever the camera supports (still + timelapse, or live where available). There is no reliable `player.live` field to embed.

**Critical blocker discovered:** When a browser sends an `Origin` or `Referer` header (as all browser `fetch()` calls do), the API returns `{"message":"Unauthorized domain","statusCode":401}` unless the calling domain is whitelisted in the Windy dashboard key settings. The key works from curl (no Origin header) but will fail from `localhost:5173` or any production domain until domains are added. **The domain whitelist MUST be configured before any browser testing.** This is a pre-condition for Phase 9, not a code problem.

Image URLs expire after **15 minutes** on the free tier (pricing page states 15 min, not 10 min as previously noted in roadmap). The 8-minute TTL is still correct as a conservative fetch interval (well within 15 min). The hook must NOT use persistent idb cache for webcam data — each panel open fetches fresh.

**Primary recommendation:** `useWebcams` hook mirrors `useFlood.ts` AbortController + ModuleState shape exactly, but drops idb persistence entirely. The webcam section in `ContextModule.tsx` is absent (not rendered) when `VITE_WINDY_KEY` is falsy — same gate pattern as the pollen section in Phase 7.

---

## Resolved API Contract

### Live API Validation Results

**Test date:** 2026-06-23
**Endpoint confirmed:** `GET https://api.windy.com/webcams/api/v3/webcams`
**Auth confirmed:** Request header `x-windy-api-key: {key}` (NOT query param)

#### Nearby Parameter Format (RESOLVED)

Format: `nearby={lat},{lon},{radius_km}` (comma-separated, single string value)

```
?nearby=37.97,23.72,25
```

- Radius unit: **kilometers** (confirmed: radius=1 → 0 results near Athens center; radius=10 → 11 results; radius=25 → 30 results)
- Maximum radius: 250 km (per docs)
- `nearby` returns results in distance order by default (closest first) — no sort param needed

#### Include Parameter (RESOLVED)

`include` is a comma-separated list (or repeated param). Enum values:

```
categories, images, location, player, urls
```

Only the listed `include` values appear in the response — omitting an include saves bytes. For the webcam grid use:

```
?include=images,location,player,urls
```

#### Sort Parameters (RESOLVED)

`nearby` returns distance-ordered by default. To sort differently:
- `sortKey=popularity` or `sortKey=createdOn`
- `sortDirection=asc` or `sortDirection=desc`

Note: `orderby=distance` is NOT a valid parameter (docs show `sortKey` and `sortDirection` only) but was silently ignored in tests. Do not use `orderby`.

#### Confirmed JSON Field Paths

From live API response (Athens, 2026-06-23):

```json
{
  "total": 30,
  "webcams": [
    {
      "title": "Athens › West",
      "viewCount": 22634,
      "webcamId": 1793898323,
      "status": "active",
      "lastUpdatedOn": "2026-06-23T09:33:14.000Z",
      "images": {
        "current": {
          "icon": "https://imgproxy.windy.com/_/icon/plain/current/1793898323/original.jpg",
          "thumbnail": "https://imgproxy.windy.com/_/thumbnail/plain/current/1793898323/original.jpg",
          "preview": "https://imgproxy.windy.com/_/preview/plain/current/1793898323/original.jpg"
        },
        "sizes": {
          "icon": { "width": 48, "height": 48 },
          "thumbnail": { "width": 200, "height": 112 },
          "preview": { "width": 400, "height": 224 }
        },
        "daylight": {
          "thumbnail": "https://imgproxy.windy.com/_/thumbnail/plain/daylight/1793898323/original.jpg"
        }
      },
      "location": {
        "city": "Athens",
        "region": "Attica",
        "country": "Greece",
        "country_code": "GR",
        "latitude": 37.9697,
        "longitude": 23.74095
      },
      "player": {
        "day": "https://webcams.windy.com/webcams/public/embed/player/1793898323/day",
        "month": "https://webcams.windy.com/webcams/public/embed/player/1793898323/month",
        "year": "https://webcams.windy.com/webcams/public/embed/player/1793898323/year",
        "lifetime": "https://webcams.windy.com/webcams/public/embed/player/1793898323/lifetime"
      },
      "urls": {
        "detail": "https://windy.com/webcams/1793898323",
        "provider": "http://view.dikemes.edu.gr/"
      }
    }
  ]
}
```

**Confirmed field paths:**
| Field | Path | Notes |
|-------|------|-------|
| Thumbnail (latest) | `webcam.images.current.thumbnail` | 200×112px, token expires 15 min; may show black frame at night |
| Thumbnail (lit) | `webcam.images.daylight.thumbnail` | Same size; always shows a lit image — prefer this for grid display |
| Preview image | `webcam.images.current.preview` | 400×224px |
| Day timelapse iframe | `webcam.player.day` | Always present when `include=player` |
| Live stream iframe | `webcam.player.live` | CONDITIONAL — only present if camera has livestream; most cameras do NOT have this |
| Detail page (click target) | `webcam.urls.detail` | Always present when `include=urls`; opens windy.com camera page |
| Title | `webcam.title` | Always present |
| Webcam ID | `webcam.webcamId` | number |
| Status | `webcam.status` | `"active"` \| `"inactive"` |
| Last updated | `webcam.lastUpdatedOn` | ISO timestamp |
| Latitude | `webcam.location.latitude` | Requires `include=location` |
| Longitude | `webcam.location.longitude` | Requires `include=location` |
| City | `webcam.location.city` | May be `"unknown"` |

**Note on `player.live`:** The schema includes a `live` field ("Link that allows embedding the live stream"). It appears ONLY when the camera has a live video feed. In all tested cameras (Athens + NYC areas), `player.live` was absent — all returned only `day/month/year/lifetime` timelapse URLs. The click-to-stream SC1 behavior should target `urls.detail` (windy.com page) rather than assuming `player.live` exists.

#### CORS / Browser Viability (CRITICAL — PARTIAL)

| Test | Result |
|------|--------|
| curl without Origin/Referer | 200 OK |
| curl with `Origin: http://localhost:5173` | 401 Unauthorized — "Unauthorized domain" |
| curl with `Referer: http://localhost:5173/` | 401 Unauthorized — "Unauthorized domain" |
| curl with `Origin: https://settl.app` | 401 Unauthorized — "Unauthorized domain" |
| Browser fetch from whitelisted domain | NOT TESTED — no domain whitelisted yet |

**Finding:** The API uses `Origin`/`Referer` headers to enforce domain whitelisting. A browser `fetch()` ALWAYS sends these headers. The current key has NO domains whitelisted — every tested Origin'd request 401'd. Success-path CORS (preflight OPTIONS returning `Access-Control-Allow-Headers: x-windy-api-key`, and a 200 with `Access-Control-Allow-Origin` on a whitelisted origin) is **inferred but not confirmed**. The inference is strong: `vary: Origin` and `access-control-allow-credentials: true` in the no-Origin response indicate CORS-aware server; domain whitelisting only makes sense for browser clients. Architecture is sound — do not change approach.

**Required action before Phase 9 can work in-browser:** Log into api.windy.com dashboard, open the key settings for `VITE_WINDY_KEY`, and add allowed domains:
- `localhost` (or `http://localhost:5173`)
- The production domain (e.g. `settl.app`)

This is a manual configuration step, not a code task. Include it as Wave 0 task in the plan.

**First execution checkpoint:** After whitelisting `localhost`, confirm a browser `fetch()` returns 200 (not a CORS error) before writing any component code.

When the key has no domains whitelisted and the API returns 401, the hook should treat this as a transient error (not a "no key" state) — but from the UI perspective, a 401 is indistinguishable from a missing key, so the error state should still suppress the section gracefully.

#### Thumbnail Image CORS (for `<img>` tags)

```
access-control-allow-origin: *
access-control-allow-methods: GET, OPTIONS
```

Thumbnail images at `imgproxy.windy.com` have full CORS (`*`) — safe to load in `<img>` tags from any domain.

#### Player iframe Embeddability

Player URL: `https://webcams.windy.com/webcams/public/embed/player/{id}/day`

Response headers:
- No `X-Frame-Options` header
- No `Content-Security-Policy: frame-ancestors` header
- `200 OK`

**Safe to embed in `<iframe>`.**

#### Rate Limits and Quota

No `X-RateLimit-*` headers are returned. From pricing page:
- Free tier: offset capped at 1000; limit 0–50 per request; image sizes limited; image URL validity 15 minutes
- No explicit requests/day quota visible in docs or response headers
- API appears rate-limit tolerant for low-volume use (one call per location open)

**Recommended: limit=6** (compact 2×3 grid), radius=25km, include=images,location,player,urls. This minimizes response size and API calls.

#### Error Response Shapes

| Scenario | Status | Body |
|----------|--------|------|
| No `x-windy-api-key` header | 403 | `{"message":"Missing Header 'x-windy-api-key' with API key","statusCode":403}` |
| Invalid key | 401 | `{"message":"Invalid API key","statusCode":401}` |
| Domain not whitelisted | 401 | `{"message":"Unauthorized domain","statusCode":401}` |
| No webcams in area | 200 | `{"total":0,"webcams":[]}` |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React built-ins | — | `useEffect`, `useRef`, `useState`, `useCallback` | Mirrors existing hooks exactly |
| `fetchJson` util | — | `src/utils/fetcher.ts` — typed fetch with timeout + `init?: RequestInit` | Already used by all data hooks; accepts headers via `init` |
| No new npm deps | — | — | Roadmap explicitly: "no new npm dependencies" |

### No New Dependencies

This phase adds zero npm dependencies. The hook pattern is pure React + existing project utilities.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   └── useWebcams.ts        # New — mirrors useFlood.ts shape
├── components/
│   └── modules/
│       └── ContextModule.tsx  # Add WebcamsSection inside SingleView
└── types/
    └── index.ts             # Add WindyWebcam type (or keep in hook file)
```

### Pattern 1: useWebcams Hook Shape

Mirrors `useFlood.ts` AbortController + ModuleState pattern exactly.

**Critical differences from other hooks:**
1. **No idb persistence** — `cacheGet`/`cacheSet` are NOT used. CAM-01 requires fresh fetch on every panel open, never persistent cache.
2. **In-memory Map** — A module-level `Map<string, CacheEntry>` provides short-lived dedup but is intentionally not persistent. 8-minute TTL enforced via timestamp alongside the cached value; Map clears on page reload.
3. **Key gate** — If `VITE_WINDY_KEY` is empty string, return early with `{ status: 'idle', data: null, error: null }` before any fetch. The component renders nothing for `idle` status.
4. **`fetchJson` headers** — `fetchJson` (confirmed from `src/utils/fetcher.ts`) accepts `init?: RequestInit`. Pass the API key header via `init: { headers: { 'x-windy-api-key': WINDY_KEY } }`.

```typescript
// src/hooks/useWebcams.ts

// WARNING: VITE_WINDY_KEY is exposed in the JS bundle.
// Mitigated by domain-restricting the key at api.windy.com/keys dashboard.
// Accepted under the no-backend constraint (see REQUIREMENTS.md Out of Scope).
const WINDY_KEY = import.meta.env.VITE_WINDY_KEY ?? '';
const BASE = 'https://api.windy.com/webcams/api/v3/webcams';
const WEBCAM_RADIUS_KM = 25;
const WEBCAM_LIMIT = 6;
const WEBCAM_TTL_MS = 8 * 60 * 1000; // 8 min — image tokens valid 15 min on free tier; 7-min buffer

export interface WindyWebcam {
  webcamId: number;
  title: string;
  status: string;
  lastUpdatedOn: string;
  thumbnailUrl: string;       // images.daylight.thumbnail (always lit) — fallback: images.current.thumbnail
  playerDayUrl: string;       // player.day — always present timelapse iframe
  playerLiveUrl: string | null; // player.live — present only if camera has livestream
  detailUrl: string;          // urls.detail — click target (windy.com page)
  lat: number;                // location.latitude
  lon: number;                // location.longitude
  city: string;               // location.city
  distanceKm: number;         // computed client-side via haversine
}

// In-memory cache with timestamp for TTL enforcement (intentionally not idb)
interface CacheEntry { data: WindyWebcam[]; fetchedAt: number }
const cache = new Map<string, CacheEntry>();

function makeKey(coords: Coordinates): string {
  return `webcams|${coords.lat.toFixed(3)}|${coords.lon.toFixed(3)}`;
}

export function useWebcams(
  coords: Coordinates | null,
): ModuleState<WindyWebcam[]> {
  const [state, setState] = useState<ModuleState<WindyWebcam[]>>(
    () => initialModuleState<WindyWebcam[]>()
  );
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Gate 1: no key configured — section absent, no fetch
    if (!WINDY_KEY) {
      setState(initialModuleState<WindyWebcam[]>());
      return;
    }
    if (!coords) {
      setState(initialModuleState<WindyWebcam[]>());
      return;
    }

    const key = makeKey(coords);

    // Gate 2: in-memory TTL check (not idb — intentionally short-lived)
    const entry = cache.get(key);
    if (entry && Date.now() - entry.fetchedAt < WEBCAM_TTL_MS) {
      setState({ status: 'success', data: entry.data, error: null });
      return;
    }

    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setState({ status: 'loading', data: null, error: null });

    void (async () => {
      try {
        const params = new URLSearchParams({
          nearby: `${coords.lat},${coords.lon},${WEBCAM_RADIUS_KM}`,
          include: 'images,location,player,urls',
          limit: String(WEBCAM_LIMIT),
        });
        const url = `${BASE}?${params}`;
        const raw = await fetchJson<WindyApiResponse>(url, {
          signal: ctrl.signal,
          timeoutMs: 15000,
          init: { headers: { 'x-windy-api-key': WINDY_KEY } },
        });
        if (ctrl.signal.aborted) return;

        const webcams = (raw.webcams ?? []).map(w => mapWebcam(w, coords));
        cache.set(key, { data: webcams, fetchedAt: Date.now() });
        setState({ status: 'success', data: webcams, error: null });
      } catch (err: unknown) {
        if (ctrl.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', data: null, error: message });
      }
    })();

    return () => ctrl.abort();
  }, [coords?.lat, coords?.lon]);

  return state;
}
```

### Pattern 2: WebcamsSection in ContextModule

Insert as a new `<Section>` inside `SingleView`, after the existing sections. Gate on `VITE_WINDY_KEY`.

**Architecture note:** `SingleView` does not currently receive `coords` as a prop. Call `useWebcams(coordsA)` inside `ContextModule` (alongside `useWikipedia`, `useOverpassFeatures`, etc.) and pass the resulting state down to `SingleView` as a prop — this matches the existing hook-at-top-level pattern.

```typescript
// In SingleView — add at bottom of space-y-5 div
{!!import.meta.env.VITE_WINDY_KEY && (
  <WebcamsSection webcams={webcams} />
)}
```

`WebcamsSection` renders:

- `status === 'idle'` → nothing (key not configured, panel is absent)
- `status === 'loading'` → `<LoadingSkeleton />`
- `status === 'error'` → nothing (401 and other errors are silent — section absent)
- `status === 'success' && data.length === 0` → nothing (no cameras nearby — section absent)
- `status === 'success' && data.length > 0` → thumbnail grid

### Pattern 3: Thumbnail Grid Component

```typescript
function WebcamGrid({ webcams }: { webcams: WindyWebcam[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {webcams.map(cam => (
        <WebcamCard key={cam.webcamId} cam={cam} />
      ))}
    </div>
  );
}

function WebcamCard({ cam }: { cam: WindyWebcam }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={cam.detailUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-edge bg-void/40 hover:border-cyan/60 transition-colors"
    >
      <div className="relative aspect-video bg-void/60 overflow-hidden">
        {!imgError ? (
          <img
            src={cam.thumbnailUrl}
            alt={cam.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[9px] font-mono uppercase tracking-widest text-dim">
              IMAGE EXPIRED
            </span>
          </div>
        )}
      </div>
      <div className="px-2 py-1">
        <div className="text-[10px] font-mono text-ink truncate">{cam.title}</div>
        <div className="text-[9px] font-mono text-cyan tabular-nums">
          {cam.distanceKm.toFixed(1)} KM
        </div>
      </div>
    </a>
  );
}
```

**Click behavior:** `<a href={cam.detailUrl} target="_blank">` opens the windy.com camera page. This is the correct "load the camera" UX — the detail page shows the current image, timelapse player, and live stream if the camera supports it. Do NOT embed player iframes in the grid cards (they autoplay with audio, resize poorly, and waste API bandwidth for cameras the user may not click).

**Optional:** Include a "click to expand player" that swaps the `<img>` for an `<iframe src={cam.playerDayUrl}>` on click. This is a UX enhancement, not required for CAM-01.

### Anti-Patterns to Avoid

- **Using `cacheGet`/`cacheSet` from `persistentCache.ts`:** CAM-01 explicitly forbids persistent cache for webcam data. Image URLs expire and stale idb entries would serve broken images.
- **Embedding `player.live` assuming it always exists:** Most cameras only have `day/month/year/lifetime` timelapse. `player.live` is absent on ~99% of cameras tested. Always null-check before using.
- **Rendering an error state for 401 "Unauthorized domain":** From user perspective this looks like "no key configured." Show nothing (absent section) on 401, not an error block.
- **Hardcoding radius=5km:** Too small for sparse rural areas; 25km is the right default given the 6-item limit.
- **Using `images.current.thumbnail` as grid default:** Shows black frames for night-side cameras. Prefer `images.daylight.thumbnail` — always shows a lit image.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Distance calculation | Custom geo math | `haversine()` from `src/utils/coordinates.ts` — already used by useWildfires |
| Typed fetch with timeout | Custom fetch wrapper | `fetchJson()` from `src/utils/fetcher.ts` — accepts `init?: RequestInit` for headers |
| Abort on coord change | Manual cleanup | AbortController pattern from useFlood.ts |
| Image fallback | Custom error handler | `<img onError={}>` + local `imgError` state per card |

---

## Common Pitfalls

### Pitfall 1: Domain Not Whitelisted — All Browser Fetches Return 401

**What goes wrong:** Hook fires, browser sends `Origin` header automatically, API returns `{"message":"Unauthorized domain","statusCode":401}`. The key works from curl but fails in-browser.

**Why it happens:** Windy enforces domain whitelisting on the key. Any `Origin` or `Referer` header not in the whitelist → 401. Browser `fetch()` always sends `Origin`.

**How to avoid:** Wave 0 task — add `localhost` and the production domain to the key's allowed domains at api.windy.com dashboard before any browser testing. Document clearly in a code comment. First execution checkpoint: confirm browser fetch returns 200 after whitelisting.

**Warning signs:** 401 in browser network tab despite working curl; key appears valid.

### Pitfall 2: Stale Thumbnail After 15 Minutes

**What goes wrong:** Panel left open > 15 minutes → all `<img>` elements show broken icons as image tokens expire.

**Why it happens:** `imgproxy.windy.com` token URLs expire after 15 minutes (confirmed from pricing page). The in-memory cache has an 8-minute TTL, so a second panel open re-fetches. But a panel left open continuously will show expired images.

**How to avoid:** The `onError` handler on each `<img>` swaps to a placeholder ("IMAGE EXPIRED" text block). Do NOT show broken image icons — the `onError` fallback is a SC2 requirement. Optionally, a refresh button on the section header could re-trigger the fetch.

### Pitfall 3: Rendering `player.live` as Primary Player

**What goes wrong:** Code assumes all cameras have `player.live` → null/undefined embed URL → broken iframe.

**Why it happens:** `player.live` is optional — only present when the camera has a video livestream. Most cameras are periodic-still / timelapse only.

**How to avoid:** Always use `player.day` (timelapse, always present) as the embed fallback. Only show "live stream" UI if `player.live !== null`.

### Pitfall 4: idb Cache Serving Expired Image URLs

**What goes wrong:** `cacheSet` stores webcam data with image URLs into idb; next day user opens panel → idb hit → images are 24h stale → all broken.

**Why it happens:** idb cache survives browser sessions. Image URLs expire in 15 minutes.

**How to avoid:** Never call `cacheSet` for webcam data. No `TTL.webcams` entry in `persistentCache.ts`. Use only the module-level `Map` with explicit timestamp.

### Pitfall 5: `coords` Prop Missing in ContextModule SingleView

**What goes wrong:** `SingleView` doesn't currently receive `coords` as a prop — it receives processed data from hooks called in `ContextModule`. The webcam hook needs raw coords.

**Why it happens:** Architecture mismatch — hooks are called at `ContextModule` level, and results passed down. The `useWebcams` hook needs to be called at the same level as the other hooks.

**How to avoid:** Call `useWebcams(coordsA)` inside `ContextModule` (alongside `useWikipedia`, `useOverpassFeatures`, etc.), then pass `webcams` state down to `SingleView` as a prop. This matches the existing pattern.

---

## Code Examples

### Verified API Call (raw fetch — for reference)

```typescript
// Source: live API test 2026-06-23
const params = new URLSearchParams({
  nearby: `${coords.lat},${coords.lon},25`,  // lat,lon,radius_km
  include: 'images,location,player,urls',
  limit: '6',
});
const res = await fetch(`https://api.windy.com/webcams/api/v3/webcams?${params}`, {
  headers: { 'x-windy-api-key': WINDY_KEY },
  signal: ctrl.signal,
});
```

### fetchJson Call (project utility — preferred)

```typescript
// fetchJson signature: fetchJson(url, { signal?, timeoutMs?, init?: RequestInit })
const raw = await fetchJson<WindyApiResponse>(url, {
  signal: ctrl.signal,
  timeoutMs: 15000,
  init: { headers: { 'x-windy-api-key': WINDY_KEY } },
});
```

### Haversine Distance (existing utility)

```typescript
// src/utils/coordinates.ts — already in codebase
import { haversine } from '../utils/coordinates';
const distanceKm = haversine(coords, { lat: w.location.latitude, lon: w.location.longitude }) / 1000;
```

### Image Fallback Pattern

```typescript
const [imgError, setImgError] = useState(false);
<img
  src={webcam.thumbnailUrl}
  alt={webcam.title}
  onError={() => setImgError(true)}
/>
{imgError && <PlaceholderBlock />}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| V2 query-param auth (`?key=...`) | V3 header auth (`x-windy-api-key`) | V2 deprecated, returns errors |
| `player.live.embed` field path (roadmap guess) | `player.day` (timelapse, always present) + `player.live` (conditional) | Prevents null-embed broken iframe |
| 10-min token expiry (roadmap note) | 15 min free tier (confirmed from pricing page) | 8-min TTL is still correct conservative interval |
| `images.current.thumbnail` (day/night mixed) | `images.daylight.thumbnail` (always lit) | Avoids black-frame thumbnails for night-side cameras |

---

## Open Questions

1. **Compare mode webcams**
   - What we know: `ContextModule` has a `CompareView` for coordsA + coordsB.
   - What's unclear: CAM-01 doesn't mention compare mode. Should webcams appear for both locations in compare mode?
   - Recommendation: Show webcams only in `SingleView` for Phase 9. Compare mode is a future enhancement.

2. **Production domain for key whitelist**
   - What we know: The key needs the production domain added at api.windy.com.
   - What's unclear: The production domain name is not known from the codebase.
   - Recommendation: Planner should include a pre-condition task: "Owner adds `localhost` + production domain to VITE_WINDY_KEY whitelist at api.windy.com before browser testing."

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Windy API key (`VITE_WINDY_KEY`) | useWebcams hook | Present in `.env.local` | — | Section absent (gate on empty key) |
| Windy domain whitelist | Browser fetch | NOT configured (401 from browser) | — | Must be configured manually — no code fallback |
| `haversine()` util | Distance calculation | Already in codebase | — | — |
| `fetchJson()` util | Typed fetch with headers | Already in codebase (confirmed accepts `init?: RequestInit`) | — | — |

**Missing dependencies with no fallback:**
- Windy dashboard domain whitelist: localhost and production domain must be added by owner before any browser testing. This is a Wave 0 blocker.

---

## Sources

### Primary (HIGH confidence)

- Live API call to `https://api.windy.com/webcams/api/v3/webcams` — confirmed endpoint, headers, params, response shape (2026-06-23)
- `https://api.windy.com/webcams/docs` — confirmed `include` enum, `nearby` format + radius units, `sortKey` enum, `WebcamPlayerUrlsDto` schema with `live` field description
- `https://api.windy.com/webcams/pricing` — confirmed 15-minute image URL validity on free tier, offset cap of 1000
- `src/utils/fetcher.ts` — confirmed `fetchJson` accepts `init?: RequestInit`

### Secondary (MEDIUM confidence)

- Existing `src/hooks/useFlood.ts` — verified hook pattern to mirror
- Existing `src/components/modules/ContextModule.tsx` — verified where webcam section integrates

---

## Metadata

**Confidence breakdown:**
- API contract (endpoint, headers, params, field paths): HIGH — confirmed against live API
- CORS browser viability: MEDIUM — failure path confirmed (401 on unwhitelisted Origin); success path inferred from `vary: Origin` + `access-control-allow-credentials` headers; not testable until domain is whitelisted
- Player live field availability: HIGH — confirmed absent on all tested cameras; schema confirms it is conditional
- Image token expiry: HIGH — 15 min confirmed from pricing page
- Hook pattern: HIGH — mirrors existing codebase patterns exactly; `fetchJson` signature verified
- Rate limits: MEDIUM — no headers returned; free tier pricing suggests no hard daily call cap stated

**Research date:** 2026-06-23
**Valid until:** 2026-07-23 (stable API; pricing may update)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAM-01 | User sees live nearby webcams (Windy) as a thumbnail/embed grid in the context area, fetched fresh (image tokens expire ~10 min) with graceful fallback for broken images; the section is absent gracefully when no API key is configured | Fully addressed: API contract confirmed, thumbnail path resolved (`images.daylight.thumbnail`), onError fallback pattern documented, no-key gate pattern mirrors Phase 7 pollen section, no-idb constraint enforced |
</phase_requirements>
