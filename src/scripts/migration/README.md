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
pnpm tsx src/scripts/migration/migrate-classes.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-children.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-parents.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-employees.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-users.ts [--dry-run]
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
3. Classes        ← needs Branches
4. Children       ← needs Branches, Classes, Locations
5. Parents        ← needs Children
6. Employees      ← needs Branches
7. Users          ← needs Branches, Children/Parents
8. Login Audit    ← needs Users/Parent Users when resolvable
9. Legacy Settings ← optional legacy config tables
10. Daily Reports  ← needs Children
11. Absences       ← needs Children, Users
12. Calls          ← needs Children, Employees, Users
13. Assessments    ← needs Children, Classes, Employees/Users, Organization
14. Medical Forms  ← needs Children
15. Payments       ← needs Children
16. Food/Calendar  ← needs Branches, Organization
17. Alarms         ← needs Children, Users, Parent Users, Teachers
18. Messages       ← needs Users
```

## Table Mappings

| Old MySQL Table(s) | New PostgreSQL Model(s) |
|---|---|
| `t_branch` | Branch |
| `t_mouhafaza` | Province |
| `t_quadaa` | District |
| `t_region` | Region |
| `t_class` | Class |
| `t_child`, `t_child_draft` | Child (isDraft flag) |
| `t_child_h` | ChildHistory |
| `t_address` | ChildAddress |
| `t_authorized` | Relative (isAuthorized=true) |
| `t_relatives` | Relative |
| `t_parents` | Parent |
| `t_teacher`, `t_teacher_address`, `t_teacher_attachments` | Teacher, TeacherAddress, TeacherAttachment |
| `t_nurse`, `t_nurse_attachments` | Nurse, NurseAttachment |
| `t_doctor` | Doctor, DoctorAddress |
| `t_manager`, `t_manager_address` | Manager, ManagerAddress |
| `login_users` | User |
| `parent_login_users` | ParentUser |
| `login_timestamps`, `login_timestamps_man`, `parent_login_timestamps` | LegacyLoginTimestamp |
| `login_settings`, `parent_login_settings`, `login_settings_man`, `t_settings`, `t_notification_setting` | LegacySetting |
| `t_daily_report` | DailyReport |
| `t_daily_fever` | DailyReportFever |
| `t_daily_milk` | DailyReportMilk |
| `t_daily_attachments` | DailyReportAttachment |
| `t_absent_report` | AbsenceReport |
| `t_absent_attachments` | AbsenceAttachment |
| `callcauses` | CallCause |
| `t_form_6` | CallLog and MedicalForm (GENERAL) |
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
| `t_payments` | Payment |
| `newpayment` | PaymentReminder |
| `t_accounting` | AccountingEntry |
| `t_food` | Food |
| `t_food_calendar` | FoodCalendar |
| `t_food_apply` | FoodApplication |
| `t_holiday` | Holiday |
| `t_alarms`, `t_alarms_*` (except `t_alarms_msg`) | Alarm |
| `custom_notifications_*` delivery tables | NotificationReceipt |
| `notifications_tokens` | PushToken |
| `t_notifications_log` | LegacyNotificationLog |
| `t_alarms_msg` | MessageThread, Message |
| `custom_notifications_msg` | Message (per-recipient) |

## Key Design Decisions

### ID Mapping
Old MySQL uses auto-increment integers. New PostgreSQL uses UUIDs. The migration maintains an in-memory mapping table (old int → new UUID) for FK resolution.

### Password Handling
Old passwords are MD5 hashes. They are rehashed as `bcrypt(md5:ORIGINAL_HASH)`. The app should:
1. On login: hash user input with MD5, prepend `md5:`, then verify with bcrypt
2. After successful login: rehash directly with bcrypt for future logins

### Login Audit
Legacy timestamp tables are historical login audit trails, not active sessions. They are restored into `LegacyLoginTimestamp` with source database/table/id, legacy user id, IP address, timestamp, and the resolved modern `User` or `ParentUser` UUID when the user mapping exists.

### Legacy Settings
Legacy PHP auth, nursery, and notification setting tables are preserved in `LegacySetting` with their source database/table/id, scope, key, exact value, optional description, and raw JSON. They are not written into active branch `Settings`.

### Idempotency
All scripts check for existing records before inserting, so they can be re-run safely. Already-migrated records are skipped.

### Soft Deletes
Old DB uses `active = 0` for soft deletes. Only active records (active = 1) are migrated. Deleted records (deleted = 1) are also excluded.

### Locations
Legacy Lebanon location tables are migrated into the modern Province → District → Region hierarchy. Old `t_mouhafaza.m_id`, `t_quadaa.qid`, and `t_region.rid` values are mapped to UUIDs for downstream address restoration; inactive rows and orphan districts/regions are skipped and counted in logs.

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
Legacy alarm content rows are restored into `Alarm` with the complete source row preserved in `legacyData`. Legacy delivery/read rows from `custom_notifications_*` are restored into `NotificationReceipt` so "seen" state and recipient ids remain auditable even when the modern notification UI reads from `Alarm`. Mobile push tokens retain their legacy active flag on `PushToken.isActive`.

## Troubleshooting

- **Connection refused**: Ensure both MySQL and PostgreSQL are running and accessible
- **Foreign key errors**: Run steps in order. Use `--from=N` to resume from a specific step
- **Duplicate key**: The scripts are idempotent — duplicates are safely skipped
- **Missing mappings**: Check the error logs. Usually means a dependency step wasn't run or a referenced record was deleted/inactive
