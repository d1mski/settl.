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
decisions:
  - code prop made optional (not removed) so all 6 module callers compile without changes
  - ModuleSheet view prop aliased to _view to suppress TS6133 without removing the reserved prop
metrics:
  duration: 5m
  completed: "2026-06-18"
  tasks_completed: 1
  files_modified: 3
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

## Known Stubs

None.

## Self-Check: PASSED

- src/components/hud/SectionHeader.tsx — FOUND, contains `code?: string`, no `§` character
- src/components/shell/LocationIntelCard.tsx — FOUND, no `§01`, no `§02`
- src/components/shell/ModuleSheet.tsx — FOUND, `_view` alias present
- Commit 3fb5bab — FOUND
- Build exit code 0 — CONFIRMED
