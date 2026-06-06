# KiddzOnline Technical Director Plan

## Current Project Map

Legacy sources live under `/Users/karimsaab/Desktop/Garderie Project`:

- `Garderie-old-backup`: PHP/MySQL web app, admin portal, web services, SQL backups.
- `KiddzOnline`: legacy iOS Swift app for parents.
- `kiddzonline-master`: legacy Android Java app for parents.
- `KiddzOnline tutorials`: product walkthrough videos.

Modern app lives at `/Users/karimsaab/Desktop/garderie`:

- Next.js 16, React 19, TypeScript, Prisma 7, PostgreSQL.
- Local branch is named `main`, but tracks `origin/ux-improvements` and is ahead by 57 commits.
- `pnpm exec tsc --noEmit` currently passes.

## Executive Decision

Do not rewrite from scratch again. The modern app has a usable foundation, but it must be treated as an incomplete port that needs a legacy parity audit, feature restoration, production hardening, and then product modernization.

This document is the technical direction and operating plan. The surgical restoration execution contract is now in `LEGACY-RESTORATION-RUNBOOK.md`. The first restoration deliverable must be a full parity matrix and database migration/reconciliation plan that proves every legacy page, endpoint, table, and file category has a modern destination.

The correct strategy is:

1. Stabilize repo and branch state.
2. Build a legacy parity matrix from PHP pages, SQL tables, and native app endpoints.
3. Restore missing/simplified workflows in the modern app.
4. Harden data isolation, file uploads, notification sending, and migrations.
5. Replace old native parent apps with a modern parent portal/PWA first, then decide whether native wrappers are needed.

## Key Findings

### What Is Strong

- The modern app has broad route coverage: dashboard, children, daily reports, absences, medical, food, branches, classes, employees, accounting, messages, alarms, assessments, settings, reports, parent API routes, PDFs, PWA shell.
- Prisma schema is broad and already maps most legacy concepts.
- TypeScript currently passes.
- Multi-tenancy work has started and most server actions use `requireOrg` / organization-scoped queries.
- Existing migration scripts cover branches, classes, children, parents, employees, users, daily reports, medical, payments, messages.

### What Is Still Risky

- The local branch setup is confusing: `main` tracks `origin/ux-improvements`.
- There are generated overnight docs/scripts/logs mixed into the repo.
- There is no test suite.
- File uploads are mostly UI placeholders; there is no real storage pipeline.
- Notification templates and logs exist, but actual push/email/SMS delivery is not production-ready.
- Parent-facing UI is missing; only parent API routes exist.
- Legacy native apps are old: iOS uses Swift + old CocoaPods/OneSignal, Android uses Gradle 3.4, Android Support libs, target SDK 28.
- Some features are still partial: new academic year workflow, call module is child-scoped only, class dashboard is simplified compared to old 49-card dashboard, attachments are placeholders in several places.
- Data migration does not yet cover every legacy table, especially assessments, notifications/logs, calendar nuances, call causes/call reports, full government compliance data, and files.

## Source Of Truth

Use these as authoritative inputs, in this order:

1. Legacy PHP pages in `Garderie-old-backup/Front/templates/admin`.
2. Legacy SQL dumps in `Garderie-old-backup/ajax/annual backups`.
3. Legacy parent API files in `Garderie-old-backup/ws`.
4. iOS/Android parent apps for actual parent UX and endpoint expectations.
5. Modern app docs/specs only as helpful notes, not truth.

## Surgical Restoration Rule

The restoration target is functional parity, not "roughly similar." A modern route, schema model, or component does not count as complete until it has been compared against the old PHP page, page JS, SQL tables, parent endpoint contracts, and file/notification side effects.

For the detailed execution process, acceptance gates, and required artifacts, use:

- `LEGACY-RESTORATION-RUNBOOK.md`

## Modernization Phases

### Phase 0: Repo Hygiene And Baseline

- Rename or retarget the local branch so branch names match GitHub reality.
- Commit or discard generated logs intentionally.
- Keep a clean branch for audit work.
- Record a baseline: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`.
- Start dev server and verify authenticated flows with seed/test credentials.

### Phase 1: Legacy Parity Matrix

Create a machine-readable matrix covering:

- Every PHP page.
- Every JS file attached to a PHP page.
- Every `ws/*.php` parent endpoint.
- Every SQL table.
- Every modern route/component/action/model that claims to replace it.
- Status: done, partial, missing, unknown.
- Required columns, filters, form fields, actions, PDFs, uploads, cron jobs, and notifications.

Deliverable: `docs/legacy-parity-matrix.md` and optionally `docs/legacy-parity-matrix.json`.

The matrix must include these columns:

- Legacy source path or SQL table.
- Legacy feature/module.
- User role: admin, manager, teacher, nurse, doctor, parent.
- Modern route/component/action/model.
- Status: done, partial, missing, unknown.
- Missing fields, filters, buttons, actions, permissions, uploads, exports, PDFs, notifications, cron behavior.
- Data migration mapping.
- Verification method.
- Production priority.

### Phase 2: High-Frequency Staff Workflows

Restore and polish the workflows staff use daily:

- Teacher Today view.
- Tap attendance / class roster flow.
- Daily report create/edit/batch, matching old fields.
- Absence report with hospital fields and attachments.
- Food calendar and holiday calendar.
- Employee attendance upload and logs.

Acceptance: a teacher can complete a day for one class without falling back to legacy.

### Phase 3: Admin And Compliance Workflows

Restore admin-heavy workflows:

- Child enrollment and child dashboard.
- Class dashboard with old daily/medical/assessment stat coverage.
- Full accounting matrix/tabs and invoice printing.
- Nursery/government compliance settings.
- Branch compliance documents.
- New academic year setup.
- Address hierarchy reference numbers.

Acceptance: a manager can run enrollment, reporting, billing, compliance, and year rollover from the modern app.

### Phase 4: Communication And Notifications

Make communications real, not just forms:

- Message inbox/sent/compose parity, including nature, body preview, filters, class/direct/bulk messaging.
- Notification templates with audit logs.
- Background job to evaluate birthday, assessment, vaccination, insurance, contract, payment, event, medicine, and missing-report rules.
- Delivery adapters: email first, then web push, then SMS/WhatsApp if required.
- Parent push token lifecycle.

Acceptance: a saved notification rule actually produces a notification and a send log.

### Phase 5: Parent Portal

Build parent-facing UI as a PWA before rebuilding native apps:

- Login. First slice restored at `/parent/login` with `/api/parent/login`, parent JWT storage, child id storage, and legacy-style failed-login responses.
- Child daily timeline.
- Daily reports. First slice restored in `/parent` from `/api/parent/daily/[childId]/detailed`.
- Absence reports. First slice restored in `/parent` from `/api/parent/absence/[childId]`.
- Payments. First slice restored in `/parent` from `/api/parent/finance/[childId]`.
- Food and holiday calendar. First slice restored in `/parent` from `/api/parent/calendar/food` and `/api/parent/calendar/holidays`.
- Messages. First slice restored in `/parent` with list and compose via `/api/parent/messages/[childId]` and `/api/parent/messages`.
- Notifications. First slice restored in `/parent` from `/api/parent/notifications/[childId]`.
- Push subscription.

Use legacy iOS/Android as UX and API reference, but do not modernize those codebases directly unless app-store native requirements force it.

### Phase 6: Data Migration

Turn migration from "scripts exist" into a repeatable cutover pipeline:

- Import SQL dumps into a local MySQL database.
- Run dry migration to PostgreSQL.
- Add missing migration coverage: assessments, call reports, notification logs, settings, holidays/events, files/attachments.
- Add reconciliation reports: counts by table/model, orphan rows, invalid dates, missing required fields.
- Add rollback/re-run strategy.

Acceptance: migration can be run repeatedly and produce an auditable report.

This phase must explicitly cover all legacy databases and data categories:

- `kiddzonl_master`: master nursery/account registry, global auth/control tables, notifications.
- `kiddzonl_users`: staff/admin auth, permissions, year selection, branch/class references.
- `kiddzonl_garderie_*`: operational nursery data for each school year.
- Parent users and parent login timestamps.
- Branches, classes, school years, settings, address hierarchy.
- Children, drafts, history records, addresses, parents, relatives, authorized pickups, attachments.
- Teachers, nurses, doctors, managers, addresses, info records, attendance, attachments.
- Daily reports, daily milk, fever, attachments.
- Absence reports and attachments.
- Medical forms 1-6, medical form info rows, vaccinations, medical attachments.
- Assessments 1-7 and assessment dates.
- Accounting, payments, new payments, invoices/receipts.
- Call causes and parent call reports.
- Messages, custom notification messages, inbox/sent states.
- Alarms, custom notifications, notification settings, notification logs.
- Food items, food calendar, food apply records.
- Holidays, events, event types, notification calendar.
- Government/nursery compliance data and attachments.
- History/action logs where they are needed for auditability.

Known modern migration coverage today:

- Covered by existing scripts: branches, classes, children, parents, employees, users, daily reports, medical, payments, messages.
- Not fully covered yet: assessments, call reports, notification logs/settings, all alarms/custom notification tables, food calendar nuances, holidays/events nuance, government compliance fields, year rollover, history logs, and real file/attachment transfer.

Database restoration acceptance criteria:

- A fresh PostgreSQL database can be created from the legacy SQL dumps without manual row edits.
- Every migrated table/model has count reconciliation: source rows, skipped rows, migrated rows, and reason for skips.
- Every old integer ID has a stable UUID mapping saved to disk.
- Every foreign-key relationship is validated after migration.
- Every file reference is either migrated to object storage or marked with an explicit missing-file reason.
- Old MD5 passwords are handled safely with first-login rehash or forced reset.
- Parent mobile/API logins still work through the new parent portal/API.
- A rollback plan exists before touching production data.

### Phase 7: Production Hardening

- Add real file storage: S3/R2 with presigned uploads, malware/type/size checks, thumbnails where needed.
- Add authorization tests for cross-organization access.
- Add PostgreSQL migrations instead of relying on `db push`.
- Add Playwright E2E for login, child enrollment, daily report, absence, message, payment, parent login.
- Add error monitoring, audit logs, backups, and restore drills.
- Add deployment architecture: Vercel or container, Neon/Postgres, cron runner, object storage, secrets management.

## Overnight Goal Strategy

Use `/goal` only for bounded, auditable batches. Do not ask an overnight run to "modernize everything."

Recommended first overnight goal:

> Build the legacy parity matrix by reading the PHP pages, SQL dumps, parent web services, iOS WebFunctions, Android WebServiceFunctions, and mapping them to modern routes/actions/models. Do not change app behavior except creating docs. Run no destructive commands.

Recommended second overnight goal:

> Implement the top 5 highest-priority missing parity gaps from the matrix, one commit per gap, with `pnpm exec tsc --noEmit` after each commit.

Every overnight implementation goal should require:

- Read old PHP first.
- Read current Next.js implementation second.
- Keep existing modern architecture.
- No duplicate pages for existing modules.
- Add/update tests where practical.
- Run TypeScript and targeted route verification.
- Commit each phase separately.

## Initial Priority Backlog

1. Clean branch state and repo artifacts.
2. Build legacy parity matrix.
3. Complete real file upload/storage.
4. Complete notification/background delivery.
5. Build parent portal UI.
6. Finish new academic year workflow.
7. Expand class dashboard to legacy coverage.
8. Add top-level calls module or clearly expose call reports in admin navigation.
9. Complete migration coverage and reconciliation.
10. Add E2E/regression tests.
