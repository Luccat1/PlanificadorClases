---
phase: 05-validation-export-and-ux
verified: 2026-03-27T18:10:00Z
status: passed
score: 21/21 must-haves verified
re_verification: false
---

# Phase 5: Validation, Export, and UX Verification Report

**Phase Goal:** Invalid inputs are blocked at the form level with inline error messages; exports carry a professor-facing metadata header; recovery session extra minutes are configurable
**Verified:** 2026-03-27T18:10:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | INITIAL_COURSE_DATA contains semester, professorName, contactEmail (all '') and recoveryExtraMinutes (30) | VERIFIED | `useCourseData.js` lines 13–16: all 4 fields present with correct defaults |
| 2  | Old localStorage data missing new keys loads correctly — new fields fill from defaults without wiping existing values | VERIFIED | Lazy initializer uses `{ ...INITIAL_COURSE_DATA, ...JSON.parse(saved) }` spread merge (line 40) |
| 3  | Recovery session with recoveryExtraMinutes=15 produces chronoHours = hoursPerSession + 0.25 | VERIFIED | `calculateSchedule.test.js` line 164 CORT-04 test; `scheduleEngine.js` line 68 formula passes test suite |
| 4  | Recovery session with recoveryExtraMinutes=60 produces chronoHours = hoursPerSession + 1.0 | VERIFIED | `recoveryBonusHours = (courseData.recoveryExtraMinutes ?? 30) / 60` formula at line 68 of scheduleEngine.js |
| 5  | Fallback (courseData missing recoveryExtraMinutes) still produces the 30-minute bonus (+0.5 hours) | VERIFIED | `calculateSchedule.test.js` line 177 tests the `?? 30` fallback path; passes in test suite |
| 6  | CourseForm renders fields for Semestre, Nombre Profesor/a, and Email de Contacto (full-width, after Nombre del Curso) | VERIFIED | `CourseForm.jsx` lines 80–119: three full-width inputs in declared order |
| 7  | CourseForm renders a MIN. EXTRA RECUPERACION number input in 3-col grid alongside Ses. Recuperación | VERIFIED | `CourseForm.jsx` lines 184–239: `grid grid-cols-3 gap-4` with recoveryExtraMinutes as third cell |
| 8  | No validation errors visible on a fresh form load (clean initial state) | VERIFIED | `getError` returns null when `!touched[field]` (line 30); CORT-01 test confirms clean load |
| 9  | After blurring totalHours with value 0, the error 'Ingresa un valor mayor a 0' appears | VERIFIED | `CourseForm.jsx` lines 149–160 onBlur/error pattern; CORT-01 test at line 149 of test file passes |
| 10 | Typing a valid positive value into totalHours after the error clears the error (eager clear) | VERIFIED | `getError` re-evaluates live courseData on every render — no touched reset needed; test passes |
| 11 | After clicking last selected day button, 'Selecciona al menos un día de clase' appears | VERIFIED | `CourseForm.jsx` lines 248, 258–262; CORT-01 test passes |
| 12 | After blurring hoursPerSession with value 0, the error 'Ingresa un valor mayor a 0' appears | VERIFIED | `CourseForm.jsx` lines 193–204; CORT-01 test passes |
| 13 | After blurring startDate when empty, the error 'Selecciona una fecha de inicio' appears | VERIFIED | `CourseForm.jsx` lines 129–140; getError switch case confirmed |
| 14 | After blurring recoveryExtraMinutes with value -1, the error 'Ingresa 0 o más minutos' appears | VERIFIED | `CourseForm.jsx` lines 226–237; getError case at line 44 |
| 15 | Invalid fields show border-rose-400 dark:border-rose-500 | VERIFIED | Conditional border class present on all 5 validated inputs |
| 16 | useSchedule returns [] when courseData has any invalid field (totalHours<=0, hoursPerSession<=0, startDate='', classDays=[], recoveryExtraMinutes<0) | VERIFIED | `useSchedule.js` lines 10–18 isFormValid guard; all 6 CORT-01 useSchedule tests pass |
| 17 | The exported Excel file's data array begins with ['CRONOGRAMA DE CURSO:', courseName] as row 1 | VERIFIED | `App.jsx` line 74: two-cell format confirmed |
| 18 | The Excel data array row 7 (index 6) is the column header row with 'Sesión' as first element | VERIFIED | `App.jsx` lines 74–81: 5 metadata rows + blank + headers = 7 rows total |
| 19 | The print metadata div has class 'hidden print:block' and is placed inside the lg:col-span-8 container | VERIFIED | `App.jsx` line 197: `hidden print:block` div is first child of lg:col-span-8 div (line 195) |
| 20 | The footer recovery card shows dynamic recoveryExtraMinutes, not hardcoded '30' | VERIFIED | `App.jsx` line 272: `{courseData.recoveryExtraMinutes ?? 30}` — no hardcoded string "30 min" |
| 21 | No hardcoded +0.5 bonus remains in scheduleEngine.js | VERIFIED | `grep "0\.5" src/logic/scheduleEngine.js` returns empty |

**Score:** 21/21 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/useCourseData.js` | Extended INITIAL_COURSE_DATA with 4 new fields; merge pattern in lazy initializer | VERIFIED | Lines 3–17 (fields), line 40 (merge) |
| `src/logic/scheduleEngine.js` | Dynamic recovery bonus replacing hardcoded +0.5 | VERIFIED | Line 68: `recoveryBonusHours = (courseData.recoveryExtraMinutes ?? 30) / 60` |
| `src/logic/__tests__/calculateSchedule.test.js` | Tests for configurable recovery minutes and ?? 30 fallback | VERIFIED | Lines 161–186: CORT-04 describe block with 2 tests |
| `src/components/CourseForm.jsx` | 4 new fields + validation error rendering | VERIFIED | Full validation wiring confirmed |
| `src/components/__tests__/CourseForm.test.jsx` | EXPO-01 and CORT-01 describe blocks | VERIFIED | Lines 111 and 141 |
| `src/hooks/useSchedule.js` | isFormValid guard preventing calculateSchedule on invalid data | VERIFIED | Lines 10–18: isFormValid function; line 31: ternary guard |
| `src/hooks/__tests__/useSchedule.test.js` | Unit tests for schedule suppression (6 tests) | VERIFIED | Lines 112–143: CORT-01 describe block |
| `src/App.jsx` | Excel metadata header rows; print metadata div; dynamic footer recovery copy | VERIFIED | Lines 73–81 (Excel), 196–225 (print div), 271–272 (footer) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scheduleEngine.js` | `courseData.recoveryExtraMinutes` | `(courseData.recoveryExtraMinutes ?? 30) / 60` | WIRED | Line 68 — formula reads field, ?? 30 fallback present |
| `useCourseData.js` | `INITIAL_COURSE_DATA` | `{ ...INITIAL_COURSE_DATA, ...JSON.parse(saved) }` | WIRED | Line 40 — merge pattern with defaults first |
| `CourseForm.jsx` | `touched` state | `const [touched, setTouched] = useState({})` | WIRED | Lines 24–27 |
| `CourseForm.jsx` | `getError` helper | `function getError(field)` | WIRED | Lines 29–50 |
| `CourseForm.jsx` | `markTouched` | `onBlur={() => markTouched('fieldName')}` | WIRED | Present on startDate, totalHours, hoursPerSession, recoveryExtraMinutes; onClick on classDays buttons |
| `useSchedule.js` | `calculateSchedule` | `isFormValid(courseData) ? calculateSchedule(...) : []` | WIRED | Line 31 |
| `App.jsx` | `exportToExcel` | 7-row data array with metadata | WIRED | Lines 73–81 |
| `App.jsx` | print metadata div | `hidden print:block` first child of `lg:col-span-8` | WIRED | Lines 195–225 |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `CourseForm.jsx` (semester field) | `courseData.semester` | `useCourseData.js` INITIAL_COURSE_DATA + localStorage | Yes — real persisted user input | FLOWING |
| `App.jsx` (Excel export) | `courseData.semester/professorName/contactEmail` | Same courseData state from `useCourseData.js` | Yes — reads live courseData state | FLOWING |
| `App.jsx` (print metadata div) | `courseData.semester/professorName/contactEmail` | Same courseData state | Yes — conditional render on non-empty values | FLOWING |
| `App.jsx` (footer recovery copy) | `courseData.recoveryExtraMinutes` | courseData state, default 30 from INITIAL_COURSE_DATA | Yes — live state value | FLOWING |
| `useSchedule.js` | `schedule` (return value) | `calculateSchedule` called only when `isFormValid` = true | Yes — real engine computation | FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 87 tests pass (no regressions) | `npm test -- --run` | 87 passed, 8 test files | PASS |
| CORT-04 tests in calculateSchedule.test.js | `grep "CORT-04" calculateSchedule.test.js` | describe block found at line 163 | PASS |
| CORT-01 tests in useSchedule.test.js | `grep "CORT-01" useSchedule.test.js` | describe block found at line 112 | PASS |
| No hardcoded 0.5 in engine | `grep "0\.5" scheduleEngine.js` | Empty — fully replaced | PASS |
| Print div inside lg:col-span-8 (not in aside) | File lines 195–225 | `hidden print:block` div at line 197, inside col-span-8 at 195 | PASS |
| Excel row 1 is two-cell (not concatenated string) | File line 74 | `['CRONOGRAMA DE CURSO:', courseData.courseName || '']` | PASS |
| Dynamic footer copy | File line 272 | `{courseData.recoveryExtraMinutes ?? 30}` present | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CORT-01 | 05-02, 05-03 | Inline form validation blocks schedule generation; errors next to offending field | SATISFIED | `CourseForm.jsx` touched+blur+getError pattern; `useSchedule.js` isFormValid guard; 16 tests in CourseForm.test.jsx + 6 in useSchedule.test.js |
| CORT-04 | 05-01 | Configurable extra minutes per recovery session; input in courseData; default 30 | SATISFIED | INITIAL_COURSE_DATA `recoveryExtraMinutes: 30`; scheduleEngine dynamic formula; CORT-04 describe block in calculateSchedule.test.js |
| EXPO-01 | 05-02 | CourseForm includes fields for semester, professor name, and contact email | SATISFIED | Three full-width inputs in CourseForm.jsx (lines 80–119); EXPO-01 describe block in test (5 tests) |
| EXPO-02 | 05-03 | Excel export metadata header showing course name, semester, professor, email | SATISFIED | App.jsx lines 73–81: 7-row data array including all 4 metadata fields |
| EXPO-03 | 05-03 | Print/PDF output includes metadata header above schedule table | SATISFIED | App.jsx lines 196–225: `hidden print:block` div as first child of schedule column with semester, professorName, contactEmail, generado fields |

**All 5 required requirement IDs accounted for. No orphaned requirements found for Phase 5 in REQUIREMENTS.md.**

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | None found |

No TODO/FIXME comments, no placeholder returns, no hardcoded empty data stubs, no disconnected handlers found in any phase 5 modified files. The `?? 30` fallback in `useSchedule.js` and `App.jsx` is a legitimate UI/data guard (not a stub) — the data layer guarantees the value is 30 from INITIAL_COURSE_DATA; the fallback handles any edge case where the field is undefined in courseData.

---

## Human Verification Required

### 1. Inline error visual styling

**Test:** Open the app in a browser. Fill the Total Horas field with 0, then click outside. Then clear the field and fill with a valid number.
**Expected:** A rose-colored border appears on the input and the error text "Ingresa un valor mayor a 0" appears below it. Typing a valid number removes both immediately.
**Why human:** Tailwind conditional class application and visual rendering cannot be confirmed programmatically.

### 2. Excel export metadata header

**Test:** Fill in Semestre, Nombre Profesor/a, and Email de Contacto in the form with a valid schedule configured. Click the Excel export button. Open the downloaded .xlsx file.
**Expected:** Rows 1–5 show: "CRONOGRAMA DE CURSO: [name]", "Semestre: [value]", "Profesor/a: [value]", "Email: [value]", "Generado: [date]". Row 6 is blank. Row 7 is the column header row.
**Why human:** Excel file generation and rendering requires opening a file in a spreadsheet application.

### 3. Print metadata div visibility

**Test:** Open the app with a valid schedule. Use the browser print preview (Ctrl+P or Cmd+P).
**Expected:** A metadata header block appears at the top of the print preview showing course name and any filled-in metadata fields, followed by the schedule table. This block is not visible in the regular browser view.
**Why human:** Print CSS rendering (`hidden print:block`) requires actual print or print-preview mode to verify.

---

## Gaps Summary

No gaps found. All 21 must-have truths are verified. All 8 required artifacts exist, are substantive, and are wired. All 5 requirement IDs (CORT-01, CORT-04, EXPO-01, EXPO-02, EXPO-03) are satisfied with concrete implementation evidence. The full test suite of 87 tests passes with zero regressions.

---

_Verified: 2026-03-27T18:10:00Z_
_Verifier: Claude (gsd-verifier)_
