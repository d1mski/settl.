# Phase 6: ReportPanel (Overview Mode) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 06-reportpanel-overview-mode
**Areas discussed:** Chapter card content, Severity mapping, Drill-down interaction, Empty/loading states

---

## Chapter Card Content

### Card Density

| Option | Description | Selected |
|--------|-------------|----------|
| Headline only | 1 key metric + severity badge per module. Minimal, scannable. | * |
| Mini dashboard | 3-4 key stats per module in a compact grid. | |
| Narrative summary | 2-3 sentence prose per module. | |

**User's choice:** Headline only
**Notes:** Fits ND-friendly philosophy

### Card Icons

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, same Lucide icon | Visual consistency with rail. Icon + label + metric + badge. | * |
| No icon, just label | Cleaner cards, less visual noise. | |

**User's choice:** Yes, same Lucide icon

### Headline Metrics

| Option | Description | Selected |
|--------|-------------|----------|
| Claude decides | Pick most meaningful single metric per module from existing API data. | * |
| I'll specify each | User specifies which metric per module. | |

**User's choice:** Claude decides

---

## Severity Mapping

### Badge Style

| Option | Description | Selected |
|--------|-------------|----------|
| Colored dot + label | Small circle (green/amber/red) + text. Uses existing CSS vars. | * |
| Full-width colored stripe | Left border or top stripe in severity color. | |
| Background tint | Entire card gets subtle background tint. | |

**User's choice:** Colored dot + label

### Thresholds

| Option | Description | Selected |
|--------|-------------|----------|
| Claude decides | Derive sensible defaults from existing risk synthesis data. | * |
| I'll define thresholds | User specifies exact cutoff values per module. | |

**User's choice:** Claude decides

---

## Drill-down Interaction

### Card Tap

| Option | Description | Selected |
|--------|-------------|----------|
| Card click drills down | Click card -> switches to advanced view AND selects that module tab. | * |
| Cards are read-only | Informational only. User must use rail toggle + tab. | |
| CTA button per card | Explicit 'Go deeper' button per card. | |

**User's choice:** Card click drills down

### Back Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Rail toggle only | OVW/ADV toggle is already there. No extra back button. | * |
| Breadcrumb or back link | Text link above module detail. | |

**User's choice:** Rail toggle only

---

## Empty / Loading States

### No Location

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder cards with dashes | 6 cards with icon + label + '--' + muted prompt message. | * |
| Single prompt message | No cards, just centered message. | |
| Skeleton shimmer cards | Animated shimmer cards. | |

**User's choice:** Placeholder cards with dashes

### API Failure

| Option | Description | Selected |
|--------|-------------|----------|
| Muted card with error hint | Grayed out with 'Data unavailable'. Other cards normal. | * |
| Hide the failed card | Only show cards with data. | |
| Claude decides | Best approach for partial failures. | |

**User's choice:** Muted card with error hint

---

## Claude's Discretion

- Headline metric selection per module
- Card layout details (spacing, grid vs stack)
- Loading skeleton vs instant render
- AnimatePresence transition details
- Severity logic extraction

## Deferred Ideas

None
