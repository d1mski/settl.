---
phase: 10-marine-climate-selector
plan: "03"
subsystem: ui
tags: [react, typescript, marine, tabs, shell-wiring, visibleTabs, climateYears]

# Dependency graph
requires:
  - phase: 10-marine-climate-selector-plan-01
    provides: useMarine hook (isCoastal, ModuleState<MarineData>), MarineModule component
  - phase: 10-marine-climate-selector-plan-02
    provides: useClimateArchive, useOpenMeteo _years param (Plan 04 routing symmetry)
provides:
  - marine TabId variant in types/index.ts (7th tab)
  - visibleTabs: coastal flag gates Marine tab in ModuleSheet tab bar only
  - C-02 fallback: marine->climate revert when active-marine pin becomes inland
  - climateYears state (1|5|10, default 1) lifted to App, threaded to ClimateModule
  - MarineModule lazy-rendered on active === 'marine'
affects: [10-04, ClimateModule Plan-04 selector UI, ModuleSheet tab bar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "coastal flag derived from useMarine(coordsA).data?.isCoastal ?? false at App level"
    - "visibleTabs = TAB_ORDER.filter(id => id !== 'marine') for inland — single gating point in ModuleSheet"
    - "C-02 fallback useEffect guards on (state.tab === 'marine' && !isCoastal && marineResolved)"
    - "climateYears lifted to App with useState<1|5|10>(1) — threads through moduleSheetProps spread"
    - "Forward-declared optional Props in ClimateModule (years?/onYearsChange?) — no destructuring to avoid TS6133"

key-files:
  created: []
  modified:
    - src/types/index.ts
    - src/components/shell/ModuleRail.tsx
    - src/components/shell/ModuleSheet.tsx
    - src/App.tsx
    - src/components/modules/ClimateModule.tsx

key-decisions:
  - "visibleTabs gating lives in ModuleSheet only — ModuleRail is dead code (not rendered); marine entries added to ICONS/LABELS solely to satisfy tsc Record<TabId> exhaustiveness"
  - "ClimateModule Props forward-declares years?/onYearsChange? without destructuring — avoids TS6133 (noUnusedParameters: true) while establishing the prop contract for Plan 04"
  - "TAB_ORDER import removed from ModuleSheet after swapping to visibleTabs.map to avoid TS6133 unused-import warning"
  - "marineState not passed to ModuleSheet — MarineModule calls useMarine itself; App's call + module's call = one network request (in-flight dedup from Plan 01)"

patterns-established:
  - "Per-tab visibility gate: pass visibleTabs array prop from App; ModuleSheet renders only those tabs — avoids conditional logic scattered across multiple render sites"

requirements-completed: [DATA-03, DATA-04]

# Metrics
duration: 25min
completed: 2026-06-24
---

# Phase 10 Plan 03: Shell Integration Summary

**Marine TabId wired into app shell — coastal flag gates a 7th Marine tab (visibleTabs pattern), C-02 auto-reverts to Climate on inland switch, climateYears state lifted to App and threaded to ClimateModule for Plan 04.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-24T08:00:00Z
- **Completed:** 2026-06-24T08:25:00Z
- **Tasks:** 4 (3 auto + 1 human-verify)
- **Files modified:** 5

## Accomplishments

- Added `'marine'` as the 7th `TabId` variant; all four `Record<TabId,...>` maps updated (TAB_LABELS, ModuleRail ICONS+LABELS, ModuleSheet TAB_ICONS) — tsc exits 0
- App-level coastal flag: `useMarine(coordsA)` → `isCoastal` → `visibleTabs`; ModuleSheet tab bar swapped from `TAB_ORDER.map` to `visibleTabs.map` (single gating point)
- C-02 fallback `useEffect` reverts `state.tab` from `'marine'` to `'climate'` when pin becomes inland and `marineResolved`
- `climateYears: 1|5|10` state (default 1) lifted to App; threaded via `moduleSheetProps` spread to both desktop and mobile `ModuleSheet` instances
- `MarineModule` lazy-imported and rendered in `ModuleSheet` on `active === 'marine'`; `ClimateModule` Props forward-declares `years?/onYearsChange?` for Plan 04
- Human-verify checkpoint PASSED: coastal pin shows Marine tab + module; inland shows 6 tabs only; C-02 reverts marine→climate; Overview unaffected

## Task Commits

1. **Task 1: Add marine TabId + all four Record<TabId> maps** — `eb3eccc` (feat)
2. **Task 2: App coastal flag, visibleTabs, C-02 fallback, climateYears lift** — `3002e24` (feat)
3. **Task 3: ModuleSheet visibleTabs gate, MarineModule case, years pass-through** — `f991334` (feat)
4. **Task 4: Human-verify checkpoint** — PASSED (no commit)

## Files Created/Modified

- `src/types/index.ts` — TabId + 'marine', TAB_ORDER appended, TAB_LABELS entry
- `src/components/shell/ModuleRail.tsx` — Waves icon + MAR label (compiler-satisfaction; dead code)
- `src/components/shell/ModuleSheet.tsx` — Waves import, TAB_ICONS marine entry, visibleTabs prop, visibleTabs.map, MarineModule lazy + render case, years pass-through to ClimateModule
- `src/App.tsx` — useMarine import, isCoastal/marineResolved/visibleTabs, climateYears state, C-02 useEffect, moduleSheetProps extended
- `src/components/modules/ClimateModule.tsx` — Props forward-declaration years?/onYearsChange? (no destructure, no behavior change)

## Decisions Made

1. **visibleTabs gating in ModuleSheet only** — ModuleRail is confirmed dead code (not rendered anywhere in the tree). Compiler-only marine entries added to ICONS/LABELS; runtime gating is handled exclusively by `visibleTabs.map` in ModuleSheet.
2. **TAB_ORDER import dropped from ModuleSheet** — became unused after the `visibleTabs.map` swap; removed to avoid TS6133 warning.
3. **Forward-declare without destructure** — `noUnusedParameters: true` in tsconfig means destructured-but-unused props cause TS6133. Props interface is the safe boundary for forward-declarations.
4. **marineState not forwarded to ModuleSheet** — MarineModule calls `useMarine` itself; the in-flight dedup in Plan 01 ensures App's call and MarineModule's call collapse to one network request.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — Marine tab visibility is fully wired; MarineModule renders live data from Plan 01. ClimateModule years?/onYearsChange? are intentionally non-functional stubs — Plan 04 implements the selector behavior and activates them.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 04 (Climate Selector UI) can proceed — `climateYears` state and `onClimateYearsChange` are live at the App level and threaded to `ClimateModule` via `years`/`onYearsChange` props. Plan 04 only needs to implement the selector pill UI and the dual-hook gating inside `ClimateModule`.
- DATA-03 shell integration complete: coastal pins show Marine tab + MarineModule; inland pins show 6 tabs.
- DATA-04 plumbing complete: climateYears default-1 state flows App → ModuleSheet → ClimateModule.

---
*Phase: 10-marine-climate-selector*
*Completed: 2026-06-24*
