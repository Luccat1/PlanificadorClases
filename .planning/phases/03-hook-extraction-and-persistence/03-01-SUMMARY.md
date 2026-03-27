---
phase: 03-hook-extraction-and-persistence
plan: 01
subsystem: testing
tags: [vitest, react-testing-library, hooks, tdd, jsdom, matchMedia]

# Dependency graph
requires:
  - phase: 02-test-infrastructure
    provides: Vitest + RTL infrastructure, test-setup.js, passing test suite
provides:
  - matchMedia mock in test-setup.js for jsdom dark mode test compatibility
  - Failing RED tests for useCourseData hook (13 test cases, ARCH-02 contract)
  - Failing RED tests for useSchedule hook (5 test cases, ARCH-03 contract)
affects:
  - 03-02 (hook implementation must satisfy these contracts)
  - 03-03 (dark mode hook depends on matchMedia mock)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD RED phase — write tests against non-existent hooks to force interface design before implementation
    - renderHook + act pattern for testing custom React hooks
    - vi.spyOn(window, 'confirm') for confirm dialog testing
    - matchMedia mock using Object.defineProperty with writable:true for per-test override

key-files:
  created:
    - src/hooks/__tests__/useCourseData.test.js
    - src/hooks/__tests__/useSchedule.test.js
  modified:
    - src/test-setup.js

key-decisions:
  - "matchMedia mock placed in test-setup.js (global setup) so all test files get it without per-file setup"
  - "resetCourse tests spy on window.confirm to test both confirm=true and confirm=false paths"
  - "useSchedule test uses both renderHook (noHoliday/withHoliday) to verify holiday skip without rerender"

patterns-established:
  - "RED stub pattern: import from non-existent file → fail with module-not-found (not syntax error)"
  - "beforeEach: localStorage.clear() + vi.restoreAllMocks() to isolate tests from each other"

requirements-completed: [ARCH-02, ARCH-03, PERS-01, PERS-02]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 03 Plan 01: Hook Test Stubs (RED) Summary

**TDD RED phase: 18 failing test stubs written for useCourseData (13 cases) and useSchedule (5 cases) with matchMedia mock added to test-setup.js for jsdom dark mode compatibility**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-27T15:41:00Z
- **Completed:** 2026-03-27T15:43:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Added `window.matchMedia` stub to `src/test-setup.js` — jsdom cannot call matchMedia without it, enabling all future dark mode hook tests
- Created 13-case test file for `useCourseData` covering: initial state, localStorage read/persist/corrupt fallback, handleInputChange, handleDayToggle, addExcludedDate (including dedup guard), removeExcludedDate, and resetCourse (confirm true/false paths)
- Created 5-case test file for `useSchedule` covering: empty startDate returns [], non-empty schedule generation, session shape (dateStr/number/dayName), reactivity to startDate change, and holiday skip behavior
- All 45 pre-existing tests remain green; 2 new test files fail RED with import errors (expected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add matchMedia mock to test-setup.js** - `128129a` (test)
2. **Task 2: Write useCourseData test stubs (RED)** - `5194913` (test)
3. **Task 3: Write useSchedule test stubs (RED)** - `442761b` (test)

## Files Created/Modified

- `src/test-setup.js` - Appended window.matchMedia stub using Object.defineProperty (writable:true for per-test override)
- `src/hooks/__tests__/useCourseData.test.js` - 13 test cases defining the useCourseData hook contract
- `src/hooks/__tests__/useSchedule.test.js` - 5 test cases defining the useSchedule hook contract

## Decisions Made

- matchMedia mock placed in global test-setup.js so all test files inherit it without per-file boilerplate
- resetCourse tests use `vi.spyOn(window, 'confirm')` to test both confirm-accepted and confirm-cancelled paths
- useSchedule holiday skip test uses two separate renderHook calls (no-holiday vs with-holiday) rather than rerender, since the hook is pure/synchronous on first render

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03-02 can begin immediately: useCourseData.js and useSchedule.js hooks must be created to make the RED tests go GREEN
- Plan 03-03 (dark mode / view mode persistence) is unblocked since matchMedia mock is now in place
- The exact interface contracts (function signatures, return shapes) are fully specified by the test files

---
*Phase: 03-hook-extraction-and-persistence*
*Completed: 2026-03-27*

## Self-Check: PASSED

- FOUND: src/test-setup.js
- FOUND: src/hooks/__tests__/useCourseData.test.js
- FOUND: src/hooks/__tests__/useSchedule.test.js
- FOUND: .planning/phases/03-hook-extraction-and-persistence/03-01-SUMMARY.md
- FOUND: commit 128129a (matchMedia mock)
- FOUND: commit 5194913 (useCourseData RED tests)
- FOUND: commit 442761b (useSchedule RED tests)
