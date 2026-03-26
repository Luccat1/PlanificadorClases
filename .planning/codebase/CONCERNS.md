# Concerns & Risks

## Technical Debt
- **Monolithic App.jsx**: All state, business logic, event handlers, export logic, and layout live in a single ~360-line file. As features grow this will become hard to maintain.
- **Holiday data hardcoded for 2026 only**: `CHILEAN_HOLIDAYS_2026` in `constants.js` — courses spanning into 2027+ will not have holidays detected. No mechanism to update or extend.
- **No input validation**: Negative numbers, zero hours per session, and past start dates are silently accepted and may produce unexpected results.

## Security Concerns
- Low risk for a client-side-only app with no backend.
- `localStorage` used for persistence — appropriate for this use case, no sensitive data.
- `window.confirm()` used for destructive reset — works but non-styleable and blocked in some embedded contexts.

## Performance Concerns
- Scheduling algorithm runs on every `courseData` change (via `useEffect`) — no debouncing. With very large hour totals or many excluded dates, this could cause UI lag on each keystroke.
- No virtualization in the schedule table — for very long courses (100+ sessions) the DOM could grow large.

## Scalability Concerns
- Single-course design: the app manages one course at a time. Multi-course scheduling would require a significant rework of the state model.
- No routing — adding multiple pages/views would require introducing React Router.

## Missing Infrastructure
- **No tests** — zero automated test coverage (see TESTING.md)
- **No linting config** — no `.eslintrc` found; `npm run lint` script references eslint but config may be minimal/implicit via Vite
- **No error boundaries** — unhandled React render errors would crash the whole app
- **No logging or monitoring** — no error tracking (Sentry, etc.)

## Dependency Risks
- `xlsx` (SheetJS Community Edition): loaded from CDN per recent commit. CDN dependency introduces availability/integrity risk vs. npm-bundled.
- Holiday data will become stale after 2026 — needs annual update.

## Code Quality Issues
- `sessionsPerWeek` field exists in `initialCourseData` state but appears unused in the scheduling algorithm (days are selected explicitly via `classDays`).
- Dark mode state (`darkMode`) managed locally in `App.jsx` but applied only via className — not using `prefers-color-scheme` or `localStorage` persistence.
- View mode (`viewMode`) not persisted to localStorage — resets to `'list'` on page refresh.
