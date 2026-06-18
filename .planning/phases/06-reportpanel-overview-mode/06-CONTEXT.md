# Phase 6: ReportPanel (Overview Mode) - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a scrollable overview panel (ReportPanel) that renders inside ModuleSheet as the default view when `viewMode === 'overview'`. Shows 6 chapter cards — one per module — with headline metrics and severity badges. Clicking a card drills into that module's advanced view. The existing module-detail view becomes the "advanced" mode, toggled via the rail button from Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Chapter Card Content
- **D-01:** Each card shows 1 key headline metric + severity badge. Minimal, scannable — fits ND-friendly philosophy.
- **D-02:** Each card displays the same Lucide icon used in the rail (Sun, Wind, Sunrise, TriangleAlert, Gauge, Globe) for visual consistency.
- **D-03:** Plain English labels per card ("Climate", "Wind", "Sun Exposure", "Hazards", "Air Quality", "Context").

### Severity Mapping
- **D-04:** Three severity levels: OK / Watch / Alert, displayed as colored dot + label using existing `--good` / `--warn` / `--risk` CSS variables. Consistent with StatusDot component pattern.
- **D-05:** Threshold logic derived from existing risk synthesis data and API values — sensible defaults, tunable later.

### Drill-down Interaction
- **D-06:** Clicking a card switches to advanced view AND selects that module's tab. Natural "overview first, detail on demand" flow.
- **D-07:** Rail toggle (OVW/ADV from Phase 5) is the only back-to-overview affordance — no extra breadcrumb or back link.

### Empty / Loading States
- **D-08:** Before location is loaded: 6 placeholder cards with module icon + label + '--' for data + muted "Set a location to see data" message. Shows structure without fake data.
- **D-09:** Partial API failure: failed card shows icon + label but grayed out with "Data unavailable" text. Other cards render normally. No fabricated fallback.

### Claude's Discretion
- Which headline metric to surface per module (pick the most meaningful from existing API data)
- Card layout details (spacing, grid vs stack, responsive within the 520px panel)
- Loading skeleton vs instant render when data arrives
- AnimatePresence transition between overview and advanced views
- Whether to extract severity logic into a shared util or keep inline

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Source
- `mockups/reskin-interactive.html` — Approved interactive mockup; visual decisions, layout, CSS variables

### Existing Implementation
- `src/components/shell/ModuleSheet.tsx` — Current module switcher; accepts `view` prop (Phase 5); lazy-loads all 6 modules
- `src/components/shell/ModuleRail.tsx` — Rail with toggle button; passes `onToggleView` to App.tsx
- `src/App.tsx` — Owns `viewMode` state, threads `view` to ModuleSheet and ModuleRail
- `src/components/hud/RiskPanel.tsx` — Existing risk synthesis component (severity data source)
- `src/components/hud/StatusDot.tsx` — Existing severity dot component pattern
- `src/types/index.ts` — TabId type, TAB_LABELS, module type definitions

### Module Components (data sources for headline metrics)
- `src/components/modules/ClimateModule.tsx`
- `src/components/modules/WindModule.tsx`
- `src/components/modules/SunModule.tsx`
- `src/components/modules/HazardsModule.tsx`
- `src/components/modules/AirQualityModule.tsx`
- `src/components/modules/ContextModule.tsx`

### Requirements
- `.planning/REQUIREMENTS.md` — UX-02, UX-03 acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StatusDot` component: existing severity dot pattern — reuse for card badges
- `RiskPanel`: contains risk synthesis logic — extract or reference for severity thresholds
- Lucide icons already imported in `ModuleRail.tsx` — same ICONS record pattern reusable
- `TAB_LABELS` in types/index.ts — module label mapping
- `LoadingSkeleton` component exists for loading states
- `ErrorBoundary` component wraps module rendering

### Established Patterns
- Lazy loading modules via `React.lazy()` + `Suspense` in ModuleSheet
- `AnimatePresence` + `motion` from framer-motion for view transitions
- Module data hooks (each module fetches its own data internally)
- CSS variables: `--good`, `--warn`, `--risk`, `--srf`, `--bdr-h`, `--r`

### Integration Points
- `ModuleSheet` already accepts `view: 'overview' | 'advanced'` — branch rendering based on this prop
- Card click → needs to call both `onSelect(tabId)` and switch viewMode to 'advanced' — requires `onSelect` prop threaded to ReportPanel
- `viewMode` state lives in App.tsx — card drill-down triggers `setViewMode('advanced')` + `handleSelect(tab)`

</code_context>

<specifics>
## Specific Ideas

- Overview report as "scrollable narrative chapters" per design direction
- Cards should feel like a "location report" — trustworthy, calming, approachable
- ND-friendly: progressive disclosure — overview gives the big picture, advanced gives the detail

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-reportpanel-overview-mode*
*Context gathered: 2026-06-18*
