# Testing

## Testing Strategy
**No automated tests present.** The project has zero test files. There is no test framework configured.

## Test Frameworks
None configured. No Jest, Vitest, Cypress, or other testing library in `package.json`.

## Coverage
- 0% automated test coverage
- Manual testing only (run `npm run dev` and interact in browser)

## Test Patterns
N/A — no tests exist.

## Running Tests
No `test` script configured in `package.json`. Running `npm test` would fail.

## Testing Gap Summary
The entire scheduling algorithm (`calculateSchedule` in `App.jsx:81`) is untested. Given its complexity (holiday detection, hour type conversion, recovery sessions, mid-course marker), this is the highest-risk untested area. Logic utilities in `src/logic/utils.js` (`getEffectiveHours`, `formatDateLong`, `getHolidayName`) are pure functions well-suited to unit testing.
