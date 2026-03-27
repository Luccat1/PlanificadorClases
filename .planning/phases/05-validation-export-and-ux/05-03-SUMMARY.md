---
phase: 05-validation-export-and-ux
plan: "03"
subsystem: schedule-guard-and-export
tags: [tdd, cort-01, expo-02, expo-03, validation, excel-export, print-metadata]
dependency_graph:
  requires: [05-01]
  provides: [schedule-validity-guard, excel-metadata-header, print-metadata-div, dynamic-footer-copy]
  affects: [useSchedule, App]
tech_stack:
  added: []
  patterns: [isFormValid-guard-pattern, tdd-red-green, nullish-coalescing-fallback]
key_files:
  created: []
  modified:
    - src/hooks/useSchedule.js
    - src/hooks/__tests__/useSchedule.test.js
    - src/App.jsx
decisions:
  - "isFormValid internal to useSchedule module (not exported) — D-04 no prop threading"
  - "Excel metadata: two-cell format ['CRONOGRAMA DE CURSO:', courseName] not concatenated string"
  - "Print metadata div uses hidden print:block (Tailwind) placed as first child of lg:col-span-8"
  - "recoveryExtraMinutes ?? 30 fallback in footer is UI guard only — data layer ensures default"
metrics:
  duration_minutes: 10
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_modified: 3
---

# Phase 05 Plan 03: Schedule Guard, Excel Metadata, and Print Div Summary

**One-liner:** Added isFormValid guard to useSchedule preventing calculateSchedule calls on invalid inputs, updated Excel export with 5-row metadata header, added hidden print:block metadata div, and replaced hardcoded "30 min" footer copy with dynamic recoveryExtraMinutes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add isFormValid guard to useSchedule + create CORT-01 tests (TDD) | c71d8a5 | src/hooks/useSchedule.js, src/hooks/__tests__/useSchedule.test.js |
| 2 | Update App.jsx — Excel metadata rows, print metadata div, dynamic footer copy | 336c01b | src/App.jsx |

## What Was Built

### Task 1: isFormValid Guard in useSchedule (CORT-01)

Added an internal `isFormValid(courseData)` predicate to `useSchedule.js` that returns `false` when any of the following conditions are met:
- `totalHours <= 0`
- `hoursPerSession <= 0`
- `startDate` is falsy/empty
- `classDays` array is empty
- `recoveryExtraMinutes` is negative (including `null` via `?? 0`)

The guard is applied via the useMemo callback:
```js
() => isFormValid(courseData) ? calculateSchedule(courseData, holidays) : []
```

`isFormValid` is intentionally NOT exported — per D-04, schedule suppression is handled independently without prop threading. CourseForm maintains its own validation state for UX feedback; useSchedule enforces the contract at the computation boundary.

Extended `useSchedule.test.js` with CORT-01 test suite (6 tests):
- 1 passing scenario (valid inputs → non-empty array)
- 5 suppression scenarios (each invalid input case returns [])
Updated BASE_COURSE and EMPTY_COURSE fixtures to include all 13 required fields (added recoveryExtraMinutes, semester, professorName, contactEmail).

TDD flow: RED confirmed (1 test failing — recoveryExtraMinutes=-1 not caught by engine alone), GREEN achieved after adding guard.

### Task 2: App.jsx — Three Changes (EXPO-02, EXPO-03, CORT-04)

**Excel metadata header (EXPO-02/D-08):**
Replaced 4-row data array with 7-row structure:
```js
const data = [
    ['CRONOGRAMA DE CURSO:', courseData.courseName || ''],  // two-cell (not concatenated)
    ['Semestre:', courseData.semester || ''],
    ['Profesor/a:', courseData.professorName || ''],
    ['Email:', courseData.contactEmail || ''],
    ['Generado:', new Date().toLocaleDateString()],
    [],                                                       // blank separator
    ['Sesión', 'Fecha', 'Día', 'Tipo', 'Horas Crono', 'Horas Curso', 'Acumuladas', 'Notas']
];
```
Empty fields render as empty string — not "N/A" per D-08.

**Print metadata div (EXPO-03/D-09):**
Inserted `hidden print:block` div as first child of `lg:col-span-8`, before `{holidayWarning && ...}`. Uses conditional rendering to skip empty metadata fields. Correctly placed inside the schedule column (not inside `<aside no-print>`).

**Dynamic footer recovery copy (CORT-04):**
Replaced hardcoded "30 min extra" with `{courseData.recoveryExtraMinutes ?? 30}`. The `?? 30` is a UI guard only — INITIAL_COURSE_DATA already defaults to 30.

## Test Results

- Before: 71 tests passing
- After: 77 tests passing (+6 new CORT-01 tests)
- No regressions

## Verification Checks

- `grep "0\.5" src/logic/scheduleEngine.js` → empty (Plan 01 persists)
- `grep "semester" src/App.jsx` → 3 matches (Excel row 2, print div condition, print div value)
- `grep "hidden print:block" src/App.jsx` → 1 match
- `grep "30 min extra" src/App.jsx` → empty (dynamic value in place)
- `grep "isFormValid" src/hooks/useSchedule.js` → 2 matches (definition + usage)
- All 77 tests pass; `npm run test:coverage` exits 0

## Decisions Made

1. **isFormValid not exported**: Duplicate of CourseForm's getError logic is intentional — D-04 explicitly disallows prop threading. Each layer uses the same validity rules independently.
2. **Two-cell Excel row 1**: `['CRONOGRAMA DE CURSO:', courseName]` allows Excel to apply column-A bold formatting to the label; a single concatenated string would prevent that.
3. **`hidden print:block` (Tailwind) vs `.print-only` CSS class**: Tailwind utilities chosen for consistency with newer codebase patterns; both produce equivalent print behavior.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all wired to real data from courseData. recoveryExtraMinutes, semester, professorName, and contactEmail are populated from INITIAL_COURSE_DATA defaults (set in Plan 05-01) and persisted via localStorage.

## Self-Check: PASSED
