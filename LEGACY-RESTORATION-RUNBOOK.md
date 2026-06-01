# KiddzOnline Legacy Restoration Runbook

## Mission

Replicate the legacy KiddzOnline product with surgical precision in the modern Next.js app, preserving behavior, data, workflows, permissions, reports, and parent/mobile API contracts before adding new product improvements.

The target is not "inspired by legacy." The target is functional parity unless a difference is explicitly documented and approved.

## Non-Negotiable Rules

1. Legacy code and SQL are the source of truth.
2. Existing modern pages are not assumed correct until compared against legacy.
3. No feature is considered restored because a route exists.
4. Every legacy form field, table column, filter, action button, export, print view, permission, notification, cron behavior, and API response must be mapped.
5. Every missing or intentionally changed behavior must be recorded in the parity matrix.
6. Every migration must produce reconciliation counts and orphan/skip reports.
7. Every implementation phase must pass TypeScript and targeted route verification.
8. Production data must never be touched until dry-run migration and rollback are proven.

## What Is Needed To Restore Precisely

### Already Available Locally

- Legacy PHP app: `/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup`
- Legacy admin pages: `Garderie-old-backup/Front/templates/admin`
- Legacy web services: `Garderie-old-backup/ws`
- Legacy SQL backups:
  - `kiddzonl_garderie_2018-2019.sql`
  - `kiddzonl_garderie17-18.sql`
  - `kiddzonl_garderie29sept.sql`
  - `kiddzonl_users_2018-2019.sql`
  - `kiddzonl_users29sept.sql`
  - `kiddzonl_master29sept.sql`
- Legacy iOS app: `/Users/karimsaab/Desktop/Garderie Project/KiddzOnline`
- Legacy Android app: `/Users/karimsaab/Desktop/Garderie Project/kiddzonline-master`
- Tutorial videos: `/Users/karimsaab/Desktop/Garderie Project/KiddzOnline tutorials`
- Modern app: `/Users/karimsaab/Desktop/garderie`

### Still Needed Or Must Be Confirmed

- Full original production SQL dumps for every school year, not only the annual backup samples.
- The legacy uploaded files/media directories, including child photos, attachments, medical files, daily report files, employee documents, compliance documents, invoices, and any relative paths referenced by SQL.
- Legacy environment/config values needed to run the old app locally:
  - DB host/user/password names.
  - Base URLs.
  - SMTP settings.
  - OneSignal credentials.
  - SMS/WhatsApp provider details if they existed.
  - Cron definitions from hosting control panel or server.
- A known admin/manager/teacher/parent login for legacy, or password reset access, so workflows can be observed.
- Confirmation of which legacy database/year is canonical for production restoration.
- Confirmation of whether the visual target is old Metronic parity, modernized UI with exact functionality, or exact visual recreation for selected flows.

## Restoration Artifacts To Create First

### 1. Legacy Inventory

Create `docs/legacy-inventory.md`:

- Every PHP page.
- Every page-specific JS file.
- Every PHP include/class/helper used by page actions.
- Every parent `ws/*.php` endpoint.
- Every SQL table across master/users/garderie databases.
- Every cron script.
- Every PDF/export/print endpoint.
- Every upload/file directory reference.
- Every native mobile endpoint and response model.

### 2. Page Parity Matrix

Create `docs/page-parity-matrix.md` and `.json`.

For each legacy page:

- Legacy path.
- Modern route.
- Module.
- Role access.
- Page purpose.
- Exact table columns in order.
- Filters/search controls.
- Sort/pagination behavior.
- Row actions.
- Bulk actions.
- Modals/dialogs.
- Form sections.
- Field names, input types, default values, required flags.
- Validation rules.
- Save/update/delete behavior.
- Draft behavior.
- Print/PDF/export behavior.
- Notification side effects.
- DB tables read/written.
- Modern status: done, partial, missing, blocked.
- Gap notes.
- Verification checklist.

### 3. Database Mapping Matrix

Create `docs/database-mapping-matrix.md` and `.json`.

For every legacy table:

- Source database.
- Source table.
- Source columns.
- Primary key.
- Foreign keys, explicit or inferred.
- Modern model/table.
- Column-level mapping.
- Transform rules.
- Date parsing rules.
- Enum mapping.
- File reference handling.
- Password/auth handling.
- Soft delete handling.
- School-year handling.
- Multi-tenant organization/branch mapping.
- Migration script responsible.
- Reconciliation query.
- Status.

### 4. API Contract Matrix

Create `docs/parent-api-contract-matrix.md`.

For every legacy `ws/*.php`, iOS `WebFunctions.swift` operation, and Android `WebServiceFunctions.java` call:

- Legacy endpoint.
- Request method.
- Request fields.
- Authentication/session/token behavior.
- Response JSON shape.
- Error shape.
- Modern endpoint.
- Response compatibility decision.
- Mobile screen consuming it.
- Migration/compatibility status.

### 5. Cron And Notification Matrix

Create `docs/cron-notification-matrix.md`.

For every legacy cron/notification flow:

- Script path.
- Schedule.
- Data source.
- Recipient.
- Template/body.
- Delivery channel.
- Log table.
- Modern background job.
- Modern notification template.
- Modern send log.
- Verification.

### 6. File And Attachment Matrix

Create `docs/file-attachment-matrix.md`.

For every attachment category:

- Legacy table/column.
- Legacy file path pattern.
- Modern model.
- Modern storage bucket/key.
- Upload UI.
- Download/view permission.
- Migration rule.
- Missing-file behavior.

## Database Restoration Protocol

### Step 1: Import Legacy Dumps Locally

- Create isolated MySQL databases for master, users, and each garderie school year.
- Import SQL dumps without modifying data.
- Run table counts.
- Run schema extraction.
- Record import warnings/errors.

### Step 2: Build Source Data Report

Produce:

- Table counts by database.
- Empty tables.
- Tables with invalid dates.
- Tables with orphaned foreign keys.
- Tables with file references.
- Tables with encrypted/hash fields.
- Tables not covered by modern Prisma schema.

### Step 3: Complete Modern Schema Coverage

Before migration is complete, modern schema must represent:

- Organizations, branches, classes, school years.
- Staff/admin/parent users and permissions.
- Children, drafts, history, parents, relatives, authorized pickups, addresses.
- Employees, profile sections, attendance, logs, attachments.
- Daily reports, absences, medical forms, assessments.
- Payments/accounting/invoices.
- Calls/call causes.
- Messages/inbox/sent/read states.
- Alarms, notifications, templates, logs.
- Food calendar, holidays, events.
- Nursery/government compliance and documents.
- Files/attachments.
- Audit/history where required.

### Step 4: Migration Scripts

Migration scripts must be idempotent and ordered:

1. Organizations and school years.
2. Branches, classes, settings, address hierarchy.
3. Children, drafts, parents, relatives, authorized pickups, addresses.
4. Employees and employee documents.
5. Staff users, parent users, permissions.
6. Daily reports, milk, fever, attachments.
7. Absence reports and attachments.
8. Medical forms, medical entries, vaccinations, attachments.
9. Assessments and assessment dates.
10. Accounting, payments, invoices.
11. Calls and call causes.
12. Food, food calendar, holidays, events.
13. Messages and message delivery states.
14. Alarms, notification settings, notification logs.
15. Compliance data and compliance documents.
16. Audit/history logs.
17. File migration.

### Step 5: Reconciliation

Every script must output:

- Source row count.
- Rows migrated.
- Rows skipped.
- Skip reason by category.
- Orphans detected.
- Invalid values normalized.
- File references found/migrated/missing.
- Generated UUID mapping file path.

Migration is not accepted until reconciliation is reviewed.

## Feature Restoration Protocol

For every page/module:

1. Read legacy PHP.
2. Read page-specific JS.
3. Read SQL tables touched by the page.
4. Read current modern route/component/action/model.
5. Fill parity matrix.
6. Implement missing behavior.
7. Preserve modern architecture, but preserve legacy functionality.
8. Add or update validation.
9. Add role/org access checks.
10. Verify with TypeScript.
11. Verify route renders.
12. Add screenshots or notes when visual/functionality parity is reached.
13. Commit with module-specific message.

## Priority Restoration Order

### Blocker Tier

1. Branch/repo hygiene.
2. Legacy inventory.
3. Database mapping matrix.
4. Page parity matrix.
5. File/attachment matrix.
6. Parent API contract matrix.

### Product Parity Tier

1. Login/auth/permissions.
2. Dashboard.
3. Children/enrollment/drafts/details/dashboard.
4. Daily reports/batch/drafts.
5. Absence reports/drafts.
6. Medical forms 1-6 and accident reports.
7. Employees and attendance logs.
8. Food calendar and holidays.
9. Accounting/payments/invoices.
10. Messages.
11. Calls.
12. Assessments.
13. Alarms/notifications.
14. Settings/admin/geography/compliance/new year.
15. Parent API/portal.

### Production Tier

1. Full migration dry run.
2. File migration dry run.
3. Notification delivery.
4. E2E regression tests.
5. Deployment/backup/rollback.
6. Production cutover rehearsal.

## Acceptance Gates

### Page Gate

A page is accepted only when:

- All legacy fields/columns/filters/actions are accounted for.
- All modern differences are documented.
- Create/edit/delete/view flows work.
- Permissions are enforced.
- TypeScript passes.
- Route does not 500.

### Module Gate

A module is accepted only when:

- All pages in that module pass the page gate.
- All related DB tables are mapped.
- Related migration scripts exist.
- Related files/attachments are handled.
- Related notifications/PDFs/exports are handled.

### Database Gate

Database restoration is accepted only when:

- Full dry-run migration succeeds from fresh legacy imports.
- Reconciliation reports are clean or documented.
- UUID mappings are persisted.
- No critical orphan data is lost silently.
- File references are migrated or explicitly marked missing.
- Login strategy for old users is proven.

### Cutover Gate

Production cutover is accepted only when:

- Migration is repeatable.
- Rollback is documented.
- Backups are verified.
- Critical E2E flows pass.
- Parent API/portal works.
- Notifications and cron jobs work.

## First Overnight Goal

Build the restoration artifacts only. Do not modify product behavior.

Tasks:

1. Generate `docs/legacy-inventory.md`.
2. Generate `docs/page-parity-matrix.md`.
3. Generate `docs/database-mapping-matrix.md`.
4. Generate `docs/parent-api-contract-matrix.md`.
5. Generate `docs/cron-notification-matrix.md`.
6. Generate `docs/file-attachment-matrix.md`.
7. Identify the top 20 missing/simplified modern features.
8. Run `pnpm exec tsc --noEmit`.
9. Commit only documentation.

## Second Overnight Goal

Implement the top 5 blocker restoration gaps from the matrices, one commit per gap, with verification after each commit.

