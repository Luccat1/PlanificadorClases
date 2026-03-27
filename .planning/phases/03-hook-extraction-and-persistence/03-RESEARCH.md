# Phase 3: Hook Extraction and Persistence - Research

**Researched:** 2026-03-27
**Domain:** React custom hooks, localStorage persistence, system preference detection
**Confidence:** HIGH

## Summary

Phase 3 extracts state that currently lives inline in App.jsx into two focused custom hooks (`useCourseData` and `useSchedule`), and adds localStorage persistence for dark mode and view mode preferences. The work is pure refactoring plus two new persistence behaviors — no new dependencies, no new UI components, no API changes.

The codebase already has a clear extraction precedent: `useHolidays` (Phase 4, already implemented) follows the exact pattern that `useCourseData` and `useSchedule` should follow. That existing hook can be used as a template for structure, cancellation cleanup, and localStorage interaction.

App.jsx today is ~290 lines. After extraction it should be ~80 lines of JSX orchestration with four hook calls at the top. All logic being moved is already correct and tested — this phase is a structural reorganization, not a logic rewrite.

**Primary recommendation:** Model `useCourseData` and `useSchedule` on the `useHolidays` pattern already in the codebase. Add `prefers-color-scheme` detection via `window.matchMedia` with a localStorage override for dark mode. Use a plain `useState` initializer reading localStorage for view mode.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-02 | Course data state and localStorage persistence extracted to `src/hooks/useCourseData.js` custom hook | useState lazy initializer + useEffect persistence — identical to existing courseData pattern in App.jsx lines 43-64 |
| ARCH-03 | Schedule calculation state extracted to `src/hooks/useSchedule.js` that consumes scheduleEngine.js | useMemo or useEffect wrapping `calculateSchedule(courseData, holidays)` — currently App.jsx lines 67-69 |
| PERS-01 | Dark mode preference persisted in localStorage, defaults to `prefers-color-scheme` on first visit | `window.matchMedia('(prefers-color-scheme: dark)').matches` for initial value; localStorage key `darkMode` |
| PERS-02 | View mode selection persisted in localStorage, defaults to `'list'` | Simple useState lazy initializer reading `localStorage.getItem('viewMode') \|\| 'list'` |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- OS: Windows 11, shell is Git Bash — use Unix paths
- Stack: React 18, Vite, Tailwind CSS, Lucide React
- `npm test` uses Vitest (configured in vite.config.js)
- No backend — localStorage is the persistence layer

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | useState, useEffect, useMemo hooks | Already in use |
| Vitest | 3.2.4 | Test runner for hook tests | Already configured |
| @testing-library/react | 16.3.2 | `renderHook` for custom hook tests | Already in use (useHolidays tests) |

### No New Dependencies Required

This phase introduces no new npm dependencies. All patterns use built-in React hooks and browser APIs (localStorage, matchMedia) that are already exercised in the codebase.

**Installation:** None needed.

## Architecture Patterns

### Recommended Project Structure (no changes — hooks already have a home)
```
src/
├── hooks/
│   ├── useHolidays.js          # EXISTS (Phase 4)
│   ├── useCourseData.js        # NEW — Phase 3
│   ├── useSchedule.js          # NEW — Phase 3
│   └── __tests__/
│       ├── useHolidays.test.js # EXISTS
│       ├── useCourseData.test.js  # NEW — Phase 3
│       └── useSchedule.test.js    # NEW — Phase 3
├── logic/
│   └── scheduleEngine.js       # EXISTS — consumed by useSchedule
└── App.jsx                     # REDUCED — orchestration shell only
```

### Pattern 1: useCourseData — Lazy Initializer + useEffect Persistence

This is the exact pattern already in App.jsx lines 43–64, just moved to a hook file.

**What:** Hook owns `courseData` state, exposes it and its mutation handlers. Reads from localStorage on mount via lazy initializer. Persists to localStorage on every change via `useEffect`.

**When to use:** Any state that the user edits, that should survive refresh, and that needs multiple mutation paths (field change, day toggle, add/remove excluded date, reset).

**Example (sourced from existing App.jsx pattern):**
```javascript
// src/hooks/useCourseData.js
import { useState, useEffect } from 'react';

const INITIAL_COURSE_DATA = {
    courseName: '',
    startDate: '',
    sessionsPerWeek: 2,
    classDays: ['monday', 'wednesday'],
    totalHours: 40,
    hourType: 'pedagogical',
    hoursPerSession: 2,
    recoverySessionsCount: 0,
    customExcludedDates: []
};

export function useCourseData() {
    const [courseData, setCourseData] = useState(() => {
        try {
            const saved = typeof window !== 'undefined'
                ? localStorage.getItem('courseData')
                : null;
            return saved ? JSON.parse(saved) : INITIAL_COURSE_DATA;
        } catch {
            return INITIAL_COURSE_DATA;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('courseData', JSON.stringify(courseData));
        }
    }, [courseData]);

    const handleInputChange = (field, value) =>
        setCourseData(prev => ({ ...prev, [field]: value }));

    const handleDayToggle = (day) =>
        setCourseData(prev => ({
            ...prev,
            classDays: prev.classDays.includes(day)
                ? prev.classDays.filter(d => d !== day)
                : [...prev.classDays, day]
        }));

    const addExcludedDate = (date) => {
        if (date && !courseData.customExcludedDates.includes(date)) {
            handleInputChange('customExcludedDates', [
                ...courseData.customExcludedDates, date
            ]);
        }
    };

    const removeExcludedDate = (dateToRemove) =>
        handleInputChange(
            'customExcludedDates',
            courseData.customExcludedDates.filter(d => d !== dateToRemove)
        );

    const resetCourse = () => {
        if (window.confirm('¿Estás seguro de que deseas eliminar toda la información actual? Esto no se puede deshacer.')) {
            setCourseData(INITIAL_COURSE_DATA);
            localStorage.removeItem('courseData');
        }
    };

    return {
        courseData,
        handleInputChange,
        handleDayToggle,
        addExcludedDate,
        removeExcludedDate,
        resetCourse,
        INITIAL_COURSE_DATA
    };
}
```

**IMPORTANT — `resetCourse` interaction with `useSchedule`:** When `resetCourse` fires, it sets `courseData` to the initial object. `useSchedule` reads `courseData` reactively, so the schedule will recompute to `[]` automatically. App.jsx currently has `setSchedule([])` after reset — that explicit call becomes unnecessary once the schedule is reactive.

### Pattern 2: useSchedule — Reactive Schedule Derived from courseData + holidays

**What:** Hook owns `schedule` state. Recomputes whenever `courseData` or `holidays` changes. Wraps `calculateSchedule` from `scheduleEngine.js`.

**When to use:** Any derived state that is expensive to compute and depends on multiple upstream values.

**Two valid implementation approaches:**

**Option A — useEffect + setState (mirrors existing App.jsx line 67-69):**
```javascript
// src/hooks/useSchedule.js
import { useState, useEffect } from 'react';
import { calculateSchedule } from '../logic/scheduleEngine';

export function useSchedule(courseData, holidays) {
    const [schedule, setSchedule] = useState([]);

    useEffect(() => {
        setSchedule(calculateSchedule(courseData, holidays));
    }, [courseData, holidays]);

    return schedule;
}
```

**Option B — useMemo (synchronous, no stale-render frame):**
```javascript
import { useMemo } from 'react';
import { calculateSchedule } from '../logic/scheduleEngine';

export function useSchedule(courseData, holidays) {
    return useMemo(
        () => calculateSchedule(courseData, holidays),
        [courseData, holidays]
    );
}
```

**Recommendation: Option B (useMemo).** `calculateSchedule` is a synchronous pure function with no side effects. `useMemo` is the idiomatic React tool for "derived value that depends on inputs". Using `useEffect + setState` introduces a one-render delay (the schedule state is stale for one render after courseData changes), which is observable as a flash. `useMemo` computes synchronously during render, eliminating the stale frame. The function runs fast enough that synchronous execution is fine.

**Confidence:** HIGH — this is standard React guidance for synchronous derived state.

### Pattern 3: Dark Mode — matchMedia + localStorage

**What:** On first visit read `window.matchMedia('(prefers-color-scheme: dark)').matches`. On subsequent visits read the user's explicit preference from localStorage. Persist the toggle to localStorage.

**PERS-01 requirement:** "on first visit defaults to `prefers-color-scheme` system preference"

```javascript
// Inside useDarkMode hook or inline in App.jsx
const [darkMode, setDarkMode] = useState(() => {
    try {
        const stored = localStorage.getItem('darkMode');
        if (stored !== null) return stored === 'true';
        // First visit: respect system preference
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
        return false;
    }
});

useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
}, [darkMode]);
```

**Where to place dark mode:** The roadmap notes "UI hint: yes" for Phase 3. Dark mode could live in its own `useDarkMode` hook or stay inline in App.jsx (it's only 2 state lines + 1 useEffect). Given the goal is to reduce App.jsx to ~80 lines, extracting to a hook is recommended. However, the requirement says "dark mode preference is persisted" — it does NOT say "extract to a custom hook". Whether it lives inline or in a separate hook is Claude's discretion.

**Decision for planner:** Extract to `useDarkMode` hook for consistency with the overall extraction goal. But this is low-stakes — either approach satisfies PERS-01.

### Pattern 4: View Mode — Simple localStorage Lazy Initializer

**What:** Read from localStorage on mount, default to `'list'`, persist on change.

**PERS-02 requirement:** Default `'list'`, persisted.

```javascript
const [viewMode, setViewMode] = useState(() => {
    try {
        return localStorage.getItem('viewMode') || 'list';
    } catch {
        return 'list';
    }
});

useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
}, [viewMode]);
```

**Where to place view mode:** Same decision as dark mode. Can extract to a `useViewMode` hook or keep inline. Given the goal of ~80-line App.jsx, inline is fine for two-state UI toggles. The planner should keep dark mode and view mode either both inline or both in a shared `useUIPreferences` hook — splitting them into separate hook files adds file count with minimal benefit.

**Recommendation:** Single `useUIPreferences` hook returning `{ darkMode, setDarkMode, viewMode, setViewMode }` if extraction is desired. Or keep both inline in App.jsx.

### Anti-Patterns to Avoid

- **Circular dependency between useSchedule and useHolidays:** `useSchedule` receives `holidays` as a parameter from App.jsx (same as how `calculateSchedule` currently receives it). It does NOT call `useHolidays` internally. This was the exact design decision recorded in STATE.md: "Hook accepts only startDate (not endDate) to avoid circular dependency with computed endDate."
- **useEffect for synchronous derived state:** Don't use `useEffect + setState` to compute the schedule — use `useMemo`. Effect-based derived state introduces a stale render frame.
- **Not guarding localStorage access with try/catch:** localStorage can throw in private browsing contexts or when storage quota is exceeded. The existing App.jsx pattern wraps reads in try/catch — maintain this in the hooks.
- **Resetting `schedule` state explicitly in `resetCourse`:** Once `useSchedule` is reactive (useMemo or useEffect watching courseData), an explicit `setSchedule([])` call is unnecessary and should be removed from the reset handler.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Synchronous derived state | Custom caching / memoization | `useMemo` | React's built-in memoization handles dependency tracking |
| localStorage read/write | Custom storage abstraction | Direct `localStorage.getItem/setItem` with try/catch | No third-party library needed at this scale |
| System color scheme detection | Custom CSS media query poll | `window.matchMedia('(prefers-color-scheme: dark)')` | Standard browser API, already supported in all target browsers |

**Key insight:** The entire phase uses React built-ins (useState, useEffect, useMemo) and browser built-ins (localStorage, matchMedia). No new npm packages are needed.

## Common Pitfalls

### Pitfall 1: useSchedule Returning Stale Schedule on Reset
**What goes wrong:** If `useSchedule` uses `useEffect + setState`, and `resetCourse` fires, App.jsx sees `courseData` reset but the schedule state stays at the old value for one render because the effect hasn't fired yet.
**Why it happens:** `useEffect` runs after paint; state from the previous render is still visible during the current render.
**How to avoid:** Use `useMemo` in `useSchedule` — it computes synchronously, so the reset is visible in the same render.
**Warning signs:** Schedule briefly shows old sessions after reset before clearing.

### Pitfall 2: Dark Mode Hydration Mismatch (SSR / jsdom)
**What goes wrong:** `window.matchMedia` does not exist in jsdom test environment. Calling it without a guard throws `TypeError: window.matchMedia is not a function`.
**Why it happens:** jsdom doesn't implement the full browser API surface.
**How to avoid:** Use optional chaining: `window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false`. Or add a mock in test-setup.js.
**Warning signs:** Tests for darkMode-related behavior throw TypeError.

### Pitfall 3: localStorage Throws in Test Environment
**What goes wrong:** Some vitest configurations restrict localStorage access, or tests call `localStorage.clear()` in beforeEach and a hook re-reads an empty store.
**Why it happens:** The existing tests (`useHolidays.test.js` line 8) already call `localStorage.clear()` in `beforeEach` — new hook tests should do the same to ensure isolation.
**How to avoid:** Wrap all localStorage reads in try/catch (already the existing App.jsx pattern). In tests, call `localStorage.clear()` in `beforeEach`.
**Warning signs:** Flaky tests where pass/fail depends on test execution order.

### Pitfall 4: `initialCourseData` Object Identity Causes Infinite Loop
**What goes wrong:** Defining `INITIAL_COURSE_DATA` inside the hook function body (not as a module-level const) means a new object is created on every render. If this object is used as a `useEffect` dependency, it causes an infinite render loop.
**Why it happens:** Object identity comparison — `{} !== {}` even with same values.
**How to avoid:** Define `INITIAL_COURSE_DATA` as a module-level constant outside the hook function.
**Warning signs:** React "Maximum update depth exceeded" error.

### Pitfall 5: App.jsx Explicit `setSchedule([])` After Refactor
**What goes wrong:** App.jsx currently calls `setSchedule([])` in `resetCourse`. After extracting to hooks, `schedule` is no longer a direct setState — it's derived from courseData. The explicit call either no longer compiles or tries to call a non-existent setter.
**Why it happens:** The schedule setter is internal to `useSchedule` (or doesn't exist at all with useMemo).
**How to avoid:** Remove `setSchedule([])` from the reset handler. The reactive derivation handles it automatically.

## Code Examples

### Existing useHolidays Pattern (template to follow)
```javascript
// Source: src/hooks/useHolidays.js (existing)
export function useHolidays(startDate) {
    const [holidays, setHolidays] = useState([]);
    const [holidayWarning, setHolidayWarning] = useState(null);
    useEffect(() => {
        // ... async work with cleanup via cancelled flag
        return () => { cancelled = true; };
    }, [startDate]);
    return { holidays, holidayWarning };
}
```

### Existing renderHook Test Pattern (template for new hook tests)
```javascript
// Source: src/hooks/__tests__/useHolidays.test.js (existing)
import { renderHook, waitFor } from '@testing-library/react';
import { useHolidays } from '../useHolidays.js';

beforeEach(() => {
    localStorage.clear();
});

it('returns empty holidays when startDate is empty', () => {
    const { result } = renderHook(() => useHolidays(''));
    expect(result.current.holidays).toEqual([]);
});
```

### matchMedia Guard for jsdom Compatibility
```javascript
// Correct pattern for jsdom + real browser environments
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
```

### useMemo for Reactive Schedule
```javascript
// Source: React docs — synchronous derived state pattern
import { useMemo } from 'react';
import { calculateSchedule } from '../logic/scheduleEngine';

export function useSchedule(courseData, holidays) {
    return useMemo(
        () => calculateSchedule(courseData, holidays),
        [courseData, holidays]
    );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline state in App.jsx | Custom hooks per concern | React 16.8 (2019) | Enables testing hooks in isolation, separates concerns |
| `useEffect + setState` for derived state | `useMemo` | React 16.8+ guidance | Eliminates stale render frame, simpler code |
| No color scheme detection | `prefers-color-scheme` media query | CSS Media Queries Level 5, ~2020 | Users get correct initial theme without a flash |

**Note on `useSyncExternalStore` for localStorage:** React 18 introduced `useSyncExternalStore` as the canonical way to subscribe to external stores like localStorage across tabs. For this codebase it is overkill — the app is single-tab and doesn't need cross-tab sync. The existing try/catch + useEffect pattern is correct and sufficient.

## Open Questions

1. **Should dark mode and view mode be extracted to separate hook files or kept inline?**
   - What we know: Requirements only say "persist" — they don't mandate a hook file
   - What's unclear: Whether ~80 line App.jsx target is achievable with 4 inline state declarations
   - Recommendation: Count lines. If App.jsx hits ~80 lines with inline dark mode and view mode, keep inline. If it exceeds 80, extract to a single `useUIPreferences` hook.

2. **Should `stats` useMemo remain in App.jsx or move into `useSchedule`?**
   - What we know: `stats` is a useMemo that consumes `schedule` and `courseData.totalHours` — derived display data
   - What's unclear: Whether it belongs in the schedule hook or the rendering layer
   - Recommendation: Keep `stats` in App.jsx. It is purely a display-layer derivation (formatting for UI cards), not schedule logic. Moving it to `useSchedule` would couple the schedule hook to display concerns.

## Environment Availability

Step 2.6: SKIPPED — no external dependencies identified. This phase is code-only changes using browser built-ins and existing npm packages.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | vite.config.js (test block) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-02 | `useCourseData` returns courseData from localStorage on mount | unit | `npm test -- --run src/hooks/__tests__/useCourseData.test.js` | No — Wave 0 |
| ARCH-02 | `useCourseData` persists courseData changes to localStorage | unit | `npm test -- --run src/hooks/__tests__/useCourseData.test.js` | No — Wave 0 |
| ARCH-02 | `useCourseData` `resetCourse` clears localStorage and resets state | unit | `npm test -- --run src/hooks/__tests__/useCourseData.test.js` | No — Wave 0 |
| ARCH-03 | `useSchedule` returns empty array when courseData has no startDate | unit | `npm test -- --run src/hooks/__tests__/useSchedule.test.js` | No — Wave 0 |
| ARCH-03 | `useSchedule` recomputes when courseData changes | unit | `npm test -- --run src/hooks/__tests__/useSchedule.test.js` | No — Wave 0 |
| ARCH-03 | `useSchedule` recomputes when holidays changes | unit | `npm test -- --run src/hooks/__tests__/useSchedule.test.js` | No — Wave 0 |
| PERS-01 | Dark mode: first visit reads `prefers-color-scheme` (matchMedia mock) | unit | `npm test -- --run` (inline or useDarkMode test) | No — Wave 0 |
| PERS-01 | Dark mode: subsequent visit reads stored localStorage value | unit | `npm test -- --run` | No — Wave 0 |
| PERS-02 | View mode: defaults to `'list'` when localStorage is empty | unit | `npm test -- --run` | No — Wave 0 |
| PERS-02 | View mode: reads stored value from localStorage on mount | unit | `npm test -- --run` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green (all 45 existing + new Phase 3 tests) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/__tests__/useCourseData.test.js` — covers ARCH-02 (persistence, handlers, reset)
- [ ] `src/hooks/__tests__/useSchedule.test.js` — covers ARCH-03 (reactive recompute)
- [ ] `window.matchMedia` mock in `src/test-setup.js` — required for PERS-01 tests in jsdom

**Mock to add to test-setup.js:**
```javascript
// Add to src/test-setup.js for jsdom matchMedia compatibility
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,  // override per test for dark mode coverage
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })),
});
```

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/App.jsx` — lines 31–69 (exact state and effect patterns being moved)
- Direct code inspection: `src/hooks/useHolidays.js` — template hook structure
- Direct code inspection: `src/hooks/__tests__/useHolidays.test.js` — test pattern with renderHook
- React documentation (well-established pattern, knowledge cutoff 2025): `useMemo` for synchronous derived state
- MDN: `window.matchMedia` + `prefers-color-scheme`

### Secondary (MEDIUM confidence)
- React 18 `useSyncExternalStore` consideration — verified as unnecessary for single-tab use case (training data + React docs)

### Tertiary (LOW confidence)
- None — all claims in this document are based on direct code inspection or well-established React/browser APIs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; existing packages directly inspected
- Architecture patterns: HIGH — patterns sourced directly from existing codebase code
- Pitfalls: HIGH — identified from direct code inspection (existing patterns in App.jsx, test-setup, useHolidays)

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable React APIs; localStorage/matchMedia are not changing)
