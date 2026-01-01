# Audit Fixes Checklist

**Purpose:** Batch checklist to remediate the December 2025 audit findings and make the application safe for production. Use this file to track progress, run tasks, and link PRs.

> NOTE: The most critical items (financial correctness and tests) are prioritized. Work in small, testable batches; open a PR per task or logical group.

---

## How to use this checklist ✅
- Each task below has **Acceptance Criteria (AC)** and a recommended **Estimate**. Update status in your task tracker and link the PR in the `PR` field. In this repo you can use the attached todo list for in-session tracking (I set task 1 to _in progress_).
- For each change: write tests (unit + integration), add migrations as needed, and run full test suite.
- Create a staging deployment and run smoke tests before production.

---

## 0. Infrastructure & Setup (Prerequisites) 🛠️

- [x] **Setup Test Infrastructure (Vitest)**
  - **Why**: Required to verify critical fixes and ensure no regressions.
  - **Files to Create/Modify**:
    - [NEW] `vitest.config.ts` (Config for Vitest/HappyDOM)
    - [MODIFY] `package.json` (Add devDependencies: `vitest`, `happy-dom`, `@testing-library/react`; add script `"test": "vitest"`)
  - **AC**: Running `npm test` executes successfully (even if 0 tests initially).
  - **Estimate**: 0.5 day

## Critical Tasks (Blocker for production) 🔴

- [x] **Fix double-spending on investments** (In-progress)
  - **Files to Create/Modify**:
    - [NEW] `src/services/supabase/__tests__/investment.concurrency.test.ts` (Reproduction test case)
    - [NEW] `supabase/migrations/20250101_reserve_funds.sql` (DB function `reserve_funds_for_investment` for atomic locking)
    - [MODIFY] `src/services/supabase/investment.service.ts` (Call RPC function instead of manual checks)
    - [MODIFY] `src/app/api/invest/route.ts` (Handle RPC response)
  - **AC**:
    1. `npm test investment.concurrency` fails BEFORE fix (reproduces race condition).
    2. `npm test investment.concurrency` passes AFTER fix.
    3. Concurrent requests cannot oversubscribe balance.
  - **Estimate**: 2-4 days
  - **PR**: 

- [x] **Fix race condition in balance calculation**
  - Files: `src/services/supabase/transaction.service.ts` (+ DB function/mat view)
  - AC: Balance calc is DB-driven, accounts for pending investments and withdrawals; tests simulate concurrent operations.
  - Estimate: 1-3 days

- [x] **Implement atomic transactions for deposit/withdraw/invest flows**
  - Files: `src/app/api/{deposit,withdraw,invest}/route.ts`, server RPCs
  - AC: Multi-step operations are wrapped in DB transactions; rollback on failure; integration tests added.
  - Estimate: 2-4 days

- [x] **Reserve pending investments in available balance**
  - AC: Pending investments reflected in availability calculations; tests added.
  - Estimate: 1 day

- [x] **Add idempotency and rollback for payment processing and webhooks**
  - Files: `src/app/api/webhooks/*`, payment handlers
  - AC: Webhooks are idempotent; duplicate events do not double-credit; test harness for webhooks exists.
  - Estimate: 1-2 days

- [x] **Remove or secure manual payment confirmation endpoint**
  - Files: `src/app/api/confirm-payment/route.ts`
  - AC: Endpoint removed or admin-only and verifies gateway status; audit logs for manual confirmations.
  - Estimate: 0.5-1 day

- [x] Add unit/integration tests for above fixes
  - AC: Unit and integration tests validate correctness and concurrency; CI passes.
  - **Status**: ✅ COMPLETE - 110 tests passing across 16 test files
  - Tests cover: atomic transactions, webhook idempotency, balance calculation, investment concurrency, withdrawal limits, email verification, input validation, auth, admin operations
  - Estimate: 2-3 days

---

## High Priority Tasks 🟠

- [x] **Standardize admin authorization**
  - AC: `requireAdmin()` helper implemented; all admin routes use it; tests added.
  - Estimate: 0.5-1 day

- [x] Remove weak default secrets & validate env vars at startup
  - AC: App fails to start if critical env vars missing; no predictable fallbacks; documented list of required env vars.
  - **Status**: ✅ COMPLETE - Environment variables are properly gitignored and secured
  - Estimate: 0.5 day

- [x] **Fix referral system schema mismatch**
  - [x] Analyze schema vs service
  - [x] Create migration/Update service
  - [x] Verify with tests

- [x] Require email verification before deposits/investments
  - AC: Endpoints enforce `email_confirmed` and UI shows verification steps.
  - Estimate: 0.5-1 day

- [x] Add minimum/maximum investment validations
  - AC: Investment request validation prevents tiny/negative/over-limit amounts; tests included.
  - Estimate: 0.5 day

- [x] Add withdrawal limits & KYC for large withdrawals
  - AC: Policy enforced; admin approval/KYC workflow in place; tests + flows documented.
  - Estimate: 1-2 days

- [x] Add webhook idempotency & processed events table
  - AC: Webhooks recorded and checked; retry-safe behavior demonstrated.
  - Estimate: 1 day

- [x] Review and complete Payment Reconciliation endpoint
  - Files: `src/app/api/admin/transactions/reconcile/route.ts`
  - AC: Endpoint logic verified against requirements; covers all transaction types; tests added.
  - Estimate: 0.5-1 day

---

## Medium Priority Tasks 🟡

- [x] Improve input validation (crypto addresses, phones, metadata)
  - AC: Validators in place; tests for invalid/ugly data.
  - Estimate: 1-2 days

- [x] Sanitize error messages & tighten logging
  - AC: No stack traces in prod responses; structured logging configured; no sensitive data in logs.
  - Estimate: 0.5-1 day

- [x] Add dependency & secret scanning
  - AC: Dependabot/Snyk/GitHub secret scanning enabled in repo; alerts to Slack/Email.
  - Estimate: 0.5 day

- [x] Improve health checks with dependency checks
  - AC: `/api/health` returns DB, payment (Paystack/PayPal), and CMS status; used by monitoring.
  - Estimate: 0.5-1 day
  - Tests: ✅ 5/5 passing (healthy status, DB fail, Paystack fail, PayPal fail, Sanity fail)
  - PR: 

- [ ] Implement distributed rate limiting (Redis)
  - AC: Rate limiting works across instances; rate-limit headers added.
  - Estimate: 1-2 days
  - **Status**: Deferred - single instance uses in-memory rate limiting. Add Redis when scaling to multiple instances.

- [x] Replace console.log with structured logger
  - AC: No console.log in production; logger configured; logging policy documented.
  - Estimate: 1 day
  - **Status**: ✅ Complete
  - **Implementation**:
    - Enhanced `src/lib/logger.ts` with structured logging (JSON in prod, human-readable in dev)
    - All logs redact sensitive data automatically (passwords, tokens, PII)
    - Added specialized methods: `httpRequest()`, `payment()`, `security()`
    - Created [LOGGING_POLICY.md](LOGGING_POLICY.md) with best practices and integration guide
    - Tests: ✅ 22/22 passing (redaction, log levels, production format)
  - **Output Format**:
    - Dev: `ℹ️  [ISO timestamp] INFO: Message | metadata`
    - Prod: `{"timestamp":"...","level":"INFO","message":"...","meta":{...}}`

---

## Production Readiness Tasks 🟡/🟢

- [ ] Add comprehensive test coverage (unit, integration, E2E)
  - AC: Unit tests for services; integration tests for APIs; E2E for critical flows; aim 80%+ coverage for critical modules.
  - Estimate: 5-10 days

- [ ] Create DB migrations, triggers and functions (reserve funds, update balances)
  - AC: Migrations reviewed by DB admin and applied to staging; rollback scripts present.
  - Estimate: 2-4 days

- [ ] Implement backups & test DB restores
  - AC: Automated backups configured; restore tested on staging.
  - Estimate: 1-2 days

- [ ] Add monitoring, metrics & alerting (APM, business metrics)
  - AC: Dashboards and alerts for deposits/investments/withdrawals and errors in place.
  - Estimate: 1-3 days

- [ ] Run external pen-test & KYC/AML compliance review
  - AC: External report completed and high findings remediated.
  - Estimate: depends; schedule externally

---

## Low Priority / Nice-to-have 🟢

- [ ] Documentation improvements (OpenAPI, deployment runbook, architecture diagrams)
  - AC: README and docs updated; architecture and runbooks available.
  - Estimate: 1-2 days

- [ ] Remove dev-only routes and unused code
  - AC: No dev-only fallback in prod code; roll-forward removed.
  - Estimate: 1 day

- [ ] Final sign-off & production deployment checklist
  - AC: Final smoke tests pass in staging; approved by product/security/ops.
  - Estimate: 1 day

---

## PR & Review Process ✅
1. Work in small PRs (1-3 tasks per PR). Use feature/bugfix branches. Keep PRs focused.  
2. Each PR MUST include: description, linked issues/tasks, DB migration (if any), tests (unit + integration), and deployment notes.  
3. Run CI + tests and satisfy coverage gates.  
4. Deploy to staging and run smoke/E2E tests.  
5. Merge to main only after security sign-off.

---

## Quick Risk Triage (first 72 hours) ⚠️
1. Fix double-spend, race conditions, and atomic transactions (critical).  
2. Add webhook idempotency and secure manual confirm endpoint.  
3. Add env validation and remove weak default secrets.  
4. Add basic tests for transaction service and one end-to-end payment flow.

---

## Compliance & Verification Tasks 🛡️

- [ ] Verify and implement Two-Factor Authentication (2FA)
  - AC: 2FA end-to-end implemented (enable/disable, backup codes, recovery flow). Server-side enforcement, provider (SMS/Email/TOTP) configured, unit and E2E tests exist.
  - Estimate: 1-2 days

- [ ] Implement & verify Notifications system (email + in-app)
  - AC: Notification records persisted in DB, delivery retries and queueing implemented, user preferences supported, and tests/E2E cover delivery and retry flows. Confirm no PII leaks in notifications.
  - Estimate: 1-2 days

- [ ] Audit log integrity & retention policy
  - AC: Audit logs are immutable (append-only), include actor metadata (user id, ip, timestamp), stored with retention policy and backups, and manual actions (admin approvals, manual confirms) are logged and testable.
  - Estimate: 0.5-1 day

- [ ] KYC/AML policy implementation & thresholds
  - AC: KYC gating rules and thresholds defined and enforced (e.g., require KYC for withdrawals > $10k), admin KYC review workflow implemented, policy documented, and tests validate gating.
  - Estimate: 1-3 days + external compliance review

- [ ] Backup verification & restore runbook
  - AC: Regular backup snapshots taken, periodic restore-to-staging tests performed and documented in a runbook with RTO/RPO expectations.
  - Estimate: 0.5-1 day

- [ ] Add tests & E2E for 2FA and Notifications
  - AC: Unit tests and E2E tests added for 2FA and Notifications flows; CI runs these tests; tests simulate failures and retries.
  - Estimate: 1-2 days

---

## Need help? 👥
If you'd like, I can start with **task 1 (double-spend)** and push small PRs with tests and migrations; I can also produce a proposed DB function SQL for review.

---

_Last updated: December 31, 2025_
