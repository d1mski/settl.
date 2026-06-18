# Phase 6: ReportPanel (Overview Mode) - Research

**Researched:** 2026-06-18
**Domain:** React component composition, severity mapping, Framer Motion view transitions
**Confidence:** HIGH

## Summary

Phase 6 builds a new `ReportPanel` component that renders inside the existing `ModuleSheet` when `view === 'overview'`. The integration point is already wired: `App.tsx` owns `viewMode` state, passes it to `ModuleSheet` as `view`, and `ModuleSheet` currently aliases it to `_view` with a Phase 6 comment. The work is to activate that prop — branch on `view` inside `ModuleSheet` to show either `ReportPanel` (overview) or the existing module-detail layout (advanced).

Severity data already exists via `synthesiseRisks()` in `riskSynthesis.ts`. Each module has a clear headline metric derivable from its data hook. The `StatusDot` component accepts `tone: 'good' | 'warn' | 'risk'` which maps directly to the OK / Watch / Alert three-level system. No new infrastructure is needed — this phase is assembly work.

Drill-down on card click requires calling both `setViewMode('advanced')` and `handleSelect(tabId)` atomically. `handleSelect` is not currently passed into `ModuleSheet`, so a new `onDrillDown` prop must be added and threaded through `App.tsx → ModuleSheet → ReportPanel`.

**Primary recommendation:** Create `ReportPanel.tsx` with 6 `ChapterCard` components, wire it into `ModuleSheet` behind the `view` branch, and add `onDrillDown: (tab: TabId) => void` prop to `ModuleSheet`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Each card shows 1 key headline metric + severity badge. Minimal, scannable — fits ND-friendly philosophy.
- **D-02:** Each card displays the same Lucide icon used in the rail (Sun, Wind, Sunrise, TriangleAlert, Gauge, Globe).
- **D-03:** Plain English labels per card ("Climate", "Wind", "Sun Exposure", "Hazards", "Air Quality", "Context").
- **D-04:** Three severity levels: OK / Watch / Alert, displayed as colored dot + label using existing `--good` / `--warn` / `--risk` CSS variables. Consistent with StatusDot component pattern.
- **D-05:** Threshold logic derived from existing risk synthesis data and API values — sensible defaults, tunable later.
- **D-06:** Clicking a card switches to advanced view AND selects that module's tab.
- **D-07:** Rail toggle (OVW/ADV from Phase 5) is the only back-to-overview affordance — no extra breadcrumb or back link.
- **D-08:** Before location loaded: 6 placeholder cards with module icon + label + '--' for data + muted "Set a location to see data" message.
- **D-09:** Partial API failure: failed card shows icon + label but grayed out with "Data unavailable" text. Other cards render normally.

### Claude's Discretion
- Which headline metric to surface per module
- Card layout details (spacing, grid vs stack, responsive within 520px panel)
- Loading skeleton vs instant render when data arrives
- AnimatePresence transition between overview and advanced views
- Whether to extract severity logic into a shared util or keep inline

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-02 | Overview report panel displays scrollable chapters with data from all modules as the default view | ReportPanel component with 6 ChapterCards, rendered when `view === 'overview'` in ModuleSheet |
| UX-03 | User can toggle between Overview and Advanced (existing module detail) views | Already partially complete (Phase 5); Phase 6 activates the `view` prop in ModuleSheet to branch rendering |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (existing) | 18.x | Component rendering | Already in project |
| framer-motion (existing) | 11.x | AnimatePresence transitions | Already used in ModuleSheet for tab switches |
| lucide-react (existing) | latest | Card icons | Same icons as ModuleRail — D-02 locked |
| Tailwind CSS (existing) | 3.x | Layout + color tokens | All existing components use it |

No new packages required.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| riskSynthesis.ts (existing util) | — | Severity scoring for Hazards card | Call synthesiseRisks() for hazard card severity |

**Installation:** None needed.

---

## Architecture Patterns

### Recommended File Structure
```
src/
├── components/
│   ├── shell/
│   │   ├── ModuleSheet.tsx          # MODIFY: activate view prop, add onDrillDown
│   │   └── ReportPanel.tsx          # NEW: overview panel with 6 chapter cards
│   └── ui/
│       └── ChapterCard.tsx          # NEW: single card component (or inline in ReportPanel)
├── utils/
│   └── overviewSeverity.ts          # NEW (if extracted): per-module severity thresholds
```

### Pattern 1: ModuleSheet view branching

`ModuleSheet` currently aliases `view` to `_view`. Phase 6 activates it:

```tsx
// ModuleSheet.tsx — replace the alias with actual branching
export function ModuleSheet({ active, coordsA, coordsB, compareMode, onClose, view, onDrillDown }: Props) {
  return (
    <AnimatePresence>
      {active && (
        <motion.aside ...>
          {view === 'overview' ? (
            <ReportPanel
              coordsA={coordsA}
              onDrillDown={onDrillDown}
            />
          ) : (
            <>
              {/* existing header + Suspense/module content */}
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
```

### Pattern 2: onDrillDown prop threading

The card click must trigger two state updates in App.tsx. The cleanest approach is a single callback:

```tsx
// App.tsx
const handleDrillDown = useCallback((tab: TabId) => {
  update({ tab });
  setSheetOpen(true);
  setViewMode('advanced');
}, [update]);

// Pass to ModuleSheet:
<ModuleSheet ... onDrillDown={handleDrillDown} />
```

```tsx
// ModuleSheet Props interface — add:
onDrillDown: (tab: TabId) => void;
```

### Pattern 3: Per-module severity derivation

Each card calls its own data hook (same hooks the full modules use) and derives a 3-level badge. The `synthesiseRisks` utility already covers Hazards. For the other modules, derive inline from hook data:

| Module | Hook | Headline Metric | OK threshold | Watch | Alert |
|--------|------|-----------------|--------------|-------|-------|
| Climate | useOpenMeteo | Annual mean temp (°C) | always OK unless heat risk | heat days 5–30 | heat days > 30 |
| Wind | useOpenMeteo | Max gust (km/h) | < 60 | 60–90 | > 90 |
| Sun | useOpenMeteo | Peak UV index | UV ≤ 5 | UV 6–7 | UV ≥ 8 |
| Hazards | useEarthquakes + useWildfires | Highest risk severity | no risks | watch/info | warn/critical |
| Air Quality | useAirQuality | Mean PM2.5 (µg/m³) | ≤ 5 WHO | 5–15 | > 15 |
| Context | useOverpassFeatures | Amenities count | any found | — | — (rarely alerts) |

**Severity → StatusDot tone mapping:**
```tsx
const SEVERITY_TONE = {
  ok: 'good',      // #66ffa3
  watch: 'warn',   // #ffb347
  alert: 'risk',   // #ff4d5e
} as const;
```

### Pattern 4: ChapterCard structure

```tsx
interface ChapterCardProps {
  tabId: TabId;
  icon: LucideIcon;
  label: string;
  metric: string | null;   // null = loading, '--' = no location
  unit?: string;
  severity: 'ok' | 'watch' | 'alert' | 'unavailable';
  onClick: () => void;
}
```

### Pattern 5: AnimatePresence between overview/advanced

The existing `motion.aside` in `ModuleSheet` already transitions on `key={active}`. For view switching inside the sheet, add a nested `AnimatePresence` with `mode="wait"`:

```tsx
<AnimatePresence mode="wait">
  {view === 'overview' ? (
    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ReportPanel ... />
    </motion.div>
  ) : (
    <motion.div key="advanced" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* existing module content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Anti-Patterns to Avoid

- **New z-index context on ReportPanel wrapper:** ReportPanel renders INSIDE the existing `motion.aside` (z-20). Do NOT add `z-index`, `position: relative/absolute`, or `isolation: isolate` to the panel or card wrappers — this would bury Leaflet popups (STATE.md locked decision).
- **Fabricated data in placeholder state:** D-08 specifies '--' + muted message. Never show estimated or fake values when no location is set.
- **Separate data fetches in ReportPanel:** The overview calls the same hooks as the full modules. Don't create separate API calls. If modules are already mounted (lazy), consider prop-drilling data; if not, duplicate hook calls are acceptable (React deduplicates by key/coords).
- **Re-fetching on view switch:** D-06/D-07 require no data reload when toggling overview ↔ advanced. Hooks must remain mounted — don't unmount them on view toggle.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Severity dot indicator | Custom CSS dot | `StatusDot` component (tone prop) | Already matches `--good`/`--warn`/`--risk` colors, has pulse animation |
| Hazard severity scoring | Custom threshold logic | `synthesiseRisks()` from riskSynthesis.ts | 200+ lines of calibrated logic already tested |
| View transition animation | CSS transitions | `AnimatePresence` + `motion.div` | Already in ModuleSheet, consistent with existing tab transitions |
| Loading placeholder | Custom spinner | `LoadingSkeleton` component | Already imported in ModuleSheet |
| Module icons | New icon set | Same ICONS record from ModuleRail | D-02 requires same icons — reuse the record |

---

## Common Pitfalls

### Pitfall 1: Hooks called conditionally or in wrong order
**What goes wrong:** ReportPanel calls 6 data hooks. If any hook is called inside a conditional or map(), React throws "hooks called in different order" errors.
**Why it happens:** Cards might seem like a natural place to colocate hooks, but hooks can't be called inside loops or conditions.
**How to avoid:** Call ALL 6 data hooks at the top of `ReportPanel` unconditionally, then pass derived values down to `ChapterCard` as props.
**Warning signs:** React invariant violation on view toggle.

### Pitfall 2: ModuleSheet unmounts lazy modules on view switch
**What goes wrong:** If the advanced view content is wrapped in a conditional that unmounts when `view === 'overview'`, lazy modules re-fetch on every toggle.
**Why it happens:** Natural instinct to only render the active view.
**How to avoid:** Use CSS `display: none` or `visibility: hidden` / opacity-0 for the inactive view, OR keep both views mounted with `AnimatePresence` + `mode="wait"` which handles exit animations before unmounting. Prefer AnimatePresence approach for clean transitions.

### Pitfall 3: onDrillDown prop missing from ModuleSheet interface
**What goes wrong:** TypeScript compile error; card clicks do nothing.
**Why it happens:** ModuleSheet.Props interface was defined before Phase 6 and doesn't include `onDrillDown`.
**How to avoid:** Update Props interface in ModuleSheet AND the destructuring line (currently aliases `view` as `_view` — remove the alias).

### Pitfall 4: Severity calculation returns wrong level when data is loading
**What goes wrong:** Card shows "OK" badge while data is still loading, then flickers to "Alert".
**Why it happens:** Hook returns `{ status: 'loading', data: null }` — null data defaults to OK.
**How to avoid:** Return `'ok'` severity ONLY when `status === 'success'` AND data confirms OK. When `status === 'loading'`, show loading indicator (null metric). When `status === 'error'`, show `'unavailable'` state per D-09.

### Pitfall 5: Sheet header renders wrong title in overview mode
**What goes wrong:** ModuleSheet header shows "§03 CLIMATE · THERMAL..." when overview is active, which is confusing.
**Why it happens:** Header currently always renders the active tab's title.
**How to avoid:** In overview mode, replace the header content with a "Location Report" or "Overview" title. Conditionally render the module-specific header only when `view === 'advanced'`.

---

## Code Examples

### StatusDot usage for severity badge
```tsx
// Source: src/components/hud/StatusDot.tsx
<StatusDot tone="good" pulse={false} label="OK" />
<StatusDot tone="warn" pulse={true} label="WATCH" />
<StatusDot tone="risk" pulse={true} label="ALERT" />
```

### ReportPanel data hook pattern (top-level, unconditional)
```tsx
// Source: riskSynthesis.ts pattern + ClimateModule.tsx hook pattern
export function ReportPanel({ coordsA, onDrillDown }: Props) {
  const climate = useOpenMeteo(coordsA);
  const aqi = useAirQuality(coordsA);
  const earthquakes = useEarthquakes(coordsA);
  const wildfires = useWildfires(coordsA);
  const features = useOverpassFeatures(coordsA);

  // derive per-card severity from hook states...
  const climateSeverity = deriveClimateSeverity(climate);
  // ...
}
```

### Existing ModuleRail icons (reuse this record)
```tsx
// Source: src/components/shell/ModuleRail.tsx
// Same ICONS record pattern — import Lucide icons in same order
// climate: Thermometer, wind: Wind, sun: Sunrise,
// hazards: TriangleAlert, air: Gauge, context: Globe
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `view` prop aliased as `_view` (no-op) | Activate `view` prop to branch rendering | Phase 6 | ModuleSheet gains overview/advanced branching |
| ModuleSheet always shows module-detail | Default view is overview; advanced on toggle | Phase 6 | UX-02 satisfied |

---

## Open Questions

1. **Hooks deduplication: ReportPanel vs full modules**
   - What we know: React does NOT deduplicate hook calls by default — two components calling `useOpenMeteo(coords)` will make two API requests unless the hook implements internal caching (e.g., via SWR, React Query, or a module-level cache).
   - What's unclear: Whether current hooks (useOpenMeteo, useAirQuality etc.) implement any caching/deduplication.
   - Recommendation: Check each hook's implementation before planning. If no caching, ReportPanel overview data may trigger duplicate fetches when user is in advanced view with a module already loaded. Acceptable for v1 but worth noting.

2. **Overview panel width**
   - What we know: ModuleSheet is `w-[min(680px,calc(100vw-200px))]`. ReportPanel fills 100% of that.
   - What's unclear: Whether 2-column card grid fits cleanly at minimum width (~350px on small viewports).
   - Recommendation: Default to single-column stacked cards (simpler, always fits). Claude's discretion per CONTEXT.md.

---

## Environment Availability

Step 2.6: SKIPPED — phase is purely code changes within existing React/Vite project. No new external tools, services, or CLIs required.

---

## Validation Architecture

`workflow.nyquist_validation` is not set in config.json — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not detected (no test config files found) |
| Config file | None — Wave 0 gap |
| Quick run command | TBD after framework install |
| Full suite command | TBD after framework install |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-02 | Overview panel renders with 6 chapter cards when view=overview | unit | TBD | ❌ Wave 0 |
| UX-02 | Placeholder cards show '--' when no coords | unit | TBD | ❌ Wave 0 |
| UX-02 | Failed card shows "Data unavailable", others render normally | unit | TBD | ❌ Wave 0 |
| UX-03 | Card click calls onDrillDown with correct tabId | unit | TBD | ❌ Wave 0 |
| UX-03 | view=advanced renders module-detail, not overview | unit | TBD | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] No test framework detected — install vitest + @testing-library/react before implementation
- [ ] `src/components/shell/ReportPanel.test.tsx` — covers UX-02 card rendering
- [ ] `src/components/shell/ModuleSheet.test.tsx` — covers UX-03 view branching

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reads: `App.tsx`, `ModuleSheet.tsx`, `RiskPanel.tsx`, `StatusDot.tsx`, `riskSynthesis.ts`, `types/index.ts`, `ClimateModule.tsx`
- `.planning/phases/06-reportpanel-overview-mode/06-CONTEXT.md` — locked decisions
- `.planning/STATE.md` — accumulated project decisions (z-index constraint, viewMode ownership)

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — UX-02, UX-03 acceptance criteria

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing, no new packages
- Architecture: HIGH — integration points verified in source, hook patterns confirmed
- Severity thresholds: MEDIUM — sensible defaults per D-05, but tunable; exact numbers are Claude's discretion
- Pitfalls: HIGH — verified against actual source code (hook ordering, z-index, prop threading)

**Research date:** 2026-06-18
**Valid until:** 2026-07-18 (stable codebase, no fast-moving dependencies)
