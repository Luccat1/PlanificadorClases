# Phase 2: Test Infrastructure - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Install Vitest + React Testing Library + MSW, configure the test runner, and write the unit and component tests that validate Phase 1's extracted scheduling logic. The output is a working `npm test` command and a `npm run test:coverage` report — not any application feature changes.

</domain>

<decisions>
## Implementation Decisions

### Test Runner Setup
- **D-01:** Vitest is the test runner (already decided — native Vite integration, zero config conflict). Configure inside `vite.config.js` under `test:` key with `environment: 'jsdom'`.
- **D-02:** `@vitest/coverage-v8` for coverage. Add `npm test` and `npm run test:coverage` scripts to `package.json`. Coverage generates a report only — no minimum threshold enforced.

### Test File Organization
- **D-03:** Co-located `__tests__/` directories. Logic tests go in `src/logic/__tests__/`, component tests in `src/components/__tests__/`. Test files named `{subject}.test.{js,jsx}`.

### MSW Setup
- **D-04:** Install MSW in Phase 2 as part of the test infrastructure foundation (minimal scaffold). Install the `msw` package, create `src/mocks/handlers.js` (empty array export) and `src/mocks/server.js` (MSW Node server for tests) wired into the Vitest setup file. No active handlers yet — Phase 4 adds the holiday API handlers when needed.

### Coverage
- **D-05:** `npm run test:coverage` generates a report (stdout + `coverage/` directory) with no enforced threshold. Thresholds can be added later once baseline is established.

### Claude's Discretion
- Exact Vitest config options (globals, include patterns, exclude patterns) — Claude decides based on project structure
- Whether to use `describe`/`it` or `test` naming convention inside test files
- Setup file name and location (e.g., `src/test-setup.js`)
- MSW server.js lifecycle hooks (beforeAll/afterEach/afterAll) — standard RTL pattern applies

</decisions>

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
- `vite.config.js` — must be extended (not replaced) with `test:` block
- `package.json` — add `test` and `test:coverage` scripts

### Requirements
- `.planning/REQUIREMENTS.md` §Testing (TEST-01 through TEST-07) — all seven must be satisfied

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/logic/scheduleEngine.js` — pure functions with no React imports; ideal for unit testing without mocks
- `src/components/CourseForm.jsx` — accepts all state as props (`courseData`, `onInputChange`, `onDayToggle`, `onAddDate`, `onRemoveDate`) — straightforward to render in isolation with mock props

### Established Patterns
- No existing test patterns — Phase 2 establishes the project standard
- Props-down pattern in components (CourseForm, ScheduleList) makes shallow rendering practical
- ESM modules (`"type": "module"` in package.json) — Vitest handles this natively

### Integration Points
- `vite.config.js` — the `test:` block extends the existing config (base: './' and react plugin must stay)
- `package.json` scripts — append `test` and `test:coverage`; do not modify existing scripts

</code_context>

<specifics>
## Specific Ideas

- TEST-05 (timezone): Must construct dates as `new Date(year, month, day)` using local constructors (not `new Date('YYYY-MM-DD')` which parses as UTC midnight) — this is the exact pattern that `toLocalDateStr` in `scheduleEngine.js` was designed for. The test should explicitly verify a session date is correct when the system timezone is UTC-3.
- The STATE.md blocker: "Timezone bug in `date.toISOString()` must be fixed during algorithm extraction — fix must be validated in Phase 2 with an explicit UTC-3 test" — TEST-05 is the validation gate for this.
- sessionsPerWeek edge case (TEST-04): must cover year-boundary case where a course spans December/January with `sessionsPerWeek: 1`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-test-infrastructure*
*Context gathered: 2026-03-26*
