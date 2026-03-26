# Phase 4: Holiday API Integration - Research

**Researched:** 2026-03-26
**Domain:** Fetch API + localStorage caching + React custom hooks + MSW testing
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-04 | Holiday API fetch and cache logic extracted to `src/services/holidayApi.js` (pure async function) wrapped by `src/hooks/useHolidays.js` hook with year-keyed localStorage caching and fallback | nager.date API confirmed: endpoint, CORS, response shape. localStorage key pattern `holidays_CL_{year}` specified in CORT-02. Hook wraps service per ARCH-04. |
| CORT-02 | Holiday data fetched from nager.date per calendar year, cached in localStorage keyed by year (`holidays_CL_{year}`), non-blocking warning banner when API and cache both fail — schedule generation proceeds using only custom excluded dates | API verified live: `GET https://date.nager.at/api/v3/publicholidays/{year}/CL`. No auth, CORS enabled. Cache key pattern confirmed. Warning banner pattern documented. |
</phase_requirements>

---

## Summary

Phase 4 replaces the hardcoded `CHILEAN_HOLIDAYS_2026` constant with a live fetch from the nager.date public holiday API. The app currently passes that constant directly into `calculateSchedule()` on every render — a one-line call in `App.jsx`. The replacement involves two new files (`src/services/holidayApi.js` and `src/hooks/useHolidays.js`) and surgical wiring in `App.jsx` (or in the `useSchedule` hook from Phase 3, which this phase depends on).

The nager.date API is confirmed working, CORS-enabled, requires no API key, and has no rate limits. The response shape is well-defined. The key implementation decision is multi-year support: a course spanning November 2026 through March 2027 requires fetching two separate API calls (one per year) and merging the results. Both years must be independently cached in localStorage with the `holidays_CL_{year}` key pattern.

The MSW scaffolding installed in Phase 2 (`src/mocks/handlers.js` is currently empty, `src/mocks/server.js` uses `setupServer`) is designed exactly for this use case. Adding MSW handlers for `https://date.nager.at/api/v3/publicholidays/:year/CL` will allow tests to run without real network calls while covering the happy path, offline fallback, and multi-year scenarios.

**Primary recommendation:** Implement `fetchHolidaysForYear(year)` as a pure async function in `src/services/holidayApi.js`, wrap it in `useHolidays(startDate, endDate)` hook that resolves which years are needed, checks localStorage first, fetches any missing years, and exposes `{ holidays, warning }` to the consumer. Keep the service layer free of React — the hook handles state.

## Project Constraints (from CLAUDE.md)

- OS is Windows 11 but shell is Git Bash — use Unix paths in commands
- Stack: React 18, Vite, Tailwind CSS, Lucide React
- `npm run dev` / `npm run build` / `npm test` are the relevant scripts
- No backend, intentionally client-side only (localStorage is the persistence layer)

## Standard Stack

### Core (already installed — no new installs needed for this phase)

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| msw | 2.12.14 | Mock the nager.date API in tests | Already installed in Phase 2; `setupServer` already wired in `test-setup.js` |
| vitest | 3.2.4 | Test runner | Already configured; `jsdom` environment active |
| @testing-library/react | 16.3.2 | Hook and component testing | Already installed; used for `renderHook` |

### External Service (no install)

| Service | URL Pattern | Auth | CORS |
|---------|-------------|------|------|
| nager.date API | `https://date.nager.at/api/v3/publicholidays/{year}/CL` | None | Enabled |

### No new npm packages required.

The project already has `fetch` (browser native), `localStorage` (browser native), React hooks, MSW for mocking, and Vitest + RTL for testing. Nothing additional needs to be installed.

**Version verification:**
```bash
# All packages already installed. Confirmed installed versions:
# msw@2.12.14 (npm view msw version → 2.12.14 is current stable)
# vitest@3.2.4
```

## Architecture Patterns

### Recommended File Structure (additions only)

```
src/
├── services/
│   └── holidayApi.js        # Pure async fetch + localStorage cache logic (ARCH-04)
├── hooks/
│   └── useHolidays.js       # React hook: resolves years, calls service, exposes state (ARCH-04)
│   └── useCourseData.js     # (Phase 3) — useHolidays depends on courseData.startDate
│   └── useSchedule.js       # (Phase 3) — consumes holidays from useHolidays
└── mocks/
    └── handlers.js          # ADD: MSW handler for nager.date endpoint (currently empty array)
```

### Pattern 1: Pure Service Layer — `src/services/holidayApi.js`

**What:** An async function that handles one responsibility — fetch holidays for a single year, using localStorage as cache. No React. No state. Returns a plain object `{ holidays, fromCache }`.

**When to use:** Separating network concerns from hook state keeps the service unit-testable without `renderHook`.

```javascript
// src/services/holidayApi.js
const CACHE_KEY_PREFIX = 'holidays_CL_';

/**
 * Fetches Chilean public holidays for a given year.
 * Checks localStorage first; fetches from nager.date if not cached.
 * @param {number} year
 * @returns {Promise<{ holidays: Array<{date: string, name: string}>, fromCache: boolean }>}
 */
export async function fetchHolidaysForYear(year) {
    const cacheKey = `${CACHE_KEY_PREFIX}${year}`;

    // 1. Check cache first
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            return { holidays: JSON.parse(cached), fromCache: true };
        }
    } catch (_) {
        // localStorage parse error — proceed to fetch
    }

    // 2. Fetch from API
    const response = await fetch(
        `https://date.nager.at/api/v3/publicholidays/${year}/CL`
    );
    if (!response.ok) {
        throw new Error(`nager.date API error: ${response.status}`);
    }
    const raw = await response.json();

    // 3. Map to internal shape { date, name } using localName for Spanish names
    const holidays = raw.map(h => ({ date: h.date, name: h.localName }));

    // 4. Write to cache
    try {
        localStorage.setItem(cacheKey, JSON.stringify(holidays));
    } catch (_) {
        // localStorage full or unavailable — non-fatal
    }

    return { holidays, fromCache: false };
}
```

**Key decision: `localName` vs `name`**
The nager.date API returns two fields:
- `localName`: Spanish (e.g., `"Viernes Santo"`, `"Día del Trabajo"`)
- `name`: English (e.g., `"Good Friday"`, `"Labour Day"`)

The schedule engine uses the holiday name only for display (passed through to `getHolidayName` in `utils.js`). The UI is in Spanish — use `localName`. This resolves the open concern from STATE.md: `[Phase 4]: Verify nager.date localName vs name field for Spanish holiday names before writing fetch wrapper`. **Use `localName`.**

**Confirmed live data (2026/CL):**
- `Año Nuevo` — 2026-01-01 (localName matches CHILEAN_HOLIDAYS_2026 constant)
- `Día del Trabajo` — 2026-05-01 (note: API uses "Trabajo" vs. constant's "Trabajador" — minor discrepancy, not functionally significant)
- `Viernes Santo`, `Sábado Santo`, regional holiday for Arica (CL-AP, `global: false`)

**Important:** The API includes one regional holiday (`2026-06-07`, Asalto y Toma del Morro de Arica, `global: false`, `counties: ["CL-AP"]`). The planner must decide whether to filter to `global: true` only. For a scheduler targeting all Chilean professors, filtering to `global === true` is the safer default — regional holidays should not block scheduling nationally. However, CORT-02 and ARCH-04 do not specify this. **Recommend: filter `global === true` only, or include all — document the choice in the plan.**

### Pattern 2: `useHolidays` Hook

**What:** Determines which calendar years the course spans, fetches each year independently, merges results, handles errors, exposes `{ holidays, holidayWarning }` tuple.

**When to use:** This pattern keeps year-resolution logic in React state and keeps `fetchHolidaysForYear` as a pure async utility.

```javascript
// src/hooks/useHolidays.js
import { useState, useEffect } from 'react';
import { fetchHolidaysForYear } from '../services/holidayApi';

/**
 * @param {string} startDate  'YYYY-MM-DD' or ''
 * @param {string} endDate    'YYYY-MM-DD' or '' (computed from schedule, or estimated)
 * @returns {{ holidays: Array<{date:string,name:string}>, holidayWarning: string|null }}
 */
export function useHolidays(startDate, endDate) {
    const [holidays, setHolidays] = useState([]);
    const [holidayWarning, setHolidayWarning] = useState(null);

    useEffect(() => {
        if (!startDate) return;

        // Determine which years are needed
        const startYear = new Date(startDate + 'T00:00:00').getFullYear();
        const endYear = endDate
            ? new Date(endDate + 'T00:00:00').getFullYear()
            : startYear;

        const years = [];
        for (let y = startYear; y <= endYear; y++) years.push(y);

        let cancelled = false;

        Promise.all(years.map(y => fetchHolidaysForYear(y)))
            .then(results => {
                if (cancelled) return;
                const merged = results.flatMap(r => r.holidays);
                setHolidays(merged);
                setHolidayWarning(null);
            })
            .catch(() => {
                if (cancelled) return;
                // API unreachable and no cache — degrade gracefully
                setHolidays([]);
                setHolidayWarning(
                    'No se pudo obtener los feriados nacionales. El cronograma se generará sin feriados automáticos.'
                );
            });

        return () => { cancelled = true; };
    }, [startDate, endDate]);

    return { holidays, holidayWarning };
}
```

**Multi-year edge case:** `endDate` is the tricky input because the schedule end date is itself computed from holidays (circular dependency). The recommended resolution: pass `endDate` as an estimated upper bound. Since `calculateSchedule` is fast and pure, the simplest approach is to estimate `endDate` as `startDate + 2 years` (or derive it from the schedule after first render). An alternative: always fetch the year of `startDate` plus the following year (two years minimum), which covers 99% of courses without needing to know the exact end date. Document this choice in the plan.

### Pattern 3: Warning Banner Component (inline)

**What:** A conditional banner rendered above the schedule when `holidayWarning` is non-null.

**When to use:** CORT-02 requires a "non-blocking warning banner." It must not prevent schedule display — render it above the schedule section, not instead of it.

```jsx
{holidayWarning && (
    <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm">
        <AlertCircle size={16} className="shrink-0" />
        <span>{holidayWarning}</span>
    </div>
)}
```

Tailwind and Lucide React (already installed) cover this entirely — no new dependencies.

### Pattern 4: Wiring into App / useSchedule

The current `App.jsx` calls:
```javascript
useEffect(() => {
    setSchedule(calculateSchedule(courseData, CHILEAN_HOLIDAYS_2026));
}, [courseData]);
```

After Phase 3 extracts this into `useSchedule`, Phase 4 replaces `CHILEAN_HOLIDAYS_2026` with the `holidays` array from `useHolidays`. The wiring point is `useSchedule` hook — it should accept (or internally call) `useHolidays`.

If Phase 3 is not complete by the time Phase 4 is planned: Phase 4 can wire `useHolidays` directly in `App.jsx` as an interim step, then migrate to `useSchedule` when Phase 3 lands. The plan should account for Phase 3 being a prerequisite.

### Anti-Patterns to Avoid

- **Fetching inside `calculateSchedule`:** The engine is a pure function and must remain so (ARCH-01). All async work belongs in the hook layer.
- **Single combined localStorage key for all years:** CORT-02 specifies `holidays_CL_{year}` — one key per year. A single key would invalidate the entire cache when any year's data is updated.
- **Re-fetching on every render:** The `useEffect` dependency array must be `[startDate, endDate]` (or the derived year values). Without this, every courseData change triggers a new network call.
- **Blocking schedule generation on API call:** The warning banner pattern means the schedule renders with an empty holidays array while the fetch is in-flight, then re-renders once holidays arrive. This is correct — do not block or show a spinner that hides the schedule.
- **Using `name` (English) instead of `localName` (Spanish):** The UI is in Spanish. Always map `h.localName` from the API response.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API mocking in tests | Custom fetch interceptor | MSW 2.x `http.get` handler | Already installed, `setupServer` already wired in `test-setup.js` |
| Date parsing | Custom date string splitter | `new Date(str + 'T00:00:00')` pattern (established in codebase) | Timezone-safe pattern already proven — UTC-3 fix applied in Phase 1 |
| Warning UI | Custom alert component | Inline JSX with Tailwind + Lucide `AlertCircle` | No component needed; one JSX block suffices |
| localStorage serialization | Custom encode/decode | `JSON.stringify` / `JSON.parse` with try/catch | Browser native, zero-config |

**Key insight:** The entire fetch-cache-fallback pattern is achievable with browser-native `fetch`, `localStorage`, and `Promise.all` — no third-party HTTP client needed.

## Common Pitfalls

### Pitfall 1: endDate Circular Dependency
**What goes wrong:** `useHolidays(startDate, endDate)` needs `endDate` to know which years to fetch. But `endDate` comes from the schedule, which depends on holidays. This creates a loop.
**Why it happens:** The schedule end date is computed, not input.
**How to avoid:** Either (a) always fetch `startYear` and `startYear + 1` (covers all courses under 2 years, which is all courses in this app), or (b) fetch only `startYear` on first render, then check if the schedule extends into a new year and fetch that year as a second effect pass. Option (a) is simpler and correct for this domain.
**Warning signs:** Schedule regenerating in an infinite loop, or 2027 holidays missing for a November 2026 start date.

### Pitfall 2: localStorage Access in SSR/Test Environments
**What goes wrong:** `localStorage.getItem()` throws in Node.js environments (Vitest runs in jsdom, which does have `localStorage`, but it can still be null in edge cases).
**Why it happens:** `localStorage` is browser-native; jsdom provides it but it can behave differently.
**How to avoid:** Always wrap localStorage calls in try/catch. The service function pattern above already does this.
**Warning signs:** Tests failing with `ReferenceError: localStorage is not defined`.

### Pitfall 3: MSW Handler Scope — Node vs Browser
**What goes wrong:** MSW 2.x uses different setups for Node (`msw/node`) and browser (`msw/browser`). Tests use `setupServer` from `msw/node` — already correct in this project. If someone accidentally imports from `msw/browser` in tests, it fails silently.
**Why it happens:** MSW 2.x split the API for clarity.
**How to avoid:** Add handlers to `src/mocks/handlers.js` using `http.get` from `msw` (not msw/browser). The existing `server.js` already uses `setupServer` from `msw/node` — just add handlers to the shared array.
**Warning signs:** Network requests go through in tests instead of being intercepted.

### Pitfall 4: Cache Staleness (not a bug, but a UX concern)
**What goes wrong:** Once cached, holiday data for a year never refreshes. If nager.date updates data (e.g., an emergency holiday is declared), the cache holds stale data indefinitely.
**Why it happens:** No TTL is defined in CORT-02 — the requirement is "cached per year."
**How to avoid:** This is acceptable per requirements. CORT-02 says cached per year with no TTL. Document that users can clear localStorage to force a refresh.
**Warning signs:** Not applicable — this is by design.

### Pitfall 5: API Returns regionalHoliday (global: false)
**What goes wrong:** The 2026 CL API response includes one regional holiday (`2026-06-07`, only for Arica-Parinacota region, `global: false`). If included globally, it incorrectly blocks scheduling for professors in Santiago.
**Why it happens:** nager.date includes regional holidays in the full CL response.
**How to avoid:** Filter API response to `global === true` only before caching. Alternatively, include all — regional holidays are unlikely to cause significant scheduling errors. Either choice must be explicit and consistent.
**Warning signs:** One extra date blocked in June 2026 that wasn't blocked before.

## Code Examples

### MSW Handler for Tests

```javascript
// src/mocks/handlers.js
import { http, HttpResponse } from 'msw';

const CL_2026_HOLIDAYS = [
    { date: '2026-01-01', localName: 'Año Nuevo', name: "New Year's Day", countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    { date: '2026-04-03', localName: 'Viernes Santo', name: 'Good Friday', countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    // ... add key holidays needed by tests
];

const CL_2027_HOLIDAYS = [
    { date: '2027-01-01', localName: 'Año Nuevo', name: "New Year's Day", countryCode: 'CL', global: true, counties: null, types: ['Public'] },
    // ... add 2027 holidays
];

export const handlers = [
    http.get('https://date.nager.at/api/v3/publicholidays/:year/CL', ({ params }) => {
        const year = parseInt(params.year);
        if (year === 2026) return HttpResponse.json(CL_2026_HOLIDAYS);
        if (year === 2027) return HttpResponse.json(CL_2027_HOLIDAYS);
        return HttpResponse.json([]);
    }),
];
```

### Offline Fallback Test Pattern

```javascript
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

it('shows warning banner when API fails and no cache exists', async () => {
    // Override default handler with error response
    server.use(
        http.get('https://date.nager.at/api/v3/publicholidays/:year/CL', () => {
            return HttpResponse.error();
        })
    );
    // ... render app, assert warning banner appears
});
```

### localStorage Cache Test Pattern

```javascript
it('uses cache on second render without new network request', async () => {
    // Pre-populate localStorage to simulate cached state
    const cachedHolidays = [{ date: '2026-01-01', name: 'Año Nuevo' }];
    localStorage.setItem('holidays_CL_2026', JSON.stringify(cachedHolidays));

    // Render — handler should never be called
    let networkCallCount = 0;
    server.use(
        http.get('https://date.nager.at/api/v3/publicholidays/:year/CL', () => {
            networkCallCount++;
            return HttpResponse.json([]);
        })
    );

    // ... render, assert networkCallCount === 0
    expect(networkCallCount).toBe(0);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `CHILEAN_HOLIDAYS_2026` in `constants.js` | Live fetch from nager.date per year | This phase | Dynamic, multi-year, no manual updates needed |
| Single `getHolidayName(dateStr)` using the constant | `holidays` array from hook (same shape `{date, name}`) | This phase | `getHolidayName` in `utils.js` still imports CHILEAN_HOLIDAYS_2026 — this becomes dead code or needs updating |

**Note on `utils.js`:** `getHolidayName` currently imports `CHILEAN_HOLIDAYS_2026` directly. After this phase, the live holidays array lives in component state (not a module constant). The planner should include a task to update `getHolidayName` to accept the holidays array as a parameter instead of importing the constant — OR pass the holidays array down to ScheduleList/CalendarGrid where `getHolidayName` is called. This is a breaking change to the existing function signature.

**Deprecated after this phase:**
- `CHILEAN_HOLIDAYS_2026` constant in `src/logic/constants.js` — becomes dead code. Can be kept for reference or deleted. The plan should make a clear call.

## Open Questions

1. **`endDate` for multi-year fetch**
   - What we know: Course spanning Nov 2026 to Mar 2027 requires both years. `endDate` is not available until after schedule calculation.
   - What's unclear: Whether to estimate `endYear = startYear + 1` always, or derive it from schedule.
   - Recommendation: Always fetch `startYear` and `startYear + 1`. Covers all realistic course lengths (one academic year). Simpler than a two-pass approach. Can be revisited for v2 if edge cases emerge.

2. **Regional holidays filter**
   - What we know: nager.date 2026/CL includes one regional holiday (Arica only). Filtering `global === true` removes it.
   - What's unclear: Requirements do not specify.
   - Recommendation: Filter `global === true` — a national scheduler should not apply regional holidays to all professors. Document in code.

3. **`getHolidayName` refactor scope**
   - What we know: Function imports `CHILEAN_HOLIDAYS_2026` and is called in `App.jsx` (Excel export) and possibly `ScheduleList.jsx` / `CalendarGrid.jsx`.
   - What's unclear: Whether this refactor is in Phase 4 scope or deferred.
   - Recommendation: Phase 4 should update `getHolidayName` to accept the holidays array as a parameter. Leaving it unchanged silently continues using 2026 data in exports for all other years.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build / test runner | Yes | v24.12.0 | — |
| npm | Package management | Yes | bundled with Node | — |
| fetch (browser) | nager.date API call | Yes (jsdom in tests, browser in prod) | Native | — |
| localStorage (browser) | Holiday cache | Yes (jsdom in tests, browser in prod) | Native | — |
| nager.date API | Live holiday data | Yes — verified live 2026/03/26 | v3 | Degrade to empty holidays + warning banner |
| MSW | Test mocking | Yes (installed 2.12.14) | 2.12.14 | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** nager.date API (network may be unavailable) — fallback is graceful degradation per CORT-02.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vite.config.js` (test block) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-04 | `fetchHolidaysForYear` returns `{holidays, fromCache}` | unit | `npm test -- --run src/services` | No — Wave 0 |
| ARCH-04 | `fetchHolidaysForYear` writes to localStorage after fetch | unit | `npm test -- --run src/services` | No — Wave 0 |
| ARCH-04 | `fetchHolidaysForYear` reads from localStorage cache (no network call) | unit | `npm test -- --run src/services` | No — Wave 0 |
| CORT-02 | `useHolidays` fetches both years for a multi-year course | integration | `npm test -- --run src/hooks` | No — Wave 0 |
| CORT-02 | `useHolidays` returns `holidayWarning` (non-null) when API fails and cache empty | integration | `npm test -- --run src/hooks` | No — Wave 0 |
| CORT-02 | `useHolidays` returns `holidays=[]` (not crash) on API failure | integration | `npm test -- --run src/hooks` | No — Wave 0 |
| CORT-02 | Warning banner appears in UI when `holidayWarning` is set | component | `npm test -- --run src/components` | No — Wave 0 |
| CORT-02 | 2027 course uses 2027 holidays (not 2026 hardcoded) | integration | `npm test -- --run src/hooks` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/services/__tests__/holidayApi.test.js` — unit tests for pure service (ARCH-04)
- [ ] `src/hooks/__tests__/useHolidays.test.js` — hook integration tests (ARCH-04, CORT-02)
- [ ] `src/mocks/handlers.js` — must be populated with nager.date MSW handlers (currently empty array)

*(Existing `src/test-setup.js`, `src/mocks/server.js`, and Vitest config are fully operational — no framework changes needed.)*

## Sources

### Primary (HIGH confidence)

- nager.date live API — `https://date.nager.at/api/v3/publicholidays/2026/CL` fetched directly during research. Response confirmed 17 entries with `date`, `localName`, `name`, `global`, `counties` fields. CORS enabled, no auth required, no rate limits.
- nager.date API docs — `https://date.nager.at/Api` — endpoint format, field descriptions, CORS policy confirmed.
- Project source code — `src/logic/constants.js`, `src/logic/scheduleEngine.js`, `src/App.jsx`, `src/logic/utils.js`, `src/mocks/handlers.js`, `src/mocks/server.js`, `src/test-setup.js` — read directly. Current implementation state confirmed.
- `package.json` — installed versions confirmed: msw@2.12.14, vitest@3.2.4, @testing-library/react@16.3.2.

### Secondary (MEDIUM confidence)

- MSW 2.x docs — mswjs.io — `http.get` handler syntax, `HttpResponse.json()`, `HttpResponse.error()` patterns for Node integration via `setupServer`. Consistent with installed version.

### Tertiary (LOW confidence)

- None — all claims are verifiable from project source or live API.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, versions confirmed from package.json
- Architecture: HIGH — patterns follow established project conventions (pure engine, hook wrapper) and confirmed API shape
- Pitfalls: HIGH — endDate circular dependency is architectural; regional holiday and `getHolidayName` issues are confirmed from live API response and source code reading
- Test strategy: HIGH — MSW already scaffolded; handler syntax confirmed from installed msw@2.12.14

**Research date:** 2026-03-26
**Valid until:** 2026-06-26 (90 days — nager.date v3 API is stable; library versions are stable)
