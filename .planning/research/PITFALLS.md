# Domain Pitfalls

**Domain:** React + Tailwind + Leaflet reskin + UX feature additions
**Researched:** 2026-06-17

---

## Critical Pitfalls

Mistakes that cause rewrites or require major structural fixes.

---

### Pitfall 1: Leaflet Internal CSS Wins Specificity Wars After Theme Change

**What goes wrong:** Leaflet injects its own stylesheet (`leaflet.css`) at runtime. When you change `.leaflet-popup-content-wrapper`, `.leaflet-popup-tip`, `.leaflet-tooltip`, or `.leaflet-control-*` via your theme CSS, the order of stylesheet injection determines the winner — not your selector specificity alone. After a reskin, popups and tooltips silently revert to Leaflet defaults or show split styles (new background, old border-radius).

**Why it happens:** Leaflet's CSS is loaded as a static import before your app CSS. Any rule with equal specificity that appears later in the cascade wins. Global border-radius changes (e.g., `* { border-radius: var(--radius) }`) do NOT reach Leaflet's internal elements because they override with their own rules.

**Consequences:** Popup tips and tooltip arrows display wrong colors; dark mode popups show white background; tooltip position arrows break entirely if the tip pseudo-element is touched without updating the matching directional class (`leaflet-tooltip-left`, `-right`, `-top`, `-bottom`).

**Prevention:**
- Override Leaflet popup/tooltip styles with a dedicated block loaded AFTER Tailwind's `@tailwind utilities` layer — never in `@tailwind base`.
- Use attribute selectors or class combinators to raise specificity without `!important`: `.leaflet-container .leaflet-popup-content-wrapper { ... }`.
- Apply theme CSS variables to Leaflet elements explicitly — do not rely on global `*` selectors reaching them.
- Test all four tooltip directional variants (`-left`, `-right`, `-top`, `-bottom`) after any theme change; the arrow is drawn with `border-color` on a pseudo-element and breaks independently.

**Detection:** After any CSS variable rename or global border-radius change, visually inspect a popup, tooltip, and all four tooltip directions on both dark and light themes.

**Phase:** Reskin phase (Phase 1). Flag for regression check after every subsequent CSS change.

---

### Pitfall 2: CSS `zoom` Property Breaks Leaflet Tile Positioning and Coordinates

**What goes wrong:** Applying `zoom` (not `transform: scale`) at any ancestor level of the Leaflet map container causes tiles to render with 1px white grid lines and, critically, makes click coordinates wrong — the map's internal pixel-to-latlng math does not account for CSS `zoom`.

**Why it happens:** Leaflet uses `getBoundingClientRect()` and raw pixel math that assumes 1:1 CSS pixel mapping. `zoom` creates a non-standard coordinate space that breaks this assumption. Fractional zoom values (33%, 67%, 80%) also cause subpixel rounding errors that produce visible tile seams.

**Consequences:** Users click one spot, pin appears elsewhere. Tile seams visible at all zoom levels. Cannot be fixed without removing `zoom` from the ancestor chain.

**Prevention:**
- Never use CSS `zoom` on any element that wraps the map container.
- For font size scaling (the font size controls feature), use `font-size` on `<html>` with `rem`-based units throughout — do NOT use `zoom` on the app root.
- Use `transform: scale()` only on elements that are NOT ancestors of the Leaflet container, and note that `transform` also creates a new stacking context.

**Detection:** After implementing font size controls, click the map at a known coordinate and verify the pin appears exactly where clicked. Test at minimum and maximum font scale levels.

**Phase:** Font size controls (Phase 2). Must be validated before shipping.

---

### Pitfall 3: Framer Motion Animations Flash During OS Theme Detection on First Load

**What goes wrong:** When OS theme detection runs via `prefers-color-scheme` media query and applies the theme class to `<html>` before hydration, Framer Motion animated elements (panels, overlays) fire their mount animations while simultaneously inheriting new CSS variable values. This causes a visible double-flash: the element animates in with the wrong theme colors, then re-renders with correct colors.

**Why it happens:** Framer Motion tracks its own internal animation state separate from CSS. If a `data-theme` attribute or `dark` class is toggled on `<html>` after the component has already mounted, CSS variables update instantly but Framer's interpolated color values (if any) lag behind. Even non-color animations flash because the layout shift from CSS variable changes triggers a reflow mid-animation.

**Consequences:** Panel slide-in shows wrong background color for one frame. Theme toggle produces a visible flicker on animated elements.

**Prevention:**
- Apply OS theme detection synchronously in a `<script>` tag in `index.html` `<head>` — before React hydrates — to prevent the late-toggle scenario entirely.
- Mark theme-sensitive elements with `data-theme-no-transition="true"` during the initial load; strip the attribute after mount in a `useEffect`.
- Avoid animating `background-color` or `color` directly in Framer Motion. Animate only `opacity`, `transform`, and `height`. Let CSS variables handle color — CSS transitions on variables are fast and don't interact with Framer's scheduler.
- If using Framer Motion's `AnimatePresence`, ensure the `key` prop is stable across theme changes so panels don't unmount/remount on theme toggle.

**Detection:** Open app fresh in a browser with OS set to dark mode, with light theme previously saved. Observe panel mount animation. Then toggle theme and observe animated panels.

**Phase:** OS theme detection + reskin (Phase 1). Cross-check during animation polish phase.

---

### Pitfall 4: Z-Index Stacking Context Created by Framer Motion Breaks Leaflet Panel Layering

**What goes wrong:** Framer Motion's `animate` prop (and `layoutId`) creates new CSS stacking contexts via `transform` or `will-change: transform` on animated elements. When floating panels (left column, module sheet) are animated this way, they compete with Leaflet's internal z-index hierarchy (`.leaflet-pane` at z-index 400, `.leaflet-control` at z-index 800, `.leaflet-popup` at z-index 1000 by default).

**Why it happens:** CSS `transform` on an element creates a new stacking context. Any child z-index is then relative to that context, not the document root. A panel with `z-index: 50` inside a Framer Motion animated parent with `transform` will lose to Leaflet's `.leaflet-popup` at `z-index: 1000` in the root context.

**Consequences:** Map popups appear under the floating panel. Tooltips are clipped by panel edges. Leaflet controls (zoom buttons) become unreachable under panels.

**Prevention:**
- Set explicit Leaflet pane z-indexes lower than your panel z-indexes (Leaflet allows custom panes via `map.createPane()`).
- Alternatively, render floating panels outside the Leaflet container DOM subtree using React portals into `document.body`, so stacking contexts don't interfere.
- The recommended Leaflet stacking strategy: tile panes at z-index 200, overlay panes at 400, shadow panes at 500, marker panes at 600, tooltip panes at 650, popup panes at 700. Set UI panels to z-index 800+.
- Audit every Framer Motion `animate` target: if it creates a `transform`, explicitly test that Leaflet popups still render above it.

**Detection:** Open a Leaflet popup while the floating left panel is visible. Confirm popup renders above panel. Click Leaflet zoom controls while panel is open.

**Phase:** Reskin layout restructure (Phase 1). Must be validated before any panel animation work.

---

## Moderate Pitfalls

---

### Pitfall 5: Geolocation Permission Requested at Wrong Time

**What goes wrong:** Calling `navigator.geolocation.getCurrentPosition()` on page load (or inside a top-level `useEffect` with `[]` deps on the root component) triggers the browser permission prompt before the user has taken any action. Modern browsers (Chrome, Firefox) and Lighthouse penalize this pattern. Safari on iOS silently fails geolocation if the page isn't in active focus when the prompt fires.

**Prevention:**
- Gate geolocation behind an explicit user action (a "Use my location" button or equivalent trigger).
- Check `navigator.permissions.query({ name: 'geolocation' })` first — if state is `'granted'`, you can auto-use it without prompting; if `'prompt'`, require a button click; if `'denied'`, show a static fallback message immediately rather than waiting for the API to fail.
- Always handle three failure codes: `PERMISSION_DENIED` (1), `POSITION_UNAVAILABLE` (2), `TIMEOUT` (3). Show distinct, actionable messages for each.
- HTTPS is mandatory — the Geolocation API is blocked entirely on HTTP origins. Vite dev server uses HTTP by default; use `vite --https` or a local cert for testing geolocation in development.

**Detection:** Run Lighthouse on the deployed build. Check "Avoids requesting permissions on page load" audit. Test on iOS Safari specifically.

**Phase:** Geolocation feature (Phase 3).

---

### Pitfall 6: Search Autocomplete Race Condition from Stale Nominatim Requests

**What goes wrong:** The search autocomplete fires a Nominatim API call on each keystroke (or debounced keystroke). If the user types faster than the debounce delay, or the network is slow, an older request resolves after a newer one, overwriting the correct results with stale data. Also: if the debounced function is re-created on every render (inside the component body without `useCallback` + `useRef`), debouncing is silently broken — each keystroke creates a fresh timer.

**Prevention:**
- Use `AbortController` in the fetch effect. Return a cleanup function that calls `abort()`. This cancels in-flight requests when the query changes.
- Create the debounce function once with `useRef`: `const debouncedFetch = useRef(debounce(fn, 300))`. Never create it inside the render body.
- Track a request ID counter or use `AbortController` — do NOT use response ordering as a proxy for recency.
- Cap autocomplete at 3-character minimum to reduce API load on Nominatim (which has a 1 req/sec rate limit for public use).
- Add explicit `accept-language` header to Nominatim requests — without it, result language varies by server locale, causing inconsistent display.

**Detection:** Throttle network to Slow 3G in DevTools. Type a 10-character query quickly. Confirm displayed results match the final typed query, not an intermediate one.

**Phase:** Search autocomplete (Phase 3).

---

### Pitfall 7: localStorage Serialization Failures Silently Corrupt Saved State

**What goes wrong:** `localStorage.setItem` throws `QuotaExceededError` (5MB limit, as low as 2.5MB on Safari iOS) without any visible error to the user if not caught. Additionally, saved state that includes non-serializable values (functions, class instances, `undefined` map entries, `NaN`) produces broken JSON that fails to parse on next load, crashing the app at startup.

**Prevention:**
- Always wrap `localStorage.setItem` and `.getItem` in try/catch. On `QuotaExceededError`, log and silently skip — never let it propagate to the UI as an uncaught error.
- Validate saved state schema on read: use a version key (`version: 1`) in the stored object; if the version doesn't match or required keys are missing, discard and use defaults. Never trust raw localStorage data.
- Do not store API response data in localStorage — store only user preferences (theme, font size, last coordinates). API data must be re-fetched. Storing full module responses will hit quota quickly given the number of data modules this app has.
- Sanitize before writing: `JSON.parse(JSON.stringify(obj))` catches non-serializable values before they reach storage.

**Detection:** Fill localStorage to near capacity in DevTools (Application tab), then trigger a save. Confirm no uncaught error. Corrupt stored JSON manually and reload — confirm app loads defaults gracefully.

**Phase:** localStorage save (Phase 4).

---

## Minor Pitfalls

---

### Pitfall 8: Lucide Icon Bundle Size if Imported Carelessly

**What goes wrong:** `import * as Icons from 'lucide-react'` imports the entire icon library. With 1,000+ icons, this adds ~200KB+ to the bundle even with tree-shaking if the bundler doesn't eliminate dead code correctly.

**Prevention:** Always use named imports: `import { MapPin, Wind } from 'lucide-react'`. Vite + ESM tree-shaking handles this correctly with named imports. Never use a barrel re-export that pulls all icons.

**Phase:** Icon replacement (Phase 2).

---

### Pitfall 9: OS Theme Detection Race with localStorage Saved Preference

**What goes wrong:** If both OS theme detection (`prefers-color-scheme`) and a localStorage-saved user preference exist, applying them in the wrong order causes a flash. Loading sequence matters: OS default → apply → then check localStorage → override. If reversed, the user sees a flicker from OS theme to saved theme every load.

**Prevention:** Read localStorage preference first in the synchronous `<head>` script. If present, use it directly. Only fall back to `prefers-color-scheme` if no saved preference exists. This avoids any flash entirely because the theme is set before the first paint.

**Phase:** OS theme detection (Phase 1).

---

### Pitfall 10: Tailwind `rounded-*` Purge Removes Classes Used Only in Dynamic Strings

**What goes wrong:** If border-radius classes are constructed dynamically (e.g., `` `rounded-${size}` ``), Tailwind's content scanner cannot detect them at build time and purges them. After reskin, panels appear sharp-cornered in production but rounded in development (where purging doesn't run).

**Prevention:** Never construct Tailwind class names dynamically. Use a full class name lookup object: `const radiusMap = { sm: 'rounded-sm', lg: 'rounded-lg' }`. Add dynamic class strings to the `safelist` in `tailwind.config.js` as a last resort.

**Phase:** Reskin (Phase 1).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Global reskin (border-radius, color tokens) | Leaflet popup/tooltip specificity break; Tailwind purge of dynamic classes | Override Leaflet styles in dedicated post-utilities block; use static class names |
| OS theme detection | Flash from late DOM class toggle; race with localStorage preference | Synchronous `<head>` script sets theme before first paint |
| Framer Motion panels + theme swap | Double-flash on mount; stacking context breaks Leaflet z-index | Animate only transform/opacity; use React portals for floating panels |
| Font size controls | CSS zoom breaks Leaflet coordinate math | Use `font-size` on `<html>` + `rem` units; never `zoom` |
| Lucide icon swap | Bundle bloat from barrel imports | Named imports only |
| Browser geolocation | Prompt on load penalized by Lighthouse; iOS Safari silent failure | Gate behind user action; check Permissions API state first |
| Search autocomplete | Stale Nominatim results from race condition; broken debounce | AbortController cleanup; `useRef` for debounce function |
| localStorage save | QuotaExceededError crashes silently; stale schema crashes on load | try/catch on all storage ops; versioned schema with graceful reset |

---

## Sources

- [Leaflet CSS specificity issues — GitHub Issue #6135](https://github.com/Leaflet/Leaflet/issues/6135)
- [CSS breaking Leaflet map rendering — bnolan.org](https://bnolan.org/2022/02/14/css-breaking-leaflet-map-rendering/)
- [Leaflet tile seam issues at fractional zoom — GitHub Issue #3575](https://github.com/Leaflet/Leaflet/issues/3575)
- [React Portals solving z-index and stacking context — ujjwalbasnet.com.np](https://www.ujjwalbasnet.com.np/blog/react-portals-solving-z-index-and-stacking-context-issues)
- [Leaflet map unaffected by z-index — OpenStreetMap Community Forum](https://community.openstreetmap.org/t/leaflet-map-is-unaffected-by-z-index-interferes-with-overlayed-dom-events/114778)
- [Geolocation API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Permissions API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API/Using_the_Permissions_API)
- [How I Fixed a Geolocation Permission Bug in Next.js — DEV Community](https://dev.to/orjinameh/how-i-fixed-a-geolocation-permission-bug-in-a-nextjs-app-2bh2)
- [Race conditions in React — Medium](https://medium.com/@pedro_sfg/how-to-avoid-race-condition-in-react-pt-1-07284cb93376)
- [Stale closure in React — DEV Community](https://dev.to/wildboar_developer/understanding-stale-closure-in-react-a-common-pitfall-and-how-to-avoid-it-5dih)
- [AbortController for autocomplete — OpenReplay Blog](https://blog.openreplay.com/optimizing-api-calls-react-debounce-strategies/)
- [localStorage quota exceeded — mmazzarolo.com](https://mmazzarolo.com/blog/2022-06-25-local-storage-status/)
- [localStorage quota exceeded errors — Medium](https://medium.com/@zahidbashirkhan/understanding-and-resolving-localstorage-quota-exceeded-errors-5ce72b1d577a)
- [Dark theme switch with Tailwind + Framer Motion — DEV Community](https://dev.to/mrpbennett/creating-a-dark-theme-switch-with-tailwind-framer-motion-4f4h)
