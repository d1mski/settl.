# Requirements — Milestone v1.1: Free Data Expansion + Live Webcams

Origin: Threads community feedback. Research: `.planning/research/SUMMARY.md`.
Constraint: free / no-hoops public data, client-side only, every metric attributable (no fabricated scores).

## Environmental Data (DATA)

- [x] **DATA-01**: User sees global river-flood risk (Open-Meteo GloFAS discharge with p25/p75 severity bands) for the pinned location; pins with no river within ~5km show an explicit "no major river in range" state, never a false "OK"
- [x] **DATA-02**: User sees pollen levels (CAMS species) where coverage exists (Europe-primary), with a source/resolution label; the pollen section is hidden — not shown as zero — where the API returns no data
- [x] **DATA-03**: User sees marine conditions (wave height → WMO sea-state severity, sea-surface temp) for coastal pins; the section is absent for inland pins
- [x] **DATA-04**: User can switch climate figures between 1-, 5-, and 10-year averages (Open-Meteo ERA5 archive), defaulting to 1-year so existing behavior is unchanged

## Hazard Context (HAZ)

- [x] **HAZ-01**: User sees nearby hazard/infrastructure features — military areas, power substations, wastewater plants, quarries/landfills, data centers — each with distance, under a new "hazard" category
- [x] **HAZ-02**: User sees nearby golf courses with distance
- [x] **HAZ-03**: Hazard proximity contributes to Overview severity (hazard within 1km → Context card Watch; military or wastewater within 500m → Alert)

## Live Webcams (CAM)

- [x] **CAM-01**: User sees live nearby webcams (Windy) as a thumbnail/embed grid in the context area, fetched fresh (image tokens expire ~10min) with graceful fallback for broken images; the section is absent gracefully when no API key is configured

## Fixes (FIX)

- [x] **FIX-01**: The app is usable on mobile — content scrolls, map and panel stack vertically below the small breakpoint, and no content is trapped off-screen (root cause: `h-screen` + `overflow-hidden` + fixed `w-[560px]`)
- [x] **FIX-02**: Hospitals and specialist clinics are classified by OSM `healthcare=*` tags, not name-substring heuristics, so general hospitals and clinics label correctly across locales
- [x] **FIX-03**: School levels (primary vs secondary/high) are derived by exact level matching, not substring matching, fixing mislabeled school types

## Future Requirements (v1.2+)

- US-mode federal layers (EPA Superfund/TRI, FEMA flood zones, PAD-US federal land) — deferred until a US-specific mode is justified; US-only, would mislead a global product if always-on
- Multi-year climate aggregation perf hardening (Web Worker if ERA5 10-year parse exceeds budget on low-end devices)

## Out of Scope

- Fabricated composite scores (safety, transit, flood score, pollen score) — no reliable attributable source
- Cell towers (OpenCelliD) — requires data contribution to use freely; poor global coverage
- CAFOs, foreign-owned land, pesticide layers — no reliable global data source
- Aircraft-noise contours — no live global API (only US downloadable datasets)
- Backend / serverless proxy for API keys — violates the no-backend constraint; Windy key exposure mitigated by domain restriction instead
- User accounts / authentication — unchanged from v1.0

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DATA-01 | Phase 7 | Complete |
| DATA-02 | Phase 7 | Complete |
| HAZ-01 | Phase 8 | Complete |
| HAZ-02 | Phase 8 | Complete |
| HAZ-03 | Phase 8 | Complete |
| FIX-01 | Phase 8 | Complete |
| FIX-02 | Phase 8 | Complete |
| FIX-03 | Phase 8 | Complete |
| CAM-01 | Phase 9 | Complete |
| DATA-03 | Phase 10 | Complete |
| DATA-04 | Phase 10 | Complete |
