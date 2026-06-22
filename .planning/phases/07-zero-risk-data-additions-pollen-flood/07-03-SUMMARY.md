---
phase: 07-zero-risk-data-additions-pollen-flood
plan: "03"
subsystem: reportpanel-overview-ui
tags: [flood, pollen, glofas, cams, not-applicable, muted-metric, severity, reportpanel]
dependency_graph:
  requires:
    - "07-01: AqiSample 6 nullable pollen fields"
    - "07-02: useFlood hook, FloodSample type, deriveFloodSeverity, not-applicable severity"
  provides:
    - "useFlood wired into ReportPanel Hazards chapter"
    - "Muted 'No river' Flood Risk metric (Metric.muted flag)"
    - "deriveHazardsSeverity folds flood ok/watch/alert into hazards badge"
    - "Gated pollen sub-block in Air chapter with CAMS European model label"
  affects:
    - "src/components/shell/ReportPanel.tsx"
    - "src/utils/overviewSeverity.ts"
tech_stack:
  added: []
  patterns:
    - "Severity rank-max composition (ok=0/watch=1/alert=2; not-applicable=-1 ignored)"
    - "Muted metric text as the Phase 7 not-applicable visual (no chapter-level not-applicable dot)"
    - "Conditional sub-block render keyed on ch.id within generic chapters.map"
    - "Body-level useMemo for render-scope derived data (pollen) vs chapter-data useMemo"
key_files:
  created: []
  modified:
    - src/utils/overviewSeverity.ts
    - src/components/shell/ReportPanel.tsx
decisions:
  - "deriveHazardsSeverity composes via rank-max: flood not-applicable/unavailable rank -1 (ignored), never degrades EQ/WF outcome; final rank maps severity AND badge metric together so a flood-elevated watch shows MOD not LOW"
  - "Pollen computed in a body-level useMemo (keyed on aqi.data, coordsA) — it renders in JSX outside the chapters useMemo, so it must be in render scope"
  - "Only the chapters metric-grid value span made conditional on m.muted; emergency section span left untouched (Flood Risk only renders in chapters grid)"
  - "Chapter StatusDot guard (ch.severity !== 'unavailable') left unchanged — deriveHazardsSeverity never returns not-applicable in Phase 7, so no not-applicable dot branch (would be dead code)"
metrics:
  duration: "~12 minutes"
  completed: "2026-06-22"
  tasks_completed: 4
  files_modified: 2
---

# Phase 07 Plan 03: Flood + Pollen ReportPanel UI Summary

**One-liner:** Flood Risk metric (muted "No river" for desert/ocean, discharge band otherwise) folded into the Hazards chapter severity, plus a gated CAMS pollen sub-block in the Air chapter for European pins only.

## What Was Built

Three code changes wiring the 07-01 pollen data and 07-02 flood data layer into the ReportPanel Overview UI, plus a human-verified checkpoint:

1. **`deriveHazardsSeverity` expanded** (overviewSeverity.ts) — now a 4-arg function `(earthquakes, wildfires, flood, floodNotApplicable)`. Computes the existing EQ/wildfire severity as a rank (ok=0/watch=1/alert=2), folds the flood contribution via `deriveFloodSeverity`, and returns `Math.max(baseRank, floodRank)` mapped to both severity AND the HIGH/MOD/LOW badge metric. Flood not-applicable and unavailable rank -1 (ignored) so they never degrade or change the EQ/WF outcome. Existing `unavailable` early-returns preserved ahead of the max.

2. **useFlood + muted Flood Risk metric** (ReportPanel.tsx) — `useFlood(coordsA)` called alongside the other data hooks; `hazardsResult` now passes flood; `floodResult = deriveFloodSeverity(...)` derives the metric. The `Metric` interface gained `muted?: boolean`, and the chapters-grid metric value span became `${m.muted ? 'text-muted' : 'text-ink'}` — the load-bearing visual for DATA-01 not-applicable. A Flood Risk row was added to `hazardsMetrics`: muted "No river" when not-applicable, `${discharge} m³/s` otherwise. Hazards chapter answer now mentions Copernicus GloFAS.

3. **Gated pollen sub-block** (ReportPanel.tsx) — `isEuropeHeuristic` helper (lon -25..45, lat 30..75). A body-level `pollenData` useMemo gates visibility (`hasPollen`): European pin + at least one species `>= 1` grain/m³ (threshold suppresses CAMS out-of-season noise; all 6 species null-guarded with `!== null`, never `?? 0`). Per-species peak (max non-null) rendered as metric cards with a "Pollen · CAMS European model" source label, injected after the Air chapter's metric grid via a `ch.id === 'air'` branch. Non-Europe and zero-pollen pins render nothing.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 6a960a5 | feat(07-03): expand deriveHazardsSeverity to fold in flood severity |
| Task 2 | ee3ba81 | feat(07-03): wire useFlood + muted Flood Risk metric into Hazards chapter |
| Task 3 | 3ca2660 | feat(07-03): add gated pollen sub-block to Air chapter |
| Task 4 | (checkpoint) | Human-verified against research test pins — approved |

## Verification

`npx tsc --noEmit` exits 0 after every task.

Human-verify checkpoint (Task 4) — all 8 checks passed via automated browser verification (chrome-devtools, real rendered output):

- **Rhine/Cologne (50.94, 6.96):** "3 m³/s" in computed color rgb(14,22,36) = ink, not muted.
- **Sahara/Libya (23.4, 25.0):** "No river", color rgb(80,94,120) = muted, class text-muted.
- **Atlantic (40.0, -35.0):** "No river", rgb(80,94,120), text-muted — distinct from ink.
- **Cologne (European):** "POLLEN · CAMS EUROPEAN MODEL" block with 5 species in grains/m³.
- **Sydney (-33.87, 151.21):** No pollen block; AQI metrics still shown.
- **Hazards composition:** Rhine 3 m³/s → Hazards badge "OK" (not worsened). Amazon/Óbidos (-1.95, -55.51) 321365 m³/s → Hazards badge "ALERT" with 0 quakes/0 fires — proving flood severity folds into and elevates deriveHazardsSeverity.

## Deviations from Plan

None — plan executed exactly as written. The prescribed snippets were used as specified. The only judgment call (foregrounded by review): pollen visibility + species peaks were placed in a body-level `useMemo` rather than the chapters useMemo, because the pollen block renders in JSX inside `chapters.map` (outside the chapters useMemo scope). The plan's "wire into useMemo deps" was satisfied by keying this body-level useMemo on `aqi.data, coordsA`.

## Known Stubs

None. Both flood and pollen are wired to live data sources (GloFAS via useFlood, CAMS via useAirQuality). No hardcoded empty values or placeholder text.

## Self-Check: PASSED

- `src/components/shell/ReportPanel.tsx` contains `useFlood(coordsA)` — FOUND
- Contains `deriveHazardsSeverity(earthquakes, wildfires, flood, flood.notApplicable)` — FOUND
- `Metric` interface contains `muted?: boolean` — FOUND
- Metric value span contains `m.muted ? 'text-muted' : 'text-ink'` — FOUND
- Contains `'Flood Risk'`, `'No river'`, `muted: flood.notApplicable` — FOUND
- Contains `isEuropeHeuristic` and literal `CAMS European model` — FOUND
- Contains all 6 pollen fields with `>= 1` threshold and `!== null` guards — FOUND
- `src/utils/overviewSeverity.ts` deriveHazardsSeverity has 4 params including flood ModuleState + boolean — FOUND
- Commits 6a960a5, ee3ba81, 3ca2660 — FOUND
- `npx tsc --noEmit` exits 0 — PASS
