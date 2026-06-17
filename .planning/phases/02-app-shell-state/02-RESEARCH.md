# Phase 2: App Shell State - Research

**Researched:** 2026-06-17
**Domain:** React context, localStorage persistence, prefers-color-scheme, CSS font scale
**Confidence:** HIGH

## Summary

Phase 2 replaces the current binary dark/light toggle (tied to `baseMap` state in App.tsx) with a proper 3-state theme system (Light / System / Dark) backed by a React context and localStorage. It also adds a new `FontScaleContext` that drives rem-based font size changes via `document.documentElement.style.fontSize`, with A-/A+ controls stepping in 10% increments.

The current theme implementation is minimal and fragile: `baseMap` state in App.tsx drives a `theme-light` class toggle on `<html>`, it is not persisted to localStorage, has no OS detection, and is a 2-state toggle. The font scale feature does not exist at all. Both features need to be built as React contexts provided at the root, with FOUC prevention via a blocking inline script in `index.html`.

The critical constraint carried from Phase 1 research: **CSS `zoom` is prohibited on any Leaflet ancestor**. Font scale MUST use `font-size` on `<html>` with rem units only. Map click accuracy depends on this — CSS zoom shifts hit-test coordinates.

**Primary recommendation:** Build two context providers (`ThemeContext`, `FontScaleContext`) provided in `main.tsx` above `<App>`. Prevent FOUC by injecting a tiny blocking `<script>` in `index.html` that reads localStorage and applies the correct class/font-size before React hydrates.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-04 | A-/A+ controls step font size in 10% rem-based increments, map click accuracy unaffected | FontScaleContext + html font-size approach; CSS zoom prohibited per STATE.md decision |
| UX-05 | 3-state theme toggle (Light/System/Dark), OS default, persists to localStorage | ThemeContext + prefers-color-scheme media query + localStorage + FOUC-prevention inline script |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (already installed) | 18.x | Context providers, hooks | Already in project |
| TypeScript (already installed) | 5.x | Typed context values | Already in project |
| localStorage (browser API) | N/A | Persist theme + font scale | No dependency needed |
| window.matchMedia (browser API) | N/A | Read OS color scheme | No dependency needed |

### Supporting

No new npm dependencies required. This phase is pure React + browser APIs + CSS.

**Installation:** None required.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── contexts/
│   ├── ThemeContext.tsx      # 3-state theme: 'light' | 'system' | 'dark'
│   └── FontScaleContext.tsx  # font scale: 0.8–1.4, step 0.1
├── App.tsx                   # remove baseMap/theme-light logic; consume ThemeContext
├── main.tsx                  # wrap <App> with both providers
└── index.html                # add FOUC-prevention inline script
```

### Pattern 1: ThemeContext — 3-state with OS fallback

**What:** A context that holds `theme: 'light' | 'system' | 'dark'` and derives the resolved value from `prefers-color-scheme` when `system` is selected. Applies `theme-light` class to `<html>` as a side effect. Persists to localStorage key `settl-theme`.

**When to use:** Whenever any component needs to read or change the theme.

```typescript
// src/contexts/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'system' | 'dark';

const STORAGE_KEY = 'settl-theme';

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return getSystemDark();
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored ?? 'system';
  });

  function applyTheme(mode: ThemeMode) {
    const dark = resolveIsDark(mode);
    document.documentElement.classList.toggle('theme-light', !dark);
  }

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Track OS preference changes when mode === 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (t: ThemeMode) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### Pattern 2: FontScaleContext — rem-based, html font-size

**What:** Context that holds a scale multiplier (default 1.0, range 0.8–1.4, step 0.1). Applies `document.documentElement.style.fontSize = \`${scale * 100}%\`` directly. Persists to localStorage key `settl-font-scale`.

**Critical constraint:** MUST set `font-size` on `<html>`, NOT use CSS `zoom` on any ancestor. Map hit-testing breaks with CSS zoom. (Decision locked in STATE.md.)

```typescript
// src/contexts/FontScaleContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'settl-font-scale';
const MIN = 0.8;
const MAX = 1.4;
const STEP = 0.1;

interface FontScaleContextValue {
  scale: number;
  increase: () => void;
  decrease: () => void;
}

const FontScaleContext = createContext<FontScaleContextValue>({
  scale: 1,
  increase: () => {},
  decrease: () => {},
});

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState<number>(() => {
    const stored = parseFloat(localStorage.getItem(STORAGE_KEY) ?? '1');
    return isFinite(stored) ? Math.min(MAX, Math.max(MIN, stored)) : 1;
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${scale * 100}%`;
    localStorage.setItem(STORAGE_KEY, String(scale));
  }, [scale]);

  const increase = () => setScale(s => Math.min(MAX, parseFloat((s + STEP).toFixed(2))));
  const decrease = () => setScale(s => Math.max(MIN, parseFloat((s - STEP).toFixed(2))));

  return (
    <FontScaleContext.Provider value={{ scale, increase, decrease }}>
      {children}
    </FontScaleContext.Provider>
  );
}

export const useFontScale = () => useContext(FontScaleContext);
```

### Pattern 3: FOUC Prevention — blocking inline script in index.html

**What:** A `<script>` tag placed inside `<head>` before any CSS loads. Reads localStorage and applies `theme-light` class and `font-size` synchronously, before React renders. Without this, users see a flash of the default dark theme on every light-mode page load.

**Why it works:** Browser parses and executes inline scripts synchronously during HTML parsing, before painting.

```html
<!-- index.html — inside <head>, before stylesheet links -->
<script>
  (function() {
    var theme = localStorage.getItem('settl-theme') || 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    if (!isDark) document.documentElement.classList.add('theme-light');

    var scale = parseFloat(localStorage.getItem('settl-font-scale') || '1');
    if (isFinite(scale) && scale !== 1) {
      document.documentElement.style.fontSize = (scale * 100) + '%';
    }
  })();
</script>
```

### Pattern 4: Provider composition in main.tsx

```typescript
// src/main.tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <FontScaleProvider>
        <App />
      </FontScaleProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
```

### Pattern 5: App.tsx cleanup

Remove from App.tsx:
- `baseMap` state (move to ThemeContext or keep separate for map tile source)
- The `useEffect` that toggles `theme-light` on `<html>`
- `baseMap` / `onBaseMapChange` props drilled into `LocationIntelCard`

**Note on baseMap vs theme:** The current code conflates "map tile source" (dark/light CARTO tiles) with "UI theme". Phase 2 decouples them. The new `ThemeContext` drives UI theme. The `baseMap` tile selection can stay as local state in App or be derived from the resolved theme. The simplest correct approach: derive `baseMap` from resolved theme (`isDark ? 'dark' : 'light'`), eliminating the prop entirely.

### Pattern 6: ThemeToggle UI — 3-button segmented control

Replace the current 2-button dark/light toggle in `LocationIntelCard` with a 3-segment control: Light / System / Dark. The control reads/writes `useTheme()` context — no props needed.

### Anti-Patterns to Avoid

- **CSS zoom on any element that contains the map:** Breaks Leaflet pointer event coordinates. Use `html { font-size: X% }` only.
- **Toggling theme via React state only (no FOUC script):** Every hard refresh will flash the wrong theme for ~100ms until React renders.
- **Persisting resolved state (isDark) instead of intent (mode):** Store `'system'`, not `true`/`false`. Otherwise OS preference changes at night are ignored.
- **Reading localStorage inside render without initialization guard:** Can cause SSR mismatches (not applicable here, but keep init in `useState` initializer, not `useEffect`).
- **Float arithmetic drift on scale:** Use `parseFloat((s + STEP).toFixed(2))` to avoid `0.30000000000000004` values.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FOUC prevention | Custom render-blocking loader | Inline `<script>` in `<head>` | Browser executes it synchronously before paint; no library needed |
| OS theme detection | Custom polling | `window.matchMedia('(prefers-color-scheme: dark)')` | Browser native, event-driven, no polling |
| Theme persistence | IndexedDB, cookie, server | localStorage | Synchronous read at init, no async, no server needed |

**Key insight:** All three problems are solved by 5–10 lines of vanilla JS each. No library adds value here.

## Common Pitfalls

### Pitfall 1: CSS zoom on Leaflet ancestor

**What goes wrong:** Font scale applied via `zoom: 1.2` on `<body>` or any container shifts Leaflet's internal pointer coordinate math. Map clicks register at wrong locations.

**Why it happens:** Leaflet uses `getBoundingClientRect()` for hit-testing; CSS zoom changes the reported size without adjusting event coordinates consistently across browsers.

**How to avoid:** Always set `document.documentElement.style.fontSize` (rem base). Never set `zoom` or `transform: scale()` on any element that wraps the map.

**Warning signs:** Map pins appear to register clicks offset from their visual position after scale change.

### Pitfall 2: Theme flash on hard refresh (FOUC)

**What goes wrong:** User has light theme saved. On refresh, `<html>` starts without `theme-light` class. React renders (~50–200ms later) and adds the class. User sees dark flash.

**Why it happens:** React context initializes after JS bundle parses and executes, which is always after first paint on cached pages.

**How to avoid:** The blocking inline script in `<head>` (Pattern 3 above) applies the class synchronously before any paint occurs.

**Warning signs:** Visible white-to-dark or dark-to-white flash on every page load in non-default theme.

### Pitfall 3: baseMap / theme coupling

**What goes wrong:** Current code stores theme as `BaseMap` type (`'dark' | 'light'`), tightly coupled to map tile source. A 3-state `'system'` mode cannot be expressed.

**Why it happens:** Original design conflated UI theme and map tile selection.

**How to avoid:** ThemeContext owns UI theme intent (`'light' | 'system' | 'dark'`). Map tile source is derived from resolved theme. Remove `baseMap` prop drilling.

**Warning signs:** TypeScript errors when trying to add `'system'` to `BaseMap` type.

### Pitfall 4: matchMedia listener leak

**What goes wrong:** `window.matchMedia` change listener added in a `useEffect` is not cleaned up when theme changes from `'system'` to `'dark'` or `'light'`.

**Why it happens:** Effect dependency array does not re-run cleanup correctly.

**How to avoid:** Return cleanup from the `useEffect`. Conditionally add listener only when `theme === 'system'` (Pattern 1 above).

### Pitfall 5: Font scale breaks Tailwind text utilities

**What goes wrong:** Tailwind uses `rem` for text sizes (e.g. `text-xs` = `0.75rem`). Changing `html { font-size }` scales all rem values. This is the desired behavior. However if any component uses `px` hardcoded sizes, those won't scale.

**Why it happens:** New components added with `px` instead of `rem`/Tailwind utilities.

**How to avoid:** Keep font sizes in Tailwind utilities or explicit `rem` values. The existing codebase uses `text-[9px]`, `text-[10px]`, `text-[11px]` — these are pixel values that will NOT scale. This is a known limitation; only Tailwind scale utilities and `rem` values will respond to FontScaleContext.

**Decision needed:** Decide if fine-grained HUD text (9px, 10px, 11px) should be in rem or stay in px. Recommend converting to rem equivalents (`text-[0.5625rem]` etc.) during this phase so A-/A+ controls have full effect, or accept partial scaling.

## Code Examples

### Applying theme to MapCanvas tile URL

```typescript
// Derive tile source from resolved theme — no baseMap prop needed
const { theme } = useTheme();
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
const tileUrl = isDark ? CARTO_DARK_URL : CARTO_LIGHT_URL;
```

### A-/A+ control buttons

```tsx
const { scale, increase, decrease } = useFontScale();

<button onClick={decrease} aria-label="Decrease font size" disabled={scale <= 0.8}>
  A-
</button>
<span>{Math.round(scale * 100)}%</span>
<button onClick={increase} aria-label="Increase font size" disabled={scale >= 1.4}>
  A+
</button>
```

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure browser APIs + existing React stack)

## Validation Architecture

No automated test framework detected in this project (no jest.config, vitest.config, or test directory). All validation is manual/visual per the project pattern.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Verification Method |
|--------|----------|-----------|---------------------|
| UX-04 | A-/A+ steps font 10% | manual | Click A+, verify `html` fontSize = `110%`; verify map click still accurate |
| UX-04 | Font scale persists | manual | Set scale, hard refresh, confirm scale restored |
| UX-05 | 3-state toggle cycles | manual | Click through Light/System/Dark, verify `theme-light` class and CARTO tile changes |
| UX-05 | OS default applies | manual | Clear localStorage, reload, confirm matches OS preference |
| UX-05 | Theme persists | manual | Set light, hard refresh, confirm no dark flash and light theme active |

### Wave 0 Gaps

None — no test framework to scaffold. Validation is visual/manual throughout.

## Sources

### Primary (HIGH confidence)

- MDN: `window.matchMedia` + `prefers-color-scheme` — verified browser API, widely supported
- MDN: `localStorage.getItem/setItem` — synchronous, no async needed
- Leaflet source + Phase 1 STATE.md decision — CSS zoom breaks hit-testing (LOCKED decision)
- Project codebase (App.tsx, LocationIntelCard.tsx, index.css) — direct read, current state confirmed

### Secondary (MEDIUM confidence)

- FOUC prevention via blocking inline script — standard pattern, widely documented across React/Next.js community

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, pure browser APIs
- Architecture: HIGH — patterns verified against current codebase
- Pitfalls: HIGH — zoom/FOUC are verified known issues; float drift is deterministic

**Research date:** 2026-06-17
**Valid until:** 2026-09-17 (stable APIs)

## Project Constraints (from CLAUDE.md)

- No new npm dependencies except Lucide icons (already scoped to Phase 5). This phase adds zero dependencies.
- CSS zoom prohibited on any Leaflet ancestor — use `html { font-size }` only (from STATE.md locked decision).
- Minimal impact — do not touch files outside the scope of theme and font scale.
- Tailwind v4 migration is out of scope.
