---
phase: 02-app-shell-state
plan: "02"
subsystem: shell-ui
tags: [theme, font-scale, ui-controls, cleanup]
dependency_graph:
  requires: [02-01]
  provides: [theme-toggle-ui, font-scale-ui]
  affects: [LocationIntelCard, MapCanvas]
tech_stack:
  added: []
  patterns: [context-consumer, no-props-component]
key_files:
  created: []
  modified:
    - src/components/shell/LocationIntelCard.tsx
    - src/components/shell/MapCanvas.tsx
decisions:
  - "ThemeToggle and FontScaleControl are zero-prop components — all state from context"
  - "Controls placed inline with EXEC button in flex gap-2 container"
  - "BaseMap type fully removed from MapCanvas — no longer needed anywhere"
metrics:
  duration: ~8m
  completed: "2026-06-17"
  tasks: 1
  files: 2
---

# Phase 02 Plan 02: Theme Toggle + Font Scale UI Summary

3-state theme segmented control (Light/System/Dark) and A-/A+ font scale controls wired to ThemeContext and FontScaleContext, replacing 2-state prop-drilled BaseMap toggle.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Replace ThemeToggle + add FontScaleControl | e38d2e7 | LocationIntelCard.tsx, MapCanvas.tsx |

## What Was Built

- `ThemeToggle()` — zero-prop component, reads `useTheme()`, renders 3-button segmented control with sun/monitor/moon SVG icons. Active state: `bg-cyan/15 text-cyan`. Inactive: `bg-void text-muted`.
- `FontScaleControl()` — zero-prop component, reads `useFontScale()`, renders A- | 100% | A+ with disabled states at 0.8 and 1.4 boundaries.
- Both components placed in `<div className="flex items-center gap-2">` container inline with the EXEC button in LocationIntelCard.
- `export type BaseMap` removed from MapCanvas.tsx — no remaining consumers.
- `baseMap` and `onBaseMapChange` props fully removed from LocationIntelCard interface and destructuring.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both controls are fully wired to live context state.

## Verification

- `npx tsc --noEmit` — exit 0
- `npm run build` — exit 0, built in 7.33s
- No `BaseMap`, `baseMap`, or `onBaseMapChange` strings remain in src/

## Self-Check: PASSED

- `src/components/shell/LocationIntelCard.tsx` — modified, committed e38d2e7
- `src/components/shell/MapCanvas.tsx` — modified, committed e38d2e7
- Commit e38d2e7 exists in git log
