# Data Migration: MySQL → PostgreSQL

Migrates data from the old Kiddz Online MySQL database to the new Garderie PostgreSQL database.

## Prerequisites

1. **Old MySQL database** must be accessible (running or via a dump import)
2. **New PostgreSQL database** must have the schema already applied (`pnpm prisma db push` or `pnpm prisma migrate deploy`)
3. **Environment variables** configured (see below)

## Environment Setup

Create a `.env.migration` file (or add to your existing `.env`):

```env
# Old MySQL connection
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=kiddzonl_garderie_2018-2019

# New PostgreSQL (uses DATABASE_URL from .env by default)
DATABASE_URL=postgresql://user:pass@localhost:5432/garderie
```

## Running Migrations

### Full migration (all steps)

```bash
# Dry run first — preview what will happen
pnpm tsx src/scripts/migration/migrate-all.ts --dry-run

# Run for real
pnpm tsx src/scripts/migration/migrate-all.ts
```

### Run specific steps

```bash
# Run only up to step 4 (branches, locations, classes, children)
pnpm tsx src/scripts/migration/migrate-all.ts --step=4

# Resume from step 7 (assumes steps 1-6 already ran)
pnpm tsx src/scripts/migration/migrate-all.ts --from=7
```

### Run individual scripts

Each script can be run standalone:

```bash
pnpm tsx src/scripts/migration/migrate-branches.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-locations.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-school-years.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-classes.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-children.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-garderie-profile.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-parents.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-employees.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-garderie-misc.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-users.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-control-plane.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-auth-metadata.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-login-audit.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-settings.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-daily-reports.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-absences.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-calls.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-assessments.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-medical.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-payments.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-food-calendar.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-alarms.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-messages.ts [--dry-run]
```

> **Note:** Individual scripts require their dependency steps to have run first.

## Migration Order (Dependencies)

```
1. Branches       ← needs Organization (auto-created)
2. Locations      ← no deps; provides address location mappings
3. School Years   ← needs Organization
4. Classes        ← needs Branches
5. Children       ← needs Branches, Classes, Locations, School Years
6. Garderie Profile ← needs Branches, Children
7. Parents        ← needs Children
8. Employees      ← needs Branches
9. Garderie Misc  ← needs Branches, Children, Employees
10. Users          ← needs Branches, Children/Parents
11. Control Plane  ← needs Users when user grants are resolvable
12. Auth Metadata  ← needs Users
13. Login Audit    ← needs Users/Parent Users when resolvable
14. Legacy Settings ← optional legacy config tables
15. Daily Reports  ← needs Children
16. Absences       ← needs Children, Users
17. Calls          ← needs Children, Employees, Users
18. Assessments    ← needs Children, Classes, Employees/Users, Organization
19. Medical Forms  ← needs Children
20. Payments       ← needs Children
21. Food/Calendar  ← needs Branches, Organization
22. Alarms         ← needs Children, Users, Parent Users, Teachers
23. Messages       ← needs Users
```

## Table Mappings

| Old MySQL Table(s) | New PostgreSQL Model(s) |
|---|---|
| `t_branch` | Branch |
| `t_mouhafaza` | Province |
| `t_quadaa` | District |
| `t_region` | Region |
| `t_school_year` | SchoolYear |
| `t_class` | Class, including source database/key provenance and class image metadata |
| `t_child`, `t_child_draft` | Child (isDraft flag) |
| `t_child_h` | ChildHistory |
| `t_old_garderie` | ChildPreviousGarderie |
| `t_attachments` | ChildAttachment |
| `t_address` | ChildAddress, including source database/key provenance and raw legacy row |
| `t_authorized` | Relative (isAuthorized=true), including source database/key provenance and raw legacy row |
| `t_relatives` | Relative, including source database/key provenance and raw legacy row |
| `t_garderie` | BranchCompliance |
| `t_garderie_attachments` | BranchDocument |
| `t_garderie_doctor`, `t_garderie_doctor_attachments` | Doctor, DoctorAttachment |
| `t_parents` | Parent |
| `t_teacher`, `t_teacher_address`, `t_teacher_attachments` | Teacher, TeacherAddress, TeacherAttachment |
| `t_teacher_info` | TeacherExperience |
| `t_nurse`, `t_nurse_attachments` | Nurse, NurseAttachment |
| `t_doctor` | Doctor, DoctorAddress |
| `t_manager`, `t_manager_address` | Manager, ManagerAddress |
| `t_manager_attachments` | ManagerAttachment |
| `login_users` | User, plus LegacyAuthRecord rows preserving serialized `user_level` targeting metadata |
| `parent_login_users` | ParentUser, including raw `legacyData`, numeric legacy login ids, child-link `usites`, and existing token preservation for `ws/login.php` parity |
| `login_confirm`, `login_confirm_man`, `login_profiles`, `login_profiles_man`, `login_profile_fields`, `login_profile_fields_man`, `login_levels`, `login_levels_man`, `parent_login_levels`, `login_integration`, `login_users`, `login_users_man` | LegacyAuthRecord |
| `login_timestamps`, `login_timestamps_man`, `parent_login_timestamps` | LegacyLoginTimestamp |
| `login_settings`, `parent_login_settings`, `login_settings_man`, `t_settings`, `t_notification_setting` | LegacySetting |
| `system_actions`, `system_actions_man`, `actions_control`, `actions_control_man`, `users_control` | LegacyAccessControlRecord |
| `t_garderies` | LegacyGarderieRegistry |
| `notifications` | LegacySetting |
| `year_select`, `year_db` | LegacyYearDatabase |
| `t_daily_report` | DailyReport, including source database/table provenance and raw `legacyData` for parent mobile `daily.php`/`newdaily.php` parity |
| `t_daily_fever` | DailyReportFever |
| `t_daily_milk` | DailyReportMilk |
| `t_daily_attachments` | DailyReportAttachment |
| `t_absent_report` | AbsenceReport, including raw `legacyData` for parent mobile `absence.php` parity |
| `t_absent_attachments` | AbsenceAttachment |
| `callparent` | CallCauseCategory |
| `callcauses` | CallCause |
| `t_form_6` | CallLog, including source database/key provenance, legacy child/branch/class/teacher ids, draft state, and raw `legacyData` |
| `t_assessment_1` .. `t_assessment_7` | Assessment |
| `new_assessment` | Assessment `_legacyNewAssessmentMarkers` / notification stub |
| `t_assessment_dates` | AssessmentScheduleRule |
| `t_form_1` | MedicalForm (GENERAL) |
| `t_form_2` | MedicalForm (CONDITIONS) |
| `t_form_3` | MedicalForm (VISITS) |
| `t_form_4` | MedicalForm (VACCINATIONS) + Vaccination |
| `t_form_5` | MedicalForm (ACCIDENTS) |
| `t_med_forms_info` | MedicalFormEntry |
| `t_forms_attachments` | FormAttachment |
| `t_payments` | Payment, including raw `legacyData` for parent mobile `finance.php` parity |
| `newpayment` | PaymentReminder |
| `t_accounting` | AccountingEntry |
| `t_food` | Food |
| `t_food_calendar` | FoodCalendar, including source database/key provenance and raw `legacyData` for parent mobile `foodcalendar.php` parity |
| `t_food_apply` | FoodApplication |
| `t_holiday` | Holiday |
| `t_events_types` | EventType |
| `t_events` | Event |
| `t_alarms`, `t_alarms_*` (except `t_alarms_msg`) | Alarm |
| `custom_notifications_*` delivery tables | NotificationReceipt |
| `notifications_tokens` | PushToken |
| `t_notifications_log` | LegacyNotificationLog |
| `notifications_nature` | LegacyNotificationNature |
| `t_alarms_msg` | MessageThread, Message |
| `custom_notifications_msg` | Message (per-recipient) |

Message migration preserves legacy message notification provenance on `Message` rows: source database, stable `legacyKey`, legacy message/thread/sender/recipient ids, delivery user/type, `legacyNature`, `legacyHref`, and raw legacy row JSON. Each `custom_notifications_msg` delivery row becomes a separate recipient-scoped modern `Message`, so reconciliation expects recipient fan-out rather than a simple 1:1 count with `t_alarms_msg`.

Alarm migration preserves source database/table provenance inside `Alarm.legacyData` for every `t_alarms*` content row and backfills that JSON when previously imported alarms are encountered on rerun. Push tokens and legacy notification logs also retain `sourceDatabase`/`sourceTable` in `legacyData`; their count checks remain weaker where the modern schema intentionally deduplicates tokens or keeps legacy notification-log ids globally unique.

## Key Design Decisions

### ID Mapping
Old MySQL uses auto-increment integers. New PostgreSQL uses UUIDs. The migration maintains an in-memory mapping table (old int → new UUID) for FK resolution.

### Password Handling
Old passwords are MD5 hashes. They are rehashed as `bcrypt(md5:ORIGINAL_HASH)`. Modern staff login now:
1. Verifies direct bcrypt passwords first
2. Falls back to hashing the submitted password with MD5, prepending `md5:`, and verifying with bcrypt
3. Rehashes successful legacy logins directly with bcrypt for future logins

### Login Audit
Legacy timestamp tables are historical login audit trails, not active sessions. They are restored into `LegacyLoginTimestamp` with source database/table/id, legacy user id, IP address, timestamp, and the resolved modern `User` or `ParentUser` UUID when the user mapping exists.

### Auth Metadata
Legacy PHP auth metadata tables (`login_confirm`, `login_confirm_man`, `login_profiles`, `login_profiles_man`, `login_profile_fields`, `login_profile_fields_man`, `login_levels`, `login_levels_man`, `parent_login_levels`, `login_integration`, `login_users`, and `login_users_man`) are preserved in `LegacyAuthRecord`. These rows are not active modern users; they keep confirmation tokens, profile field/value rows, login-level metadata, social-login identifiers, regular/manager-login serialized user-level payloads, optional resolved user UUIDs, and raw JSON. Confirmation rows with legacy `id = 0` use a composite source key so duplicate token rows are not dropped.

### Legacy Control Plane
Legacy master/users control-plane tables are preserved without being enforced as modern RBAC yet. `system_actions*`, `actions_control*`, and `users_control` become `LegacyAccessControlRecord`; `t_garderies` becomes `LegacyGarderieRegistry`; master `notifications` rows are kept as `LegacySetting`; and `year_select`/`year_db` rows become `LegacyYearDatabase`.

### Legacy Settings
Legacy PHP auth, nursery, and notification setting tables are preserved in `LegacySetting` with their source database/table/id, scope, key, exact value, optional description, and raw JSON. They are not written into active branch `Settings`.

### Garderie Profile
Legacy `t_garderie` rows populate the active branch compliance form and also keep source database/table/id, legacy branch/user ids, coordinates, and the raw JSON. Legacy `t_garderie_attachments` rows become branch documents with source keys and active flags. Legacy `t_old_garderie` rows are preserved as child previous-garderie history, including inactive rows.

### Garderie Misc
The final small garderie-db tables are restored into their modern surfaces: general child attachments, event type defaults, garderie doctor identity/docs, and manager attachments. Each keeps a legacy key and raw JSON so the source row is auditable.

### Legacy File Audit
Legacy file path rules are codified in `legacy-file-rules.ts` and documented in `docs/legacy-file-storage-rules.md`. Before object-storage import, run `pnpm tsx src/scripts/migration/audit-legacy-files.ts` with `MYSQL_DATABASE` pointed at the imported legacy database and `LEGACY_APP_ROOT` pointed at the legacy app backup. The audit reports found, missing, default/empty, and unsafe filename references for every legacy file table/column.

Use `pnpm tsx src/scripts/migration/export-legacy-files.ts --out-dir=/tmp/kiddzonl-legacy-file-export` to copy found legacy files into a provider-neutral export package and write a manifest of exported, missing, default, unsafe, table-missing, and column-missing references.

Then upload the export package with the shared storage adapter:

```bash
STORAGE_PROVIDER=local \
STORAGE_LOCAL_ROOT=/tmp/kiddzonl-storage \
STORAGE_PUBLIC_BASE_URL=/storage \
pnpm tsx src/scripts/migration/upload-legacy-file-export.ts \
  --manifest=/tmp/kiddzonl-legacy-file-export/manifest.json \
  --out-manifest=/tmp/kiddzonl-legacy-file-upload.json
```

Set `STORAGE_PROVIDER=s3` or `STORAGE_PROVIDER=r2` with bucket credentials for production. The upload manifest keeps `sourceDatabase`, `legacyTable`, `legacyColumn`, `legacyId`, `ruleId`, `objectKey`, and `publicUrl` so migrated filename fields can be rewritten to object-storage URLs without guessing. See `docs/file-storage-pipeline.md` for provider env vars and cutover gates.

After upload, preview URL rewrites against PostgreSQL:

```bash
pnpm tsx src/scripts/migration/apply-legacy-file-urls.ts \
  --manifest=/tmp/kiddzonl-legacy-file-upload.json \
  --out-manifest=/tmp/kiddzonl-legacy-file-url-apply.json \
  --dry-run
```

The apply script updates only tables with strong legacy provenance. After rerunning migrations that include `20260601017000_add_legacy_file_provenance`, it rewrites branch/class/child/staff profile photos plus child, branch, teacher, nurse, doctor, manager, daily report, absence, payment, and form attachment URL fields by `sourceDatabase + legacyTable + legacyId`. Legacy `t_forms_attachments` exports use the `medical-form-document` rule and update `FormAttachment.fileUrl`; runtime-created form attachments use `form-attachment` for the same target. The script also patches `child-history-photo` entries inside legacy `ChildHistory.snapshot.image` JSON when the snapshot is a migrated `t_child_h` row and the current image value still matches the exported legacy filename.

Daily report migrations also preserve the raw `t_daily_report` row plus source database/table provenance on `DailyReport.legacyData`, and medical form info rows preserve `t_med_forms_info.medfid`/`medname` on `MedicalFormEntry.legacyData`. Those provenance fields are required for exact parent mobile daily-report responses, especially PHP-only fields and `newdaily.php` `takenmeds_Arr` name resolution.

### Count Reconciliation

After a dry run or full migration, run the count reconciler against the same imported MySQL database and the target PostgreSQL database:

```bash
pnpm tsx src/scripts/migration/reconcile-migration-counts.ts \
  --json=/tmp/kiddzonl-migration-reconciliation.json
```

Use `--fail-on-warning` in CI or cutover rehearsal runs when warnings should fail the job. Use `--list-rules` to print the curated table rules and `--rule=<rule-id>` to inspect one rule at a time.

The report labels each rule with evidence strength:

- `strong`: target rows keep queryable legacy provenance such as `sourceDatabase`, `legacyTable`, or `sourceTable`.
- `weak`: counts are useful sanity checks, but the target table does not yet expose row-level legacy keys.
- `derived`: the row count is intentionally transformed or consolidated.

Warnings are not cosmetic. Any `warning`, `missing`, or `error` result must be resolved or explicitly accepted before cutover. `not-applicable` means the legacy table was not present in the selected imported database, which is expected for some master/annual dumps.

The notification receipt rules mirror every `custom_notifications*` delivery table migrated by `migrate-alarms.ts`, including parent receipt variants, requests/others, event staff/parent deliveries, and holiday read-state.

Alarm content rows from `t_alarms*` are reconciled against `Alarm.legacyData.sourceDatabase` and `Alarm.legacyData.sourceTable`. Count mismatches usually mean duplicate legacy content merged into an existing alarm or the imported dump differs from the canonical production source.

Daily report rows from `t_daily_report` are reconciled against `DailyReport.legacyData.sourceDatabase` and `DailyReport.legacyData.sourceTable` for active rows. Count mismatches usually mean a source row had an unmapped child, an invalid report date, or duplicate child/date content merged into an existing report.

Call rows from `t_form_6` are reconciled against `CallLog.sourceDatabase` for all active rows, including drafts. Count mismatches usually mean a source row had an unmapped child or invalid legacy id.

Food calendar rows from `t_food_calendar` fan out into meal-type `FoodCalendar` entries, so reconciliation counts distinct target `legacyId` values with `sourceDatabase` provenance. Count mismatches usually mean a source row had an unmapped branch, invalid date, or no mappable meal/dessert entry.

Child roster rows from `t_child` and draft rows from `t_child_draft` are reconciled against `Child.sourceDatabase` and `Child.legacyTable` so active/draft imports are checked by exact legacy provenance rather than broad child totals. Count mismatches usually mean a source row had an unmapped branch or invalid draft id.

Class rows from `t_class` are reconciled against `Class.sourceDatabase` and `Class.legacyTable`. Count mismatches usually mean a source class had an unmapped branch or duplicate branch/name fallback during a backfill rerun.

Child addresses and relative/contact rows from `t_address`, `t_authorized`, and `t_relatives` are reconciled against `sourceDatabase` and `legacyTable`. Count mismatches usually mean a source row had an unmapped child; legacy `t_relatives.can_pick` still controls pickup authorization without changing the source-table count.

Parent mobile login rows from `parent_login_users` are reconciled against `ParentUser.sourceDatabase`/`legacyKey` for non-empty usernames. Count mismatches usually mean the source row could not be linked to a migrated child.

Active absence reports from `t_absent_report` are reconciled against `AbsenceReport.sourceDatabase`/`legacyKey`. Count mismatches usually mean a source row had an unmapped child or an invalid legacy report date.

Employee calendar status rows from `t_emp_status` are reconciled against `EmployeeEvent.notes` legacy JSON. Count mismatches usually mean a source row had an unmapped teacher, invalid date, or unsupported legacy status.

### Idempotency
All scripts check for existing records before inserting, so they can be re-run safely. Already-migrated records are skipped.

### Soft Deletes
Old DB uses `active = 0` for soft deletes. Only active records (active = 1) are migrated. Deleted records (deleted = 1) are also excluded.

### Locations
Legacy Lebanon location tables are migrated into the modern Province → District → Region hierarchy. Old `t_mouhafaza.m_id`, `t_quadaa.qid`, and `t_region.rid` values are mapped to UUIDs for downstream address restoration; inactive rows and orphan districts/regions are skipped and counted in logs.

### School Years
Legacy `t_school_year` rows are migrated with source database/table/id, `sid`, source date, and raw JSON. The year from `t_school_year.sdate` is mapped so `t_child.sel_year` can populate each child's `schoolYearId`.

### Food Applications
Legacy `t_food_apply` rows restore the "food for all" class/date meal templates used to prefill daily reports. They are kept as `FoodApplication` rows with class, triggering child, breakfast/lunch food IDs, meal times, dessert text/time, creator, active flag, and the complete legacy row.

### Payment Reminders
Legacy `newpayment` rows are scheduled payment reminders/requests, not duplicate paid transactions. They become `PaymentReminder` rows linked to the migrated payment and child when mappings exist, preserving category, amount, currency, due date, month, sent flag, and source row JSON.

### Date Handling
Old DB stores dates as varchar. The migration handles multiple formats: `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, empty strings, and `0000-00-00`.

### Medical Forms
The 6 old form tables are consolidated into a single `MedicalForm` model. Form-specific fields are stored as JSON in the `data` column. The `t_med_forms_info` detail rows become `MedicalFormEntry` records.

### Assessments
The seven legacy assessment tables are consolidated into `Assessment`. Answer keys (`m*`, `c*`, `l*`, `s*`, `d*`) stay as flat JSON keys so the modern assessment editor can reopen the migrated report. Legacy `new_assessment` rows are preserved as markers on the matching assessment, or as a stub assessment when the notification marker has no matching report row.

Legacy `t_assessment_dates.assessment_date` stores age thresholds in days, not absolute calendar dates. Those values are migrated to `AssessmentScheduleRule`; the modern `AssessmentDate` table remains reserved for explicit scheduled calendar dates.

### Alarms And Notifications
Legacy alarm content rows are restored into `Alarm` with source database/table/category provenance and the complete source row preserved in `legacyData`. Legacy delivery/read rows from `custom_notifications_*` are restored into `NotificationReceipt` so "seen" state and recipient ids remain auditable even when the modern notification UI reads from `Alarm`. Mobile push tokens retain their legacy active flag on `PushToken.isActive` and source provenance in `legacyData`.

## Troubleshooting

- **Connection refused**: Ensure both MySQL and PostgreSQL are running and accessible
- **Foreign key errors**: Run steps in order. Use `--from=N` to resume from a specific step
- **Duplicate key**: The scripts are idempotent — duplicates are safely skipped
- **Missing mappings**: Check the error logs. Usually means a dependency step wasn't run or a referenced record was deleted/inactive
