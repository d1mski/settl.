---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: — Free Data Expansion + Live Webcams
status: Phase complete — ready for verification
stopped_at: Completed 10-04-PLAN.md
last_updated: "2026-06-24T11:14:40.656Z"
progress:
  total_phases: 10
  completed_phases: 10
  total_plans: 25
  completed_plans: 26
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-22)

**Core value:** Instant, trustworthy, data-backed insight into what it's really like to live somewhere — before you commit
**Current focus:** Phase 10 — marine-climate-selector

## Current Position

Phase: 10 (marine-climate-selector) — EXECUTING
Plan: 4 of 4

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*
| Phase 01-css-foundations-reskin P01 | 6m | 2 tasks | 2 files |
| Phase 05-modulerail-lucide-icons P02 | 8m | 2 tasks | 3 files |
| Phase 03 P01 | 12m | 1 tasks | 2 files |
| Phase 03 P02 | 5m | 1 tasks | 3 files |
| Phase 06-reportpanel-overview-mode P02 | 30 | 4 tasks | 3 files |
| Phase 07 P01 | 10 | 2 tasks | 2 files |
| Phase 07 P02 | 6 | 3 tasks | 3 files |
| Phase 07 P03 | 12 | 4 tasks | 2 files |
| Phase 08 P01 | 3 | 4 tasks | 3 files |
| Phase 08-overpass-expansion-bug-fixes P03 | 20 | 2 tasks | 2 files |
| Phase 08 P02 | 5 | 2 tasks | 2 files |
| Phase 09 P02 | 5 | 1 tasks | 1 files |
| Phase 10 P01 | 15 | 3 tasks | 3 files |
| Phase 10 P02 | 20 | 2 tasks | 2 files |
| Phase 10-marine-climate-selector P03 | 25 | 4 tasks | 5 files |
| Phase 10 P04 | 35 | 3 tasks | 1 files |

## Accumulated Context

### Decisions

- [Roadmap] Phase 5 (Lucide icons) depends on Phase 1 only — ordered after Phase 4 for simplicity but parallel-safe
- [Roadmap] UX-03 split: rail toggle UI in Phase 5, ReportPanel content in Phase 6
- [Research] CSS zoom prohibited on any Leaflet ancestor — font scale uses font-size on html + rem only
- [Research] Nominatim debounce locked at 400ms (rate limit policy)
- [Research] ReportPanel renders INSIDE ModuleSheet — no new z-index context
- [Phase 01-css-foundations-reskin]: 4-direction tooltip arrows replace single :before for correct Leaflet arrow color on all orientations
- [Phase 02-app-shell-state]: ThemeToggle and FontScaleControl are zero-prop components — all state from context; BaseMap type fully removed
- [Phase 05-modulerail-lucide-icons]: Sunrise used for sun tab to avoid icon collision with Sun (climate tab)
- [Phase 05-modulerail-lucide-icons]: viewMode state owned by App.tsx — lifted for Phase 6 ReportPanel content switching
- [Phase 03]: GPS button is click-only, never autofires — navigator.geolocation.getCurrentPosition inside onClick only
- [Phase 03]: code prop made optional in SectionHeader so all 6 module callers compile without changes
- [Phase 03]: ModuleSheet view prop aliased to _view to suppress TS6133 without removing the Phase 6 reserved prop
- [Phase 06-reportpanel-overview-mode]: Rendering gate changed to (active !== null || view === 'overview') — sheet opens in overview without selected tab
- [Phase 06-reportpanel-overview-mode]: handleDrillDown sets tab before advancing viewMode — guarantees state.tab non-null in advanced mode
- [v1.1 Research] power=substation nodes only — drop power=line ways (geometry explosion + Overpass timeout risk)
- [v1.1 Research] QUERY_VERSION must bump to v5 before any Overpass changes merge
- [v1.1 Research] Pollen = Europe-primary (CAMS European domain); null-guard + source label required; hide, never show zero
- [v1.1 Research] archive-api.open-meteo.com for ERA5 multi-year averages (NOT historical-forecast-api, which only covers 2021+)
- [v1.1 Research] Windy TTL = 8min (10-min token expiry minus 2-min buffer); no persistent cache for image URLs; onError fallback per card; domain-restrict key at Windy dashboard
- [v1.1 Research] Not-applicable neutral state: distinct from loading/OK/error; build once at Phase 7 (Flood), reuse for Pollen and Marine
- [Phase 07-01]: Pollen fields typed number | null (not number) — CAMS returns null outside European domain; ?? null preserves no-coverage signal
- [Phase 07-01]: Cache key bumped to aqv2| — stale entries missing pollen fields would cause undefined access in future UI code
- [Phase 07]: Desert pins (HTTP 200, all-zero) and ocean pins (HTTP 200, all-null) both resolve to notApplicable=true — never a false green OK for flood
- [Phase 07]: Absolute flood severity bands 500/2000 m³/s — p25/p75 not used (equal river_discharge on past reanalysis days)
- [Phase 07]: FloodSample type stays in useFlood.ts (not types/index.ts) to keep 07-01 and 07-02 parallel-safe
- [Phase 07]: deriveHazardsSeverity composes via rank-max; flood not-applicable ranks -1 (ignored), never degrades EQ/WF; final rank maps severity AND badge metric together
- [Phase 07]: Not-applicable surfaces as muted metric text (No river), NOT a chapter StatusDot — no not-applicable dot branch in Phase 7 (would be dead code)
- [Phase 08]: QUERY_VERSION bumped v4→v5 to invalidate stale Overpass cache entries lacking hazard categorisation
- [Phase 08]: power=substation node-only (locked) — ways cause Overpass geometry explosion + timeout; captures ~20% of substations
- [Phase 08]: Hazard query radius 5km — HAZ-03 proximity bands (500m/1km) applied in code, not query
- [Phase 08]: Golf joins park category (subtype golf_course) not hazard per D-03; no NEAREST_ROWS golf row
- [Phase 08]: FIX-02: deleted Greek name-substring heuristic entirely; FIX-03: schoolSubtype uses exact === matching with multi-value TODO
- [Phase 08-overpass-expansion-bug-fixes]: [Phase 08-03] HUD cards moved out of the map box (DOM move required, not class-only) — stacks below map on mobile; lg:absolute floats over map on desktop
- [Phase 08-overpass-expansion-bug-fixes]: [Phase 08-03] FIX-01 visual verify (Task 3) deferred to end of phase — code complete, tsc clean, mobile rendering unconfirmed
- [Phase 08]: deriveContextSeverity returns nearest hazard km as metric; alert subtype literals 'military'/'wastewater' match categorise() exactly
- [Phase 08]: Render ModuleSheet twice (desktop aside + embedded in MobileSheet) — cheapest faithful port, no logic duplication
- [Phase 08]: Breakpoint split at md (768px) not lg — reverts 08-03 lg: choices throughout App.tsx
- [Phase 09]: location field made required in WindyApiResponse — always present when include=location passed; avoids ?? 0 fallback producing garbage haversine distances
- [Phase 09]: playerLiveUrl typed string | null — absent on ~99% of tested cameras; component must null-check before rendering live stream UI
- [Phase 09-live-webcams-windy]: WebcamsSection absent on idle/error/empty — detail-page link (not embedded stream); SingleView only, no CompareView webcams
- [Phase 10]: useMarine sharedFetch owns no external AbortSignal — one unmounting caller cannot abort concurrent callers' in-flight request
- [Phase 10]: Marine coastal detection: null-check on response body (waveHeight/SST), NOT HTTP status — inland returns HTTP 200 with nulls
- [Phase 10]: useMarine uses in-memory Map cache only (no idb) — current-condition data; stale values across sessions would be misleading
- [Phase Phase 10]: useOpenMeteo _years param uses underscore prefix — noUnusedParameters:true in tsconfig; _view precedent; Plan 04 doesn't pass the param positionally
- [Phase Phase 10]: precipitationSum not divided in useClimateArchive — countExtremeDays >20mm per-day threshold must not be scaled; per-year extreme-day counts divided in Plan 04
- [Phase Phase 10]: rainSum ÷N at source (per plan must_have) deflates rainDays count — known limitation; Plan 04 must recompute rainDays from raw precipitationSum or apply ÷N post-aggregation
- [Phase Phase 10]: ARCHIVE_KEY_VERSION = 'era5v1' independent of KEY_VERSION — new hook, no stale entries, namespaces never collide
- [Phase 10-marine-climate-selector]: visibleTabs gating in ModuleSheet only — ModuleRail is dead code; marine entries added to ICONS/LABELS solely for tsc Record<TabId> exhaustiveness
- [Phase 10-marine-climate-selector]: ClimateModule Props forward-declares years?/onYearsChange? without destructuring — avoids TS6133 (noUnusedParameters: true); Plan 04 implements selector behavior
- [Phase 10]: Tasks 1+2 committed together in 10-04 — noUnusedParameters:true makes intermediate states non-compilable; combined commit is smallest tsc-clean unit
- [Phase 10]: rainDays deflation (10-02 carry-forward) confirmed invisible in ClimateModule — not rendered; no fix applied in 10-04; future fix belongs in useClimateArchive.ts if rainDays ever displayed
- [Phase 10]: CompareView ΔPEAK UV shows '--'/neutral on 5/10YR — uvIndexMax:[] yields -Infinity from peakUv(); NaN delta avoided by branching on years > 1

### Pending Todos

- Procure VITE_WINDY_KEY from api.windy.com/keys and domain-restrict it before Phase 9 planning

### Blockers/Concerns

- [Phase 9] VITE_WINDY_KEY not yet procured — Phase 9 cannot be planned until key is available
- [Phase 6] Severity scoring algorithm (OK/Watch/Alert) not yet defined — needs product decision before Phase 6 planning

## Session Continuity

Last session: 2026-06-24T11:14:40.652Z
Stopped at: Completed 10-04-PLAN.md
Resume file: None
