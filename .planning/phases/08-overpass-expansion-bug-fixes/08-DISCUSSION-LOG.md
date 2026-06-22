# Phase 8: Overpass Expansion + Bug Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 08-overpass-expansion-bug-fixes
**Areas discussed:** Hazard label & grouping, Hazard surfacing
**Not discussed (Claude's discretion):** Mobile layout

---

## Gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Hazard label & grouping | User-facing label + color + sort/grouping of the new category | ✓ |
| Hazard surfacing | Where hazards appear: count bar / nearest-X rows / dedicated list / markers | ✓ |
| Mobile layout | FIX-01 breakpoint + map/panel split | (deferred to Claude) |

**Search radius** was proposed then dropped pre-discussion (advisor): Claude's
discretion, defaults from existing per-type `buildQuery` radii; near-duplicate of
locked HAZ-03 bands.

---

## Hazard label & grouping

| Option | Description | Selected |
|--------|-------------|----------|
| 'Hazard', red/orange | Lowercase `hazard` key, red-orange marker; matches ROADMAP wording | ✓ |
| 'Infrastructure', neutral | Softer framing, neutral color; diverges from ROADMAP, undersells HAZ-03 escalation | |

**User's choice:** 'Hazard', red/orange
**Notes:** Color must avoid colliding with `industrial` amber and `airport` red.

---

## Hazard surfacing

| Option | Description | Selected |
|--------|-------------|----------|
| nearest-X rows + free markers | Extend `nearestByType` with hazard types; markers free from color pick; no new component | ✓ |
| Dedicated hazard list section | New standalone section listing all hazards (multiples per type); more UI | |

**User's choice:** nearest-X rows + free markers
**Notes:** Reuses hospital/pharmacy row pattern; satisfies ROADMAP "with distance".

---

## Claude's Discretion

- Mobile layout (FIX-01) breakpoint + map/panel split — recommended default recorded in CONTEXT.md.
- HAZ-03 severity message wording.
- Per-type Overpass search radii.

## Deferred Ideas

None — discussion stayed within phase scope.
