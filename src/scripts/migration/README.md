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
# Run only up to step 3 (branches, classes, children)
pnpm tsx src/scripts/migration/migrate-all.ts --step=3

# Resume from step 6 (assumes steps 1-5 already ran)
pnpm tsx src/scripts/migration/migrate-all.ts --from=6
```

### Run individual scripts

Each script can be run standalone:

```bash
pnpm tsx src/scripts/migration/migrate-branches.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-classes.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-children.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-parents.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-employees.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-users.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-daily-reports.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-absences.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-medical.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-payments.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-food-calendar.ts [--dry-run]
pnpm tsx src/scripts/migration/migrate-messages.ts [--dry-run]
```

> **Note:** Individual scripts require their dependency steps to have run first.

## Migration Order (Dependencies)

```
1. Branches       ← needs Organization (auto-created)
2. Classes        ← needs Branches
3. Children       ← needs Branches, Classes
4. Parents        ← needs Children
5. Employees      ← needs Branches
6. Users          ← needs Branches, Children/Parents
7. Daily Reports  ← needs Children
8. Absences       ← needs Children, Users
9. Medical Forms  ← needs Children
10. Payments      ← needs Children
11. Food/Calendar ← needs Branches, Organization
12. Messages      ← needs Users
```

## Table Mappings

| Old MySQL Table(s) | New PostgreSQL Model(s) |
|---|---|
| `t_branch` | Branch |
| `t_class` | Class |
| `t_child`, `t_child_draft` | Child (isDraft flag) |
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
| `t_daily_report` | DailyReport |
| `t_daily_fever` | DailyReportFever |
| `t_daily_milk` | DailyReportMilk |
| `t_daily_attachments` | DailyReportAttachment |
| `t_absent_report` | AbsenceReport |
| `t_absent_attachments` | AbsenceAttachment |
| `t_form_1` | MedicalForm (GENERAL) |
| `t_form_2` | MedicalForm (CONDITIONS) |
| `t_form_3` | MedicalForm (VISITS) |
| `t_form_4` | MedicalForm (VACCINATIONS) + Vaccination |
| `t_form_5` | MedicalForm (ACCIDENTS) |
| `t_form_6` | MedicalForm (GENERAL) |
| `t_med_forms_info` | MedicalFormEntry |
| `t_payments` | Payment |
| `newpayment` | Payment follow-up mapping needed |
| `t_accounting` | AccountingEntry |
| `t_food` | Food |
| `t_food_calendar` | FoodCalendar |
| `t_holiday` | Holiday |
| `t_alarms_msg` | MessageThread, Message |
| `custom_notifications_msg` | Message (per-recipient) |

## Key Design Decisions

### ID Mapping
Old MySQL uses auto-increment integers. New PostgreSQL uses UUIDs. The migration maintains an in-memory mapping table (old int → new UUID) for FK resolution.

### Password Handling
Old passwords are MD5 hashes. They are rehashed as `bcrypt(md5:ORIGINAL_HASH)`. The app should:
1. On login: hash user input with MD5, prepend `md5:`, then verify with bcrypt
2. After successful login: rehash directly with bcrypt for future logins

### Idempotency
All scripts check for existing records before inserting, so they can be re-run safely. Already-migrated records are skipped.

### Soft Deletes
Old DB uses `active = 0` for soft deletes. Only active records (active = 1) are migrated. Deleted records (deleted = 1) are also excluded.

### Date Handling
Old DB stores dates as varchar. The migration handles multiple formats: `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, empty strings, and `0000-00-00`.

### Medical Forms
The 6 old form tables are consolidated into a single `MedicalForm` model. Form-specific fields are stored as JSON in the `data` column. The `t_med_forms_info` detail rows become `MedicalFormEntry` records.

### Assessments
Assessment data (t_assessment_1..7) is not migrated in this batch — assessments use the new Assessment model with JSON `data` field and can be migrated separately if needed.

## Troubleshooting

- **Connection refused**: Ensure both MySQL and PostgreSQL are running and accessible
- **Foreign key errors**: Run steps in order. Use `--from=N` to resume from a specific step
- **Duplicate key**: The scripts are idempotent — duplicates are safely skipped
- **Missing mappings**: Check the error logs. Usually means a dependency step wasn't run or a referenced record was deleted/inactive
