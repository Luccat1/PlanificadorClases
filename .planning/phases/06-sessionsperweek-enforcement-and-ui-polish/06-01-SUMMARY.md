---
phase: 06-sessionsperweek-enforcement-and-ui-polish
plan: 01
subsystem: scheduling
tags: [react, vitest, scheduleEngine, useCourseData, perDayHours, sessionsPerWeek]

requires:
  - phase: 05-validation-export-and-ux
    provides: INITIAL_COURSE_DATA with D-12 fields and merge pattern

provides:
  - sessionsPerWeek default changed to 0 (no cap) in INITIAL_COURSE_DATA
  - perDayHours:{} field added to INITIAL_COURSE_DATA
  - calculateSchedule resolves per-session effective hours from perDayHours map

affects:
  - 06-02 (UI for sessionsPerWeek field — reads default from useCourseData)
  - 06-03 (UI for perDayHours — depends on field in INITIAL_COURSE_DATA and engine branch)
  - any future plan reading courseData.perDayHours or courseData.sessionsPerWeek

tech-stack:
  added: []
  patterns:
    - "perDayHours branch in calculateSchedule: per-session baseHours resolved before effDay/effDayRecovery"
    - "TDD RED-GREEN-FIX: new test file per plan to avoid modifying existing test fixtures directly"

key-files:
  created:
    - src/hooks/__tests__/useCourseData.phase6.test.js
    - src/logic/__tests__/calculateSchedule.perDayHours.test.js
  modified:
    - src/hooks/useCourseData.js
    - src/hooks/__tests__/useCourseData.test.js
    - src/logic/scheduleEngine.js

key-decisions:
  - "perDayHours branch placed inside while loop per-session (not pre-computed at top) to allow different durations per weekday"
  - "effRecovery removed from top-level scope — per-session effDayRecovery replaces it; effNormal kept for effNormal<=0 guard"
  - "Existing test INITIAL fixture updated to match new sessionsPerWeek:0 and perDayHours:{} defaults (backwards-compat)"

patterns-established:
  - "Per-session hasPerDay check: Object.keys(perDayHours).length > 0 && perDayHours[dayKey] != null"
  - "baseHours ternary: hasPerDay ? perDayHours[dayKey] : courseData.hoursPerSession"

requirements-completed: [D-02, D-12]

duration: 13min
completed: 2026-04-13
---

# Phase 6 Plan 01: Data Model Updates for sessionsPerWeek and perDayHours Summary

**sessionsPerWeek default changed to 0 (no cap) and perDayHours map added to INITIAL_COURSE_DATA; calculateSchedule resolves per-weekday hours via perDayHours branch with full backwards compatibility**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-04-13T18:47:32Z
- **Completed:** 2026-04-13T18:55:00Z
- **Tasks:** 2 (TDD: 4 commits total — 2 RED + 2 GREEN, plus 1 lint fix)
- **Files modified:** 5

## Accomplishments

- Changed `sessionsPerWeek` default from 2 to 0 in `INITIAL_COURSE_DATA` — existing users with saved value keep it; new users get uncapped behavior
- Added `perDayHours: {}` to `INITIAL_COURSE_DATA` — old localStorage blobs get `{}` as default via the spread merge pattern
- Added `perDayHours` branch inside `calculateSchedule` while loop — each session now resolves its own `baseHours`, `effDay`, and `effDayRecovery` from the per-day map; when map is empty the behavior is identical to before
- All 104 tests pass (up from 87 pre-phase-6, 9 new tests added in this plan)

## Task Commits

Each task was committed atomically (TDD: test → feat pattern):

1. **Task 1 RED: failing tests for useCourseData defaults** - `519a07c` (test)
2. **Task 1 GREEN: update INITIAL_COURSE_DATA** - `6ce540b` (feat)
3. **Task 2 RED: failing tests for perDayHours branch** - `ce6f6d5` (test)
4. **Task 2 GREEN: add perDayHours branch to calculateSchedule** - `66b92b0` (feat)
5. **Lint fix: remove unused effRecovery** - `1ed1343` (fix)

_Note: TDD tasks have multiple commits (test → feat). Lint fix committed separately._

## Files Created/Modified

- `src/hooks/useCourseData.js` - sessionsPerWeek:0, perDayHours:{} in INITIAL_COURSE_DATA
- `src/hooks/__tests__/useCourseData.test.js` - INITIAL fixture updated to match new defaults
- `src/hooks/__tests__/useCourseData.phase6.test.js` - New: 8 tests for sessionsPerWeek and perDayHours defaults
- `src/logic/scheduleEngine.js` - perDayHours branch added; effRecovery removed (replaced by per-session effDayRecovery)
- `src/logic/__tests__/calculateSchedule.perDayHours.test.js` - New: 8 tests for per-day hours engine behavior

## Decisions Made

- `effRecovery` removed from the function-level scope since all per-session resolution now uses `effDayRecovery` (computed inline). `effNormal` kept for the `if (effNormal <= 0) return []` guard.
- Existing test file's `INITIAL` fixture updated from `sessionsPerWeek: 2` to `sessionsPerWeek: 0` (and added `perDayHours: {}`) — this is the correct approach since the fixture mirrors INITIAL_COURSE_DATA.
- New test files (`*.phase6.test.js`, `*.perDayHours.test.js`) created separately rather than adding to existing files — preserves clear audit trail for TDD RED commits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused effRecovery variable causing lint error**
- **Found during:** Task 2 verification (`npm run lint`)
- **Issue:** Plan said to keep `effRecovery` as fallback, but it is truly unreachable — `effDayRecovery` handles all recovery paths. ESLint flagged `no-unused-vars` error.
- **Fix:** Removed the `effRecovery` declaration (lines 69-72). The `effNormal` variable is still used for the guard clause.
- **Files modified:** `src/logic/scheduleEngine.js`
- **Verification:** `npm run lint` exits 0, `npm test` exits 0 (104 tests pass)
- **Committed in:** `1ed1343` (separate lint fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - lint/unused variable)
**Impact on plan:** Necessary for `npm run lint` to pass (plan verification step). No scope change.

## Issues Encountered

None — plan executed as described. The lint deviation was a minor consequence of the implementation removing all use-sites of `effRecovery`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `perDayHours` and `sessionsPerWeek: 0` are now in INITIAL_COURSE_DATA and engine — Wave 2 UI plans can safely add form controls that read/write these fields.
- No blockers for plans 06-02 and 06-03.

---
*Phase: 06-sessionsperweek-enforcement-and-ui-polish*
*Completed: 2026-04-13*

## Self-Check: PASSED

- src/hooks/useCourseData.js — FOUND
- src/logic/scheduleEngine.js — FOUND
- src/hooks/__tests__/useCourseData.phase6.test.js — FOUND
- src/logic/__tests__/calculateSchedule.perDayHours.test.js — FOUND
- .planning/phases/06-sessionsperweek-enforcement-and-ui-polish/06-01-SUMMARY.md — FOUND
- Commit 519a07c — FOUND
- Commit 6ce540b — FOUND
- Commit ce6f6d5 — FOUND
- Commit 66b92b0 — FOUND
- Commit 1ed1343 — FOUND
