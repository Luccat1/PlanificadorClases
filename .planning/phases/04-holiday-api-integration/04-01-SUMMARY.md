---
phase: 04-holiday-api-integration
plan: "01"
subsystem: services
tags: [holiday-api, msw, tdd, localStorage, caching]
dependency_graph:
  requires: []
  provides: [fetchHolidaysForYear, msw-handler-nager-date]
  affects: [src/mocks/handlers.js, src/services/holidayApi.js]
tech_stack:
  added: []
  patterns: [pure-async-service, localStorage-cache, msw-handler, tdd-red-green]
key_files:
  created:
    - src/services/holidayApi.js
    - src/services/__tests__/holidayApi.test.js
  modified:
    - src/mocks/handlers.js
decisions:
  - "localName (Spanish) used for holiday name field, not English name field"
  - "global:false regional holidays filtered out nationally (e.g., Arica-only Morro de Arica battle)"
  - "corrupt localStorage cache silently falls through to fetch — non-crashing recovery"
  - "localStorage setItem failure is also non-fatal — schedule generation proceeds without caching"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
requirements:
  - ARCH-04
---

# Phase 04 Plan 01: Holiday API Service Layer Summary

## One-liner

Pure async `fetchHolidaysForYear` service with localStorage caching using nager.date API, Spanish holiday names (localName), and MSW handler fixtures for 2026-2027.

## What Was Built

Created the holiday API service layer (`src/services/holidayApi.js`) via TDD: wrote 6 failing tests first, then implemented the minimal code to pass all of them.

**Service contract (`fetchHolidaysForYear(year)`):**
- Returns `{ holidays: Array<{date, name}>, fromCache: boolean }`
- Cache hit: reads from `localStorage` key `holidays_CL_{year}`, returns `fromCache: true`
- Cache miss: fetches `https://date.nager.at/api/v3/publicholidays/{year}/CL`, filters `global===true`, maps `localName` to `name`, writes to cache, returns `fromCache: false`
- API error: propagates the throw (rejects the promise)
- Corrupt cache: silently catches JSON.parse error and falls through to fetch

**MSW handler (`src/mocks/handlers.js`):**
- Intercepts `GET https://date.nager.at/api/v3/publicholidays/:year/CL`
- Returns realistic fixture data for 2026 (16 entries including one `global:false` Arica entry) and 2027 (15 entries)
- Returns empty array for any other year

## Tests

All 6 unit tests pass:
1. Fetches from API and returns mapped holidays using Spanish localName
2. Returns `fromCache:true` and skips network on cache hit
3. Writes holidays to localStorage after successful fetch
4. Filters out `global:false` regional holidays
5. Throws when API returns error status
6. Recovers from corrupt localStorage and fetches from API

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The service is fully functional. It will be wired into React state in a subsequent plan.

## Self-Check: PASSED

- `src/services/holidayApi.js` exists with `export async function fetchHolidaysForYear(`
- `src/mocks/handlers.js` contains `http.get('https://date.nager.at/api/v3/publicholidays/:year/CL'`
- `src/services/__tests__/holidayApi.test.js` contains 6 `it(` blocks
- `holidays_CL_` key pattern present in holidayApi.js
- `h.localName` mapping present in holidayApi.js
- `h.global === true` filter present in holidayApi.js
- All 6 tests pass: `npm test -- --run src/services` exits 0
- Commits: `2111d26` (RED), `3e9eb05` (GREEN) both exist in git log
