# Phase 2: Test Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 02-test-infrastructure
**Areas discussed:** MSW timing, Test file location, Coverage enforcement

---

## MSW Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Install now | Part of test infrastructure foundation — install package, add basic setup file, so Phase 4 doesn't need to retrofit | ✓ |
| Defer to Phase 4 | No API calls in Phase 2, so MSW adds zero value right now | |

**User's choice:** Install now (minimal scaffold)
**Notes:** Follow-up clarified scope: install `msw` package, create `src/mocks/handlers.js` (empty) and `src/mocks/server.js` wired into Vitest setup. No active handlers until Phase 4.

---

## Test File Location

| Option | Description | Selected |
|--------|-------------|----------|
| Co-located `__tests__/` | `src/logic/__tests__/` and `src/components/__tests__/` — test files next to source | ✓ |
| Top-level `tests/` directory | All tests in one place mirroring `src/` structure | |

**User's choice:** Co-located `__tests__/`
**Notes:** Standard Vitest convention. No prior pattern existed in the project.

---

## Coverage Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Report only | Generate coverage report, no threshold enforcement | ✓ |
| Enforce threshold | Fail if coverage drops below a set % (e.g., 80%) | |

**User's choice:** Report only
**Notes:** Goal is visibility, not a gate. Thresholds can be added after baseline is established.

---

## Claude's Discretion

- Exact Vitest config options (globals, include/exclude patterns)
- `describe`/`it` vs `test` naming style inside test files
- Setup file name and location
- MSW server lifecycle hooks (beforeAll/afterEach/afterAll)

## Deferred Ideas

None.
