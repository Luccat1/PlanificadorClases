---
phase: 3
slug: hook-extraction-and-persistence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vite.config.js (test block) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm run test:coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | ARCH-02 | unit | `npm test -- --run src/hooks/__tests__/useCourseData.test.js` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | ARCH-03 | unit | `npm test -- --run src/hooks/__tests__/useSchedule.test.js` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 0 | PERS-01 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | ARCH-02 | unit | `npm test -- --run src/hooks/__tests__/useCourseData.test.js` | ✅ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | ARCH-03 | unit | `npm test -- --run src/hooks/__tests__/useSchedule.test.js` | ✅ W0 | ⬜ pending |
| 3-03-01 | 03 | 1 | PERS-01 | unit | `npm test -- --run` | ✅ W0 | ⬜ pending |
| 3-03-02 | 03 | 1 | PERS-02 | unit | `npm test -- --run` | ✅ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | ARCH-02, ARCH-03, PERS-01, PERS-02 | integration | `npm test -- --run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/__tests__/useCourseData.test.js` — stubs for ARCH-02 (persistence, handlers, reset)
- [ ] `src/hooks/__tests__/useSchedule.test.js` — stubs for ARCH-03 (reactive recompute)
- [ ] `src/test-setup.js` — add `window.matchMedia` mock for PERS-01 jsdom compatibility

**matchMedia mock to add to test-setup.js:**
```javascript
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })),
});
```

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark mode persists across page refresh | PERS-01 | Requires real browser localStorage + matchMedia across sessions | Toggle dark mode → refresh → confirm preference retained |
| View mode persists across page refresh | PERS-02 | Requires real browser localStorage across sessions | Switch to calendar view → refresh → confirm calendar view active |
| First visit dark mode matches system preference | PERS-01 | Requires OS-level dark mode toggle | Clear localStorage → set OS dark mode → load app → confirm dark mode active |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
