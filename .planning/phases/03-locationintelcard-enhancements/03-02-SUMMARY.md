---
phase: 03-locationintelcard-enhancements
plan: "02"
subsystem: SectionHeader / LocationIntelCard
tags: [ui-cleanup, section-codes, typography]
dependency_graph:
  requires: [03-01]
  provides: [clean-section-labels]
  affects: [src/components/hud/SectionHeader.tsx, src/components/shell/LocationIntelCard.tsx, src/components/shell/ModuleSheet.tsx]
tech_stack:
  added: []
  patterns: [optional-prop-for-backward-compat]
key_files:
  created: []
  modified:
    - src/components/hud/SectionHeader.tsx
    - src/components/shell/LocationIntelCard.tsx
    - src/components/shell/ModuleSheet.tsx
    - src/components/shell/BuildingCard.tsx
decisions:
  - code prop made optional (not removed) so all 6 module callers compile without changes
  - ModuleSheet view prop aliased to _view to suppress TS6133 without removing the reserved prop
metrics:
  duration: 5m
  completed: "2026-06-18"
  tasks_completed: 2
  files_modified: 4
---

# Phase 03 Plan 02: Section Code Removal Summary

**One-liner:** Removed all §XX section codes from SectionHeader component and LocationIntelCard inline labels, leaving plain-English titles only.

## What Was Built

- **SectionHeader.tsx** — `code` prop changed from required to optional (`code?: string`), entire `§{code}` span element removed. Component now renders title + optional subtitle + horizontal rule only. All 6 module callers (AirQuality, Wind, Context, Sun, Climate, Hazards) pass `code` unchanged — accepted and silently ignored.
- **LocationIntelCard.tsx** — `§01 · INPUT` label simplified to `INPUT`. `§02 · {label}` in FixBlock simplified to `{label}`.
- **ModuleSheet.tsx** (deviation fix) — `view` prop aliased to `_view` to suppress pre-existing TS6133 error that blocked `npm run build`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing TS6133 in ModuleSheet.tsx blocking build**
- **Found during:** Task 1 build verification
- **Issue:** `src/components/shell/ModuleSheet.tsx(56,79): error TS6133: 'view' is declared but its value is never read.` caused `npm run build` to exit with code 1
- **Fix:** Aliased `view` to `_view` in destructuring — preserves the prop in the interface for Phase 6 callers, suppresses TS unused-variable error
- **Files modified:** src/components/shell/ModuleSheet.tsx
- **Commit:** 3fb5bab

**2. [Checkpoint Fix] Theme/font controls blocking input width**
- **Found during:** Task 2 human verification
- **Issue:** ThemeToggle + FontScaleControl in input row stole address bar width
- **Fix:** Moved controls out of input row
- **Files modified:** src/components/shell/LocationIntelCard.tsx
- **Commit:** 441603b

**3. [Checkpoint Fix] Section codes missed in ModuleSheet, BuildingCard**
- **Found during:** Task 2 human verification
- **Issue:** ModuleSheet header, BuildingCard header still had § codes
- **Fix:** Removed § prefix and unused MODULE_CODES constant
- **Files modified:** ModuleSheet.tsx, BuildingCard.tsx
- **Commit:** 441603b

## Self-Check: PASSED

- Zero § characters in src/ (verified via grep)
- Input row: [GPS] [input] [GO] only — full width restored
- Build + typecheck pass clean
- Commits: 3fb5bab, 441603b
