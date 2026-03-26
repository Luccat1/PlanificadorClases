# Project Research Summary

**Project:** PlanificadorClases
**Domain:** Client-side React SPA — academic course schedule builder for Chilean university context
**Researched:** 2026-03-26
**Confidence:** HIGH (architecture and pitfalls based on direct codebase inspection; stack recommendations well-established; features derived from domain knowledge + code analysis)

## Executive Summary

PlanificadorClases is a single-user, client-only course scheduling tool for Chilean university professors. The app already ships a working baseline (course form, session generation, holiday skipping, Excel/PDF export, localStorage persistence, dark/light mode). The current milestone is a quality and correctness upgrade: extract the scheduling algorithm into a testable pure function, wire in a live holiday API with offline fallback, enforce the currently-ignored `sessionsPerWeek` cap, and add input validation that prevents silent garbage output. This is additive work on an existing codebase — the recommended approach is strict layering: pure logic first, hooks second, UI last.

The recommended stack is Vitest + React Testing Library + MSW, integrated into the existing Vite 7 config with zero additional tooling overhead. No new production dependencies are needed beyond the test infrastructure. The holiday API (`nager.date`) is consumed via a hand-rolled `useHolidays` hook with localStorage caching — TanStack Query and SWR are both overkill for a single endpoint. The architectural pattern is three focused custom hooks (`useCourseData`, `useHolidays`, `useSchedule`) composing in App.jsx, with all scheduling logic extracted to a pure function in `src/logic/scheduler.js`.

The primary risk is the existing tight coupling between the scheduling algorithm and React component state: `calculateSchedule` is currently a `useCallback` that calls `setSchedule()` internally, which makes it impossible to unit test without mounting the full component. Every other improvement in this milestone depends on solving that problem first. A secondary risk is the timezone bug (`toISOString()` returns UTC, not local time) that causes holiday lookups to shift by one day for Chilean professors — this is currently masked in testing environments but will surface in production in Chile. Both risks are addressed by the recommended build order.

---

## Key Findings

### Recommended Stack

The existing stack (React 18.3.1, Vite 7.3.1, Tailwind CSS 3.4.13) requires no production changes. The only additions are test infrastructure as devDependencies. Vitest is the unambiguous choice for a Vite project — it runs inside the Vite pipeline, inheriting all transforms and config without a separate Babel setup that Jest would require. MSW v2 intercepts fetch at the network level, enabling realistic tests for `useHolidays` without modifying production code. No data-fetching library is warranted for a single API endpoint.

**Core technologies:**
- `vitest ^2.1`: Test runner — native Vite integration, zero config conflict, same ESM pipeline
- `@testing-library/react ^16.0`: Component testing — React 18 compatible, tests user-visible behavior
- `@testing-library/user-event ^14.5`: Interaction simulation — realistic events for form testing
- `@testing-library/jest-dom ^6.4`: DOM matchers — cleaner assertions than raw `expect`
- `msw ^2.4`: API mocking — intercepts at network level, no production code modification
- `jsdom ^25`: DOM environment — standard Vitest environment for component tests
- Native `fetch` + `localStorage`: Holiday caching — no library needed for one endpoint

**Critical version notes:** MSW v2 uses `http.*` handlers (not `rest.*` from v1). RTL v16 uses `createRoot` for React 18. SheetJS above `0.18.x` has a non-free license — do not upgrade without verifying.

### Expected Features

The existing baseline is complete and working. The research identifies correctness gaps that actively mislead professors if left unfixed, plus UX gaps that erode trust.

**Must have (table stakes — blocks correctness or trust):**
- Input validation with inline error messages — `hoursPerSession: 0` currently produces silent garbage output
- Holiday API with localStorage cache and per-year-keyed fallback warning — 2026 hardcode is already a live bug for any 2027+ course
- Export metadata header (course name, semester, professor, email) — professors submit these to administrative offices
- Dark mode and view mode persistence across page loads — expected behavior, currently missing
- `sessionsPerWeek` hard cap enforced in algorithm — visible form field that currently does nothing destroys form credibility

**Should have (high value, fits milestone scope):**
- App.jsx refactor into `scheduler.js` pure function + three custom hooks — prerequisite for test suite and cleaner feature additions
- Vitest test suite for scheduling logic and hooks — correctness guarantee for algorithm
- Configurable recovery extra minutes (replaces hardcoded +30 min assumption)

**Defer to next milestone:**
- Makeup/ad-hoc reposition sessions (`makeupDates[]` array) — useful but adds state complexity, easier after refactor stabilizes
- Multi-course scheduling, drag-and-drop reordering, user accounts — out of scope per PROJECT.md constraints

### Architecture Approach

The codebase requires a decomposition from a 360-line monolith (`App.jsx` with embedded algorithm, state, effects, and UI) into a four-layer structure: presentation components (unchanged), orchestration (`App.jsx` slimmed to ~80 lines composing hooks), custom hooks (React lifecycle + state), and a pure logic layer (no React). This is a standard React refactor pattern with well-understood tradeoffs. The key insight is that the current coupling between `calculateSchedule` and `setSchedule` creates a single point of failure for testability — fixing it unlocks every other improvement.

**Major components:**
1. `src/logic/scheduler.js` (new) — pure `calculateSchedule(courseData, holidays)` function; the primary Vitest test target; zero React dependencies
2. `src/hooks/useCourseData.js` (new) — owns courseData state, localStorage persistence, all form field mutation handlers
3. `src/hooks/useHolidays.js` (new) — fetches nager.date per year, caches in localStorage keyed by year, returns `{ holidays, status }` with fallback chain
4. `src/hooks/useSchedule.js` (new) — reactive shell: calls `calculateSchedule` when courseData or holidays change, owns `schedule[]` state
5. `src/services/holidayApi.js` (new) — plain async fetch wrapper; isolated from React so it can be mocked in tests
6. `App.jsx` (slimmed) — composes hooks, derives stats via `useMemo`, renders layout, owns only `darkMode`/`viewMode` UI state
7. Existing components (`CourseForm`, `ScheduleList`, `CalendarGrid`) — props-only, no state, no side effects; unchanged

### Critical Pitfalls

1. **Algorithm untestable as `useCallback`** — Extract `calculateSchedule` to `src/logic/scheduler.js` (pure function, no React) before writing any tests. If tests are written first against `App`, they must be rewritten after extraction. This is the highest-priority prerequisite.

2. **Timezone off-by-one in `dateStr`** — `date.toISOString().split('T')[0]` returns the previous calendar day for Chilean UTC-3 timezone. Replace with `toLocalDateStr(d)` using `d.getFullYear()`, `d.getMonth()`, `d.getDate()`. Write a Vitest test that explicitly constructs dates at UTC-3 offset.

3. **`sessionsPerWeek` week-boundary edge cases** — Implementing the cap using `Math.floor(daysSinceStart / 7)` produces wrong results at year/month boundaries. Use a `Map<weekKey, count>` with week key derived from the Monday-anchor of each calendar week. Test with `sessionsPerWeek: 1`, two `classDays`, course spanning December/January.

4. **Offline fallback returning wrong-year holidays** — Cache keys must be year-specific (`holidays_CL_2026`, not `holidays_CL`). When a fetch fails and no cache exists for the requested year, return empty array + visible warning banner. Never silently fall back to a different year's data.

5. **localStorage hydration timing in hook tests** — Every hook test that relies on persisted state must call `localStorage.setItem(...)` in `beforeEach` and `localStorage.clear()` in `afterEach`. Tests must be written alongside extraction, not deferred, or suite-order-dependent failures will appear.

---

## Implications for Roadmap

Based on the dependency graph surfaced in ARCHITECTURE.md and FEATURES.md, six sequential phases are recommended. The ordering is not arbitrary — each phase unlocks the next and reduces risk at integration points.

### Phase 1: Algorithm Extraction and Pure Logic Foundation
**Rationale:** Every other phase depends on `calculateSchedule` being a pure function. Tests cannot be written against the current `useCallback` form. The `sessionsPerWeek` cap and holiday integration both require the algorithm to accept all inputs as parameters. This is the critical path item.
**Delivers:** `src/logic/scheduler.js` with `calculateSchedule(courseData, holidays)` and `isDateExcluded(date, holidays, customExcluded)` as independently importable functions. `App.jsx` wired to call the extracted function — behavior unchanged.
**Addresses:** sessionsPerWeek cap can be added here as part of the extraction (it's an algorithm change, not a UI change).
**Avoids:** Pitfall 1 (untestable algorithm), Pitfall 3 (stale closure on holiday state).

### Phase 2: Test Infrastructure and Algorithm Coverage
**Rationale:** Pure functions in `scheduler.js` can now be tested without React rendering. Establishing the test suite immediately after extraction validates that the refactor preserved behavior and catches the timezone bug before it reaches production.
**Delivers:** Vitest configured in `vite.config.js`, `src/test/setup.js`, unit tests for `calculateSchedule` (session count, hour accumulation, holiday skipping, weekly cap, year-boundary weeks), `getEffectiveHours`, and `isDateExcluded`. Timezone test explicitly covering UTC-3 dates.
**Uses:** vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom, msw (all devDependencies)
**Avoids:** Pitfall 2 (timezone bug caught here), Pitfall 4 (sessionsPerWeek boundary cases caught here).

### Phase 3: Hook Extraction (useCourseData + useSchedule)
**Rationale:** With the algorithm pure and tested, App.jsx state can be safely extracted into hooks. This phase slims App.jsx by ~200 lines and makes state management independently testable via `renderHook()`.
**Delivers:** `useCourseData` (form state + localStorage persistence + handlers), `useSchedule` (reactive algorithm invocation), `App.jsx` reduced to orchestration and layout. `darkMode` and `viewMode` localStorage persistence added here (low effort, high trust impact).
**Avoids:** Pitfall 6 (localStorage hydration — tests written alongside extraction with proper `beforeEach`/`afterEach`).

### Phase 4: Holiday API Integration (useHolidays)
**Rationale:** Holiday API is the highest-risk correctness issue (silent 2026 hardcode breaks for any 2027+ course), but it requires hook infrastructure (Phase 3) to land cleanly. With MSW available from Phase 2, the hook can be tested in isolation before wiring into the app.
**Delivers:** `services/holidayApi.js`, `useHolidays(years[])` hook with three-tier fallback (cache → fetch → empty + warning), per-year localStorage keys, multi-year fetch via `Promise.all` for courses spanning year boundaries, visible warning banner when API fails and cache is cold.
**Avoids:** Pitfall 5 (wrong-year fallback — year-keyed cache required upfront), Pitfall 3 (stale closure — holidays passed as parameter to scheduler, not closed over).

### Phase 5: Input Validation and UX Correctness
**Rationale:** With the algorithm, hooks, and API integration stable, UI-level validation and UX corrections can be added without risk of breaking underlying logic. Validation prevents bad inputs from reaching the algorithm.
**Delivers:** Inline validation for all numeric fields (totalHours, hoursPerSession, sessionsPerWeek), required-field checks (startDate, classDays), schedule generation blocked while inputs invalid. Export metadata header (course name, semester, professor, email). Configurable recovery extra minutes replacing hardcoded +30 min. UX corrections: empty-state message when startDate is blank, conditional recovery footer.
**Addresses:** All P1 and P2 features from FEATURES.md that are not algorithm or API work.

### Phase 6: Export Hardening and Dependency Cleanup
**Rationale:** Deferred technical debt that does not block correctness but reduces fragility. CDN-loaded SheetJS is a live availability risk. Export metadata is a professor-facing trust item.
**Delivers:** `xlsx` migrated from CDN to npm package (pinned to `^0.18.5` — verify license boundary before upgrading). Export filename includes timestamp when course name is blank. Final component test coverage for form submission and export button state.

### Phase Ordering Rationale

- **Extraction before tests:** Tests written against the current `useCallback` structure would need to be completely rewritten after extraction. Phase 1 before Phase 2 is non-negotiable.
- **Hooks before API:** The `useHolidays` hook composes with `useSchedule`, which itself depends on the hook extraction in Phase 3. Attempting API integration before hooks are extracted forces temporary coupling.
- **Validation after algorithm:** Input validation depends on knowing which inputs matter to the algorithm. Extracting the algorithm first makes the validation surface clear.
- **Export cleanup last:** No other feature depends on the SheetJS CDN migration. It is a risk reduction item, not a user-facing correctness item.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Holiday API):** Verify nager.date response shape (`localName` vs `name` field), CORS header presence, and 404 behavior for far-future years before writing the fetch wrapper. The API is well-known but response validation matters for a correctness-critical feature.
- **Phase 6 (SheetJS migration):** Confirm the exact version boundary for the SheetJS license change (training data says `0.18.x` is the last free version, but this must be verified at npmjs.com before pinning).

Phases with standard patterns (skip research-phase):
- **Phase 1 (Algorithm extraction):** Standard pure-function extraction pattern; no external dependencies.
- **Phase 2 (Vitest setup):** Vite + Vitest integration is fully documented and stable; msw v2 patterns are well-established.
- **Phase 3 (Hook extraction):** Standard custom hook decomposition pattern; no novel integration.
- **Phase 5 (Validation/UX):** HTML5 form validation patterns + React controlled input patterns; no research needed.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Vitest/RTL/MSW recommendations are HIGH confidence. Vite 7 + Vitest 2 compatibility is MEDIUM (Vite 7 is beyond training data cutoff — verify at install time). SheetJS license boundary is MEDIUM. |
| Features | MEDIUM | Based on codebase analysis and Chilean academic domain knowledge. Web search unavailable during research. Core correctness features (validation, holiday API, sessionsPerWeek) are unambiguous. Makeup sessions priority is a judgment call. |
| Architecture | HIGH | Based on direct codebase inspection. React hook decomposition patterns are well-established. Build order derives from clear dependency graph. |
| Pitfalls | HIGH | Five of six critical pitfalls identified from direct code inspection (specific line numbers cited in PITFALLS.md). Timezone bug (`toISOString()` UTC behavior) is ECMA-262 specified — not a research inference. |

**Overall confidence:** HIGH

### Gaps to Address

- **nager.date API response validation:** The `localName` field (Spanish name for Chilean holidays) vs `name` field (English) must be verified against the live endpoint during Phase 4 implementation. Using the wrong field produces English holiday names in a Spanish-language UI.
- **Vite 7 + Vitest 2 compatibility:** Confirmed conceptually but Vite 7 post-dates training data. Run `npm install vitest@^2.1` and verify no compatibility warnings before committing to the full test infrastructure.
- **sessionsPerWeek ISO week calculation:** The correct week-key formula (Monday-anchor vs ISO week number) should be validated with edge-case Vitest tests early in Phase 2 before the rest of the test suite is built on top of it.
- **xlsx CDN vs npm:** The existing codebase has an xlsx CDN entry — exact location (index.html vs package.json) should be confirmed before Phase 6 migration.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/App.jsx`, `src/logic/utils.js`, `src/logic/constants.js`, `src/components/` — architecture, pitfalls, and feature analysis
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md` — existing architectural documentation
- `.planning/PROJECT.md` — requirements, constraints, milestone scope
- ECMA-262 specification — `Date.prototype.toISOString()` UTC-only behavior (timezone pitfall)
- React documentation — custom hooks, `useCallback` exhaustive-deps, `useState` lazy initializer behavior

### Secondary (MEDIUM confidence)
- Vitest documentation (training data, Aug 2025 cutoff) — test runner setup, `renderHook`, MSW v2 patterns
- nager.date public API (training data) — endpoint structure, response shape, Chile (CL) support, 404 behavior for far-future years
- SheetJS changelog (training data) — license change boundary at `0.18.x`

### Tertiary (LOW confidence — verify during implementation)
- nager.date live API response: `localName` field name and Spanish content for CL — verify against live endpoint
- Vite 7 + Vitest 2 compatibility — verify at `npm install` time

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
