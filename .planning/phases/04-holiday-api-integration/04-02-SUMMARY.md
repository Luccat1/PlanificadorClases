---
phase: 04-holiday-api-integration
plan: 02
subsystem: hooks
tags: [react-hook, holidays, tdd, multi-year, graceful-degradation]
dependency_graph:
  requires: [04-01]
  provides: [useHolidays-hook]
  affects: [App.jsx-via-plan-03]
tech_stack:
  added: []
  patterns: [React-hook-with-useEffect, Promise.all-multi-year-merge, cancelled-cleanup-flag]
key_files:
  created:
    - src/hooks/useHolidays.js
    - src/hooks/__tests__/useHolidays.test.js
  modified: []
decisions:
  - "Hook accepts only startDate (not endDate) to avoid circular dependency with computed endDate"
  - "Always fetch startYear AND startYear+1 to cover all realistic course lengths without needing endDate"
  - "Promise.all rejection catches any year fetch failure and sets Spanish degradation warning"
  - "cancelled flag prevents state updates after unmount (React 18 best practice)"
metrics:
  duration_seconds: 95
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
requirements:
  - ARCH-04
  - CORT-02
---

# Phase 04 Plan 02: useHolidays Hook Summary

## One-liner

React hook wrapping `fetchHolidaysForYear` with startYear+startYear+1 dual-fetch, multi-year merge, and Spanish graceful-degradation warning on full API/cache failure.

## What Was Built

`src/hooks/useHolidays.js` — the React boundary between the pure `holidayApi.js` service and component state. The hook:

1. Accepts `startDate` (single param, no endDate) to avoid the circular endDate dependency documented in RESEARCH.md.
2. Always fetches `startYear` AND `startYear + 1` — this single strategy covers both single-year and multi-year courses with no special-casing.
3. Merges both years' holiday arrays via `flatMap` into a single `holidays` array returned to the consumer.
4. On any `Promise.all` rejection (network error, API down, cache empty), sets `holidays = []` and `holidayWarning` to a Spanish string containing 'feriados' — enabling UI warning without blocking schedule generation.
5. Uses `cancelled = true` cleanup flag in the `useEffect` return to prevent stale state updates after unmount.

## Tests

6 TDD tests written first (RED), then implementation made them pass (GREEN):

| # | Test | Result |
|---|------|--------|
| 1 | Empty startDate → holidays=[], holidayWarning=null, no fetch | PASS |
| 2 | startDate '2026-03-01' → holidays has both 2026 and 2027 entries | PASS |
| 3 | Merged result contains Año Nuevo 2026-01-01 and 2027-01-01 | PASS |
| 4 | API failure + empty cache → holidays=[], holidayWarning non-null | PASS |
| 5 | holidayWarning contains 'feriados' (Spanish) | PASS |
| 6 | Pre-cached years → network handler never called | PASS |

Full suite: 45 tests, 0 failures.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. The hook is fully wired to the real `fetchHolidaysForYear` service. Plan 03 will consume this hook in `App.jsx`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 (RED) | a8f9392 | test(04-02): add failing tests for useHolidays hook |
| Task 2 (GREEN) | fb03821 | feat(04-02): implement useHolidays hook wrapping fetchHolidaysForYear |

## Self-Check

Verified below.
