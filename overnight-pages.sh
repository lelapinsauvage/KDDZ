#!/bin/bash
# Overnight Page Restructure — Match old PHP app EXACTLY
# Each phase: audit existing → compare with old → fix gaps → verify → commit
# NO set -e — we want to continue on failure
unset CLAUDECODE
cd /Users/karimsaab/Desktop/garderie
LOG_FILE="./overnight-pages-log.txt"
BRANCH="main"
SPEC="overnight-pages-spec.md"
OLD_APP="/Users/karimsaab/Desktop/Garderie-old-backup/Front/templates/admin"

echo "=== OVERNIGHT PAGES START — $(date) ===" > "$LOG_FILE"

run_phase() {
  local name="$1"
  local prompt="$2"
  echo "" >> "$LOG_FILE"
  echo "=== $name — $(date) ===" >> "$LOG_FILE"
  claude --dangerously-skip-permissions -p "$prompt" >> "$LOG_FILE" 2>&1
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "WARNING: $name FAILED (exit $exit_code) — continuing..." >> "$LOG_FILE"
  fi
  git push origin $BRANCH >> "$LOG_FILE" 2>&1
  echo "=== $name COMPLETE — $(date) ===" >> "$LOG_FILE"
}

# ─────────────────────────────────────────────────────────────
# PHASE 1: Dashboard — match old layout order exactly
# ─────────────────────────────────────────────────────────────
run_phase "Phase 1: Dashboard layout" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/index.php COMPLETELY. Identify every section in order: stat cards, charts, their groupings, and the exact visual order top to bottom.
Also read $OLD_APP/js/index.js to understand what data populates each card/chart.

STEP 2 — READ NEW APP:
Read src/app/(app)/dashboard/page.tsx COMPLETELY.
Read src/components/dashboard/demographics-section.tsx COMPLETELY.
Read src/components/skeletons/dashboard-skeleton.tsx COMPLETELY.

STEP 3 — COMPARE:
List every section in the OLD dashboard (top to bottom) and map it to the NEW dashboard. Identify:
- Sections in wrong order
- Sections missing entirely
- Extra sections in new that old didn't have (keep these, they're improvements)

The old app's exact order was:
1. Greeting/header with date range
2. Row: Branches, Classes, Children stat cards
3. Row: Charts (Attendance pie, Children Per Class pie, Gender Distribution pie)
4. Row: Attendance, Absence, Missing Reports, Missing Absence Reports
5. Row: Accounting, Accidents, Calls
6. Row: Medical Published, Medical Missing, Medical Drafts
7. Row: Assessments Published, Assessments Missing, Assessments Drafts

STEP 4 — FIX:
Reorder the sections in page.tsx to match the old order exactly. Move DemographicsSection to after the Overview row. Update dashboard-skeleton.tsx to match.

STEP 5 — VERIFY:
Run: npx tsc --noEmit
Re-read the modified page.tsx to confirm the section order is correct.

Commit with message: 'dashboard: reorder sections to match old app layout'
"

# ─────────────────────────────────────────────────────────────
# PHASE 2: Children listing — exact column/filter/UX match
# ─────────────────────────────────────────────────────────────
run_phase "Phase 2: Children listing" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP THOROUGHLY:
Read $OLD_APP/children.php COMPLETELY (all ~800 lines). Document:
- Every table column in EXACT order (look at <th> tags)
- Every filter input (look at the filter row beneath headers — text inputs, dropdowns, date pickers)
- Every action button (view, edit, delete, bulk actions)
- Every modal (create child, edit employees, medical form creation)
- Pagination setup
- Export/print buttons
Also read $OLD_APP/js/children.js to see DataTable column config (ArrayColumns), AJAX endpoints, and action handlers.

STEP 2 — READ NEW APP THOROUGHLY:
Read src/components/children/children-page-client.tsx COMPLETELY.
Read src/components/children/children-columns.tsx COMPLETELY.
Read src/app/(app)/children/page.tsx to see what data is fetched.

STEP 3 — COMPARE AND LIST EVERY GAP:
Create a checklist comparing old vs new:
- Column names and order (old had: Checkbox, ID, Image, F Name, L Name, DOB, Branch, Class, Status/Nationality, Gender, Date, Action)
- Filter types (old had per-column filters in header row: text inputs, branch dropdown, date range pickers)
- Actions (old had view/edit/delete per row + bulk actions)
- Modals (old had create child modal, bulk edit modal)
- Pagination and page size options

STEP 4 — FIX EVERY GAP:
In children-columns.tsx:
- Split 'Full Name' into separate 'First Name' and 'Last Name' columns
- Add 'Nationality' column (show child.nationality or dash)
- Add 'Created Date' column (format as dd/MM/yyyy)
- Reorder columns to match old: Avatar → First Name → Last Name → DOB → Branch → Class → Nationality → Gender → Created Date → Status → Actions
- Ensure each column that was sortable in old is sortable in new

In children-page-client.tsx:
- Add any missing filter dropdowns (nationality if needed)
- Ensure branch/class/gender/status filters match old structure
- Keep card view toggle (it's an improvement)

In page.tsx server component:
- Ensure getChildren() query includes nationality and createdAt in the select

STEP 5 — VERIFY:
Run: npx tsc --noEmit
Re-read children-columns.tsx and confirm the column order matches old app.
Re-read children-page-client.tsx and confirm filters are present.

Commit with message: 'children: match listing columns and filters to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 3: Daily Reports listing — exact match
# ─────────────────────────────────────────────────────────────
run_phase "Phase 3: Daily reports listing" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/dailyreports.php COMPLETELY. Document every column, filter, and action.
Read $OLD_APP/js/dailyreports.js to see column config and AJAX setup.

STEP 2 — READ NEW APP:
Find and read ALL daily report listing files:
- src/app/(app)/daily-reports/page.tsx
- Search src/components/daily-reports/ for *client*.tsx and *columns*.tsx files
- Read every file you find

STEP 3 — COMPARE:
Old columns were: Image, F Name, L Name, Status, Branch, Class, Report Date, Created Date, Action
Old filters: Name, Status dropdown, Branch dropdown, Class dropdown, Date range
Map each old element to what exists in new. List what's missing and what's in wrong order.

STEP 4 — FIX:
Match the listing exactly. Ensure:
- Columns are in the correct order matching old app
- Status shows with proper labels (submitted/draft/missing/incomplete)
- Report Date and Created Date are SEPARATE columns
- All filters from old app exist (name search, status dropdown, branch, class, date range)
- Actions column has view/edit/delete

STEP 5 — VERIFY:
Run: npx tsc --noEmit
Re-read the columns file to verify order matches old app.

Commit with message: 'daily-reports: match listing structure to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 4: Absent Reports listing — exact match
# ─────────────────────────────────────────────────────────────
run_phase "Phase 4: Absent reports listing" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/absentreports.php COMPLETELY.
Read $OLD_APP/js/absentreports.js for column config.

STEP 2 — READ NEW APP:
Find and read ALL absent report listing files:
- src/app/(app)/absent-reports/page.tsx
- Search for absent report client/columns components in src/components/ and src/app/(app)/absent-reports/

STEP 3 — COMPARE:
Old columns: Image, F Name, L Name, Status, Branch, Class, Report Date, Created Date, Action
Old filters: Name, Status, Branch, Class, Date range
Identical structure to daily reports. Map every element.

STEP 4 — FIX:
Match exactly. Same column structure as daily reports listing.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'absent-reports: match listing structure to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 5: Medical General + Suffering + Visits listings
# ─────────────────────────────────────────────────────────────
run_phase "Phase 5: Medical listings" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/Medical_forms1.php COMPLETELY (General Info listing).
Read $OLD_APP/Medical_forms2.php COMPLETELY (Suffering listing).
Read $OLD_APP/Medical_forms3.php COMPLETELY (Visits listing).
All three share the same column structure. Note the exact columns from <th> tags.

STEP 2 — READ NEW APP:
Read src/app/(app)/medical/general/page.tsx
Read src/app/(app)/medical/suffering/page.tsx
Read src/app/(app)/medical/visits/page.tsx
Find and read their client/columns components in src/components/medical/

STEP 3 — COMPARE:
Old columns for all three: Image, F Name, L Name, DOB, Branch, Class, Year, Gender, Created Date, Action
Old filters: Name, DOB, Branch, Class, Year, Gender, Date range
Map each column/filter to what exists in each new page.

STEP 4 — FIX:
For each of the three pages:
- Match column order exactly
- Add 'Year' column if missing (scholastic year, e.g. '2024-2025')
- Ensure all filters present
- Ensure actions (view/edit/delete) work

STEP 5 — VERIFY:
Run: npx tsc --noEmit
Re-read each page's columns to verify.

Commit with message: 'medical: match general/suffering/visits listings to old PHP'
"

# ─────────────────────────────────────────────────────────────
# PHASE 6: Vaccinations + Accidents listings
# ─────────────────────────────────────────────────────────────
run_phase "Phase 6: Vaccinations + Accidents" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/Medical_forms4.php COMPLETELY (Vaccinations listing).
Read $OLD_APP/Medical_forms5.php COMPLETELY (Accidents listing).
Note the DIFFERENT column structures — accidents has Cause, Place, First Aid instead of DOB/Nationality.

STEP 2 — READ NEW APP:
Read src/app/(app)/medical/vaccinations/page.tsx and its components.
Read src/app/(app)/medical/accidents/page.tsx and its components.
Find column definitions for both.

STEP 3 — COMPARE:
Vaccination old columns: Image, F Name, L Name, DOB, Branch, Class, Nationality, Gender, Date, Action
Accidents old columns: Image, F Name, L Name, Cause, Branch, Class, Place, First Aid, Date, Action
Map each to new. These are DIFFERENT from each other — don't use the same columns.

STEP 4 — FIX:
Vaccinations: match old column order, add Nationality if missing.
Accidents: ensure Cause (accidentCause), Place (location), First Aid (firstAidGiven) are visible columns in the table. These are the KEY differentiators for accidents.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'medical: match vaccinations/accidents listings to old PHP'
"

# ─────────────────────────────────────────────────────────────
# PHASE 7: Employee listings (all 4 types)
# ─────────────────────────────────────────────────────────────
run_phase "Phase 7: Employee listings" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/teachers.php COMPLETELY. Document every column, filter, and action.
Read $OLD_APP/js/teachers.js for column config (ArrayColumns).
Briefly scan $OLD_APP/nurses.php, doctors.php, managers.php to confirm they share the same structure.

STEP 2 — READ NEW APP:
Read src/components/employees/employee-listing-client.tsx COMPLETELY.
Read src/components/employees/employee-columns.tsx COMPLETELY.
Read src/app/(app)/employees/teachers/page.tsx to see data fetching.

STEP 3 — COMPARE:
Old columns (same for all 4): Image, F Name, L Name, DOB, Branch, Mobile, Nationality, Gender, Created Date, Action
Old filters: Name, DOB, Branch dropdown, Mobile, Nationality, Gender, Date range
New columns: Avatar, Full Name, Email, Phone, Branch, Specialization, Hire Date, Status, Actions
Map every difference.

STEP 4 — FIX:
In employee-columns.tsx:
- Split Full Name → First Name + Last Name
- Replace Email with DOB
- Replace Phone with Mobile
- Add Nationality column
- Add Gender column
- Replace Hire Date with Created Date
- Keep Status (improvement over old)
- Remove Specialization from main listing (keep in detail)
- Reorder to: Avatar → First Name → Last Name → DOB → Branch → Mobile → Nationality → Gender → Created Date → Status → Actions

In employee-listing-client.tsx:
- Add filter dropdowns: Branch, Gender (if missing)
- Ensure search searches first/last name

In the page.tsx server component:
- Ensure data query includes dateOfBirth, nationality, gender, mobile, createdAt

STEP 5 — VERIFY:
Run: npx tsc --noEmit
Verify all 4 employee pages render: check src/app/(app)/employees/teachers/page.tsx, nurses/page.tsx, doctors/page.tsx, managers/page.tsx all use the shared components.

Commit with message: 'employees: match all listing columns to old PHP (all 4 types)'
"

# ─────────────────────────────────────────────────────────────
# PHASE 8: Classes listing — add table view + match columns
# ─────────────────────────────────────────────────────────────
run_phase "Phase 8: Classes listing" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/classes.php COMPLETELY. Document columns, filters, actions.
Read $OLD_APP/js/classes.js for column config.

STEP 2 — READ NEW APP:
Read src/components/classes/classes-client.tsx COMPLETELY.
Read src/app/(app)/classes/page.tsx.

STEP 3 — COMPARE:
Old had a DataTable with columns: Checkbox, ID, Image, Class Name, Language, Max Students, Branch, Date, Action
Old filters: ID, Name, Language, Max Students, Branch dropdown, Date range
New uses card grid with no table view and limited filtering (branch only).

STEP 4 — FIX:
Add a table/card view toggle to classes-client.tsx:
- Add two small icon buttons (grid icon / table icon) to switch views
- Default to card view (existing)
- Table view shows columns matching old: Class Name, Language, Max Students, Branch, Student Count, Status, Created Date, Actions
- Add a search input that filters by class name
- Keep the existing card grid as-is for card view
- Use the same toggle pattern as children-page-client.tsx if it has one

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'classes: add table view with columns matching old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 9: Food listing + calendar
# ─────────────────────────────────────────────────────────────
run_phase "Phase 9: Food listing + calendar" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/food.php COMPLETELY.
Read $OLD_APP/food_calendar.php COMPLETELY.
Read $OLD_APP/printFoodCal.php briefly.

STEP 2 — READ NEW APP:
Read src/components/food/food-listing-client.tsx COMPLETELY.
Read src/app/(app)/food/page.tsx.
Read src/app/(app)/food/calendar/page.tsx and its components.

STEP 3 — COMPARE:
Food listing old columns: Type, Name, Active, Created Date, Action
Food calendar old: FullCalendar with per-branch filtering, meal assignment modal (Breakfast, Lunch, Early Dinner, Dessert), print button.

Map what exists vs what's missing in both pages.

STEP 4 — FIX:
Food listing: Add 'Created Date' column if missing. Verify Type/Category filter works.
Food calendar: Verify branch filter, meal assignment dialog, and print functionality work. If print route exists at /food/calendar/print, verify it works.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'food: match listing and calendar to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 10: Messages — inbox, sent, compose
# ─────────────────────────────────────────────────────────────
run_phase "Phase 10: Messages pages" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/alarmsMsg.php COMPLETELY (inbox).
Read $OLD_APP/Msg_list.php COMPLETELY (sent messages).
Read $OLD_APP/message_portal.php (broadcast compose).
Read $OLD_APP/message_portal_single.php (direct compose).
Read $OLD_APP/message_portal_class.php (class compose).

STEP 2 — READ NEW APP:
Read all message pages and components:
- src/app/(app)/messages/inbox/page.tsx and its client component
- src/app/(app)/messages/sent/page.tsx and its client component
- src/app/(app)/messages/compose/page.tsx and compose sub-routes
- Find all message components in src/components/messages/

STEP 3 — COMPARE:
Old inbox columns: From, Date, Nature (General/Urgent/Legal/Event), Subject, Message preview, Status (Read/Unread), Actions
Old sent columns: To, Date, Nature, Subject, Message preview, Thread, Actions
Old compose had: Branch selector, Class selector, WhatsApp/SMS toggles, Nature dropdown, Subject, Message body

Map EVERY element. Note missing columns, filters, and form fields.

STEP 4 — FIX:
- Add 'Nature' column to inbox listing (colored badge: General=gray, Urgent=red, Legal=amber, Event=blue)
- Add 'Nature' column to sent listing
- Verify compose form has Nature dropdown
- Verify compose routes exist for direct and class messaging
- Add message body preview (truncated) to inbox/sent if missing

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'messages: match inbox/sent/compose to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 11: Alarms — all 12 types + main page
# ─────────────────────────────────────────────────────────────
run_phase "Phase 11: Alarm pages" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/alarms.php COMPLETELY (main alarms page — two tables: active + sent).
Read $OLD_APP/alarmsVaccinations.php and $OLD_APP/alarmsBirthday.php as examples of sub-pages.

STEP 2 — READ NEW APP:
Read src/app/(app)/alarms/page.tsx and src/components/alarms/notification-center.tsx.
Read 2-3 alarm sub-page client components (e.g. vaccinations-client.tsx, birthdays-client.tsx, payments-client.tsx).

STEP 3 — COMPARE:
Old alarm pages had: per-row action buttons (Mark Viewed, Dismiss), date range filter, status tracking (New/Viewed).
Main page had two tables: Active Alarms and Sent/History alarms.

Check what the new alarm pages have vs what's missing.

STEP 4 — FIX:
For each alarm sub-page pattern:
- Add an 'Actions' column with dropdown: Mark as Viewed, Dismiss
- If actions are already there, verify they work
- Add date range filter if missing

For main /alarms page:
- Verify it shows alarm counts by type
- Each type should link to its dedicated page

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'alarms: add action buttons and verify all 12 types'
"

# ─────────────────────────────────────────────────────────────
# PHASE 12: Address management — zones, areas, regions
# ─────────────────────────────────────────────────────────────
run_phase "Phase 12: Address management" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/Zones_Management.php COMPLETELY.
Read $OLD_APP/Areas.php COMPLETELY.
Read $OLD_APP/regions.php COMPLETELY.

STEP 2 — READ NEW APP:
Read src/app/(app)/settings/zones/page.tsx and its client component.
Read src/app/(app)/settings/areas/page.tsx and its client component.
Read src/app/(app)/settings/regions/page.tsx and its client component.

STEP 3 — COMPARE:
Old had for all three: Name, Reference Number, Parent entity, Created Date, Action columns.
Old had: ID filter, Name filter, Reference Number filter, Date range filter.

Check what's in new. The regions page may use a tree view (which is an improvement). But verify all CRUD operations and fields match.

STEP 4 — FIX:
- Add Reference Number field to forms and listings where missing
- Add Created Date column where missing
- Ensure parent entity relationship is displayed (Area → Zone, Region → Area)

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'settings: match address management to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 13: Parent Users — two-table layout
# ─────────────────────────────────────────────────────────────
run_phase "Phase 13: Parent users" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/parent_users.php COMPLETELY.
Read $OLD_APP/parent_user.php COMPLETELY (single user detail/edit).
Read $OLD_APP/js/parent_users.js.

STEP 2 — READ NEW APP:
Read src/app/(app)/settings/parent-users/page.tsx and its client component.
Read src/app/(app)/settings/parent-users/[id]/page.tsx if it exists.

STEP 3 — COMPARE:
Old had TWO separate tables on one page:
Table 1 'Children WITH parent user': Name, Username, Status, Branch, Class, Action
Table 2 'Children WITHOUT parent user': Name, Branch, Class, Action (Create User)
Old detail page had: Username, Password, Status fields.

Check if new page has this dual-table structure or a single table.

STEP 4 — FIX:
If single table: refactor to show two sections with headings.
If already dual-table: verify columns match.
Ensure 'Create User' action exists for children without accounts.
Ensure edit/delete/password-reset actions exist for children with accounts.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'parent-users: match two-table structure from old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 14: Accounting — full structure match
# ─────────────────────────────────────────────────────────────
run_phase "Phase 14: Accounting" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/accounting.php (focus on structure — it's large, ~2200 lines). Note:
- The tab structure (Total, Registration, Monthly, Bus, Xtra-time, Other)
- The child × month grid layout
- Payment modal fields
- Summary calculations
Read $OLD_APP/js/accounting.js for data loading.

STEP 2 — READ NEW APP:
Read src/app/(app)/accounting/page.tsx and ALL its components:
- Find accounting client component
- Find quick payment dialog
- Find any grid/table components
Read everything in src/components/accounting/

STEP 3 — COMPARE:
Old had: 6 fee category tabs, child × month (Oct-Sep) grid per tab, payment creation modal, summary totals.
Map what the new app has vs what's missing. The new app may already have a grid view — check carefully.

STEP 4 — FIX:
Ensure:
- Summary stat cards exist (Total Revenue, Pending, Overdue, This Month)
- Fee category filter/tabs (ALL, REGISTRATION, MONTHLY, BUS, XTRA_TIME, OTHER)
- Payment listing or grid shows: Child Name, Amount, Currency, Method, Category, Date, Status
- Payment dialog/form has all fields from old: Amount, Currency, Method, Fee Type, Date, Notes
- If the grid view already exists, verify it works. If only a basic listing, that's OK — just ensure columns match.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'accounting: match structure and features to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 15: Child Dashboard — all stat cards + tables
# ─────────────────────────────────────────────────────────────
run_phase "Phase 15: Child dashboard" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/child_dashboard.php COMPLETELY (focus on stat card IDs and profile fields).
Read $OLD_APP/js/child_dashboard.js COMPLETELY. This file has the getvalues() function that populates:
- Stat cards: INCOUT, ACCREP, ACCOUN, ATTEN, ABSE, NOREP, NOREPAB, MEDREP, MEDREPM, MEDREPD, ASSESS, ASSESSM, ASSESSI, ASSESSD
- Profile fields: u_ac_no, u_status, u_nat, u_branch, u_class, u_gender, u_language, u_joining, u_jage, u_currage, u_phonem, u_phonef, u_bus, u_allergy, u_milk, u_portion, u_scoop, u_lunch, u_diapers
- Data tables: daily reports (datatablenu), absence reports (datatableab)

STEP 2 — READ NEW APP:
Read src/app/(app)/children/[id]/dashboard/page.tsx COMPLETELY.
Find and read the dashboard client component.

STEP 3 — COMPARE:
Old had 14 stat cards in specific colors, a profile info section with 20+ fields, 4 data tables (daily/absence/medical/assessments), and a consumption pie chart.

List what the new dashboard already has. Then list what's missing.

STEP 4 — FIX:
Add any missing stat cards. The full list needed:
- Calls In/Out, Accident Reports, Total Payments
- Attendance, Absence, Missing Daily Reports, Missing Absence Reports
- Medical Published, Medical Missing, Medical Drafts
- Assessments Published, Assessments Missing, Assessments Drafts

Verify profile section shows: child number, DOB, age, nationality, branch, class, gender, language, enrollment date, parent phones, bus, allergies, milk info, lunch, diapers.

Verify data tables exist for: Daily Reports, Absence Reports, Medical, Assessments.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'children: match child dashboard to old PHP app exactly'
"

# ─────────────────────────────────────────────────────────────
# PHASE 16: Class Dashboard — create if missing
# ─────────────────────────────────────────────────────────────
run_phase "Phase 16: Class dashboard" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/class_dashboard.php (focus on stat card sections — it's ~2000 lines).
Read $OLD_APP/js/class_dashboard.js COMPLETELY. This has data loading for:
- Tab 1 Daily Reports: BIRTH, WOREP, WREP, INCOMP, DREP (5 cards)
- Tab 2 Medical: MED1REP through MED6REP + variants (16 cards)
- Tab 3 Assessments: A1WREP through A7DREP (28 cards)
- Data tables for each

STEP 2 — CHECK IF NEW PAGE EXISTS:
Search: find src/app -path '*/classes/\\[id\\]*' -name 'page.tsx'
If a class detail page exists, read it completely. If not, note that it needs to be created.

STEP 3 — COMPARE:
The old class dashboard was the most complex page with 49 stat cards across 3 tabs. The new app may not have this page at all.

STEP 4 — CREATE/FIX:
If page doesn't exist, create src/app/(app)/classes/[id]/page.tsx (or classes/[id]/dashboard/page.tsx).

The page should have:
- Class header: name, branch, language, student count
- Tabs component with 3 tabs:

Tab 1 'Daily Reports': 5 StatCards:
  - Birthdays (purple), Without Report (rose), Completed (emerald), Incomplete (amber), Drafts (sky)

Tab 2 'Medical Reports': Simplified to 3 StatCards:
  - Published (emerald), Missing (rose), Drafts (sky)

Tab 3 'Assessments': Simplified to 3 StatCards:
  - Completed (emerald), Missing (rose), Drafts (sky)

Create a getClassDashboard server action that queries:
- Class info (name, branch, studentCount)
- Count of daily reports by status
- Count of medical forms by status
- Count of assessments by status
- Birthday count for current month

Use the existing StatCard component. Use shadcn Tabs for the 3 sections.

STEP 5 — VERIFY:
Run: npx tsc --noEmit
Re-read the created page to verify structure.

Commit with message: 'classes: create class dashboard matching old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 17: Attendance heatmap
# ─────────────────────────────────────────────────────────────
run_phase "Phase 17: Attendance heatmap" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/Monthly_report.php COMPLETELY.
Read $OLD_APP/Monthly_report_b.php briefly (branch variant).

STEP 2 — READ NEW APP:
Read src/app/(app)/attendance/heatmap/page.tsx and its components.

STEP 3 — COMPARE:
Old had: monthly grid (children as rows, dates 1-31 as columns), color-coded cells (Purple=No Report, Green=Present, Pink=Absent, Red=Weekend, Yellow=Holiday), month/year picker, branch filter.

Check if new heatmap has all these elements.

STEP 4 — FIX:
- Add color legend if missing (showing what each color means)
- Verify branch + class filters work
- Verify month/year navigation works
- Verify print button exists
- Ensure color coding matches: Present=green, Absent=red/rose, No Report=purple/violet, Weekend=gray, Holiday=amber/yellow

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'attendance: match heatmap to old monthly report'
"

# ─────────────────────────────────────────────────────────────
# PHASE 18: Holiday calendar
# ─────────────────────────────────────────────────────────────
run_phase "Phase 18: Holiday calendar" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/holiday_calendar.php COMPLETELY. Note the event creation modal fields:
Description, Repeated/One Time, Date, Notification Subject, Notification Message (155 char limit), Type (Holiday/Strike), Active, Days Before (1-7), Inform Teachers, Send via (WhatsApp/SMS/Both).

STEP 2 — READ NEW APP:
Read src/app/(app)/settings/holidays/page.tsx and its components.

STEP 3 — COMPARE:
Check which form fields exist in the new holiday creation form vs old.

STEP 4 — FIX:
Ensure the holiday form has at minimum:
- Name/Description, Date, End Date, Type (Holiday/Strike), Active toggle, Repeated toggle
- Notification fields: Subject, Message (with character count), Days Before
- If WhatsApp/SMS toggle doesn't exist, add as a select dropdown

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'holidays: match event form to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 19: Employee calendar
# ─────────────────────────────────────────────────────────────
run_phase "Phase 19: Employee calendar" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/calendar.php COMPLETELY.
Read $OLD_APP/js/calendar.js to understand event types and colors:
- Sick (blue), Absent (purple), Day Off (green), Warning (red)
- Form: Status dropdown, Reference Number, Date

STEP 2 — READ NEW APP:
Read src/app/(app)/employees/calendar/page.tsx and its components.

STEP 3 — COMPARE:
Check if calendar shows color-coded events with proper status types. Check if event creation form has Status and Reference Number.

STEP 4 — FIX any gaps.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'employees: match calendar to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 20: Assessments listing
# ─────────────────────────────────────────────────────────────
run_phase "Phase 20: Assessments listing" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/assessment_1.php (first 200 lines — listing structure).
Note: old had 7 separate pages (assessment_1 through assessment_7), each with the same listing columns.

STEP 2 — READ NEW APP:
Read src/app/(app)/assessments/page.tsx and its components.
Read src/app/(app)/assessments/[type]/page.tsx.
Read src/lib/assessment-types.ts.

STEP 3 — COMPARE:
Old listing columns: Image, F Name, L Name, Assessment status (green/red flag), Branch, Class, Date, Action
The new app unified all 7 types. Check if the listing shows proper columns.

STEP 4 — FIX:
Ensure listing has: Child avatar, First Name, Last Name, Assessment Type, Branch, Class, Status, Date, Action.
Ensure type filter allows selecting among 7 assessment types.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'assessments: match listing to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 21: Employee attendance upload + logs
# ─────────────────────────────────────────────────────────────
run_phase "Phase 21: Employee attendance" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/attendance.php (file upload form).
Read $OLD_APP/PA_logs.php COMPLETELY. Note columns: AC No., Name, Log, Date Out, Time Out, Date In, Time In, Datetime.

STEP 2 — READ NEW APP:
Read src/app/(app)/employees/attendance/page.tsx and its components.
Read src/app/(app)/employees/attendance-logs/page.tsx and its components.

STEP 3 — COMPARE:
Check if upload form exists with file input and date range.
Check if logs table has the correct columns.

STEP 4 — FIX any missing columns or features.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'employees: match attendance pages to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 22: Calls management
# ─────────────────────────────────────────────────────────────
run_phase "Phase 22: Calls management" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/calls.php COMPLETELY. Note listing columns and modal.
Read $OLD_APP/call.php COMPLETELY. Note form sections:
1. Call Section: Call Type (Incoming/Outgoing), Date, Time
2. Cause of Call Section: Cause dropdown
3. Subject Section: Subject, Remarks, Teacher selector
4. Attachments Section
Read $OLD_APP/js/calls.js and js/call.js.

STEP 2 — READ NEW APP:
Search for call-related pages: find src/app -name 'page.tsx' | xargs grep -l -i call
Read src/app/(app)/children/[id]/calls/page.tsx if it exists.
Find any call components in src/components/

STEP 3 — COMPARE:
Old had: standalone calls listing page + individual call form.
New may only have per-child call log.

Check if the call listing exists and if the call form has all sections from old app.

STEP 4 — FIX:
If per-child call page exists:
- Verify columns: Date, Time, Call Type (Incoming/Outgoing), Cause, Subject, Remarks, Filed By, Actions
- Verify the call creation form has: Call Type, Date, Time, Cause dropdown, Subject, Remarks, Teacher selector

If call page doesn't exist at all:
- Create src/app/(app)/children/[id]/calls/page.tsx with a basic call log table and call creation dialog

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'calls: match call log and form to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 23: Daily report FORM — all sections
# ─────────────────────────────────────────────────────────────
run_phase "Phase 23: Daily report form" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/dailyreport.php COMPLETELY. Identify every form section and field.
Read $OLD_APP/js/dailyreport.js for validation and field IDs.

The old form had these sections:
1. Attendance: Check-in time, Check-out time, Absent toggle
2. Meals: Breakfast portion, Lunch portion, Dessert portion (each with food dropdown)
3. Milk: Type, Portions (ml), Scoops, Times
4. Sleep: From, To, Quality
5. Diapers: Count, Condition
6. Mood: Happy/Normal/Sad/Crying
7. Activities: Notes
8. Health: Temperature, Fever toggle, Medicine, Health notes
9. General Notes: Remarks
10. Submit/Draft buttons

STEP 2 — READ NEW APP:
Find the daily report form: search src/app/(app)/daily-reports/ and src/components/daily-reports/ for form components.
Read the entire form component.

STEP 3 — COMPARE:
List every section/field from old. Check each one exists in new. List gaps.

STEP 4 — FIX:
Add any missing form sections. Each section should be a Card with a heading. Missing fields should use appropriate shadcn inputs (time pickers, number inputs, select dropdowns, toggles).

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'daily-reports: match form sections to old PHP app'
"

# ─────────────────────────────────────────────────────────────
# PHASE 24: Absent report FORM — add missing sections
# ─────────────────────────────────────────────────────────────
run_phase "Phase 24: Absent report form" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/absentreport.php COMPLETELY.
Read $OLD_APP/js/absentreport.js.

Old form sections:
1. Child Selection
2. Absence Date
3. Reason (dropdown: sick, family, travel, other)
4. Absence Period: Date From, Date To
5. Hospital Section: Hospitalized (yes/no), Hospital Name, Doctor Name
6. Attachments: File uploads
7. Notes/Remarks
8. Submit/Draft

STEP 2 — READ NEW APP:
Find the absent report form component.

STEP 3 — COMPARE:
Critical gaps from analysis: missing hospital section, absence period dates, attachments.

STEP 4 — FIX:
Add missing fields:
- Absence Period: dateFrom and dateTo date pickers
- Hospital section: hospitalized toggle, hospitalName text input, doctorName text input (show/hide based on toggle)
- Attachments: file upload area (even if just UI placeholder)

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'absent-reports: add hospital section and period dates to form'
"

# ─────────────────────────────────────────────────────────────
# PHASE 25: Nursery settings — government compliance
# ─────────────────────────────────────────────────────────────
run_phase "Phase 25: Nursery settings" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/nurseryinfo.php (LARGE file — focus on form section headers and field labels, both English and Arabic).

STEP 2 — READ NEW APP:
Read src/app/(app)/settings/nursery/page.tsx and its client component.

STEP 3 — COMPARE:
Old had a massive government compliance form. New has simplified version.
Key missing sections: Registration info, Owner type toggle, Nursery Arabic name, Geographic hierarchy dropdowns.

STEP 4 — FIX:
Add new form sections BELOW existing fields:

Section 'Government Registration' (Card):
- Registration Number (text)
- Registration Date (date picker)

Section 'Owner Information' (Card):
- Owner Type: Radio group (Natural Person / Legal Entity)
- If Natural Person: Full name, Father's name, Family name, ID Number, Nationality, Place of Birth, Date of Birth
- If Legal Entity: Legal Name, Entity Type dropdown, Registration Number, Authorized Representative Name

Section 'Nursery Identity' (Card):
- Arabic Name (text, dir=rtl)
- Latin Name (text, pre-fill from existing name)

Section 'Location' (Card):
- Governorate dropdown (from zones data)
- District dropdown (from areas, filtered by zone)
- Region dropdown (from regions, filtered by area)

Use conditional rendering (show person fields or entity fields based on toggle).

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'nursery: add government compliance form sections'
"

# ─────────────────────────────────────────────────────────────
# PHASE 26: New Year Setup page
# ─────────────────────────────────────────────────────────────
run_phase "Phase 26: New year setup" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/newyear.php COMPLETELY. Note the workflow:
1. New year name display
2. Optional imports checkboxes (General Forms, Vaccinations, Suffering, Teachers, Nurses, Managers, Doctors, Holidays)
3. Mandatory imports (disabled: Classes, Branches, Children, Parents)
4. Teacher reassignment table
5. Child progression table
6. Create button

STEP 2 — CHECK IF EXISTS:
Search: find src/app -path '*new-year*' -o -path '*newyear*' -o -path '*academic*'

STEP 3 — CREATE:
Create src/app/(app)/settings/new-year/page.tsx:

- Page header: 'New Academic Year Setup'
- Alert warning about archival
- Card 'Data Import Options':
  - Checkboxes for optional imports (with labels)
  - Disabled checkboxes for mandatory imports
- Card 'Teacher Reassignment' (placeholder with description + TODO)
- Card 'Child Class Progression' (placeholder with description + TODO)
- Disabled submit button with 'Coming Soon' note

This is UI structure only — no server actions needed.

STEP 4 — Also ensure the sidebar navigation has a link to this page under Settings.
Check src/components/layout/app-sidebar.tsx — if new-year isn't in the nav config, add it under the Setting accordion.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'settings: create new academic year setup page'
"

# ─────────────────────────────────────────────────────────────
# PHASE 27: Events calendar
# ─────────────────────────────────────────────────────────────
run_phase "Phase 27: Events calendar" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/NotifCalendar.php COMPLETELY.

STEP 2 — READ NEW APP:
Read src/app/(app)/settings/events/page.tsx and its components.

STEP 3 — COMPARE:
Old had a FullCalendar-based event/notification calendar. Check if new has a calendar or event list view.

STEP 4 — FIX:
If page is a stub, flesh it out with:
- Event list or calendar view
- Add Event button/dialog
- Event fields: Title, Date, Description, Type, Active
If page already works, verify fields match old.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'settings: verify events calendar page'
"

# ─────────────────────────────────────────────────────────────
# PHASE 28: Branch dashboard — links and completeness
# ─────────────────────────────────────────────────────────────
run_phase "Phase 28: Branch dashboard" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/Branch_Dashboard.php. Note stat cards and links.

STEP 2 — READ NEW APP:
Find and read the branch dashboard: src/app/(app)/branches/[id]/dashboard/page.tsx or similar.
Read the client component.

STEP 3 — COMPARE:
Old had: Total Classes (link), Total Active Children (link).
New should have: 6 stat cards + compliance + documents.

STEP 4 — FIX:
Ensure stat cards have href links:
- Children → /children?branch=[id]
- Classes → /branches/[id]/classes
- Teachers → /employees/teachers?branch=[id]
If links are missing, add them to the StatCard href prop.

STEP 5 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'branches: add links to dashboard stat cards'
"

# ─────────────────────────────────────────────────────────────
# PHASE 29: Invoice/receipt print page
# ─────────────────────────────────────────────────────────────
run_phase "Phase 29: Invoice print" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/invo.php COMPLETELY. Note the receipt/invoice layout.

STEP 2 — CHECK IF EXISTS:
Search: find src/app -name 'page.tsx' -path '*invoice*' -o -name 'page.tsx' -path '*receipt*'

STEP 3 — CREATE IF MISSING:
If no invoice page exists, create src/app/(app)/accounting/invoice/[id]/page.tsx:
- Fetch payment by ID
- Print-friendly layout: nursery name, child name, amount + currency, payment method, date, category, receipt number
- Print button (window.print())
- Use @media print Tailwind utilities

STEP 4 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'accounting: create invoice print page'
"

# ─────────────────────────────────────────────────────────────
# PHASE 30: Draft pages — verify
# ─────────────────────────────────────────────────────────────
run_phase "Phase 30: Draft pages" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ:
Read src/app/(app)/children/drafts/page.tsx
Read src/app/(app)/daily-reports/drafts/page.tsx
Read src/app/(app)/absent-reports/drafts/page.tsx

STEP 2 — VERIFY:
Each draft page should either:
a) Redirect to the listing with ?status=DRAFT filter, OR
b) Show a dedicated filtered listing of only draft items

If any is broken or missing, fix it.

STEP 3 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'verify draft pages work correctly'
"

# ─────────────────────────────────────────────────────────────
# PHASE 31: Sidebar navigation — exact match to old menu
# ─────────────────────────────────────────────────────────────
run_phase "Phase 31: Sidebar navigation" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ OLD APP:
Read $OLD_APP/leftmenu.php COMPLETELY. This is the old sidebar menu. Document EVERY menu item, its label, icon, URL, and nesting level. The old menu had accordion-style collapsible groups.

STEP 2 — READ NEW APP:
Read src/components/layout/app-sidebar.tsx COMPLETELY. Document every nav item, label, href, and nesting.

STEP 3 — COMPARE:
Create a side-by-side comparison of old menu items vs new menu items. Check:
- Are all old menu items present in new? (same labels, same groupings)
- Is the nesting/hierarchy the same?
- Are there items in old that are missing from new?
- Do the links point to the correct routes?

The old app's menu structure (from leftmenu.php) should be the SOURCE OF TRUTH.

STEP 4 — FIX:
Add any missing menu items. Fix any wrong labels or groupings. Ensure:
- Every page that existed in old app has a sidebar link
- The accordion group structure matches old (Dashboard, Garderie Management, Children Management, Medical Reports sub-accordion, etc.)
- New Year Setup page (from Phase 26) has a link
- All badge indicators work (missing reports, unread messages, alarms)

STEP 5 — VERIFY:
Run: npx tsc --noEmit
Re-read app-sidebar.tsx to verify completeness.

Commit with message: 'sidebar: match navigation structure to old PHP app exactly'
"

# ─────────────────────────────────────────────────────────────
# PHASE 32: Mobile navigation — match sidebar
# ─────────────────────────────────────────────────────────────
run_phase "Phase 32: Mobile navigation" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — READ:
Read src/components/layout/mobile-nav.tsx
Read src/components/layout/mobile-more-sheet.tsx

STEP 2 — VERIFY:
The mobile nav should mirror the sidebar nav. After Phase 31 updated the sidebar, verify:
- Mobile 'More' sheet shows the same accordion structure as sidebar
- All menu items from sidebar appear in mobile
- Active state detection works (current page highlighted)

STEP 3 — FIX any discrepancies between sidebar and mobile nav.

STEP 4 — VERIFY:
Run: npx tsc --noEmit

Commit with message: 'mobile-nav: sync with sidebar navigation'
"

# ─────────────────────────────────────────────────────────────
# PHASE 33: Final comprehensive type check + verification
# ─────────────────────────────────────────────────────────────
run_phase "Phase 33: Final verification" "
You are working in /Users/karimsaab/Desktop/garderie (Next.js 15 app).

STEP 1 — TYPE CHECK:
Run: npx tsc --noEmit
Fix ALL type errors. Common issues: missing imports, wrong prop types, missing fields in queries.

STEP 2 — SMOKE TEST VERIFICATION:
After fixing type errors, do a quick read of these key files to verify they look correct:
- src/app/(app)/dashboard/page.tsx (section order)
- src/components/children/children-columns.tsx (column order)
- src/components/employees/employee-columns.tsx (column order)
- src/components/layout/app-sidebar.tsx (nav structure)

If anything looks wrong, fix it.

STEP 3 — FINAL TYPE CHECK:
Run: npx tsc --noEmit again to make sure fixes didn't break anything.

Commit with message: 'fix: resolve all type errors from overnight restructure'
"

echo "" >> "$LOG_FILE"
echo "=== ALL PHASES COMPLETE — $(date) ===" >> "$LOG_FILE"
