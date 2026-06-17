# Phase 5: ModuleRail + Lucide Icons — Research

**Researched:** 2026-06-17
**Domain:** Icon system replacement, React icon rail architecture, toggle affordance UX
**Confidence:** HIGH

---

## Summary

Phase 5 replaces the existing hand-rolled inline SVG icons in ModuleRail and the three `⚠` glyphs in module files with Lucide React components. The codebase has no emoji in the traditional sense — "emoji and HUD-style icons" in SKIN-04 refers to (1) inline SVG blocks in `ModuleRail.tsx` ICONS record, and (2) three Unicode `⚠` warning glyphs in `GridResolutionWarning.tsx`, `BuildingCard.tsx`, and `WindModule.tsx`. The SectionHeader component uses `§` codes (text, not icons) — those are addressed by UX-01 in Phase 3, not this phase.

The phase also adds an overview/advanced toggle affordance to the rail. This is a UI-only toggle — it sets a state bit that Phase 6 consumes to render ReportPanel content. The toggle must be visually distinct from the six module nav buttons.

`lucide-react` is not yet installed. It is the one approved external addition per `PROJECT.md`. Current stable version is **1.20.0** (verified from npm registry 2026-06-17).

**Primary recommendation:** Install `lucide-react@^1.20.0`, replace `ICONS` record entries with named Lucide components, replace three `⚠` glyphs with `<TriangleAlert>`, add a `<LayoutDashboard>` / `<List>` toggle button at the bottom of the rail separated by a visual divider.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SKIN-04 | Lucide React icons replace all emoji and HUD-style icons in module rail, section headers, and service rows | ModuleRail ICONS record has 6 inline SVGs; 3 `⚠` Unicode glyphs in modules; no emoji found elsewhere |
| UX-03 (partial) | Rail toggle UI for Overview / Advanced mode — ReportPanel content is Phase 6 | Toggle button with state lift to App.tsx; visually distinct from nav icons via divider + different Lucide icon |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lucide-react | ^1.20.0 | SVG icon components | Project-approved addition; named exports tree-shake cleanly with Vite; uses `currentColor` for theme inheritance |

### No Additional Libraries Needed

All other work uses existing Tailwind utilities, React state, and the established ThemeContext from Phase 2.

**Installation:**
```bash
npm install lucide-react
```

**Version verified:** 1.20.0 — confirmed from npm registry 2026-06-17.

---

## Architecture Patterns

### Icon Usage Pattern

Import named icons directly. Vite handles tree-shaking via ES module named exports — no alias config required in production. Dev mode pre-bundling is slower with barrel imports but acceptable for this project size.

```tsx
// Source: https://lucide.dev/guide/packages/lucide-react
import { Sun, Wind, Thermometer, TriangleAlert, Globe, Flame, Gauge } from 'lucide-react';
```

### Sizing Pattern

Use `size` prop for consistency. Do NOT mix `size` prop with `w-5 h-5` Tailwind classes on the same icon — pick one system and stick to it. The existing rail uses `<span className="w-5 h-5">`, so pass `size={20}` to Lucide components placed there, or keep the span wrapper and let the SVG fill it via `className="w-full h-full"`.

**Recommended:** Keep the `<span className="w-5 h-5">` wrapper pattern already in ModuleRail — render Lucide icon inside it with `className="w-full h-full"`. This preserves the existing layout contract.

```tsx
<span className="w-5 h-5">
  <Sun className="w-full h-full" strokeWidth={1.4} />
</span>
```

`strokeWidth={1.4}` matches the existing hand-rolled SVGs — keep it consistent across all icons.

### Color Inheritance

Lucide icons use `currentColor` by default. The rail button already sets `text-cyan` (active) and `text-muted` / `hover:text-ink` (inactive). Icons inherit these without any additional color prop.

### Module-to-Icon Mapping

| Module (TabId) | Current SVG | Lucide Replacement | Reasoning |
|----------------|-------------|-------------------|-----------|
| climate | inline sun rays circle | `Sun` | Direct semantic match |
| wind | inline wind curves | `Wind` | Direct semantic match |
| sun | inline sun with rays | `Sun` | `Sunrise` or `SunDim` if Sun conflicts with climate |
| hazards | inline triangle | `TriangleAlert` | Warning triangle, exact match |
| air | inline waves | `Wind` or `CloudFog` | Air movement / atmospheric |
| context | inline globe | `Globe` | Direct semantic match |

**sun vs climate conflict:** Both map to sun-family icons. Use `Sun` for climate (temperature/heat) and `Sunrise` for sun (solar path/daylight). `Sunrise` is a distinct Lucide icon showing horizon line.

### Warning Glyph Replacement

Three locations use `⚠` Unicode:
1. `GridResolutionWarning.tsx:62` — inline text `⚠ MODEL BIAS WARNING`
2. `BuildingCard.tsx:122` — inline text `⚠ NEAREST FOOTPRINT …`
3. `WindModule.tsx:116` — inline text `⚠ WIND CHILL FLAG`

Replace with `<TriangleAlert size={12} className="inline-block align-middle" />` immediately before the text. Keep existing text content unchanged.

### Overview/Advanced Toggle Pattern

Add a toggle button at the **bottom** of the rail, separated from nav icons by a visual divider (`<div className="border-t border-edge" />`). This is the established UX pattern for grouping distinct action types in icon rails.

```tsx
// Toggle button — visually distinct from module nav via position + divider
<div className="border-t border-edge mt-auto" />
<button
  onClick={onToggleView}
  title={view === 'overview' ? 'Advanced view' : 'Overview'}
  aria-label={view === 'overview' ? 'Switch to Advanced view' : 'Switch to Overview'}
  className="flex flex-col items-center justify-center gap-1 py-3 text-muted hover:text-ink hover:bg-edge/40 transition-colors"
>
  <span className="w-5 h-5">
    {view === 'overview'
      ? <List className="w-full h-full" strokeWidth={1.4} />
      : <LayoutDashboard className="w-full h-full" strokeWidth={1.4} />
    }
  </span>
  <span className="text-[8px] font-mono tracking-widest">
    {view === 'overview' ? 'ADV' : 'OVW'}
  </span>
</button>
```

The toggle needs a new `view` prop and `onToggleView` callback lifted to `App.tsx` (or wherever `ModuleRail` is composed), so Phase 6 can consume the same state.

### State Lift for View Toggle

`App.tsx` owns `viewMode: 'overview' | 'advanced'` state. Pass down:
- To `ModuleRail`: `view={viewMode}` + `onToggleView={() => setViewMode(v => v === 'overview' ? 'advanced' : 'overview')}`
- To `ModuleSheet` (Phase 6): `view={viewMode}` — Phase 6 reads it to switch ReportPanel content

This avoids introducing new context for a simple two-state toggle.

### Anti-Patterns to Avoid

- **Don't import from barrel then alias:** Just use named imports from `lucide-react`. The project is small enough that dev-mode pre-bundling time is not a problem.
- **Don't use both `size` prop and className dimensions on the same icon:** Pick one. Use the span-wrapper + `className="w-full h-full"` approach to stay consistent with existing rail code.
- **Don't put `aria-hidden` on nav icons:** These icons are the navigation control — they need `aria-label` on the button, not `aria-hidden` on the icon.
- **Don't add a new z-index context:** The toggle is in the same rail — no new stacking layer.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Warning triangle icon | Unicode `⚠` or custom SVG | `TriangleAlert` from lucide-react | Consistent stroke weight, theming, size props |
| Module nav icons | Inline SVG `<path>` records | Named Lucide imports | Already designed, accessible, maintained |
| Toggle icon | Custom SVG switch | `LayoutDashboard` / `List` from lucide-react | No custom drawing needed |
| Icon color system | Hardcoded fill/stroke | `currentColor` via Tailwind text utilities | Already works in existing rail |

---

## Common Pitfalls

### Pitfall 1: sun vs climate icon collision

**What goes wrong:** Both `climate` and `sun` modules logically map to a sun icon, causing visual confusion in the rail.
**Why it happens:** Semantic overlap — climate includes heat/UV, sun module is about solar path.
**How to avoid:** Use `Sun` for `climate`, `Sunrise` for `sun`. Sunrise has a distinct horizon line that communicates "solar path / daylight" rather than "heat/temperature".
**Warning signs:** Two identical icons adjacent in the rail.

### Pitfall 2: strokeWidth inconsistency

**What goes wrong:** Some icons look heavier or lighter than others.
**Why it happens:** Lucide default `strokeWidth` is `2`. The existing hand-rolled SVGs use `1.4`.
**How to avoid:** Pass `strokeWidth={1.4}` to every Lucide icon in the rail and in inline warning replacements.

### Pitfall 3: Toggle state not reaching Phase 6

**What goes wrong:** Phase 6 cannot read the view toggle state because it was stored locally in ModuleRail.
**Why it happens:** Lifting state to the wrong level.
**How to avoid:** State lives in `App.tsx`. `ModuleRail` receives `view` + `onToggleView` as props. `ModuleSheet` receives `view` as a prop for Phase 6 to consume.

### Pitfall 4: Missing aria-label on icon-only buttons

**What goes wrong:** Screen readers announce buttons as unlabeled.
**Why it happens:** The `title` attribute is not a reliable accessibility label.
**How to avoid:** Every icon-only button gets `aria-label`. The `title` tooltip can remain as a visual tooltip for sighted users, but `aria-label` is required for a11y.

### Pitfall 5: SectionHeader `§` codes are not this phase

**What goes wrong:** Planner includes SectionHeader icon changes in this phase.
**Why it happens:** SKIN-04 mentions "section headers" — but SectionHeader uses `§` text codes, not icons. Plain-English label replacement is UX-01 (Phase 3).
**How to avoid:** Phase 5 touches SectionHeader only if an icon is added alongside the title. If no icon is specified, leave SectionHeader alone.

---

## Code Examples

### Install and basic import

```tsx
// Source: https://lucide.dev/guide/packages/lucide-react
import { Sun, Sunrise, Wind, TriangleAlert, Flame, Globe, Gauge, LayoutDashboard, List } from 'lucide-react';
```

### Rail icon slot pattern

```tsx
// Replaces the ICONS record entry — span wrapper preserved from existing code
const ICONS: Record<TabId, ReactNode> = {
  climate: <Sun className="w-full h-full" strokeWidth={1.4} />,
  wind:    <Wind className="w-full h-full" strokeWidth={1.4} />,
  sun:     <Sunrise className="w-full h-full" strokeWidth={1.4} />,
  hazards: <TriangleAlert className="w-full h-full" strokeWidth={1.4} />,
  air:     <Gauge className="w-full h-full" strokeWidth={1.4} />,
  context: <Globe className="w-full h-full" strokeWidth={1.4} />,
};
```

### Warning glyph replacement

```tsx
// Before: <span>⚠ WIND CHILL FLAG</span>
// After:
<span className="flex items-center gap-1">
  <TriangleAlert size={12} strokeWidth={1.4} className="shrink-0" />
  WIND CHILL FLAG
</span>
```

### ModuleRail props extension

```tsx
interface Props {
  active: TabId | null;
  onSelect: (tab: TabId) => void;
  coordsReady: boolean;
  view: 'overview' | 'advanced';           // NEW
  onToggleView: () => void;                 // NEW
}
```

---

## Environment Availability

Step 2.6: SKIPPED — this phase is code-only changes with one npm install. No external services, databases, or CLI tools beyond npm are required.

---

## Validation Architecture

`workflow.nyquist_validation` key absent from `.planning/config.json` — treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config files or test directories found in project |
| Config file | None |
| Quick run command | `npm run typecheck` (TypeScript compile check) |
| Full suite command | `npm run build` (full type + bundle) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKIN-04 | No emoji/HUD glyphs in rendered output | smoke (visual) | `npm run typecheck` — confirms no TS errors | N/A — manual visual check |
| SKIN-04 | All 6 rail slots render Lucide SVGs | unit | manual browser inspection | N/A |
| UX-03 (partial) | Toggle button present in rail, changes icon on click | smoke | manual browser inspection | N/A |
| UX-03 (partial) | Toggle state propagates to parent via callback | type check | `npm run typecheck` | N/A |

### Sampling Rate

- **Per task commit:** `npm run typecheck`
- **Per wave merge:** `npm run build`
- **Phase gate:** `npm run build` green + visual inspection of rail in both dark and light themes before `/gsd:verify-work`

### Wave 0 Gaps

None — no test infrastructure exists for this project. TypeScript type checking and manual visual verification are the validation strategy. No test files need to be created for this phase.

---

## Sources

### Primary (HIGH confidence)
- https://lucide.dev/guide/packages/lucide-react — installation, import syntax, sizing, color, accessibility
- npm registry `npm view lucide-react version` → 1.20.0 (verified 2026-06-17)

### Secondary (MEDIUM confidence)
- https://javascript.plainenglish.io/tree-shaking-lucide-react-icons-with-vite-and-vitest — Vite dev-mode pre-bundling behavior
- https://christopher.engineering/en/blog/lucide-icons-with-vite-dev-server — Vite alias optimization (not needed at this project scale)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — lucide-react version verified from npm registry; official docs confirm API
- Architecture: HIGH — patterns derived from existing codebase structure + official Lucide docs
- Pitfalls: HIGH — sun/climate collision and strokeWidth are directly observable from source; state lift pattern is standard React
- Icon name mapping: MEDIUM — icon names confirmed from lucide.dev icons page; `Gauge` for air quality is a judgment call (could use `Wind` or `CloudFog`)

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (lucide-react is stable; icon names rarely change between minor versions)
