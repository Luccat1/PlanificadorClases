# Pitfalls Research

**Domain:** React scheduling app — test retrofitting, external API with offline fallback, large component refactor, calendar/date algorithm
**Researched:** 2026-03-26
**Confidence:** HIGH (derived from direct code inspection of App.jsx, utils.js, constants.js, plus well-established React/testing community patterns)

---

## Critical Pitfalls

### Pitfall 1: Testing `calculateSchedule` as a React side-effect instead of a pure function

**What goes wrong:**
`calculateSchedule` is currently a `useCallback` that calls `setSchedule(sessions)` internally. Writing tests for it requires mounting the full `App` component, firing `useEffect`, and asserting on rendered output. This makes tests slow, fragile (coupled to DOM/UI), and hard to isolate — a single UI change unrelated to scheduling logic breaks dozens of schedule tests.

**Why it happens:**
The algorithm was written inside a React component to have easy access to `courseData` state. The shortcut is natural during initial development but creates a testing dead end: you cannot call the function directly, pass inputs, and inspect return values without React's machinery.

**How to avoid:**
Extract `calculateSchedule` into a pure function in `src/logic/schedule.js` that accepts `(courseData, holidays)` as arguments and returns a `sessions[]` array. The hook or `useEffect` in `App.jsx` then just calls this function and feeds the result to `setSchedule`. Pure functions are trivially testable with Vitest — no jsdom, no rendering, no async.

**Warning signs:**
- Test file imports `App` and calls `render()` just to test scheduling output
- Tests need `waitFor` or `act` wrappers to observe schedule changes
- A CSS className change in `App.jsx` fails a scheduling assertion

**Phase to address:**
App.jsx refactor phase (extract algorithm to `src/logic/schedule.js` before writing tests). If tests are written first against the current structure, they will need to be rewritten after extraction anyway.

---

### Pitfall 2: Date timezone offset silently shifting calendar dates by one day

**What goes wrong:**
`new Date(courseData.startDate + 'T00:00:00')` correctly anchors to local midnight. However, `date.toISOString()` always returns UTC — on a machine in UTC-3 (Chile), calling `toISOString().split('T')[0]` on a local-midnight Date object returns the previous calendar day (e.g., local March 15 00:00 ART → UTC March 14 21:00 → `'2026-03-14'`). This causes holiday lookups to miss by one day and the generated `dateStr` to be wrong in any Chilean timezone.

**Why it happens:**
`App.jsx` already guards `startDate` with `+ 'T00:00:00'` (line 87), which is correct. But `dateStr: current.toISOString().split('T')[0]` (line 127) uses `toISOString()` on the iterated `current` object, which is at local midnight — this is fine in UTC+0 but broken in negative-offset timezones. The bug is currently masked only if the deployment environment happens to be UTC.

**How to avoid:**
Replace `date.toISOString().split('T')[0]` with a local-date formatter:
```js
const toLocalDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
```
Use this function for both `dateStr` in the session object and for all holiday lookups. Write one Vitest unit test that constructs a session starting at a UTC-3-equivalent offset and asserts the `dateStr` matches the expected local date.

**Warning signs:**
- Manual testing on a machine set to UTC passes but a Chilean professor's machine fails
- Holidays on the 1st of a month appear on the last day of the prior month in the export
- Tests pass in CI (likely UTC) but fail locally in Chile

**Phase to address:**
Testing phase (a timezone unit test will immediately surface this) and algorithm extraction phase (fix should live in the pure `schedule.js` function).

---

### Pitfall 3: `useEffect` + `calculateSchedule` dependency cycle creating infinite re-renders or stale closures

**What goes wrong:**
`calculateSchedule` is a `useCallback` that depends on `[courseData, isDateExcluded]`. `isDateExcluded` is itself a `useCallback` depending on `[courseData.customExcludedDates]`. The `useEffect` at line 144 depends on `[courseData, calculateSchedule]`. If any new state variable introduced during the refactor is added to `courseData` or read inside `isDateExcluded`, the dependency chains must be updated or React will either warn about missing deps (ESLint react-hooks plugin) or silently use stale values. Adding the holiday API response as state (e.g., `const [holidays, setHolidays] = useState([])`) without including it in `isDateExcluded`'s deps will cause holidays fetched after mount to never be used for exclusion.

**Why it happens:**
React's closure model means each render captures a snapshot. When `isDateExcluded` is memoized with only `customExcludedDates`, it closes over `CHILEAN_HOLIDAYS_2026` as a module-level constant — safe today. After the API migration, holidays becomes state, and the `useCallback` will need to include the new `holidays` state in its dep array. The migration step is easy to forget.

**How to avoid:**
As part of the API integration, pass `holidays` explicitly as a parameter to the extracted `isDateExcluded` (or `schedule.js`) function rather than closing over state. This makes the dependency explicit and side-effect-free. Also enable `eslint-plugin-react-hooks` (`rules-of-hooks` + `exhaustive-deps`) before writing any new hook code — it will catch missing dependencies automatically.

**Warning signs:**
- After fetching new holiday data, the schedule does not update even though `holidays` state changed
- Adding `holidays` to a `useCallback` dep array triggers an infinite `useEffect` loop
- ESLint exhaustive-deps warnings that were suppressed with `// eslint-disable`

**Phase to address:**
Holiday API integration phase. The refactor phase should prepare the function signatures to accept holidays as a parameter rather than close over them.

---

### Pitfall 4: `sessionsPerWeek` cap breaking valid week boundaries when weeks span month/year transitions

**What goes wrong:**
Implementing "max N sessions per week" using ISO week numbers or Sunday-to-Saturday windows produces incorrect results at year boundaries. Week 53 of one year may share days with week 1 of the next. Chilean academic calendars frequently span two calendar years. If the week boundary logic uses `Math.floor(daysSinceStart / 7)` instead of real calendar weeks, it will count a 6-day span as one "week" when it crosses a Sunday, creating sessions on what the professor considers two separate weeks.

**Why it happens:**
Week-boundary logic feels simple (divide by 7) but a "week" in the context of a university schedule means Sunday-to-Saturday (or Monday-to-Sunday) as shown on a wall calendar, not 7 consecutive days from an arbitrary start. The current algorithm iterates day-by-day, which is correct for individual day checking but needs a separate week-tracking mechanism for the cap.

**How to avoid:**
Track weeks using a key derived from the actual calendar week: `${year}-W${isoWeekNumber}` or simply using the date of the Monday that starts that week (computed via `date - (date.getDay() === 0 ? 6 : date.getDay() - 1) days`). Maintain a `Map<weekKey, count>` during the schedule generation loop. Increment the count for each session placed; skip the day (but continue the loop) if `count >= sessionsPerWeek`. Write specific Vitest cases for: (a) a week spanning December 31/January 1, (b) the first week where `classDays` are fully within the cap, and (c) a week where the cap forces skipping a valid class day.

**Warning signs:**
- Test: set `sessionsPerWeek: 1`, two `classDays`, start date on a Monday — expect one session per week but get two in the first week
- The generated schedule places more sessions than `sessionsPerWeek` in any given Sunday-to-Saturday window
- Sessions on Saturday and Monday of consecutive weekends are counted in the same "week"

**Phase to address:**
`sessionsPerWeek` algorithm phase. Must be tested with Vitest before the feature is considered done — this is the highest-risk algorithm change in the milestone.

---

### Pitfall 5: Offline API fallback silently returning stale or wrong-year holidays

**What goes wrong:**
The fallback path (use cached data when nager.date fetch fails) will return 2026 holiday data for a course in 2027 if the 2027 fetch fails and no 2027 cache entry exists. The app gives no indication that the holidays shown are from the wrong year. Professors trust the tool to produce accurate schedules; a silent wrong-year fallback is worse than showing zero holidays with a warning.

**Why it happens:**
Fetch-with-fallback is typically implemented as: try fetch → on error use cached. Developers check "does a cached value exist?" but do not check "is the cached value for the correct year?". The cache key must include the year, and the fallback logic must distinguish "cached data for year X" from "cached data for some other year."

**How to avoid:**
Key the localStorage cache by year: `holidays_CL_2026`, `holidays_CL_2027`. When a fetch fails and no key exists for that year, return an empty array and display a visible warning banner: "No se pudieron cargar los feriados de 2027. Verifique la programación manualmente." Never silently fall back to a different year's data. Write a test that mocks `fetch` to reject and asserts both that the returned holiday list is empty and that a warning flag is set in the return value.

**Warning signs:**
- Course starting in 2027 shows holiday markers but the network tab shows the fetch failed
- Changing the year in the form does not trigger a new fetch
- The `console.log` added for debugging shows "using cache" but the console never shows which year was cached

**Phase to address:**
Holiday API integration phase. The cache keying strategy and warning state must be designed upfront, not patched afterward.

---

### Pitfall 6: Extracting `App.jsx` state into a hook breaks localStorage hydration timing

**What goes wrong:**
`App.jsx` initializes `courseData` with a lazy `useState` initializer that reads from `localStorage`. When this state is moved into a custom hook (e.g., `useCourseData`), the hydration behavior is preserved — but if `darkMode` and `viewMode` are also moved into hooks or extracted separately, and any of those hooks attempt to read `localStorage` before the component mounts in a test environment (jsdom without `localStorage` populated), tests will fail with stale defaults or errors rather than testing actual persistence behavior.

**Why it happens:**
Lazy `useState` initializers run synchronously before the first render. In a Vitest/jsdom environment, `localStorage` starts empty. Tests that verify "darkMode remembered from last session" must explicitly set `localStorage` before calling `render()`. If the hook encapsulates `localStorage` reads and writes, tests must know to seed `localStorage` before rendering — this is easy to miss in the test setup.

**How to avoid:**
Write tests for each persistence hook before or alongside the extraction. Each test that relies on a persisted default must include a `beforeEach` that calls `localStorage.setItem(...)` with the expected value. Use `afterEach(() => localStorage.clear())` to prevent test pollution across the suite. This pattern is standard in RTL (React Testing Library) but must be consciously applied to every hook test that touches `localStorage`.

**Warning signs:**
- A test for "viewMode defaults to list" passes but "viewMode remembers calendar" fails
- Tests pass in isolation but fail when run as a suite (localStorage pollution)
- The hook test uses `render()` but then checks the DOM before the `useEffect` that reads `localStorage` has run (wrong tick)

**Phase to address:**
App.jsx refactor phase. Tests for each extracted hook should be written as part of the extraction, not deferred.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `calculateSchedule` as `useCallback` inside `App.jsx` | No refactor needed now | Algorithm is untestable without mounting the full component; every scheduling test is an integration test | Never — extraction is low-risk and unlocks unit testing |
| Use `CHILEAN_HOLIDAYS_2026` constant as fallback for failed API fetch | Simple code | Returns wrong-year data silently for any non-2026 course; professors get incorrect schedules | Never for production — use empty array + warning instead |
| Skip `sessionsPerWeek` cap if `sessionsPerWeek >= classDays.length` | Avoids edge case handling | The dead state field stays dead; professors can't trust the cap | Only acceptable as a documented explicit check, not as an implicit omission |
| Write all tests as `render(<App />)` integration tests | Faster initial test writing | Slow test suite, brittle to UI changes, cannot isolate algorithm bugs | Acceptable for a small number of smoke tests; not for algorithm coverage |
| Hardcode `safetyCounter < 1500` without surfacing it to the user | Prevents infinite loops | A misconfigured course (e.g., 0 valid class days for 6 months) silently produces an empty or truncated schedule with no user feedback | Acceptable as an internal guard only if paired with a validation check that prevents reaching this state |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| nager.date API | Fetch on every render or every `courseData` change | Fetch once per year on demand; cache result in `localStorage` with key `holidays_CL_{year}`; skip fetch if valid cache exists |
| nager.date API | Assume response is always an array of `{ date, localName }` objects | Validate response shape before using; nager.date returns `localName` (Spanish) and `name` (English) — use `localName` for Chilean Spanish UI |
| nager.date API | Fetch only the year of `startDate` | A course starting in November 2026 may have sessions in January 2027; check if the schedule spans multiple years and fetch all required years |
| SheetJS (xlsx) via CDN | CDN URL changes or becomes unavailable, silently breaking Excel export | Migrate to npm package (`xlsx` or `exceljs`); bundle it rather than load from external CDN |
| localStorage | Write entire `courseData` object on every keystroke with no debounce | The existing `useEffect` writes on every `courseData` change — this is fine for this data size; would be a concern if courseData grows to include large arrays (e.g., full schedule) |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `calculateSchedule` runs synchronously in `useEffect` on every keystroke | Typing in the "Total Hours" field causes visible lag for large hour values | Debounce the `useEffect` trigger or move computation to a web worker for very large schedules | Noticeable at ~200+ sessions (high hour count + short sessions); typical university courses are unlikely to reach this |
| `stats` `useMemo` iterates `schedule` — fine now, but will re-run if `courseData.totalHours` changes even when schedule hasn't | Subtle stale calculation if `schedule` and `totalHours` get out of sync | Depend only on `schedule` in the `useMemo`; derive `totalHours` from the last `session.accHours` rather than `courseData.totalHours` | Not a crash, just a potential off-by-one in "avg hrs/week" display |
| No virtualization in `ScheduleList` table | DOM grows to 100+ `<tr>` elements; scroll stutter on low-end devices | Add `react-window` or `@tanstack/virtual` if sessions exceed ~100 | Low risk for typical course lengths (30-80 sessions) |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `window.confirm()` for reset confirmation | Blocked in cross-origin iframes; non-styleable; auto-dismissed in some headless environments | Acceptable for current deployment; replace with in-app modal if the app is ever embedded in a university LMS iframe |
| `JSON.parse` of `localStorage` data without schema validation | Malformed or tampered localStorage could cause the algorithm to run with unexpected values (e.g., `hoursPerSession: -5`) | The existing try/catch in the lazy initializer catches parse errors; add input validation after hydration to sanitize numeric fields before passing to `calculateSchedule` |
| CORS assumption on nager.date | nager.date supports CORS from browsers; no concern for this client-side app | Verify CORS headers still present if the API integration breaks in testing |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No feedback when `startDate` is blank and schedule is empty | Professor sees empty schedule area with no explanation of why | Show a specific prompt: "Selecciona una fecha de inicio para generar el cronograma" rather than the generic "Listos para empezar" message |
| `recoverySessionsCount` defaults to 0 but the footer always shows "Recuperación Activa: primeras 0 sesiones" | Footer widget is confusing when recovery is disabled | Conditionally hide the recovery footer block when `recoverySessionsCount === 0` |
| Input validation errors that appear only after submitting (or not at all currently) | Professor enters `totalHours: -10` and gets an empty schedule with no explanation | Validate on blur for numeric fields; show inline error messages; prevent `calculateSchedule` from running while inputs are invalid |
| Dark mode not persisted — resets to light on refresh | User toggles dark mode, refreshes, gets light mode; disorienting for repeated use | Store `darkMode` in localStorage under a separate key (e.g., `planificador_darkMode`) and read it in the lazy `useState` initializer, same pattern as `courseData` |
| Excel export filename uses `courseName || 'Curso'` — produces `Cronograma_Curso.xlsx` for unnamed courses | Multiple unnamed exports overwrite each other | Append a timestamp: `Cronograma_Curso_2026-03.xlsx` when name is blank |

---

## "Looks Done But Isn't" Checklist

- [ ] **Holiday API integration:** The fetch fires and data appears — verify the cache key includes the year (`holidays_CL_2026` not just `holidays_CL`), and that a multi-year course fetches both years.
- [ ] **sessionsPerWeek cap:** The schedule respects the cap in the UI — write a Vitest case with `sessionsPerWeek: 1` and two `classDays`; confirm no week in the output has more than 1 session.
- [ ] **Offline fallback:** The app degrades gracefully — test by mocking `fetch` to throw; confirm a warning is shown and the schedule still generates (with empty holidays, not wrong-year holidays).
- [ ] **App.jsx refactor:** `App.jsx` is smaller — verify the extracted `schedule.js` function is imported and called, not duplicated inline; confirm `App.jsx` contains no scheduling loop logic.
- [ ] **Input validation:** Invalid inputs show errors — verify `totalHours: 0`, `hoursPerSession: 0`, and blank `startDate` each produce visible error messages, not just silent empty schedules.
- [ ] **localStorage persistence for dark mode:** Toggle dark mode, hard-refresh — verify the mode is remembered. Also verify `prefers-color-scheme: dark` sets dark mode on first visit (before any manual toggle).
- [ ] **Export metadata:** Excel header row includes course name, semester, professor name — verify all four metadata fields appear in the exported file, not just the course name that was already there.
- [ ] **Recovery session config:** The configurable extra minutes field is plumbed all the way to `getEffectiveHours` — verify changing from 30 to 15 extra minutes produces different `effHours` values in the output, not just a different label.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Tests written against `App` component before algorithm extraction | HIGH | Delete component tests for scheduling logic; extract algorithm to pure function; rewrite as unit tests against the function |
| Wrong-year holiday cache deployed to users | MEDIUM | Add a cache-version key that forces a re-fetch; clear the affected localStorage key on next load |
| `sessionsPerWeek` cap off-by-one in week boundary logic | MEDIUM | Add failing Vitest case that documents the bug; fix week-key derivation in `schedule.js`; no UI changes needed |
| Timezone `toISOString()` bug discovered after deploy | LOW | Fix `toDateStr` helper in `schedule.js`; the change is isolated to one function; no state migration needed |
| App.jsx refactor introduces regression in schedule output | LOW-MEDIUM | The extracted `schedule.js` pure function can be tested in isolation; run the full Vitest suite before deploying; a regression will show as a failing test before it reaches users |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Algorithm untestable as `useCallback` | App.jsx refactor (extract before writing tests) | `calculateSchedule` is importable and callable without `render()` in Vitest |
| Timezone off-by-one in `dateStr` | Testing phase (unit test surfaces it) | Vitest test passes with UTC-3 offset dates |
| `useCallback` dep chain breaks holiday API state | Holiday API integration phase | ESLint exhaustive-deps passes; changing `holidays` state triggers schedule recalculation |
| `sessionsPerWeek` week-boundary edge cases | sessionsPerWeek algorithm phase | Vitest cases cover year-boundary weeks, cap=1 with 2 classDays, first week partial |
| Offline fallback returns wrong-year holidays | Holiday API integration phase | Mock-fetch test confirms warning flag set and empty array returned for cache miss |
| localStorage hydration in hook tests | App.jsx refactor phase | All extracted hook tests use `localStorage.setItem` in `beforeEach`; suite passes in any order |
| React `useEffect` / holiday state stale closure | Holiday API integration phase | Integration test: fetch resolves after mount; schedule updates to reflect new holidays |
| `CHILEAN_HOLIDAYS_2026` used as offline fallback | Holiday API integration phase | Code review: no reference to `CHILEAN_HOLIDAYS_2026` in the fetch/fallback path |

---

## Sources

- Direct code inspection: `src/App.jsx`, `src/logic/utils.js`, `src/logic/constants.js` (2026-03-26)
- `.planning/codebase/CONCERNS.md` — identified dead `sessionsPerWeek` field, no test infrastructure, hardcoded 2026 holidays
- `.planning/codebase/TESTING.md` — confirmed zero automated test coverage; `calculateSchedule` at App.jsx:81 is the highest-risk untested area
- `.planning/PROJECT.md` — confirmed milestone scope and constraints
- React hooks exhaustive-deps behavior: well-established React documentation pattern (HIGH confidence)
- `Date.prototype.toISOString()` UTC behavior: ECMA-262 specification (HIGH confidence)
- nager.date API response shape (`localName`, `name` fields): API documentation pattern (MEDIUM confidence — verify against live endpoint during integration)

---
*Pitfalls research for: React course scheduling app (PlanificadorClases) — milestone adding tests, holiday API, sessionsPerWeek cap, App.jsx refactor*
*Researched: 2026-03-26*
