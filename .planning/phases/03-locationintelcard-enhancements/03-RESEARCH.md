# Phase 3: LocationIntelCard Enhancements — Research

**Researched:** 2026-06-17
**Domain:** React autocomplete UX, Geolocation API, section header labels
**Confidence:** HIGH

## Summary

Phase 3 has three distinct work items. Two are UX additions to the existing `LocationIntelCard` — debounced autocomplete and geolocation — and one is a cosmetic fix to `SectionHeader`. All work touches existing code; nothing is greenfield.

The autocomplete infrastructure already exists (`forwardGeocode`, `useNominatim.ts`, suggestion list in `LocationIntelCard`). What's missing is: (1) the debounce on `onChange` so suggestions fire as-you-type (currently only fires on Enter/EXEC button), (2) a "Use my location" button wired to `navigator.geolocation.getCurrentPosition`, and (3) removal of the `§{code}` span from `SectionHeader`.

No new npm packages are required. Everything is native browser API + existing project utilities.

**Primary recommendation:** Wire debounced autocomplete into the existing `LocationIntelCard` input's `onChange`, add a GPS button that calls `navigator.geolocation.getCurrentPosition` on click (never on mount), and drop the `§{code}` span from `SectionHeader`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEAT-02 | Search input provides autocomplete dropdown from Nominatim (400ms debounce, 3-char min, keyboard navigation, AbortController cleanup) | `forwardGeocode` already exists; need `useRef` debounce timer + `onChange` handler + keyboard `ArrowUp/ArrowDown/Escape` on dropdown |
| FEAT-01 | App requests browser geolocation on user click (permission-aware, GPS accuracy, HTTPS) and auto-populates location | `navigator.geolocation.getCurrentPosition` called inside button onClick; handle `GeolocationPositionError` codes 1/2/3 with inline message |
| UX-01 | Section headers use plain English labels instead of §XX codes | `SectionHeader` renders `§{code}` in a `<span>` on line 10-12; drop that span and the `code` prop or make it optional |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 (pinned) | Component state, refs, effects | Already in project |
| TypeScript | 5.7.2 (pinned) | Types for GeolocationPosition, error codes | Already in project |
| Nominatim API | n/a (free, public) | Forward geocode autocomplete | Already wired in `useNominatim.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useRef` (React) | built-in | Store debounce timer ID (`NodeJS.Timeout`) | Avoids recreating timer on re-render |
| `AbortController` | browser built-in | Cancel in-flight Nominatim requests on new keystroke | Already used in `LocationIntelCard` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual debounce with `useRef` | `use-debounce` npm package | No new dependency needed; 10-line implementation is sufficient |
| `navigator.geolocation` | IP geolocation API | GPS is more accurate; IP geo requires server/key |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed. All changes go into existing files:

```
src/
├── components/shell/LocationIntelCard.tsx   # Add debounce + GPS button
├── components/hud/SectionHeader.tsx         # Remove §code span, make code prop optional
└── components/modules/*.tsx                 # No changes needed (code prop can be left in callers, just unused)
```

### Pattern 1: Debounced Autocomplete on onChange

**What:** Fire `forwardGeocode` 400ms after the user stops typing, minimum 3 chars. Cancel previous request on new keystroke.

**When to use:** Any type-ahead search against a rate-limited external API.

**Example:**
```typescript
// Inside LocationIntelCard — augment existing onChange
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  const value = e.target.value;
  setRaw(value);
  setSuggestions([]);
  setError(null);

  if (debounceRef.current) clearTimeout(debounceRef.current);
  if (value.trim().length < 3) return;

  debounceRef.current = setTimeout(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const results = await forwardGeocode(value.trim(), ctrl.signal);
      if (!ctrl.signal.aborted) setSuggestions(results);
    } catch {
      // silently swallow — user may still hit Enter
    }
  }, 400);
}
```

### Pattern 2: Keyboard Navigation on Suggestion Dropdown

**What:** ArrowDown/ArrowUp move a focused index through suggestions; Enter selects; Escape clears.

**When to use:** Any listbox-style dropdown in a form field.

**Example:**
```typescript
const [focusedIdx, setFocusedIdx] = useState(-1);

// On the <input> onKeyDown:
if (e.key === 'ArrowDown') {
  e.preventDefault();
  setFocusedIdx(i => Math.min(i + 1, suggestions.length - 1));
} else if (e.key === 'ArrowUp') {
  e.preventDefault();
  setFocusedIdx(i => Math.max(i - 1, -1));
} else if (e.key === 'Escape') {
  setSuggestions([]);
  setFocusedIdx(-1);
} else if (e.key === 'Enter' && focusedIdx >= 0) {
  e.preventDefault();
  setCurrent(suggestions[focusedIdx].coords);
  setSuggestions([]);
  setFocusedIdx(-1);
} else if (e.key === 'Enter') {
  handleSubmit();
}
```

### Pattern 3: Click-Outside to Dismiss Dropdown

**What:** Attach a `mousedown` listener on `document`; dismiss if click target is outside the container ref.

**When to use:** Any floating suggestion list.

**Example:**
```typescript
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setSuggestions([]);
      setFocusedIdx(-1);
    }
  }
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

// Wrap input + dropdown in <div ref={containerRef}>
```

### Pattern 4: Geolocation Button (Permission-Aware)

**What:** Call `navigator.geolocation.getCurrentPosition` inside a button `onClick`. Never autofire. Display inline error on deny/error; never throw uncaught.

**When to use:** Any explicit "use my location" affordance.

**Example:**
```typescript
const [geoError, setGeoError] = useState<string | null>(null);
const [geoLoading, setGeoLoading] = useState(false);

function handleGeolocate() {
  if (!navigator.geolocation) {
    setGeoError('Geolocation not supported by this browser.');
    return;
  }
  setGeoError(null);
  setGeoLoading(true);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setGeoLoading(false);
      setCurrent({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    },
    (err) => {
      setGeoLoading(false);
      if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
        setGeoError('Location access denied. Enable in browser settings.');
      } else if (err.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
        setGeoError('Location unavailable.');
      } else {
        setGeoError('Location request timed out.');
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}
```

### Pattern 5: SectionHeader — Drop §code Span

**What:** Make `code` prop optional with `?` and remove (or conditionally hide) the `§{code}` span. The `title` prop already carries the plain English label ("Climate", "Air Quality" etc.) — it just needs to be visible without the code prefix.

**When to use:** UX-01 requirement — no §XX visible to end users.

**Example:**
```typescript
// Before (line 10-12 of SectionHeader.tsx):
<span className="text-[9px] font-mono text-cyan/70 tracking-widest-plus">
  §{code}
</span>

// After — remove that span entirely. Keep title and subtitle spans.
// Make interface: interface Props { code?: string; title: string; subtitle?: string; }
// Callers don't need to change (code prop is just ignored).
```

### Anti-Patterns to Avoid

- **Autocomplete on every keystroke without debounce:** Violates Nominatim rate-limit policy (min 1 request/second). The existing throttle queue in `useNominatim.ts` helps but debounce prevents queue buildup.
- **Geolocation on mount/`useEffect`:** Browsers block or auto-deny background geolocation requests. Must be user-gesture-triggered.
- **`navigator.geolocation` without feature detection:** Throws on older browsers / non-HTTPS. Always guard with `if (!navigator.geolocation)`.
- **Uncaught geolocation errors:** `getCurrentPosition` error callback is required, not optional. Omitting it causes unhandled promise-like errors in some browsers.
- **Resetting `focusedIdx` only on selection, not on new input:** Stale index causes wrong item selection when list changes length.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounce timer | Custom hook or npm package | `useRef<ReturnType<typeof setTimeout>>` + `clearTimeout` | Simple enough; no dependency needed |
| Geolocation wrapper | Custom hook | Inline `getCurrentPosition` in the button handler | One call site; hook abstraction adds indirection for no gain |
| Dropdown accessibility | Custom ARIA listbox | Native keyboard patterns above | Full ARIA combobox is complex; the project's HUD aesthetic doesn't use semantic roles elsewhere |

---

## Common Pitfalls

### Pitfall 1: Debounce timer leak on unmount
**What goes wrong:** If the component unmounts while a debounce timer is pending, the callback fires after unmount and calls `setSuggestions` on a dead component.
**Why it happens:** `setTimeout` is not automatically cleared on unmount.
**How to avoid:** Return a cleanup from `useEffect` that clears `debounceRef.current`, OR clear in the component's cleanup pattern. Since the timer is set in an event handler (not an effect), also clear it when the component unmounts via a `useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, [])`.
**Warning signs:** React "Can't perform state update on unmounted component" warning (React 17) or silent no-op (React 18).

### Pitfall 2: AbortController race on rapid typing
**What goes wrong:** Two concurrent `forwardGeocode` calls resolve out of order, showing stale results.
**Why it happens:** The existing `abortRef` pattern aborts the previous controller before creating a new one — this is correct. The pitfall is forgetting to abort before the debounce fires (i.e., abort should happen when the NEW timer fires, not immediately on keystroke).
**How to avoid:** Abort inside the `setTimeout` callback (after the 400ms), not on every `onChange`. This matches the pattern in Pattern 1 above.
**Warning signs:** Suggestions flash then revert to an older result.

### Pitfall 3: Geolocation permission state not re-checked
**What goes wrong:** User grants permission, then revokes it in browser settings. Next click shows no error because the permission query cache is stale.
**Why it happens:** `navigator.permissions.query({ name: 'geolocation' })` is async and not always reliable across browsers.
**How to avoid:** Always call `getCurrentPosition` directly — let the browser return error code 1 (PERMISSION_DENIED) if revoked. Don't pre-check; let the callback handle it.
**Warning signs:** Silent failure after permission revocation.

### Pitfall 4: §code prop removal breaks TypeScript callers
**What goes wrong:** Making `code` required → optional causes no TS errors in callers (they still pass it — it's just ignored). But if `code` is removed from the interface entirely, all 6 call sites break.
**Why it happens:** Interface change propagates.
**How to avoid:** Mark `code` as `code?: string` (optional) in the interface. Do not remove it. Callers pass it, component ignores it. Zero caller changes needed.
**Warning signs:** TS errors in all module files after interface change.

### Pitfall 5: `focusedIdx` not reset when suggestions list changes
**What goes wrong:** User arrows down to index 2, types another character, list shrinks to 1 item — `focusedIdx` is still 2, Enter selects `suggestions[2]` which is `undefined`.
**Why it happens:** State isn't tied to list identity.
**How to avoid:** Reset `setFocusedIdx(-1)` whenever `setSuggestions(...)` is called.

---

## Code Examples

### Verified: Nominatim search URL pattern (from existing `useNominatim.ts`)
```typescript
// Source: src/hooks/useNominatim.ts (line 224-228)
const url =
  `${BASE}/search?q=${encodeURIComponent(query)}` +
  `&format=json&limit=5&addressdetails=1&email=${CONTACT}`;
```

### Verified: Existing AbortController pattern (from `LocationIntelCard.tsx`)
```typescript
// Source: src/components/shell/LocationIntelCard.tsx (lines 75-77)
abortRef.current?.abort();
const ctrl = new AbortController();
abortRef.current = ctrl;
```

### Verified: GeolocationPositionError codes (MDN / browser standard)
```typescript
// PERMISSION_DENIED = 1
// POSITION_UNAVAILABLE = 2
// TIMEOUT = 3
err.code === 1  // or GeolocationPositionError.PERMISSION_DENIED
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Submit-only geocode (current) | As-you-type debounced autocomplete | Phase 3 | Faster UX, more natural |
| §XX section codes visible | Plain English labels only | Phase 3 | Cleaner for non-technical users |

**Deprecated/outdated in this project:**
- `LocationInput.tsx` — standalone component now superseded by the `LocationIntelCard` integrated input. Do not add geolocation/autocomplete to `LocationInput.tsx`; all changes go to `LocationIntelCard.tsx`.

---

## Environment Availability

Step 2.6: SKIPPED — phase is purely browser API + existing project code. No external CLI tools, databases, or services beyond Nominatim (already used). Nominatim is a public HTTP API; no install required.

Note: Nominatim usage policy requires HTTPS in production and an `email` contact param. Both are already satisfied in `useNominatim.ts`.

---

## Validation Architecture

`workflow.nyquist_validation` is not set to `false` in `.planning/config.json` — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files, no test directory, no test scripts in package.json |
| Config file | None — Wave 0 must add if automated tests are desired |
| Quick run command | `npm run typecheck` (TypeScript type-check as proxy for correctness) |
| Full suite command | `npm run build` (full compile + bundle) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEAT-02 | Debounce fires after 400ms, not before | manual-only | — | N/A |
| FEAT-02 | 3-char minimum — no request fired for 1-2 chars | manual-only | — | N/A |
| FEAT-02 | ArrowDown/Up navigates dropdown | manual-only | — | N/A |
| FEAT-02 | Escape dismisses dropdown | manual-only | — | N/A |
| FEAT-02 | Click-outside dismisses dropdown | manual-only | — | N/A |
| FEAT-02 | AbortController cancels stale request | manual-only | — | N/A |
| FEAT-01 | "Use my location" button does not fire on page load | manual-only | — | N/A |
| FEAT-01 | Granting permission centers map on GPS coords | manual-only | — | N/A |
| FEAT-01 | Denying permission shows inline error message | manual-only | — | N/A |
| UX-01 | No §XX text visible in any section header | `npm run typecheck` (verify code? prop change) | `npm run typecheck` | ✅ (existing file) |

**Justification for manual-only:** No test framework exists in the project. Geolocation and debounce timing require browser environment. TypeScript typecheck catches the `SectionHeader` interface change automatically.

### Sampling Rate
- Per task commit: `npm run typecheck`
- Per wave merge: `npm run build`
- Phase gate: `npm run build` green before `/gsd:verify-work`

### Wave 0 Gaps
None blocking — no new test files needed. Typecheck is the automated gate. Manual browser testing covers the interactive behaviors.

---

## Open Questions

1. **Should the GPS button replace the EXEC button or sit beside it?**
   - What we know: Current layout has `[input][EXEC][theme-toggle]` in a flex row. Adding a GPS icon button beside EXEC is space-constrained at 360px width.
   - What's unclear: Whether to use a small icon button (saves space) or a text label ("GPS").
   - Recommendation: Use a small icon button (crosshair SVG, same style as existing inline SVGs) placed between EXEC and theme-toggle. This matches the HUD aesthetic without expanding the card width.

2. **Should `§{code}` spans inside `LocationIntelCard.tsx` (lines 127, 321) also be removed?**
   - What we know: The `FixBlock` component renders `§02 · FIX A` inline (not via `SectionHeader`). The `§01 · INPUT` label is also inline.
   - What's unclear: UX-01 says "section headers" — it's ambiguous whether `LocationIntelCard` inline labels count.
   - Recommendation: Remove §-prefixed codes from all user-visible labels in `LocationIntelCard` too, for consistency.

---

## Sources

### Primary (HIGH confidence)
- `src/components/shell/LocationIntelCard.tsx` — current input/suggestion implementation
- `src/hooks/useNominatim.ts` — throttle queue, `forwardGeocode`, `AbortController` pattern
- `src/components/hud/SectionHeader.tsx` — §code rendering
- `src/App.tsx` — geolocation integration point (no geolocation present today)
- MDN Web Docs: `navigator.geolocation.getCurrentPosition` — error codes 1/2/3, options shape

### Secondary (MEDIUM confidence)
- Nominatim Usage Policy (https://operations.osmfoundation.org/policies/nominatim/) — 1 req/s limit, email header required, already honored in `useNominatim.ts`

---

## Metadata

**Confidence breakdown:**
- Autocomplete wiring: HIGH — existing code is the pattern; changes are additive
- Geolocation: HIGH — standard browser API, no library needed
- SectionHeader fix: HIGH — single-file change, one span removed
- Keyboard navigation: HIGH — standard pattern, well-documented
- Click-outside: HIGH — standard pattern, well-documented

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (stable APIs, no moving parts)
