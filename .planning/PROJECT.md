# PlanificadorClases

## What This Is

A client-side React app that helps Chilean university teaching staff plan academic courses. Given a course start date, selected class days, total hours, and hour type, it automatically generates a complete session calendar — skipping Chilean national holidays (fetched live from nager.date) and custom excluded dates — and exports the schedule to Excel or PDF with a professor metadata header. Input validation blocks invalid configurations inline.

## Core Value

Accurate, trustworthy schedule generation that professors can hand to students on day one.

## Current State

**v1.0 MVP — Shipped 2026-03-27**

5 phases complete. 87 tests passing. Deployed to GitHub Pages.

Tech stack: React 18 + Vite 7 + Tailwind CSS 3 + Vitest 3 + RTL + MSW.
Architecture: `scheduleEngine.js` (pure logic) → `useCourseData` + `useSchedule` + `useHolidays` hooks → `App.jsx` orchestration shell (~80 lines).

## Requirements

### Validated

<!-- Shipped and confirmed working. -->

- ✓ Course configuration form (name, start date, session days, total hours, hour type) — existing
- ✓ Automatic session calendar generation with holiday and excluded-date skipping — existing
- ✓ Multiple hour types: chronological, pedagogical (×60/45), DGAI (×60/35) — existing
- ✓ Recovery sessions with configurable extra minutes (default 30) — v1.0
- ✓ Mid-course marker detection at 50% accumulated hours — existing
- ✓ Excel export via SheetJS with professor metadata header (7-row block) — v1.0
- ✓ Print-to-PDF via browser print with conditional metadata div — v1.0
- ✓ localStorage persistence of course data, dark mode, and view mode — v1.0
- ✓ Dark mode toggle with `prefers-color-scheme` fallback on first visit — v1.0
- ✓ List view and calendar grid view with persistence — v1.0
- ✓ Custom date exclusions (ad-hoc holidays/events) — existing
- ✓ Full test suite — Vitest 3 + RTL + MSW; 87 tests covering scheduleEngine, hooks (useCourseData 19 cases, useSchedule 11 cases, useHolidays 6 cases), CourseForm (16 cases), ScheduleList — v1.0
- ✓ Pure `scheduleEngine.js` module — extracted from App.jsx, no React dependencies, UTC timezone bug fixed — v1.0
- ✓ `useCourseData` + `useSchedule` + `useHolidays` hooks — App.jsx reduced to ~80-line orchestration shell — v1.0
- ✓ Holiday data via nager.date API — live fetch per calendar year, localStorage cache, graceful degradation with warning banner — v1.0
- ✓ Inline input validation — touched+blur trigger, eager clearing, rose error borders, `useSchedule` returns `[]` for invalid inputs — v1.0
- ✓ Professor metadata fields — Semestre, Nombre Profesor/a, Email de Contacto in form and exports — v1.0

### Active

<!-- Next milestone targets. -->

- [ ] Wire `sessionsPerWeek` into scheduling algorithm as a hard maximum sessions-per-week cap (field exists in state but is unused)
- [ ] UI polish — improve form layout, visual hierarchy, mobile responsiveness

### Out of Scope

- Multi-course scheduling — requires fundamental data model rework; not a current need
- Backend / user accounts — intentionally client-side only; localStorage is sufficient
- React Router / multi-page navigation — no multi-view requirements beyond what exists
- Error monitoring (Sentry, etc.) — low-risk client-side tool with no sensitive data
- Internationalization — Spanish-only, Chilean context
- Drag-and-drop session reordering — breaks date-order invariant and accumulated-hours column

## Context

- **v1.0 shipped**: React 18 + Vite 7 + Tailwind CSS 3, deployed to GitHub Pages via `npm run deploy`
- **Architecture**: Pure logic in `scheduleEngine.js`; state in `useCourseData`, `useSchedule`, `useHolidays`; App.jsx is ~80-line shell
- **Test suite**: 87 passing tests, 8 test files — full coverage of logic, hooks, and key components
- **Holiday data**: Live nager.date API (no key required), caches per year in localStorage, degrades gracefully
- **xlsx via CDN**: SheetJS loaded from CDN tarball rather than npm — introduces availability risk; consider migrating to npm for v1.1
- **sessionsPerWeek**: Dead state field — exists in `useCourseData` but not read by `calculateSchedule()`. Priority for v1.1.
- **Deployment**: `npm run deploy` builds and publishes to GitHub Pages — no CI/CD

## Constraints

- **Tech stack**: React + Vite + Tailwind — no framework changes
- **Client-side only**: No backend, no API keys stored server-side; nager.date requires no key
- **GitHub Pages**: Build output must remain static; base path `'./'` must be preserved in `vite.config.js`
- **Offline degradation**: Holiday API fetch may fail; app must fall back gracefully (use cached data or warn user)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| nager.date for holiday data | Free, no API key, supports multi-year CL holidays, simple REST endpoint | ✓ Good — worked exactly as designed; multi-year fetch confirmed working |
| Vitest for testing | Same config as Vite, zero extra setup, supports jsdom for React component tests | ✓ Good — 87 tests, ~5s runtime, zero config friction |
| useMemo for derived schedule state | Avoids stale render frame from useEffect+setState | ✓ Good — reactive and synchronous, no flicker |
| Touched+blur validation in CourseForm local state | Avoid prop threading; self-contained | ✓ Good — clean, no architectural overhead |
| isFormValid guard in useSchedule (not CourseForm) | D-04: schedule suppression independent of form validation state | ✓ Good — separates display concerns from schedule correctness |
| sessionsPerWeek as hard cap | User wants algorithm to enforce max sessions per week | — Pending (v1.1) |
| Keep xlsx via CDN vs migrate to npm | CDN introduced in recent commit | ⚠ Revisit — CDN availability risk noted, recommend npm migration for v1.1 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-03-27 after v1.0 milestone*
