---
phase: 07-zero-risk-data-additions-pollen-flood
verified: 2026-06-22T00:00:00Z
status: passed
score: 15/15 must-haves verified
---

# Phase 7: Zero-Risk Data Additions (Pollen + Flood) Verification Report

**Phase Goal:** Global flood risk (GloFAS) + pollen on the existing AQ call; establishes the not-applicable neutral state.
**Verified:** 2026-06-22
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|---------|
| 1  | useAirQuality fetches the 6 CAMS pollen species in addition to existing AQI vars | VERIFIED | `HOURLY_VARS` in useAirQuality.ts lines 15-21 contains all 6 snake_case names |
| 2  | Pollen values are nullable — null where CAMS has no coverage, never coerced to 0 | VERIFIED | Mapping uses `?? null` for all 6 pollen fields (lines 73-78); existing AQI fields retain `?? 0` |
| 3  | Old pre-pollen cache entries are invalidated by a new cache key prefix | VERIFIED | `makeKey` returns `aqv2|\${...}` (line 43 useAirQuality.ts) |
| 4  | TypeScript compiles with no errors after the AqiSample shape change | VERIFIED | Orchestrator confirmed `tsc --noEmit` clean; build succeeds |
| 5  | A new useFlood hook fetches GloFAS river discharge mirroring the useAirQuality pattern | VERIFIED | src/hooks/useFlood.ts mirrors caching map, persistent cacheGet/cacheSet, AbortController ref, fetchJson, DOMException AbortError filter, coords dep array |
| 6  | Desert (all-zero) AND ocean (all-null) responses both resolve to notApplicable:true, never to OK severity | VERIFIED | `isNotApplicable` checks `v === null \|\| v === 0` (line 51 useFlood.ts) — both cases caught |
| 7  | Flood severity uses absolute bands: OK < 500, Watch 500-2000, Alert > 2000 m³/s — never p25/p75 | VERIFIED | `deriveFloodSeverity` uses `> 2000` and `>= 500` bands; comment explicitly states p25/p75 not used |
| 8  | OverviewSeverity gains a 'not-applicable' member mapped to the existing 'muted' StatusDot tone | VERIFIED | `OverviewSeverity` union includes `'not-applicable'`; `SEVERITY_TONE['not-applicable'] = 'muted'` with `Exclude<OverviewSeverity, 'unavailable'>` satisfies clause |
| 9  | TypeScript compiles with no errors (flood data layer) | VERIFIED | Confirmed clean by orchestrator |
| 10 | ReportPanel calls useFlood and shows a Flood Risk metric in the Hazards chapter | VERIFIED | `const flood = useFlood(coordsA)` at line 118; `{ value: floodMetricValue, label: 'Flood Risk', muted: flood.notApplicable }` in hazardsMetrics |
| 11 | Desert/ocean pins render the Flood Risk value as muted gray 'No river' text, never a green OK or a real-looking number | VERIFIED | `m.muted ? 'text-muted' : 'text-ink'` conditional on metric value span (line 442); `muted: flood.notApplicable` set on the row |
| 12 | Flood ok/watch/alert elevates the Hazards chapter severity; not-applicable does not degrade it | VERIFIED | `deriveHazardsSeverity` sets `floodRank = -1` when `floodNotApplicable` is true; rank-max composition preserves EQ/WF result |
| 13 | European pins show a pollen sub-block (6 species) with a 'CAMS European model' label inside the Air chapter | VERIFIED | `ch.id === 'air' && pollenData.hasPollen` gate (line 451); label "Pollen · CAMS European model" present |
| 14 | Non-European pins and zero-pollen pins hide the pollen sub-block entirely — no zeros shown | VERIFIED | `isEuropeHeuristic` + `>= 1` threshold + `!== null` guards in pollenData useMemo; block not rendered when `hasPollen` is false |
| 15 | The Metric interface gains a muted? flag and the metric card renders muted text when set | VERIFIED | `interface Metric { value: string; label: string; muted?: boolean }` at lines 45-49; conditional class on value span |

**Score:** 15/15 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/useFlood.ts` | useFlood hook, FloodSample + FloodResponse types, all-zero-or-null guard | VERIFIED | File exists; `v === null \|\| v === 0` guard, `notApplicable: boolean` return, `TTL.openMeteoFlood` in cacheSet |
| `src/utils/overviewSeverity.ts` | 'not-applicable' in OverviewSeverity, SEVERITY_TONE entry, deriveFloodSeverity | VERIFIED | All three present; `Exclude` satisfies clause; `deriveHazardsSeverity` 4-param signature |
| `src/utils/persistentCache.ts` | TTL.openMeteoFlood constant | VERIFIED | `openMeteoFlood: 6 * 60 * 60 * 1000` added after `nominatim`; existing TTLs untouched |
| `src/hooks/useAirQuality.ts` | Pollen vars in HOURLY_VARS, response interface, mapping with ?? null, aqv2\| cache key | VERIFIED | All four edits confirmed in file |
| `src/types/index.ts` | AqiSample extended with 6 nullable pollen fields | VERIFIED | All 6 fields typed `number \| null` at lines 136-141 |
| `src/components/shell/ReportPanel.tsx` | useFlood call, muted 'No river' Flood Risk metric, pollen gated sub-block, Metric.muted flag | VERIFIED | All items confirmed |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/hooks/useFlood.ts` | `src/utils/persistentCache.ts` | `TTL.openMeteoFlood` in cacheSet | VERIFIED | Line 112 and 125 useFlood.ts |
| `src/utils/overviewSeverity.ts` | StatusDot tone='muted' | `SEVERITY_TONE['not-applicable'] = 'muted'` | VERIFIED | Line 12 overviewSeverity.ts |
| `src/components/shell/ReportPanel.tsx` | `src/hooks/useFlood.ts` | `const flood = useFlood(coordsA)` | VERIFIED | Line 118 ReportPanel.tsx; import at line 26 |
| `src/components/shell/ReportPanel.tsx` | `src/utils/overviewSeverity.ts` | `deriveFloodSeverity(flood, flood.notApplicable)` | VERIFIED | Line 124; imported at line 24 |
| ReportPanel pollen sub-block | isEuropeHeuristic + `some(v !== null && v >= 1)` | `hasPollen` gate | VERIFIED | Lines 104-106 (helper) and lines 131-143 (gate) |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `ReportPanel.tsx` (flood metric) | `flood.data` / `flood.notApplicable` | `useFlood` → GloFAS `flood-api.open-meteo.com` | Yes — live fetch with persistent IDB cache | FLOWING |
| `ReportPanel.tsx` (pollen block) | `aqi.data.{species}Pollen` | `useAirQuality` → CAMS `air-quality-api.open-meteo.com` | Yes — live fetch; null propagated correctly for non-EU | FLOWING |
| `deriveHazardsSeverity` (flood contribution) | `floodRank` | `deriveFloodSeverity(flood, flood.notApplicable)` | Yes — rank-max from real discharge samples | FLOWING |

---

### Behavioral Spot-Checks

Runnable unit commands unavailable without a running server. Runtime verification was performed by the orchestrator against 8 live test pins, covering all key behaviors:

| Behavior | Result | Status |
|----------|--------|--------|
| Rhine discharge shows real m³/s value in ink color | Pass (orchestrator) | PASS |
| Sahara "No river" in muted color (rgb 80,94,120) | Pass (orchestrator) | PASS |
| Atlantic "No river" muted | Pass (orchestrator) | PASS |
| Cologne pollen sub-block + "CAMS European model" label | Pass (orchestrator) | PASS |
| Sydney no pollen block, AQI shown | Pass (orchestrator) | PASS |
| Amazon Óbidos 321365 m³/s → Hazards badge ALERT | Pass (orchestrator) | PASS |
| Rhine OK discharge did not worsen Hazards badge | Pass (orchestrator) | PASS |
| Sahara/Atlantic never show green OK or zero discharge | Pass (orchestrator) | PASS |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| DATA-01 | 07-02, 07-03 | Global river-flood risk; no-river pins show explicit not-applicable state, never false OK | SATISFIED | useFlood dual guard; muted "No river" metric; flood severity in deriveHazardsSeverity |
| DATA-02 | 07-01, 07-03 | Pollen levels where coverage exists; section hidden where no data | SATISFIED | 6 nullable fields in AqiSample; `>= 1` + `!== null` gate; hasPollen block hidden for non-EU |

No orphaned requirements (REQUIREMENTS.md maps only DATA-01 and DATA-02 to Phase 7; traceability table at lines 45-58 confirms both marked Complete).

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ReportPanel.tsx` | ~456 | `{s.peak} grains/m³` — integer rendered without `toFixed` | Info | Cosmetic only; peak is an integer from Math.max over CAMS data |
| `overviewSeverity.ts` | 164 | `deriveFloodSeverity` returns `metric: 'No major river within 5km'` for not-applicable path | Info | ReportPanel hardcodes its own `'No river'` string for display; the function's metric string is unused on this branch. Functionally correct. |
| `useFlood.ts` | 113 | `setState({ status: 'success', data: [], error: null })` on not-applicable path | Info | Intentional sentinel — paired with `setNotApplicable(true)` and `notApplicableCache`. Not a stub; correctly distinguished from real data by the `notApplicable` flag. |
| `pollenData` useMemo | 147-151 | `peakPollen` may return `null` | Info | Not a stub — null signals "no data for species" and the caller filters it out. Legitimate null propagation pattern. |

No blockers. No warnings.

---

### Human Verification Required

None — all visual and runtime behaviors confirmed by orchestrator live browser verification across 8 test pins.

---

### Gaps Summary

No gaps. All 15 must-have truths verified across 6 artifacts and 5 key links. DATA-01 and DATA-02 fully satisfied.

The not-applicable neutral state is established correctly: desert (all-zero) and ocean (all-null) GloFAS responses both resolve to `notApplicable: true`, surface as muted gray "No river" text in the Hazards chapter, and do not degrade the EQ/wildfire severity badge. Pollen is gated behind Europe-heuristic + `>= 1 grains/m³` threshold and hidden entirely for non-European or out-of-season pins.

---

_Verified: 2026-06-22T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
