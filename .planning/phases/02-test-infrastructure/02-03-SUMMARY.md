---
phase: 02-test-infrastructure
plan: 03
subsystem: testing
tags: [vitest, react-testing-library, userEvent, jsdom, component-tests]

# Dependency graph
requires:
  - phase: 02-01
    provides: Vitest + React Testing Library + jsdom test infrastructure
provides:
  - CourseForm component tests with wrapper-pattern state propagation (TEST-06)
  - ScheduleList component tests with real Date objects and marker assertions (TEST-07)
affects: [phase-03, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Wrapper component pattern for testing controlled inputs (D-08)
    - makeSession helper with local Date constructor to avoid UTC timezone issues
    - userEvent.setup() for all interactions (no fireEvent)
    - getAllByRole('spinbutton') for number inputs
    - getAllByRole('row') for table row count assertions

key-files:
  created:
    - src/components/__tests__/CourseForm.test.jsx
    - src/components/__tests__/ScheduleList.test.jsx
  modified: []

key-decisions:
  - "Wrapper component pattern (D-08) used to test real state propagation — not mock functions"
  - "makeSession uses new Date(year, month-1, day) local constructor to avoid UTC midnight offset in jsdom"
  - "getAllByRole('spinbutton') for number inputs; index 0 = totalHours (first in DOM order)"
  - "Day button name match uses /^Lun$/i exact pattern to avoid ambiguity with button groups"

patterns-established:
  - "Pattern: Wrapper component with useState for testing prop-down input propagation"
  - "Pattern: makeSession factory helper for ScheduleList session shape with local Date objects"

requirements-completed: [TEST-06, TEST-07]

# Metrics
duration: 15min
completed: 2026-03-26
---

# Phase 02 Plan 03: Component Tests Summary

**CourseForm and ScheduleList React Testing Library tests using wrapper-component pattern, covering input propagation, day toggle, MITAD/RECUPERACION markers, and row count assertions — 11 tests, all green**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-26T17:10:00Z
- **Completed:** 2026-03-26T17:25:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- CourseForm tests (6): wrapper-pattern verifies real state propagation for courseName input, totalHours input, day toggle add/remove, and hourType button
- ScheduleList tests (5): row count (header + N sessions), MITAD marker, RECUPERACION marker, single session, empty schedule
- All 11 tests pass in full suite run alongside existing logic tests
- `makeSession` helper established with correct local Date constructor (not ISO string) to avoid UTC timezone issue in jsdom

## Task Commits

Each task was committed atomically:

1. **Task 1: CourseForm component tests (TEST-06)** - `9b31115` (feat)
2. **Task 2: ScheduleList component tests (TEST-07)** - `455fe77` (feat)

## Files Created/Modified

- `src/components/__tests__/CourseForm.test.jsx` - Wrapper-pattern tests for CourseForm: render, courseName, totalHours, day toggle, hourType
- `src/components/__tests__/ScheduleList.test.jsx` - makeSession factory + row count, MITAD, RECUPERACION, empty schedule tests

## Decisions Made

- Wrapper component with `useState` used instead of mock functions — tests the actual prop-down data flow that the app depends on
- `makeSession` helper uses `new Date(year, month - 1, day)` (local constructor) not `new Date('YYYY-MM-DD')` (ISO UTC midnight) — critical for jsdom environment where timezone offset would shift the date
- Number input identified by `getAllByRole('spinbutton')[0]` — totalHours is first `<input type="number">` in DOM order (confirmed by reading CourseForm.jsx)
- Day button matched with `/^Lun$/i` exact pattern — avoids false matches from other buttons containing "Lun" substring

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tests passed on first run. DOM order for `spinbutton` inputs was confirmed by reading CourseForm.jsx source before writing the test (totalHours is first in the grid at line 65, hoursPerSession at line 99).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- TEST-06 and TEST-07 satisfied — component test layer complete for Phase 2
- Full suite (11 tests across 2 files) passes; ready for Phase 3 work
- Wrapper pattern and makeSession helper can be referenced for any additional component tests in future phases

## Self-Check: PASSED

- FOUND: src/components/__tests__/CourseForm.test.jsx
- FOUND: src/components/__tests__/ScheduleList.test.jsx
- FOUND: .planning/phases/02-test-infrastructure/02-03-SUMMARY.md
- FOUND commit: 9b31115 (CourseForm tests)
- FOUND commit: 455fe77 (ScheduleList tests)

---
*Phase: 02-test-infrastructure*
*Completed: 2026-03-26*
