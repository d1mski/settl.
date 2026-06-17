---
phase: 02
slug: app-shell-state
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if installed) or manual browser verification |
| **Config file** | none — Wave 0 installs if needed |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | UX-04 | integration | `npm run build` | TBD | pending |
| 02-01-02 | 01 | 1 | UX-04 | manual | browser theme toggle | N/A | pending |
| 02-02-01 | 02 | 1 | UX-05 | integration | `npm run build` | TBD | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (tsc + build).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No FOUC on refresh | UX-04 | Visual timing | Hard refresh with light theme, observe no dark flash |
| OS preference detection | UX-04 | Requires OS setting change | Toggle OS dark mode, reload with no saved pref |
| Font scale visual | UX-05 | Visual check | Click A+/A-, verify text scales, click map to verify accuracy |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
