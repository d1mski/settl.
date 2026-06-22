---
phase: 08-overpass-expansion-bug-fixes
plan: 02
subsystem: overpass-pipeline
tags: [hazard, severity, context-chapter, proximity-bands, HAZ-03]
dependency_graph:
  requires: [08-01-hazard-category]
  provides: [hazard-proximity-severity, nearest-hazard-metric]
  affects: [overviewSeverity, ReportPanel, Context-StatusDot]
tech_stack:
  added: []
  patterns: [proximity-band-severity, hazard-filter-sort, muted-metric]
key_files:
  created: []
  modified:
    - src/utils/overviewSeverity.ts
    - src/components/shell/ReportPanel.tsx
decisions:
  - deriveContextSeverity now returns nearest hazard km as metric (not place count)
  - Alert band subtype literals are 'military' and 'wastewater' (exact match to categorise() output)
  - Watch band covers all hazard categories within 1km (not just military/wastewater)
  - nearestHazard computed in ReportPanel via inline filter+sort (not a helper) — matches plan spec
metrics:
  duration: 5m
  completed: 2026-06-22
  tasks_completed: 2
  files_modified: 2
---

# Phase 08 Plan 02: deriveContextSeverity Proximity-Band Logic + Nearest Hazard Metric

**One-liner:** Replaced the always-ok deriveContextSeverity stub with proximity-band logic (alert: military/wastewater ≤500m, watch: any hazard ≤1km) and added a Nearest hazard km metric row to the ReportPanel Context chapter.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Replace deriveContextSeverity stub with proximity-band logic | 887d9d7 | src/utils/overviewSeverity.ts |
| 2 | Add Nearest hazard metric to ReportPanel Context chapter | 297f8d0 | src/components/shell/ReportPanel.tsx |

## What Was Built

### HAZ-03: deriveContextSeverity Proximity Bands

- Replaced stub (`{ severity: 'ok', metric: \`${count}\`, unit: 'places' }`) with real logic
- Filters `state.data` to `f.category === 'hazard'`
- If no hazards → `{ severity: 'ok', metric: null }`
- Alert branch: `f.subtype === 'military' || f.subtype === 'wastewater'` AND `distanceKm <= 0.5`
- Watch branch: any hazard `distanceKm <= 1.0`
- Nearest hazard km returned as metric (e.g. `"0.8"` with unit `'km'`)
- Subtype literals match Plan 01 `categorise()` output exactly

### HAZ-03: Nearest Hazard Metric in ReportPanel

- `nearestHazard` computed via `featData.filter(f.category === 'hazard').sort(distanceKm)[0]`
- Metric value: `"${distanceKm.toFixed(1)} km"` when present, `"None"` when null
- `muted: nearestHazard === null` — styled via existing `text-muted` render path
- `Places nearby` metric preserved alongside new row
- Context chapter StatusDot was already wired to `deriveContextSeverity` at ReportPanel:126 — no wiring changes needed

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Both severity logic and metric display are fully wired to real Overpass hazard data.

## Verification Results

- Task 1 grep checks: all PASS (`f.category === 'hazard'`, `f.subtype === 'military' || f.subtype === 'wastewater'`, `distanceKm <= 0.5`, `distanceKm <= 1.0`, old stub gone)
- Task 2 grep checks: all PASS (`Nearest hazard`, `f.category === 'hazard'`, `muted: nearestHazard === null`)
- `npx tsc --noEmit`: exits 0, no errors
- `npm run build`: succeeds in 8.07s (chunk size warning pre-existing, unrelated)
