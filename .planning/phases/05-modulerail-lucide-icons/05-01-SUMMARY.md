---
phase: 05-modulerail-lucide-icons
plan: "01"
subsystem: icons
tags: [lucide, icons, svg, modulerail, warnings]
dependency_graph:
  requires: []
  provides: [lucide-react-icon-system]
  affects: [ModuleRail, GridResolutionWarning, BuildingCard, WindModule]
tech_stack:
  added: [lucide-react]
  patterns: [Lucide named imports, strokeWidth=1.4 consistency, currentColor inheritance]
key_files:
  created: []
  modified:
    - src/components/shell/ModuleRail.tsx
    - src/components/GridResolutionWarning.tsx
    - src/components/shell/BuildingCard.tsx
    - src/components/modules/WindModule.tsx
    - package.json
decisions:
  - "Used Sunrise (not Sun) for the sun tab to avoid icon collision with the climate Sun icon"
  - "strokeWidth=1.4 used on all Lucide icons to match prior hand-rolled SVG stroke weight"
  - "size=12 on inline TriangleAlert warning icons fits the 9px font mono context"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-17"
  tasks: 2
  files: 5
---

# Phase 05 Plan 01: Lucide Icons — ModuleRail + Unicode Glyphs Summary

**One-liner:** Replaced 6 hand-rolled inline SVGs in ModuleRail and 3 Unicode ⚠ glyphs across warning components with Lucide React icons at strokeWidth=1.4.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Install lucide-react and replace ModuleRail ICONS record | 0030119 | package.json, ModuleRail.tsx |
| 2 | Replace Unicode warning glyphs with TriangleAlert in 3 files | 348f1db | GridResolutionWarning.tsx, BuildingCard.tsx, WindModule.tsx |

## Decisions Made

- **Sunrise for sun tab:** `Sun` icon is used for the climate tab (temperature/heat metaphor). The sun tab uses `Sunrise` (distinct horizon line) to avoid visual collision between two similar icons.
- **strokeWidth=1.4:** Matches the stroke weight of the prior hand-rolled SVGs — visual continuity preserved.
- **size=12 for inline warnings:** TriangleAlert inline in warning banners uses `size={12}` (matches ~9px mono font context) with `shrink-0` to prevent flex squish.

## Deviations from Plan

None — plan executed exactly as written.

## Out-of-Scope Discovery

Pre-existing build errors in `src/components/shell/LocationIntelCard.tsx` (unused imports: `useSavedLocations`, `HeartOutline`, `HeartFilled`) were present before this plan. Last touched in Phase 02 commit `e38d2e7`. Logged to `deferred-items.md` — not caused by this plan.

## Verification Results

- `npm run typecheck` — passed (0 errors)
- `grep -r "⚠" src/` — 0 matches
- `grep "<svg viewBox" src/components/shell/ModuleRail.tsx` — 0 matches
- `grep "lucide-react" src/components/shell/ModuleRail.tsx` — import line present

## Known Stubs

None.

## Self-Check: PASSED

- ModuleRail.tsx modified — FOUND
- GridResolutionWarning.tsx modified — FOUND
- BuildingCard.tsx modified — FOUND
- WindModule.tsx modified — FOUND
- Commit 0030119 — FOUND
- Commit 348f1db — FOUND
- Zero ⚠ in src/ — CONFIRMED
- Zero inline SVG in ModuleRail — CONFIRMED
