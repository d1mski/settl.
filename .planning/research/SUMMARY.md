# Project Research Summary

**Project:** settl. (BlindSpot_reloc) — Reskin + UX Overhaul
**Domain:** React/Leaflet location intelligence dashboard — accessibility + UX milestone
**Researched:** 2026-06-17
**Confidence:** HIGH

## Executive Summary

This milestone is a UX overhaul of an existing, validated codebase (React 18 + TS + Vite + Tailwind v3 + Leaflet). The work is additive: one new dependency (`lucide-react`), three new files, and surgical modifications to six existing files. No architectural re-platforming is needed. The recommended approach is to build in strict dependency order — CSS foundations first, then shell-level state changes, then individual features — because later features (ReportPanel, search autocomplete) depend on infrastructure laid by earlier ones (FontScaleContext, viewMode state).

The dominant risk is the Leaflet/CSS interaction surface. Leaflet injects its own stylesheet and maintains internal z-index and coordinate systems that break silently when CSS `zoom`, Framer Motion transforms, or imprecise selector specificity are applied to ancestor elements. Every phase that touches layout or theming must validate against Leaflet popups, tooltip directional arrows, and click coordinate accuracy before shipping. This is not a minor concern — it requires explicit regression checkpoints.

The feature set is well-scoped and low-complexity. All five new features (OS theme detection, font size controls, search autocomplete, saved locations, overview panel) build on existing patterns already present in the codebase. None require novel third-party integrations. The main discipline required is: avoid shortcuts (dynamic Tailwind class construction, barrel icon imports, `zoom` on wrong ancestors, geolocation on mount) that create invisible bugs detectable only at production build time or on specific browsers.

---

## Key Findings

### Recommended Stack

The existing stack needs zero changes except adding `lucide-react`. All other features — geolocation, debounced autocomplete, localStorage persistence, font scaling, OS theme detection — are implementable with native browser APIs and custom React hooks (20-30 lines each). Resist adding utility libraries (`react-use`, `usehooks-ts`, `react-select`); the surface area is small enough that custom hooks are the correct call.

**Core technologies:**
- `lucide-react ^0.511.0`: named SVG icons, tree-shakeable — only package addition this milestone
- Native `navigator.geolocation`: no wrapper library needed, handle 3 error codes explicitly
- Tailwind v3 `darkMode: 'class'`: already configured, extend to 3-state with OS fallback
- CSS custom properties (`--font-scale`, `--c-*`): consistent with existing variable system
- `localStorage`: key-per-concern pattern, no central storage manager

**Critical version constraint:** Do NOT upgrade to Tailwind v4 — breaking config format changes with no milestone benefit.

### Expected Features

**Must have (table stakes):**
- OS theme detection with `prefers-color-scheme` fallback and manual override persistence
- Font size A- / A+ controls (3 steps minimum) persisted across sessions
- Search-as-you-type geocoding with 300ms debounce, keyboard nav, click-outside dismiss
- Saved locations: heart/bookmark affordance, load on click, remove from list
- Overview/Report panel as default ModuleSheet landing state with severity-ranked cards

**Should have (differentiators):**
- Three-state theme toggle (Light / System / Dark) with flash-of-wrong-theme prevention
- Highlight matched substring in autocomplete results
- Recent searches (last 3-5) shown before typing starts
- Custom label / rename for saved locations
- Status indicators (OK / Watch / Alert) per module card in overview

**Defer (v2+):**
- Export saved locations as JSON
- 5-step font scale (xs–xl)
- Collapsible overview sections with per-section memory
- Composite livability score (anti-feature — avoid entirely)

### Architecture Approach

All new features integrate into the existing absolute-overlay layout model without modifying MapCanvas or the flex layout structure. `ReportPanel` lives inside `ModuleSheet` (not replacing it), controlled by a `viewMode: 'overview' | 'advanced'` useState in `App.tsx`. Font scale is a React context + CSS custom property on `<html>`, matching the existing `--c-*` pattern. The `TabId` type is intentionally not extended — overview is a view mode, not a data module, avoiding blast radius across 8+ files.

**New/modified components:**
1. `src/components/shell/ReportPanel.tsx` (NEW) — overview content, lazy-loaded inside ModuleSheet
2. `src/contexts/FontScaleContext.tsx` (NEW) — font scale provider wrapping App in main.tsx
3. `src/hooks/useGeolocation.ts` (NEW) — user-triggered geolocation wrapper
4. `src/App.tsx` (MODIFIED) — viewMode state, OS theme init, localStorage keys
5. `src/components/shell/ModuleRail.tsx` (MODIFIED) — Lucide icons, overview toggle UI
6. `src/components/shell/ModuleSheet.tsx` (MODIFIED) — viewMode prop, ReportPanel branch
7. `src/components/shell/LocationIntelCard.tsx` (MODIFIED) — debounced autocomplete, geolocation button
8. `src/index.css` (MODIFIED) — --font-scale variable, font-scale-* classes
9. `src/main.tsx` (MODIFIED) — FontScaleContext provider

### Critical Pitfalls

1. **Leaflet CSS specificity war** — Override popup/tooltip styles in a dedicated block loaded AFTER `@tailwind utilities`. Use `.leaflet-container .leaflet-popup-content-wrapper` combinator selectors. Test all four tooltip directions on both themes after every CSS change.

2. **CSS `zoom` breaks Leaflet coordinate math** — Never apply `zoom` to any ancestor of the map container. For font scaling, use `font-size` on `<html>` + rem units throughout. Validate by clicking the map at known coords after font scale changes.

3. **Framer Motion creates stacking contexts that bury Leaflet popups** — Animate only `opacity` and `transform` on elements outside the Leaflet DOM subtree. Set UI panels to z-index 800+; Leaflet popups at 700. Use React portals for floating panels if stacking issues appear.

4. **OS theme flash-of-wrong-theme** — Apply theme class synchronously in a `<head>` inline script before React hydrates. Read localStorage first; fall back to `prefers-color-scheme` only if no saved preference. Never toggle theme after first paint.

5. **Autocomplete race condition** — Use `AbortController` cleanup in the debounce effect. Create the debounce function once with `useRef`, never inside the render body. Cap at 3-char minimum (Nominatim 1 req/sec policy).

---

## Implications for Roadmap

### Phase 1: CSS Foundations + Reskin
**Rationale:** All visual work depends on the token system being stable. Doing this first prevents re-theming later features.
**Delivers:** Dark/light CSS variables, rounded corners, Leaflet override block, `--font-scale` CSS variable, `theme-light` class wiring.
**Addresses:** OS theme detection (table stakes base), border-radius reskin.
**Avoids:** Pitfall 1 (Leaflet specificity), Pitfall 10 (Tailwind purge of dynamic classes), Pitfall 4 (Framer Motion stacking context).

### Phase 2: App Shell State + OS Theme
**Rationale:** Theme and font scale are global state that all new components will inherit. Establish before building new components.
**Delivers:** Three-state theme toggle, OS `prefers-color-scheme` detection, `localStorage` persistence, FontScaleContext, A- / A+ controls.
**Addresses:** Font size controls (table stakes), OS theme detection (table stakes).
**Avoids:** Pitfall 3 (Framer Motion flash on theme change), Pitfall 9 (OS theme race with localStorage).

### Phase 3: LocationIntelCard Enhancements
**Rationale:** Geolocation and autocomplete are independent from overview panel but share the LocationIntelCard surface. Do together to avoid re-touching that file twice.
**Delivers:** Debounced search autocomplete, "Use my location" button, keyboard nav, recent searches.
**Addresses:** Search autocomplete (table stakes + differentiators), browser geolocation.
**Avoids:** Pitfall 5 (geolocation on mount), Pitfall 6 (autocomplete race condition).

### Phase 4: Saved Locations
**Rationale:** Depends on geocoding label from Phase 3 autocomplete. localStorage pattern established in Phase 2.
**Delivers:** Heart/bookmark save, labeled location list, load + remove, 10-item cap.
**Addresses:** Saved locations (all table stakes).
**Avoids:** Pitfall 7 (localStorage serialization failures — versioned schema required here).

### Phase 5: ModuleRail Refactor + Lucide Icons
**Rationale:** Self-contained refactor, no other dependencies. Do before ReportPanel to have icons ready for overview cards.
**Delivers:** Lucide icon swap in rail, overview/advanced toggle UI in rail.
**Addresses:** Icon modernization, overview toggle affordance.
**Avoids:** Pitfall 8 (named imports only, no barrel import).

### Phase 6: ReportPanel (Overview Mode)
**Rationale:** Requires viewMode state (added in Phase 2), ModuleRail toggle (Phase 5), stable module data. Build last.
**Delivers:** Severity-ranked module summary cards, status indicators, drill-down nav to module tabs.
**Addresses:** Overview panel (all table stakes + differentiators).
**Avoids:** Pitfall 4 (stacking context — ReportPanel renders inside ModuleSheet, no new z-index context needed).

### Phase Ordering Rationale

- CSS foundations before any component work — prevents re-theming cascades
- Global state (theme, font scale) before local features — new components inherit correct context from the start
- LocationIntelCard changes grouped — one file revisit instead of two
- Saved locations after geocoding — needs Nominatim label from autocomplete
- Lucide refactor before ReportPanel — icons needed for overview cards
- ReportPanel last — most dependencies, most stable to build when everything else is locked

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1:** Tailwind v3 CSS variables and Leaflet override patterns are well-documented.
- **Phase 2:** OS theme detection pattern is industry-standard; Tailwind dark mode docs are authoritative.
- **Phase 3:** Nominatim already integrated; AbortController debounce is established pattern.
- **Phase 4:** localStorage schema is trivial; no novel integration.
- **Phase 5:** Lucide named import swap is mechanical.

Phases that may benefit from brief research during planning:
- **Phase 6 (ReportPanel):** Severity ranking heuristic across modules needs a scoring decision — research how existing risk synthesis data maps to OK/Watch/Alert thresholds before building.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack confirmed from package.json; only new dep is lucide-react, verified on npm |
| Features | HIGH | Table stakes derived from established UX patterns (NN/g, WCAG 2.1); differentiators from competitive analysis |
| Architecture | HIGH | Based on direct codebase analysis, not speculation; integration points identified at file level |
| Pitfalls | HIGH | Each pitfall sourced from Leaflet GitHub issues, MDN, or reproducible React patterns |

**Overall confidence:** HIGH

### Gaps to Address

- **Font scale implementation conflict:** STACK.md recommends `zoom` on a scoped panel element; ARCHITECTURE.md and PITFALLS.md both prohibit `zoom` on any Leaflet ancestor. Resolution: use `font-size` on `<html>` + rem units (PITFALLS wins — coordinate math breakage is non-negotiable). Confirm all existing text classes use rem, not px, before Phase 2.
- **Nominatim debounce value:** FEATURES.md says 300ms; STACK.md says 400ms (citing Nominatim 1 req/sec policy). Resolution: use 400ms — it satisfies the policy with margin and the UX difference is imperceptible.
- **ReportPanel severity scoring:** No scoring algorithm defined in research. Needs a product decision on how to rank module risk cards before Phase 6 implementation begins.

---

## Sources

### Primary (HIGH confidence)
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) — rate limits
- [Tailwind dark mode docs](https://tailwindcss.com/docs/dark-mode) — class strategy
- [MDN: CSS zoom](https://developer.mozilla.org/docs/Web/CSS/zoom) — browser support
- [MDN: Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) — error codes, HTTPS requirement
- [MDN: Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API/Using_the_Permissions_API) — pre-check pattern
- [lucide-react on npm](https://www.npmjs.com/package/lucide-react) — version, tree-shaking

### Secondary (MEDIUM confidence)
- [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) — overview panel pattern
- [Leaflet GitHub Issue #6135](https://github.com/Leaflet/Leaflet/issues/6135) — CSS specificity
- [Leaflet GitHub Issue #3575](https://github.com/Leaflet/Leaflet/issues/3575) — tile seams at fractional zoom
- [AbortController for autocomplete](https://blog.openreplay.com/optimizing-api-calls-react-debounce-strategies/) — race condition prevention
- [localStorage QuotaExceededError](https://mmazzarolo.com/blog/2022-06-25-local-storage-status/) — storage limits

### Tertiary (LOW confidence)
- [CSS zoom breaking Leaflet](https://bnolan.org/2022/02/14/css-breaking-leaflet-map-rendering/) — validate with manual test during Phase 2

---
*Research completed: 2026-06-17*
*Ready for roadmap: yes*
