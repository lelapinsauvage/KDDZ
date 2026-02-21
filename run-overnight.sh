#!/bin/bash
#
# Garderie — Overnight Autonomous Build Script
# Runs Claude Code headless through Phases 2.5 → 15
#
# Usage:
#   chmod +x run-overnight.sh
#   ./run-overnight.sh 2>&1 | tee overnight-full.log
#
# To resume from a specific step, set START_STEP:
#   START_STEP=5 ./run-overnight.sh 2>&1 | tee overnight-resumed.log

set -euo pipefail

# Allow running from within a Claude Code session
unset CLAUDECODE 2>/dev/null || true
export -n CLAUDECODE 2>/dev/null || true

PROJECT="/Users/karimsaab/Desktop/garderie"
PLAN="/Users/karimsaab/Desktop/Garderie-old-backup/PLAN.md"
LOG_DIR="$PROJECT/overnight-logs"
mkdir -p "$LOG_DIR"

START_STEP="${START_STEP:-1}"
STEP=0

timestamp() { date "+%Y-%m-%d %H:%M:%S"; }

commit_phase() {
  local phase_name="$1"
  echo "[$(timestamp)] Committing: $phase_name"
  cd "$PROJECT"
  git add -A
  git diff --cached --quiet && { echo "[$(timestamp)] Nothing to commit for $phase_name"; return 0; }
  git commit -m "$(cat <<EOF
$phase_name

Automated overnight build — $(date "+%Y-%m-%d %H:%M")

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
  )" || echo "[$(timestamp)] Commit failed for $phase_name"
  echo "[$(timestamp)] Committed: $phase_name"
}

run_step() {
  STEP=$((STEP + 1))
  local description="$1"
  local prompt="$2"
  local log_file="$LOG_DIR/step-$(printf '%02d' $STEP)-$(echo "$description" | tr ' ' '-' | tr '[:upper:]' '[:lower:]').log"

  if [ "$STEP" -lt "$START_STEP" ]; then
    echo "[$(timestamp)] SKIP Step $STEP: $description"
    return 0
  fi

  echo ""
  echo "=============================================="
  echo "[$(timestamp)] STEP $STEP: $description"
  echo "=============================================="

  if env -u CLAUDECODE claude -p "$prompt" \
    --dangerously-skip-permissions \
    --verbose \
    > "$log_file" 2>&1; then
    echo "[$(timestamp)] DONE Step $STEP (success)"
  else
    echo "[$(timestamp)] DONE Step $STEP (exited with code $?, check log)"
  fi

  echo "  Log: $log_file"
  echo "  Size: $(wc -c < "$log_file") bytes"
}

# Context preamble included in every prompt
CTX="You are working on the Garderie daycare management app.
Project: $PROJECT
Plan doc: $PLAN
Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui, Prisma 7, PostgreSQL, Auth.js v5, pnpm.
Dev server: pnpm exec next dev --port 3333 (from $PROJECT)
IMPORTANT: Read PLAN.md and existing code/patterns before writing. Follow existing conventions (server actions in src/lib/actions, columns files for tables, page-client components for client interactivity, PageHeader for breadcrumbs, DataTable from src/components/shared/data-table.tsx). Always use the old PHP app at /Users/karimsaab/Desktop/Garderie-old-backup as reference for functionality and UI matching.
After implementing, run 'cd $PROJECT && npx tsc --noEmit' to verify no TypeScript errors. Fix any errors before finishing."

echo "[$(timestamp)] Starting overnight build from step $START_STEP"
echo "Logs will be in: $LOG_DIR"
echo ""

###############################################################################
# PHASE 2 REMAINING — Dashboard filter tabs
###############################################################################

run_step "Phase 2 - Dashboard branch/year filter tabs" "$CTX

TASK: Complete Phase 2 of the Garderie rebuild — add branch and school year filter tabs to the dashboard.

Read the dashboard page at src/app/(app)/dashboard/page.tsx. It currently shows stats and charts for ALL branches and the current school year.

Add filter controls at the top of the dashboard (below PageHeader) that let the user:
1. Filter by branch (dropdown or tabs showing all active branches + 'All Branches' option)
2. Filter by school year (dropdown showing all school years, defaulting to the active one)

When a filter is selected, all 13 stat cards and 3 charts should reflect only the filtered data. Use URL search params (e.g., ?branch=xxx&year=xxx) so the page remains a server component. Add a client component for the filter UI that updates the URL params.

Look at the existing Prisma schema for Branch and SchoolYear models. Most queries already filter by isActive — add branchId and schoolYearId filtering where applicable."

commit_phase "Phase 2: Dashboard — branch/year filter tabs"

###############################################################################
# PHASE 3 — Children Module (broken into sub-tasks)
###############################################################################

run_step "Phase 3a - Children listing with real data" "$CTX

TASK: Phase 3a — Wire the children listing page to real data with full DataTable functionality.

The page exists at src/app/(app)/children/page.tsx and components at src/components/children/. There's already a children-columns.tsx and children-page-client.tsx.

1. Read the existing code first to understand what's already built.
2. Read the old PHP app at /Users/karimsaab/Desktop/Garderie-old-backup/children.php for reference on what columns and features the table should have.
3. The children listing should show: photo thumbnail, name (first+last), class, gender, DOB/age, branch, status, and action buttons (view/edit/delete).
4. Wire to the getChildren server action in src/lib/actions/children.ts.
5. Implement server-side search, sort, filter (by class, branch, gender, status), and pagination using the DataTable component.
6. The drafts page at /children/drafts should show only draft children (isDraft=true).
7. Add a 'New Child' button linking to /children/new.

Make sure the DataTable follows the existing pattern in src/components/shared/data-table.tsx."

run_step "Phase 3b - Child enrollment form" "$CTX

TASK: Phase 3b — Build/complete the child enrollment form (the big one).

Read the existing child-form.tsx at src/components/children/child-form.tsx (1335 lines) and the page at src/app/(app)/children/[id]/page.tsx.

1. First read what's already built to understand the current state.
2. Read the old PHP form at /Users/karimsaab/Desktop/Garderie-old-backup/Child_Details.php for the complete field list.
3. The form needs these sections (collapsible panels):
   - Basic Info: first name, last name (EN+AR), DOB, gender, nationality, blood type, allergies, photo upload, religion, ID number
   - Guardian Info: mother details, father details (name, phone, email, occupation, employer, ID), emergency contacts
   - Relatives/authorized persons (dynamic list)
   - Enrollment: branch, class, school year, enrollment date, status
   - Care Preferences: bus service, diaper, milk type/portions/times, sleep schedule, special needs notes
   - Accounting entries (dynamic line items: description, amount, date, status)
   - Attachments section
4. Use React Hook Form + Zod validation.
5. Support both create (/children/new) and edit (/children/[id]) modes.
6. Implement draft save functionality (save with isDraft=true).
7. Create the server action for saving if it doesn't exist in src/lib/actions/children.ts.

This is the most complex form in the app — take your time and get it right."

run_step "Phase 3c - Child sub-pages" "$CTX

TASK: Phase 3c — Build all child sub-pages (dashboard, attendance, absence, accidents, accounting, calls, report).

These pages exist as stubs at src/app/(app)/children/[id]/. Read each one and the corresponding old PHP pages for reference.

1. /children/[id]/dashboard — Per-child overview: photo, basic info summary, recent daily reports, attendance stats, upcoming vaccinations, account balance. Read /Users/karimsaab/Desktop/Garderie-old-backup/child_dashboard.php.

2. /children/[id]/attendance — Attendance history table (DataTable) showing daily reports for this child. Filterable by date range. Read child_attend_det.php.

3. /children/[id]/absence — Absence records table for this child. Read child_absence.php.

4. /children/[id]/accidents — Accident reports table for this child. Read child_accident.php.

5. /children/[id]/accounting — Financial records for this child (payments, invoices). Read child_accounting.php.

6. /children/[id]/calls — Call/communication log for this child. Read child_calls.php.

7. /children/[id]/report — Summary report view for this child. Read child_report.php.

Each sub-page should:
- Use PageHeader with breadcrumbs (Home > Children > [Child Name] > [Section])
- Fetch real data from Prisma via server actions
- Use the DataTable component where showing tabular data
- Include a sidebar or tab navigation between the child sub-pages"

commit_phase "Phase 3: Children module — listings, enrollment form, sub-pages"

###############################################################################
# PHASE 4 — Employees Module
###############################################################################

run_step "Phase 4a - Employee listing pages" "$CTX

TASK: Phase 4a — Build employee listing pages (teachers, nurses, doctors, managers).

Pages exist as stubs at src/app/(app)/employees/teachers/page.tsx etc (15 lines each).

1. Read the existing stubs and the old PHP: teachers.php, nurses.php, doctors.php, managers.php in /Users/karimsaab/Desktop/Garderie-old-backup/.
2. Read the Prisma schema for Teacher, Nurse, Doctor, Manager models.
3. Read src/lib/actions/employees.ts for existing server actions.

For each employee type, build:
- A DataTable listing with columns: photo, name, phone, email, branch, specialization (for doctors), status, actions
- Search, sort, filter, pagination
- A link to the detail page (/employees/teachers/[id] etc)
- A 'New' button

Create the detail/form pages too:
- /employees/teachers/[id]/page.tsx — Teacher profile form (personal info, address, qualifications, attachments)
- Same pattern for nurses, doctors, managers
- Use React Hook Form + Zod
- Reference the old PHP detail pages (Teacher_Details.php etc)"

run_step "Phase 4b - Employee calendar and attendance" "$CTX

TASK: Phase 4b — Build employee calendar, attendance upload, and attendance logs pages.

1. /employees/calendar — Teacher scheduling calendar. Read /Users/karimsaab/Desktop/Garderie-old-backup/calendar.php. Show a monthly calendar view with teacher assignments per class per day. Allow drag-and-drop or click-to-assign.

2. /employees/attendance — Bulk attendance upload. Read /Users/karimsaab/Desktop/Garderie-old-backup/attendance.php. Allow uploading attendance data (CSV or manual entry) for a date range. Show a table of teachers with present/absent/late checkboxes.

3. /employees/attendance-logs — View punch/attendance logs. Read /Users/karimsaab/Desktop/Garderie-old-backup/PA_logs.php. DataTable showing time-in/time-out records with filters for date range and employee.

Read the Prisma schema for TeacherAttendance model and src/lib/actions/employees.ts. Create server actions as needed."

commit_phase "Phase 4: Employees module — listings, forms, calendar, attendance"

###############################################################################
# PHASE 5 — Daily Reports
###############################################################################

run_step "Phase 5 - Daily Reports module" "$CTX

TASK: Phase 5 — Complete the Daily Reports module.

Read existing code at src/app/(app)/daily-reports/ and src/components/daily-reports/. Also read src/lib/actions/daily-reports.ts.

1. Daily reports listing (page.tsx exists) — wire to real data with DataTable. Columns: date, child name, class, status (draft/submitted), created by, actions. Filter by date, class, status.

2. Draft reports listing (/daily-reports/drafts) — same but filtered to drafts only.

3. Daily report creation form (/daily-reports/new) — THE BIG FORM. Read /Users/karimsaab/Desktop/Garderie-old-backup/dailyreports.php and dailyreportsd.php for reference. The form needs:
   - Child selector (dropdown of active children)
   - Date picker
   - Meals section: breakfast, lunch, dessert (food item from food list, portion size, time)
   - Sleep section: from time, to time
   - Health checklist: diarrhea, urination, stool, cough, runny nose, vomit (checkboxes or toggles)
   - Mood tracker (happy/normal/sad/crying icons)
   - Fever log: dynamic list of (temperature value + time)
   - Milk log: dynamic list of (cc amount + time)
   - Remarks textarea
   - Photo attachments
   - Save as draft or submit

4. Absence reports listing (/absent-reports/page.tsx) — DataTable with columns: date, child, reason, status, actions. Filter by date, class, status.

5. Absence report creation — form with: child selector, date, reason, attachment upload, status (pending/approved/rejected).

6. Draft absence reports (/absent-reports/drafts).

Create all necessary server actions for CRUD operations."

commit_phase "Phase 5: Daily reports — listings, creation form, absence reports"

###############################################################################
# PHASE 6 — Medical Module
###############################################################################

run_step "Phase 6 - Medical module" "$CTX

TASK: Phase 6 — Build the Medical module (5 form types with listings and detail pages).

Read existing stubs at src/app/(app)/medical/ and the old PHP at /Users/karimsaab/Desktop/Garderie-old-backup/Medical_forms*.php and Medical_form*.php. Read the Prisma schema for MedicalForm, MedicalFormInfo, Vaccination models. Read src/lib/actions/medical.ts.

Build these 5 medical form types:

1. /medical/general — General medical info listing (DataTable) + /medical/general/[id] detail form.
   Fields: child selector, doctor name, blood type, allergies, chronic conditions, medications, special needs, emergency contact.

2. /medical/conditions — Health conditions listing + /medical/conditions/[id] detail form.
   Fields: child selector, condition type, description, severity, diagnosis date, treatment plan, doctor notes.

3. /medical/visits — Medical visits listing + /medical/visits/[id] detail form.
   Fields: child selector, visit date, doctor, reason, diagnosis, treatment, follow-up date, notes.

4. /medical/vaccinations — Vaccination records listing + /medical/vaccinations/[id] detail form.
   Fields: child selector, vaccine name, dose number, date given, next due date, administered by, notes. Show color-coded status (green=up-to-date, orange=upcoming, red=overdue).

5. /medical/accidents — Accident reports listing + /medical/accidents/[id] detail form.
   Fields: child selector, date, time, location, description, injury type, first aid given, parent notified, follow-up, witnesses, attachments.

Each listing: DataTable with search, filter by child/class/date, pagination.
Each form: React Hook Form + Zod, create/edit modes, proper server actions.
Add progress indicators (red/orange/green flags) showing form completion status per child."

commit_phase "Phase 6: Medical module — 5 form types, listings, detail pages"

###############################################################################
# PHASE 7 — Financial Module
###############################################################################

run_step "Phase 7 - Financial module" "$CTX

TASK: Phase 7 — Build the Financial/Accounting module.

Read existing code at src/app/(app)/accounting/ and src/lib/actions/payments.ts and accounting.ts. Read old PHP: /Users/karimsaab/Desktop/Garderie-old-backup/accounting.php. Read Prisma schema for Payment and Accounting models.

1. /accounting page — Main financial management view:
   - Summary cards: total revenue, total pending, total overdue, this month's collections
   - DataTable of all payments: child name, amount, date, type (tuition/registration/bus/food/other), status (paid/pending/overdue), payment method, receipt number
   - Filter by branch, class, date range, status, payment type
   - Export to Excel button

2. Payment creation — Modal or page form:
   - Child selector, amount, date, type, method (cash/check/bank transfer), receipt number, notes
   - Server action for creating/updating payments

3. Per-child accounting view (already has a route at /children/[id]/accounting) — show that child's payment history, balance, and upcoming dues.

4. Payment alarms/overdue tracking — query children with overdue payments and display warnings.

Create all necessary server actions in src/lib/actions/payments.ts."

commit_phase "Phase 7: Financial module — payments, accounting, overdue tracking"

###############################################################################
# PHASE 8 — Messages
###############################################################################

run_step "Phase 8 - Messages module" "$CTX

TASK: Phase 8 — Build the Messages & Communication module.

Read existing code at src/app/(app)/messages/ and src/lib/actions/messages.ts. Read old PHP at /Users/karimsaab/Desktop/Garderie-old-backup/alarmsMsg.php, message_portal.php, message_portal_single.php, message_portal_class.php, Msg_list.php. Read Prisma schema for Message, MessageThread models.

1. /messages/inbox — Message inbox (DataTable):
   - Columns: from, subject, date, read/unread status, actions
   - Click to view message thread
   - Mark as read/unread, delete
   - Filter by read status, date range

2. /messages/compose — General message composer:
   - Recipient selector (multi-select: individual parents, by class, by branch, all)
   - Subject, body (rich text or textarea)
   - Attachment upload
   - Send action

3. /messages/compose/direct — Direct message to a single parent:
   - Parent/child selector, subject, body, send

4. /messages/compose/class — Class-wide message:
   - Class selector, subject, body, send to all parents in class

5. /messages/sent — Sent messages listing (DataTable):
   - Columns: to, subject, date, delivery status, actions

6. Message thread view — show conversation history between admin and parent.

Create server actions for send, mark-read, delete, list in src/lib/actions/messages.ts."

commit_phase "Phase 8: Messages — inbox, compose, sent, threading"

###############################################################################
# PHASE 9 — Assessments
###############################################################################

run_step "Phase 9 - Assessments module" "$CTX

TASK: Phase 9 — Build the Assessments module (7 assessment types).

Read existing code at src/app/(app)/assessments/. Read old PHP at /Users/karimsaab/Desktop/Garderie-old-backup/assessment_1.php through assessment_7.php. Read Prisma schema for Assessment, AssessmentDate models.

Build a unified assessment system with 7 types:
1. Each type has specific evaluation criteria (read from old PHP to understand what each assesses)
2. Create /assessments/[type]/page.tsx — listing of assessments for that type (DataTable: child, date, evaluator, score/status, actions)
3. Create /assessments/[type]/[id]/page.tsx — assessment form with:
   - Child selector
   - Date
   - Evaluator name
   - Multi-criteria evaluation (each criterion rated on a scale, with comments)
   - Overall notes
   - Status (draft/completed)
4. Create /assessments/[type]/new/page.tsx — new assessment form

The 7 types should be handled by a single dynamic route /assessments/[type] where type is validated against allowed values.

5. Assessment dates tracking — manage when assessments are due per class/child.
6. Create server actions for CRUD in a new src/lib/actions/assessments.ts if it doesn't exist."

commit_phase "Phase 9: Assessments — 7 types, listings, evaluation forms"

###############################################################################
# PHASE 10 — Calendars & Settings
###############################################################################

run_step "Phase 10a - Food and Holiday calendars" "$CTX

TASK: Phase 10a — Build Food Calendar and Holiday Calendar pages.

Read existing code at src/app/(app)/food/ and src/app/(app)/settings/. Read old PHP at /Users/karimsaab/Desktop/Garderie-old-backup/food.php, food_calendar.php, printFoodCal.php, holiday_calendar.php. Read Prisma schema for Food, FoodCalendar, Holiday models. Read src/lib/actions/food.ts.

1. /food — Food item listing (DataTable): name, category, description, allergens, actions. CRUD for food items.

2. /food/calendar — Monthly food calendar view per branch:
   - Branch selector
   - Month/year navigation
   - Calendar grid showing assigned meals for each day (breakfast, lunch, snack)
   - Click a day to assign food items from the food list
   - Server actions for saving food calendar assignments

3. /food/calendar/print — Printable version of the food calendar (clean layout, no navigation, print-friendly CSS with @media print).

4. /settings/holidays — Holiday calendar management:
   - Calendar view showing holidays
   - DataTable listing all holidays (date, name, type, recurring)
   - Create/edit/delete holidays
   - Distinguish between national holidays and nursery-specific closures

Create server actions as needed."

run_step "Phase 10b - Settings pages" "$CTX

TASK: Phase 10b — Build the remaining Settings & Admin pages.

Read existing code at src/app/(app)/settings/. Read old PHP at /Users/karimsaab/Desktop/Garderie-old-backup/ for: NotifCalendar.php, Zones_Management.php, Areas.php, regions.php, nurseryinfo.php, parent_users.php, parent_user.php, exportdb.php. Read src/lib/actions/settings.ts and parent-users.ts. Read Prisma schema for Region and related models.

1. /settings/events — Events/notification calendar management:
   - Calendar view of upcoming events
   - DataTable of events (date, title, type, target audience, status)
   - Create/edit/delete events

2. /settings/zones — Province (Mouhafaza) management:
   - DataTable of provinces with CRUD

3. /settings/areas — District (Quadaa) management:
   - DataTable of districts, linked to province. CRUD.

4. /settings/regions — Region management:
   - DataTable of regions, linked to district. CRUD.

5. /settings/nursery — Nursery info/settings form:
   - Organization name, logo, address, phone, email, license number, tax ID
   - Operating hours, capacity settings
   - Save button

6. /settings/parent-users — Parent user management:
   - DataTable listing parent accounts (name, email, linked children, status, last login)
   - /settings/parent-users/[id] — detail/edit form for parent user
   - Enable/disable accounts, reset passwords

7. /settings/export — Database export page:
   - Button to export data as SQL dump or CSV
   - Select which tables to export
   - Download link

Create server actions as needed in src/lib/actions/settings.ts and parent-users.ts."

commit_phase "Phase 10: Calendars and settings — food, holidays, zones, parent users"

###############################################################################
# PHASE 11 — Alarms & Notifications
###############################################################################

run_step "Phase 11 - Alarms and Notifications" "$CTX

TASK: Phase 11 — Build the unified Alarms & Notifications system.

Read existing code at src/app/(app)/alarms/ and src/lib/actions/alarms.ts. Read old PHP at /Users/karimsaab/Desktop/Garderie-old-backup/alarms*.php. Read Prisma schema for Alarm, Notification, PushToken models.

Build a unified alarm system replacing 12 separate old pages:

1. /alarms — Main alarms overview page:
   - Summary cards showing count per alarm type
   - Quick links to each alarm type

2. Sub-pages (each as DataTable with appropriate columns and filters):
   - /alarms/birthdays — Upcoming birthdays (next 7/30 days)
   - /alarms/assessments — Overdue or upcoming assessments
   - /alarms/vaccinations — Overdue vaccinations (already partially built in getOverdueVaccinations)
   - /alarms/medical — Medical follow-ups due
   - /alarms/medicine — Medicine reminders
   - /alarms/events — Upcoming events
   - /alarms/insurance — Insurance expiration alerts
   - /alarms/payments — Payment due/overdue alerts
   - /alarms/requests — Pending requests
   - /alarms/contracts — Contract renewal reminders
   - /alarms/others — Miscellaneous alerts

3. Header notification integration:
   - Create notification dropdown components for the header (bell icon with count badge)
   - Show preview of recent notifications grouped by type
   - Mark as read functionality

4. Alarm settings — allow enabling/disabling specific alarm types and setting thresholds (e.g., notify 7 days before birthday).

Create server actions in src/lib/actions/alarms.ts for each alarm type query."

commit_phase "Phase 11: Alarms and notifications — unified alarm system, header dropdowns"

###############################################################################
# PHASE 12 — Parent Portal API
###############################################################################

run_step "Phase 12 - Parent Portal API" "$CTX

TASK: Phase 12 — Build the Parent Portal API (23 REST endpoints).

Read the plan at /Users/karimsaab/Desktop/Garderie-old-backup/PLAN.md for the full endpoint list. Read old PHP web services at /Users/karimsaab/Desktop/Garderie-old-backup/ws/*.php. Read the Prisma schema for ParentUser model.

Build Next.js API routes at src/app/api/parent/:

1. POST /api/parent/login — Parent authentication (email/password → JWT token)
2. GET /api/parent/daily/[childId] — Daily reports for a child
3. GET /api/parent/daily/[childId]/detailed — Detailed daily reports
4. GET /api/parent/absence/[childId] — Absence reports
5. GET /api/parent/messages/[childId] — Messages for a child
6. POST /api/parent/messages — Send a message from parent
7. GET /api/parent/finance/[childId] — Payment records
8. GET /api/parent/calendar/holidays — Holiday calendar
9. GET /api/parent/calendar/food — Food calendar
10. GET /api/parent/alarms/[type] — Various alarm types (birthdays, vaccinations, etc.)
11. POST /api/parent/push-token — Register push notification token
12. GET /api/parent/notifications/[childId] — All notifications for a child

Each endpoint should:
- Validate JWT token from Authorization header
- Verify parent has access to the requested child
- Return JSON matching the old API response shape (read old PHP for format)
- Include proper error handling (401, 403, 404, 500)
- Use Zod for input validation
- Rate limiting with simple in-memory counter (or note where to add it)

Create a shared auth middleware at src/lib/parent-auth.ts for JWT verification."

commit_phase "Phase 12: Parent portal API — 23 REST endpoints, JWT auth"

###############################################################################
# PHASE 13 — PDF & Export
###############################################################################

run_step "Phase 13 - PDF and Export" "$CTX

TASK: Phase 13 — Build PDF generation and data export features.

Read the plan for required PDFs. The stack uses @react-pdf/renderer. Check if it's installed: look at package.json. If not, install it with 'cd $PROJECT && pnpm add @react-pdf/renderer'.

1. Child application form PDF — /api/pdf/child/[id]:
   - Generate a complete child enrollment form as PDF
   - Include all sections: personal info, guardian info, medical info, care preferences
   - Match the old paper form layout

2. Medical forms PDF — /api/pdf/medical/[formType]/[id]:
   - Generate each of the 5 medical form types as PDF
   - Professional layout with nursery letterhead

3. Teacher profile PDF — /api/pdf/employee/[id]:
   - Teacher information summary as PDF

4. Monthly attendance report PDF — /api/pdf/reports/monthly:
   - Query params: month, year, branch, class
   - Table showing each child's daily attendance for the month

5. Food calendar print — already handled by /food/calendar/print page (CSS print styles)

6. Excel export for data tables:
   - Add an export button to major DataTable instances (children, employees, payments, daily reports)
   - Use a library like xlsx or exceljs (check if installed, install if needed)
   - Create a reusable export utility at src/lib/export.ts
   - Server action that queries data and returns CSV/XLSX file

Create API routes at src/app/api/pdf/ using @react-pdf/renderer."

commit_phase "Phase 13: PDF generation and Excel export"

###############################################################################
# PHASE 14 — Data Migration (scripts only, don't run)
###############################################################################

run_step "Phase 14 - Data Migration scripts" "$CTX

TASK: Phase 14 — Create data migration scripts from old MySQL to new PostgreSQL.

DO NOT run these scripts — just create them. The user will run them manually later.

Read the old MySQL database structure by examining the old PHP code at /Users/karimsaab/Desktop/Garderie-old-backup/Data.class.php and the Prisma schema.

Create migration scripts at src/scripts/migration/:

1. migrate-branches.ts — Map t_branch → Branch model
2. migrate-classes.ts — Map t_class → Class model
3. migrate-children.ts — Map t_child + t_child_draft → Child model (handle isDraft flag)
4. migrate-parents.ts — Map t_parents → Parent model
5. migrate-employees.ts — Map t_teacher, t_nurse, t_doctor, t_manager → respective models
6. migrate-daily-reports.ts — Map t_daily_report + sub-tables → DailyReport + related models
7. migrate-medical.ts — Map t_medical_forms + t_form_1..5 → MedicalForm models
8. migrate-payments.ts — Map t_payments → Payment model
9. migrate-messages.ts — Map messaging tables → Message, MessageThread
10. migrate-users.ts — Map login_users → User (rehash MD5 passwords to bcrypt)

Each script should:
- Use mysql2 to connect to old DB and Prisma to write to new DB
- Include field mapping comments (old field → new field)
- Handle data transformation (dates, enums, null values)
- Include a dry-run mode (--dry-run flag)
- Log progress and errors
- Be idempotent (skip already-migrated records)

Create a master script migrate-all.ts that runs them in dependency order.
Also create a README at src/scripts/migration/README.md explaining how to run."

commit_phase "Phase 14: Data migration scripts (MySQL to PostgreSQL)"

###############################################################################
# PHASE 15 — Testing & Polish
###############################################################################

run_step "Phase 15a - TypeScript and lint fixes" "$CTX

TASK: Phase 15a — Fix all TypeScript errors and lint issues across the entire project.

1. Run 'cd $PROJECT && npx tsc --noEmit' and fix ALL TypeScript errors.
2. Run 'cd $PROJECT && pnpm lint' and fix all ESLint warnings/errors.
3. Check for any unused imports, unused variables, or dead code and clean them up.
4. Ensure all server actions have proper return types.
5. Ensure all Zod schemas are complete and match their forms.
6. Check that all pages render without runtime errors by reviewing the code for obvious issues (missing imports, wrong prop types, etc.).

Do NOT add new features — only fix existing issues."

run_step "Phase 15b - Responsive design and polish" "$CTX

TASK: Phase 15b — Responsive design audit and UI polish.

Review all major pages for responsive design:

1. Check that all pages work on mobile (sm:), tablet (md:), and desktop (lg:) breakpoints.
2. Ensure the sidebar collapses properly on mobile.
3. Check that DataTables are horizontally scrollable on small screens.
4. Verify forms are usable on mobile (proper input sizes, spacing).
5. Check that the dashboard cards stack properly on mobile.
6. Ensure all modals/dialogs are mobile-friendly.

Fix any responsive issues you find. Focus on:
- Grid layouts (should go from multi-column to single column on mobile)
- Table containers (add overflow-x-auto where needed)
- Form layouts (full-width inputs on mobile)
- Navigation (sidebar/header mobile behavior)
- Font sizes and spacing on small screens"

run_step "Phase 15c - Security audit" "$CTX

TASK: Phase 15c — Security audit of the entire application.

Review all code for OWASP Top 10 vulnerabilities:

1. SQL Injection — Verify all database queries use Prisma parameterized queries, no raw string concatenation in \$queryRaw.

2. XSS — Check that user input is properly escaped in all rendered output. Verify no dangerouslySetInnerHTML with unsanitized content.

3. Authentication — Verify Auth.js middleware protects all (app) routes. Check that API routes validate sessions/tokens.

4. Authorization — Verify users can only access their own data. Check that parent API endpoints verify parent-child relationships.

5. CSRF — Verify server actions use proper CSRF protection (Next.js handles this by default, but verify).

6. File Upload — If any file upload endpoints exist, verify they validate file types, sizes, and don't allow path traversal.

7. Rate Limiting — Add basic rate limiting to login endpoints and API routes if not present.

8. Sensitive Data — Verify no passwords, API keys, or secrets are logged or exposed in responses. Check .env.local is in .gitignore.

9. Input Validation — Verify all form inputs are validated with Zod on both client and server.

10. Dependency Security — Run 'cd $PROJECT && pnpm audit' and note any vulnerabilities.

Fix any issues found. Create a SECURITY-NOTES.md file documenting what was checked and any remaining concerns."

commit_phase "Phase 15: Testing and polish — TS fixes, responsive design, security audit"

###############################################################################
# DONE
###############################################################################

echo ""
echo "=============================================="
echo "[$(timestamp)] ALL STEPS COMPLETE"
echo "=============================================="
echo ""
echo "Logs are in: $LOG_DIR"
echo ""
echo "To review:"
echo "  ls -la $LOG_DIR"
echo "  cat $LOG_DIR/step-01-*.log | head -100"
echo ""
echo "To check for TypeScript errors:"
echo "  cd $PROJECT && npx tsc --noEmit"
