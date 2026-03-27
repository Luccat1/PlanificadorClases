---
phase: 5
slug: validation-export-and-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react |
| **Config file** | `vite.config.js` (test section) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | CORT-01 | unit stub | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | CORT-01 | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 05-01-03 | 01 | 1 | CORT-04 | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 05-02-01 | 02 | 1 | EXPO-01 | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 1 | EXPO-01 | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 05-03-01 | 03 | 2 | EXPO-02 | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 05-03-02 | 03 | 2 | EXPO-03 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useSchedule.test.js` — stubs for CORT-01 validation guard (empty array when invalid)

*RESEARCH.md note: Wave 0 gap confirmed — `useSchedule.test.js` does not exist and must be created before the CORT-01 implementation task.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Print/PDF metadata header renders above schedule table | EXPO-03 | Browser print preview required | Open app, fill in professor name/semester/email, click Print or Ctrl+P, verify metadata block appears above the session table in print preview |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
