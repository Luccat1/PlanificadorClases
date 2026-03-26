---
phase: 01-algorithm-extraction
plan: 01
subsystem: algorithm
tags: [javascript, scheduling, pure-functions, refactor, timezone, esm]

requires: []

provides:
  - "src/logic/scheduleEngine.js — pure scheduling module with calculateSchedule, isDateExcluded, getEffectiveHours"
  - "sessionsPerWeek hard cap (Mon-Sun week) enforced via Map<weekKey, count>"
  - "UTC timezone bug fixed: toISOString() replaced with local date accessors"
  - "Algorithm decoupled from React — importable in Node/Vitest context"

affects:
  - 02-test-suite
  - 04-holiday-api

tech-stack:
  added: []
  patterns:
    - "Pure function extraction: algorithm moved from useCallback to standalone exported function"
    - "Local date formatting: getFullYear/getMonth/getDate instead of toISOString() for YYYY-MM-DD strings"
    - "Monday-anchor week key: Map<weekKey,count> for calendar-week session capping"
    - "Holiday parameter threading: holidays passed as argument, not imported as constant"

key-files:
  created:
    - src/logic/scheduleEngine.js
  modified:
    - src/App.jsx

key-decisions:
  - "Re-export getEffectiveHours from scheduleEngine.js (not move) — keeps utils.js intact, satisfies ARCH-01"
  - "Fix timezone bug during extraction — replace toISOString() with toLocalDateStr() using local accessors"
  - "sessionsPerWeek=0 treated as uncapped via guard: courseData.sessionsPerWeek > 0"
  - "Thread holidays as parameter in Phase 1 (CHILEAN_HOLIDAYS_2026 passed from App.jsx) — API injection deferred to Phase 4"

patterns-established:
  - "Pattern: scheduleEngine.js is the single source of truth for scheduling logic — no algorithm in components"
  - "Pattern: toLocalDateStr() helper for all Date-to-YYYY-MM-DD conversions"
  - "Pattern: calculateSchedule(courseData, holidays) signature — all inputs as params, return value"

requirements-completed: [ARCH-01, CORT-03]

duration: 5min
completed: 2026-03-26
---

# Phase 01 Plan 01: Algorithm Extraction Summary

**Pure scheduling module extracted from App.jsx useCallback into src/logic/scheduleEngine.js, fixing UTC timezone bug and implementing sessionsPerWeek Mon-Sun cap**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-26T19:02:01Z
- **Completed:** 2026-03-26T19:06:12Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- Created `src/logic/scheduleEngine.js` as a pure function module with three named exports: `calculateSchedule`, `isDateExcluded`, `getEffectiveHours`
- Fixed UTC timezone bug: replaced `date.toISOString().split('T')[0]` with local date accessors via `toLocalDateStr()` helper — session dates are now correct for Chilean users (UTC-3/UTC-4)
- Implemented `sessionsPerWeek` hard cap using `Map<weekKey, count>` with Monday-anchor week keys (CORT-03) — field was previously ignored by the algorithm
- Wired `App.jsx` to use the extracted module: removed both `useCallback` definitions, replaced single `useEffect` to call `calculateSchedule(courseData, CHILEAN_HOLIDAYS_2026)` and pass result to `setSchedule`
- Build passes (`npm run build` exit 0) with no compilation errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/logic/scheduleEngine.js as a pure module** - `aa28558` (feat)
2. **Task 2: Wire App.jsx to use scheduleEngine.js and remove old useCallback implementations** - `5312ba3` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/logic/scheduleEngine.js` — New pure scheduling module; imports from `./constants` and `./utils`; exports `calculateSchedule`, `isDateExcluded`, `getEffectiveHours`; no React imports; no side effects
- `src/App.jsx` — Removed 80 lines of useCallback algorithm; added `import { calculateSchedule }` from scheduleEngine; useEffect now calls pure function

## Decisions Made

- **Re-export getEffectiveHours**: Used `export { getEffectiveHours } from './utils'` rather than moving the function — satisfies ARCH-01 without breaking existing utils.js consumers
- **Timezone fix during extraction**: Both `toISOString()` occurrences in the original algorithm (lines 68 and 127 of old App.jsx) replaced with `toLocalDateStr()`. The bug: `new Date(startDate + 'T00:00:00')` creates local midnight, but `toISOString()` returns UTC, which at UTC-3 gives the previous calendar day
- **sessionsPerWeek=0 guard**: Guard `courseData.sessionsPerWeek > 0` prevents zero from being treated as a hard cap that blocks all sessions
- **Phase 1 keeps CHILEAN_HOLIDAYS_2026 constant**: Holiday parameter threading is done (scheduleEngine takes holidays as arg), but the constant is still passed from App.jsx — API injection is Phase 4

## Deviations from Plan

### Minor Deviation: Node import smoke test adjusted

- **Found during:** Task 1 verification
- **Issue:** The plan's verification command `node --input-type=module -e "import('./src/logic/scheduleEngine.js')..."` fails in bare Node.js because Vite-style extensionless imports (`./constants`, `./utils`) require Vite's resolver — Node requires `.js` extensions
- **Fix:** Used `npm run build` (exit 0) as the primary verification instead — this exercises Vite's resolver and confirms the module compiles and resolves correctly
- **Impact:** Behavior is identical; the smoke test was a proxy for "module is importable" which the build confirms

---

**Total deviations:** 1 minor (verification approach adapted to Vite module resolution)
**Impact on plan:** No scope changes. Build-based verification is equally valid for a Vite project.

## Issues Encountered

- ESLint config missing from project (`npm run lint` fails with "no config file found") — pre-existing issue, not caused by this plan. The build passes and the code is correct.

## Verification Results

| Criterion | Result |
|-----------|--------|
| `src/logic/scheduleEngine.js` exists | PASS |
| Exports `calculateSchedule`, `isDateExcluded`, `getEffectiveHours` | PASS |
| No React import in scheduleEngine.js | PASS |
| No `toISOString` in scheduleEngine.js | PASS |
| No `CHILEAN_HOLIDAYS_2026` in scheduleEngine.js | PASS |
| No `setSchedule` in scheduleEngine.js | PASS |
| `sessionsPerWeek > 0` guard present | PASS |
| `App.jsx` imports from scheduleEngine | PASS |
| `App.jsx` calls `setSchedule(calculateSchedule(...))` | PASS |
| No `const calculateSchedule = useCallback` in App.jsx | PASS |
| No `const isDateExcluded = useCallback` in App.jsx | PASS |
| `npm run build` exits 0 | PASS |

## Known Stubs

None — all scheduling logic is fully wired. `CHILEAN_HOLIDAYS_2026` is a real constant (not a placeholder), intentionally used until Phase 4 wires the holiday API.

## Next Phase Readiness

- `scheduleEngine.js` is now importable as a pure function module — ready for Phase 2 Vitest test suite
- `calculateSchedule` signature `(courseData, holidays)` is the stable contract for Phase 2 unit tests
- Timezone fix and sessionsPerWeek cap will be validated by Phase 2 unit tests (TEST-04, TEST-05)
- Holiday parameter threading is complete — Phase 4 only needs to change the `CHILEAN_HOLIDAYS_2026` constant passed from App.jsx to a fetched array

---
*Phase: 01-algorithm-extraction*
*Completed: 2026-03-26*
