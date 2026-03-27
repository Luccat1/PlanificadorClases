# Phase 5: Validation, Export, and UX - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Add inline form validation that blocks schedule generation for invalid inputs; add semester, professor name, and contact email fields to the form; include those metadata fields in Excel and print/PDF exports; make recovery session extra minutes configurable (replacing the hardcoded +30 min constant). No new components — all changes are additions to existing files.

</domain>

<decisions>
## Implementation Decisions

### Inline Validation (CORT-01)
- **D-01:** Validation errors appear after the user has first interacted with a field (touched + blur trigger). Clean initial state — no errors visible on fresh form load.
- **D-02:** Errors clear eagerly (onChange) — as soon as a field value becomes valid the error disappears. Immediate positive feedback, no waiting for next blur.
- **D-03:** Validation state (touched fields, error messages) lives entirely in CourseForm local state. Self-contained; no new hook, no callback prop threading.
- **D-04:** Schedule suppression is handled independently: App.jsx (and/or useSchedule) performs its own validity check on courseData before computing the schedule. Duplicate logic, but no prop threading required.
- **D-05:** Reactive generation is kept — no "Generate Schedule" button introduced. When inputs are invalid, useSchedule returns an empty array and the existing empty state (dashed border, BookOpen icon) is shown. The CORT-01 "disabled button" language referred to the implicit generation trigger, not an explicit button.

### New Form Fields (EXPO-01, CORT-04)
- **D-06:** Three metadata fields (Semestre, Nombre Profesor/a, Email de Contacto) are stacked full-width after "Nombre del Curso", before "Fecha Inicio". No 2-col grid for these — email addresses are long, and full-width is consistent with Nombre del Curso above them.
- **D-07:** Recovery extra minutes field ("MIN. EXTRA RECUPERACIÓN", type="number", default 30, min 0) is placed in the existing 2-col grid alongside "Ses. Recuperación" — as a 3rd cell or on a new row in that section. Claude decides exact grid arrangement.

### Export Metadata (EXPO-02, EXPO-03)
- **D-08:** Excel export: 5 metadata rows + blank row + column headers, as specified in UI-SPEC. Empty fields render as empty string (not "N/A").
- **D-09:** Print/PDF: `.print-only hidden print:block` div inserted above the stats section. Empty metadata fields are skipped entirely (no row rendered for blank values).

### localStorage Backwards Compatibility
- **D-10:** On load, merge saved courseData with INITIAL_COURSE_DATA defaults: `{ ...INITIAL_COURSE_DATA, ...savedData }`. Missing new fields (semester, professorName, contactEmail, recoveryExtraMinutes) silently fill from defaults. Existing course configuration is preserved.

### Recovery Minutes in Engine (CORT-04)
- **D-11:** `calculateSchedule()` already receives the full courseData object. Read `courseData.recoveryExtraMinutes` directly from that object — replace the hardcoded constant. No function signature change required.
- **D-12:** `INITIAL_COURSE_DATA` gains four new fields: `semester: ''`, `professorName: ''`, `contactEmail: ''`, `recoveryExtraMinutes: 30`.

### Claude's Discretion
- Exact grid arrangement for the "Ses. Recuperación" + "Min. Extra Recuperación" fields (2-col or 3-col or separate row)
- Touch state tracking implementation inside CourseForm (useState object vs per-field useState)
- Whether validation guard in App.jsx/useSchedule uses a helper function or inline checks
- Test file structure for new validation behavior and new fields

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UI Design Contract
- `.planning/phases/05-validation-export-and-ux/05-UI-SPEC.md` — Visual and interaction contract: exact Tailwind classes for validation error states, field labels/placeholders, export row structure, print div markup, color tokens. **Primary reference for all visual implementation.**

### Requirements
- `.planning/REQUIREMENTS.md` §CORT-01 — Inline validation spec (fields, error conditions, error messages)
- `.planning/REQUIREMENTS.md` §CORT-04 — Configurable recovery minutes spec
- `.planning/REQUIREMENTS.md` §EXPO-01 — New form fields spec
- `.planning/REQUIREMENTS.md` §EXPO-02 — Excel metadata header spec
- `.planning/REQUIREMENTS.md` §EXPO-03 — Print/PDF metadata header spec

### Source Files Under Modification
- `src/components/CourseForm.jsx` — Receives new fields (D-06, D-07) and validation error rendering (D-01 through D-05)
- `src/hooks/useCourseData.js` — `INITIAL_COURSE_DATA` gains 4 new fields (D-12); lazy-init merge pattern for backwards compat (D-10)
- `src/logic/scheduleEngine.js` — Hardcoded recovery bonus replaced by `courseData.recoveryExtraMinutes` (D-11)
- `src/App.jsx` — Excel export updated (D-08); print metadata div added (D-09); validity check for schedule suppression (D-04); footer recovery card updated to show dynamic minutes

### Print CSS
- `src/styles/index.css` — Existing `.print-only` and `.no-print` rules; `print-color-adjust: exact` already set

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CourseForm.jsx` — All inputs follow the exact same Tailwind class pattern (`w-full px-4 py-3 rounded-xl border ...`). New fields copy this pattern verbatim.
- `useCourseData.js` — `handleInputChange(field, value)` already handles any field by key — new fields work with zero changes to the handler.
- `XLSX` (already imported in App.jsx) — `XLSX.utils.aoa_to_sheet` used for current export; extending with metadata rows is a data-array change only.
- `.print-only` class — Already declared in `src/styles/index.css` with `display: none` screen / `display: block` print media query.

### Established Patterns
- Tailwind-only, no component library — all new UI uses existing slate/indigo/rose tokens.
- Props-down pattern: CourseForm receives courseData + handlers as props — new fields need no architectural change.
- Reactive schedule: `useSchedule(courseData, holidays)` recomputes on every courseData change — validity guard fits naturally here.

### Integration Points
- `useCourseData.js` lazy initializer: add `{ ...INITIAL_COURSE_DATA, ...parsed }` merge to handle missing keys from old localStorage data.
- `scheduleEngine.js` recovery bonus: find the hardcoded `30` (or `RECOVERY_BONUS` constant) and replace with `courseData.recoveryExtraMinutes ?? 30` (safe fallback for any call missing the field).
- `App.jsx` export function: extend the `data` array with 5 prepended metadata rows before the existing header row.

</code_context>

<specifics>
## Specific Ideas

- UI-SPEC §Interaction States specifies the exact validation trigger: "field loses focus (onBlur) OR user attempts to interact with schedule area while form is invalid."
- UI-SPEC §Export Metadata Block gives the exact row structure (Row 1 through Row 7) for the Excel output — copy verbatim.
- UI-SPEC §Copywriting Contract lists all field labels, placeholders, and validation error messages in Spanish.
- Footer recovery card copy: "Primeras {recoverySessionsCount} sesiones con **{recoveryExtraMinutes}** min extra para avance rápido." — dynamic minutes replaces hardcoded "30".

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-validation-export-and-ux*
*Context gathered: 2026-03-27*
