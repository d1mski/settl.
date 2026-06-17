---
phase: 01-css-foundations-reskin
plan: 02
subsystem: ui-components
tags: [reskin, rounded-corners, hud-removal, panel, maphud, modulesheet, riskpanel]
dependency_graph:
  requires: [01-01]
  provides: [clean-panel-api, no-hud-decorations, rounded-ui]
  affects: [Panel, MapHud, ModuleSheet, RiskPanel, App]
tech_stack:
  added: []
  patterns: [rounded-lg, rounded-md, rounded-l-lg, shadow-panel-strong]
key_files:
  created: []
  modified:
    - src/components/hud/Panel.tsx
    - src/components/shell/MapHud.tsx
    - src/components/shell/ModuleSheet.tsx
    - src/components/hud/RiskPanel.tsx
    - src/App.tsx
decisions:
  - Removed brackets prop entirely from Panel API rather than deprecating — no callers needed it after reskin
  - MapHud simplified to compareMode+activeSlot only — coordsA/coordsB were unused inside component
metrics:
  duration: ~10min
  completed: 2026-06-17
  tasks_completed: 3
  files_modified: 5
---

# Phase 1 Plan 02: HUD Decoration Removal + Rounded Corners Summary

Removed all HUD bracket/reticle decorations from Panel, MapHud, ModuleSheet, and RiskPanel; applied 01-01 CSS tokens (rounded-lg, rounded-md, shadow-panel-strong) to all five components.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Remove brackets from Panel.tsx, add rounded-lg | 91c465b | Panel.tsx |
| 2 | Remove corner brackets + reticle from MapHud, update App.tsx | b8d20d2 | MapHud.tsx, App.tsx |
| 3 | Rounded corners + shadow rename in ModuleSheet and RiskPanel | e27a3f6 | ModuleSheet.tsx, RiskPanel.tsx |

## Verification Results

- `npx tsc --noEmit` — PASSED (no output = no errors)
- `grep shadow-hud src/` — 0 matches
- `grep bg-scan-line src/` — 0 matches
- `grep hud-brackets src/` — 0 matches
- `grep bracket src/components/hud/Panel.tsx` — 0 matches

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- src/components/hud/Panel.tsx — FOUND
- src/components/shell/MapHud.tsx — FOUND
- src/components/shell/ModuleSheet.tsx — FOUND
- src/components/hud/RiskPanel.tsx — FOUND
- src/App.tsx — FOUND
- Commits 91c465b, b8d20d2, e27a3f6 — all present in git log
