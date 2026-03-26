# Requirements: PlanificadorClases

**Defined:** 2026-03-26
**Core Value:** Accurate, trustworthy schedule generation that professors can hand to students on day one.

## v1 Requirements

### Correctness

- [ ] **CORT-01**: App validates form inputs inline (negative hours, zero session length, no class days selected, missing start date) and blocks schedule generation until inputs are valid — showing errors next to the offending field, not a global alert
- [ ] **CORT-02**: Holiday data is fetched from nager.date API per calendar year needed, cached in localStorage keyed by year (`holidays_CL_{year}`), with a non-blocking warning banner when API and cache both fail — schedule generation proceeds using only custom excluded dates
- [x] **CORT-03**: `sessionsPerWeek` field enforces a hard cap on sessions scheduled per calendar week (Mon–Sun) in the algorithm — a `sessionsPerWeek: 2` with Mon/Wed/Fri class days skips the third qualifying day each week
- [ ] **CORT-04**: Professor can configure the extra minutes added per recovery session (replaces the hardcoded +30 min constant) — input stored in `courseData`, default value 30

### Persistence

- [ ] **PERS-01**: Dark mode preference is persisted in localStorage and survives page refresh — on first visit defaults to `prefers-color-scheme` system preference
- [ ] **PERS-02**: View mode selection (list / calendar grid) is persisted in localStorage and survives page refresh — default is `'list'`

### Export

- [ ] **EXPO-01**: CourseForm includes fields for semester, professor name, and contact email (in addition to existing course name field)
- [ ] **EXPO-02**: Excel export includes a metadata header block (3–4 rows) at the top of the sheet showing course name, semester, professor name, and contact email before the session rows
- [ ] **EXPO-03**: Print/PDF output includes a metadata header block showing course name, semester, professor name, and contact email above the schedule table

### Architecture

- [x] **ARCH-01**: Scheduling logic extracted to `src/logic/scheduleEngine.js` as pure functions (`calculateSchedule`, `getEffectiveHours`, `isDateExcluded`) with no React dependencies — takes all inputs as parameters, returns value
- [ ] **ARCH-02**: Course data state and localStorage persistence extracted to `src/hooks/useCourseData.js` custom hook
- [ ] **ARCH-03**: Schedule calculation state extracted to `src/hooks/useSchedule.js` custom hook that consumes `scheduleEngine.js`
- [ ] **ARCH-04**: Holiday API fetch and cache logic extracted to `src/services/holidayApi.js` (pure async function) wrapped by `src/hooks/useHolidays.js` hook with year-keyed localStorage caching and fallback

### Testing

- [x] **TEST-01**: Vitest + `@vitest/coverage-v8` + React Testing Library configured in `vite.config.js` with `jsdom` environment; `npm test` and `npm run test:coverage` scripts added
- [ ] **TEST-02**: Unit tests cover `getEffectiveHours()` for all three modes (chronological, pedagogical ×60/45, DGAI ×60/35)
- [ ] **TEST-03**: Unit tests cover `calculateSchedule()` — session count, hour accumulation, holiday skipping, mid-course marker detection, recovery session bonus hours
- [ ] **TEST-04**: Unit tests cover sessionsPerWeek hard cap including week-boundary edge cases (Mon–Sun rollover, courses spanning year boundaries)
- [ ] **TEST-05**: Unit tests cover timezone edge case (schedule dates correct in UTC-3/UTC-4 offset)
- [ ] **TEST-06**: Component tests cover CourseForm — field changes propagate correctly, validation errors appear for invalid inputs
- [ ] **TEST-07**: Component tests cover ScheduleList — renders correct number of session rows, mid-course marker appears at correct position

## v2 Requirements

### Makeup Sessions

- **MKUP-01**: Professor can add ad-hoc makeup/reposición sessions on arbitrary dates (outside normal class day pattern) with configurable duration
- **MKUP-02**: Makeup sessions appear inline in schedule list sorted by date with distinct visual marker ("Reposición")
- **MKUP-03**: Makeup sessions contribute to accumulated hours and appear in Excel/PDF exports with type label "Reposición"
- **MKUP-04**: Makeup sessions are exempt from the sessionsPerWeek cap (they are exceptional, not regular)

### UI Polish

- **UI-01**: Dedicated UI improvement pass — visual hierarchy, form layout, responsive design, color system consistency

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-course scheduling | Requires fundamental data model rework (array of courses, cross-course conflict detection). Out of scope per PROJECT.md. |
| Backend / user accounts | Intentionally client-side only. Privacy concerns for academic data. localStorage is sufficient. |
| Drag-and-drop session reordering | Breaks date-order invariant, accumulated-hours column, and mid-course marker. The underlying need (reschedule a cancelled class) is solved by makeup sessions (v2). |
| Per-session notes/annotations | Turns scheduler into course management system. Excel export has a notes column professors can fill manually. |
| Automatic semester presets | Hardcoding creates the same stale-data problem as CHILEAN_HOLIDAYS_2026. Holiday API solves the relevant part. |
| Real-time collaboration | Single-user tool by design. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ARCH-01 | Phase 1 | Complete |
| CORT-03 | Phase 1 | Complete |
| TEST-01 | Phase 2 | Complete |
| TEST-02 | Phase 2 | Pending |
| TEST-03 | Phase 2 | Pending |
| TEST-04 | Phase 2 | Pending |
| TEST-05 | Phase 2 | Pending |
| TEST-06 | Phase 2 | Pending |
| TEST-07 | Phase 2 | Pending |
| ARCH-02 | Phase 3 | Pending |
| ARCH-03 | Phase 3 | Pending |
| PERS-01 | Phase 3 | Pending |
| PERS-02 | Phase 3 | Pending |
| ARCH-04 | Phase 4 | Pending |
| CORT-02 | Phase 4 | Pending |
| CORT-01 | Phase 5 | Pending |
| CORT-04 | Phase 5 | Pending |
| EXPO-01 | Phase 5 | Pending |
| EXPO-02 | Phase 5 | Pending |
| EXPO-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-26*
*Last updated: 2026-03-26 after roadmap creation*
