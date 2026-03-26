---
phase: 02-test-infrastructure
plan: 02
subsystem: logic/tests
tags: [testing, vitest, unit-tests, scheduling, timezone]
dependency_graph:
  requires: [02-01]
  provides: [TEST-02, TEST-03, TEST-04, TEST-05]
  affects: [src/logic/__tests__]
tech_stack:
  added: []
  patterns: [TDD, vitest globals, toBeCloseTo for floating-point]
key_files:
  created:
    - src/logic/__tests__/getEffectiveHours.test.js
    - src/logic/__tests__/calculateSchedule.test.js
  modified: []
decisions:
  - "Use toBeCloseTo for floating-point hour multiplier assertions (pedagogical 60/45, dgai 60/35)"
  - "Test fixture uses all required courseData fields to prevent unexpected engine behavior"
  - "Year-boundary test anchored on 2026-12-28 (confirmed Monday) to validate Dec/Jan weekKey rollover"
metrics:
  duration: 4 min
  completed: "2026-03-26"
  tasks: 2
  files: 2
---

# Phase 02 Plan 02: Logic Unit Tests Summary

Unit tests for `getEffectiveHours()` and `calculateSchedule()` — 22 tests covering all three hour modes, session scheduling correctness, sessionsPerWeek cap, and timezone UTC-3 regression.

## What Was Built

Two test files covering the logic layer:

**`src/logic/__tests__/getEffectiveHours.test.js`** (8 tests, TEST-02):
- Chronological mode: multiplier 1, zero input
- Pedagogical mode: 60/45 ratio (toBeCloseTo), linear scaling
- DGAI mode: 60/35 ratio (toBeCloseTo), linear scaling
- Unknown/undefined mode: fallback to multiplier 1

**`src/logic/__tests__/calculateSchedule.test.js`** (14 tests, TEST-03, TEST-04, TEST-05):
- TEST-03: empty array for missing startDate/classDays, correct session count (4h/1h=4 sessions), accHours reaches totalHours, holiday skipping, customExcludedDates skipping, mid-course marker at session 2, recovery bonus (+0.5h) and isRecovery flag
- TEST-04: sessionsPerWeek=2 caps Friday when Mon+Wed already scheduled, sessionsPerWeek=0 uncapped, Dec 28 2026 / Jan 4 2027 year-boundary rollover (2 separate week keys)
- TEST-05: dateStr='2026-03-02' not off-by-one (validates toLocalDateStr fix from Phase 1), local date accessors return correct year/month/day

## Decisions Made

- `toBeCloseTo` used for all floating-point assertions (60/45 and 60/35 multipliers) — default 2 decimal places precision is sufficient
- All test fixtures include the complete `base` courseData object (8 fields) — omitting any field produces unexpected engine behavior
- No `import { describe, it, expect } from 'vitest'` — `globals: true` in vite.config.js handles this

## Deviations from Plan

### Auto-fixed Issues

**Worktree was behind main branch**
- Found during: Pre-execution setup
- Issue: Worktree `agent-a7166abc` was at commit `9abdff3` (pre-Phase-1), missing `scheduleEngine.js` and vitest config
- Fix: `git reset --hard main` to bring worktree to latest main commit (`7ccdd63`)
- Files modified: All Phase 1 + Phase 2.01 files brought in
- Commit: N/A (reset, not a code change)

## Known Stubs

None — test files have no stubs. All assertions target real implementation behavior.

## Test Results

```
Test Files  2 passed (2)
     Tests  22 passed (22)
  Duration  ~11s
```

- getEffectiveHours: 8 tests passing (TEST-02 satisfied)
- calculateSchedule: 14 tests passing (TEST-03, TEST-04, TEST-05 satisfied)

## Self-Check: PASSED

- [x] `src/logic/__tests__/getEffectiveHours.test.js` exists
- [x] `src/logic/__tests__/calculateSchedule.test.js` exists
- [x] Commit `997f321` exists (getEffectiveHours tests)
- [x] Commit `8ea7b1a` exists (calculateSchedule tests)
- [x] All 22 tests pass with exit 0
