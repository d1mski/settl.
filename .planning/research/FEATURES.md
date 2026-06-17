# Feature Landscape — settl. UX Overhaul

**Domain:** Location intelligence app — UX/accessibility milestone
**Researched:** 2026-06-17
**Scope:** Five new feature areas only. Existing features (modules, compare, risk panel, etc.) are out of scope.

---

## 1. Overview / Report Panel (Progressive Disclosure)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Summary view as default landing state | Reduces cognitive load; families don't want raw charts first | Low | Re-order panel render, not new data |
| Key metrics surfaced per module (1-2 numbers each) | Users scan before they dive | Low | Pull existing computed values |
| "See full module" affordance on each card | Users expect to drill down | Low | Button/chevron navigating to module tab |
| Loading skeleton while data fetches | Blank panel feels broken | Low | Already have loading states per module |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Severity-ranked card order (worst risks first) | Families care most about hazards; surface risk above sunshine | Med | Requires scoring heuristic per module |
| Status indicators (OK / Watch / Alert) per module | Instant at-a-glance read without numbers | Low | Color + icon; uses existing risk synthesis data |
| Collapsible sections with memory | Power users collapse what they don't need | Low | localStorage per-section key |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Composite "livability score" | No reliable global data; misleading | Show module-level status indicators |
| Expandable charts inside overview cards | Overview = summary only; charts live in modules | Link to module tab |
| Pagination of cards | Creates friction; all 6 modules visible in one scroll | Use compact card height |

### Pattern

Progressive disclosure: Overview (L1) → Module tab (L2) → Chart detail/tooltip (L3). Never skip levels. Accordion pattern for L1 sections is the industry standard for dashboard summary views.

**Dependencies on existing:** Risk synthesis data already computed. Module tab navigation already exists. Wire overview cards to existing nav.

---

## 2. Font Size Controls (A- / A+)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Two-button A- / A+ control | Established convention; users recognize it instantly | Low | — |
| 3 steps minimum (small / default / large) | One step each direction is insufficient for real needs | Low | Scale factor: 0.875 / 1.0 / 1.125 rem |
| Persists across sessions | Accessibility setting that resets on refresh is anti-pattern | Low | localStorage key |
| Applied via root font-size or CSS custom property | Allows rem cascade to do the work; no per-component hacks | Low | Set `document.documentElement.style.fontSize` |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 5 steps (xs / sm / md / lg / xl) | Broader range for low-vision users; WCAG 2.1 AA asks for 200% resize support | Low | Scale 0.75–1.25 |
| Visual indicator of current step | Prevent users wondering "did that do anything?" | Low | Dot indicator or step count |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Per-component font overrides | Breaks cascade; A+/A- stops working | Use rem units throughout |
| Font size slider | More complex, no better than steps for this use case | Stepped buttons |
| Browser zoom instructions | Not UX; pass the problem to the user | Build it in |

**Implementation note:** The app currently uses Tailwind + JetBrains Mono. Confirm all text classes use `text-sm` / `text-base` etc. (rem-based) not fixed `text-[14px]` (px). If px values exist, they must be converted before A+/A- works.

**Dependencies on existing:** Dark/light toggle already exists in settings area. Add font controls alongside it.

---

## 3. Search-as-You-Type Geocoding

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Suggestions dropdown appears while typing | Users expect instant feedback | Low | Nominatim already in use for address input |
| 300ms debounce | Industry standard — prevents API hammering | Low | Single `useRef` timer |
| 3-character minimum before first request | Avoids useless single-letter queries | Low | — |
| Keyboard nav: ArrowUp/Down, Enter, Escape | WCAG requirement; power-user expectation | Med | aria-activedescendant + stable option IDs |
| Click outside to dismiss | Standard combobox behavior | Low | — |
| Loading indicator in input | Users need to know request is in flight | Low | Spinner icon in input right slot |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Highlight matched substring in results | Confirms query relevance; Algolia pattern | Low | Wrap match chars in `<mark>` |
| Recent searches (last 3-5) shown before typing starts | Repeat users return to same locations | Low | localStorage array, push on select |
| "Use my location" option at top of dropdown | One-tap for browser geolocation (separate feature, combine UX) | Low | Already planned |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Request on every keystroke | Burns Nominatim quota; makes UI feel laggy | 300ms debounce |
| More than 5 suggestions | Dropdown becomes list; slows scanning | Cap at 5 |
| Two separate inputs (search + coordinate) | Fragmented UX | Single smart input: detect DMS/decimal, else geocode |

**API:** Nominatim (already integrated). No new dependency. Nominatim usage policy: max 1 req/sec — debounce at 300ms satisfies this at normal typing speed.

**Dependencies on existing:** Coordinate input already accepts address via Nominatim. Refactor into combobox component rather than replace.

---

## 4. OS Theme Detection + Manual Override

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Detect `prefers-color-scheme` on first load | Users expect system preference respected by default | Low | `window.matchMedia('(prefers-color-scheme: dark)')` |
| Manual toggle overrides OS preference | User choice beats OS | Low | Already exists — just needs precedence logic |
| Persist manual override in localStorage | Toggle that resets on refresh is broken | Low | Key: `theme` = 'dark' \| 'light' \| null |
| Listen for OS preference change at runtime | User switches system theme while app is open | Low | `addEventListener('change', ...)` on media query |

### Precedence Order (standard, verified)

```
localStorage.theme set? → use it (highest)
     ↓ no
prefers-color-scheme → use it (fallback)
     ↓ unavailable
default: dark (app default)
```

Manual override clears on "follow system" / third toggle state (optional differentiator).

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Three-state toggle: Light / System / Dark | Explicit "follow system" option; users understand it | Low | Replaces binary toggle |
| Flash-of-wrong-theme prevention | Apply theme class in `<head>` inline script before React hydrates | Low | Standard SSG pattern; works in Vite too |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Auto-switch theme at sunrise/sunset | Gimmick; users find it surprising/annoying | Let OS handle it |
| Per-module theme overrides | Incoherent UI | Single global theme |

**Dependencies on existing:** Dark/light toggle already exists. Migration: add OS detection + three-state logic. localStorage key already used — confirm key name doesn't collide with URL state persistence.

---

## 5. Saved Locations (localStorage)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Heart/bookmark icon on current location | Standard affordance; users know it | Low | Lucide `Heart` or `Bookmark` |
| Filled vs outline state (saved / unsaved) | Instant feedback | Low | — |
| Saved list accessible from nav | Users need to return to saved items | Low | Dropdown or dedicated panel |
| Name + coordinates stored | Minimum viable save | Low | `{name, lat, lng, savedAt}` |
| Load saved location on click | Core utility | Low | Set coords, trigger data fetch |
| Remove from saved list | Users curate their list | Low | Trash icon in list row |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Custom label / rename | "Home", "School", "Potential house" — much more useful than coordinates | Low | Inline edit on double-click |
| Cap at 10 saved locations | Prevents unbounded localStorage growth; forces curation | Low | Show count: "3/10 saved" |
| Export as JSON / copy list | Power users want backup | Med | Defer; not MVP |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Unlimited saves | localStorage has ~5MB limit; 100 saved items with metadata bloats it | Hard cap at 10, warn at 8 |
| Cloud sync / user accounts | Out of scope for v1 per PROJECT.md | Clearly label "saved locally" |
| Drag-to-reorder | Complexity for marginal value at ≤10 items | Sort by savedAt desc |

**Schema:**
```ts
interface SavedLocation {
  id: string;          // crypto.randomUUID()
  label: string;       // user-editable, defaults to place name from Nominatim
  lat: number;
  lng: number;
  savedAt: string;     // ISO 8601
}
```

**Dependencies on existing:** Nominatim geocoding provides the default label. URL state persistence uses different localStorage keys — no collision expected, but verify.

---

## Feature Dependencies Map

```
Browser Geolocation ──────────────────────────► Search Autocomplete dropdown
                                                 (shows "Use my location" option)

Nominatim (existing) ────────────────────────► Search Autocomplete (refactor)
                                             └─► Saved Locations (default label)

Risk Synthesis (existing) ───────────────────► Overview Panel (severity ranking)

Module tabs (existing) ──────────────────────► Overview Panel (drill-down nav)

Dark/light toggle (existing) ────────────────► OS Theme Detection (extend to 3-state)

Lucide icons (new dep) ──────────────────────► All five features (Heart, A+/A-, etc.)
```

---

## MVP Priority

Build in this order (each unblocks or complements the next):

1. **OS theme detection** — Touches app shell; do first to avoid re-theming work later
2. **Font size controls** — Requires rem audit first; do early before new components are added
3. **Search autocomplete** — Refactor of existing input; core navigation UX
4. **Saved locations** — Depends on geocoding label from search
5. **Overview panel** — Depends on all module data being stable; build last

Defer: Export saved locations, 5-step font scale, collapsible overview sections with memory (nice-to-have, add in polish phase).

---

## Sources

- [NN/g: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [UX Patterns: Autocomplete](https://uxpatterns.dev/patterns/forms/autocomplete)
- [Algolia: Debouncing Sources](https://www.algolia.com/doc/ui-libraries/autocomplete/guides/debouncing-sources)
- [Smart Interface Design Patterns: Autocomplete UX](https://smart-interface-design-patterns.com/articles/autocomplete-ux/)
- [Dark mode pattern: prefers-color-scheme + manual toggle](https://cr0x.net/en/dark-mode-toggle-pattern/)
- [Tailwind dark mode override discussion](https://github.com/tailwindlabs/tailwindcss/discussions/2959)
- [BOIA: Let Users Control Font Size](https://www.boia.org/blog/accessibility-tips-let-users-control-font-size)
- [UX Patterns: Favorites](https://ui-patterns.com/patterns/favorites)
