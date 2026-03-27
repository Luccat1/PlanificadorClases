# Milestones

## v1.0 MVP (Shipped: 2026-03-27)

**Phases completed:** 5 phases, 13 plans, 20 tasks

**Key accomplishments:**

- Pure scheduling module extracted from App.jsx useCallback into src/logic/scheduleEngine.js, fixing UTC timezone bug and implementing sessionsPerWeek Mon-Sun cap
- Vitest 3 + @testing-library + MSW 2 test infrastructure installed, configured in vite.config.js, with global jest-dom matchers and MSW Node server scaffold — `npm test` exits 0
- Worktree was behind main branch
- CourseForm and ScheduleList React Testing Library tests using wrapper-component pattern, covering input propagation, day toggle, MITAD/RECUPERACION markers, and row count assertions — 11 tests, all green
- TDD RED phase: 18 failing test stubs written for useCourseData (13 cases) and useSchedule (5 cases) with matchMedia mock added to test-setup.js for jsdom dark mode compatibility
- One-liner:
- Inline touched+blur validation for 5 fields plus 4 new metadata/configuration inputs (semester, professorName, contactEmail, recoveryExtraMinutes) wired into CourseForm with rose-border error rendering and 10 new tests.
- One-liner:

---
