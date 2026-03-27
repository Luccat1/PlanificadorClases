---
phase: 05-validation-export-and-ux
plan: "02"
subsystem: ui
tags: [react, tailwind, validation, form, courseform, expo-01, cort-01, tdd]

requires:
  - phase: 05-01
    provides: [extended-initial-course-data, semester, professorName, contactEmail, recoveryExtraMinutes fields]
provides:
  - CourseForm with 4 new metadata/configuration fields (semester, professorName, contactEmail, recoveryExtraMinutes)
  - touched+blur inline validation for 5 fields (totalHours, hoursPerSession, startDate, classDays, recoveryExtraMinutes)
  - rose border and error paragraph rendering on invalid touched fields
  - stable aria-label spinbutton queries for number inputs
affects: [05-03, App.jsx, export-metadata, print-metadata]

tech-stack:
  added: []
  patterns: [touched-blur-validation, getError-helper, conditional-rose-border, aria-label-spinbutton]

key-files:
  created: []
  modified:
    - src/components/CourseForm.jsx
    - src/components/__tests__/CourseForm.test.jsx

key-decisions:
  - "touched state as single object useState({}) — field key set to true on first blur/click"
  - "getError(field) returns null when field not touched — guarantees clean initial state (D-01)"
  - "onChange re-evaluation of getError provides eager clearing (D-02) without separate touched reset"
  - "aria-label on TOTAL HORAS and HRS / SESION enables stable spinbutton queries in tests"
  - "2-col grid expanded to 3-col for Hrs/Sesion + Ses.Recuperacion + Min.Extra Recuperacion"

patterns-established:
  - "Conditional border pattern: border-rose-400 dark:border-rose-500 via ternary on getError()"
  - "Error paragraph pattern: {getError('field') && <p className='text-sm text-rose-500 ...'>}"
  - "markTouched pattern: setTouched(prev => ({ ...prev, [field]: true })) via onBlur/onClick"

requirements-completed: [CORT-01, EXPO-01]

duration: 5min
completed: "2026-03-27"
---

# Phase 05 Plan 02: CourseForm New Fields and Inline Validation Summary

**Inline touched+blur validation for 5 fields plus 4 new metadata/configuration inputs (semester, professorName, contactEmail, recoveryExtraMinutes) wired into CourseForm with rose-border error rendering and 10 new tests.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T20:55:01Z
- **Completed:** 2026-03-27T21:00:15Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added three full-width metadata fields after Nombre del Curso: SEMESTRE, NOMBRE PROFESOR/A, EMAIL DE CONTACTO
- Expanded 2-col recovery grid to 3-col and added MIN. EXTRA RECUPERACION number input
- Implemented `touched` state, `markTouched`, and `getError` helper for 5 validated fields — clean initial state, blur-triggered errors, eager onChange clearing
- Conditional rose border and error paragraph render on all invalid touched fields
- Extended CourseForm tests with EXPO-01 (5 tests) and CORT-01 (5 tests) describe blocks; updated totalHours test to use aria-label query

## Task Commits

Each task was committed atomically:

1. **Task 1: Add new form fields, recoveryExtraMinutes input, and inline validation to CourseForm** - `1e7c03b` (feat)
2. **Task 2: Extend CourseForm tests for new fields and validation (TDD GREEN)** - `732a985` (test)

## Files Created/Modified

- `src/components/CourseForm.jsx` - 4 new fields, 3-col grid, touched+blur validation, rose error borders
- `src/components/__tests__/CourseForm.test.jsx` - Updated fixture with 4 new fields, EXPO-01 and CORT-01 describe blocks (10 new tests)

## Decisions Made

- `touched` implemented as single `useState({})` object — field keys set on blur/click. Simpler than per-field useState and extensible for future fields.
- `getError` checks `!touched[field]` first — guarantees no errors visible on fresh load (D-01) without any initialization ceremony.
- Eager clearing (D-02) achieved naturally: `getError` re-evaluates on every render using live `courseData` values. After `markTouched`, if the user types a valid value, the next render shows no error.
- `aria-label` added to TOTAL HORAS and HRS / SESION inputs: enables `getByRole('spinbutton', { name: /.../ })` queries that are stable against future spinbutton additions.
- 2-col grid changed to 3-col to accommodate recoveryExtraMinutes alongside existing recovery fields per plan direction (D-07).

## Deviations from Plan

### Structural Deviation: Merge of 05-01 dependency into worktree

- **Found during:** Pre-task setup
- **Issue:** This worktree branch (`worktree-agent-aa4b0e47`) was at the same origin/main commit as before plan 05-01 ran. The 05-01 changes (useCourseData.js, INITIAL_COURSE_DATA with 4 new fields) existed only on local `main` in a parallel agent's branch.
- **Fix:** Merged local `main` into this worktree branch with `git merge main --no-commit --no-ff`, then committed the merge. This brought in useCourseData.js, useSchedule.js, scheduleEngine.js changes, and all 05-01 test additions as a prerequisite.
- **Files modified:** All 05-01 files merged in; CourseForm.jsx changes applied on top
- **Verification:** 87 tests pass after merge and both task commits
- **Committed in:** `9904eab` (merge commit, before task commits)

## Issues Encountered

The 05-01 changes from a parallel agent were on local `main` but not on this worktree's tracking branch. Resolved by merging local `main` into the worktree branch before implementing 05-02 tasks. Standard parallel execution pattern — no logic issues.

## Known Stubs

None — all 4 new fields are fully wired from the form to courseData state via onInputChange. The semester, professorName, contactEmail fields will be consumed by export functions in plan 05-03.

## Self-Check: PASSED

Files verified present:
- `src/components/CourseForm.jsx` — exists, contains semester, professorName, contactEmail, recoveryExtraMinutes, getError, markTouched, border-rose-400
- `src/components/__tests__/CourseForm.test.jsx` — exists, contains CORT-01 and EXPO-01 describe blocks

Commits verified:
- `1e7c03b` feat(05-02): add metadata fields...
- `732a985` test(05-02): extend CourseForm tests...

Test count: 87 tests passing (77 baseline + 10 new)

## Next Phase Readiness

- CourseForm now provides semester, professorName, contactEmail, recoveryExtraMinutes to courseData
- Plan 05-03 (export metadata) can read these fields directly from courseData — no additional wiring needed
- Validation errors give professors immediate feedback; schedule suppression (via useSchedule guard from 05-03) will complement this

---
*Phase: 05-validation-export-and-ux*
*Completed: 2026-03-27*
