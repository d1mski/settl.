---
phase: 3
slug: locationintelcard-enhancements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework in project |
| **Config file** | None |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | FEAT-02 | manual-only | — | N/A | pending |
| TBD | TBD | TBD | FEAT-01 | manual-only | — | N/A | pending |
| TBD | TBD | TBD | UX-01 | typecheck | `npm run typecheck` | existing | pending |

*Status: pending . green . red . flaky*

*Task IDs will be filled after plans are created.*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework install needed — typecheck is the automated gate.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Debounce fires after 400ms, not before | FEAT-02 | Browser timing, no test framework | Type 3+ chars, verify dropdown appears after pause |
| 3-char minimum — no request for 1-2 chars | FEAT-02 | Browser interaction | Type 1-2 chars, verify no dropdown |
| ArrowDown/Up navigates dropdown | FEAT-02 | Keyboard interaction | Open dropdown, use arrow keys |
| Escape dismisses dropdown | FEAT-02 | Keyboard interaction | Open dropdown, press Escape |
| Click-outside dismisses dropdown | FEAT-02 | Mouse interaction | Open dropdown, click elsewhere |
| AbortController cancels stale request | FEAT-02 | Network timing | Type fast, verify no stale results |
| GPS button does not fire on page load | FEAT-01 | Page load behavior | Load page, verify no permission prompt |
| Granting permission centers map on GPS coords | FEAT-01 | GPS hardware | Click crosshair, grant, verify map centers |
| Denying permission shows inline error | FEAT-01 | Permission dialog | Click crosshair, deny, verify error message |
| No visible section codes anywhere | UX-01 | Visual inspection | Check all module headers, LocationIntelCard labels |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
