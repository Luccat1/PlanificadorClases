---
phase: 4
slug: holiday-api-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.js |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | ARCH-04 | unit | `npm test -- --run src/services/holidayService.test.js` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | ARCH-04 | unit | `npm test -- --run src/services/holidayService.test.js` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | ARCH-04 | unit | `npm test -- --run src/services/holidayService.test.js` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | ARCH-04 | unit | `npm test -- --run src/hooks/useHolidays.test.js` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 2 | CORT-02 | unit | `npm test -- --run src/hooks/useHolidays.test.js` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 3 | ARCH-04, CORT-02 | integration | `npm test -- --run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/services/holidayService.test.js` — stubs for ARCH-04 (API fetch, cache read/write, error fallback)
- [ ] `src/hooks/useHolidays.test.js` — stubs for ARCH-04, CORT-02 (multi-year fetch, graceful degradation)
- [ ] MSW handlers in `src/test-setup.js` or `src/mocks/handlers.js` — mock nager.date API responses

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No network request on page refresh when cache exists | ARCH-04 | Requires browser DevTools network tab inspection | Open DevTools → Network tab, generate a schedule, refresh page, verify no request to date.nager.at |
| Warning banner visible when API unreachable | CORT-02 | Requires simulating network failure in browser | Open DevTools → Network tab, block date.nager.at, generate schedule, verify banner appears above schedule |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
