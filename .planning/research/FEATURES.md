# Feature Research

**Domain:** Academic course schedule builder — Chilean university context, client-side React SPA
**Researched:** 2026-03-26
**Confidence:** MEDIUM (web search unavailable; findings derived from codebase analysis and domain knowledge)

---

## Context: What Already Exists

The app already ships: course config form, auto session generation, holiday/exclusion skipping, Excel/PDF export, localStorage persistence, dark mode, list/calendar views, mid-course marker, recovery sessions (+30 min fixed bonus). This research covers the **next milestone** features only — not the existing baseline.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features professors assume work correctly. Missing or broken = tool loses trust immediately.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Input validation with clear error messages | Entering `hoursPerSession: 0` or `totalHours: -5` silently produces a broken schedule; professors discover the problem when they try to print. Any form tool must guard its inputs. | LOW | Guard: `hoursPerSession > 0`, `totalHours > 0`, `classDays.length >= 1`, `startDate` set. Show inline error near offending field, not a global alert. Block schedule generation until resolved. |
| Dark mode preference persists across page loads | OS-level dark mode is the norm for many users. Losing the theme on every refresh is jarring and signals an unpolished tool. `prefers-color-scheme` is the standard first-visit default. | LOW | Read `localStorage('darkMode')` on init; fall back to `window.matchMedia('prefers-color-scheme: dark')`. Single `useEffect` write on toggle. |
| View mode persists across page loads | User picks List or Calendar, refreshes, expects to land in the same view. Forgetting view is a small friction that accumulates. | LOW | Same pattern as dark mode. `localStorage('viewMode')`. Default: `'list'`. |
| Holiday data that does not expire | The current `CHILEAN_HOLIDAYS_2026` constant breaks silently for any course starting in 2027+. Professors run courses across calendar years. A tool that generates a wrong schedule for next year's course is worse than useless — it is actively misleading. | MEDIUM | Replace hardcoded constant with nager.date API fetch per year. Cache fetched years in `localStorage` keyed by year (`holidays_CL_2027`). See section below on API failure handling. |
| Export includes course metadata | Professors hand schedules to students and submit them to administrative offices. An exported file that says only "Sesión 1… Sesión 18" with no course name, professor name, or semester is incomplete as a formal document. | LOW | Add 3–4 rows at the top of the Excel sheet and a header block before the table in print/PDF: course name, semester, professor name, contact email. All already exist as state fields (courseName) or need 3 new fields (semester, professor, email). |
| sessionsPerWeek hard cap is honored | `sessionsPerWeek` exists in the form state but the algorithm ignores it. A user who sets "max 2 sessions/week" and selects Mon/Wed/Fri expects the algorithm to cap at 2, not schedule all 3 days. Ignoring a visible field destroys trust in the form. | MEDIUM | In `calculateSchedule`, track sessions scheduled in the current ISO week. If `weekCount >= sessionsPerWeek`, skip remaining qualifying days that week. Reset counter on week boundary. Edge case: if `classDays.length < sessionsPerWeek`, the cap is never binding — that is correct behavior. |

### Differentiators (Competitive Advantage)

Features professors won't find in a generic spreadsheet or a basic calendar tool.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Configurable recovery session extra minutes | The current fixed +30 min is an assumption. Chilean DGAI and pedagogical hour standards vary by institution. Letting the professor specify "+45 min" or "+20 min" per recovery session makes the tool accurate for their specific contract terms. | LOW | Replace the hardcoded `+ 0.5` in `calculateSchedule` (`effRecovery = getEffectiveHours(hoursPerSession + 0.5)`) with a form field `recoveryExtraMinutes` (default 30). Store in `courseData`. |
| Ad-hoc makeup days outside the normal schedule | When a class is cancelled (weather, strike, illness), the professor needs to schedule a makeup on a day that is not a regular class day — e.g., a Tuesday makeup for a Mon/Wed course. The existing custom exclusion feature is one-directional (remove days only). Adding extra sessions on arbitrary dates completes the pair. | MEDIUM | Add a `makeupDates` array to `courseData`. In `calculateSchedule`, after the main loop, insert makeup sessions at their specified dates. They count toward accumulated hours. Mark them visually in the schedule list. |
| Test suite (unit + component) | Not a user-facing feature, but it enables confident refactoring and prevents regressions when holiday logic, hour conversion, or algorithm changes are made. For a tool professors trust with formal documents, correctness is non-negotiable. Vitest + React Testing Library is zero-config on the existing Vite stack. | MEDIUM | Unit tests: `getEffectiveHours`, `calculateSchedule` (session count, hour accumulation, holiday skipping, mid-course detection, weekly cap). Component tests: form submits correct values, schedule renders correct rows, export buttons are enabled only when schedule exists. |
| App.jsx refactor into hook + module | Not user-facing but directly enables all other features. At 360 lines, adding holiday API state, makeup dates, validation state, and test coverage into `App.jsx` is unmaintainable. Extracting `useSchedule` hook and `scheduleEngine.js` pure module makes the algorithm independently testable and the component readable. | MEDIUM | Extract `calculateSchedule` + `isDateExcluded` + `getEffectiveHours` into `src/logic/scheduleEngine.js` (pure functions, no React). Extract state + effects into `src/hooks/useSchedule.js`. `App.jsx` becomes layout-only at ~100 lines. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-course scheduling in one session | Power users want to plan the whole semester at once | Requires a fundamentally different data model (array of courses, cross-course conflict detection, shared holiday fetching). Doubles the scope of every subsequent feature. Out of scope per PROJECT.md. | Let professors open multiple browser tabs — one per course. Each tab has independent localStorage. This is the correct scope for a single-course tool. |
| Drag-and-drop session reordering | Visually appealing, demos well | Session order is algorithmically determined by date. Allowing arbitrary reorder breaks the accumulated-hours column, mid-course marker, and recovery session labeling. The invariant that `sessions[n].date < sessions[n+1].date` must hold. | Makeup dates (ad-hoc additions at specific dates) solve the actual underlying need: "I need to move a session." |
| User accounts / cloud sync | Users ask for "save to the cloud" | Requires backend, auth, data storage — all explicitly out of scope. Introduces privacy concerns for academic data. | localStorage covers the single-device use case. Professors can export to Excel as their persistent record. |
| Real-time collaboration | Seen in other planning tools | Two professors editing simultaneously requires a sync layer. The tool is single-user by design. | Not needed for the stated use case. |
| Automatic semester template presets | "Pre-fill for PUCV semester 1 2027" | Semester dates change year to year. Hardcoding them creates the same maintenance problem as `CHILEAN_HOLIDAYS_2026`. Stale presets mislead more than they help. | The holiday API (nager.date) solves the holiday part automatically. Start date and course length are genuinely course-specific — a form field is the right UI. |
| Per-session notes/annotations | Professors want to write "Exam today" on session 8 | This turns a schedule generator into a full course management system. Scope explosion. | The Excel export already has a "Notas" column that the professor can fill manually after exporting. |

---

## Holiday API Failure Handling: Expected Behavior

This section directly answers the research question about `nager.date` API failure patterns.

### Standard patterns in scheduling tools (MEDIUM confidence, from domain knowledge)

**Three-tier fallback strategy** is the established pattern for holiday data in client-side scheduling apps:

1. **Live API (primary):** Fetch `https://date.nager.at/api/v3/publicholidays/{year}/CL` on demand when a year not yet cached is needed.
2. **localStorage cache (secondary):** On successful fetch, write `localStorage.setItem('holidays_CL_2026', JSON.stringify(data))`. On subsequent requests for the same year, read from cache — no network call. Cache does not expire because public holiday lists for a past or current year are immutable.
3. **Hardcoded fallback (tertiary):** Keep the existing `CHILEAN_HOLIDAYS_2026` constant as a last resort for 2026. For other years, if both API and cache fail, show a non-blocking warning banner: "No se pudo obtener feriados para [year]. Las fechas pueden no reflejar feriados nacionales." — and proceed with generation using only custom excluded dates.

**Year boundary behavior:**

- A course starting in December 2026 and ending in February 2027 touches two calendar years. The algorithm must fetch holidays for both years before generating the schedule. Fetch both in parallel (`Promise.all`). Handle partial failure: if 2027 fetch fails and no cache exists, warn for that year only, not both.
- The year(s) needed are determined from `startDate` and the estimated end date. Estimated end = `startDate + (totalHours / hoursPerSession) * 7 / classDays.length` days (rough upper bound). Fetch any year in that range.

**API failure modes for nager.date specifically** (HIGH confidence, well-known public API):

- Returns `404` for years too far in the future (holidays not yet legislated). This is a known limitation: nager.date typically has data 1–2 years ahead.
- Returns `204 No Content` for countries with no data. Chile (CL) is well-supported.
- Rate limiting is not documented for public use; the API is free and unauthenticated. A single fetch per year per user session is negligible load.
- Network timeout: treat any fetch error (network offline, DNS failure, timeout) identically — fall back to cache then hardcoded.

**Do not:** show a blocking modal or prevent schedule generation on API failure. Scheduling must work offline. The warning banner pattern is correct.

---

## Makeup/Recovery Session Management: Expected Behavior

This section answers the research question about makeup session patterns in academic scheduling tools.

### Distinction between "recovery sessions" and "makeup sessions"

In Chilean university context (and generally in academic scheduling):

- **Recovery session (sesión de recuperación):** A scheduled session at the start of the course with extra hours to front-load the curriculum. Does not correspond to a cancelled class. Already implemented as the first N sessions with +30 min.
- **Makeup session (sesión de reposición / recuperación de clase cancelada):** An extra session scheduled on a non-standard day to compensate for a class that was cancelled. This is the missing feature.

### Expected behavior in tools of this type (MEDIUM confidence, domain knowledge)

A professor needs to:

1. Mark a scheduled session as cancelled — this does not remove it from the schedule list but flags it visually and marks the accumulated-hours difference.
2. Add a makeup session on a specific date (outside the normal weekday pattern) with a specified duration (may differ from normal session length).
3. See the makeup session in the schedule list, correctly positioned by date, with accumulated hours updated.
4. Have the makeup session appear in exports (Excel column "Tipo" = "Reposición", print view shows it distinctly).

### Simpler acceptable model (fits existing architecture)

Given this is a single-developer project with a client-side constraint, the full "mark cancelled + add makeup" workflow is over-engineered for the milestone. The acceptable simpler model:

- Add a `makeupDates` array to `courseData`: `[{ date: '2026-09-22', hours: 2, label: 'Reposición' }]`.
- In the schedule display, makeup sessions appear inline sorted by date with a distinct visual marker.
- In `calculateSchedule`, process makeup entries as additional sessions that contribute to accumulated hours. They do not count against the weekly cap (they are exceptional, not regular).
- The form provides a date picker + hours field + "Agregar reposición" button, analogous to the existing excluded dates UI.

---

## Feature Dependencies

```
[Input Validation]
    └──required before──> [sessionsPerWeek Cap] (invalid state could cause infinite loop)
    └──required before──> [Holiday API] (invalid startDate would trigger API fetch for bad year)

[App.jsx Refactor]
    └──enables──> [Test Suite] (pure functions in scheduleEngine.js are independently testable)
    └──enables──> [sessionsPerWeek Cap] (algorithm change is cleaner in isolated module)
    └──enables──> [Makeup Sessions] (state additions are cleaner in useSchedule hook)

[Holiday API fetch]
    └──required for──> [Multi-year courses] (year-boundary correctness)
    └──enhances──> [Export Metadata] (exported schedule can note which holidays were applied)

[Export Metadata fields]
    └──requires──> [New form fields: semester, professor name, email]

[Dark Mode Persistence]
    └──independent of all other features

[View Mode Persistence]
    └──independent of all other features

[Configurable Recovery Extra Minutes]
    └──independent, replaces hardcoded 0.5 constant

[Makeup Sessions]
    └──enhances──> [Export] (makeup rows must appear in Excel/PDF)
    └──independent of Holiday API
```

### Dependency Notes

- **Input Validation before sessionsPerWeek Cap:** The weekly cap loop currently has a 1500-iteration safety counter. An edge case where `sessionsPerWeek: 0` (possible if user clears the field) could cause unexpected behavior. Validation should enforce `sessionsPerWeek >= 1` before the algorithm runs.
- **App.jsx Refactor before Test Suite:** `calculateSchedule` is currently a `useCallback` inside a React component. Unit testing it requires either rendering the full component or extracting it to a pure function. Extraction is the correct approach; tests depend on it.
- **Holiday API before multi-year courses work correctly:** This is the highest-risk correctness issue — existing 2026 hardcode breaks silently, not noisily.

---

## MVP Definition for This Milestone

### Must ship (blocks correctness or trust)

- [ ] Input validation — prevents broken schedule generation; one mistyped value currently silently produces garbage output
- [ ] Holiday API with localStorage cache and fallback warning — the 2026 hardcode is already a live bug for any 2027+ course
- [ ] Export metadata header — professors submitting schedules to academic offices need course/professor identification
- [ ] Dark mode and view mode persistence — expected behavior that is currently missing; low effort

### Should ship (high value, fits milestone scope)

- [ ] sessionsPerWeek hard cap wired into algorithm — visible form field that does nothing destroys form credibility
- [ ] Configurable recovery extra minutes — small change, eliminates a silent assumption
- [ ] App.jsx refactor — prerequisite for test suite; also reduces bug surface for all other changes
- [ ] Test suite — correctness guarantee for the algorithm; Vitest is zero-config on this stack

### Defer to next milestone

- [ ] Makeup sessions (ad-hoc reposition dates) — useful but not blocking any current correctness issue; adds state complexity that is easier after the refactor stabilizes
- [ ] UI polish — not a blocker; can iterate continuously

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Input validation | HIGH | LOW | P1 |
| Holiday API + cache + fallback | HIGH | MEDIUM | P1 |
| Export metadata header | HIGH | LOW | P1 |
| Dark mode persistence | MEDIUM | LOW | P1 |
| View mode persistence | LOW | LOW | P1 |
| sessionsPerWeek cap | HIGH | MEDIUM | P1 |
| App.jsx refactor | HIGH (indirect) | MEDIUM | P1 |
| Test suite | HIGH (indirect) | MEDIUM | P1 |
| Configurable recovery minutes | MEDIUM | LOW | P2 |
| Makeup/ad-hoc sessions | MEDIUM | MEDIUM | P2 |
| UI polish | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, include if scope allows
- P3: Nice to have, future consideration

---

## Sources

Note: web search and web fetch were unavailable during this research session. Findings are based on:

- Direct codebase analysis: `App.jsx`, `CourseForm.jsx`, `constants.js`, `utils.js`, `ARCHITECTURE.md`, `PROJECT.md`
- Domain knowledge: Chilean university academic scheduling conventions, nager.date API design (well-known public API, documented behavior from training data — MEDIUM confidence for API specifics)
- Standard React patterns: localStorage persistence, `prefers-color-scheme`, graceful API degradation

---
*Feature research for: academic course schedule builder (Chilean university, React SPA)*
*Researched: 2026-03-26*
