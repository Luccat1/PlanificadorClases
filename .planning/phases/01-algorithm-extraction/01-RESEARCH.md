# Phase 1: Algorithm Extraction - Research

**Researched:** 2026-03-26
**Domain:** Pure-function extraction from React component — JavaScript date arithmetic, sessionsPerWeek cap, timezone fix
**Confidence:** HIGH (based on direct codebase inspection; all code under analysis is present in the repo)

---

## Summary

Phase 1 extracts the scheduling algorithm from `App.jsx` into a standalone pure function module `src/logic/scheduleEngine.js`. The current implementation has two concrete bugs that must be fixed during extraction: a timezone off-by-one (line 127 uses `toISOString()` which returns UTC midnight, shifting dates one day earlier for Chilean UTC-3/UTC-4 users), and a silent no-op on the `sessionsPerWeek` field (the field exists in state but is never read by the algorithm). Neither bug can be unit-tested in the current `useCallback` form. The extraction must make both issues testable and fixed before Phase 2 adds the test suite.

The extraction is a three-step mechanical transformation: (1) lift `isDateExcluded` and `calculateSchedule` out of the component, (2) convert them to accept all inputs as parameters instead of closing over state and calling `setSchedule`, (3) thread the `holidays` parameter through so the constant `CHILEAN_HOLIDAYS_2026` is no longer a hard dependency of the module. App.jsx is then wired to call the extracted function and pass the result to `setSchedule` in the existing `useEffect`. Behavior must be identical to before for any existing course configuration — this is a refactor, not a rewrite.

The week-boundary logic for the `sessionsPerWeek` cap requires careful implementation: a simple elapsed-days counter produces wrong results at month and year boundaries. The correct approach is a `Map<weekKey, count>` where `weekKey` is the ISO Monday anchor of the candidate date's calendar week. This is new logic being added during extraction (CORT-03), not a migration of existing logic.

**Primary recommendation:** Extract to `src/logic/scheduleEngine.js` as three named exports — `isDateExcluded(date, holidays, customExcludedDates)`, `getEffectiveHours(chronologicalHours, hourType)` (already in utils.js, re-export or move), and `calculateSchedule(courseData, holidays)` — with no React imports and no side effects. Fix timezone and sessionsPerWeek in the same commit.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | Scheduling logic extracted to `src/logic/scheduleEngine.js` as pure functions (`calculateSchedule`, `getEffectiveHours`, `isDateExcluded`) with no React dependencies — takes all inputs as parameters, returns value | Direct code inspection: `calculateSchedule` at App.jsx:81 is a `useCallback` calling `setSchedule` internally. Extraction path is clear — remove side effect, add return value, thread holidays as parameter. |
| CORT-03 | `sessionsPerWeek` field enforces a hard cap on sessions scheduled per calendar week (Mon–Sun) in the algorithm — a `sessionsPerWeek: 2` with Mon/Wed/Fri class days skips the third qualifying day each week | Direct code inspection: `sessionsPerWeek` exists in `initialCourseData` (App.jsx:32) and is read in form state but never referenced in the scheduling loop (App.jsx:108–139). The cap is entirely absent. New logic required: week-keyed counter using Monday anchor. |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| JavaScript (ESM) | ES2022 | Pure function module | No new dependency needed — project is already ESM (`"type": "module"` in package.json) |
| `src/logic/constants.js` | existing | `DAY_NAMES`, `DAY_MAPPING` shared constants | Already imported by App.jsx; scheduleEngine.js re-uses these |
| `src/logic/utils.js` | existing | `getEffectiveHours` | Already extracted and correct — scheduleEngine.js imports from here rather than duplicating |

### Supporting

No new production dependencies are introduced in this phase. All required functions are standard JS `Date` arithmetic.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `Date` arithmetic for week key | `date-fns` `getISOWeek` | `date-fns` is not in the project; adding a production dep for one date calculation is not justified. Native Monday-anchor calculation is ~5 lines. |
| Local date formatting with getFullYear/getMonth/getDate | `toLocaleDateString` | `toLocaleDateString` output is locale-dependent and not suitable for `YYYY-MM-DD` string keys. Explicit getters are correct and portable. |

**Installation:** None required.

---

## Architecture Patterns

### Target File Structure After Phase 1

```
src/
├── logic/
│   ├── constants.js       # unchanged — DAY_NAMES, DAY_MAPPING, CHILEAN_HOLIDAYS_2026
│   ├── utils.js           # unchanged — getEffectiveHours, formatDateLong, getHolidayName
│   └── scheduleEngine.js  # NEW — isDateExcluded, calculateSchedule (pure, no React)
├── components/            # unchanged
└── App.jsx                # wired to call calculateSchedule(), pass result to setSchedule
```

### Pattern 1: Pure Function Extraction (the core transformation)

**What:** Move `isDateExcluded` and `calculateSchedule` from `useCallback` wrappers inside `App` to plain exported functions in `scheduleEngine.js`. Remove the `setSchedule()` call inside `calculateSchedule`; instead `return sessions`. Thread `holidays` as a parameter.

**When to use:** Any algorithm that currently lives in a React component and must be independently testable.

**Signature contract (what App.jsx calls after extraction):**

```javascript
// src/logic/scheduleEngine.js
// Source: derived from App.jsx:67-142 direct inspection

/**
 * Returns true if the date should be skipped.
 * @param {Date} date
 * @param {Array<{date: string, name: string}>} holidays
 * @param {string[]} customExcludedDates  - array of 'YYYY-MM-DD' strings
 * @returns {boolean}
 */
export function isDateExcluded(date, holidays, customExcludedDates) { ... }

/**
 * Calculates the full session schedule.
 * @param {object} courseData   - full courseData object from state
 * @param {Array<{date: string, name: string}>} holidays
 * @returns {object[]}          - session array (same shape as current schedule state)
 */
export function calculateSchedule(courseData, holidays) { ... }
```

**App.jsx wiring after extraction:**

```javascript
// Source: mechanical transformation of App.jsx:144-146
import { calculateSchedule } from './logic/scheduleEngine';

useEffect(() => {
    setSchedule(calculateSchedule(courseData, CHILEAN_HOLIDAYS_2026));
}, [courseData]);
```

Note: Phase 1 still passes `CHILEAN_HOLIDAYS_2026` as the holiday argument — the holiday API integration is Phase 4. The parameter threading is the design contract; the constant is the interim value.

### Pattern 2: Timezone-Safe Date String

**What:** Replace `date.toISOString().split('T')[0]` with explicit local-date construction.

**Why:** `toISOString()` always returns UTC. At UTC-3 (Santiago, Chile), midnight local time is 03:00 UTC on the same calendar day. However, the `Date` object stored in `sessions` is constructed as `new Date(startObj)` and then advanced with `current.setDate(current.getDate() + 1)`. The issue is specifically that `current.toISOString()` at App.jsx:127 and App.jsx:68 produces a UTC string, which at UTC-3 will represent the previous calendar day when the local time is before 03:00 UTC.

**Correct pattern:**

```javascript
// Source: ECMA-262 Date object local accessors
function toLocalDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
```

All references to `date.toISOString().split('T')[0]` in the algorithm must be replaced with `toLocalDateStr(date)`. This function can be defined at the top of `scheduleEngine.js` as a module-private helper.

**Affected lines in current App.jsx:**
- Line 68: `isDateExcluded` — `date.toISOString().split('T')[0]`
- Line 127: `calculateSchedule` loop — `current.toISOString().split('T')[0]`

Note: `formatDateLong` in `utils.js` (line 21) already correctly uses `new Date(dateStr + 'T00:00:00')` to avoid timezone shift when parsing a YYYY-MM-DD display string — that pattern is correct and unchanged.

### Pattern 3: sessionsPerWeek Week Key (ISO Monday Anchor)

**What:** Track a `Map<weekKey, count>` inside the scheduling loop. Before adding a session, check whether the week's session count has reached `sessionsPerWeek`. If so, skip the day and continue.

**Why not elapsed days:** `Math.floor(daysSinceStart / 7)` assigns week 0 to days 0-6 relative to the course start, which does not align with calendar weeks. A session on Sunday and the following Monday would be in the same "week" by this calculation even though they are in different calendar weeks. The spec says Mon–Sun, which requires a calendar-week anchor.

**Week key formula:**

```javascript
// Source: standard calendar arithmetic — verified against ECMA-262 Date behavior
function getWeekKey(date) {
    // Find the Monday of the calendar week containing 'date'
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diff = (day === 0) ? -6 : 1 - day; // adjust so Monday = anchor
    d.setDate(d.getDate() + diff);
    return toLocalDateStr(d); // 'YYYY-MM-DD' of that Monday
}
```

**Loop integration:**

```javascript
const weekSessionCounts = new Map();

// Inside the loop, after confirming the date is a valid class day:
const weekKey = getWeekKey(current);
const weekCount = weekSessionCounts.get(weekKey) || 0;
if (courseData.sessionsPerWeek > 0 && weekCount >= courseData.sessionsPerWeek) {
    // skip this day — week cap reached
    current.setDate(current.getDate() + 1);
    safetyCounter++;
    continue;
}
weekSessionCounts.set(weekKey, weekCount + 1);
// ... rest of session creation
```

**Edge cases the Monday-anchor handles correctly:**
- A Sunday class day: `day === 0` maps to the previous Monday (same calendar week)
- Year boundary: Dec 28 (Mon) and Jan 4 (Mon) are different week keys — no spillover
- Course start mid-week: the first partial week uses the real Monday anchor, not the start date

### Anti-Patterns to Avoid

- **Calling `setSchedule` inside `scheduleEngine.js`:** The extracted module must have zero React imports. Any React state setter inside the module would make it untestable in Node/Vitest.
- **Closing over `CHILEAN_HOLIDAYS_2026` inside `scheduleEngine.js`:** The module must accept holidays as a parameter. Closing over the constant re-creates the tight coupling that Phase 4 needs to break.
- **Using `toISOString()` for date string keys:** UTC output causes off-by-one for any timezone west of UTC. Use local date accessors.
- **Using elapsed-days math for week boundary:** Produces wrong results at any month or year boundary where the week straddles the boundary. Use the Monday-anchor key.
- **Removing `getEffectiveHours` from utils.js:** It is already a pure function in the right place. `scheduleEngine.js` should import it from `utils.js`, not duplicate it. ARCH-01 says it must also be exported from `scheduleEngine.js` — the cleanest solution is to re-export: `export { getEffectiveHours } from './utils';`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ISO week number | Custom week-number algorithm | Monday-anchor `getWeekKey` helper (5 lines) | Full ISO week numbering (ISO 8601) is more complex (handles week-53, year attribution). The spec only requires Mon–Sun calendar week identity, not ISO week numbers. The anchor approach is sufficient and simpler. |
| Timezone-safe date parsing | A date library | `d.getFullYear() / getMonth() / getDate()` | The need is only to format `Date` objects as YYYY-MM-DD strings. Three local accessor calls are sufficient and have zero dependency cost. |

**Key insight:** This phase adds no new production dependencies. The complexity is entirely in correctly transforming existing code, not in finding new libraries.

---

## Common Pitfalls

### Pitfall 1: `setSchedule` left inside extracted function
**What goes wrong:** scheduleEngine.js imports React or receives a setter reference, making it impossible to test in a Node context (no React, no component).
**Why it happens:** Mechanical copy-paste from `useCallback` body without removing the side effect.
**How to avoid:** The function signature is `calculateSchedule(courseData, holidays): session[]`. No setter. No React. App.jsx calls `setSchedule(calculateSchedule(...))`.
**Warning signs:** `import React` or `import { useState }` appearing in `scheduleEngine.js`.

### Pitfall 2: `toISOString()` timezone bug survives extraction
**What goes wrong:** Dates in the generated schedule are one day earlier than the actual session date for professors in Chile (UTC-3/UTC-4). A session on Monday appears as Sunday in the exported schedule.
**Why it happens:** `toISOString()` is called on a `Date` object that represents midnight local time. At UTC-3, midnight local = 03:00 UTC, so `toISOString()` produces the correct date. But during daylight saving transitions (e.g., Chile uses UTC-4 in summer), midnight local = 04:00 UTC on the same day — still correct. **The real risk is** that `new Date('2026-03-15')` (no time component) parses as UTC midnight, making the initial `startObj` UTC midnight, and then all subsequent `setDate` advances remain UTC-midnight. So `toISOString()` would give the correct date. However, a careful check of the `startDate` input path: App.jsx:87 uses `new Date(courseData.startDate + 'T00:00:00')` which is LOCAL midnight — correct. Then `current.toISOString()` on a local-midnight Date at UTC-3 would emit `previous-day T21:00:00.000Z`, and `.split('T')[0]` gives the previous day. **This IS the bug.** Fix with `toLocalDateStr`.
**How to avoid:** Replace all `date.toISOString().split('T')[0]` occurrences in the algorithm with `toLocalDateStr(date)`. Verify by constructing a `Date` at local-midnight UTC-3 and checking the string produced.
**Warning signs:** Any remaining `.toISOString()` call in `scheduleEngine.js`.

### Pitfall 3: sessionsPerWeek of 0 (not configured) blocks all sessions
**What goes wrong:** If `sessionsPerWeek: 0` is treated as an active cap, no sessions ever get scheduled.
**Why it happens:** The cap check `weekCount >= sessionsPerWeek` with `sessionsPerWeek = 0` is always true.
**How to avoid:** Guard the cap: `if (courseData.sessionsPerWeek > 0 && weekCount >= courseData.sessionsPerWeek)`. Zero means uncapped.
**Warning signs:** Empty schedule output when `sessionsPerWeek` field is left at default.

### Pitfall 4: Week key computed from the wrong date object
**What goes wrong:** `getWeekKey` is called on `current` after `current.setDate(...)` has already advanced it, computing the key for the wrong day.
**Why it happens:** `current` is mutated in place throughout the loop. If any mutation happens before `getWeekKey(current)`, the key is wrong.
**How to avoid:** Call `getWeekKey(current)` at the top of the loop body, before any `setDate` calls. Or pass a copy: `getWeekKey(new Date(current))`.
**Warning signs:** Sessions appearing on the correct days but the cap not triggering correctly at week boundaries.

### Pitfall 5: `isDateExcluded` using stale `customExcludedDates` from closure
**What goes wrong:** After extraction, `isDateExcluded` must receive `customExcludedDates` as a parameter. If the extracted version still closes over a variable, it will use stale data.
**Why it happens:** The current `isDateExcluded` at App.jsx:67 closes over `courseData.customExcludedDates` via `useCallback` deps. After extraction, there is no React closure — the value must come in as a parameter.
**How to avoid:** The signature `isDateExcluded(date, holidays, customExcludedDates)` makes the dependency explicit. `calculateSchedule` calls it as `isDateExcluded(current, holidays, courseData.customExcludedDates)`.
**Warning signs:** Changes to custom excluded dates not being reflected in the recalculated schedule.

---

## Code Examples

Verified patterns from direct codebase inspection:

### Full extracted module skeleton

```javascript
// src/logic/scheduleEngine.js
// No React imports. No side effects. All inputs as parameters.

import { DAY_MAPPING, DAY_NAMES } from './constants';
import { getEffectiveHours } from './utils';

// Re-export so consumers can import getEffectiveHours from here (ARCH-01)
export { getEffectiveHours };

/**
 * Formats a Date object as 'YYYY-MM-DD' using local time (not UTC).
 * Fixes the toISOString() timezone bug for Chilean users (UTC-3/UTC-4).
 * @param {Date} d
 * @returns {string}
 */
function toLocalDateStr(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Returns the 'YYYY-MM-DD' of the Monday that anchors the calendar week
 * containing the given date (Mon–Sun definition).
 * @param {Date} date
 * @returns {string}
 */
function getWeekKey(date) {
    const d = new Date(date); // copy — do not mutate caller's date
    const day = d.getDay();   // 0=Sun, 1=Mon...6=Sat
    const diff = (day === 0) ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return toLocalDateStr(d);
}

/**
 * Returns true if the date should be excluded from the schedule.
 * @param {Date} date
 * @param {Array<{date: string, name: string}>} holidays
 * @param {string[]} customExcludedDates
 * @returns {boolean}
 */
export function isDateExcluded(date, holidays, customExcludedDates) {
    const dateStr = toLocalDateStr(date);
    if (date.getDay() === 0) return true; // Sunday
    if (holidays.some(h => h.date === dateStr)) return true;
    if (customExcludedDates.includes(dateStr)) return true;
    return false;
}

/**
 * Calculates the full session schedule.
 * Pure function — no React, no side effects, no global state.
 * @param {object} courseData
 * @param {Array<{date: string, name: string}>} holidays
 * @returns {object[]} session array
 */
export function calculateSchedule(courseData, holidays) {
    if (!courseData.startDate || courseData.classDays.length === 0) {
        return [];
    }

    const startObj = new Date(courseData.startDate + 'T00:00:00');
    const targetDayNums = courseData.classDays.map(d => DAY_MAPPING[d]);

    const effNormal = getEffectiveHours(courseData.hoursPerSession, courseData.hourType);
    const effRecovery = getEffectiveHours(courseData.hoursPerSession + 0.5, courseData.hourType);

    if (effNormal <= 0) return [];

    const sessions = [];
    const weekSessionCounts = new Map();
    const current = new Date(startObj);
    let sessionCount = 0;
    let accumulatedEff = 0;
    let midCourseFound = false;
    let safetyCounter = 0;

    while (accumulatedEff < courseData.totalHours && safetyCounter < 1500) {
        const dayNum = current.getDay();

        if (
            targetDayNums.includes(dayNum) &&
            !isDateExcluded(current, holidays, courseData.customExcludedDates)
        ) {
            // sessionsPerWeek cap check
            const weekKey = getWeekKey(current);
            const weekCount = weekSessionCounts.get(weekKey) || 0;
            if (courseData.sessionsPerWeek > 0 && weekCount >= courseData.sessionsPerWeek) {
                current.setDate(current.getDate() + 1);
                safetyCounter++;
                continue;
            }
            weekSessionCounts.set(weekKey, weekCount + 1);

            sessionCount++;
            const isRecovery = sessionCount <= courseData.recoverySessionsCount;
            const currentEff = isRecovery ? effRecovery : effNormal;
            const prevEff = accumulatedEff;
            accumulatedEff += currentEff;

            const isMid =
                !midCourseFound &&
                prevEff < courseData.totalHours / 2 &&
                accumulatedEff >= courseData.totalHours / 2;
            if (isMid) midCourseFound = true;

            const dayKey =
                Object.keys(DAY_MAPPING).find(k => DAY_MAPPING[k] === dayNum) || 'monday';

            sessions.push({
                number: sessionCount,
                date: new Date(current),
                dateStr: toLocalDateStr(current),   // timezone-safe
                dayName: DAY_NAMES[dayKey],
                isRecovery,
                isMidCourse: isMid,
                chronoHours: isRecovery
                    ? courseData.hoursPerSession + 0.5
                    : courseData.hoursPerSession,
                effHours: currentEff,
                accHours: accumulatedEff
            });
        }

        current.setDate(current.getDate() + 1);
        safetyCounter++;
    }

    return sessions;
}
```

### App.jsx wiring after extraction

```javascript
// In App.jsx — replace the calculateSchedule useCallback and its useEffect

import { calculateSchedule } from './logic/scheduleEngine';
import { CHILEAN_HOLIDAYS_2026 } from './logic/constants';

// Remove: isDateExcluded useCallback (moved to scheduleEngine.js)
// Remove: calculateSchedule useCallback (moved to scheduleEngine.js)

useEffect(() => {
    setSchedule(calculateSchedule(courseData, CHILEAN_HOLIDAYS_2026));
}, [courseData]);
```

The `isDateExcluded` export from `scheduleEngine.js` is available for Phase 2 unit tests and future use (e.g., calendar grid highlighting excluded dates). App.jsx itself does not call `isDateExcluded` directly after this phase — it is called internally by `calculateSchedule`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useCallback` wrapping algorithm with `setSchedule()` side effect | Pure exported function, return value, no React | Phase 1 (this phase) | Makes algorithm unit-testable without mounting a component |
| `toISOString().split('T')[0]` for date strings | `getFullYear()/getMonth()/getDate()` local accessors | Phase 1 (this phase) | Fixes schedule date shift for Chilean users in UTC-3/UTC-4 |
| `sessionsPerWeek` field ignored | `Map<weekKey, count>` cap enforced | Phase 1 (this phase) | Field now does what the form label says |
| `CHILEAN_HOLIDAYS_2026` constant imported directly in algorithm | `holidays` parameter threaded through | Phase 1 (this phase) | Enables Phase 4 holiday API injection without algorithm changes |

**Deprecated/outdated in this codebase after Phase 1:**
- `isDateExcluded` as a `useCallback` in App.jsx: replaced by import from `scheduleEngine.js`
- `calculateSchedule` as a `useCallback` in App.jsx: replaced by import from `scheduleEngine.js`
- Direct import of `CHILEAN_HOLIDAYS_2026` inside the algorithm: replaced by parameter

---

## Open Questions

1. **`getEffectiveHours` ownership after ARCH-01**
   - What we know: ARCH-01 requires it exported from `scheduleEngine.js`. It currently lives in `utils.js` as a pure function.
   - What's unclear: Should it be moved to `scheduleEngine.js` (breaking existing imports from `utils.js`) or re-exported via `export { getEffectiveHours } from './utils'`?
   - Recommendation: Re-export from `scheduleEngine.js` (`export { getEffectiveHours } from './utils'`). This satisfies ARCH-01, keeps the function in its natural home, and does not break any existing `utils.js` importers (App.jsx currently imports it from `utils.js`; that import can remain or be updated to `scheduleEngine.js` — either works).

2. **`getHolidayName` in utils.js still imports `CHILEAN_HOLIDAYS_2026`**
   - What we know: `utils.js` line 1 imports `CHILEAN_HOLIDAYS_2026` from constants. `getHolidayName` uses it to look up a display name for export/rendering.
   - What's unclear: Should Phase 1 also fix `getHolidayName` to accept holidays as a parameter?
   - Recommendation: No. Phase 1 is scoped to the scheduling algorithm (ARCH-01, CORT-03). `getHolidayName` is a display helper used in `exportToExcel` — its holiday data coupling is addressed in Phase 4 when the full holiday system is rebuilt. Changing it now is out of scope.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | JS module execution | Yes | v24.12.0 | — |
| npm | Package management | Yes | 11.7.0 | — |
| Vite | Build + dev server | Yes | ^7.3.1 (installed) | — |
| React | App.jsx rendering | Yes | ^18.3.1 (installed) | — |

No new dependencies required for this phase. All work is pure JavaScript module refactoring within the existing project.

---

## Validation Architecture

> `nyquist_validation: true` in config.json — section required.

### Test Framework

Phase 1 does not install Vitest (that is Phase 2). However, the planner must account for validation:

| Property | Value |
|----------|-------|
| Framework | None yet — Vitest installed in Phase 2 |
| Config file | None — Wave 0 of Phase 2 creates it |
| Quick run command | Manual only in Phase 1 |
| Full suite command | Manual only in Phase 1 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-01 | `scheduleEngine.js` exports `calculateSchedule`, `getEffectiveHours`, `isDateExcluded`; no React import | manual-only (Phase 1) — node import check: `node -e "import('./src/logic/scheduleEngine.js').then(m => console.log(Object.keys(m)))"` | Manual (Vitest in Phase 2) | No — Wave 0 of Phase 2 |
| ARCH-01 | App behavior identical after extraction — same sessions, same hours, same holiday skipping | manual smoke test: run dev server, enter existing course config, compare session count before/after | Manual | — |
| CORT-03 | `sessionsPerWeek: 2` with Mon/Wed/Fri skips third qualifying day each week | manual-only (Phase 1) — verify in dev server: set 3 class days, sessionsPerWeek 2, check output | Manual (unit test in Phase 2) | No — Phase 2 TEST-04 |
| ARCH-01 (timezone) | Schedule dates correct at UTC-3/UTC-4 — no date shift | manual-only (Phase 1) — browser DevTools override timezone | Manual (unit test in Phase 2) | No — Phase 2 TEST-05 |

### Sampling Rate

- **Per task commit:** Manual: run dev server, enter a test course, verify session list looks correct
- **Per wave merge:** Manual: verify all four success criteria from phase description
- **Phase gate:** All four success criteria true before advancing to Phase 2

### Wave 0 Gaps

- [ ] `src/tests/scheduleEngine.test.js` — will cover ARCH-01 + CORT-03 + timezone — but this is Phase 2 work, not Phase 1
- [ ] Vitest install and config — Phase 2 Wave 0

*(Phase 1 validation is manual only. Phase 2 is specifically scoped to create the test infrastructure that validates Phase 1's output.)*

---

## Project Constraints (from CLAUDE.md)

- **OS / Shell**: Windows 11, Git Bash. Use Unix paths (`/c/Users/...`), not PowerShell or CMD syntax.
- **Dev server**: `npm run dev` (Vite). Build: `npm run build`. Deploy: `npm run deploy` (gh-pages).
- **Stack**: React 18, Vite, Tailwind CSS, Lucide React — no stack changes in this phase.
- **No new production dependencies** in this phase (confirmed by research — pure JS refactor).
- **Linting**: `npm run lint` (ESLint) — extracted module must pass linting.

---

## Sources

### Primary (HIGH confidence)

- Direct inspection: `src/App.jsx` lines 67–142 — exact algorithm implementation, side effects, and coupling
- Direct inspection: `src/logic/utils.js` — `getEffectiveHours` pure function; `formatDateLong` correct timezone pattern
- Direct inspection: `src/logic/constants.js` — `CHILEAN_HOLIDAYS_2026`, `DAY_MAPPING`, `DAY_NAMES`
- Direct inspection: `package.json` — confirms ESM module type, no existing test runner, exact dependency versions
- Direct inspection: `.planning/REQUIREMENTS.md` — ARCH-01 and CORT-03 exact text
- ECMA-262 specification — `Date.prototype.toISOString()` always returns UTC; `getFullYear/getMonth/getDate` return local time

### Secondary (MEDIUM confidence)

- `.planning/research/SUMMARY.md` — prior phase-level research confirming pitfall analysis
- `.planning/codebase/CONCERNS.md` — confirms `sessionsPerWeek` is unused (line: "appears unused in the scheduling algorithm")

### Tertiary (LOW confidence — verify during implementation)

- Week key formula behavior at DST transitions: Chile uses UTC-3 standard / UTC-4 summer (reverse hemisphere). The `setDate` arithmetic in `getWeekKey` operates on the local clock, which is correct, but explicit DST-boundary testing is deferred to Phase 2 TEST-05.

---

## Metadata

**Confidence breakdown:**
- Algorithm extraction path: HIGH — exact code inspected, transformation is mechanical
- Timezone fix: HIGH — ECMA-262 specified behavior, not inference
- sessionsPerWeek week-key formula: HIGH — standard calendar arithmetic, verified against date object semantics
- Session object shape (output contract): HIGH — inspected directly at App.jsx:124-134
- App.jsx wiring after extraction: HIGH — direct inspection of existing useEffect pattern

**Research date:** 2026-03-26
**Valid until:** 2026-05-26 (stable — no external dependencies; only changes if requirements change)
