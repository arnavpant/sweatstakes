---
phase: 03
slug: check-ins-goals
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.mts |
| **Quick run command** | `npx vitest run tests/connections.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CHKN-01 | T-03-01 | Camera only accessed via getUserMedia with HTTPS | unit | `npx vitest run tests/checkins.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CHKN-02 | — | N/A | unit | `npx vitest run tests/checkins.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | CHKN-03 | — | N/A | unit | `npx vitest run tests/checkins.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | CHKN-04 | — | N/A | unit | `npx vitest run tests/checkins.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | CHKN-05 | — | N/A | unit | `npx vitest run tests/checkins.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/checkins.test.ts` — stubs for CHKN-01 through CHKN-05

*Existing test infrastructure (vitest) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Camera permission prompt and capture | CHKN-01 | Requires real browser camera API | Open app on phone, tap FAB, grant permission, take photo |
| Dual camera BeReal-style composite | CHKN-01 | Hardware camera access | Verify rear + selfie composite in preview |
| Photo visible in activity feed | CHKN-02 | Visual UI verification | Submit check-in, navigate to feed, verify photo appears |
| Day dots update after check-in | CHKN-04 | Visual UI verification | Check in, verify today's dot fills on dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
