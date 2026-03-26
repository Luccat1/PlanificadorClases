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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Full test suite — unit tests for `calculateSchedule()` and `getEffectiveHours()`, plus React component tests (form, schedule display, interactions)
- [ ] Holiday data via nager.date API — replace hardcoded `CHILEAN_HOLIDAYS_2026` with live API fetch (`nager.date/api/v3/publicholidays/{year}/CL`), caching fetched years to avoid redundant requests
- [ ] Wire `sessionsPerWeek` into scheduling algorithm as a hard maximum sessions-per-week cap
- [ ] Input validation — guard against negative hours, zero session length, and invalid date configurations with clear UI feedback
- [ ] Dark mode persistence — remember user preference in localStorage and respect `prefers-color-scheme` on first visit
- [ ] View mode persistence — remember list vs. calendar view selection across refreshes via localStorage
- [ ] Refactor `App.jsx` — extract scheduling algorithm and state into dedicated hook/module; reduce the monolithic 360-line file
- [ ] Flexible recovery session configuration — configurable extra minutes per session (not just fixed +30) and ability to add ad-hoc makeup days outside the normal class schedule
- [ ] UI improvements — polish layout, improve form usability, better visual hierarchy
- [ ] Export metadata header — include course name, semester, professor name, and contact email at the top of Excel and PDF exports

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
*Last updated: 2026-03-26 after initialization*
