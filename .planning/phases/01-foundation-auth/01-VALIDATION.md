---
phase: 1
slug: foundation-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-12
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | AUTH-01 | T-1-01 | Google OAuth redirect uses HTTPS and state param | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | AUTH-02 | T-1-02 | Session cookie is httpOnly, secure, sameSite=lax | integration | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@testing-library/react` — install test framework
- [ ] `vitest.config.ts` — configure vitest for Next.js 16
- [ ] `tests/setup.ts` — shared test setup

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Google OAuth full flow | AUTH-01 | Requires real Google OAuth consent screen + browser interaction | 1. Open app URL 2. Tap "Sign in with Google" 3. Complete Google consent 4. Verify redirect to dashboard |
| Session persistence across refresh | AUTH-02 | Requires real browser cookie persistence | 1. Sign in via Google OAuth 2. Refresh browser tab 3. Verify still logged in (dashboard visible, not login screen) |
| PWA Add to Home Screen | D-20 | Requires physical device + browser install prompt | 1. Open app in mobile Safari/Chrome 2. Add to home screen 3. Launch from home screen icon 4. Verify standalone mode (no browser toolbar) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
