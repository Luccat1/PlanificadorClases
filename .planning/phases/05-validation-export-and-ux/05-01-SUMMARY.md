---
phase: 05-validation-export-and-ux
plan: "01"
subsystem: data-model
tags: [data-model, hooks, schedule-engine, tdd, cort-04]
dependency_graph:
  requires: []
  provides: [extended-initial-course-data, configurable-recovery-bonus]
  affects: [useCourseData, scheduleEngine, calculateSchedule.test]
tech_stack:
  added: []
  patterns: [nullish-coalescing-fallback, merge-initializer-pattern]
key_files:
  created: []
  modified:
    - src/hooks/useCourseData.js
    - src/hooks/__tests__/useCourseData.test.js
    - src/logic/scheduleEngine.js
    - src/logic/__tests__/calculateSchedule.test.js
decisions:
  - "D-12 fields (semester, professorName, contactEmail, recoveryExtraMinutes) added to INITIAL_COURSE_DATA"
  - "Merge initializer pattern: { ...INITIAL_COURSE_DATA, ...JSON.parse(saved) } — defaults first, saved values override"
  - "recoveryBonusHours = (courseData.recoveryExtraMinutes ?? 30) / 60 — ?? 30 fallback ensures backward compatibility"
metrics:
  duration_minutes: 12
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_modified: 4
---

# Phase 05 Plan 01: Extend Data Model and Fix Recovery Bonus Summary

**One-liner:** Extended INITIAL_COURSE_DATA with 4 export-metadata/recovery fields and replaced the hardcoded recovery +0.5 bonus with a configurable `recoveryExtraMinutes ?? 30` pattern.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend INITIAL_COURSE_DATA and fix lazy initializer merge | 26c11d5 | src/hooks/useCourseData.js, src/hooks/__tests__/useCourseData.test.js |
| 2 | Replace hardcoded recovery bonus in scheduleEngine + extend tests | 4512f4f | src/logic/scheduleEngine.js, src/logic/__tests__/calculateSchedule.test.js |

## What Was Built

### Task 1: Extended INITIAL_COURSE_DATA (useCourseData.js)

Added four new fields to `INITIAL_COURSE_DATA` after `customExcludedDates`:
- `semester: ''` — course semester label for export metadata
- `professorName: ''` — professor name for export metadata
- `contactEmail: ''` — contact email for export metadata
- `recoveryExtraMinutes: 30` — configurable recovery session bonus (default 30 min)

Updated the lazy initializer from bare `JSON.parse(saved)` to a merge pattern:
```js
return saved
    ? { ...INITIAL_COURSE_DATA, ...JSON.parse(saved) }
    : INITIAL_COURSE_DATA;
```
This ensures old localStorage blobs missing the 4 new keys load with defaults filled in, while existing user values (courseName, startDate, etc.) are preserved.

Updated the `INITIAL` fixture in `useCourseData.test.js` to match the new 13-field shape. Added 6 new tests covering the D-12 fields and merge behavior.

### Task 2: Dynamic Recovery Bonus (scheduleEngine.js)

Replaced hardcoded `+ 0.5` bonus with:
```js
const recoveryBonusHours = (courseData.recoveryExtraMinutes ?? 30) / 60;
```
Applied to both `effRecovery` computation and `chronoHours` in `sessions.push()`. The `?? 30` fallback maintains backward compatibility with old courseData objects that don't have the field.

Added `recoveryExtraMinutes: 30` to the `base` fixture in `calculateSchedule.test.js`. Added 2 new CORT-04 tests:
- `recoveryExtraMinutes=15` produces `chronoHours = 2.25`
- Missing field produces `chronoHours = 2.5` (fallback to 30-min bonus)

## Test Results

- Before: 63 tests passing
- After: 71 tests passing (+8 new tests)
- No regressions

## Decisions Made

1. **Merge initializer ordering**: `{ ...INITIAL_COURSE_DATA, ...parsed }` — defaults first so saved values override. Reverse order would reset user data on every load.
2. **`?? 30` fallback in engine**: Nullish coalescing chosen over `|| 30` to correctly handle `recoveryExtraMinutes: 0` edge case (0-minute bonus, not fallback).
3. **`recoveryExtraMinutes` in base fixture**: Added to test fixture so all future tests have consistent, complete courseData shapes.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no placeholder data or unconnected UI components in this plan. The new fields in INITIAL_COURSE_DATA will be wired to the form UI in Plan 05-02.

## Self-Check: PASSED
