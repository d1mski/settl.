---
phase: 10-marine-climate-selector
plan: "04"
subsystem: ui
tags: [react, typescript, climate, era5, open-meteo, hooks, pill-selector, n/a-degrade]

# Dependency graph
requires:
  - phase: 10-marine-climate-selector-plan-02
    provides: useClimateArchive(coords, 5|10) → ModuleState<ClimateData> with sum÷N normalization
  - phase: 10-marine-climate-selector-plan-03
    provides: climateYears state lifted to App, years/onYearsChange props threaded to ClimateModule

provides:
  - 1YR/5YR/10YR segmented pill in ClimateModule (D-07/D-08) — YearSelector component
  - Dual null-gated hook routing: 1YR→useOpenMeteo, 5/10YR→useClimateArchive (Rules-of-Hooks safe)
  - Per-year extreme-day count normalization in deriveOne (÷N for above35/below0/heavyRain/strongGusts)
  - N/A degrade states for THERMAL MATRIX, HUMIDITY, UV INDEX, PEAK UV on 5/10YR
  - Active-window subtitles on all sections (D-09): empty suffix for 1YR, N-YR AVG for multi-year
  - CompareView single shared selector for both A+B (D-10)
  - 1YR path byte-identical to pre-plan (C-04 regression gate)

affects: [DATA-04-complete, climate-module, compare-mode]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Four unconditional null-gated hook calls — coords nulled for inactive path — preserves Rules of Hooks"
    - "YearSelector pill mirrors ModuleSheet Overview/Advanced toggle markup (bg-panel/text-ink active, text-muted inactive)"
    - "NaPlaceholder: flex center h-[170px] font-mono uppercase — consistent with project muted-state style"
    - "years > 1 branches always have matching years === 1 else-paths with original code unchanged (regression gate)"
    - "deriveOne(data, years): extreme counts ÷N post-countExtremeDays, never re-divided at source"

key-files:
  created: []
  modified:
    - src/components/modules/ClimateModule.tsx

key-decisions:
  - "Tasks 1+2 committed together — Task 1 alone caused TS6133 on unused years/onYearsChange props (noUnusedParameters: true); Task 2 consumed them, eliminating the errors; tsc exits 0 only after both"
  - "rainDays deflation (10-02 carry-forward): rainDays field confirmed not rendered anywhere in ClimateModule — deflation is invisible to the user; no fix applied; documented as known limitation"
  - "useMemo deps include yearsValue alongside stateA.data / stateB.data — prevents stale ÷N on year-switch"
  - "CompareView ΔPEAK UV shows '--' / neutral tone on 5/10YR — avoids delta math on empty uvIndexMax arrays"

patterns-established:
  - "Null-gated dual-hook routing: pair each data source with a null-gated counterpart; merge via ternary — no conditional hook call"
  - "NaPlaceholder reusable for any hourly/UV-dependent section that degrades on archive data"

requirements-completed: [DATA-04]

# Metrics
duration: 35min
completed: 2026-06-24
---

# Phase 10 Plan 04: Climate Selector UI Summary

**1YR/5YR/10YR pill selector in ClimateModule with dual null-gated hook routing, per-year extreme-count normalization, and explicit N/A degrade for all hourly/UV-dependent sections on ERA5 archive paths**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-24T08:30:00Z
- **Completed:** 2026-06-24T09:05:00Z
- **Tasks:** 3 (2 auto + 1 human-verify — PASSED)
- **Files modified:** 1

## Accomplishments

- YearSelector pill (1YR/5YR/10YR) pinned above all Climate sections; mirrors ModuleSheet pill styling; default 1YR
- Four unconditional null-gated hook calls (two useOpenMeteo + two useClimateArchive) — Rules-of-Hooks compliant; coords nulled for the inactive path
- `deriveOne(data, years)`: extreme-day counts divided by N on multi-year paths; rainSum/sunshineHours not re-divided (already normalized at source in Plan 02)
- N/A degrade: THERMAL MATRIX / HUMIDITY / UV INDEX replaced with NaPlaceholder; PEAK UV shows `--` / `N/A · ERA5` on 5/10YR
- Active-window subtitles (D-09): sections append ` · N-YR AVG` on multi-year; 01 ANNUAL READOUT subtitle becomes `N-YR AVG`
- CompareView: single shared YearSelector (D-10); ΔPEAK UV shows `--` / neutral; both compare panels degrade identically
- 1YR path byte-identical to pre-plan output; human-verify PASSED

## Task Commits

1. **Tasks 1+2: Dual-hook gating + pill + N/A degrade** — `8e5762a` (feat)

Note: Tasks 1 and 2 were committed atomically. Task 1 alone produced TS6133 errors (unused `years`/`onYearsChange` params, `noUnusedParameters: true`); Task 2 consumed them. Combined commit is the smallest unit where tsc exits 0.

**Plan metadata:** _(this commit — docs)_

## Files Created/Modified

- `src/components/modules/ClimateModule.tsx` — YearSelector + NaPlaceholder helpers; dual null-gated hook routing; deriveOne years param + extreme ÷N; full SingleView + CompareView N/A degrade and subtitle logic

## Decisions Made

1. **Tasks 1+2 committed together** — `noUnusedParameters: true` in tsconfig makes intermediate states (Task 1 complete, Task 2 not) non-compilable. Combined commit is the correct atomic unit.
2. **rainDays not fixed** — Carry-forward from Plan 02: `rainSum ÷ N` at source deflates the `>= 1mm` per-day rain-day threshold. Confirmed `rainDays` is never rendered in ClimateModule (grep: only appears in `MonthlyAggregate` type and `buildMonthlyAggregates` computation). No user-visible bug. Documented; not fixed here.
3. **useMemo deps include yearsValue** — Prevents stale ÷N normalization when user switches years while data is already loaded.
4. **CompareView ΔPEAK UV → '--' on 5/10YR** — `uvIndexMax: []` from archive means `peakUv()` returns `-Infinity`; delta math on two `-Infinity` values produces `NaN`. Show `--` / neutral tone instead of computing a meaningless delta.

## Deviations from Plan

None — plan executed exactly as written. Tasks 1+2 committed together rather than separately (see Decisions 1 above) — this is an execution detail, not a scope deviation.

## Known Stubs

| Field | File | Reason |
|-------|------|--------|
| `rainDays` count (MonthlyAggregate) | via `buildMonthlyAggregates` | `rainSum ÷ N` at source deflates the `>= 1mm` per-day threshold — counts undercount on 5/10yr paths. Not rendered anywhere in ClimateModule; invisible to user. Future plan may correct if rainDays is ever displayed. |

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- DATA-04 complete: 1YR/5YR/10YR climate selector is live; users see real ERA5 historical averages with honest N/A where archive lacks hourly/UV data
- Phase 10 is the final planned phase in the current roadmap — all four plans (10-01 through 10-04) are complete
- rainDays deflation is a known non-displayed limitation; if rainDays is ever surfaced in UI, fix at source in `useClimateArchive.ts` (pass raw precipitationSum separately and recompute rain-day count there)

---
*Phase: 10-marine-climate-selector*
*Completed: 2026-06-24*
