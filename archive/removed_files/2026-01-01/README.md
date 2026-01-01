# Archived files — 2026-01-01

These files were removed from the main workspace and archived on branch `chore/remove-legacy-files-20260101` before being merged into `main` on 2026-01-01.

Reason: Consolidated `supabase/unified_schema.sql` is now the canonical, idempotent schema; legacy split SQL scripts and duplicated complete_schema/migration files are archived to keep the repo tidy. Several markdown audit files that were superseded by up-to-date reports were also archived.

Files archived:
- migration.sql
- database-migration.sql
- complete_schema.sql
- scripts/supabase_schema.sql
- scripts/supabase_policies.sql
- scripts/crypto_wallets_migration.sql
- PRODUCTION_READY.md
- PRODUCTION_READINESS_PLAN.md
- AUDIT_REPORT.md
- AUDIT_FIXES_CHECKLIST.md
- BACKEND_TEST_REPORT.md
- vitest.config.ts.timestamp-1767267364588-e0cefceb41011.mjs

If a restore is needed, you can check out the branch `chore/remove-legacy-files-20260101` or retrieve these files from the tag `pre-cleanup-20260101`.