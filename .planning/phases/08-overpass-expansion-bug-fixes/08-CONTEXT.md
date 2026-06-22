# Phase 8: Overpass Expansion + Bug Fixes - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a new `hazard` POI category (military, power substations, wastewater plants,
quarry/landfill, data centers) plus golf courses into the existing park/leisure
category; make the app usable on mobile (root layout fix); and fix
hospital/clinic + school-level classification to use OSM tags instead of
name-substring heuristics.

Requirements: HAZ-01, HAZ-02, HAZ-03, FIX-01, FIX-02, FIX-03.
**No new feature types beyond those listed** — feature set is fixed by ROADMAP criterion 1.
</domain>

<decisions>
## Implementation Decisions

### Hazard category — label & grouping
- **D-01:** New `FeatureCategory` value is `'hazard'` (lowercase key, matches existing
  `'industrial'`/`'transit'` style — no label-casing code needed). User-facing label
  is "hazard", faithful to ROADMAP wording.
- **D-02:** Marker/bar color is **red-orange** (caution read). Add the entry to BOTH
  `CATEGORY_COLORS` maps: `src/components/modules/ContextModule.tsx` and
  `src/components/shell/layers/ContextMapLayer.tsx`. Map markers render automatically
  once the color exists — no marker-layer code.
- **D-03:** Golf courses (`leisure=golf_course`) join the **existing `park` category**
  (subtype `golf_course`), NOT the hazard category. [HAZ-02]

### Hazard surfacing
- **D-04:** Hazards surface as **nearest-per-type rows** in the existing
  `nearestByType` pattern (one row each: military / substation / wastewater /
  quarry-landfill / data center, showing nearest feature + distance). Reuses the
  hospital/pharmacy row pattern exactly — no new component. Satisfies ROADMAP's
  "each feature with distance".
- **D-05:** Map markers come free from D-02 (ContextMapLayer auto-renders per category).

### Claude's Discretion
- **Mobile layout (FIX-01) details:** Root fix is locked (`h-[100dvh]` + responsive
  `flex-col` stack, drop `h-screen`+`overflow-hidden`+fixed `w-[560px]` at App.tsx:69-70).
  Exact breakpoint and map/panel split left to planner. **Recommended default:** stack
  vertically below `lg` (1024px) since the panel is 560px and cramps under ~900px; map
  ~45vh on top, panel scrolls below; the two floating `w-[360px]` left cards (App.tsx:87)
  become static/stacked on mobile rather than absolutely-positioned off-screen.
- **HAZ-03 severity message wording** in the Context card (e.g. "substation 800m → Watch").

## LOCKED — do not re-open (from ROADMAP + research notes)
- `QUERY_VERSION` `v4` → `v5` (atomic bump before ANY Overpass change merges) — `useOverpassFeatures.ts:62`
- `power=substation` **nodes only**; **drop `power=line` ways entirely** (geometry explosion + Overpass timeout)
- Add `[maxsize:32000000]` to the Overpass query header in `buildQuery()`
- **FIX-02:** classify hospital vs clinic by `healthcare=*` tags only; **DELETE** the Greek
  name-substring heuristic at `useOverpassFeatures.ts:123-127`
- **FIX-03:** derive school level by exact `school:level`/`isced:level` match; **DELETE**
  the `.includes('1')` substring logic in `schoolSubtype()` (`:86-100`)
- **HAZ-03 bands:** hazard within 1km → Context card **Watch**; military OR wastewater
  within 500m → **Alert**
- **HAZ-03 is the meat:** `deriveContextSeverity()` (`overviewSeverity.ts:148`) is currently a
  stub that ALWAYS returns `ok`. HAZ-03 = replacing that stub with proximity-based
  watch/alert logic. Easy to overlook — it is the core of HAZ-03.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs/ADRs exist. The contract lives in these files:

### Overpass / hazard category (HAZ-01, HAZ-02, FIX-02, FIX-03)
- `src/hooks/useOverpassFeatures.ts` — `FeatureCategory` union (:16), `buildQuery()` (:68),
  `categorise()` (:102), `schoolSubtype()` (:86), `NEAREST_ROWS`/`nearestByType()` (:280), `QUERY_VERSION` (:62)
- `src/components/modules/ContextModule.tsx` — `CATEGORY_COLORS` (:~225), `summariseFeatures()`, feature rows
- `src/components/shell/layers/ContextMapLayer.tsx` — `CATEGORY_COLORS` (:12), marker rendering
- `src/components/shell/ReportPanel.tsx` — `nearestBySubtype()` (:97), overview summary rows

### Severity (HAZ-03)
- `src/utils/overviewSeverity.ts` — `deriveContextSeverity()` (:148, the stub to replace)

### Mobile (FIX-01)
- `src/App.tsx:69-70` (`h-screen`+`overflow-hidden`), `:87` (floating `w-[360px]` cards)

### Requirements / roadmap
- `.planning/REQUIREMENTS.md` — HAZ-01/02/03, FIX-01/02/03
- `.planning/ROADMAP.md` — Phase 8 success criteria + research notes
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `nearestByType()` + `NEAREST_ROWS` — extend with hazard rows (D-04), zero new pattern
- `CATEGORY_COLORS` (two copies) — add `hazard` color (D-02); map markers then auto-render
- `summariseFeatures()` / `FeatureCounts` — hazard appears in the category bar automatically once categorised

### Established Patterns
- `categorise(tags)` is the single dispatch point for category+subtype — all of HAZ-01,
  FIX-02, FIX-03 are edits to this one function + `schoolSubtype()` + `buildQuery()`
- Coordinate-quantized + TTL-cached fetch; `QUERY_VERSION` invalidates stale cache on bump

### Integration Points
- New category requires touching the `FeatureCategory` union AND both `CATEGORY_COLORS` maps
  (ContextModule + ContextMapLayer) — easy to update one and miss the other
- `deriveContextSeverity` feeds the Overview Context chapter status dot (HAZ-03)
</code_context>

<specifics>
## Specific Ideas

- Hazard color: red-orange (distinct from `industrial` `#ffb347` amber and `airport` `#ff4d5e` red — pick a hazard tone that doesn't collide).
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Search-radius tuning treated as Claude's
discretion, defaulted from existing per-type radii in `buildQuery`; not a user decision.)
</deferred>

---

*Phase: 08-overpass-expansion-bug-fixes*
*Context gathered: 2026-06-22*
