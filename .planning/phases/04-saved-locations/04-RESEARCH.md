# Phase 4: Saved Locations - Research

**Researched:** 2026-06-17
**Domain:** localStorage persistence, React custom hook, heart toggle UI
**Confidence:** HIGH

## Summary

Phase 4 is a localStorage-only persistence feature. No new library is required — the project already uses the localStorage pattern in two contexts (`ThemeContext`, `FontScaleContext`). The established pattern is: a custom hook wraps `localStorage` with schema versioning, returns state + mutators, and is consumed directly by components.

The only UI work is a heart toggle button (Lucide `Heart` icon, Phase 5 brings Lucide — so use a plain SVG or an inline heart for now, or hold for Phase 5 ordering) plus a saved-locations list panel rendered near the search input in `LocationIntelCard`.

The 10-item cap, schema versioning, and graceful rejection are the only non-trivial concerns. No IndexedDB, no Zustand, no context provider needed — this is intentionally thin.

**Primary recommendation:** Implement as a single `useSavedLocations` custom hook with schema-versioned localStorage key, consumed directly in `LocationIntelCard` and `App`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEAT-03 | User can save/unsave locations via heart toggle, persisted to localStorage (max 10, schema-versioned) | Custom hook pattern, localStorage, heart toggle in LocationIntelCard |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| localStorage (Web API) | — | Persist saved locations array | Already used in ThemeContext + FontScaleContext; no install needed |
| React (useState + useCallback) | 18.3.1 (in project) | Hook state + stable callbacks | Project standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React (`Heart`) | — | Heart toggle icon | Phase 5 brings Lucide; coordinate with Phase 5 or use interim SVG |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| localStorage | idb-keyval (already in package.json) | idb-keyval is async/IndexedDB — overkill for 10 records; localStorage is synchronous and sufficient |
| Custom hook | React Context provider | Context adds indirection for a single-consumer feature; hook is simpler |

**Installation:** None required. All dependencies already in project.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── hooks/
│   └── useSavedLocations.ts     # new — all persistence logic here
├── components/shell/
│   └── LocationIntelCard.tsx    # modified — heart toggle + saved list
└── types/
    └── index.ts                 # modified — add SavedLocation interface
```

### Pattern 1: Schema-Versioned localStorage Hook

**What:** Hook reads/writes a versioned JSON blob. On schema mismatch, resets to empty array rather than crashing.

**When to use:** Any time persisted data has a defined shape that may evolve.

```typescript
// src/hooks/useSavedLocations.ts
const STORAGE_KEY = 'settl-saved-locations-v1';
const MAX_ITEMS = 10;

export interface SavedLocation {
  id: string;          // `${lat.toFixed(5)},${lon.toFixed(5)}`
  label: string;       // reverse-geocoded address string
  lat: number;
  lon: number;
  savedAt: number;     // Date.now() — for stable ordering
}

function load(): SavedLocation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function save(items: SavedLocation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useSavedLocations() {
  const [locations, setLocations] = useState<SavedLocation[]>(() => load());

  const isSaved = useCallback(
    (lat: number, lon: number) => {
      const id = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      return locations.some(l => l.id === id);
    },
    [locations],
  );

  const toggle = useCallback(
    (entry: Omit<SavedLocation, 'id' | 'savedAt'>): { rejected: boolean } => {
      const id = `${entry.lat.toFixed(5)},${entry.lon.toFixed(5)}`;
      setLocations(prev => {
        const exists = prev.some(l => l.id === id);
        if (exists) {
          const next = prev.filter(l => l.id !== id);
          save(next);
          return next;
        }
        if (prev.length >= MAX_ITEMS) return prev; // cap — caller checks rejected
        const next = [...prev, { ...entry, id, savedAt: Date.now() }];
        save(next);
        return next;
      });
      // Note: return value must be computed before setLocations (see Pitfall 1)
      const alreadyAt10 = locations.length >= MAX_ITEMS &&
        !locations.some(l => l.id === id);
      return { rejected: alreadyAt10 };
    },
    [locations],
  );

  const remove = useCallback((id: string) => {
    setLocations(prev => {
      const next = prev.filter(l => l.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { locations, isSaved, toggle, remove };
}
```

### Pattern 2: Heart Toggle Button

**What:** Inline button with filled/outline Heart state.

**When to use:** Rendered inside `LocationIntelCard` next to the active location address line.

```tsx
// Interim SVG heart — swap for Lucide Heart in Phase 5
<button
  onClick={handleHeartClick}
  aria-label={saved ? 'Remove saved location' : 'Save location'}
  aria-pressed={saved}
  className="p-1 rounded text-accent transition-colors hover:text-accent-hover"
>
  {saved ? <HeartFilled size={16} /> : <HeartOutline size={16} />}
</button>
```

### Pattern 3: Saved Locations List

**What:** Vertical list of saved entries below search, each row clickable to restore coordinates.

**When to use:** Rendered conditionally when `locations.length > 0` and no active search is open.

```tsx
// In LocationIntelCard — clicking a saved item calls onChangeA({ lat, lon })
{locations.map(loc => (
  <button
    key={loc.id}
    onClick={() => onChangeA({ lat: loc.lat, lon: loc.lon })}
    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-surface-hover truncate"
  >
    {loc.label}
  </button>
))}
```

### Anti-Patterns to Avoid

- **Storing full ClimateData/module data in localStorage:** Only store coordinates + label. Module data re-fetches on coordinate load — this is correct behavior per success criteria.
- **Using idb-keyval for this feature:** Async API adds complexity; localStorage is synchronous and sufficient for 10 small records.
- **Global Context provider:** No other component tree needs saved locations state; pass from hook at App level or hook directly in LocationIntelCard.
- **Using index as the stable ID:** Use `lat.toFixed(5),lon.toFixed(5)` as the ID — survives reorder and is deterministic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema migration | Custom migration runner | Version suffix in key (`-v1`) + reset on mismatch | Simple, zero deps, proven pattern in this codebase |
| Persistence layer | Custom sync/cache | localStorage direct | Already the project pattern; idb-keyval is overkill |
| Debounced save | Throttle utility | Direct write on every state change | 10 records, each <200 bytes; write cost is negligible |

## Common Pitfalls

### Pitfall 1: Cap check races with setState closure

**What goes wrong:** `toggle` reads `locations.length` from closure, but `setLocations` callback receives the freshest `prev`. The `rejected` return value is computed from stale closure state.

**Why it happens:** React state updates are asynchronous; the closure captures the value at call time.

**How to avoid:** Compute `rejected` from the closure snapshot before calling `setLocations` — this is correct because the toggle decision is made at call time (same render cycle). Document this clearly in the hook.

**Warning signs:** Cap allows 11th item, or incorrectly rejects the 10th.

### Pitfall 2: localStorage throws in private/incognito mode

**What goes wrong:** `localStorage.setItem` throws `DOMException: QuotaExceededError` in some browsers when storage is full or when in private mode with zero quota.

**Why it happens:** Browser storage policy in private mode.

**How to avoid:** Wrap all `localStorage` reads/writes in try/catch (see `load()` and `save()` above). Fail silently — state still works for the session.

**Warning signs:** Console errors in incognito; state lost unexpectedly.

### Pitfall 3: Stale `label` if reverse geocode hasn't resolved yet

**What goes wrong:** Heart is clicked before `resolvedA` address string is available — saved entry gets an empty label.

**Why it happens:** `useReverseGeocode` is async; the address string arrives after coords are set.

**How to avoid:** Disable the heart button (or hide it) until `resolvingA === false && resolvedA !== null`. Fall back to `${lat}, ${lon}` string if label is null at save time.

**Warning signs:** Saved list shows empty or coordinate-only labels.

### Pitfall 4: ID collision on coordinate precision

**What goes wrong:** Two slightly different searches resolve to the same `toFixed(5)` ID, appearing as duplicates in the list.

**Why it happens:** `toFixed(5)` is ~1.1m precision — fine for this use case, but the duplicate guard must use the same precision consistently.

**How to avoid:** Always use `toFixed(5)` in both `isSaved` and `toggle`. Never compare raw floats.

## Code Examples

### Loading from localStorage with safe fallback

```typescript
// Source: project pattern from FontScaleContext.tsx + ThemeContext.tsx
function load(): SavedLocation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}
```

### Cap enforcement on add

```typescript
if (prev.length >= MAX_ITEMS) {
  return prev; // do not mutate, caller signals rejection
}
```

### Restoring a location (re-center map + reload modules)

```tsx
// Clicking a saved location calls the same handler as search selection:
onChangeA({ lat: loc.lat, lon: loc.lon });
// useUrlState.update() writes to URL params → all module hooks react to new coords
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IndexedDB for small data | localStorage for <50 records | Always been valid | No async complexity needed |
| Global Redux/Zustand for bookmarks | Co-located custom hook | React hooks era (2019+) | Simpler, less boilerplate |

## Open Questions

1. **Heart icon source for Phase 4**
   - What we know: Lucide React is not yet installed (Phase 5 brings it)
   - What's unclear: Should Phase 4 use an interim SVG heart, or does Phase 5 execute before Phase 4?
   - Recommendation: Per STATE.md, Phase 5 (Lucide icons) is parallel-safe with Phase 4. If phases execute in order, Phase 4 runs first — use a minimal inline SVG heart that Phase 5 will replace with `<Heart />` from Lucide. Document the swap point clearly.

2. **Where does the saved-locations list render?**
   - What we know: `LocationIntelCard` owns search + address display; it receives `onChangeA` prop
   - What's unclear: Does the list appear inside `LocationIntelCard` below search, or as a separate card?
   - Recommendation: Render inside `LocationIntelCard` — it already has access to `onChangeA` and is the natural home for location-related UI. Keeps App.tsx changes minimal.

## Environment Availability

Step 2.6: SKIPPED — no external dependencies. Feature uses only Web APIs (localStorage) and existing project stack.

## Validation Architecture

nyquist_validation not set to false in config.json — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found in project |
| Config file | None |
| Quick run command | `npm run typecheck` (TypeScript as proxy for correctness) |
| Full suite command | `npm run typecheck && npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEAT-03-A | Heart toggle saves location; persists after refresh | manual-only | — | N/A |
| FEAT-03-B | Clicking saved location re-centers map + reloads modules | manual-only | — | N/A |
| FEAT-03-C | Removing a location removes it immediately and permanently | manual-only | — | N/A |
| FEAT-03-D | 11th save is rejected gracefully with user feedback | manual-only | — | N/A |
| FEAT-03-TS | `useSavedLocations` hook types compile | unit (typecheck) | `npm run typecheck` | ❌ Wave 0 |

**Manual-only justification:** No test framework is configured. All behavioral tests require browser localStorage interaction. TypeScript compilation is the automated gate.

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run typecheck && npm run build`
- **Phase gate:** Build green + manual browser verification of all 4 success criteria

### Wave 0 Gaps

- [ ] No test framework — phase uses TypeScript compilation as the only automated check. Acceptable for this milestone scope.

## Sources

### Primary (HIGH confidence)

- Project source: `src/contexts/FontScaleContext.tsx` — localStorage pattern with try/catch, STORAGE_KEY constant, useState lazy initializer
- Project source: `src/contexts/ThemeContext.tsx` — same pattern, second data point confirming project convention
- Project source: `src/hooks/useUrlState.ts` — custom hook returning state + updater callbacks, project hook architecture
- Project source: `src/types/index.ts` — existing `Coordinates` interface reused in `SavedLocation`
- Project source: `package.json` — confirms no test runner present; `idb-keyval` already installed but not needed here

### Secondary (MEDIUM confidence)

- MDN localStorage API — try/catch requirement for QuotaExceededError is documented browser behavior

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — zero new dependencies; pattern directly present in codebase
- Architecture: HIGH — hook + localStorage pattern is identical to existing contexts
- Pitfalls: HIGH — cap/closure race and localStorage throws are well-known React patterns

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (stable APIs, no fast-moving dependencies)
