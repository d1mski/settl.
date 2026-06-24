---
phase: 10-marine-climate-selector
plan: "01"
subsystem: marine-data-layer
tags: [marine, hook, component, open-meteo, caching]
dependency_graph:
  requires: []
  provides: [useMarine, MarineModule, TTL.marineConditions]
  affects: [Plan 03 tab wiring, Plan 03 coastal gate]
tech_stack:
  added: []
  patterns: [in-memory TTL Map, in-flight dedup via shared promise, SingleView-only module]
key_files:
  created:
    - src/hooks/useMarine.ts
    - src/components/modules/MarineModule.tsx
  modified:
    - src/utils/persistentCache.ts
decisions:
  - useMarine uses in-memory Map for both cache and inflight dedup — no idb (current conditions; stale sea state across sessions is misleading)
  - sharedFetch does not accept the caller's AbortSignal — passing it would cause one unmounting caller to abort concurrent callers' in-flight request
  - MarineData.isCoastal derived from null-check on response body, NOT HTTP status — inland returns HTTP 200 with nulls (verified live)
  - TONE mapping uses 'neutral' (not 'unavailable') for StatReadout since tone union only accepts neutral/good/warn/risk/cyan/amber
metrics:
  duration: "~15m"
  completed: "2026-06-24"
  tasks: 3
  files: 3
---

# Phase 10 Plan 01: Marine Data Layer Summary

**One-liner:** `useMarine` hook with null-value coastal detection, 15-min in-memory cache, and concurrent-request dedup feeding a SingleView `MarineModule` showing WMO sea-state badge + wave height + SST stat cards.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | useMarine hook — coastal detection + in-flight dedup | 1595869 | src/hooks/useMarine.ts |
| 2 | MarineModule — badge + 2 cards + WMO legend + LIVE label | c203727, b88307f | src/components/modules/MarineModule.tsx |
| 3 | Add TTL.marineConditions cache entry | 9a9594b | src/utils/persistentCache.ts |

## Decisions Made

1. **sharedFetch owns no external AbortSignal** — hook's `controllerRef` gates the post-await `setState` only; the shared fetch runs to completion (or times out internally). This guarantees one unmounting caller cannot abort another's in-flight request.

2. **Coastal detection = null-check on body, not HTTP status** — both coastal (Cornwall) and inland (Munich) return HTTP 200; inland values are `null`. Gate is `waveHeight !== null || seaSurfaceTemp !== null`.

3. **No idb persistence** — marine conditions (waves, SST) are current-state data; stale values across sessions would be misleading. In-memory Map mirrors the `useWebcams` pattern.

4. **TONE map uses StatReadout's accepted union** — `WmoSeverity` includes `'unavailable'` but StatReadout's `tone` prop only accepts `neutral/good/warn/risk/cyan/amber`; mapped to `'neutral'` for the unavailable case.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — `useMarine` fetches live data; `MarineModule` renders it directly.

## Self-Check

**Created files exist:**
- FOUND: src/hooks/useMarine.ts
- FOUND: src/components/modules/MarineModule.tsx

**Modified file:**
- FOUND: src/utils/persistentCache.ts (marineConditions: entry confirmed)

**Commits exist:**
- FOUND: 1595869 feat(10-01): useMarine hook
- FOUND: c203727 feat(10-01): MarineModule
- FOUND: 9a9594b chore(10-01): TTL.marineConditions

**tsc --noEmit:** PASSED (0 errors)

**All 23 acceptance criteria:** PASSED

## Self-Check: PASSED
