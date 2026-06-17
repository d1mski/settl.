# Deferred Items — Phase 05

## Out-of-Scope Discoveries

### [05-01] Pre-existing unused imports in LocationIntelCard.tsx

**File:** `src/components/shell/LocationIntelCard.tsx`
**Errors:**
- `TS6133: 'useSavedLocations' is declared but its value is never read.`
- `TS6133: 'HeartOutline' is declared but its value is never read.`
- `TS6133: 'HeartFilled' is declared but its value is never read.`

**Last touched:** Phase 02, commit `e38d2e7` (feat(02-02): replace 2-state ThemeToggle...)
**Impact:** `npm run build` fails; `npm run typecheck` passes (tsc --noEmit uses different strictness).
**Action needed:** Remove unused imports in LocationIntelCard.tsx in a future plan or cleanup task.
