# Phase 2: Test Infrastructure - Research

**Researched:** 2026-03-26
**Domain:** Vitest 3 + React Testing Library + MSW 2 test infrastructure on Vite 7
**Confidence:** HIGH

## Summary

Phase 2 installs and configures a complete test stack — Vitest 3, @vitest/coverage-v8, React Testing Library, @testing-library/user-event, @testing-library/jest-dom, and MSW 2 — then writes unit tests for the pure scheduling functions and component tests for CourseForm and ScheduleList. The installed Vite version is 7.3.1. The project uses `"type": "module"` in package.json (ESM), which Vitest handles natively.

All version ranges for the locked stack have been verified against the npm registry as of 2026-03-26. Vitest 3.2.4 is the latest 3.x release. The critical peer-dependency concern from STATE.md ("Vite 7 + Vitest 2 compatibility unconfirmed") is fully resolved: Vitest 3.x is forward-compatible with Vite 5+ and 7.x with no special workarounds. Vitest 3 lists only `jsdom`, `happy-dom`, Node types, and browser-related packages as optional peer dependencies; Vite itself is listed as a dependency of Vitest (not a peer dep in the traditional sense) and Vitest 3 explicitly targets Vite 5+.

The scheduling engine (`src/logic/scheduleEngine.js`) is a pure-function ESM module with no React dependencies, making unit testing straightforward. CourseForm accepts all state as props, enabling the wrapper-component test pattern. ScheduleList accepts a `schedule` array as a prop and renders `session.date.toLocaleDateString(...)` directly — the test must supply real `Date` objects in the mock schedule array, not plain strings.

**Primary recommendation:** Install `vitest@3`, `@vitest/coverage-v8@3`, `@testing-library/react@16`, `@testing-library/user-event@14`, `@testing-library/jest-dom@6`, and `msw@2` as devDependencies. Add a `test:` block to the existing `vite.config.js`. Wire `@testing-library/jest-dom` and the MSW Node server in a single setup file at `src/test-setup.js`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Vitest 3 is the test runner. Install `vitest@3` and `@vitest/coverage-v8@3`. Exact peer-dep requirements for Vite 7 confirmed (see Standard Stack below).
- **D-02:** Configure inside `vite.config.js` under the `test:` key with `environment: 'jsdom'`. Do not create a separate vitest config file — extend the existing config.
- **D-03:** Add `npm test` and `npm run test:coverage` scripts to `package.json`. Coverage generates a report only (stdout + `coverage/` directory) — no minimum threshold enforced.
- **D-04:** Install `@testing-library/react` and `@testing-library/user-event` for component tests.
- **D-05:** Install `@testing-library/jest-dom` for extended DOM matchers. Import in the Vitest global setup file so matchers are available in all tests without explicit imports.
- **D-06:** Co-located `__tests__/` directories. Logic tests go in `src/logic/__tests__/`, component tests in `src/components/__tests__/`. Test files named `{subject}.test.{js,jsx}`.
- **D-07:** Phase 2 tests CourseForm (TEST-06) and ScheduleList (TEST-07) only. CalendarGrid is NOT tested in Phase 2.
- **D-08:** CourseForm tests use a small wrapper component that holds real state. Fire `userEvent.type` / `userEvent.clear` to trigger input changes, then assert displayed validation error messages.
- **D-09:** Install MSW in Phase 2 as minimal scaffold only. Create `src/mocks/handlers.js` (empty array export) and `src/mocks/server.js` (MSW Node server wired into the Vitest setup file). No active handlers yet.
- **D-10:** `npm run test:coverage` generates a report with no enforced threshold.

### Claude's Discretion

- Exact Vitest config options (globals, include patterns, exclude patterns) — Claude decides based on project structure
- Whether to use `describe`/`it` or `test` naming convention inside test files
- Setup file name and location (e.g., `src/test-setup.js`)
- MSW server.js lifecycle hooks — standard RTL pattern applies
- Whether to add `data-testid` attributes to components or use semantic `getByRole` / `getByLabelText` queries (prefer semantic queries where feasible)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEST-01 | Vitest + `@vitest/coverage-v8` + React Testing Library configured in `vite.config.js` with `jsdom` environment; `npm test` and `npm run test:coverage` scripts added | Standard Stack section documents exact versions and config shape |
| TEST-02 | Unit tests cover `getEffectiveHours()` for all three modes (chronological, pedagogical ×60/45, DGAI ×60/35) | Code Examples section shows the multiplier map; source confirmed in `src/logic/utils.js` |
| TEST-03 | Unit tests cover `calculateSchedule()` — session count, hour accumulation, holiday skipping, mid-course marker detection, recovery session bonus hours | Architecture Patterns section documents minimal courseData fixture shape |
| TEST-04 | Unit tests cover sessionsPerWeek hard cap including week-boundary edge cases (Mon–Sun rollover, courses spanning year boundaries) | Common Pitfalls documents the year-boundary edge case and getWeekKey behavior |
| TEST-05 | Unit tests cover timezone edge case — schedule dates correct in UTC-3/UTC-4 offset | Common Pitfalls section explains `new Date(year, month, day)` vs ISO string parsing; code example included |
| TEST-06 | Component tests cover CourseForm — field changes propagate correctly, validation errors appear for invalid inputs | Architecture Patterns: wrapper component pattern; CourseForm props interface documented |
| TEST-07 | Component tests cover ScheduleList — renders correct number of session rows, mid-course marker appears at correct position | Architecture Patterns: ScheduleList prop shape documented; session Date object requirement flagged |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **Shell:** Use Unix/bash syntax — always. Git Bash on Windows 11.
- **Paths:** Unix paths only (`/c/Users/Usuario/...`).
- **Stack:** React 18, Vite, Tailwind CSS, Lucide React (relevant here: don't add conflicting tooling).
- **Scripts:** `npm run dev`, `npm run build`, `npm run lint`, `npm run deploy` already in package.json — do not modify them. Only append `test` and `test:coverage`.

---

## Standard Stack

### Core (verified against npm registry 2026-03-26)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 3.2.4 (latest 3.x) | Test runner, native Vite integration | Same config file as Vite; ESM-native; no Babel needed |
| @vitest/coverage-v8 | 3.2.4 (must match vitest) | V8-based coverage reports | Built in, zero extra config; ships with Vitest |
| @testing-library/react | 16.3.2 | Render React components in tests | RTL standard for React 18; wraps jsdom |
| @testing-library/user-event | 14.6.1 | Simulate user interactions | Fires real browser-like events; required for `type`/`clear` |
| @testing-library/jest-dom | 6.9.1 | Custom DOM matchers for Vitest | `toBeInTheDocument`, `toHaveValue`, `toBeDisabled`, etc. |
| jsdom | 29.0.1 (already latest) | DOM environment for Vitest | Peer dep of Vitest when using `environment: 'jsdom'` |
| msw | 2.12.14 (latest 2.x) | API mocking scaffold | Industry standard; Node adapter works in Vitest |

### Version Verification Details

All versions confirmed via `npm view [package] version` on 2026-03-26:
- `vitest`: latest 3.x = **3.2.4** (published 2025)
- `@vitest/coverage-v8`: must match vitest exactly — **3.2.4**
- `@testing-library/react`: **16.3.2** — supports React 18 and 19
- `@testing-library/user-event`: **14.6.1**
- `@testing-library/jest-dom`: **6.9.1**
- `msw`: **2.12.14**

### Vite 7 + Vitest 3 Compatibility (D-01 confirmed)

Vitest 3.x peer dependency requirements: `jsdom: '*'`, `@types/node: '^18.0.0 || ^20.0.0 || >=22.0.0'` (optional). No Vite version constraint in peer deps — Vite is a hard dependency of Vitest (not a peer dep), and Vitest 3 targets Vite 5+. Current environment has Node 24.12.0 which satisfies `>=22.0.0`. **Vite 7 + Vitest 3 is confirmed compatible.**

The STATE.md blocker ("Vite 7 + Vitest 2 compatibility unconfirmed") is resolved differently: install Vitest 3, not Vitest 2.

**Installation:**

```bash
npm install --save-dev vitest@3 @vitest/coverage-v8@3 @testing-library/react@16 @testing-library/user-event@14 @testing-library/jest-dom@6 msw@2 jsdom
```

Note: `jsdom` must be installed explicitly when using `environment: 'jsdom'` in Vitest (it is a peer dep, not auto-installed).

---

## Architecture Patterns

### Recommended Project Structure After Phase 2

```
src/
├── logic/
│   ├── scheduleEngine.js      # pure functions (existing)
│   ├── utils.js               # getEffectiveHours (existing)
│   ├── constants.js           # DAY_MAPPING, DAY_NAMES (existing)
│   └── __tests__/
│       ├── getEffectiveHours.test.js   # TEST-02
│       ├── calculateSchedule.test.js   # TEST-03, TEST-04, TEST-05
│       └── sessionsPerWeek.test.js     # TEST-04 (can be merged into above)
├── components/
│   ├── CourseForm.jsx          # (existing)
│   ├── ScheduleList.jsx        # (existing)
│   └── __tests__/
│       ├── CourseForm.test.jsx  # TEST-06
│       └── ScheduleList.test.jsx # TEST-07
└── mocks/
    ├── handlers.js             # empty array — MSW scaffold (D-09)
    └── server.js               # MSW Node server setup
src/test-setup.js               # jest-dom + MSW lifecycle wiring
vite.config.js                  # extended with test: block
```

### Pattern 1: Vitest config in vite.config.js (D-02)

**What:** Extend the existing `vite.config.js` with a `test:` key. The `globals: true` option enables `describe`/`it`/`expect` without imports; `setupFiles` points to the single setup file.

**When to use:** Always — D-02 forbids a separate `vitest.config.js`.

```javascript
// vite.config.js — extend, do not replace existing config
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: './',  // MUST be preserved (D-02 / canonical_refs)
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test-setup.js'],
        include: ['src/**/*.test.{js,jsx}'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
        },
    },
})
```

### Pattern 2: Setup file — jest-dom + MSW lifecycle (D-05, D-09)

```javascript
// src/test-setup.js
import '@testing-library/jest-dom'
import { server } from './mocks/server.js'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Pattern 3: MSW Node server scaffold (D-09)

```javascript
// src/mocks/handlers.js
export const handlers = []
```

```javascript
// src/mocks/server.js
import { setupServer } from 'msw/node'
import { handlers } from './handlers.js'

export const server = setupServer(...handlers)
```

### Pattern 4: Minimal courseData fixture for calculateSchedule tests

`calculateSchedule` reads these fields from `courseData`. The fixture must include all of them or the function will produce unexpected results:

```javascript
const baseCourseData = {
    startDate: '2026-03-02',          // Monday
    classDays: ['monday', 'wednesday'],
    totalHours: 10,
    hoursPerSession: 1,
    hourType: 'chronological',
    recoverySessionsCount: 0,
    sessionsPerWeek: 0,               // 0 = uncapped
    customExcludedDates: [],
}
```

### Pattern 5: CourseForm wrapper component (D-08)

```jsx
// Inside CourseForm.test.jsx
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CourseForm from '../CourseForm'

function Wrapper({ initial }) {
    const [courseData, setCourseData] = useState(initial)

    const handleInputChange = (field, value) =>
        setCourseData(prev => ({ ...prev, [field]: value }))
    const handleDayToggle = (day) =>
        setCourseData(prev => ({
            ...prev,
            classDays: prev.classDays.includes(day)
                ? prev.classDays.filter(d => d !== day)
                : [...prev.classDays, day],
        }))

    return (
        <CourseForm
            courseData={courseData}
            onInputChange={handleInputChange}
            onDayToggle={handleDayToggle}
            onAddDate={() => {}}
            onRemoveDate={() => {}}
        />
    )
}
```

### Pattern 6: ScheduleList test — supply real Date objects

ScheduleList calls `session.date.toLocaleDateString(...)` directly. The test must supply `Date` objects, not strings:

```javascript
// Correct mock schedule entry
const mockSession = {
    number: 1,
    date: new Date(2026, 2, 2),   // March 2, 2026 — local constructor, NOT ISO string
    dateStr: '2026-03-02',
    dayName: 'Lunes',
    isRecovery: false,
    isMidCourse: false,
    chronoHours: 1,
    effHours: 1,
    accHours: 1,
}
```

### Anti-Patterns to Avoid

- **Using `new Date('YYYY-MM-DD')` in tests:** ISO string dates parse as UTC midnight, causing off-by-one day errors in UTC-3. Always use `new Date(year, month, day)` (month is 0-indexed) for locale-sensitive tests. This is the exact bug TEST-05 validates.
- **Importing `@testing-library/jest-dom` in every test file:** Import once in `test-setup.js` via `globals: true` + `setupFiles`.
- **Creating `vitest.config.js`:** D-02 forbids it. Put everything in `vite.config.js`.
- **Omitting `globals: true` in Vitest config:** Without it, `describe`/`it`/`expect` must be imported in each test file. Setting `globals: true` removes boilerplate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOM assertions (`toBeInTheDocument`) | Custom `querySelector` checks | `@testing-library/jest-dom` | Handles timing, async, a11y; covers 20+ matchers |
| User interaction simulation | `fireEvent` raw dispatch | `@testing-library/user-event` | `userEvent` fires pointerdown/focus/input/change in sequence like a real browser |
| Fetch/API interception in tests | Monkey-patching `global.fetch` | MSW 2 Node adapter | Intercepts at the network level; works identically in Node and browser |
| React component rendering in Node | Manual JSDOM setup | `@testing-library/react` render | Handles React 18 concurrent mode, act() wrapping, cleanup |

**Key insight:** Each of these libraries handles subtle edge cases (async state updates, event bubbling, act() flushing) that a hand-rolled solution will miss in ways that are hard to diagnose.

---

## Common Pitfalls

### Pitfall 1: ISO Date String Parses as UTC (TEST-05 critical)

**What goes wrong:** `new Date('2026-03-02')` parses as `2026-03-02T00:00:00Z` (UTC midnight). In UTC-3, this renders as `2026-03-01T21:00:00-03:00` — the previous day. Calling `.toLocaleDateString()` on such a Date gives the wrong date for Chilean users.

**Why it happens:** ECMA-262 specifies that date-only ISO strings (`YYYY-MM-DD`) are parsed as UTC, but datetime strings (`YYYY-MM-DDT00:00:00`) are parsed as local time.

**How to avoid:** Always use `new Date(year, month, day)` with 0-indexed months to get local midnight. The `calculateSchedule` source code already uses `new Date(courseData.startDate + 'T00:00:00')` to force local interpretation.

**Warning signs:** Test date assertions that pass in UTC+0 CI but fail locally in UTC-3.

### Pitfall 2: sessionsPerWeek Year-Boundary Edge Case (TEST-04)

**What goes wrong:** The `getWeekKey` function returns the Monday of the week containing a date. A course with `classDays: ['monday']` and `sessionsPerWeek: 1` spanning December 2026 – January 2027 should schedule sessions in both weeks. If the week key does not roll over correctly between years (e.g., last week of December has a key in 2026, first week of January gets its own key), the cap behaves correctly. The test must verify the counter resets for the new week.

**Why it happens:** JavaScript `setDate` handles month/year overflow correctly, but if the week key were constructed differently (e.g., using week number + year-only), the year boundary could cause collisions.

**How to avoid:** Test explicitly: start a course on `2026-12-28` (Monday, `sessionsPerWeek: 1`), assert that both `2026-12-28` and `2027-01-04` appear in the schedule.

**Warning signs:** Missing sessions in early January in courses that start in late December.

### Pitfall 3: @testing-library/jest-dom Not Available Without Setup File

**What goes wrong:** `toBeInTheDocument()` throws `TypeError: expect(...).toBeInTheDocument is not a function` even after installing the package, because Vitest doesn't automatically extend `expect` with jest-dom matchers.

**Why it happens:** `@testing-library/jest-dom` exports matchers but requires explicit registration. Without `setupFiles` pointing to a file that imports it, the matchers are never registered.

**How to avoid:** Add `import '@testing-library/jest-dom'` to `src/test-setup.js` and reference it in `test.setupFiles` in vite.config.js.

### Pitfall 4: MSW 2 API Change From MSW 1

**What goes wrong:** Using MSW 1 patterns (`setupServer` from `msw/node` still works in MSW 2, but request handler syntax changed). In MSW 2, `rest.get(...)` is replaced by `http.get(...)` and response bodies must use `HttpResponse`.

**Why it happens:** MSW 2 was a major breaking API revision.

**How to avoid:** For the Phase 2 scaffold (empty handlers), this is not a problem — handlers array is empty. Phase 4 must use MSW 2 syntax: `import { http, HttpResponse } from 'msw'`.

**Warning signs:** If handlers.js is scaffolded with MSW 1 syntax and Phase 4 inherits it.

### Pitfall 5: jsdom Not Installed Separately

**What goes wrong:** Vitest reports "Cannot find package 'jsdom'" at startup even after installing Vitest.

**Why it happens:** `jsdom` is a peer dependency of Vitest, not a hard dependency. Vitest does not install it automatically.

**How to avoid:** Include `jsdom` in the install command. It is already at v29.0.1 on the registry.

### Pitfall 6: CourseForm Has Internal State for newExcludedDate

**What goes wrong:** CourseForm has an internal `useState` for `newExcludedDate` (the "add excluded date" input). The wrapper component does not need to manage this — it is local to CourseForm. Tests that try to provide `newExcludedDate` as a prop will fail.

**Why it happens:** Read the CourseForm source — `newExcludedDate` is managed internally.

**How to avoid:** The wrapper pattern (D-08) is correct as-is. Tests interact with the add-date input via `getByRole('textbox')` or `getByDisplayValue`.

---

## Code Examples

### getEffectiveHours — all three modes

```javascript
// Source: src/logic/utils.js (confirmed)
// Test file: src/logic/__tests__/getEffectiveHours.test.js
import { getEffectiveHours } from '../../logic/utils'

describe('getEffectiveHours', () => {
    it('chronological mode returns hours unchanged', () => {
        expect(getEffectiveHours(2, 'chronological')).toBe(2)
    })
    it('pedagogical mode multiplies by 60/45', () => {
        expect(getEffectiveHours(1, 'pedagogical')).toBeCloseTo(60 / 45)
    })
    it('dgai mode multiplies by 60/35', () => {
        expect(getEffectiveHours(1, 'dgai')).toBeCloseTo(60 / 35)
    })
    it('unknown mode falls back to multiplier 1', () => {
        expect(getEffectiveHours(3, 'unknown')).toBe(3)
    })
})
```

### calculateSchedule — session count verification

```javascript
// Source: src/logic/scheduleEngine.js (confirmed)
import { calculateSchedule } from '../../logic/scheduleEngine'

const base = {
    startDate: '2026-03-02',
    classDays: ['monday', 'wednesday'],
    totalHours: 4,
    hoursPerSession: 1,
    hourType: 'chronological',
    recoverySessionsCount: 0,
    sessionsPerWeek: 0,
    customExcludedDates: [],
}

it('schedules correct number of sessions', () => {
    const sessions = calculateSchedule(base, [])
    expect(sessions).toHaveLength(4)
})

it('accumulated hours reach totalHours', () => {
    const sessions = calculateSchedule(base, [])
    const last = sessions[sessions.length - 1]
    expect(last.accHours).toBeGreaterThanOrEqual(base.totalHours)
})
```

### calculateSchedule — holiday skipping

```javascript
it('skips holiday dates', () => {
    const holidays = [{ date: '2026-03-02', name: 'Test Holiday' }]
    const sessions = calculateSchedule(base, holidays)
    // First session should skip March 2 and land on March 4 (Wednesday)
    expect(sessions[0].dateStr).toBe('2026-03-04')
})
```

### TEST-05 timezone test — local date constructor

```javascript
// Construct dates using local constructor to avoid UTC-midnight parse
it('produces correct dateStr in UTC-3 environment', () => {
    const courseData = {
        ...base,
        startDate: '2026-03-02',
        classDays: ['monday'],
        totalHours: 1,
    }
    const sessions = calculateSchedule(courseData, [])
    // dateStr must be '2026-03-02', not '2026-03-01' (off-by-one UTC bug)
    expect(sessions[0].dateStr).toBe('2026-03-02')
    // Verify the date object itself uses local midnight
    const d = sessions[0].date
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(2)  // 0-indexed: 2 = March
    expect(d.getDate()).toBe(2)
})
```

### sessionsPerWeek year-boundary test

```javascript
it('caps sessions per week across year boundary Dec/Jan', () => {
    const courseData = {
        ...base,
        startDate: '2026-12-28',          // Monday, last week of 2026
        classDays: ['monday'],
        totalHours: 2,
        sessionsPerWeek: 1,
    }
    const sessions = calculateSchedule(courseData, [])
    expect(sessions[0].dateStr).toBe('2026-12-28')
    expect(sessions[1].dateStr).toBe('2027-01-04')
    expect(sessions).toHaveLength(2)
})
```

### ScheduleList — session row count

```javascript
import { render, screen } from '@testing-library/react'
import ScheduleList from '../ScheduleList'

const makeSession = (n, date) => ({
    number: n,
    date: new Date(date[0], date[1] - 1, date[2]),  // local constructor
    dateStr: `${date[0]}-${String(date[1]).padStart(2,'0')}-${String(date[2]).padStart(2,'0')}`,
    dayName: 'Lunes',
    isRecovery: false,
    isMidCourse: false,
    chronoHours: 1,
    effHours: 1,
    accHours: n,
})

const mockCourseData = { hourType: 'chronological', totalHours: 3 }

it('renders correct number of session rows', () => {
    const schedule = [
        makeSession(1, [2026, 3, 2]),
        makeSession(2, [2026, 3, 4]),
        makeSession(3, [2026, 3, 9]),
    ]
    render(<ScheduleList schedule={schedule} courseData={mockCourseData} viewMode="list" />)
    // Each session has a session number cell
    const rows = screen.getAllByRole('row')
    // 1 header row + 3 data rows
    expect(rows).toHaveLength(4)
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vitest 2.x (Vite 5-era) | Vitest 3.x | Vitest 3.0 released 2025 | Better Vite 5+ integration; STATE.md blocker is resolved by using v3 |
| MSW 1 (`rest.get`) | MSW 2 (`http.get`, `HttpResponse`) | MSW 2.0 released 2023 | Phase 4 handlers must use new syntax; scaffold is unaffected |
| `@testing-library/jest-dom` v5 | v6 | 2023 | v6 drops `@types/jest` as peer dep; works with Vitest globals directly |

**Deprecated/outdated:**

- `fireEvent` for interaction tests: Still works but `@testing-library/user-event` fires the full browser event sequence; use `userEvent` for input tests.
- `MSW rest.get()` syntax from MSW v1: Removed in MSW 2.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest runtime | Yes | 24.12.0 | — |
| npm | Package install | Yes | 11.7.0 | — |
| Vite | Already installed | Yes | 7.3.1 | — |
| jsdom | Vitest jsdom env | Needs install | — (peer dep) | — |

**Missing dependencies with no fallback:**

- `jsdom` must be explicitly installed (peer dep of Vitest, not auto-installed).

**Missing dependencies with fallback:**

- None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vite.config.js` (test: block, Wave 0 task) |
| Quick run command | `npm test` |
| Full suite command | `npm test` (same — all tests run in < 30 s) |
| Coverage command | `npm run test:coverage` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | `npm test` exits 0; `npm run test:coverage` generates coverage/ | smoke | `npm test` | Wave 0 |
| TEST-02 | `getEffectiveHours()` correct for all 3 modes | unit | `npm test -- getEffectiveHours` | Wave 0 |
| TEST-03 | `calculateSchedule()` — session count, hours, holiday skip, mid-course, recovery | unit | `npm test -- calculateSchedule` | Wave 0 |
| TEST-04 | sessionsPerWeek cap including year-boundary | unit | `npm test -- calculateSchedule` | Wave 0 |
| TEST-05 | Timezone UTC-3 date correctness | unit | `npm test -- calculateSchedule` | Wave 0 |
| TEST-06 | CourseForm field changes and validation errors | component | `npm test -- CourseForm` | Wave 0 |
| TEST-07 | ScheduleList session row count and mid-course marker | component | `npm test -- ScheduleList` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test` (all tests — suite is fast)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps (all gaps — no existing test infrastructure)

- [ ] `vite.config.js` — add `test:` block
- [ ] `package.json` — add `test` and `test:coverage` scripts
- [ ] `src/test-setup.js` — jest-dom + MSW server lifecycle
- [ ] `src/mocks/handlers.js` — empty handlers array
- [ ] `src/mocks/server.js` — MSW Node server
- [ ] `src/logic/__tests__/getEffectiveHours.test.js` — TEST-02
- [ ] `src/logic/__tests__/calculateSchedule.test.js` — TEST-03, TEST-04, TEST-05
- [ ] `src/components/__tests__/CourseForm.test.jsx` — TEST-06
- [ ] `src/components/__tests__/ScheduleList.test.jsx` — TEST-07
- [ ] Install: `npm install --save-dev vitest@3 @vitest/coverage-v8@3 @testing-library/react@16 @testing-library/user-event@14 @testing-library/jest-dom@6 msw@2 jsdom`

---

## Open Questions

1. **CourseForm validation errors (D-08 / TEST-06)**
   - What we know: D-08 says tests assert "validation errors appear for invalid inputs" and fire `userEvent.type`/`userEvent.clear`. But CourseForm in `src/components/CourseForm.jsx` has no inline validation error rendering — it's a pure input form with no error state or error message elements.
   - What's unclear: Where do validation errors come from? Either (a) Phase 5 (CORT-01) adds validation and Phase 2 tests are forward-looking, or (b) the test for TEST-06 should only verify "field changes propagate" and the "validation errors" language in TEST-06 is aspirational.
   - Recommendation: Planner should note this explicitly. For Phase 2, TEST-06 can only test field propagation (the wrapper pattern). The validation error part of TEST-06 may require adding minimal validation state to CourseForm in this phase, or limiting the test scope. **Flag for the implementer to confirm with the requirement owner before writing the validation assertion.**

2. **`globals: true` vs explicit imports**
   - What we know: `globals: true` in Vitest config makes `describe`/`it`/`expect`/`beforeAll`/`afterAll`/`afterEach` available globally.
   - What's unclear: ESLint's `eslint-plugin-react` config currently has no Vitest global declarations — running `npm run lint` on test files may produce "no-undef" errors for `describe`, `it`, `expect`.
   - Recommendation: Add `"vitest/globals": true` to the ESLint `env` section, or add an `eslint-disable` comment, or accept lint warnings on test files. Low priority for Phase 2; `npm run lint` is not part of the test gate.

---

## Sources

### Primary (HIGH confidence)

- npm registry (`npm view [package] version/peerDependencies`) — all version data verified 2026-03-26
- `src/logic/scheduleEngine.js` — direct read; function signatures and courseData field names confirmed
- `src/components/CourseForm.jsx` — direct read; props interface and internal state confirmed
- `src/components/ScheduleList.jsx` — direct read; `session.date.toLocaleDateString()` call confirmed
- `vite.config.js` — direct read; existing `base: './'` and `react()` plugin confirmed
- `package.json` — direct read; `"type": "module"` and Vite 7.3.1 confirmed

### Secondary (MEDIUM confidence)

- Vitest 3 peerDependencies from npm registry (D-01 compatibility confirmed via peer dep listing)
- MSW 2.x API change (http/HttpResponse) — well-documented breaking change; confirmed via package description and version history

### Tertiary (LOW confidence)

- None for critical claims.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all versions verified against npm registry on research date
- Vite 7 compatibility: HIGH — confirmed via Vitest 3 peer deps (no Vite version constraint)
- Architecture patterns: HIGH — derived directly from reading source files
- Pitfalls: HIGH for P1 (UTC bug documented in source code comments and STATE.md), HIGH for P3/P5 (peer dep behavior), MEDIUM for P2 (year-boundary — logic confirmed in source, test scenario reasoned from code)
- CourseForm validation gap: MEDIUM — open question flagged honestly

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable ecosystem — 30-day validity)
