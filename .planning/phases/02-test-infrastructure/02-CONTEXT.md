# Phase 2: Test Infrastructure - Context

**Gathered:** 2026-03-26 (updated)
**Status:** Ready for planning

<domain>
## Phase Boundary

Install Vitest + React Testing Library + MSW, configure the test runner, and write the unit and component tests that validate Phase 1's extracted scheduling logic. The output is a working `npm test` command and a `npm run test:coverage` report — not any application feature changes.

</domain>

<decisions>
## Implementation Decisions

### Test Runner Setup
- **D-01:** Vitest 3 is the test runner (Vitest 3.x targets Vite 5+ and is forward-compatible with Vite 7.3.1). Install `vitest@3` and `@vitest/coverage-v8@3`. Researcher must confirm exact peer-dep requirements for Vite 7 compatibility before pinning.
- **D-02:** Configure inside `vite.config.js` under the `test:` key with `environment: 'jsdom'`. Do not create a separate vitest config file — extend the existing config.
- **D-03:** Add `npm test` and `npm run test:coverage` scripts to `package.json`. Coverage generates a report only (stdout + `coverage/` directory) — no minimum threshold enforced.

### RTL and Extended Matchers
- **D-04:** Install `@testing-library/react` and `@testing-library/user-event` for component tests.
- **D-05:** Install `@testing-library/jest-dom` for extended DOM matchers (`toBeInTheDocument`, `toHaveValue`, `toBeDisabled`, etc.). Import in the Vitest global setup file so matchers are available in all tests without explicit imports.

### Test File Organization
- **D-06:** Co-located `__tests__/` directories. Logic tests go in `src/logic/__tests__/`, component tests in `src/components/__tests__/`. Test files named `{subject}.test.{js,jsx}`.

### Component Test Scope
- **D-07:** Phase 2 tests CourseForm (TEST-06) and ScheduleList (TEST-07) only. CalendarGrid is a display-only component and is NOT tested in Phase 2.

### Component Test Interaction Approach
- **D-08:** CourseForm tests use a small wrapper component that holds real state (same pattern as actual usage in App.jsx). Fire `userEvent.type` / `userEvent.clear` to trigger input changes, then assert displayed validation error messages. This tests the full input → state → render flow rather than just static props.

### MSW Setup
- **D-09:** Install MSW in Phase 2 as part of the test infrastructure foundation (minimal scaffold only). Create `src/mocks/handlers.js` (empty array export) and `src/mocks/server.js` (MSW Node server wired into the Vitest setup file with standard beforeAll/afterEach/afterAll lifecycle). No active handlers yet — Phase 4 adds the nager.date holiday API handlers when needed.

### Coverage
- **D-10:** `npm run test:coverage` generates a report (stdout + `coverage/` directory) with no enforced threshold. Thresholds can be added later once baseline is established.

### Claude's Discretion
- Exact Vitest config options (globals, include patterns, exclude patterns) — Claude decides based on project structure
- Whether to use `describe`/`it` or `test` naming convention inside test files
- Setup file name and location (e.g., `src/test-setup.js`)
- MSW server.js lifecycle hooks — standard RTL pattern applies
- Whether to add `data-testid` attributes to components or use semantic `getByRole` / `getByLabelText` queries (prefer semantic queries where feasible)

</decisions>

<specifics>
## Specific Ideas

- **TEST-05 (timezone):** Must construct dates as `new Date(year, month, day)` using local constructors (not `new Date('YYYY-MM-DD')` which parses as UTC midnight). The test should explicitly verify a session date is correct when the system timezone is UTC-3. This is the validation gate for the `toLocalDateStr` fix from Phase 1.
- **TEST-04 (sessionsPerWeek year boundary):** Must cover a course spanning December/January with `sessionsPerWeek: 1`. The Mon–Sun week key rollover at year boundaries is the edge case.
- **@testing-library/jest-dom setup:** Import via the Vitest setup file so `expect.extend(matchers)` is called once globally — not imported per test file.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Under Test
- `src/logic/scheduleEngine.js` — `calculateSchedule`, `getEffectiveHours` (re-exported), `isDateExcluded` — the pure functions being tested
- `src/logic/utils.js` — `getEffectiveHours` origin
- `src/logic/constants.js` — `DAY_MAPPING`, `DAY_NAMES` — constants used by the algorithm
- `src/components/CourseForm.jsx` — component under test (TEST-06)
- `src/components/ScheduleList.jsx` — component under test (TEST-07)

### Project Config
- `vite.config.js` — must be extended (not replaced) with `test:` block; `base: './'` and `react` plugin must be preserved
- `package.json` — add `test` and `test:coverage` scripts only; do not modify existing scripts

### Requirements
- `.planning/REQUIREMENTS.md` §Testing (TEST-01 through TEST-07) — all seven must be satisfied

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/logic/scheduleEngine.js` — pure functions with no React imports; ideal for unit testing without mocks
- `src/components/CourseForm.jsx` — accepts all state as props (`courseData`, `onInputChange`, `onDayToggle`, `onAddDate`, `onRemoveDate`) — testable via wrapper component pattern (D-08)
- `src/components/ScheduleList.jsx` — accepts `schedule` array as prop — straightforward to render with mock schedule data

### Established Patterns
- No existing test patterns — Phase 2 establishes the project standard
- Props-down pattern in all components (CourseForm, ScheduleList, CalendarGrid) makes wrapper-based testing practical
- ESM modules (`"type": "module"` in package.json) — Vitest handles this natively, no transformation config needed

### Integration Points
- `vite.config.js` — the `test:` block extends the existing config
- `package.json` scripts — append `test` and `test:coverage`; do not modify existing scripts
- Vitest setup file (e.g., `src/test-setup.js`) — wires @testing-library/jest-dom matchers and MSW server lifecycle

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-test-infrastructure*
*Context gathered: 2026-03-26 (updated)*
