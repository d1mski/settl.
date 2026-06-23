---
phase: 09-live-webcams-windy
plan: 03
subsystem: components/ui
tags: [webcams, windy, context-module, thumbnail-grid, detail-link]
dependency_graph:
  requires: [src/hooks/useWebcams.ts, src/components/modules/ContextModule.tsx]
  provides: [WebcamsSection in ContextModule — gated 2-col thumbnail grid linking to detailUrl]
  affects: [src/components/modules/ContextModule.tsx]
tech_stack:
  added: []
  patterns: [gated section on VITE_WINDY_KEY + status + length, onError imgError state, detail-page open in new tab]
key_files:
  created: []
  modified: [src/components/modules/ContextModule.tsx]
decisions:
  - "WebcamsSection absent on idle/error/empty — no else branch, no error block; 401 from unwhitelisted domain surfaces as error status and is silently absent per research Anti-Pattern"
  - "Clicking card opens cam.detailUrl in new tab — NOT an embedded live stream (SC1 reinterpreted per research: player.live absent on ~99% of cameras)"
  - "WebcamCard onError swaps broken image for IMAGE EXPIRED placeholder — no broken-image glyph"
  - "webcams NOT added to CompareView (research Open Q1 — SingleView only)"
metrics:
  duration: 10m
  completed: "2026-06-23T12:00:00Z"
  tasks: 1 completed, 1 pending human-verify
  files: 1
---

# Phase 09 Plan 03: WebcamsSection UI Summary

**One-liner:** Gated 2-col webcam thumbnail grid in ContextModule SingleView — useWebcams(coordsA) wired, cards link to Windy detail page, onError shows IMAGE EXPIRED placeholder.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Wire useWebcams into ContextModule + render gated WebcamsSection | 85ded51 | src/components/modules/ContextModule.tsx |

## Tasks Pending Human Verification

| # | Name | Status | Gate |
|---|------|--------|------|
| 2 | Visual verify webcam grid in-browser (requires plan 09-01 whitelist live) | awaiting human-verify | blocking |

## Decisions Made

1. **Detail-page link, not embedded stream:** SC1 reinterpreted per research — `cam.detailUrl` opens Windy's detail page in a new tab. Player iframe not used (autoplay/audio/bandwidth issues; live stream absent on ~99% of cameras per 09-RESEARCH.md).

2. **Absent on idle/error/empty:** No else branch. A 401 (unwhitelisted domain) routes through `status === 'error'` → section absent. No red error block (matches research Anti-Pattern prohibition).

3. **Loading skeleton shown:** While `webcamsStatus === 'loading'` and key is set, a loading section is shown to avoid layout jump.

4. **SingleView only:** `useWebcams(coordsB)` not called; no webcams in CompareView (research Open Q1).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all UI is wired to live hook data. The section conditionally absent when data is unavailable (not a stub — correct behavior).

## Human-Verify Checkpoint Status

**PENDING** — Task 2 requires browser verification with plan 09-01 Windy domain whitelist live.

Verification steps (from plan):
1. `npm run dev`, open http://localhost:5173
2. Pin a dense urban location (Athens, central London, NYC) — open Context tab
3. Confirm "LIVE WEBCAMS" 2-col grid shows thumbnails with title and KM distance
4. Confirm clicking a card opens windy.com detail page in a new tab (not an in-app embed)
5. Confirm no broken-image icons (force onError via DevTools block of imgproxy.windy.com → expect "IMAGE EXPIRED")
6. Pin remote ocean/desert — confirm LIVE WEBCAMS section is absent (not empty box, not error)
7. Blank VITE_WINDY_KEY, restart dev — confirm section absent everywhere with no console error

Resume signal: Type "approved" if all steps pass, or describe what rendered incorrectly.

## Self-Check: PASSED

- `src/components/modules/ContextModule.tsx` exists: FOUND
- Commit 85ded51 exists: FOUND
- tsc --noEmit: exits 0
- All 7 positive greps: PASS
- Both negative greps: PASS (no iframe, no playerLive, no useWebcams(coordsB))
