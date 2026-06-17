---
phase: 5
slug: modulerail-lucide-icons
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework in project |
| **Config file** | none |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full build must be green + visual inspection of rail in both dark and light themes
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SKIN-04 | type check | `npm run typecheck` | N/A | pending |
| 05-01-02 | 01 | 1 | SKIN-04 | type check | `npm run typecheck` | N/A | pending |
| 05-01-03 | 01 | 1 | SKIN-04 | type check + visual | `npm run typecheck` | N/A | pending |
| 05-02-01 | 02 | 2 | UX-03 | type check | `npm run typecheck` | N/A | pending |
| 05-02-02 | 02 | 2 | UX-03 | type check + visual | `npm run typecheck` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — TypeScript type checking and `npm run build` are the automated validation strategy.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 6 rail slots render Lucide SVGs visually | SKIN-04 | No DOM test framework | Open app, verify each rail icon renders as SVG, no emoji visible |
| Icons consistent size/color in dark + light themes | SKIN-04 | Visual verification | Toggle theme, check all icons maintain consistent size and inherit text color |
| Toggle button visually distinct from nav icons | UX-03 | Visual verification | Verify divider separates toggle from nav; toggle icon changes on click |
| No `⚠` Unicode glyphs visible anywhere | SKIN-04 | grep + visual | Run `grep -r "⚠" src/` — should return 0 results |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
