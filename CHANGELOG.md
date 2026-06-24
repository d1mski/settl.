# Changelog

All notable changes to **settl. — Location Intelligence** are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/), and this
project aims to follow [Semantic Versioning](https://semver.org/).

## [1.1.0] — 2026-06-24 — Free Data Expansion + Live Webcams

### Added
- **Marine conditions module** — for coastal locations, a WMO sea-state severity
  badge plus live wave-height and sea-surface-temperature readings. The Marine
  tab appears automatically only when a pin is coastal.
- **Climate period selector** — switch climate between **1-year**, **5-year**, and
  **10-year** ERA5 historical averages, in both the Overview and Advanced views.
  Multi-year periods show a monthly **average high/low temperature range** chart.
- **Live webcams (Windy)** — nearby webcam thumbnails with an in-site player,
  surfaced both on the map and in the Context tab.
- **Pollen & flood risk** — pollen levels (CAMS, Europe) added to Air Quality, and
  global river-flood risk (GloFAS), each with a clear *not-applicable* state where
  there's no coverage instead of a misleading zero.
- **Expanded nearby places (Overpass)** — hazard and infrastructure layers (power
  substations, wastewater plants, quarries, landfills, data centres, military
  sites), transit hubs, harbours, and airports.
- **Per-type map icons** — nearby places now render as distinct, colour-grouped
  glyph badges (hospital, school, café, theatre, transit, park, …) instead of
  generic coloured dots.
- **Always-on context markers** — nearby places, POIs, Wikipedia entries, and
  webcams appear on the map as soon as a pin is dropped, no longer gated behind
  the Context tab.
- **IP-based default map centre**, **mobile-responsive layout** with a draggable
  bottom sheet, and a **GPS accuracy badge**.

### Changed
- Climate Overview cards now recompute for the selected 1/5/10-year window, and
  all climate copy reflects the active period (e.g. "5-YEAR READOUT").
- Map opens centred on your approximate (IP) location rather than prompting for
  geolocation up front.

### Fixed
- **Hospital classification** — stopped demoting real general hospitals to
  "clinic" when they list specialities (e.g. university hospitals), and dropped
  unnamed `amenity=hospital` stubs that were polluting "nearest hospital".
- Removed benches and similar noise from nearby places.
- Military sites recategorised out of generic hazards; school-level classification
  and various mobile-layout fixes.

## [1.0.0] — 2026-06-18 — Reskin + UX Overhaul

### Added / Changed
- Rebrand to **settl.** with a rounded-corner reskin (HUD edges removed).
- 3-state theme toggle (light/dark/system) with OS detection, and A-/A+ font
  scaling.
- Debounced location autocomplete, a geolocation button, and plain-English
  section headers.
- Saved locations (heart toggle, persisted locally).
- Lucide icon system across the module rail, section headers, and service rows.
- **ReportPanel overview mode** — a scrollable at-a-glance overview inside the
  module sheet with a view toggle and severity cards.

## [0.1.0] — Location Intelligence Core (pre-GSD)

### Added
- Six data modules: Climate, Wind, Sun, Hazards, Air Quality, Context.
- Compare mode, building-footprint detection, risk synthesis, and URL state
  persistence.

[1.1.0]: https://github.com/d1mski/settl./releases/tag/v1.1.0
[1.0.0]: https://github.com/d1mski/settl./releases/tag/v1.0.0
[0.1.0]: https://github.com/d1mski/settl./releases/tag/v0.1.0
