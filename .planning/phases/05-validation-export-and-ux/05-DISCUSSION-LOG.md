# Phase 5: Validation, Export, and UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 05-validation-export-and-ux
**Areas discussed:** Validation error clearing, Metadata fields layout, Reactive vs button-driven schedule, Validation architecture, localStorage migration, Recovery minutes in scheduleEngine

---

## Validation Error Clearing

| Option | Description | Selected |
|--------|-------------|----------|
| Eager — while typing | Error clears as soon as field value becomes valid (onChange). Immediate positive feedback. | ✓ |
| Lazy — on next blur | Error only clears after user moves focus away. More conservative. | |
| You decide | Claude picks simpler approach. | |

**User's choice:** Eager — while typing
**Notes:** Standard React pattern, most responsive feel.

---

## Validation First-Appearance Timing

| Option | Description | Selected |
|--------|-------------|----------|
| After first interaction | Errors appear only after user has touched a field (blur trigger). Clean initial state. | ✓ |
| Immediately on form load | Errors appear right away for pre-filled invalid state. | |

**User's choice:** After first interaction
**Notes:** No errors visible on fresh form load.

---

## Metadata Fields Layout

| Option | Description | Selected |
|--------|-------------|----------|
| All full-width, stacked | Each field on its own row. Consistent with Nombre del Curso. Clean for long emails. | ✓ |
| 2-col grid: Semestre + Profesor/a, Email full-width | Saves vertical space. | |
| You decide | Claude picks sensible layout. | |

**User's choice:** All full-width, stacked

---

## Reactive vs Button-driven Schedule

| Option | Description | Selected |
|--------|-------------|----------|
| Keep reactive | Schedule disappears when inputs invalid. No button. Matches UI-SPEC. | ✓ |
| Add a Generate button | Explicit "Generar Cronograma" button, disabled while invalid. | |

**User's choice:** Keep reactive
**Notes:** CORT-01's "disabled button" language referred to the implicit generation trigger.

---

## Validation Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| CourseForm local state | Validation state inside CourseForm. Simple, self-contained. | ✓ |
| Separate useValidation hook | New hook consumed by both CourseForm and App.jsx. | |
| You decide | Claude picks cleanest architecture. | |

**User's choice:** CourseForm local state

---

## Schedule Suppression Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| App.jsx validates independently | App.jsx/useSchedule does its own validity check. No prop threading. | ✓ |
| CourseForm passes isValid up | onValidationChange(isValid) callback. Single source of truth. | |

**User's choice:** App.jsx validates independently

---

## localStorage Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Merge with INITIAL_COURSE_DATA defaults | { ...INITIAL_COURSE_DATA, ...savedData }. Missing fields fill from defaults silently. | ✓ |
| Discard old data if missing fields | Treat as fresh state if any required field missing. | |
| You decide | Claude handles safest approach. | |

**User's choice:** Merge with INITIAL_COURSE_DATA defaults
**Notes:** Preserves existing course configuration. Silent, no UX disruption.

---

## Recovery Minutes in scheduleEngine

| Option | Description | Selected |
|--------|-------------|----------|
| Add as param to calculateSchedule() | Read courseData.recoveryExtraMinutes from existing courseData object. No signature change. | ✓ |
| Separate explicit parameter | Add as top-level param. More explicit but changes signature. | |
| You decide | Claude decides cleanest approach. | |

**User's choice:** Read from courseData object directly

---

## Claude's Discretion

- Exact grid arrangement for Ses. Recuperación + Min. Extra Recuperación fields
- Touch state tracking implementation inside CourseForm
- Validation guard implementation in App.jsx/useSchedule
- Test file structure for new validation and fields

## Deferred Ideas

None — discussion stayed within phase scope.
