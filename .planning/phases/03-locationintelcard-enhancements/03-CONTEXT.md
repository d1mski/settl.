# Phase 3: LocationIntelCard Enhancements - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning
**Source:** Extracted from approved mockup `mockups/reskin-interactive.html`

<domain>
## Phase Boundary

Enhance LocationIntelCard with autocomplete search, GPS geolocation button, and removal of all section codes. Users can find locations via autocomplete search or one-click geolocation without manual coordinate entry. All visible section codes are removed.

</domain>

<decisions>
## Implementation Decisions

### GPS Button (FEAT-01)
- **D-01:** Crosshair icon button (Lucide `crosshair`, 14x14px) placed LEFT of the search input, as a standalone button
- **D-02:** Input row layout is `[GPS button] [text input] [GO button]` in a flex row with gap
- **D-03:** Click-triggered only (`onclick`), never autofires on page load
- **D-04:** During locate: fixStatus shows "LOCATING..." in warn color
- **D-05:** On success: reverse geocode via Nominatim, update all fields (lat/lon/cc/loc/pin), fixStatus shows "ACTIVE" in good color
- **D-06:** On deny/error: fixStatus shows "DENIED" in risk color, report title shows "Grant Location Access", subtitle shows "Click the crosshair button or enter coordinates manually"
- **D-07:** No GPS support: fixStatus shows "NO GPS"
- **D-08:** Geolocation options: `{enableHighAccuracy: true, timeout: 10000, maximumAge: 0}`

### Autocomplete Dropdown (FEAT-02)
- **D-09:** Dropdown positioned absolute below input (`top: 100%`), 2px margin-top
- **D-10:** Styled: surface background (`var(--srf)`), 1px solid `var(--bdr-h)` border, rounded corners (`var(--r)`), large shadow (`var(--sh-lg)`)
- **D-11:** Max-height 200px with overflow-y auto scroll
- **D-12:** Each result shows Lucide `map-pin` icon + `display_name` truncated to 70 chars
- **D-13:** Max 6 results (`limit=6` in Nominatim query)
- **D-14:** 400ms debounce (per REQUIREMENTS.md FEAT-02 — mockup uses 350ms, spec takes precedence)
- **D-15:** 3-character minimum before firing search
- **D-16:** Click-outside dismisses dropdown (mousedown listener on document, check `.loc-input-wrap` containment)
- **D-17:** Selecting a result: fills input with truncated display_name, calls applyLocation with lat/lon/data

### Section Code Cleanup (UX-01)
- **D-18:** Remove ALL visible section codes from the entire app — mockup has zero instances of text in the format "NUMBER SEPARATOR LABEL"
- **D-19:** SectionHeader component: drop the code span entirely, make `code` prop optional or remove it
- **D-20:** LocationIntelCard inline labels: use plain text "Input" and "FIX A" (no code prefix)
- **D-21:** Advanced view section titles: plain uppercase labels ("Climate", "Air Quality", etc.)

### Button Text Change
- **D-22:** EXEC button renamed to "GO" per mockup design

### Claude's Discretion
- Keyboard navigation implementation details (ArrowUp/Down/Enter/Escape on dropdown) — standard patterns, no design preference expressed
- AbortController cleanup strategy — technical detail
- Whether to extract GPS button into a separate component or keep inline — architecture choice

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Source
- `mockups/reskin-interactive.html` — Approved interactive mockup; all visual decisions, layout, CSS variables, and behavior are defined here

### Existing Implementation
- `src/components/shell/LocationIntelCard.tsx` — Current search input, EXEC button, AbortController pattern
- `src/hooks/useNominatim.ts` — Existing `forwardGeocode`, throttle queue, Nominatim URL pattern
- `src/components/hud/SectionHeader.tsx` — Current component rendering section codes

### Requirements
- `.planning/REQUIREMENTS.md` — FEAT-01, FEAT-02, UX-01 acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useNominatim.ts`: `forwardGeocode` function with AbortController, throttle queue, Nominatim URL pattern — reuse directly for autocomplete
- `LocationIntelCard.tsx`: existing `abortRef`, `searching` state, input + EXEC button layout — augment in place
- CSS variables from reskin (Phase 1): `--srf`, `--bdr-h`, `--r`, `--sh-lg`, `--cyan`, `--good`, `--risk`, `--warn` — use for dropdown and status styling

### Established Patterns
- AbortController per-request cancellation (`abortRef.current?.abort()`) — extend for debounced requests
- State management: local `useState` in LocationIntelCard — keep consistent, no context needed
- Lucide icons already available in project dependency

### Integration Points
- `LocationIntelCard.tsx` is the sole file for GPS button + autocomplete changes
- `SectionHeader.tsx` is the sole file for code removal
- `App.tsx` may need geolocation integration if reverse geocode updates global location state

</code_context>

<specifics>
## Specific Ideas

- Mockup's exact input row layout: `loc-geo` button | `loc-input-wrap` (input + dropdown) | `loc-exec` button — all in a flex row with `gap: var(--s-xs)`
- Fix row below input shows: green dot + "FIX A" label + status text — status text changes color by state (warn=locating, good=active, risk=denied)
- Coord grid shows LAT/LON/CC/LOC in a 2-column grid layout
- Hint text below: "Map click . Drag pin . Enter coords"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-locationintelcard-enhancements*
*Context gathered: 2026-06-17 via mockup extraction*
