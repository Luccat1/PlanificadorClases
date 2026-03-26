# Stack Research

**Domain:** React + Vite client-side app — adding testing, API caching, and hook extraction
**Researched:** 2026-03-26
**Confidence:** MEDIUM (training data, Aug 2025 cutoff; external verification blocked in this session — version numbers marked)

## Context: What Already Exists

The app runs React 18.3.1 + Vite 7.3.1 + Tailwind CSS 3.4.13. No test infrastructure exists. The milestone adds three new technical concerns:

1. Testing — unit tests for pure functions + React component tests
2. API caching with offline fallback — nager.date holiday fetch replacing hardcoded data
3. Hook extraction — breaking up monolithic App.jsx into composable hooks

The recommendations below are additive. They do not change the existing stack.

---

## Recommended Stack

### Testing Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `vitest` | `^2.1` | Test runner | Native Vite integration — shares vite.config.js with zero extra config. Same ESM handling, same transform pipeline. No webpack/jest config mismatch. Standard choice for all Vite projects. |
| `@testing-library/react` | `^16.0` | React component rendering + querying | The canonical React testing abstraction. Tests components through user-visible behavior (roles, labels, text) not implementation details. React 18 compatible via `createRoot`. |
| `@testing-library/user-event` | `^14.5` | Realistic user interaction simulation | Simulates real browser events (pointer, keyboard, clipboard) rather than `fireEvent`'s synthetic shortcuts. Required for testing form inputs, toggles, and button clicks accurately. |
| `@testing-library/jest-dom` | `^6.4` | Custom DOM matchers | Provides `.toBeInTheDocument()`, `.toHaveValue()`, `.toBeDisabled()` etc. — dramatically cleaner assertions than raw `expect(el).not.toBeNull()`. |
| `jsdom` | `^25` | DOM environment for Vitest | Simulates a browser DOM inside Node. The standard Vitest environment for component tests. More compatible than happy-dom for complex DOM operations. |
| `msw` | `^2.4` | API mocking for tests | Mock Service Worker intercepts fetch at the network level, not at the function level. Lets you test the `useHolidays` hook against a fake nager.date response without modifying production code. Works in both Vitest (Node handler) and browser. |

**Why NOT Jest:** Jest requires a separate Babel/transform config that duplicates Vite's. In a Vite project, Jest will fight with ESM modules, Tailwind imports, and the existing vite.config.js. Vitest runs inside Vite, so it inherits all transforms automatically. Migration from Jest to Vitest for Vite projects is straightforward; going the other direction is painful.

**Why NOT Playwright/Cypress:** This milestone focuses on unit + integration tests of pure functions and React components, not full end-to-end browser tests. Playwright/Cypress are appropriate for E2E but add significant setup overhead. Add E2E only when the app's flows are stable enough to justify it.

### API Caching — Holiday Fetch

**Recommendation: custom `useHolidays` hook with localStorage cache. Do NOT add TanStack Query or SWR.**

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Native `fetch` | browser built-in | HTTP request to nager.date | No dependency. The nager.date API (`/api/v3/publicholidays/{year}/CL`) returns a flat JSON array — simple enough that no HTTP client library is warranted. |
| `localStorage` | browser built-in | Persist fetched holiday data by year | Cache key: `holidays_CL_{year}`. Avoids refetching a year already fetched in a previous session. Provides offline fallback when the cache is warm. |

**Pattern for `useHolidays(year)`:**

```
1. Check localStorage for key `holidays_CL_{year}`
2. If found → return cached data immediately (no network)
3. If not found → fetch from nager.date
4. On success → write to localStorage, return data
5. On network failure → return null + set error flag so UI can warn user
6. Expose { holidays, loading, error } tuple
```

This pattern handles all three scenarios in the milestone requirements: live data for current/future years, offline fallback via cache, and graceful degradation when both cache and network are unavailable. The app's fallback for total API failure should warn the user that holiday data could not be loaded and skip holiday-checking (or use the hardcoded 2026 list as last resort).

**Why NOT TanStack Query v5:** TanStack Query is the right answer when an app has multiple data sources, background refetching needs, or complex cache invalidation. For one endpoint with simple year-keyed caching, TanStack Query adds ~14KB gzipped and a `QueryClientProvider` wrapper to a problem that a 40-line hook solves completely. The project constraint is "client-side only, minimal dependencies" — this is not the right moment to introduce a data-fetching layer.

**Why NOT SWR:** Same reasoning. SWR is lighter than TanStack Query but still adds a dependency for a single endpoint. Custom hook is sufficient.

**If the app grows:** If future milestones add more API endpoints (e.g., a PUCV course catalog, a room availability API), then TanStack Query v5 becomes the right call. The `useHolidays` hook's internal structure (fetch → cache → return state) maps directly onto TanStack Query's `useQuery` pattern, so migration would be a find-and-replace.

### Hook Extraction — App.jsx Refactor

**Recommendation: standard React custom hooks, no additional library.**

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React `useState` + `useReducer` | React 18 (existing) | State management within extracted hooks | `useReducer` is preferred over multiple `useState` calls when state transitions involve related fields (e.g., courseData updates). Keeps state update logic explicit and testable. |
| React `useCallback` + `useMemo` | React 18 (existing) | Memoize expensive computations | `calculateSchedule()` runs on every render if not memoized. `useMemo` over its inputs prevents redundant recalculations when unrelated state changes. |
| React `useEffect` | React 18 (existing) | Side-effect synchronization (localStorage writes, API fetch triggers) | Already in use. Extraction into hooks means each hook owns its own effects — cleaner than one monolithic useEffect block in App.jsx. |

**Extraction plan for App.jsx (360 lines → targeted modules):**

```
src/
  hooks/
    useCourseData.js        — courseData state + handlers + localStorage persistence
    useHolidays.js          — nager.date fetch + localStorage cache + offline fallback
    useSchedule.js          — calculateSchedule() wrapped with useMemo, sessionsPerWeek cap
    usePreferences.js       — darkMode + viewMode + localStorage persistence
  logic/
    calculateSchedule.js    — pure function (already partially in utils.js)
    getEffectiveHours.js    — pure function (already in utils.js)
```

Each hook is independently testable with `renderHook()` from React Testing Library. Pure functions in `logic/` are testable with plain `describe/it` blocks — no React rendering needed.

**Why NOT Zustand/Jotai/Redux:** The app has no cross-component state sharing problem. All state lives in one component tree rooted at App.jsx. Custom hooks solve the complexity problem (too much in one file) without adding a state management library. Adding Zustand here would be over-engineering — it's appropriate when multiple disconnected component subtrees need shared state without prop drilling.

---

## Installation

```bash
# Testing (all devDependencies)
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom msw

# No new production dependencies needed for API caching or hook extraction
```

**vitest.config additions** (merge into existing `vite.config.js`):

```js
// vite.config.js — add test block
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
```

```js
// src/test/setup.js
import '@testing-library/jest-dom'
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vitest | Jest | Only if project is not using Vite. For Vite projects, Vitest is strictly better. |
| jsdom | happy-dom | happy-dom is 2-3x faster but has known compatibility gaps with some DOM APIs. Use happy-dom only if test suite becomes measurably slow (>30s for this app is unlikely). |
| `@testing-library/user-event` | `fireEvent` (bundled with RTL) | `fireEvent` is fine for simple click tests. Use `user-event` when testing input sequences, keyboard navigation, or form submissions where event ordering matters. |
| Custom `useHolidays` hook | TanStack Query v5 | Use TanStack Query when the app has 3+ data sources, needs background refresh on window focus, or requires server-state synchronization. Not warranted here. |
| Custom `useHolidays` hook | SWR v2 | Use SWR for simpler apps that need stale-while-revalidate semantics across multiple endpoints. Lighter than TanStack Query, but still unnecessary for one endpoint. |
| Native `fetch` | `axios` | Use `axios` when you need request interceptors, automatic JSON serialization, or consistent error handling across many endpoints. One endpoint does not justify `axios`. |
| Custom hooks (React built-ins) | Zustand | Use Zustand when sibling components that don't share a common parent need shared state — the "prop drilling is unavoidable" threshold. App.jsx is not at that threshold. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Jest | ESM + Vite config conflicts; requires duplicate transform setup; slow cold start vs Vitest | Vitest |
| Enzyme | React 18 support was abandoned; community moved entirely to React Testing Library | `@testing-library/react` |
| Cypress / Playwright (this milestone) | E2E overhead not warranted until unit + integration coverage exists; adds CI complexity | Vitest + RTL for component tests |
| TanStack Query (this milestone) | 14KB+ bundle addition for one API endpoint; custom hook covers the use case | Custom `useHolidays` hook |
| `xlsx` from CDN (existing) | CDN URL availability risk; `latest` tag can introduce breaking changes without a lockfile entry; npm package gives reproducible builds | `xlsx` from npm (`npm install xlsx`) — same SheetJS library, controlled version |
| Redux Toolkit | No cross-component shared state problem exists; adds 20+ KB and action/reducer boilerplate to a problem hooks solve in 50 lines | Custom hooks + `useReducer` |
| `react-query` (v3 legacy name) | Deprecated package name; v4+ is `@tanstack/react-query` | `@tanstack/react-query` if TanStack Query is ever added |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `vitest@^2.1` | Vite 7.x | Vitest 2.x requires Vite 5+. Vite 7.3.1 is fully compatible. |
| `@testing-library/react@^16.0` | React 18.x | RTL v16 uses `createRoot` internally for React 18. Do not use RTL v13 or below with React 18 — it uses legacy `render` API. |
| `@testing-library/user-event@^14.5` | `@testing-library/react@^14+` | user-event v14 uses async `await userEvent.setup()` pattern. Incompatible interaction pattern with v13. |
| `msw@^2.4` | Vitest 2.x (Node handler) | MSW v2 changed from `setupServer` with `rest.*` handlers to `http.*` handlers. Do not follow v1 docs. Use `http.get()` pattern. |
| `jsdom@^25` | Vitest 2.x | Vitest 2.x bundles jsdom; installing separately as devDependency ensures version control. |

---

## Stack Patterns by Variant

**If testing pure functions only (utils.js, calculateSchedule):**
- Vitest with `environment: 'node'` (faster, no DOM overhead)
- No RTL needed for pure function files
- Co-locate test files as `utils.test.js` next to `utils.js`

**If testing React components:**
- Vitest with `environment: 'jsdom'`
- Use `@testing-library/react`'s `render()` and `screen` queries
- Set environment per-file with `// @vitest-environment jsdom` if mixing node + jsdom tests

**If testing the `useHolidays` hook in isolation:**
- Use `renderHook()` from `@testing-library/react`
- Use `msw`'s `http.get()` handler to mock nager.date responses
- Test three paths: cache hit (no fetch), fetch success (cache write), fetch failure (error state)

**If the xlsx CDN dependency is migrated to npm:**
- `npm install xlsx` (currently pinned to CDN URL in package.json)
- Remove the CDN URL entry; the npm package is the same SheetJS codebase
- Version pin to `^0.18.5` (last stable before commercial license change) — IMPORTANT: SheetJS changed to a non-free license for versions above 0.18.x. Verify current licensing before upgrading above 0.18.x.

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Vitest as test runner for Vite | HIGH | Stable recommendation since Vitest 1.0 (2023); Vite project = Vitest, no ambiguity |
| RTL v16 + React 18 compatibility | HIGH | RTL v14+ for React 18 is well-established; v16 range extends this |
| user-event v14 async pattern | HIGH | Stable since v14.0 (2022); breaking change from v13 is well-documented |
| msw v2 handler syntax | MEDIUM | v2 released Nov 2023; `http.*` pattern is confirmed in docs; verify current version at install time |
| Custom hook over TanStack Query | HIGH | Architectural judgment based on single-endpoint use case; not a version question |
| jsdom over happy-dom | HIGH | jsdom is the default; happy-dom tradeoffs are documented and well-understood |
| xlsx license warning (0.18.x) | MEDIUM | License change is documented fact; exact version boundary may have shifted — verify at npmjs.com before installing |
| Vitest 2.x + Vite 7.x compatibility | MEDIUM | Vite 7 is beyond my training data; Vitest follows Vite closely — assume compatible, but verify with `npm install` output |

---

## Sources

- Training data (Vitest, RTL, msw, TanStack Query, React hooks) — knowledge cutoff Aug 2025
- External verification (WebFetch, WebSearch, Context7) blocked in this session
- Version numbers marked MEDIUM confidence — run `npm info [package] version` to confirm current latest before pinning

---

*Stack research for: PlanificadorClases — testing, API caching, hook extraction*
*Researched: 2026-03-26*
