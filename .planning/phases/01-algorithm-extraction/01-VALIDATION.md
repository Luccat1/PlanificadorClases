---
phase: 1
slug: algorithm-extraction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed yet — Phase 2 installs Vitest |
| **Config file** | none — Phase 2 installs |
| **Quick run command** | `node --input-type=module < src/logic/scheduleEngine.js` (import smoke test) |
| **Full suite command** | Manual — run app, verify schedule output matches pre-extraction baseline |
| **Estimated runtime** | ~30 seconds (manual verification) |

---

## Sampling Rate

- **After every task commit:** Verify app still generates identical schedule for a known test input
- **After every plan wave:** Full manual verification — same sessions, same hours, same holiday skipping
- **Before `/gsd:verify-work`:** All 4 success criteria from ROADMAP.md must pass
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| extract-engine | 01 | 1 | ARCH-01 | manual smoke | `node -e "import('./src/logic/scheduleEngine.js').then(m => console.log(Object.keys(m)))"` | ❌ W0 | ⬜ pending |
| wire-sessions-per-week | 01 | 2 | CORT-03 | manual | Run app with Mon/Wed/Fri + sessionsPerWeek:2, verify ≤2 sessions/week | ✅ | ⬜ pending |
| fix-timezone | 01 | 2 | ARCH-01 | manual | Set browser to UTC-3, check schedule dates match input dates | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/logic/scheduleEngine.js` — stub file with correct exports (createSchedule, getEffectiveHours, isDateExcluded) before wiring

*Note: Vitest not installed until Phase 2. Wave 0 here means creating the file stub so imports don't break.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App behavior identical after extraction | ARCH-01 | No test framework in Phase 1 | Enter same course data before/after; compare session count, end date, and hours |
| sessionsPerWeek cap enforced | CORT-03 | No test framework in Phase 1 | Set Mon/Wed/Fri + sessionsPerWeek:2; verify schedule shows ≤2 sessions per week |
| Timezone correctness | ARCH-01 | No test framework in Phase 1 | Check that session dates match the day entered in start date field |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
