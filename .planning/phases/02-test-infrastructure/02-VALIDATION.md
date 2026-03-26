---
phase: 2
slug: test-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vite.config.js` — `test:` block added by Wave 0 |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` (same — all tests run in < 30 s) |
| **Coverage command** | `npm run test:coverage` |
| **Estimated runtime** | ~10–20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| install-deps | 02-01 | 0 | TEST-01 | smoke | `npm test` | ❌ W0 | ⬜ pending |
| config-vite | 02-01 | 0 | TEST-01 | smoke | `npm test` | ❌ W0 | ⬜ pending |
| setup-file | 02-01 | 0 | TEST-01 | smoke | `npm test` | ❌ W0 | ⬜ pending |
| msw-scaffold | 02-01 | 0 | TEST-01 | smoke | `npm test` | ❌ W0 | ⬜ pending |
| test-getEffectiveHours | 02-01 | 1 | TEST-02 | unit | `npm test -- getEffectiveHours` | ❌ W0 | ⬜ pending |
| test-calculateSchedule | 02-01 | 1 | TEST-03, TEST-04, TEST-05 | unit | `npm test -- calculateSchedule` | ❌ W0 | ⬜ pending |
| test-CourseForm | 02-01 | 2 | TEST-06 | component | `npm test -- CourseForm` | ❌ W0 | ⬜ pending |
| test-ScheduleList | 02-01 | 2 | TEST-07 | component | `npm test -- ScheduleList` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All test infrastructure is missing — Wave 0 must establish it before any tests can run:

- [ ] `npm install --save-dev vitest@3 @vitest/coverage-v8@3 @testing-library/react@16 @testing-library/user-event@14 @testing-library/jest-dom@6 msw@2 jsdom` — install all test deps
- [ ] `vite.config.js` — add `test:` block (environment, globals, setupFiles, include, coverage)
- [ ] `package.json` — add `test` and `test:coverage` scripts
- [ ] `src/test-setup.js` — import jest-dom + MSW server lifecycle (beforeAll/afterEach/afterAll)
- [ ] `src/mocks/handlers.js` — empty handlers array scaffold
- [ ] `src/mocks/server.js` — MSW Node server setup

*Wave 0 is complete when `npm test` exits 0 with no test files (empty suite).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Coverage report appears in `coverage/` directory | TEST-01 | Directory creation verified visually | Run `npm run test:coverage`, check `ls coverage/` exists and contains `index.html` |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
