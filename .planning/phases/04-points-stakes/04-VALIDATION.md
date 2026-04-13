---
phase: 4
slug: points-stakes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest v4.1.4 |
| **Config file** | `vitest.config.mts` (project root) |
| **Quick run command** | `npx vitest run tests/points.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/points.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | STAK-01 | — | N/A | unit | `npx vitest run tests/points.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | STAK-02 | — | N/A | unit | `npx vitest run tests/points.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | STAK-03 | — | N/A | unit | `npx vitest run tests/points.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | STAK-04 | — | N/A | unit (static) | `npx vitest run tests/points.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | STAK-05 | T-04-03 | Zod validates pointCost >= 1 | unit | `npx vitest run tests/points.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | STAK-06 | T-04-05 | Balance check before redeem | unit | `npx vitest run tests/points.test.ts` | ❌ W0 | ⬜ pending |
| 04-cron | cron | 1 | STAK-01 | T-04-01 | CRON_SECRET auth header check | unit | `npx vitest run tests/points.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/points.test.ts` — stubs for STAK-01 through STAK-06 (schema static assertions + pure settlement logic)
- [ ] `src/lib/utils/settlement.ts` — pure settlement function (no DB deps, easily testable)
