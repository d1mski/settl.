# Roadmap: settl. — v1.0 Reskin + UX Overhaul

## Overview

Six phases built in strict dependency order: CSS token foundations first, then global shell state (theme + font scale), then LocationIntelCard enhancements (geocoding + geolocation), then saved locations, then icon modernization, then the ReportPanel overview. Each phase delivers a coherent, independently verifiable capability. No phase can safely build before its predecessor ships — later features inherit CSS variables, context providers, and geocoding labels established earlier.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: CSS Foundations + Reskin** - Tokens, rounded corners, brand rename, Leaflet override block
- [ ] **Phase 2: App Shell State** - 3-state theme toggle, OS detection, FontScaleContext, A-/A+ controls
- [ ] **Phase 3: LocationIntelCard Enhancements** - Debounced autocomplete, geolocation button, plain-English headers
- [ ] **Phase 4: Saved Locations** - Heart toggle, localStorage persistence, labeled location list
- [ ] **Phase 5: ModuleRail + Lucide Icons** - Icon swap in rail, section headers, service rows, overview toggle UI
- [ ] **Phase 6: ReportPanel (Overview Mode)** - Scrollable overview panel inside ModuleSheet, view toggle, severity cards

## Phase Details

### Phase 1: CSS Foundations + Reskin
**Goal**: Visual foundation is stable — brand is settl., HUD decoration is gone, corners are rounded, Leaflet is safe
**Depends on**: Nothing (first phase)
**Requirements**: SKIN-01, SKIN-02, SKIN-03
**Success Criteria** (what must be TRUE):
  1. All panels and cards display 8-14px rounded corners with no sharp HUD edges anywhere in the UI
  2. Noise overlay, scan lines, HUD brackets, grid dots, and gradient backdrops are absent from every view
  3. Page title, logo area, and bottom strip show "settl." with the cyan dot accent
  4. Leaflet popups and tooltip arrows render correctly on both dark and light themes after all CSS changes
**Plans:** 3 plans
Plans:
- [ ] 01-01-PLAN.md — CSS token layer: strip HUD decorative CSS, add rounded corner tokens, update Leaflet overrides
- [ ] 01-02-PLAN.md — Component cleanup: remove brackets from Panel, strip MapHud decorations, apply rounded corners
- [ ] 01-03-PLAN.md — Brand rename: rebrand BlindSpot to settl. across all files
**UI hint**: yes

### Phase 2: App Shell State
**Goal**: Theme and font scale are global, persistent, and inherited correctly by every component
**Depends on**: Phase 1
**Requirements**: UX-04, UX-05
**Success Criteria** (what must be TRUE):
  1. Toggling Light / System / Dark cycles the theme without any flash-of-wrong-theme on load
  2. Theme preference survives a hard browser refresh (localStorage persistence confirmed)
  3. Visiting the app with no saved preference applies the OS dark/light preference automatically
  4. A- and A+ controls step font size in 10% increments (rem-based); map click accuracy is unaffected by any scale change
  5. Font size selection persists across sessions
**Plans**: TBD
**UI hint**: yes

### Phase 3: LocationIntelCard Enhancements
**Goal**: Users can find locations via autocomplete search or one-click geolocation without manual coordinate entry
**Depends on**: Phase 2
**Requirements**: FEAT-01, FEAT-02, UX-01
**Success Criteria** (what must be TRUE):
  1. Typing 3+ characters into search shows a Nominatim autocomplete dropdown within 400ms debounce; results are keyboard-navigable and dismissed on click-outside
  2. Clicking "Use my location" prompts for permission (never autofires); on grant, map centers on GPS coordinates
  3. Declining or revoking geolocation permission shows a clear inline message, no uncaught errors
  4. All section headers across modules display plain English labels ("Climate", "Air Quality") with no §XX codes visible
**Plans**: TBD
**UI hint**: yes

### Phase 4: Saved Locations
**Goal**: Users can bookmark locations and return to them instantly without re-typing
**Depends on**: Phase 3
**Requirements**: FEAT-03
**Success Criteria** (what must be TRUE):
  1. Clicking the heart toggle on a loaded location saves it; the list persists after browser refresh
  2. Clicking a saved location in the list re-centers the map and reloads all module data for that location
  3. Removing a saved location removes it from the list immediately and does not reappear after refresh
  4. Saving an 11th location is rejected gracefully (10-item cap enforced, user informed)
**Plans**: TBD
**UI hint**: yes

### Phase 5: ModuleRail + Lucide Icons
**Goal**: All emoji and HUD-style icons are replaced with Lucide SVGs; the rail includes an overview toggle affordance
**Depends on**: Phase 1
**Requirements**: SKIN-04, UX-03
**Success Criteria** (what must be TRUE):
  1. Module rail, section headers, and service rows display Lucide SVG icons — no emoji or HUD glyphs visible anywhere
  2. An overview/advanced toggle control appears in the rail and is visually distinct from module nav icons
  3. Icons render at consistent size and color on both dark and light themes
**Plans**: TBD
**UI hint**: yes

### Phase 6: ReportPanel (Overview Mode)
**Goal**: Users land in a scrollable overview of all module data by default, with one-click drill-down to detail
**Depends on**: Phase 5
**Requirements**: UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. Opening the app with a location loaded shows the Overview panel as the default view inside ModuleSheet
  2. The overview displays scrollable chapter cards covering data from all modules (Climate, Wind, Sun, Hazards, Air Quality, Context)
  3. Each card shows an OK / Watch / Alert status indicator derived from existing risk synthesis data
  4. Clicking the advanced toggle switches to the existing module-detail view; clicking back returns to overview without data reload
  5. ReportPanel renders inside ModuleSheet with no new z-index context that buries Leaflet popups
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. CSS Foundations + Reskin | 0/3 | Planned | - |
| 2. App Shell State | 0/? | Not started | - |
| 3. LocationIntelCard Enhancements | 0/? | Not started | - |
| 4. Saved Locations | 0/? | Not started | - |
| 5. ModuleRail + Lucide Icons | 0/? | Not started | - |
| 6. ReportPanel (Overview Mode) | 0/? | Not started | - |
