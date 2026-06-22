---
phase: 08-overpass-expansion-bug-fixes
plan: 03
subsystem: ui
tags: [tailwind, responsive, mobile, layout, flex, App.tsx, ModuleSheet]

# Dependency graph
requires:
  - phase: 08-overpass-expansion-bug-fixes
    provides: Overpass query fixes, hazard label/scoring fixes already applied in plans 01 and 02
provides:
  - Responsive flex layout (h-[100dvh], flex-col lg:flex-row min-h-0) in App.tsx
  - HUD cards moved out of the map box — direct inner-row child, stacks below map on mobile
  - ModuleSheet full-width on mobile (w-full lg:w-[560px])
affects: [phase-09-windy-webcam, any future layout changes to App.tsx or ModuleSheet]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "h-[100dvh] root (not h-screen) — avoids mobile browser chrome clipping"
    - "flex-col lg:flex-row min-h-0 on the inner row — allows flex children to shrink below content size"
    - "lg:absolute on HUD cards wrapper anchored to the relative inner row — floats over map on desktop, stacks below on mobile"

key-files:
  created: []
  modified:
    - src/App.tsx
    - src/components/shell/ModuleSheet.tsx

key-decisions:
  - "HUD cards block moved to be a direct child of the inner flex row (after map-area div, before ModuleSheet) — class-only change cannot stack cards below map on mobile because the cards were nested inside the 45vh map box"
  - "h-[100dvh] replaces h-screen — 100dvh adjusts for mobile browser chrome; 100vh clips"
  - "min-h-0 is mandatory on the inner flex row — without it flex children inherit min-height:auto and cannot shrink"

patterns-established:
  - "Responsive layout: outer h-[100dvh] flex-col root, inner flex-col lg:flex-row min-h-0 row"
  - "Mobile map height locked at h-[45vh] lg:h-auto lg:flex-1 shrink-0"

requirements-completed: [FIX-01]

# Metrics
duration: ~20min (code tasks; visual verification PENDING)
completed: 2026-06-22
---

# Phase 08 Plan 03: Responsive Mobile Layout (FIX-01) Summary

**Responsive layout with h-[100dvh] root, HUD cards moved out of the map box, and ModuleSheet full-width on mobile — desktop side-by-side layout unchanged**

## Performance

- **Duration:** ~20 min (code tasks only — visual verification DEFERRED by user to end of phase)
- **Started:** 2026-06-22
- **Completed:** 2026-06-22 (code tasks); visual check PENDING
- **Tasks:** 2 of 3 code tasks complete; Task 3 (human-verify) DEFERRED
- **Files modified:** 2

## Accomplishments

- Replaced `h-screen overflow-hidden` root with `h-[100dvh]` (no overflow-hidden), eliminating mobile browser chrome clipping
- Moved HUD cards block out of the map-area div; now a direct child of the inner row — cards stack below the map on mobile instead of overlapping it
- Inner row changed to `flex-col lg:flex-row min-h-0` with `relative` kept — enables column-to-row responsive transition and correct flex shrink behaviour
- Map area fixed at `h-[45vh]` on mobile, `lg:flex-1` on desktop
- HUD cards wrapper: `lg:absolute lg:top-6 lg:bottom-14 lg:left-6 z-30 w-full lg:w-[360px]` — floats over map on desktop, full-width static below map on mobile
- ModuleSheet `aside` changed from `w-[560px]` to `w-full lg:w-[560px]` — panel is full-width on mobile
- TypeScript: `npx tsc --noEmit` exits 0 (no regressions)

## Task Commits

1. **Task 1: Responsive layout + move HUD cards out of map box (App.tsx)** — `7b78b66` (feat)
2. **Task 2: Responsive ModuleSheet width** — `6fc9e79` (feat)
3. **Task 3: Verify mobile layout renders correctly** — DEFERRED (human-verify checkpoint; no commit)

## Files Created/Modified

- `src/App.tsx` — h-[100dvh] root, flex-col lg:flex-row min-h-0 inner row, h-[45vh] map area, HUD cards moved to inner-row child
- `src/components/shell/ModuleSheet.tsx` — aside width changed to w-full lg:w-[560px]

## Decisions Made

- HUD cards DOM move was required (not class-only): cards were nested inside the 45vh map box; `lg:absolute` alone would still overlap the map canvas on mobile
- `h-[100dvh]` chosen over `h-screen` — `100dvh` dynamically adjusts for mobile browser toolbars
- `min-h-0` added to inner flex row — mandatory for flex children to shrink below content size

## Deferred Items

### Task 3: Mobile Visual Verification — PENDING / DEFERRED BY USER

The user has explicitly deferred the visual/responsive check to the end of Phase 08. The code changes are complete and TypeScript is clean, but the mobile rendering has NOT been visually confirmed.

**Verification steps to complete before Phase 08 closes:**

1. Run `npm run dev` and open the app in a browser.
2. Open devtools → toggle device toolbar (responsive mode) → set viewport to ~390px wide (mobile).
3. Confirm stack order top-to-bottom: **map (~45% height)** → **LocationIntel/Building/Risk cards (full width, NOT overlapping the map)** → **ModuleSheet panel (full width)**.
4. Scroll the panel content — confirm Overview chapters are all reachable, nothing cut off at the bottom.
5. Confirm cards do NOT overlap the map and do NOT spill onto the panel.
6. Resize to ≥1024px (desktop): confirm original side-by-side layout returns — map left (flex-1), 560px panel right, floating cards absolutely positioned top-left OVER the map.
7. On mobile, scroll the whole page top-to-bottom: no unreachable content, no horizontal scrollbar.

**Resume signal (when tested):** Type "approved" if mobile stacks map → cards → panel with no overlap and scrolls, and desktop is unchanged; otherwise describe what clips or overlaps.

## Deviations from Plan

None — plan executed exactly as written. The deferred human-verify checkpoint is user-directed, not a deviation from implementation.

## Issues Encountered

None — both code tasks applied cleanly; tsc exits 0.

## Known Stubs

None.

## Next Phase Readiness

- FIX-01 code changes are complete and type-safe
- Mobile visual verification (Task 3) must be completed before Phase 08 can be fully closed — user will test at end of phase
- Phase 09 (Windy/webcam) has no dependency on FIX-01 — unblocked

---

*Phase: 08-overpass-expansion-bug-fixes*
*Completed: 2026-06-22*
