# Phase 5: Validation, Export, and UX - Research

**Researched:** 2026-03-27
**Domain:** React form validation (controlled inputs), XLSX metadata, print CSS
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Inline Validation (CORT-01)**
- D-01: Validation errors appear after the user has first interacted with a field (touched + blur trigger). Clean initial state — no errors visible on fresh form load.
- D-02: Errors clear eagerly (onChange) — as soon as a field value becomes valid the error disappears.
- D-03: Validation state (touched fields, error messages) lives entirely in CourseForm local state. No new hook, no callback prop threading.
- D-04: Schedule suppression is handled independently: App.jsx (and/or useSchedule) performs its own validity check on courseData before computing the schedule.
- D-05: Reactive generation is kept — no "Generate Schedule" button. When inputs are invalid, useSchedule returns an empty array and the existing empty state is shown.

**New Form Fields (EXPO-01, CORT-04)**
- D-06: Three metadata fields (Semestre, Nombre Profesor/a, Email de Contacto) are stacked full-width after "Nombre del Curso", before "Fecha Inicio". No 2-col grid — full-width consistent with Nombre del Curso.
- D-07: Recovery extra minutes field ("MIN. EXTRA RECUPERACIÓN", type="number", default 30, min 0) is placed in the existing 2-col grid alongside "Ses. Recuperación". Claude decides exact grid arrangement.

**Export Metadata (EXPO-02, EXPO-03)**
- D-08: Excel export: 5 metadata rows + blank row + column headers. Empty fields render as empty string (not "N/A").
- D-09: Print/PDF: `.print-only hidden print:block` div inserted above the stats section. Empty metadata fields are skipped entirely (no row rendered for blank values).

**localStorage Backwards Compatibility**
- D-10: On load, merge saved courseData with INITIAL_COURSE_DATA defaults: `{ ...INITIAL_COURSE_DATA, ...savedData }`. Missing new fields silently fill from defaults.

**Recovery Minutes in Engine (CORT-04)**
- D-11: `calculateSchedule()` reads `courseData.recoveryExtraMinutes` directly — replace the hardcoded constant. No function signature change.
- D-12: `INITIAL_COURSE_DATA` gains four new fields: `semester: ''`, `professorName: ''`, `contactEmail: ''`, `recoveryExtraMinutes: 30`.

### Claude's Discretion
- Exact grid arrangement for the "Ses. Recuperación" + "Min. Extra Recuperación" fields (2-col or 3-col or separate row)
- Touch state tracking implementation inside CourseForm (useState object vs per-field useState)
- Whether validation guard in App.jsx/useSchedule uses a helper function or inline checks
- Test file structure for new validation behavior and new fields

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CORT-01 | App validates form inputs inline (negative hours, zero session length, no class days selected, missing start date) and blocks schedule generation until inputs are valid — showing errors next to the offending field, not a global alert | Touched+blur pattern with eager onChange clearing; useSchedule validity guard; rose-400/500 border + text-sm error text per UI-SPEC |
| CORT-04 | Professor can configure extra minutes added per recovery session (replaces hardcoded +30 min constant) — input stored in courseData, default 30 | New `recoveryExtraMinutes` field in INITIAL_COURSE_DATA; scheduleEngine reads it via `courseData.recoveryExtraMinutes ?? 30`; recovery chronoHours currently hardcodes `+ 0.5` — Phase 5 changes the bonus minutes, not the chrono formula |
| EXPO-01 | CourseForm includes semester, professor name, and contact email fields | Full-width text inputs after courseName; existing handleInputChange handles any field key; no architectural change |
| EXPO-02 | Excel export includes a metadata header block at top of sheet | XLSX.utils.aoa_to_sheet data array prepended with 5 rows + blank + headers; empty fields → empty string |
| EXPO-03 | Print/PDF output includes a metadata header block above schedule table | `.print-only hidden print:block` div with conditional rendering for empty fields; print CSS already declares `.print-only` in index.css |
</phase_requirements>

---

## Summary

Phase 5 is a pure addition phase — no new components, no new hooks beyond local state inside CourseForm. All five requirements map cleanly to targeted edits in four existing files: `CourseForm.jsx`, `useCourseData.js`, `scheduleEngine.js`, and `App.jsx`.

The most nuanced part is the validation architecture (CORT-01). The locked decisions establish a two-layer system: CourseForm owns "touched" state and renders error messages; App.jsx/useSchedule independently checks validity before computing the schedule. These layers must be consistent — they use the same validity rules but serve different purposes (UX feedback vs schedule suppression).

The recovery minutes change (CORT-04) is a one-line replacement in `scheduleEngine.js` plus a new field in `INITIAL_COURSE_DATA` and a new input in `CourseForm`. The `chronoHours` formula currently hardcodes `+ 0.5` for the bonus duration display — this is a separate constant from the engine's effective-hours calculation and must be reviewed to confirm whether Phase 5 makes it dynamic too (the UI-SPEC footer copy suggests only the minutes label changes, not the chrono column formula).

The Excel and print exports (EXPO-02, EXPO-03) are data-array and JSX additions with precise row/markup specifications already given verbatim in the UI-SPEC. Implementation is mechanical copy-from-spec work.

**Primary recommendation:** Follow the UI-SPEC exactly for all markup, classes, and copy. All validation logic fits in CourseForm local state using a single `touched` object and a `getError(field)` helper. The schedule guard in useSchedule is a simple validity predicate applied before calling `calculateSchedule`.

---

## Standard Stack

### Core (already installed — no new dependencies required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | 18.x | Controlled inputs, local state, JSX rendering | Established in project |
| xlsx | installed | `XLSX.utils.aoa_to_sheet` for Excel export | Already imported in App.jsx |
| Tailwind CSS | installed | Utility classes for all new UI | Project convention — no component library |
| Vitest + RTL | installed | Unit + component tests | Already configured: jsdom, globals, setup-files |

**No new packages are needed for Phase 5.** All capabilities (controlled form state, XLSX AOA export, print CSS) exist in the current stack.

### Version verification

Confirmed by reading project source files directly — no npm registry lookup needed. All packages are already installed and in use.

---

## Architecture Patterns

### Recommended Project Structure

No new files are required. All changes are edits to:

```
src/
├── components/CourseForm.jsx          # New fields + validation error rendering
├── hooks/useCourseData.js             # INITIAL_COURSE_DATA extended + merge fix
├── logic/scheduleEngine.js            # recoveryExtraMinutes replaces hardcoded constant
├── App.jsx                            # Excel metadata rows; print div; footer copy; guard
└── components/__tests__/
    └── CourseForm.test.jsx            # Extend with validation + new field tests
```

And optionally:

```
src/logic/__tests__/calculateSchedule.test.js   # Extend with recoveryExtraMinutes tests
```

### Pattern 1: Touched + Eager-Clear Validation (CORT-01 / D-01, D-02, D-03)

**What:** A `touched` object in CourseForm local state tracks which fields have been blurred. A `getError(field)` helper returns an error string only when the field is touched AND invalid. On `onChange`, re-validation clears errors immediately; on `onBlur`, the field is marked touched.

**When to use:** Any form where initial state should be clean but errors surface after user interaction.

**Implementation sketch (Claude's discretion: single useState object):**

```jsx
// Source: D-03 decision + UI-SPEC interaction states
const [touched, setTouched] = useState({});

const markTouched = (field) =>
    setTouched(prev => ({ ...prev, [field]: true }));

function getError(field) {
    if (!touched[field]) return null;
    switch (field) {
        case 'totalHours':
            return (!courseData.totalHours || courseData.totalHours <= 0)
                ? 'Ingresa un valor mayor a 0' : null;
        case 'hoursPerSession':
            return (!courseData.hoursPerSession || courseData.hoursPerSession <= 0)
                ? 'Ingresa un valor mayor a 0' : null;
        case 'startDate':
            return !courseData.startDate
                ? 'Selecciona una fecha de inicio' : null;
        case 'classDays':
            return courseData.classDays.length === 0
                ? 'Selecciona al menos un día de clase' : null;
        case 'recoveryExtraMinutes':
            return (courseData.recoveryExtraMinutes == null || courseData.recoveryExtraMinutes < 0)
                ? 'Ingresa 0 o más minutos' : null;
        default:
            return null;
    }
}
```

**Error rendering (from UI-SPEC):**
```jsx
// Below any invalid input — Body size, rose color, mt-1
{getError('totalHours') && (
    <p className="text-sm text-rose-500 dark:text-rose-400 mt-1">
        {getError('totalHours')}
    </p>
)}
```

**Invalid border (from UI-SPEC):**
```jsx
// Conditional class on the input element itself
className={`w-full px-4 py-3 rounded-xl border ${
    getError('totalHours')
        ? 'border-rose-400 dark:border-rose-500'
        : 'border-slate-200 dark:border-slate-700'
} bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
```

**Day toggle (classDays) — error shown below the grid:**
The days grid has no single input element, so `markTouched('classDays')` is called inside `onDayToggle` or on any day button click. The error `<p>` is placed below the `.grid.grid-cols-4` element.

### Pattern 2: Schedule Validity Guard (D-04, D-05)

**What:** A predicate function `isFormValid(courseData)` that useSchedule (or App.jsx) calls to decide whether to invoke `calculateSchedule`. Returns `false` → empty array is returned without calling the engine.

**When to use:** Reactive schedule suppression when form inputs are invalid.

**Implementation sketch:**

```js
// In useSchedule.js or as a standalone helper imported by useSchedule
function isFormValid(courseData) {
    return (
        courseData.totalHours > 0 &&
        courseData.hoursPerSession > 0 &&
        courseData.startDate !== '' &&
        courseData.classDays.length > 0 &&
        (courseData.recoveryExtraMinutes ?? 0) >= 0
    );
}

// In useSchedule:
return useMemo(
    () => isFormValid(courseData) ? calculateSchedule(courseData, holidays) : [],
    [courseData, holidays]
);
```

This is the cleanest approach: the guard lives in useSchedule (already the computation boundary), avoids prop-threading, and keeps CourseForm entirely self-contained for UX feedback.

### Pattern 3: INITIAL_COURSE_DATA Extension + Merge (D-10, D-12)

**What:** Add four new keys to `INITIAL_COURSE_DATA`. Update the lazy initializer to merge saved data with defaults so old localStorage keys survive without losing new fields.

```js
// useCourseData.js
export const INITIAL_COURSE_DATA = {
    courseName: '',
    startDate: '',
    sessionsPerWeek: 2,
    classDays: ['monday', 'wednesday'],
    totalHours: 40,
    hourType: 'pedagogical',
    hoursPerSession: 2,
    recoverySessionsCount: 0,
    customExcludedDates: [],
    // Phase 5 — new fields (D-12)
    semester: '',
    professorName: '',
    contactEmail: '',
    recoveryExtraMinutes: 30,
};

// Lazy initializer — merge pattern (D-10)
const saved = localStorage.getItem('courseData');
return saved
    ? { ...INITIAL_COURSE_DATA, ...JSON.parse(saved) }
    : INITIAL_COURSE_DATA;
```

The spread order `{ ...INITIAL_COURSE_DATA, ...parsed }` ensures new fields default correctly when absent from old localStorage data, while existing user values are preserved.

### Pattern 4: Excel AOA Metadata Header (D-08 / EXPO-02)

**What:** Prepend metadata rows to the existing `data` array in `exportToExcel`. Exact row structure from UI-SPEC:

```js
// Source: UI-SPEC §Export Metadata Block
const data = [
    ['CRONOGRAMA DE CURSO:', courseData.courseName || ''],
    ['Semestre:', courseData.semester || ''],
    ['Profesor/a:', courseData.professorName || ''],
    ['Email:', courseData.contactEmail || ''],
    ['Generado:', new Date().toLocaleDateString()],
    [],  // blank separator row
    ['Sesión', 'Fecha', 'Día', 'Tipo', 'Horas Crono', 'Horas Curso', 'Acumuladas', 'Notas'],
    // ...session rows appended below
];
```

Empty fields render as empty string — do not write "N/A" or "—".

### Pattern 5: Print Metadata Div (D-09 / EXPO-03)

**What:** A `hidden print:block` div placed inside the `lg:col-span-8` container, before the stats section. Conditional rendering skips empty fields.

```jsx
// Source: UI-SPEC §Export Metadata Block — Print/PDF
// Placed ABOVE the stats section (before {schedule.length > 0 ? ...})
<div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-300">
    <h1 className="text-2xl font-bold">
        {courseData.courseName || 'Cronograma de Clases'}
    </h1>
    <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-2 text-sm">
        {courseData.semester && (
            <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Semestre</span>
                <p>{courseData.semester}</p>
            </div>
        )}
        {courseData.professorName && (
            <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Profesor/a</span>
                <p>{courseData.professorName}</p>
            </div>
        )}
        {courseData.contactEmail && (
            <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</span>
                <p>{courseData.contactEmail}</p>
            </div>
        )}
        <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Generado</span>
            <p>{new Date().toLocaleDateString()}</p>
        </div>
    </div>
</div>
```

Note: The UI-SPEC uses `hidden print:block` (Tailwind print variant) not the `print-only` CSS class. The `.print-only` class in `index.css` uses `!important` and is equivalent, but using Tailwind utilities is more consistent with the current codebase pattern. Either works — the print CSS already sets `display: block !important` for `.print-only`. Use `hidden print:block` (pure Tailwind) to stay consistent with newer code.

### Pattern 6: Recovery Extra Minutes in Engine (CORT-04 / D-11)

**What:** The hardcoded recovery bonus in `scheduleEngine.js` is currently `+ 0.5` for `chronoHours`. This is the display column value (not minutes). The engine uses `getEffectiveHours(courseData.hoursPerSession + 0.5, ...)` — the `+ 0.5` represents the 30-minute bonus in hour units.

**Critical finding:** The `recoveryExtraMinutes` field (default 30) must be converted to hours at the call site:

```js
// scheduleEngine.js — replace hardcoded + 0.5 with dynamic value
const recoveryBonusHours = (courseData.recoveryExtraMinutes ?? 30) / 60;
const effRecovery = getEffectiveHours(
    courseData.hoursPerSession + recoveryBonusHours,
    courseData.hourType
);
// ...
chronoHours: isRecovery
    ? courseData.hoursPerSession + recoveryBonusHours
    : courseData.hoursPerSession,
```

This means the `chronoHours` column will also be dynamic — `hoursPerSession + recoveryExtraMinutes/60`. The `?? 30` fallback covers old courseData objects without the field.

### Anti-Patterns to Avoid

- **Per-field useState for touched:** `useState` for each field creates 5 separate state variables. A single `touched` object is cleaner and more extensible.
- **Setting touched in onChange:** This defeats the "clean initial state" requirement (D-01). Only mark touched in onBlur (or on day-button click for classDays).
- **Running validation in onBlur AND eagerly clearing in onBlur:** Error clearing belongs in onChange (D-02). onBlur only marks the field touched; onChange re-evaluates getError which returns null when valid.
- **Showing `.print-only` div in screen view:** The div must use `hidden` (display: none) in screen mode. If using the `.print-only` CSS class, do not add `block` inline — the CSS handles it. If using Tailwind `hidden print:block`, ensure there is no conflicting `block` class applied unconditionally.
- **"N/A" for empty export fields:** D-08 explicitly says empty string only.
- **Forgetting the merge pattern:** If the lazy initializer returns `JSON.parse(saved)` without merging INITIAL_COURSE_DATA, old users lose the new fields and the form renders with `undefined` inputs.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excel metadata rows | Custom binary writer | `XLSX.utils.aoa_to_sheet` (already imported) | AOA (array-of-arrays) natively supports prepending metadata rows; the existing export already uses this API |
| Print-only content | JavaScript-driven show/hide | CSS `@media print` + `hidden print:block` | Already established in index.css; no JS needed, no flash of content |
| Validation library | Custom schema validator | Plain `switch`/`if` in `getError()` | 5 fields with simple numeric/non-empty rules — a library adds zero value and contradicts the "no new packages" constraint |
| Touch state | External form library (react-hook-form) | Local `useState` object | D-03 is locked: validation state lives in CourseForm local state only |

**Key insight:** This phase has exactly 5 validated fields with straightforward rules. Any abstraction beyond a `getError(field)` helper adds indirection without benefit.

---

## Common Pitfalls

### Pitfall 1: recoveryExtraMinutes Unit Mismatch
**What goes wrong:** The scheduleEngine stores the bonus as hours (`+ 0.5`), but the new field is stored as minutes (`30`). If the field is used directly without conversion, a 30-minute bonus becomes 30 hours.
**Why it happens:** The field name says "minutes", the engine arithmetic is in hours.
**How to avoid:** Always divide by 60 at the call site: `(courseData.recoveryExtraMinutes ?? 30) / 60`.
**Warning signs:** Recovery sessions showing `chronoHours` equal to `hoursPerSession + 30` instead of `hoursPerSession + 0.5`.

### Pitfall 2: Test Fixture Missing New Fields
**What goes wrong:** Existing `calculateSchedule.test.js` fixtures use a `base` object with 9 fields. Adding `recoveryExtraMinutes` to the engine means tests that pass a `base` without it will rely on the `?? 30` fallback — which is correct behavior, but new tests for the dynamic bonus must add the field explicitly.
**Why it happens:** The project convention (noted in STATE.md) requires "All courseData test fixtures include all required fields to prevent unexpected engine behavior."
**How to avoid:** Add `recoveryExtraMinutes: 30` to the `base` fixture in `calculateSchedule.test.js`. New tests that verify dynamic minutes use a custom fixture.

### Pitfall 3: classDays Validation Trigger
**What goes wrong:** Day toggle buttons have no `onBlur` event (they are `<button>` elements, not `<input>`). The touched trigger pattern breaks for classDays.
**Why it happens:** The touched pattern is designed for inputs with blur events. Buttons use click, not blur.
**How to avoid:** Mark classDays as touched inside the `onDayToggle` call (the first click on any day button acts as the interaction trigger). Alternatively, mark touched whenever the user clicks any day button whether adding or removing.

### Pitfall 4: localStorage Merge Order
**What goes wrong:** `{ ...parsed, ...INITIAL_COURSE_DATA }` overwrites saved user values with defaults — every page load resets the form.
**Why it happens:** Wrong spread order.
**How to avoid:** The merge must be `{ ...INITIAL_COURSE_DATA, ...parsed }` — defaults first, saved values override.

### Pitfall 5: Print Div Placement
**What goes wrong:** Inserting the print metadata div inside a `no-print` parent causes it to be hidden even during print (the parent's `display: none !important` in print CSS overrides the child's `display: block`).
**Why it happens:** The `lg:col-span-8` container is NOT `no-print` — only the `<aside>` (sidebar) and `<header>` carry `no-print`. The schedule column is print-visible.
**How to avoid:** Verify the print metadata div is placed inside the `lg:col-span-8` div, not inside any element with `no-print` class. The existing print CSS shows: header, aside, and footer have `no-print`; the main schedule column does not.

### Pitfall 6: spinbutton Index Regression in Tests
**What goes wrong:** `CourseForm.test.jsx` currently locates the `totalHours` input as `screen.getAllByRole('spinbutton')[0]` (index 0 = first number input). Adding `recoveryExtraMinutes` as a new `type="number"` input changes the spinbutton DOM order and breaks index-based queries.
**Why it happens:** Tests use positional `getAllByRole` indexing, which is fragile to form field additions.
**How to avoid:** Update existing tests to query by a more stable selector (e.g., by label text or placeholder), or add `aria-label` attributes to number inputs. At minimum, document the new spinbutton order in the test file comment.

---

## Code Examples

### New Field Block (full-width pattern)
```jsx
// Source: UI-SPEC §New Form Fields + existing CourseForm.jsx patterns
<div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        SEMESTRE
    </label>
    <input
        type="text"
        value={courseData.semester}
        onChange={(e) => onInputChange('semester', e.target.value)}
        placeholder="Ej. 2do Semestre 2026"
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
    />
</div>
```

Note: UI-SPEC specifies label as `text-[10px]` (Label size), not `text-sm`. The existing labels in CourseForm.jsx use `text-sm` but UI-SPEC corrects this. Use `text-[10px]` for new fields to match the design contract; existing fields can be updated too if desired.

### Recovery Extra Minutes Field (in 2-col grid with Ses. Recuperación)
```jsx
// Source: D-07 + UI-SPEC §New Form Fields
<div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Ses. Recuperación
        </label>
        <input
            type="number"
            value={courseData.recoverySessionsCount}
            onChange={(e) => onInputChange('recoverySessionsCount', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
    </div>
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            MIN. EXTRA RECUPERACIÓN
        </label>
        <input
            type="number"
            min="0"
            value={courseData.recoveryExtraMinutes}
            onChange={(e) => onInputChange('recoveryExtraMinutes', parseInt(e.target.value) ?? 30)}
            onBlur={() => markTouched('recoveryExtraMinutes')}
            className={`w-full px-4 py-3 rounded-xl border ${
                getError('recoveryExtraMinutes')
                    ? 'border-rose-400 dark:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
            } bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
        />
        {getError('recoveryExtraMinutes') && (
            <p className="text-sm text-rose-500 dark:text-rose-400 mt-1">
                {getError('recoveryExtraMinutes')}
            </p>
        )}
    </div>
</div>
```

### Footer Recovery Card (dynamic minutes)
```jsx
// Source: UI-SPEC §Copywriting Contract
<p className="text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed">
    Primeras <b>{courseData.recoverySessionsCount}</b> sesiones con{' '}
    <b>{courseData.recoveryExtraMinutes ?? 30}</b> min extra para avance rápido.
</p>
```

### isFormValid helper
```js
// Source: D-04 + UI-SPEC §Interaction States
function isFormValid(courseData) {
    return (
        courseData.totalHours > 0 &&
        courseData.hoursPerSession > 0 &&
        Boolean(courseData.startDate) &&
        courseData.classDays.length > 0 &&
        (courseData.recoveryExtraMinutes ?? 0) >= 0
    );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `+ 0.5` recovery bonus in scheduleEngine | `(recoveryExtraMinutes ?? 30) / 60` | Phase 5 | Makes recovery bonus configurable per professor |
| No validation — invalid inputs silently produce empty schedule | Touched+blur with eager-clear errors + schedule suppression | Phase 5 | UX feedback; blocked generation until form valid |
| Excel export: 2 header rows (title + date) | 5 metadata rows + blank + column header | Phase 5 | Professor identity and semester visible in exported file |
| No print metadata | Print-only div with course/professor metadata | Phase 5 | Printed schedule is self-contained, attributable |

---

## Open Questions

1. **label size discrepancy**
   - What we know: Existing labels in CourseForm.jsx use `text-sm font-bold`, but the UI-SPEC typography section specifies Label as `text-[10px] font-bold uppercase tracking-wider`.
   - What's unclear: Should new fields use `text-[10px]` (correct per spec) or `text-sm` (consistent with existing fields)?
   - Recommendation: Use `text-[10px]` for new fields as specified in UI-SPEC. Do not retroactively change existing fields in this phase (out of scope). The visual difference is minor and the spec is explicit.

2. **parseInt vs Number for recoveryExtraMinutes onChange**
   - What we know: The field is `type="number"` with `min="0"`. `parseInt` returns `NaN` for an empty string; `parseInt(e.target.value) ?? 30` would use `30` as fallback, but `NaN ?? 30` evaluates to `NaN` (nullish coalescing only catches `null`/`undefined`, not `NaN`).
   - What's unclear: What value should be stored when the user clears the field?
   - Recommendation: Use `parseInt(e.target.value) || 0` (same pattern as existing `recoverySessionsCount` and `totalHours`). The validation error will catch the `0` case and show "Ingresa 0 o más minutos" only if the value is negative.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all required libraries already installed; no new packages needed for Phase 5).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + React Testing Library |
| Config file | `vite.config.js` → `test` block |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORT-01 | Validation error shown for totalHours <= 0 after blur | component | `npm test -- --run --reporter=verbose` | ✅ extend CourseForm.test.jsx |
| CORT-01 | Validation error shown for hoursPerSession <= 0 after blur | component | same | ✅ extend CourseForm.test.jsx |
| CORT-01 | Validation error shown for empty startDate after blur | component | same | ✅ extend CourseForm.test.jsx |
| CORT-01 | Validation error shown for empty classDays after day toggle | component | same | ✅ extend CourseForm.test.jsx |
| CORT-01 | Error clears eagerly when field becomes valid (onChange) | component | same | ✅ extend CourseForm.test.jsx |
| CORT-01 | No errors on fresh form load (clean initial state) | component | same | ✅ extend CourseForm.test.jsx |
| CORT-01 | useSchedule returns [] when form invalid | unit | same | ❌ new test in useSchedule.test.js (Wave 0 gap) |
| CORT-04 | recoveryExtraMinutes=15 produces recovery session with chronoHours = hoursPerSession + 0.25 | unit | same | ✅ extend calculateSchedule.test.js |
| CORT-04 | recoveryExtraMinutes missing → defaults to 30 min bonus | unit | same | ✅ extend calculateSchedule.test.js |
| EXPO-01 | semester, professorName, contactEmail inputs render | component | same | ✅ extend CourseForm.test.jsx |
| EXPO-01 | New fields propagate via onInputChange | component | same | ✅ extend CourseForm.test.jsx |
| EXPO-02 | exportToExcel data array row 1 = ['CRONOGRAMA DE CURSO:', courseName] | unit | manual-only (triggers download) | — manual verification |
| EXPO-03 | Print metadata div present in DOM with correct class | component | `npm test -- --run` | ✅ extend App or snapshot test |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/__tests__/useSchedule.test.js` — covers CORT-01 schedule suppression when isFormValid returns false. This file does not currently exist; it must be created in Wave 0 before implementation tasks reference it.

*(All other test coverage extends existing files. No new test infrastructure needed beyond the single missing test file.)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/components/CourseForm.jsx` — existing field patterns, class names, event handling
- Direct codebase read: `src/hooks/useCourseData.js` — INITIAL_COURSE_DATA shape, lazy initializer pattern, handleInputChange
- Direct codebase read: `src/logic/scheduleEngine.js` — recovery bonus calculation at line 68 (`+ 0.5`) and line 120–121 (`+ 0.5` in chronoHours)
- Direct codebase read: `src/App.jsx` — exportToExcel function, print CSS usage, footer recovery card
- Direct codebase read: `src/styles/index.css` — `.print-only` and `.no-print` declarations
- Direct codebase read: `05-CONTEXT.md` — all locked decisions D-01 through D-12
- Direct codebase read: `05-UI-SPEC.md` — exact Tailwind classes, row structure, copy
- Direct codebase read: `src/components/__tests__/CourseForm.test.jsx` — test patterns, Wrapper component, spinbutton indexing
- Direct codebase read: `src/logic/__tests__/calculateSchedule.test.js` — base fixture, test convention

### Secondary (MEDIUM confidence)
- React controlled input documentation pattern (onBlur/onChange touched pattern) — well-established React idiom, no external source needed for this pattern

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed; confirmed by package.json read
- Architecture: HIGH — all patterns derived directly from locked decisions in CONTEXT.md and UI-SPEC
- Pitfalls: HIGH — derived from reading actual source code (hardcoded `+ 0.5`, spinbutton index fragility, merge order)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable stack, no external services)
