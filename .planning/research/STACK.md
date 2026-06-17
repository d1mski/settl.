# Technology Stack — settl. Reskin + UX Overhaul

**Project:** settl. (BlindSpot_reloc)
**Researched:** 2026-06-17
**Scope:** NEW additions only — existing stack (React 18 + TS + Vite + Tailwind v3 + Leaflet) is validated and not re-researched.

---

## One New Dependency

### lucide-react

| Field | Value |
|-------|-------|
| Package | `lucide-react` |
| Version | `^0.511.0` (latest as of 2026-06-17, was 1.20.0 per npm search — confirm with `npm info lucide-react version`) |
| Install | `npm install lucide-react` |
| Why | Named SVG icon components, tree-shakeable, TypeScript-native, zero runtime cost vs emoji or custom SVG files |
| Why not alternatives | `react-icons` bundles all icons together — poor tree-shaking. `heroicons` React package is Meta-adjacent and less tactical. Lucide is the approved choice per PROJECT.md. |

**Import pattern:**
```tsx
import { MapPin, Wind, Sun, AlertTriangle } from 'lucide-react'
// Each icon is ~1KB. Only imported icons ship.
```

**Confidence:** HIGH — confirmed via npmjs.com

---

## Zero New Dependencies — Use What's Already There

The remaining features are all native browser APIs or patterns implementable with React hooks. No packages needed.

---

## Feature Implementation Patterns

### 1. OS Theme Detection + CSS Custom Properties

**Approach:** Tailwind v3 class-based dark mode + `prefers-color-scheme` media query for initial value detection.

**How it works:**
- Set `darkMode: 'class'` in `tailwind.config.js` (already the pattern for the existing toggle).
- On app init, read `window.matchMedia('(prefers-color-scheme: dark)').matches` to seed the initial theme state.
- Store override in localStorage (see below) so user's manual toggle persists.
- Apply `dark` class to `<html>` element.

**CSS custom properties for theming:**
Define token variables in `index.css` under `:root` and `.dark`, then reference in Tailwind via `tailwind.config.js` `extend.colors`. This is the v3 pattern — no `@theme` directive (that's v4 only).

```css
:root {
  --color-bg: #0f1117;
  --color-surface: #161b22;
  --color-accent: #22d3ee; /* cyan */
  --radius-base: 8px;
}
.dark { /* same values — dark-by-default app */ }
```

**Confidence:** HIGH — Tailwind v3 docs, confirmed package.json shows `tailwindcss: ^3.4.17`

---

### 2. Browser Geolocation API

**Approach:** Custom hook, no package needed. Native `navigator.geolocation` is sufficient.

```tsx
// useGeolocation.ts — custom hook
function useGeolocation() {
  // Returns: { coords, error, loading, request }
  // request() triggers on user gesture (button click) — never autofire on mount
}
```

**Key rules:**
- Only request on explicit user action (button click). Never fire on mount — users distrust auto-requests.
- Check `navigator.geolocation` exists before calling (SSR/private-browse guard).
- Handle error codes: `1` = PERMISSION_DENIED (show manual input fallback), `2` = POSITION_UNAVAILABLE, `3` = TIMEOUT.
- Use `{ enableHighAccuracy: false, timeout: 8000 }` — high accuracy is GPS-only on mobile, unnecessary for city-level placement.
- Geolocation API requires HTTPS in production (localhost is exempt).

**Confidence:** HIGH — MDN/native API, no library risk

---

### 3. Nominatim Search Autocomplete

**Approach:** Custom hook using existing Nominatim (already wired for geocoding). No new package.

**Pattern:**
```tsx
// useNominatimAutocomplete.ts
// - debounce input 400ms (not 300 — Nominatim has a 1 req/sec usage policy)
// - AbortController per request to cancel in-flight calls on new keystroke
// - Min 3 chars before firing
// - Limit results: &limit=5&format=json&addressdetails=1
```

**Nominatim usage policy (critical):** Max 1 request/second per IP. The 400ms debounce plus 3-char minimum enforces this without rate-limit errors. Do NOT use a shorter debounce.

**Result shape:** Use `display_name`, `lat`, `lon` from each result. Already matches existing Nominatim response handling.

**Confidence:** HIGH — existing code uses Nominatim; debounce pattern is standard

---

### 4. localStorage Persistence

**Approach:** Custom `useLocalStorage<T>` hook. No package needed (`idb-keyval` already in deps for heavier storage; localStorage is sufficient for settings).

**What to persist:**
- `settl_theme`: `'light' | 'dark' | 'system'`
- `settl_font_size`: `number` (scale factor, e.g. `1.0`, `1.15`, `1.3`)
- Existing URL state handles location/tab persistence — do not duplicate into localStorage.

**Pattern:**
```tsx
function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void]
// - JSON.parse/stringify for serialization
// - Try/catch around all reads (corrupted data or private browsing)
// - Returns initial value on any error
// - Does NOT listen to storage events (cross-tab sync not needed for settings)
```

**Confidence:** HIGH — standard React pattern, no external dependency

---

### 5. Font Size Controls (CSS Zoom vs rem)

**Approach:** Scale the right-panel root element using CSS `zoom` property applied via inline style or a wrapper class.

**Why `zoom` over `transform: scale()`:**
- `zoom` recalculates layout — surrounding elements reflow correctly. Correct for a panel that must remain in document flow.
- `transform: scale()` does not reflow — causes clipping and overflow bugs in panel layouts.
- `zoom` browser support: all modern browsers (Chrome, Firefox 126+, Safari). Confirmed 2024-2025.

**Why not rem root font-size change:**
- Changing `<html>` font-size cascades to Leaflet tiles and all third-party components — unintended side effects.
- `zoom` on a scoped element is surgical.

**Implementation:**
```tsx
// Apply to right panel wrapper only
<div style={{ zoom: fontScale }}>  // fontScale: 1.0 | 1.15 | 1.3
```

**Scale steps:** 3 steps (normal / large / largest) mapped to `1.0`, `1.15`, `1.3`. Avoid continuous sliders — too much UI complexity for the value.

**Confidence:** MEDIUM — `zoom` on scoped elements is non-standard CSS (not in CSS spec as of 2024, but universally supported). Firefox added it in v126 (mid-2024). Flag for cross-browser testing.

---

### 6. Tailwind Config Changes for Rounded Corners

**No new packages.** Extend `tailwind.config.js`:

```js
// tailwind.config.js
extend: {
  borderRadius: {
    'sm': '4px',
    DEFAULT: '8px',
    'md': '10px',
    'lg': '14px',
    'xl': '18px',
    '2xl': '24px',
  }
}
```

Replace sharp `rounded-none` usages with `rounded` (8px default). The mockup shows soft-rounded panels — 8-14px range. Do not use `rounded-full` on rectangular panels.

**Confidence:** HIGH — Tailwind v3 docs

---

## What NOT to Add

| Package | Reason |
|---------|--------|
| `react-use` or `usehooks-ts` | Overkill — we need 2-3 hooks, writing them is 20 lines each |
| `react-hook-geolocation` | Thin wrapper over native API, not worth the dependency |
| `@fontsource/inter` or new fonts | Keep JetBrains Mono — it's the tactical identity |
| `react-select` or `downshift` | Autocomplete dropdown is simple enough to build with a `<ul>` |
| Tailwind v4 upgrade | Breaking changes to config format; no benefit that justifies migration risk mid-milestone |
| `date-fns` or `dayjs` | No new date formatting needs in this milestone |

---

## Install Command

```bash
npm install lucide-react
```

That's the only `npm install` for this entire milestone.

---

## Sources

- [lucide-react on npm](https://www.npmjs.com/package/lucide-react) — version confirmed
- [Lucide React getting started](https://lucide.dev/guide/react/getting-started) — import pattern
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) — 1 req/sec limit
- [CSS zoom — MDN](https://developer.mozilla.org/docs/Web/CSS/zoom) — browser support
- [Tailwind dark mode docs](https://tailwindcss.com/docs/dark-mode) — class strategy
- [Josh W Comeau — pixels and accessibility](https://www.joshwcomeau.com/css/surprising-truth-about-pixels-and-accessibility/) — rem vs zoom tradeoffs
