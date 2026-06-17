---
phase: 02-app-shell-state
plan: 01
subsystem: context-providers
tags: [theme, font-scale, fouc, context-api, persistence]
dependency_graph:
  requires: []
  provides: [ThemeContext, FontScaleContext, fouc-prevention]
  affects: [src/contexts/ThemeContext.tsx, src/contexts/FontScaleContext.tsx, index.html, src/main.tsx, src/App.tsx, src/components/shell/MapCanvas.tsx]
tech_stack:
  added: []
  patterns: [react-context, localStorage-persistence, os-preference-detection]
key_files:
  created:
    - src/contexts/ThemeContext.tsx
    - src/contexts/FontScaleContext.tsx
  modified:
    - index.html
    - src/main.tsx
    - src/App.tsx
    - src/components/shell/MapCanvas.tsx
    - src/components/shell/LocationIntelCard.tsx
decisions:
  - ThemeContext provides 3-state intent (light/system/dark) with resolved theme derived from OS preference
  - FontScaleContext uses rem-based scaling (not CSS zoom) to preserve map click accuracy
  - FOUC prevented via blocking inline script in index.html that reads localStorage before render
  - baseMap prop drilling removed from App.tsx; MapCanvas derives tile URL from ThemeContext
metrics:
  duration: 10m
  completed: 2026-06-17
  tasks: 2
  files: 7
---

# Phase 2 Plan 01: Context Providers + FOUC Prevention Summary

ThemeContext and FontScaleContext established as global state providers. FOUC prevention inline script added to index.html. App.tsx baseMap prop drilling removed; MapCanvas now derives tile URL from theme context.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create context providers, FOUC script, wire in main.tsx | 91dcf65 | ThemeContext.tsx, FontScaleContext.tsx, index.html, main.tsx |
| 2 | Refactor App.tsx and MapCanvas to consume context | d23a44e | App.tsx, MapCanvas.tsx, LocationIntelCard.tsx |

## Decisions Made

- 3-state theme (light/system/dark) with OS preference detection via `matchMedia`
- rem-based font scaling (not CSS zoom) to preserve Leaflet map accuracy
- Blocking inline `<script>` in index.html reads localStorage before first paint

## Deviations from Plan

None.

## Known Stubs

None.

## Self-Check: PASSED

- ThemeContext.tsx created — confirmed
- FontScaleContext.tsx created — confirmed
- Commit 91dcf65 exists (Task 1)
- Commit d23a44e exists (Task 2)
