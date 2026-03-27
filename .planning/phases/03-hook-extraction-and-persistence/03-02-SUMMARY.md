---
phase: 03-hook-extraction-and-persistence
plan: 02
subsystem: hooks
tags: [react, hooks, localStorage, useMemo, tdd-green]

# Dependency graph
requires:
  - phase: 03-hook-extraction-and-persistence
    plan: 01
    provides: Failing RED tests for useCourseData (13 cases) and useSchedule (5 cases)
provides:
  - useCourseData hook with localStorage persistence (ARCH-02)
  - useSchedule hook using useMemo for synchronous schedule derivation (ARCH-03)
affects:
  - 03-03 (App.jsx wiring consumes these hooks)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - skipNextPersistRef pattern: useRef prevents useEffect re-persist after localStorage.removeItem in resetCourse
    - useMemo for derived state: avoids stale render frame vs useEffect+setState approach

key-files:
  created:
    - src/hooks/useCourseData.js
    - src/hooks/useSchedule.js
  modified: []

key-decisions:
  - "skipNextPersistRef (useRef) used to prevent useEffect from re-writing localStorage immediately after resetCourse clears it — ensures test: 'removes courseData key from localStorage' passes"
  - "useSchedule uses useMemo not useEffect+setState — synchronous derivation avoids stale render frame"

requirements-completed: [ARCH-02, ARCH-03]

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 03 Plan 02: Hook Implementations (GREEN) Summary

**TDD GREEN phase: useCourseData and useSchedule hooks created, making all 18 RED tests pass with zero regressions across the full 63-test suite**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-27T18:46:29Z
- **Completed:** 2026-03-27T18:48:30Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Created `src/hooks/useCourseData.js` — exports `INITIAL_COURSE_DATA` (module-level const) and `useCourseData` hook with lazy localStorage initialization, useEffect persistence, and all 5 mutation handlers (handleInputChange, handleDayToggle, addExcludedDate, removeExcludedDate, resetCourse). All 13 tests pass.
- Created `src/hooks/useSchedule.js` — exports `useSchedule(courseData, holidays)` using `useMemo` for synchronous schedule derivation without the stale render frame that useEffect+setState would introduce. All 5 tests pass.
- Full test suite: 63/63 tests pass with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useCourseData.js (GREEN)** - `dd63095` (feat)
2. **Task 2: Create useSchedule.js (GREEN)** - `bd693eb` (feat)

## Files Created

- `src/hooks/useCourseData.js` - Course state hook with localStorage read/persist/reset and all mutation handlers
- `src/hooks/useSchedule.js` - Derived schedule hook using useMemo wrapping calculateSchedule

## Decisions Made

- `skipNextPersistRef` pattern: `resetCourse` sets a `useRef` flag before `setCourseData(INITIAL_COURSE_DATA)` and `localStorage.removeItem`. The `useEffect` checks this flag on next run and skips the persist, leaving localStorage clear. Without this, the effect would immediately re-write INITIAL_COURSE_DATA after the remove.
- `useSchedule` uses `useMemo` not `useEffect + setState` — the plan research document documents why: useMemo computes synchronously in the same render, while useEffect runs after paint causing a stale frame where schedule = [].

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed localStorage re-persist after resetCourse**
- **Found during:** Task 1 verification
- **Issue:** `resetCourse` called `setCourseData(INITIAL_COURSE_DATA)` then `localStorage.removeItem('courseData')`, but the `useEffect` watching `courseData` fired after the remove and wrote INITIAL_COURSE_DATA back, causing "removes courseData key from localStorage" test to fail
- **Fix:** Added `skipNextPersistRef = useRef(false)` — set to `true` before reset, `useEffect` checks and skips one cycle then resets the flag
- **Files modified:** `src/hooks/useCourseData.js`
- **Commit:** `dd63095`

## Issues Encountered

None beyond the localStorage re-persist bug fixed above.

## User Setup Required

None.

## Next Phase Readiness

- Plan 03-03 can begin: both hooks are stable, tested, and ready to replace inline state in App.jsx
- The hooks satisfy their contracts as defined in the test files from Plan 01
- Full test suite is green (63/63) — no blocking issues

---
*Phase: 03-hook-extraction-and-persistence*
*Completed: 2026-03-27*

## Self-Check: PASSED

- FOUND: src/hooks/useCourseData.js
- FOUND: src/hooks/useSchedule.js
- FOUND: .planning/phases/03-hook-extraction-and-persistence/03-02-SUMMARY.md
- FOUND: commit dd63095 (useCourseData hook)
- FOUND: commit bd693eb (useSchedule hook)
