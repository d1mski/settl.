# Architecture Patterns — settl. Reskin + UX Overhaul

**Domain:** React/Leaflet location intelligence app — milestone integration
**Researched:** 2026-06-17
**Confidence:** HIGH (direct codebase analysis, no speculation)

---

## Existing Layout Model (ground truth)

```
App.tsx
  ErrorBoundary
    div.h-screen.flex-col          ← root
      div.flex-1.relative.flex     ← main row
        div.flex-1.relative        ← map area (position:relative, all overlays absolute inside)
          MapCanvas                ← Leaflet, fills 100%
          MapHud                   ← absolute inset-0, pointer-events-none, decorative only
          div.absolute.left-6      ← LEFT COLUMN: w-[360px], top-6 bottom-14, z-30
            LocationIntelCard      ← search input, compare toggle, theme toggle
            BuildingCard(s)        ← building footprint data
            RiskPanel              ← bottom of left column (justify-between)
          ModuleSheet              ← absolute, right-[32px], full height, w-[min(680px,…)], z-20
        ModuleRail                 ← flex sibling to map area, w-[72px], h-full, right edge
      BottomStrip                  ← fixed footer strip
```

Key constraint: everything sits inside `div.flex-1.relative` (the map area). ModuleSheet and the left column are absolute overlays over MapCanvas. ModuleRail is a flex sibling, not an overlay.

---

## Integration Points for Each New Feature

### 1. ReportPanel (Overview mode)

**Where it lives:** Replaces ModuleSheet content, not ModuleSheet itself. ModuleSheet stays as the container/shell. A new `viewMode: 'overview' | 'advanced'` state (in App.tsx, alongside `sheetOpen`) controls which content renders inside ModuleSheet's scrollable body.

**How it mounts:**
- `active === null` + `sheetOpen === false` = nothing shown (current behavior)
- Overview mode: ModuleSheet opens to a new `<ReportPanel>` lazy component instead of a module
- Advanced mode: existing per-module components, same as today

**Placement:** `src/components/shell/ReportPanel.tsx` — lazy-loaded like the module components, rendered conditionally inside ModuleSheet's Suspense block.

**State change in App.tsx:**
```typescript
const [viewMode, setViewMode] = useState<'overview' | 'advanced'>('overview');
// viewMode lives in App, passed down to ModuleSheet + ModuleRail
```

**Do not** add a `viewMode` param to `useUrlState` — URL state only needs to persist coords/tab/slot. viewMode resets to 'overview' on page load (intentional default per PROJECT.md).

---

### 2. Overview / Advanced Toggle

**State management:** `viewMode` useState in App.tsx. Single source of truth. Pass as prop to ModuleRail (to render the toggle UI) and ModuleSheet (to switch content).

**Which components mount/unmount:** Both overview and advanced content are inside ModuleSheet. On toggle:
- `viewMode === 'overview'`: mount ReportPanel, unmount per-module components
- `viewMode === 'advanced'`: mount per-module components (existing behavior), unmount ReportPanel

Use AnimatePresence + motion.div keyed on viewMode inside ModuleSheet's body div. No separate mount/unmount of ModuleSheet itself.

**Toggle UI location:** Top of ModuleRail (replaces the current `MOD` header text), or as a header control inside ModuleSheet's `<header>`. ModuleRail header is the cleaner spot — it's always visible and doesn't crowd the module header.

---

### 3. Font Scale Context

**Implementation:** React context + CSS custom property. This is the correct pattern given the existing `--c-*` CSS variable system in index.css.

**New context:** `src/contexts/FontScaleContext.tsx`
```typescript
type FontScale = 'sm' | 'md' | 'lg';
const FontScaleContext = createContext<{ scale: FontScale; setScale: ... }>(...)
```

**CSS variable approach:**
```css
:root { --font-scale: 1; }
.font-scale-sm { --font-scale: 0.875; }
.font-scale-lg { --font-scale: 1.125; }
```

Apply the class to `<html>` (same pattern as `theme-light`). Components that need scaling use `calc(var(--font-scale) * Npx)` or Tailwind's `text-[calc(var(--font-scale)*11px)]`.

**Persist:** `localStorage.getItem('settl-font-scale')` — read on context init, write on change. No URL param needed.

**Provider placement:** Wrap `<App>` in `main.tsx`, same level as any future providers.

---

### 4. ModuleRail Refactor (Lucide icons)

**Current:** Custom inline SVG elements in a `ICONS` record. No external icon dependency.

**Target:** Replace inline SVGs with Lucide React components. ModuleRail.tsx is self-contained — this is a pure internal refactor.

**Changes:**
- `import { Sun, Wind, Thermometer, AlertTriangle, Wind as AirIcon, Globe } from 'lucide-react'` (or appropriate icons)
- Replace `ICONS[id]` JSX with `<LucideIcon size={20} strokeWidth={1.4} />`
- Add a new `'overview'` entry to the rail if the overview toggle lives there

**No prop interface changes.** The `onSelect(tab: TabId)` signature stays. If the overview toggle is added to the rail, add an `onToggleView` prop.

**Note:** `TabId` lives in `src/types/index.ts`. Adding an `'overview'` tab would require adding it to `TAB_ORDER` and all `Record<TabId, ...>` objects — this would be a blast radius of ~8 files. Cleaner to keep the toggle separate from `TabId` and handle it as a distinct UI affordance in ModuleRail.

---

### 5. Floating Left Panels

**Current left column:** `div.absolute.top-6.bottom-14.left-6.z-30.w-[360px]` in App.tsx. Contains LocationIntelCard, BuildingCard(s), RiskPanel stacked vertically.

**Target:** 320px wide floating panels (per PROJECT.md key decisions: "320px floating left"). This is a width change plus likely panel-by-panel show/hide rather than always-visible stack.

**Integration approach:** The existing absolute div container stays. Width changes from `w-[360px]` to `w-[320px]`. Individual panels (LocationIntelCard, BuildingCard, RiskPanel) gain their own show/hide toggle affordances — either chevron collapse or icon in ModuleRail.

**No MapCanvas changes needed.** MapCanvas is behind the overlay at z-index 0; it does not need to know about panel widths. Leaflet map does not resize based on panel width since panels are CSS overlays, not flex siblings.

---

### 6. OS Theme Detection

**Current:** `baseMap` state in App.tsx drives a `theme-light` class on `<html>`. Manual toggle only.

**Target:** Detect OS preference on first load; allow manual override; persist override to localStorage.

**Integration:** Keep `baseMap` state in App.tsx. Add initialization logic:
```typescript
const [baseMap, setBaseMap] = useState<BaseMap>(() => {
  const saved = localStorage.getItem('settl-theme') as BaseMap | null;
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
});
```
On change, also call `localStorage.setItem('settl-theme', baseMap)`.

The existing `useEffect` that applies/removes `theme-light` on `<html>` is unchanged. Zero component refactoring required.

---

### 7. Browser Geolocation

**Where it integrates:** LocationIntelCard.tsx — add a geolocation button next to the EXEC button.

**Hook:** `src/hooks/useGeolocation.ts` — wraps `navigator.geolocation.getCurrentPosition`, returns `{ locate, loading, error }`. Does not auto-fire on mount; user-triggered only (privacy).

**Data flow:** On success, calls `setCurrent({ lat, lon })` via the existing `onChangeA`/`onChangeB` prop already wired in LocationIntelCard. No App.tsx changes needed.

**No useUrlState changes.** The resulting coords flow through the existing coord-setting path.

---

### 8. Search Autocomplete

**Current state:** LocationIntelCard already has partial autocomplete — `suggestions: GeocodeResult[]` state, renders a dropdown list on multi-result Nominatim response. This is not debounced; it fires on EXEC button press only.

**Target:** Live autocomplete as user types (debounced).

**Integration:** Add `useEffect` with debounce in LocationIntelCard watching `raw` input value. Call `forwardGeocode` (already imported from `useNominatim`) after 300ms pause. No new hook needed — `forwardGeocode` is already an imperative async function.

**Abort controller:** Already present (`abortRef`). Reuse it.

**No useUrlState changes.** Suggestions are ephemeral UI state.

---

### 9. localStorage Save

Covers: theme preference, font scale, last-searched coords (optional).

**Pattern:** Each concern owns its own localStorage key. No central storage manager needed at this scale.

| Key | Owner | When |
|-----|-------|------|
| `settl-theme` | App.tsx (baseMap state init) | On theme change |
| `settl-font-scale` | FontScaleContext | On scale change |
| `settl-last-coords` | App.tsx or useUrlState | On coordsA change (optional, for blank-URL revisits) |

---

## Component Inventory: New vs Modified

| Component/File | New or Modified | Scope |
|---------------|-----------------|-------|
| `src/components/shell/ReportPanel.tsx` | NEW | Overview report content |
| `src/contexts/FontScaleContext.tsx` | NEW | Font scale provider |
| `src/hooks/useGeolocation.ts` | NEW | Browser geolocation wrapper |
| `src/App.tsx` | MODIFIED | viewMode state, OS theme init, localStorage |
| `src/components/shell/ModuleRail.tsx` | MODIFIED | Lucide icons, overview toggle UI |
| `src/components/shell/ModuleSheet.tsx` | MODIFIED | viewMode prop, ReportPanel branch |
| `src/components/shell/LocationIntelCard.tsx` | MODIFIED | Debounced autocomplete, geolocation button, rebrand wordmark |
| `src/index.css` | MODIFIED | --font-scale variable, font-scale-* classes |
| `src/main.tsx` | MODIFIED | FontScaleContext provider wrap |
| `src/types/index.ts` | READ-ONLY | No changes — overview is not a TabId |

---

## Recommended Build Order

Dependencies flow determines order:

1. **CSS variables + font scale context** (index.css + FontScaleContext.tsx + main.tsx)
   — No deps. Unlocks font-scale controls everywhere immediately.

2. **OS theme detection + localStorage** (App.tsx baseMap init)
   — Trivial, isolated change. No component deps.

3. **ModuleRail Lucide refactor**
   — Self-contained. Install lucide-react, swap SVGs. No API or state changes.

4. **Rebrand wordmark** (LocationIntelCard.tsx)
   — blind·spot -> settl. text change only.

5. **Browser geolocation** (useGeolocation.ts + LocationIntelCard.tsx)
   — New hook, minimal LocationIntelCard addition.

6. **Search autocomplete debounce** (LocationIntelCard.tsx)
   — Builds on existing forwardGeocode + suggestions state.

7. **viewMode state + Overview/Advanced toggle** (App.tsx + ModuleRail.tsx + ModuleSheet.tsx)
   — Adds viewMode prop chain. Must precede ReportPanel.

8. **ReportPanel component** (ReportPanel.tsx)
   — Requires viewMode wiring (step 7) to be in place to render.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| ReportPanel inside ModuleSheet, not replacing it | ModuleSheet owns positioning, animation, keyboard handling — duplicating that is waste |
| viewMode in App useState, not useUrlState | Overview is session default, not a shareable URL state |
| Font scale via CSS custom property on html, not inline styles | Consistent with existing --c-* pattern; works across all components without prop drilling |
| No new TabId for 'overview' | Would require changes in 8+ files; overview is a view mode, not a data module |
| Geolocation user-triggered, not auto | Privacy default; browser blocks auto geolocation on many origins |
| Autocomplete debounce in LocationIntelCard, not new hook | forwardGeocode is already imported; debounce is 3 lines of useEffect |

---

## Pitfalls

| Risk | Impact | Mitigation |
|------|--------|-----------|
| ModuleSheet `right-[32px]` assumes ModuleRail width=72px | If rail widens for new icons, sheet overlaps rail | Keep rail at 72px or update the right offset together |
| Left column z-30 vs ModuleSheet z-20 | Left column panels correctly occlude sheet on narrow viewports | Keep z-index hierarchy; don't flatten |
| Lucide-react bundle size | ~50KB gzipped for full import | Named imports only, tree-shake verified at build |
| localStorage and URL state can diverge | User with saved coords + shared URL expects URL to win | URL params always take precedence; localStorage is fallback for empty URL only |
| AnimatePresence keyed on viewMode inside ModuleSheet | Double animation if tab also changes | Key on `${active}-${viewMode}` to collapse both into one transition |
