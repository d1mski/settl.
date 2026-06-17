# Phase 1: CSS Foundations + Reskin - Research

**Researched:** 2026-06-17
**Domain:** CSS theming, Leaflet override specificity, brand rename, Tailwind v3 configuration
**Confidence:** HIGH

## Summary

Phase 1 is a pure CSS/markup phase: remove HUD decorative elements, add rounded corners, rebrand from BlindSpot to settl., and ensure Leaflet popups/tooltips survive all changes. No new dependencies. No new React state. No new hooks. The work is surgical -- modify existing CSS rules, remove decorative classes, update string literals, and add `border-radius` tokens.

The dominant risk is Leaflet CSS specificity. The current `index.css` already overrides Leaflet styles with `!important` but uses `border-radius: 0 !important` on popups and tooltips. Changing this to rounded corners requires updating those exact rules AND testing all four tooltip directional arrows (they use `border-color` on pseudo-elements that break independently). The second risk is incomplete HUD removal -- decorative elements are scattered across 6+ files and include CSS classes, inline SVGs, Tailwind config utilities, and pseudo-element overlays.

**Primary recommendation:** Work in three waves: (1) CSS token layer + Tailwind config, (2) component-level HUD removal + rounded corners, (3) brand rename + Leaflet verification. Each wave is independently verifiable.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SKIN-01 | All UI panels and cards use rounded corners (8-14px radius) with no sharp HUD edges | Tailwind `borderRadius` config extension + Panel component refactor + Leaflet override updates |
| SKIN-02 | Decorative elements removed (HUD brackets, noise overlay, scan lines, grid dots, gradient backdrops) | Complete inventory of 14 HUD artifacts across CSS and 6 component files identified below |
| SKIN-03 | App rebranded to settl. with cyan dot accent in logo, page title, and bottom strip | 8 branding locations identified: index.html title, LocationIntelCard wordmark, BottomStrip SYS string, package.json name, persistentCache store name, useNominatim CONTACT string, favicon.svg, Header.tsx |
</phase_requirements>

## Standard Stack

### Core (no changes needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^3.4.17 | Utility CSS framework | Already configured with CSS variable color system |
| framer-motion | ^11.11.17 | Panel animations | Existing -- keep, but aware of stacking context side effects |
| leaflet | ^1.9.4 | Map library | Core -- CSS overrides must not break its internal styles |

### No New Dependencies
This phase requires zero `npm install` commands. All work is CSS + markup changes.

## Architecture Patterns

### Current CSS Variable System
The app uses RGB triplet CSS variables (e.g., `--c-cyan: 126 234 255`) consumed by Tailwind via `rgb(var(--c-cyan) / <alpha-value>)`. Two palettes: `:root` (dark) and `.theme-light` (light). This pattern stays -- Phase 1 does not change the color token system, only removes decorative layers on top of it.

### Recommended Change Structure
```
src/
  index.css              # MODIFY: remove HUD CSS blocks, update Leaflet overrides, remove noise overlay
  components/
    hud/Panel.tsx         # MODIFY: remove brackets prop/logic, add rounded corners
    hud/SectionHeader.tsx # READ-ONLY for Phase 1 (section codes removed in Phase 3)
    hud/StatusDot.tsx     # NO CHANGE
    hud/StatReadout.tsx   # NO CHANGE (sharp left border accent is functional, not decorative)
    hud/DualReadout.tsx   # NO CHANGE
    hud/HairRule.tsx      # NO CHANGE
    hud/RiskPanel.tsx     # MODIFY: add rounded corners
    shell/MapHud.tsx      # MODIFY: remove corner brackets + center reticle SVG
    shell/BottomStrip.tsx # MODIFY: rebrand BLINDSPOT/0.1.0 -> settl./0.1.0
    shell/LocationIntelCard.tsx  # MODIFY: rebrand wordmark blind·spot -> settl.
    shell/ModuleSheet.tsx # MODIFY: remove bg-scan-line, add rounded corners
    shell/ModuleRail.tsx  # MODIFY: add rounded corners
    shell/BuildingCard.tsx # NO DIRECT CHANGE (uses Panel, inherits changes)
  components/Header.tsx   # MODIFY: rebrand "Blind Spot" -> "settl."
  utils/persistentCache.ts # MODIFY: rename store 'blindspot-cache' -> 'settl-cache'
  hooks/useNominatim.ts   # MODIFY: rename CONTACT 'blindspot-dev' -> 'settl-dev'
tailwind.config.js        # MODIFY: add borderRadius tokens, remove HUD utilities
index.html                # MODIFY: title + favicon reference
public/favicon.svg        # MODIFY: update to settl. brand mark
```

### Anti-Patterns to Avoid
- **Dynamic Tailwind class construction for radii:** Never write `` `rounded-${size}` ``. Use static class names or a lookup map. Tailwind purges dynamic strings at build time.
- **Global `*` selector for border-radius:** Will not reach Leaflet internal elements. Override Leaflet styles explicitly.
- **Removing noise overlay via JS instead of CSS:** The noise is a `body::before` pseudo-element in CSS. Remove it in CSS, not by adding a React component to counter it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Leaflet popup styling | Custom popup component | CSS overrides in index.css with `.leaflet-container` combinator selectors | Leaflet manages popup lifecycle internally; custom components break tooltip arrows |
| Brand logo with cyan dot | SVG component with animation | Plain HTML span with Tailwind color class (`text-cyan`) on the period character | Matches mockup exactly: `settl<span class="text-cyan">.</span>` |
| Rounded corner tokens | Per-component inline styles | Tailwind config `borderRadius` extension | Consistent across all components, purge-safe |

## Complete HUD Artifact Inventory

### CSS artifacts to REMOVE from index.css
| Artifact | Location (line) | What It Does | Action |
|----------|-----------------|-------------|--------|
| `body` background-image (gradient backdrop) | L72-76 | Radial gradient with `--c-backdrop-a/b` colors | Remove entire `background-image` property |
| `body::before` noise overlay | L79-89 | SVG fractal noise texture at z-9999 | Remove entire `body::before` block |
| `.theme-light body::before` | L91-94 | Light-mode noise opacity | Remove entire block |
| `.hud-brackets` + all variants | L264-335 | Corner bracket pseudo-elements | Remove entire block |
| `.hud-brackets-full` + `.bracket.*` | L295-335 | Four-corner bracket children | Remove entire block |
| `.text-shadow-hud` | L337-339 | Cyan glow text shadow | Remove entire block |
| `.hud-pin` styles | L361-382 | Map pin with HUD styling | Keep pin but remove `hud-` prefix naming (cosmetic, low priority) |
| Scrollbar `border-radius: 0` | L218 | Sharp scrollbar thumb | Change to `border-radius: 4px` |

### Tailwind config artifacts to REMOVE from tailwind.config.js
| Artifact | Config Key | Action |
|----------|-----------|--------|
| `bg-grid-faint` | `backgroundImage['grid-faint']` | Remove |
| `bg-scan-line` | `backgroundImage['scan-line']` | Remove |
| `grid-sm` | `backgroundSize['grid-sm']` | Remove |
| `animate-scan` | `animation['scan']` | Remove |
| `scan` keyframes | `keyframes['scan']` | Remove |
| `shadow-hud` | `boxShadow['hud']` | Rename to `shadow-panel` or similar (still used for panel elevation) |
| `shadow-hud-strong` | `boxShadow['hud-strong']` | Rename to `shadow-panel-strong` |

### Component artifacts to MODIFY
| Component | Artifact | Action |
|-----------|---------|--------|
| `Panel.tsx` | `brackets` prop, `hud-brackets-full` class, `.bracket` span children | Remove brackets prop (default false or remove entirely), remove bracket spans |
| `MapHud.tsx` | Corner bracket spans (L22-25), center reticle SVG (L30-44) | Remove corner brackets entirely. Keep active-slot indicator (L48-57) -- it's functional, not decorative |
| `ModuleSheet.tsx` | `bg-scan-line` on scrollable body (L120) | Remove class |
| `ModuleSheet.tsx` | `shadow-hud-strong` (L77) | Rename to `shadow-panel-strong` |
| `LocationIntelCard.tsx` | `blind·spot` wordmark (L98), subtitle "LOCATION INTELLIGENCE TERMINAL" (L100-101) | Change to `settl.` with cyan dot, update subtitle |
| `BottomStrip.tsx` | `BLINDSPOT/0.1.0` (L74) | Change to `settl./0.1.0` |
| `Header.tsx` | `Blind Spot` (L5) | Change to `settl.` |

### Other file branding changes
| File | Current | Target |
|------|---------|--------|
| `index.html` title (L8) | `Blind Spot — Location Intelligence` | `settl. — Location Intelligence` |
| `package.json` name (L2) | `blindspot` | `settl` |
| `utils/persistentCache.ts` store name (L3) | `blindspot-cache` | `settl-cache` |
| `hooks/useNominatim.ts` CONTACT (L7) | `blindspot-dev` | `settl-dev` |
| `public/favicon.svg` | Reticle circle icon | New settl. brand mark (cyan dot on dark bg) |

## Leaflet CSS Override Strategy

### Current State
Leaflet overrides in `index.css` (lines 117-201) already use `!important` with element-level selectors. Key issue: `border-radius: 0 !important` on `.leaflet-popup-content-wrapper` (L173) and `.leaflet-tooltip` (L191).

### Required Changes
```css
/* BEFORE (sharp HUD corners) */
.leaflet-popup-content-wrapper {
  border-radius: 0 !important;
}
.leaflet-tooltip {
  border-radius: 0 !important;
}

/* AFTER (rounded settl. corners) */
.leaflet-popup-content-wrapper {
  border-radius: 8px !important;
}
.leaflet-tooltip {
  border-radius: 6px !important;
}
```

### Tooltip Arrow Verification (CRITICAL)
After changing border-radius, ALL FOUR tooltip directions must be tested:
- `.leaflet-tooltip-top` -- arrow points down
- `.leaflet-tooltip-bottom` -- arrow points up
- `.leaflet-tooltip-left` -- arrow points right
- `.leaflet-tooltip-right` -- arrow points left

The arrow is drawn via `border-color` on the `.leaflet-tooltip::before` pseudo-element. The current override only sets `border-top-color` (L196-197), which only works for the default top direction. If other directions are used, they will show wrong arrow colors on dark theme.

### Recommended Complete Tooltip Override Block
```css
.leaflet-tooltip {
  background: rgb(var(--c-panel) / 0.95) !important;
  color: rgb(var(--c-ink)) !important;
  border: 1px solid rgb(var(--c-edge)) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgb(var(--c-void) / 0.4) !important;
}
.leaflet-tooltip-top::before    { border-top-color: rgb(var(--c-edge)) !important; }
.leaflet-tooltip-bottom::before { border-bottom-color: rgb(var(--c-edge)) !important; }
.leaflet-tooltip-left::before   { border-left-color: rgb(var(--c-edge)) !important; }
.leaflet-tooltip-right::before  { border-right-color: rgb(var(--c-edge)) !important; }
```

### Popup Tip Arrow
The `.leaflet-popup-tip` is a rotated square that forms the popup arrow. Its background and border must match the popup wrapper. Current override (L179-181) is correct in approach but uses `--c-void` (darkest color). Should match `--c-panel` for consistency with rounded popup body.

## Rounded Corners Implementation

### Tailwind Config Extension
```js
// tailwind.config.js
extend: {
  borderRadius: {
    DEFAULT: '8px',    // panels, cards, inputs
    'md': '10px',      // medium elements
    'lg': '12px',      // larger panels like ModuleSheet
    'xl': '14px',      // featured cards
  }
}
```

### Components Needing border-radius
| Component | Current | Target | Class |
|-----------|---------|--------|-------|
| `Panel.tsx` (wraps LocationIntelCard, BuildingCard) | Sharp (no radius) | 12px | `rounded-lg` |
| `ModuleSheet.tsx` aside | Sharp (border-l only) | 12px on left corners only | `rounded-l-lg` |
| `ModuleRail.tsx` | Sharp | 0 (flush right edge, intentional) | No change |
| `RiskPanel.tsx` outer div | Sharp | 10px | `rounded-md` |
| `BottomStrip.tsx` footer | Sharp (full-width) | 0 (full-width strip, intentional) | No change |
| Input fields (LocationIntelCard) | Sharp | 6px | `rounded-[6px]` or `rounded` |
| Buttons (LocationIntelCard) | Sharp | 6px | `rounded-[6px]` or `rounded` |
| Suggestion dropdown (LocationIntelCard) | Sharp | 8px | `rounded` |
| `StatReadout.tsx` | Sharp | 8px | `rounded` |
| `DualReadout.tsx` | Sharp | 8px | `rounded` |

### The `bg-scan-line` in ModuleSheet
Line 120 of ModuleSheet.tsx: `<div className="flex-1 overflow-y-auto overflow-x-hidden bg-scan-line">`. This applies the scan-line repeating gradient to the module content scrollable area. Remove `bg-scan-line` class after removing the Tailwind config utility.

## Brand Rename: settl. with Cyan Dot

### Logo Pattern (from mockup)
```html
<!-- Mockup uses: -->
<div class="logo">settl<span class="a">.</span></div>
<!-- .a { color: var(--cyan) } -->

<!-- React equivalent: -->
<span className="font-mono text-[17px] font-bold tracking-tight text-ink lowercase">
  settl<span className="text-cyan">.</span>
</span>
```

Key decisions from mockup:
- Font: JetBrains Mono (font-mono), bold, lowercase
- The period is the brand accent in cyan
- Subtitle below: plain sans-serif, not "LOCATION INTELLIGENCE TERMINAL"
- Mockup uses Karla for body text (registered in `@fontsource/major-mono-display` is already installed but Karla is not -- Phase 1 can keep JetBrains Mono for now, Karla addition is optional polish)

### Favicon
Current: dark circle reticle SVG. Target: simple settl. brand mark. Minimal change -- update the SVG to a cyan dot on dark background, matching the brand accent.

## Common Pitfalls

### Pitfall 1: Tailwind Purge of Renamed Shadow Utilities
**What goes wrong:** Renaming `shadow-hud` to `shadow-panel` in config but missing a usage in a component causes the shadow to disappear in production builds.
**How to avoid:** After renaming in config, grep for ALL old shadow class names (`shadow-hud`, `shadow-hud-strong`) and update every usage. Currently used in: ModuleSheet.tsx (L77).

### Pitfall 2: Noise Overlay Persists After CSS Removal
**What goes wrong:** The `body::before` noise overlay is at `z-index: 9999` and covers the entire viewport. If you remove the CSS but a component re-adds it, or if the CSS removal is incomplete, you get a ghost overlay.
**How to avoid:** Remove the ENTIRE `body::before` block and the `.theme-light body::before` block. Verify: inspect `body::before` in DevTools after removal -- it should have no `content` property.

### Pitfall 3: IDB Store Name Change Loses Cached Data
**What goes wrong:** Renaming the IndexedDB store from `blindspot-cache` to `settl-cache` creates a new empty store. Users lose all cached API responses, causing a burst of API requests on first load after update.
**How to avoid:** This is acceptable for a rebrand -- cached data is expendable (it's API response cache, not user data). No migration needed. Just rename.
**Warning signs:** Nominatim rate-limit errors after deployment if many users refresh simultaneously. Low risk for a small user base.

### Pitfall 4: MapHud Reticle Removal Breaks Compare Mode Indicator
**What goes wrong:** MapHud contains both decorative elements (corner brackets, center reticle) AND functional elements (active slot indicator for compare mode). Removing the entire component removes the compare mode UI.
**How to avoid:** Remove only the corner bracket spans and the center reticle SVG. Keep the compare mode active-slot indicator (`compareMode && ...` block, lines 48-57). If MapHud becomes empty in non-compare mode, it renders a transparent pointer-events-none div -- harmless.

### Pitfall 5: Leaflet Popup Background Color Mismatch After Theme Variable Update
**What goes wrong:** Current popup overrides use `--c-void` (darkest color). After reskin, if panels use `--c-panel` (lighter surface), popups will look inconsistent.
**How to avoid:** Update `.leaflet-popup-content-wrapper` background from `--c-void` to `--c-panel` for consistency. Update `.leaflet-popup-tip` to match.

## Code Examples

### Panel.tsx After Refactor
```tsx
// Remove brackets prop entirely, add rounded corners
export function Panel({ children, className = '', solid = true }: Props) {
  const base = solid
    ? 'bg-panel/90 backdrop-blur-sm border border-edge rounded-lg'
    : 'border border-edge rounded-lg';
  return (
    <div className={`${base} ${className}`}>
      {children}
    </div>
  );
}
```

### LocationIntelCard Wordmark After Rebrand
```tsx
<div className="px-4 pt-3 pb-2 border-b border-edge flex items-center justify-between">
  <div>
    <div className="font-mono text-[17px] font-bold leading-none tracking-tight text-ink lowercase">
      settl<span className="text-cyan">.</span>
    </div>
    <div className="text-[8px] font-mono uppercase tracking-widest text-muted mt-1">
      LOCATION INTELLIGENCE
    </div>
  </div>
  {/* ... rest unchanged */}
</div>
```

### BottomStrip After Rebrand
```tsx
<span className="text-ink">settl./0.1.0</span>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HUD military aesthetic | Clean rounded dashboard | This phase | All panels, cards, inputs gain border-radius |
| Noise overlay + scan lines | Clean backgrounds | This phase | body::before removed, bg-scan-line removed |
| BlindSpot branding | settl. branding | This phase | Title, wordmark, footer, user-agent, IndexedDB store |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual visual inspection (no automated test framework detected) |
| Config file | none |
| Quick run command | `npm run build && npm run preview` |
| Full suite command | `npm run typecheck && npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKIN-01 | Rounded corners on panels/cards, no sharp HUD edges | Visual + typecheck | `npm run typecheck` | N/A |
| SKIN-02 | No noise, scan lines, brackets, grid dots, gradients | Visual inspection | DevTools audit of body::before, bg classes | N/A |
| SKIN-03 | settl. branding with cyan dot in logo, title, footer | Visual + grep | `grep -r "blind" src/ index.html` returns 0 results | N/A |

### Sampling Rate
- **Per task commit:** `npm run typecheck` (catches broken Tailwind class references if TS types involved)
- **Per wave merge:** `npm run build` (catches Tailwind purge issues -- classes missing in production)
- **Phase gate:** Full build + visual inspection of: (1) both themes, (2) Leaflet popup on dark, (3) Leaflet popup on light, (4) tooltip all 4 directions

### Wave 0 Gaps
- No automated visual regression testing -- all SKIN requirements require manual visual inspection
- Recommend: screenshot before/after for each component as evidence

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/index.css`, `tailwind.config.js`, all component files listed above
- Mockup reference: `mockups/reskin-interactive.html` -- settl. brand pattern, rounded corners, Karla font
- UI direction memory: `ui_direction.md` -- locked decisions on rounded corners, HUD removal, settl. branding

### Secondary (MEDIUM confidence)
- Leaflet GitHub Issue #6135 -- CSS specificity with popup overrides
- Tailwind v3 docs -- `darkMode: 'class'` pattern, `borderRadius` extension

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new deps, all changes to existing code
- Architecture: HIGH -- direct codebase analysis, every file and line identified
- Pitfalls: HIGH -- Leaflet override specificity verified in existing code, HUD artifacts traced through grep

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (stable -- no external dependency changes)
