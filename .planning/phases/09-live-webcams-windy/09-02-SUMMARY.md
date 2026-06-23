---
phase: 09-live-webcams-windy
plan: 02
subsystem: hooks/data
tags: [webcams, windy, fetch-hook, abort-controller, in-memory-cache]
dependency_graph:
  requires: [src/utils/fetcher.ts, src/utils/coordinates.ts, src/types/index.ts]
  provides: [src/hooks/useWebcams.ts — useWebcams hook + WindyWebcam type]
  affects: [src/components/modules/ContextModule.tsx — consumed in plan 09-03]
tech_stack:
  added: []
  patterns: [AbortController + ModuleState, in-memory Map TTL, header auth fetchJson]
key_files:
  created: [src/hooks/useWebcams.ts]
  modified: []
decisions:
  - "location field made required (not optional) in WindyApiResponse to allow non-optional lat/lon access without tsc error — always present when include=location is passed"
  - "playerLiveUrl typed string | null and mapped via ?? null — absent on ~99% of tested cameras"
metrics:
  duration: 5m
  completed: "2026-06-23T11:07:31Z"
  tasks: 1
  files: 1
---

# Phase 09 Plan 02: useWebcams Hook Summary

**One-liner:** Windy V3 webcams fetch hook with x-windy-api-key header auth, 8-min in-memory Map TTL, and zero idb persistence (CAM-01 core requirement).

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create useWebcams.ts hook with in-memory TTL cache (no idb) | ee4bc0f | src/hooks/useWebcams.ts |

## Decisions Made

1. **`location` required in WindyApiResponse:** The plan typed `location` as optional, but `mapWebcam` accesses `w.location.latitude` non-optionally. Making it required is correct — `include=location` is always passed and the field is always present in live API responses. Typed as optional would have required null-guarding lat/lon with `?? 0` which produces garbage haversine distances. (Deviation Rule 1/3 — tsc gate fix.)

2. **`playerLiveUrl: string | null`:** Absent on ~99% of cameras per RESEARCH. Mapped via `w.player?.live ?? null`. Component (plan 09-03) should null-check before rendering live stream UI.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Made `location` required in internal WindyApiResponse type**
- **Found during:** Task 1, tsc analysis
- **Issue:** Plan specified `location?: { ... }` (optional), but `mapWebcam` uses `w.location.latitude` without optional chaining — tsc would error on "Object is possibly 'undefined'"
- **Fix:** Made `location` a required field in `WindyApiResponse['webcams'][number]`; justified by `include=location` always being passed and field confirmed always-present in live API
- **Files modified:** src/hooks/useWebcams.ts
- **Commit:** ee4bc0f

## Verification

- `npx tsc --noEmit` exits 0
- All 7 positive acceptance greps pass (useWebcams, WindyWebcam, x-windy-api-key, VITE_WINDY_KEY, TTL constant, daylight thumbnail, haversine)
- All 3 negative greps pass (no persistentCache, no cacheGet/cacheSet, no TTL. reference)

## Known Stubs

None — hook is data-only; no UI rendered in this plan.

## Self-Check: PASSED

- `src/hooks/useWebcams.ts` exists: FOUND
- Commit ee4bc0f exists: FOUND
