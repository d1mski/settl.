---
phase: 04-saved-locations
plan: 01
subsystem: ui
tags: [react, localstorage, hooks]

requires:
  - phase: 02-app-shell-state
    provides: LocationIntelCard component, Coordinates type, onChangeA prop
provides:
  - SavedLocation type in types/index.ts
  - useSavedLocations hook with toggle/remove/isSaved/locations
  - Heart toggle UI and saved locations list in LocationIntelCard
affects: []

tech-stack:
  added: []
  patterns: [localStorage hook with try/catch, lazy useState initializer]

key-files:
  created: [src/hooks/useSavedLocations.ts]
  modified: [src/types/index.ts, src/components/shell/LocationIntelCard.tsx, src/components/shell/MapCanvas.tsx]

key-decisions:
  - "ID format: lat.toFixed(5),lon.toFixed(5) — deterministic, no UUID needed"
  - "localStorage key: settl-saved-locations-v1 — versioned for future schema migration"
  - "10-item cap with synchronous rejection return from toggle()"
  - "Inline SVG hearts instead of icon library — two small paths, no dependency"

patterns-established:
  - "localStorage hook pattern: STORAGE_KEY const, load/persist helpers with try/catch, lazy useState"

requirements-completed: [FEAT-03]

duration: ~8min
completed: 2026-06-18
---

# Phase 4: Saved Locations Summary

**Heart toggle + localStorage-backed saved locations list with one-click map restore and 10-item cap**

## Performance

- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 4

## Accomplishments
- SavedLocation type and useSavedLocations hook with localStorage persistence
- Heart toggle in LocationIntelCard — rose filled when saved, outline when not
- Saved locations list with click-to-restore (calls onChangeA) and hover X to remove
- 10-item cap with "MAX 10 REACHED" auto-dismissing warning
- Fixed FitToCoords to pan map on coordinate changes (not just null-to-value)

## Task Commits

1. **Task 1: SavedLocation type + useSavedLocations hook** - `0e6a165` (feat)
2. **Task 2: Heart toggle + saved list in LocationIntelCard** - `dcb6c68` (feat)
3. **Task 3: Human verification** - approved, fix committed as `47bc085` (fix)

## Files Created/Modified
- `src/types/index.ts` - Added SavedLocation interface
- `src/hooks/useSavedLocations.ts` - localStorage-backed hook with toggle/remove/isSaved
- `src/components/shell/LocationIntelCard.tsx` - Heart toggle button and saved locations list
- `src/components/shell/MapCanvas.tsx` - Removed justAdded guard so map pans on saved location click

## Decisions Made
- Used inline SVG hearts instead of adding icon dependency
- Heart disabled while reverse geocode resolving (prevents saving with empty label)
- Remove button hidden by default, shown on hover (group-hover pattern)

## Deviations from Plan

### Auto-fixed Issues

**1. Map not re-centering on saved location click**
- **Found during:** Task 3 (human verification)
- **Issue:** FitToCoords only panned when coords went null-to-value (justAdded guard). Saved location clicks change value-to-value.
- **Fix:** Removed justAdded guard, kept bounds check
- **Files modified:** src/components/shell/MapCanvas.tsx
- **Verification:** User confirmed map re-centers on saved location click
- **Committed in:** 47bc085

---

**Total deviations:** 1 auto-fixed
**Impact on plan:** Essential for saved location restore UX. No scope creep.

## Issues Encountered
None beyond the map re-center fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Saved locations complete, ready for Phase 5 (ModuleRail + Lucide Icons) or Phase 6
- No blockers

---
*Phase: 04-saved-locations*
*Completed: 2026-06-18*
