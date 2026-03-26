# Architecture Research

**Domain:** Monolithic React SPA refactor — scheduling algorithm extraction + API integration
**Researched:** 2026-03-26
**Confidence:** HIGH (based on direct codebase inspection; React hook/pure-function decomposition is well-established)

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
├─────────────────┬──────────────────────────┬───────────────────┤
│   CourseForm    │      ScheduleList         │   CalendarGrid    │
│  (left sidebar) │  (list / grid toggle)     │  (month grid)     │
│  props only,    │  props only, no state     │  props only       │
│  no state       │                           │                   │
└────────┬────────┴──────────────┬────────────┴─────────┬────────┘
         │ callbacks              │ schedule[]            │ schedule[]
         ▼                        ▼                       ▼
┌────────────────────────────────────────────────────────────────┐
│                   Orchestration Layer (App.jsx)                 │
│                                                                 │
│  useSchedule(courseData)  ◄──  useCourseData()                 │
│  returns: { schedule,          returns: { courseData,          │
│    holidays, status }            setCourseData,                │
│                                  handlers, reset }             │
│                                                                 │
│  stats = useMemo(schedule)    exportToExcel(schedule, meta)    │
└──────────────┬─────────────────────────────────────────────────┘
               │ reads
               ▼
┌────────────────────────────────────────────────────────────────┐
│                       Logic Layer (pure)                        │
├─────────────────────────────────────────────────────────────────┤
│  calculateSchedule(courseData, holidays) → Session[]           │
│  getEffectiveHours(chrono, hourType) → number                  │
│  isDateExcluded(date, holidays, customExcluded) → boolean      │
│  deriveStats(sessions, totalHours) → Stats                     │
└─────────────────────────────────────────────────────────────────┘
               │ consumes
               ▼
┌────────────────────────────────────────────────────────────────┐
│                       Data / Services Layer                     │
├─────────────────────────────────────────────────────────────────┤
│  useHolidays(years[])    →  { holidays, status }               │
│    • fetch nager.date API per year                             │
│    • cache fetched years in localStorage                       │
│    • fallback: bundled CHILEAN_HOLIDAYS_2026 constant          │
│                                                                 │
│  localStorage helpers:                                         │
│    • persistCourseData / loadCourseData                        │
│    • persistHolidayCache / loadHolidayCache                    │
└────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `App.jsx` | Orchestration only — composes hooks, derives stats, wires exports, renders layout | All hooks and all presentation components |
| `CourseForm.jsx` | Controlled form UI — collects all course config inputs | App.jsx via props/callbacks |
| `ScheduleList.jsx` | Schedule display switcher — renders list view or delegates to CalendarGrid | App.jsx (receives schedule[], courseData), CalendarGrid |
| `CalendarGrid.jsx` | Month-by-month calendar grid rendering | ScheduleList (receives schedule[]) |
| `useSchedule` (new) | Runs `calculateSchedule()` when courseData or holidays change; owns `schedule` state | App.jsx (consumer), logic/scheduler.js (caller), useHolidays (depends on) |
| `useCourseData` (new) | Owns courseData state, localStorage persistence, all courseData mutation handlers | App.jsx (consumer) |
| `useHolidays` (new) | Fetches holiday data per year from nager.date, caches in localStorage, falls back to bundle | useSchedule (consumer) |
| `scheduler.js` (new) | Pure function: `calculateSchedule(courseData, holidays)` — no React, no side effects | useSchedule (caller), Vitest (test target) |
| `utils.js` (existing) | Pure helpers: `getEffectiveHours`, `formatDateLong`, `getHolidayName` | scheduler.js, components |
| `constants.js` (existing) | Static data: DAY_NAMES, DAY_MAPPING, bundled CHILEAN_HOLIDAYS_2026 fallback | All modules |

## Recommended Project Structure

```
src/
├── components/
│   ├── CalendarGrid.jsx    # unchanged — already isolated
│   ├── CourseForm.jsx      # unchanged — already isolated
│   └── ScheduleList.jsx    # unchanged — already isolated
├── hooks/
│   ├── useCourseData.js    # state + localStorage + handlers
│   ├── useSchedule.js      # runs scheduler, owns schedule[]
│   └── useHolidays.js      # API fetch + cache + fallback
├── logic/
│   ├── constants.js        # existing — add FALLBACK_HOLIDAYS export
│   ├── utils.js            # existing — unchanged
│   └── scheduler.js        # NEW: pure calculateSchedule()
├── services/
│   └── holidayApi.js       # fetch wrapper for nager.date
├── App.jsx                 # slimmed to ~80 lines: composes hooks, renders layout
└── main.jsx                # unchanged
```

### Structure Rationale

- **hooks/:** React-coupled logic that manages state and effects lives here. Hooks are the only layer permitted to call `useState`, `useEffect`, `localStorage`. The boundary makes the scheduling algorithm testable without React.
- **logic/:** Pure functions with zero side effects. `scheduler.js` receives all inputs as arguments and returns a value — no `useState`, no `localStorage`, no `fetch`. This is the primary Vitest test target.
- **services/:** Network boundary. `holidayApi.js` is a plain async function; `useHolidays` wraps it with React lifecycle. Isolating the fetch call makes it trivial to mock in tests.
- **components/:** Presentation only. None of these files should ever call `localStorage` or `fetch` — they receive everything via props.

## Architectural Patterns

### Pattern 1: Pure Function Extraction (scheduler.js)

**What:** Move `calculateSchedule` and `isDateExcluded` out of `App.jsx` into a plain JS module that takes all inputs as arguments and returns a value.

**When to use:** Any algorithm that does not inherently need React lifecycle. The current `calculateSchedule` only uses `courseData` and a holiday list — both can be passed as arguments.

**Trade-offs:** No access to component state directly (good — forced testability). Slightly more argument threading, but the function signature is already well-defined by existing usage.

**Example:**
```js
// src/logic/scheduler.js
export function calculateSchedule(courseData, holidays) {
  if (!courseData.startDate || courseData.classDays.length === 0) return [];
  // ... pure iteration, no setState, no side effects
  return sessions; // Session[]
}
```

The key constraint: `holidays` is passed in — the function never fetches, never reads localStorage. Callers (the hook) are responsible for supplying the right holiday array.

### Pattern 2: Custom Hook as Stateful Shell (useSchedule)

**What:** A custom hook that owns the React lifecycle concern: watches `courseData` + `holidays` for changes, calls the pure `calculateSchedule()`, stores the result in `useState`.

**When to use:** When a pure function needs to be re-invoked reactively and its output stored as state. This is the standard React pattern for "derived async state".

**Trade-offs:** Adds one file. Makes App.jsx dramatically simpler. Enables debouncing the algorithm call without touching the pure function.

**Example:**
```js
// src/hooks/useSchedule.js
export function useSchedule(courseData, holidays) {
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    setSchedule(calculateSchedule(courseData, holidays));
  }, [courseData, holidays]);

  return schedule;
}
```

Note: debouncing can be added here (e.g. 150ms) to prevent algorithm re-runs on every keystroke without changing any other layer.

### Pattern 3: API Hook with Cache + Offline Fallback (useHolidays)

**What:** A hook that fetches holiday data from `nager.date` per calendar year, caches successful responses in `localStorage` keyed by year, and returns bundled fallback data if the network is unavailable.

**When to use:** Any external API call in a client-only app that must work offline and on GitHub Pages where there is no server-side caching.

**Trade-offs:** Slightly more complex than a direct fetch; the cache key per year means only one network request per year per browser. Stale data risk is acceptable — national holidays change rarely and are announced months in advance.

**Cache key format:** `holiday_cache_CL_2026` → `{ fetched: ISO timestamp, data: Holiday[] }`

**Status shape:** `{ status: 'loading' | 'ready' | 'fallback', holidays: Holiday[] }`

**Fallback chain:**
```
1. localStorage cache for requested year?  →  use cache, status: 'ready'
2. Network fetch succeeds?                 →  write cache, status: 'ready'
3. Network fails, cache for another year?  →  warn user, partial: 'fallback'
4. Network fails, no cache at all?         →  use bundled CHILEAN_HOLIDAYS_2026
```

## Data Flow

### User Input → Schedule Generation

```
User edits field in CourseForm
    ↓
onInputChange callback (from useCourseData)
    ↓
courseData state updated in useCourseData
    ↓  (also persisted to localStorage)
useSchedule effect fires (courseData changed)
    ↓
calculateSchedule(courseData, holidays) — pure function
    ↓
schedule[] state updated in useSchedule
    ↓
App.jsx re-renders → ScheduleList receives new schedule[]
```

### Holiday API Flow

```
App mounts / start year changes
    ↓
useHolidays detects required years from courseData.startDate
    ↓
Check localStorage cache per year
  hit? → return cached data immediately
  miss? → fetch nager.date/api/v3/publicholidays/{year}/CL
            success → write cache, return data
            fail    → return fallback bundle, set status: 'fallback'
    ↓
holidays[] passed into useSchedule
    ↓
isDateExcluded() in calculateSchedule uses holidays[]
```

### State Ownership Map

```
useCourseData  owns:  courseData (all form fields)
useHolidays    owns:  holidays[], holidayStatus
useSchedule    owns:  schedule[]
App.jsx        owns:  darkMode, viewMode  (UI-only state, not worth a hook)
               derives: stats via useMemo(schedule)
```

UI-only state (`darkMode`, `viewMode`) stays in `App.jsx` — the overhead of a hook for two booleans is not justified. However, `localStorage` persistence for both should be wired into their `useState` initializers during the same milestone.

## Build Order (Dependency Graph)

Phase dependencies enforce this sequence:

```
Step 1: scheduler.js (pure function)
        → no dependencies, immediately testable
        → extract calculateSchedule + isDateExcluded from App.jsx
        → wire sessionsPerWeek cap here (new feature, same extraction)

Step 2: Vitest unit tests for scheduler.js
        → possible because scheduler.js has zero React dependencies
        → tests validate refactor didn't break behavior

Step 3: useCourseData hook
        → depends on nothing new, wraps existing useState/localStorage
        → extract handlers: handleInputChange, handleDayToggle,
          addExcludedDate, removeExcludedDate, resetCourse

Step 4: holidayApi.js + useHolidays hook
        → depends on constants.js (fallback data)
        → network layer isolated in services/holidayApi.js
        → hook wraps it with cache logic

Step 5: useSchedule hook
        → depends on scheduler.js (Step 1) + useHolidays (Step 4)
        → replaces the useEffect in App.jsx that calls calculateSchedule

Step 6: App.jsx slim-down
        → composes all hooks, passes results to components
        → target: ~80 lines (down from 360)
        → darkMode + viewMode localStorage persistence added here
```

This order ensures every step is independently verifiable: the pure function can be tested before any hook exists; each hook can be developed in isolation.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| nager.date API | `fetch` in `services/holidayApi.js`; wrapped by `useHolidays` hook | No API key required. Endpoint: `https://date.nager.at/api/v3/PublicHolidays/{year}/CL`. Returns `[{ date, localName, name }]`. Cache per year in localStorage. |
| localStorage | Direct read/write in `useCourseData` and `useHolidays` | Keys: `courseData`, `holiday_cache_CL_{year}`. Both wrapped in try/catch for private browsing compatibility. |
| SheetJS (xlsx) | Currently CDN-loaded (`import * as XLSX from 'xlsx'` already uses npm package per App.jsx line 17 — CDN reference may be in index.html; verify) | Export function can remain in App.jsx or move to `utils/export.js` |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `scheduler.js` ↔ `useSchedule` | Function call — scheduler is imported and called directly | scheduler.js must never import from React |
| `useHolidays` ↔ `useSchedule` | Hook composition in App.jsx — useHolidays result passed into useSchedule | App.jsx calls both hooks, passes holidays from one into the other |
| `useCourseData` ↔ `CourseForm` | Props — App.jsx destructures hook return, passes individual handlers as props | No change to CourseForm's prop interface required |
| `useSchedule` ↔ `ScheduleList` | Props — App.jsx passes schedule[] directly | No change to ScheduleList's prop interface required |

## Anti-Patterns

### Anti-Pattern 1: Logic Inside useEffect

**What people do:** Keep `calculateSchedule` defined inside `useEffect` or as a `useCallback` that calls `setSchedule`.

**Why it's wrong:** The scheduling logic becomes impossible to unit-test without rendering a component. The current codebase already has this problem — `calculateSchedule` at App.jsx:81 calls `setSchedule` internally, making it a side-effectful function, not a pure computation.

**Do this instead:** Extract to a pure function in `logic/scheduler.js`. The hook calls it and stores the result with `useState`. The pure function knows nothing about React.

### Anti-Pattern 2: Fetching Inside the Algorithm

**What people do:** Call the holiday API inside `calculateSchedule`, or call it inside the `useEffect` that triggers scheduling.

**Why it's wrong:** Creates async scheduling — the algorithm must be synchronous to remain pure and testable. It also conflates two independent concerns: "get holiday data" and "run the algorithm".

**Do this instead:** `useHolidays` fetches and caches independently. The algorithm always receives a synchronous `holidays[]` array. If the array is empty (still loading), the algorithm runs with no holidays blocked — a safe degradation.

### Anti-Pattern 3: One Hook for Everything

**What people do:** Create a single `useScheduler` hook that owns courseData state, fetches holidays, runs the algorithm, and handles exports.

**Why it's wrong:** Recreates the monolith in hook form. State for courseData changes on every keystroke; holiday data changes at most once per page load; schedule recomputes when either changes. Bundling them prevents independent testing and makes debouncing harder.

**Do this instead:** Three focused hooks with clear ownership (see State Ownership Map above). App.jsx composes them.

### Anti-Pattern 4: Passing holidays as a Global / Context

**What people do:** Put the holidays array in React Context to avoid prop-threading.

**Why it's wrong:** Context is for data consumed by many components at different tree depths. Holidays are consumed by exactly one thing: the scheduling algorithm (via `useSchedule`). Using Context here is over-engineering for a two-level prop pass.

**Do this instead:** `useHolidays` → App.jsx → `useSchedule`. The pass-through is one level and explicit.

## Scaling Considerations

This is a client-only, single-user app. Traditional scaling (users, servers) is not relevant. The relevant "scaling" is code complexity:

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (1 course, ~360 lines) | Extract hooks + pure function as described — recovers maintainability |
| Multiple courses (future) | `useCourseData` becomes `useCourseList`; `useSchedule` accepts `courseId`; scheduler.js unchanged |
| Multi-year spans | `useHolidays` already designed for multi-year: pass `years[]`, fetches each independently |
| Performance (long courses, 150+ sessions) | Add 150ms debounce in `useSchedule` before calling `calculateSchedule`; add list virtualization in `ScheduleList` |

## Sources

- Direct inspection of `src/App.jsx`, `src/logic/constants.js`, `src/logic/utils.js`, `src/components/` (all files)
- `.planning/codebase/ARCHITECTURE.md` — existing architectural description
- `.planning/codebase/CONCERNS.md` — identified technical debt items
- `.planning/PROJECT.md` — requirements and constraints
- nager.date API: https://date.nager.at/swagger/index.html (endpoint structure; no key required, public REST API)
- React documentation on custom hooks: https://react.dev/learn/reusing-logic-with-custom-hooks (hook extraction rationale is stable, HIGH confidence)

---
*Architecture research for: PlanificadorClases — monolith decomposition*
*Researched: 2026-03-26*
