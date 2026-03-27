# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-27
**Phases:** 5 | **Plans:** 13 | **Tasks:** ~20

### What Was Built

- **scheduleEngine.js** — Pure scheduling module extracted from monolithic App.jsx; UTC timezone bug fixed; sessionsPerWeek cap implemented
- **Full test suite** — Vitest 3 + RTL + MSW from zero; 87 tests covering logic, hooks, and components
- **useCourseData + useSchedule + useHolidays hooks** — App.jsx reduced from ~360 lines to ~80-line orchestration shell
- **Holiday API integration** — Live nager.date fetch per calendar year with localStorage cache and graceful degradation warning
- **Inline validation + export metadata** — Touched+blur validation, professor metadata fields (Semestre/Nombre/Email), Excel 7-row metadata header, conditional print div, configurable recovery minutes

### What Worked

- **GSD wave parallelization** — Plans 05-02 and 05-03 ran in parallel worktrees, cutting Wave 2 execution time roughly in half
- **Discuss-phase → CONTEXT.md** — Locking decisions upfront (D-01 through D-12 for Phase 5) prevented mid-execution ambiguity; executors had everything they needed in the plan text
- **TDD discipline** — RED-first tasks (03-01, 04-01, 05-03 Task 1) caught the `scheduleEngine` unit-conversion bug before it reached App.jsx
- **RESEARCH.md pitfall detection** — Phase 5 researcher found the `+ 0.5` → `/ 60` unit mismatch and the `getAllByRole('spinbutton')[0]` test index fragility before planning — both would have been painful to debug in execution

### What Was Inefficient

- **Worktree merge gap** — After Wave 2 parallel execution, the 05-02 implementation commits (`feat` + `test`) landed in the worktree branch but the `docs` commit was cherry-applied to main. Required a manual `git merge worktree-agent-aa4b0e47`. Should verify worktree merges more proactively after each wave.
- **Phase 3 SUMMARY.md gaps** — Plans 03-02 and 03-03 have sparse SUMMARY.md files (no `one_liner` field), causing CLI extraction to fall back to raw content. Worth enforcing the SUMMARY template more strictly.
- **No milestone audit** — Skipped `/gsd:audit-milestone` before completing. No issues found, but the cross-phase integration check would have been a useful safety net.

### Patterns Established

- **Locked decisions in CONTEXT.md are worth the investment** — Phase 5 had 12 explicit decisions (D-01 through D-12); execution was nearly frictionless as a result
- **Unit mismatch pitfalls are caught in research, not execution** — Always have the researcher read actual source files, not just the plan
- **Wave parallelization requires post-wave merge verification** — Check `git log --oneline` after parallel waves to confirm all implementation commits reached main (not just docs commits)

### Key Lessons

1. **Read the actual files in research** — The `+ 0.5` recovery bonus was found by grepping `scheduleEngine.js` directly. Skipping that read would have produced a broken plan.
2. **Test queries need stable selectors** — `getAllByRole('spinbutton')[0]` breaks when new inputs are added. Use `getByRole('spinbutton', { name: /label/i })` for resilience.
3. **Worktree isolation requires explicit merge verification** — A parallel agent's `docs` commit reaching main doesn't guarantee its `feat` commits followed.

### Cost Observations

- Model: Claude Sonnet 4.6 throughout
- Sessions: 2 days (2026-03-26 → 2026-03-27)
- Commits: ~58 in milestone range
- Notable: Research phase paid for itself — Phase 5 had zero execution surprises

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 5 |
| Plans | 13 |
| Tests shipped | 87 |
| Execution surprises | 1 (worktree merge gap) |
| Research-caught bugs | 2 (unit mismatch, test selector) |
