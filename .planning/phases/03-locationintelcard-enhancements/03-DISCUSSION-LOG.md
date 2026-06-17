# Phase 3: LocationIntelCard Enhancements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 03-locationintelcard-enhancements
**Areas discussed:** GPS button placement, Autocomplete dropdown, Section code cleanup scope

---

## GPS Button Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Inside search input | Crosshair icon inside the input field, right side | |
| Next to EXEC button | Separate icon button beside the existing EXEC button | |
| Below search input | Full-width secondary button underneath the search bar | |

**User's choice:** "All decisions have already been made and captured in this html" — pointed to `mockups/reskin-interactive.html`
**Notes:** Mockup shows GPS crosshair button LEFT of input, as a standalone button in the input row. Layout: [GPS] [input] [GO]. All decisions extracted from the approved mockup rather than discussed interactively.

---

## Autocomplete Dropdown

**User's choice:** Per mockup — dropdown below input, surface bg, rounded, shadow, 6 results with map-pin icon, 3-char min, click-outside dismiss
**Notes:** Mockup uses 350ms debounce but REQUIREMENTS.md specifies 400ms — spec takes precedence.

---

## Section Code Cleanup Scope

**User's choice:** Per mockup — zero section codes anywhere in the UI. Both SectionHeader component and inline LocationIntelCard labels cleaned up.
**Notes:** Mockup uses plain text labels throughout ("Input", "FIX A", "Climate", etc.)

---

## Claude's Discretion

- Keyboard navigation details (ArrowUp/Down/Enter/Escape)
- AbortController cleanup strategy
- Component extraction decisions

## Deferred Ideas

None
