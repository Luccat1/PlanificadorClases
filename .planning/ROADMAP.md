# Roadmap: PlanificadorClases

## Overview

This milestone upgrades a working baseline into a trustworthy, maintainable tool. The work flows in a strict dependency order: extract the scheduling algorithm into a pure function first (which unblocks testing and feature wiring), build the test suite to validate the extraction, extract state into focused custom hooks (which unblocks the holiday API integration), wire in the live holiday API with offline fallback, and finally layer on input validation and export metadata. Each phase delivers one coherent, verifiable capability — nothing ships in fragments.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Algorithm Extraction** - Extract scheduling logic to a pure, testable module and wire sessionsPerWeek cap
- [ ] **Phase 2: Test Infrastructure** - Install Vitest + RTL + MSW and cover scheduling logic with unit and component tests
- [ ] **Phase 3: Hook Extraction and Persistence** - Extract state into custom hooks; add dark mode and view mode persistence
- [ ] **Phase 4: Holiday API Integration** - Replace hardcoded holiday array with live nager.date API fetch and localStorage cache
- [ ] **Phase 5: Validation, Export, and UX** - Add inline input validation, export metadata header, and configurable recovery minutes

## Phase Details

### Phase 1: Algorithm Extraction
**Goal**: The scheduling algorithm exists as a pure, independently-importable function with no React dependencies — enabling testing, holiday injection, and sessionsPerWeek enforcement
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, CORT-03
**Success Criteria** (what must be TRUE):
  1. `src/logic/scheduleEngine.js` exists and exports `calculateSchedule`, `getEffectiveHours`, and `isDateExcluded` as plain functions that can be imported in a Node.js/Vitest context with no React present
  2. App behavior after extraction is identical to before — same sessions, same hours, same holiday skipping — verifiable by manual test of an existing course
  3. A course with `sessionsPerWeek: 2` and three class days (Mon/Wed/Fri) schedules at most two sessions per calendar week, skipping the third qualifying day each week
  4. The timezone bug is fixed: schedule dates are correct when the browser is set to UTC-3/UTC-4 (dates no longer shift by one day)
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md — Create scheduleEngine.js pure module and wire App.jsx

### Phase 2: Test Infrastructure
**Goal**: A working Vitest + React Testing Library + MSW test suite validates the scheduling algorithm and key components, proving the Phase 1 extraction preserved correctness
**Depends on**: Phase 1
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07
**Success Criteria** (what must be TRUE):
  1. `npm test` runs and exits green with no configuration errors; `npm run test:coverage` generates a coverage report
  2. `getEffectiveHours()` tests pass for all three hour modes (chronological, pedagogical ×60/45, DGAI ×60/35)
  3. `calculateSchedule()` tests cover session count, accumulated hours, holiday skipping, mid-course marker placement, and recovery session bonus hours
  4. sessionsPerWeek cap tests pass including year-boundary edge cases (course spanning December/January with `sessionsPerWeek: 1`)
  5. A Vitest test explicitly constructs dates at UTC-3 offset and asserts schedule dates are correct
  6. CourseForm component test verifies field changes propagate and validation errors appear for invalid inputs; ScheduleList component test verifies correct session row count and mid-course marker position
**Plans**: TBD
**UI hint**: yes

### Phase 3: Hook Extraction and Persistence
**Goal**: App.jsx is reduced to an orchestration shell (~80 lines); course data state, schedule state, dark mode, and view mode all live in focused custom hooks with proper localStorage persistence
**Depends on**: Phase 2
**Requirements**: ARCH-02, ARCH-03, PERS-01, PERS-02
**Success Criteria** (what must be TRUE):
  1. `src/hooks/useCourseData.js` exists and manages all course form state and localStorage persistence — App.jsx no longer contains raw `useState` for course fields
  2. `src/hooks/useSchedule.js` exists and reactively recomputes the schedule when course data or holidays change — App.jsx no longer calls `calculateSchedule` directly
  3. Dark mode preference is remembered across page refreshes; on first visit the app matches the system `prefers-color-scheme` setting
  4. List vs. calendar view selection is remembered across page refreshes — switching to calendar view, refreshing, and returning lands back on calendar view
**Plans**: TBD
**UI hint**: yes

### Phase 4: Holiday API Integration
**Goal**: Holiday data is fetched live from nager.date per calendar year, cached per year in localStorage, and the app degrades gracefully with a visible warning when both API and cache fail
**Depends on**: Phase 3
**Requirements**: ARCH-04, CORT-02
**Success Criteria** (what must be TRUE):
  1. A course with a 2027 start date generates a schedule with correct 2027 Chilean holidays (not 2026 hardcoded data), confirmed by checking at least one known 2027 holiday is skipped
  2. After the first fetch for a year, refreshing the page does not trigger a new network request for the same year — the cached data is used (verifiable via browser DevTools network tab)
  3. When the nager.date API is unreachable and no cache exists for the requested year, a warning banner appears above the schedule and generation proceeds using only custom excluded dates — the app does not crash or silently skip generation
  4. A course spanning two calendar years (e.g., November 2026 through March 2027) fetches and caches holiday data for both years, and holidays from both years are correctly skipped
**Plans**: TBD

### Phase 5: Validation, Export, and UX
**Goal**: Invalid inputs are blocked at the form level with inline error messages; exports carry a professor-facing metadata header; recovery session extra minutes are configurable
**Depends on**: Phase 4
**Requirements**: CORT-01, CORT-04, EXPO-01, EXPO-02, EXPO-03
**Success Criteria** (what must be TRUE):
  1. Entering a negative value for total hours, zero for session length, or no class days shows an inline error next to the offending field and the "Generate Schedule" button remains disabled until fixed
  2. The CourseForm includes semester, professor name, and contact email fields in addition to the existing course name field
  3. The exported Excel file has a metadata block at the top (3–4 rows) showing course name, semester, professor name, and contact email before the session rows
  4. The print/PDF view shows a metadata header with course name, semester, professor name, and contact email above the schedule table
  5. A numeric input for extra recovery minutes is present in the form with a default of 30; changing it to 15 and regenerating the schedule produces session durations with 15-minute bonus rather than 30-minute
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Algorithm Extraction | 0/1 | Not started | - |
| 2. Test Infrastructure | 0/TBD | Not started | - |
| 3. Hook Extraction and Persistence | 0/TBD | Not started | - |
| 4. Holiday API Integration | 0/TBD | Not started | - |
| 5. Validation, Export, and UX | 0/TBD | Not started | - |
