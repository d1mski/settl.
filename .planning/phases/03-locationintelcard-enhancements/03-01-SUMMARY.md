---
phase: 03-locationintelcard-enhancements
plan: "01"
subsystem: LocationIntelCard / useNominatim
tags: [geocoding, geolocation, autocomplete, keyboard-nav, GPS]
dependency_graph:
  requires: []
  provides: [GPS-button, debounced-autocomplete, keyboard-nav, click-outside-dismiss]
  affects: [src/components/shell/LocationIntelCard.tsx, src/hooks/useNominatim.ts]
tech_stack:
  added: [lucide-react (Crosshair, MapPin icons)]
  patterns: [debounced-onChange, click-outside-mousedown, AbortController-per-request, fixStatus-state-machine]
key_files:
  created: []
  modified:
    - src/components/shell/LocationIntelCard.tsx
    - src/hooks/useNominatim.ts
decisions:
  - GPS button is click-only — no autofire on mount (navigator.geolocation.getCurrentPosition inside onClick handler)
  - 400ms debounce chosen per Nominatim rate-limit policy (D-14)
  - 3-char minimum guard prevents unnecessary API calls on short inputs
  - AbortController aborted inside debounce callback (not before setTimeout) to avoid aborting the previous pending request prematurely
  - fixStatus state machine drives GPS button color and inline status text
  - Dropdown uses bg-void/border-edge (existing project classes) since bg-srf/bdr-h not in Tailwind config
metrics:
  duration: 12m
  completed: "2026-06-18"
  tasks_completed: 1
  files_modified: 2
---

# Phase 03 Plan 01: GPS Button + Debounced Autocomplete Summary

**One-liner:** GPS geolocation button with click-only trigger, 400ms debounced Nominatim autocomplete with keyboard navigation, click-outside dismiss, and fixStatus state machine.

## What Was Built

- **GPS crosshair button** (Lucide `Crosshair` 14px) left of input — triggers `navigator.geolocation.getCurrentPosition` on click only. Never fires on page load.
- **fixStatus state machine** (`idle | locating | active | denied | nogps`) drives button border color and inline status text below input.
- **Reverse geocode on GPS success** — populates input with truncated display name (70 chars).
- **400ms debounced autocomplete** — `handleChange` clears previous timer, guards on `value.trim().length < 3`, aborts stale requests via `AbortController`.
- **Dropdown** with `max-h-[200px]` scroll, `MapPin` icons, 70-char display name truncation, highlighted focused item.
- **Keyboard navigation** — `ArrowDown/ArrowUp` move focus, `Escape` dismisses, `Enter` selects focused item or falls through to `handleSubmit`.
- **Click-outside dismiss** — `mousedown` listener on `document` checks `containerRef` containment.
- **GO button** — replaced EXEC text.
- **Hint text** updated to `Map click . Drag pin . Enter coords`.
- **useNominatim.ts** — `limit=5` changed to `limit=6` in `forwardGeocode` URL.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written. One deviation from the plan's dropdown class suggestion:

**[Rule 1 - Non-issue] Dropdown uses bg-void/border-edge instead of bg-srf/bdr-h**
- **Found during:** Task 1, step K
- **Issue:** Plan noted `bg-srf`/`border-bdr-h` as candidate classes with fallback instruction to use existing project classes if those utilities aren't configured. They are not in the Tailwind config.
- **Fix:** Used `bg-void border-edge` (existing project classes) — visually equivalent in both themes.
- **Files modified:** src/components/shell/LocationIntelCard.tsx

## Known Stubs

None — all functionality is wired to real APIs and real state.

## Pre-existing Issues (Out of Scope)

- `src/components/shell/ModuleSheet.tsx(56,79): error TS6133: 'view' is declared but its value is never read.` — pre-existed before this plan. Logged to deferred items.

## Self-Check: PASSED

- src/components/shell/LocationIntelCard.tsx — FOUND
- src/hooks/useNominatim.ts — FOUND (limit=6 confirmed)
- Commit 6a4e816 — FOUND
