# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-26)

**Core value:** Accurate, trustworthy schedule generation that professors can hand to students on day one.
**Current focus:** Phase 1 — Algorithm Extraction

## Current Position

Phase: 1 of 5 (Algorithm Extraction)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-03-26 — Roadmap created, all 20 v1 requirements mapped across 5 phases

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: — min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: none yet
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Vitest chosen for test runner (native Vite integration, zero config conflict)
- [Init]: nager.date chosen for holiday API (free, no API key, multi-year CL support)
- [Init]: sessionsPerWeek wired as hard cap in Phase 1 alongside algorithm extraction (algorithm change is cleanest before hooks)

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: Timezone bug in `date.toISOString()` must be fixed during algorithm extraction — fix must be validated in Phase 2 with an explicit UTC-3 test
- [Phase 4]: Verify nager.date `localName` vs `name` field for Spanish holiday names before writing fetch wrapper
- [Phase 2]: Vite 7 + Vitest 2 compatibility unconfirmed — verify at `npm install` time before committing to full test infrastructure

## Session Continuity

Last session: 2026-03-26
Stopped at: Roadmap created and written to disk — ready to begin Phase 1 planning
Resume file: None
