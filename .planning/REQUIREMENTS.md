# Requirements — Milestone v1.0: settl. Reskin + UX Overhaul

## Reskin

- [ ] **SKIN-01**: All UI panels and cards use rounded corners (8-14px radius) with no sharp HUD edges
- [ ] **SKIN-02**: Decorative elements removed (HUD brackets, noise overlay, scan lines, grid dots, gradient backdrops)
- [ ] **SKIN-03**: App rebranded to settl. with cyan dot accent in logo, page title, and bottom strip
- [ ] **SKIN-04**: Lucide React icons replace all emoji and HUD-style icons in module rail, section headers, and service rows

## UX

- [ ] **UX-01**: Section headers use plain English labels ("Climate", "Air Quality") instead of §XX codes
- [ ] **UX-02**: Overview report panel displays scrollable chapters with data from all modules as the default view
- [ ] **UX-03**: User can toggle between Overview and Advanced (existing module detail) views
- [ ] **UX-04**: User can increase/decrease font size via A-/A+ controls with 10% linear steps (rem-based, not CSS zoom)
- [ ] **UX-05**: Theme defaults to OS preference (prefers-color-scheme), with 3-state manual toggle (Light / System / Dark) persisted to localStorage

## Features

- [ ] **FEAT-01**: App requests browser geolocation on load (permission-aware, GPS accuracy, HTTPS) and auto-populates location
- [ ] **FEAT-02**: Search input provides autocomplete dropdown from Nominatim (400ms debounce, 3-char min, keyboard navigation, AbortController cleanup)
- [ ] **FEAT-03**: User can save/unsave locations via heart toggle, persisted to localStorage (max 10, schema-versioned)

## Future Requirements

(None deferred — all scoped features included in this milestone)

## Out of Scope

- Fabricated composite scores (safety, transit, noise) — no reliable global data source
- User accounts / authentication — unnecessary for v1
- Property listings / pricing — different product category
- Mobile-specific responsive layout — desktop-first for this milestone
- Tailwind v4 migration — breaking changes, zero benefit

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| SKIN-01 | Phase 1 | Pending |
| SKIN-02 | Phase 1 | Pending |
| SKIN-03 | Phase 1 | Pending |
| SKIN-04 | Phase 5 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 6 | Pending |
| UX-03 | Phase 5 + 6 | Pending |
| UX-04 | Phase 2 | Pending |
| UX-05 | Phase 2 | Pending |
| FEAT-01 | Phase 3 | Pending |
| FEAT-02 | Phase 3 | Pending |
| FEAT-03 | Phase 4 | Pending |
