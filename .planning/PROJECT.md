# PlanificadorClases

## What This Is

A client-side React app that helps Chilean university teaching staff plan academic courses. Given a course start date, selected class days, total hours, and hour type, it automatically generates a complete session calendar — skipping Chilean national holidays and custom excluded dates — and exports the schedule to Excel or PDF.

## Core Value

Accurate, trustworthy schedule generation that professors can hand to students on day one.

## Requirements

### Validated

<!-- Shipped and confirmed working in the existing codebase. -->

- ✓ Course configuration form (name, start date, session days, total hours, hour type) — existing
- ✓ Automatic session calendar generation with holiday and excluded-date skipping — existing
- ✓ Multiple hour types: chronological, pedagogical (×60/45), DGAI (×60/35) — existing
- ✓ Recovery sessions (first N sessions with +30 min bonus) — existing
- ✓ Mid-course marker detection at 50% accumulated hours — existing
- ✓ Excel export via SheetJS — existing
- ✓ Print-to-PDF via browser print — existing
- ✓ localStorage persistence of course data across sessions — existing
- ✓ Dark mode toggle — existing
- ✓ List view and calendar grid view — existing
- ✓ Custom date exclusions (ad-hoc holidays/events) — existing
- ✓ Full test suite — Vitest 3 + RTL + MSW scaffold; 63 tests covering `getEffectiveHours`, `calculateSchedule`, `useCourseData` (13 cases), `useSchedule` (5 cases), CourseForm, ScheduleList — Validated in Phase 2: Test Infrastructure + Phase 3: Hook Extraction
- ✓ Dark mode persistence — localStorage with `prefers-color-scheme` fallback on first visit — Validated in Phase 3: Hook Extraction and Persistence
- ✓ View mode persistence — localStorage persistence of list/grid selection — Validated in Phase 3: Hook Extraction and Persistence
- ✓ Refactor `App.jsx` — extracted into `useCourseData` and `useSchedule` hooks; App.jsx reduced to ~80-line orchestration shell — Validated in Phase 3: Hook Extraction and Persistence
- ✓ Holiday data via nager.date API — replaced hardcoded holidays with live API fetch; caches fetched years in localStorage — Validated in Phase 4: Holiday API Integration
- ✓ Input validation — inline touched+blur validation for 5 fields; `useSchedule` returns `[]` for invalid inputs — Validated in Phase 5: Validation, Export, and UX
- ✓ Configurable recovery extra minutes — default 30, user-adjustable; replaces hardcoded +0.5h in engine — Validated in Phase 5: Validation, Export, and UX
- ✓ Export metadata header — semester, professor name, contact email in Excel (7-row header) and print/PDF (conditional print-only div) — Validated in Phase 5: Validation, Export, and UX
- ✓ New form metadata fields — Semestre, Nombre Profesor/a, Email de Contacto added to CourseForm — Validated in Phase 5: Validation, Export, and UX

### Active

<!-- Current scope. Building toward these. -->

- [ ] Wire `sessionsPerWeek` into scheduling algorithm as a hard maximum sessions-per-week cap
- [ ] UI improvements — polish layout, improve form usability, better visual hierarchy

### Out of Scope

- Multi-course scheduling — requires significant state model rework; not a current need
- Backend / user accounts — this is intentionally a client-side-only tool
- React Router / multi-page navigation — no multi-view requirements beyond what exists
- Error monitoring (Sentry, etc.) — low-risk client-side tool with no sensitive data
- Internationalization — Spanish-only, Chilean context

## Context

- **Existing codebase**: React 18 + Vite 7 + Tailwind CSS 3, deployed to GitHub Pages via `gh-pages`
- **No test infrastructure**: No testing framework installed; Vitest is the natural choice given the Vite stack
- **Monolithic App.jsx**: ~360 lines mixing state, algorithm, event handlers, and layout — refactor is overdue
- **Holiday limitation**: `CHILEAN_HOLIDAYS_2026` in `constants.js` breaks for 2027+ courses; nager.date provides free multi-year CL holiday data with no API key
- **Dead state field**: `sessionsPerWeek` exists in `initialCourseData` but is never read by `calculateSchedule()` — should be wired in or removed (user wants it wired in)
- **xlsx via CDN**: SheetJS loaded from CDN tarball rather than npm — introduces availability risk; may be worth migrating to npm package
- **Deployment**: `npm run deploy` builds and publishes to GitHub Pages — no CI/CD

## Constraints

- **Tech stack**: React + Vite + Tailwind — no framework changes
- **Client-side only**: No backend, no API keys stored server-side; nager.date is used because it requires no key
- **GitHub Pages**: Build output must remain static; base path `'./'` must be preserved in `vite.config.js`
- **Offline degradation**: Holiday API fetch may fail; app must fall back gracefully (use cached data or warn user)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| nager.date for holiday data | Free, no API key, supports multi-year CL holidays, simple REST endpoint | — Pending |
| Vitest for testing | Same config as Vite, zero extra setup, supports jsdom for React component tests | — Pending |
| sessionsPerWeek as hard cap | User wants the algorithm to enforce max sessions per week, not just track the field | — Pending |
| Keep xlsx via CDN or migrate to npm | CDN introduced in recent commit — worth revisiting during export metadata work | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after Phase 3 completion*
