---
phase: 07-zero-risk-data-additions-pollen-flood
plan: "02"
subsystem: flood-data-layer
tags: [flood, glofas, hooks, severity, not-applicable, open-meteo]
dependency_graph:
  requires: []
  provides: [useFlood hook, FloodSample type, TTL.openMeteoFlood, not-applicable severity, deriveFloodSeverity]
  affects: [src/utils/overviewSeverity.ts, src/utils/persistentCache.ts, src/hooks/useFlood.ts]
tech_stack:
  added: []
  patterns: [in-memory+persistent dual cache, not-applicable sentinel string, AbortController pattern, absolute discharge bands]
key_files:
  created:
    - src/hooks/useFlood.ts
  modified:
    - src/utils/persistentCache.ts
    - src/utils/overviewSeverity.ts
decisions:
  - Desert pins (HTTP 200, all-zero discharge) and ocean pins (HTTP 200, all-null) both resolve to notApplicable=true — never a false green OK
  - Absolute severity bands 500/2000 m³/s — p25/p75 not used (they equal river_discharge on past reanalysis days)
  - FloodSample type lives inside useFlood.ts, not types/index.ts — keeps plans 07-01 and 07-02 parallel-safe
  - SEVERITY_TONE satisfies clause uses Exclude<OverviewSeverity, 'unavailable'> to avoid requiring a tone for unavailable
  - notApplicableCache Set separate from data Map — null ambiguity avoided by keeping not-applicable as a named sentinel
metrics:
  duration: "~6 minutes"
  completed: "2026-06-22T11:30:07Z"
  tasks_completed: 3
  files_modified: 3
---

# Phase 07 Plan 02: Flood Data Layer Summary

**One-liner:** GloFAS river discharge hook with dual all-zero/all-null not-applicable guard, absolute 500/2000 m³/s severity bands, and muted N/A neutral state.

## What Was Built

Three atomic changes forming the complete flood data layer:

1. **TTL.openMeteoFlood** (6h) added to `persistentCache.ts` — GloFAS reanalysis updates daily, 6h is appropriate.

2. **`src/hooks/useFlood.ts`** — New hook mirroring `useAirQuality.ts` exactly:
   - Fetches `https://flood-api.open-meteo.com/v1/flood` with `past_days=92`
   - In-memory `Map<string, FloodSample[]>` + persistent IndexedDB cache via `cacheGet/cacheSet`
   - Dual not-applicable guard: `discharge.every(v => v === null || v === 0)` catches both desert (all-zeros) and ocean (all-nulls) cases
   - Separate `notApplicableCache: Set<string>` sentinel — prevents null ambiguity with real empty data
   - Stores `'not-applicable'` string literal in persistent cache so guard survives page reload
   - Returns `ModuleState<FloodSample[]> & { notApplicable: boolean }`
   - DOMException/AbortError early return; no HTTP 400 handling (GloFAS returns 200 for all coverage gaps)

3. **`src/utils/overviewSeverity.ts`** — Three edits:
   - `OverviewSeverity` union extended with `'not-applicable'`
   - `SEVERITY_TONE['not-applicable'] = 'muted'` (StatusDot `tone='muted'` already existed at #6a768b)
   - `satisfies` clause changed to `Record<Exclude<OverviewSeverity, 'unavailable'>, ...>` — avoids demanding a tone for `'unavailable'`
   - `deriveFloodSeverity(state, notApplicable)` added with 500/2000 m³/s absolute bands and empty-discharge guard

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | bfb8503 | chore(07-02): add TTL.openMeteoFlood constant (6h) |
| Task 2 | f72b450 | feat(07-02): create useFlood hook with not-applicable guard |
| Task 3 | 31d1492 | feat(07-02): extend OverviewSeverity with not-applicable + deriveFloodSeverity |

## Deviations from Plan

None — plan executed exactly as written. The verified implementation from 07-RESEARCH.md was used verbatim for useFlood.ts.

## Known Stubs

None. This is a data layer only — no UI rendering. Plan 07-03 wires flood into ReportPanel's Hazards chapter.

## Self-Check: PASSED

- `src/hooks/useFlood.ts` — FOUND
- `src/utils/persistentCache.ts` contains `openMeteoFlood` — FOUND
- `src/utils/overviewSeverity.ts` contains `deriveFloodSeverity` — FOUND
- Commit bfb8503 — FOUND
- Commit f72b450 — FOUND
- Commit 31d1492 — FOUND
- `npx tsc --noEmit` exits 0 — PASS
- `grep -c FloodSample src/types/index.ts` returns 0 — PASS (no type leak)
