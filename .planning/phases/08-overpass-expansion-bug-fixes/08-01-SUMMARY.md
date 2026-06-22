---
phase: 08-overpass-expansion-bug-fixes
plan: 01
subsystem: overpass-pipeline
tags: [hazard, overpass, categorise, FeatureCategory, bug-fix, healthcare, school]
dependency_graph:
  requires: []
  provides: [hazard-category, hazard-categorise-branches, hazard-nearest-rows, hazard-colors, golf-park-branch, healthcare-tag-fix, school-level-fix, query-v5]
  affects: [useOverpassFeatures, ContextMapLayer, ContextModule]
tech_stack:
  added: []
  patterns: [first-match-dispatch, Record<FeatureCategory-string>-type-enforcement, NEAREST_ROWS-tuple]
key_files:
  created: []
  modified:
    - src/hooks/useOverpassFeatures.ts
    - src/components/modules/ContextModule.tsx
    - src/components/shell/layers/ContextMapLayer.tsx
decisions:
  - QUERY_VERSION bumped v4→v5 to invalidate stale Overpass cache entries lacking hazard categorisation
  - power=substation node-only (locked) — ways cause Overpass geometry explosion + timeout; captures ~20% of substations
  - Hazard query radius 5km (not 1km) — HAZ-03 proximity bands (500m/1km) applied in code, not query
  - telecom=data_center (not man_made=data_center which has 3 global uses)
  - Golf returns park/golf_course (not hazard) per D-03; no NEAREST_ROWS golf row — count bar + marker only
  - FIX-02 is a pure deletion — no "keep for edge cases" name heuristic remains
  - FIX-03 exact === matching; multi-value levels ("1;2", "0-4") fall to generic school (documented TODO)
metrics:
  duration: 3m
  completed: 2026-06-22
  tasks_completed: 4
  files_modified: 3
---

# Phase 08 Plan 01: Overpass Hazard Category + Bug Fixes Summary

**One-liner:** Expanded Overpass pipeline with new `hazard` FeatureCategory (military/substation/wastewater/quarry/landfill/data_center at 5km), golf into park category (2km), tag-based healthcare/school classification replacing broken name/substring heuristics, QUERY_VERSION v4→v5 cache invalidation, and red-orange hazard colors in both CATEGORY_COLORS maps.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Bump QUERY_VERSION v4→v5 + expand buildQuery | 7203a67 | src/hooks/useOverpassFeatures.ts |
| 2 | Expand categorise() hazard+golf branches, fix healthcare/schoolSubtype, add NEAREST_ROWS | 2eb06bf | src/hooks/useOverpassFeatures.ts |
| 3 | Add hazard color to ContextModule loose CATEGORY_COLORS | 884656f | src/components/modules/ContextModule.tsx |
| 4 | Add hazard color to ContextMapLayer strict CATEGORY_COLORS | 274c68e | src/components/shell/layers/ContextMapLayer.tsx |

## What Was Built

### HAZ-01: Hazard POI Category
- Added `'hazard'` to `FeatureCategory` union
- 8 new Overpass query lines in `buildQuery()`: substation (node-only, 5km), military/wastewater/quarry/landfill/data_center (nwr, 5km), golf_course (nwr, 2km)
- `[maxsize:32000000]` added to Overpass header
- 6 hazard branches in `categorise()` inserted before `landuse=industrial` (insertion order preserves first-match semantics)
- 5 rows added to `NEAREST_ROWS`: military, substation, wastewater plant, quarry/landfill, data center

### HAZ-02: Golf as Park Category
- Golf branch `{ category: 'park', subtype: 'golf_course' }` inserted before `leisure=park` in categorise()
- Surfaces via category count bar + map marker (no NEAREST_ROWS golf row per D-03)

### FIX-02: Healthcare Tag-Based Classification
- Deleted Greek name-substring heuristic (κέντρο/κλινικ/clinic name.includes checks)
- Classification now: `healthcare:speciality` present → clinic; `healthcare=clinic` → clinic; else → hospital

### FIX-03: Exact School Level Matching
- Replaced `.includes('primary')/.includes('1')/.includes('elementary')` with exact `===` matches
- Added `.trim()` to normalize whitespace
- Added TODO comment for multi-value level strings ("1;2", "0-4")

### Color Maps
- `hazard: '#ff6b35'` (red-orange) added to both CATEGORY_COLORS maps
- ContextMapLayer.tsx: `Record<FeatureCategory, string>` — TypeScript compile-enforced
- ContextModule.tsx: `Record<string, string>` — silent fallback guard (was gray)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All hazard features flow through real Overpass data. HAZ-03 severity logic (deriveContextSeverity stub replacement) is deferred to Plan 02 as designed.

## Verification Results

- `npx tsc --noEmit`: exits 0, no errors
- `grep -c "hazard" src/hooks/useOverpassFeatures.ts`: 8 (≥6 required)
- Greek heuristic: absent
- `level.includes`: absent
- QUERY_VERSION: v5 only, v4 gone
- `man_made=data_center`: absent from query (only `telecom=data_center` present)
