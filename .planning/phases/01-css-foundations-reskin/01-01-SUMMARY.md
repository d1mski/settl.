---
phase: 01-css-foundations-reskin
plan: 01
subsystem: css-tokens
tags: [css, tailwind, leaflet, hud-removal, tokens]
dependency_graph:
  requires: []
  provides: [borderRadius-tokens, shadow-panel-utilities, clean-index-css]
  affects: [src/index.css, tailwind.config.js]
tech_stack:
  added: []
  patterns: [css-variable-theming, tailwind-extend-tokens]
key_files:
  created: []
  modified:
    - src/index.css
    - tailwind.config.js
decisions:
  - Tooltip arrows use 4-direction ::before rules (top/bottom/left/right) instead of single generic :before — correct approach for Leaflet's direction-specific arrow rendering
  - shadow-panel values retain cyan ring color unchanged — color update deferred to Plan 02 component pass if needed
metrics:
  duration: 6m
  completed: 2026-06-17
  tasks: 2
  files: 2
---

# Phase 1 Plan 01: CSS Foundations & HUD Removal Summary

Clean CSS token layer established: all HUD decorative blocks removed from index.css, Leaflet overrides updated with rounded corners and 4-direction tooltip arrows, Tailwind config extended with borderRadius tokens and shadow-panel utilities.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Strip HUD decorative CSS and update Leaflet overrides | 96db2b2 | src/index.css |
| 2 | Add borderRadius tokens and rename shadow utilities | 940cad9 | tailwind.config.js |

## Decisions Made

- 4-direction tooltip arrow rules (`leaflet-tooltip-top/bottom/left/right::before`) replace single generic `:before` — required for correct color on all arrow orientations
- `shadow-panel` value retains existing cyan ring; Plan 02 can adjust if components need neutral ring

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Both files are fully wired; no placeholder values flow to UI rendering.

## Self-Check: PASSED

- `src/index.css` modified — confirmed present
- `tailwind.config.js` modified — confirmed present
- Commit 96db2b2 exists (Task 1)
- Commit 940cad9 exists (Task 2)
