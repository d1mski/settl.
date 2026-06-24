---
phase: 10-marine-climate-selector
plan: 02
subsystem: api
tags: [open-meteo, era5, climate, hooks, typescript]

# Dependency graph
requires:
  - phase: 10-marine-climate-selector-plan-01
    provides: useMarine hook pattern (Semaphore, inflight map, in-memory cache)
provides:
  - useClimateArchive(coords, 5|10) → ModuleState<ClimateData> — ERA5 archive daily fetch with N-year normalization
  - useOpenMeteo KEY_VERSION v8 + inert _years: 1 = 1 param for Plan 04 routing symmetry
affects: [10-03, 10-04, climate-module, wind-module]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "archive-api.open-meteo.com daily-only fetch (no hourly, no models param, no uv_index_max)"
    - "N-year normalization at source: divide display-sum fields by years before bucketing"
    - "era5v1| cache key prefix — independent of KEY_VERSION used by useOpenMeteo"

key-files:
  created:
    - src/hooks/useClimateArchive.ts
  modified:
    - src/hooks/useOpenMeteo.ts

key-decisions:
  - "Used _years (underscore prefix) instead of years in useOpenMeteo signature — noUnusedParameters is on in tsconfig; _view precedent already in project"
  - "precipitationSum passes through raw — countExtremeDays >20mm threshold; dividing would undercount heavy-rain days"
  - "rainSum divided by N at source (per plan must_have) — known limitation: deflates rainDays count (>= 1mm threshold fails for N=5/10); to be corrected in Plan 04"
  - "uvIndexMax: [] — ERA5 archive returns all null for uv_index_max; not requested"
  - "Empty HourlyWeather — daily-only avoids 7.4MB payload; thermal-matrix and humidity degrade in Plan 04"
  - "ARCHIVE_KEY_VERSION = 'era5v1' independent of KEY_VERSION so cache namespaces never collide"

patterns-established:
  - "Archive hook clones useOpenMeteo structure: Semaphore(2), inflight Map, in-memory + idb cache, fetchWithBackoff 429-retry, AbortController useEffect cleanup"

requirements-completed: [DATA-04]

# Metrics
duration: 20min
completed: 2026-06-24
---

# Phase 10 Plan 02: Climate Archive Hook Summary

**useClimateArchive hook hitting ERA5 archive-api.open-meteo.com for 5/10-year daily averages, returning ModuleState<ClimateData> with sum fields ÷N so existing buildMonthlyAggregates yields per-year averages; KEY_VERSION bumped v7→v8**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-24T07:25:00Z
- **Completed:** 2026-06-24T07:45:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- New `useClimateArchive(coords: Coordinates | null, years: 5 | 10)` hook — daily-only ERA5 fetch, Semaphore(2), 30-day idb cache, AbortController cleanup, refetches on years change
- N-year normalization: rainSum, snowfallSum, sunshineDuration, precipitationHours divided by years before returning; precipitationSum passes through raw
- `useOpenMeteo` KEY_VERSION v7→v8 (cache invalidation) + inert `_years: 1 = 1` optional param added for Plan 04 routing symmetry
- tsc exits 0 on both changes; all existing callers compile unchanged

## Task Commits

1. **Task 1: useOpenMeteo KEY_VERSION v8 + inert _years param** — `3a2991a` (feat)
2. **Task 2: useClimateArchive hook** — `2bfad0b` (feat)

## Files Created/Modified

- `src/hooks/useClimateArchive.ts` — ERA5 archive hook: daily-only fetch, N-year normalization, empty hourly, Semaphore(2), 30d cache
- `src/hooks/useOpenMeteo.ts` — KEY_VERSION v8, `_years: 1 = 1` param added to signature

## Decisions Made

- `_years` (underscore prefix) in useOpenMeteo — `noUnusedParameters: true` in tsconfig would cause tsc TS6133 with bare `years`; project already uses `_view` precedent; Plan 04 doesn't pass the param so name is purely documentary
- `precipitationSum` not divided — `countExtremeDays` tests each raw day value against `>20mm`; dividing by N would deflate real wet days below the threshold
- `rainSum` divided per plan must_have — see Known Stubs below for resulting rainDays limitation
- `ARCHIVE_KEY_VERSION = 'era5v1'` independent prefix — new hook, no stale era5 entries; never conflicts with `KEY_VERSION` used by useOpenMeteo

## Deviations from Plan

None — plan executed as written. One constraint conflict discovered and documented:

**Noted conflict (no auto-fix — requires Plan 04 decision):**
- Plan's must_have mandates dividing `rainSum` for display-chart correctness
- `buildMonthlyAggregates` also uses `rainSum[i] >= 1` as a per-day rain-day threshold
- With `rainSum ÷ N`, the effective threshold becomes `rawRain >= N mm`, so rain-day counts are deflated for 5/10yr averages
- Implemented per plan; documented as Known Limitation below

## Known Stubs

| Field | File | Reason |
|-------|------|--------|
| `rainDays` count (MonthlyAggregate) | `src/hooks/useClimateArchive.ts` (all, via `buildMonthlyAggregates`) | `rainSum ÷ N` at source deflates the `>= 1mm` per-day threshold — rain-day counts undercount for 5/10yr paths. Plan 04 must correct (e.g. recompute from raw `precipitationSum`, or apply ÷N to aggregated counts). |

## Issues Encountered

- `noUnusedParameters: true` in tsconfig.json would have caused TS6133 on `years: 1 = 1` as planned. Resolved by prefixing `_years` (project convention; precedent: `_view` in ModuleSheet). No behavior change.

## Next Phase Readiness

- Plan 03 (ClimateSelector UI) can proceed — it wires useClimateArchive/useOpenMeteo based on years selection
- Plan 04 must handle: rainDays ÷N correction, uvIndexMax/hourly N/A degradation, extreme-day counts ÷N
- All existing callers of useOpenMeteo unaffected — still compile and behave identically

---
*Phase: 10-marine-climate-selector*
*Completed: 2026-06-24*
