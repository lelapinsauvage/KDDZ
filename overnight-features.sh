#!/bin/bash
# KiddzOnline Overnight Script — Features + Design + UX + QA
# NO set -e — we want to continue on failure
cd /Users/karimsaab/Desktop/garderie
LOG_FILE="./overnight-features-log.txt"
echo "=== OVERNIGHT FEATURES START — $(date) ===" > "$LOG_FILE"

run_phase() {
  local name="$1"
  local prompt="$2"
  echo "" >> "$LOG_FILE"
  echo "=============================================" >> "$LOG_FILE"
  echo "=== $name — $(date) ===" >> "$LOG_FILE"
  echo "=============================================" >> "$LOG_FILE"
  claude --dangerously-skip-permissions -p "$prompt" >> "$LOG_FILE" 2>&1
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "⚠ $name FAILED (exit $exit_code) — continuing..." >> "$LOG_FILE"
  fi
  git push origin ux-improvements >> "$LOG_FILE" 2>&1
  echo "=== $name COMPLETE — $(date) ===" >> "$LOG_FILE"
}

# ═══════════════════════════════════════════════
# BLOCK 1: CRITICAL FIXES (Phases 1-3)
# ═══════════════════════════════════════════════

run_phase "Phase 1 — Fix Org Backfill & Dashboard Crash" '
You are a Senior Backend Engineer fixing a critical production bug. The KiddzOnline app (Next.js 16, Prisma 7, Auth.js v5) crashes on /dashboard with "Something went wrong".

ROOT CAUSE: Users have NULL organizationId in the database. The requireOrg() helper throws "No organization context" which crashes the dashboard.

Read these files:
- src/lib/require-org.ts
- src/lib/auth.ts (the authorize function)
- src/lib/actions/dashboard.ts (first 80 lines — the getMorningBriefing function)
- scripts/backfill-org.ts

Fix 1: Update scripts/backfill-org.ts to ensure ALL users get organizationId set. The logic should be:
- Find the first Organization (there should be one called "KiddzOnline")
- For ALL Users where organizationId IS NULL: if user has a branchId, get the branch organizationId and set it. If branch has no organizationId either, set both.
- Run the script: npx tsx scripts/backfill-org.ts

Fix 2: Make requireOrg() more defensive in src/lib/require-org.ts. If session.user.organizationId is null but session.user.branchId exists, try to look up the org from the branch:
```typescript
if (!session.user.organizationId && session.user.branchId) {
  const branch = await db.branch.findUnique({ where: { id: session.user.branchId }, select: { organizationId: true } });
  if (branch?.organizationId) {
    return { userId: session.user.id, organizationId: branch.organizationId, branchId: session.user.branchId, role: session.user.role };
  }
}
```
Add the db import at the top.

Fix 3: In src/lib/auth.ts authorize function, make sure the branch include always loads organizationId. The return should use the fallback chain: user.organizationId ?? user.branch?.organizationId ?? null

Verify: Run npx tsc --noEmit. Then run npx tsx scripts/backfill-org.ts again to confirm all users have orgId.

Commit:
```
git add -A && git commit -m "fix: backfill org IDs and make requireOrg fallback to branch org"
```
'

run_phase "Phase 2 — Fix Broken Pages Scan" '
You are a Senior QA Engineer. The app had a multi-tenancy migration that may have broken some pages. Test every major route by reading the server components and checking for obvious issues.

Read these files and check for unhandled requireOrg() calls that could crash:
- src/app/(app)/dashboard/page.tsx
- src/app/(app)/children/page.tsx
- src/app/(app)/daily-reports/page.tsx
- src/app/(app)/employees/teachers/page.tsx
- src/app/(app)/food/calendar/page.tsx

For each page: if it calls a server action that uses requireOrg() and the result is NOT wrapped in try/catch, add error handling. The pattern should be:
- Server components should wrap action calls in try/catch and show an empty state or redirect on error
- Client components should handle errors from server actions gracefully

Also read:
- src/app/(app)/layout.tsx (verify it handles missing org gracefully)

Fix any pages that would crash with a missing org context. Do NOT change working pages.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix: add error handling to pages for missing org context"
```
'

run_phase "Phase 3 — Verify All Routes Load" '
You are a QA Engineer. Start the dev server and verify major routes do not return 500 errors.

First, kill any existing dev server:
```
pkill -f "next dev" || true
sleep 2
```

Start the dev server on port 3334:
```
pnpm exec next dev --port 3334 &
sleep 12
```

Test these routes (they should return 200 or 307 redirect, NOT 500):
```
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/dashboard
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/children
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/daily-reports
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/employees/teachers
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/food/calendar
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/settings
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/messages/inbox
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/alarms
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/accounting
```

If any return 500, read the page file and fix it. Common issues:
- requireOrg() throwing without try/catch
- Missing imports after refactoring
- Prisma query errors from new where clauses

Kill the dev server when done:
```
pkill -f "next dev" || true
```

Commit any fixes:
```
git add -A && git commit -m "fix: resolve 500 errors on major routes"
```
'

# ═══════════════════════════════════════════════
# BLOCK 2: FEATURE ENHANCEMENTS (Phases 4-24)
# Spec file: overnight-features-spec.md
# ═══════════════════════════════════════════════

run_phase "Phase 4 — RBAC: requireRole + Dashboard Data Layer" '
You are a Senior Security Engineer. Read overnight-features-spec.md FEATURE 12 for the full spec.

Read these files:
- src/lib/require-org.ts
- src/lib/actions/dashboard.ts (first 100 lines)
- src/app/(app)/settings/page.tsx

Task 1: Create src/lib/require-role.ts:
```typescript
import { requireOrg, type OrgContext } from "./require-org";
type Role = OrgContext["role"];

export async function requireRole(...allowedRoles: Role[]): Promise<OrgContext> {
  const ctx = await requireOrg();
  if (!allowedRoles.includes(ctx.role)) {
    throw new Error("Forbidden: insufficient permissions");
  }
  return ctx;
}

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
```

Task 2: Add role checks to admin-only pages. Read each page first:
- src/app/(app)/settings/page.tsx — add requireRole("ADMIN", "MANAGER")
- src/app/(app)/accounting/page.tsx — add requireRole("ADMIN", "MANAGER")
- src/app/(app)/branches/page.tsx — add requireRole("ADMIN", "MANAGER")

For each: read the file, add the import and role check at the top of the server component.

Task 3: In src/lib/actions/dashboard.ts, ensure getMorningBriefing uses Prisma aggregate/groupBy/count (not raw record fetching). Read the current implementation and optimize any queries that fetch all records just to count them.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: add requireRole utility and optimize dashboard data layer"
```
'

run_phase "Phase 5 — Manager Dashboard: Global Controls + KPIs" '
You are a Senior Full-Stack Engineer. Read overnight-features-spec.md FEATURE 11 sections 1-3.

The dashboard already exists at src/app/(app)/dashboard/page.tsx with a morning briefing. ENHANCE it, dont rewrite from scratch.

Read:
- src/app/(app)/dashboard/page.tsx
- src/components/dashboard/stat-card.tsx
- src/lib/actions/dashboard.ts

Enhancements:
1. Add a DateRangePicker to the dashboard header. Create or enhance src/components/dashboard/date-range-picker.tsx using the shadcn calendar + popover. Include preset buttons: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Custom Range.

2. Add a School Year selector next to it (use the school years from the app context).

3. Enhance the top KPI row to show: Total Branches (hide if branch-level), Total Classes, Total Active Children as elevated stat cards.

4. Add demographic charts: Children Per Class (donut chart) and Gender Stats (donut chart) using Recharts. Create src/components/dashboard/demographics-section.tsx.

Use the existing design system colors. Keep all existing dashboard functionality.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: add date range picker, school year selector, and demographic charts to dashboard"
```
'

run_phase "Phase 6 — Manager Dashboard: Compliance Row + Action Center" '
You are a Senior Full-Stack Engineer. Read overnight-features-spec.md FEATURE 11 sections 4-6.

Read:
- src/app/(app)/dashboard/page.tsx
- src/components/dashboard/status-board.tsx
- src/components/dashboard/action-center.tsx
- src/lib/actions/dashboard.ts

Enhancements:
1. Enhance the status board / compliance row to show: Total Attendance, Total Absence, Missing Daily Reports (RED highlight), Missing Absent Reports. Each card should be clickable — clicking "Missing Daily Reports" routes to /daily-reports?status=missing.

2. Replace the action center with a clean 3x3 grid. Fix the legacy naming bug where "Total Drafts" appears 3 times. Use distinct labels:
   - Financial: Total Payments Collected
   - Medical: Incident / Accident Reports
   - Comms: Logged Calls
   - Medical: Completed Medical Visits
   - Compliance: Missing Medical Visits
   - Compliance: Missing Assessments
   - Drafts: Pending Daily Reports
   - Drafts: Pending Medical Reports
   - Drafts: Pending Assessments

3. Add the server action getActionCenterMetrics() in dashboard.ts that uses Promise.all() for all 9 counts simultaneously.

4. Branch drill-down: When branchId is set in context, all queries scope to that branch and "Total Branches" card hides.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: add compliance row, action center 9-grid, and branch drill-down to dashboard"
```
'

run_phase "Phase 7 — Daily Report: Present Flow Enhancement" '
You are a Senior Frontend Engineer. Read overnight-features-spec.md FEATURE 2 section A.

The daily report form already exists. ENHANCE it with the detailed fields from the spec.

Read:
- src/components/daily-reports/daily-report-form.tsx
- src/lib/actions/daily-reports.ts (first 50 lines for schema)
- prisma/schema.prisma (DailyReport model and related models)

Enhance the form with these sections as distinct color-backed "island" cards:

1. MEALS ISLAND: Ensure Breakfast, Lunch, Dessert each have: Food Item (searchable select from Food table), Time (time picker), Portion (Well/Half/Little/None radio). Add "Apply Food For All Class Members" batch checkbox that is prominently highlighted.

2. MILK ISLAND: Amount (CC), Time, with [+] Add multiple entries (dynamic array).

3. SLEEP ISLAND: Nap Time From/To as time range pickers.

4. HYGIENE ISLAND: Matrix grid with rows (Diaper, Pot) and columns (Urine checks x5, Stool checks x5). Use rounded checkboxes in a grid layout.

Only add fields/sections that are MISSING from the current form. Read the current form carefully first.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance daily report form with meal details, hygiene matrix, and batch action"
```
'

run_phase "Phase 8 — Daily Report: Health + Clothes + Absent Flow" '
You are a Senior Frontend Engineer. Read overnight-features-spec.md FEATURE 2 sections A (Health, Xtra Clothes, Attachments) and B (Absent flow).

Read:
- src/components/daily-reports/daily-report-form.tsx
- src/components/absent-reports/absence-report-form.tsx

Enhance the daily report form:
1. HEALTH ISLAND: Fever tracking with Temp (decimal), Time, [+] Add multiple entries. Plus a Notes textarea.
2. CLOTHES ISLAND: Checkboxes for Pants, Sweater/Long-sleeve, T-shirt, Underwear, Socks. Style as visual toggle buttons.
3. ATTACHMENTS: Drag-and-drop zone for file uploads with Title field.

4. Present/Absent TOGGLE: Add a massive, clear toggle at the very top of the form: [ Present ] or [ Absent ]. When Absent is selected, show a simplified form with: Date, Class, Teacher, Reason of absence, Absent From/To dates, Hospital info (Yes/No switch).

Only add what is MISSING. Do not duplicate existing functionality.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: add health tracking, clothes toggles, and present/absent flow to daily report"
```
'

run_phase "Phase 9 — Medical: Accident & Call Reports" '
You are a Senior Full-Stack Engineer. Read overnight-features-spec.md FEATURE 3 section A.

Read:
- src/lib/actions/calls.ts
- src/lib/actions/medical.ts (first 100 lines)
- src/app/(app)/children/[id]/accidents/page.tsx
- src/app/(app)/children/[id]/calls/page.tsx

Enhance the accident report form to include ALL these fields:
- Cause (Text), Date, Time, "The accident happened" (Select: playground/classroom/bathroom/etc), Specify Area (Text), Camera Number (Text), First Aid applied (Select), Emergency Hospital (Select), Treatment (Select), Teacher who filled report, Attachments.

Enhance the call report form:
- Call Type (Incoming/Outgoing), Date, Time, Cause of Call (Select), Subject (Text), Remarks (Text), Teacher who filled report, Attachments.

Check what fields already exist in the Prisma schema and forms. Add missing fields to both the schema (if needed, use prisma db push) and the forms.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance accident and call report forms with complete field sets"
```
'

run_phase "Phase 10 — Medical Visit: Physical Exam Accordion" '
You are a Senior Frontend Engineer. Read overnight-features-spec.md FEATURE 3 section B.

The medical visit is a massive form. It MUST be broken into an Accordion or side-nav stepper.

Read:
- src/app/(app)/medical/visits/page.tsx (or similar path)
- src/lib/actions/medical.ts
- prisma/schema.prisma (MedicalForm, MedicalFormEntry models)

Create or enhance the medical visit form as an Accordion with these sections:
1. Vitals: Height (cm), Weight (kg), Blood Pressure (mm HG)
2. Eyes: With Glasses (Check), Left/Right Eye (Select), Crooked Eyes (Yes/No)
3. Ears: Wax Left/Right (Select), Drum Left/Right, Hearing Left/Right
4. Systems (Normal/Abnormal selects): Nose/Throat, Thyroid, Lymph nodes, Heart, Respiratory, Motor System, Abdomen-Genitals
5. Skin/Hair/Nails: Lice-Lupus, Dermatitis, Skin Allergy, Hair, Nails

Every section needs an "Other Problems / Additional Notes" textarea.

Use the shadcn Accordion component. Each section header shows a completion indicator (checkmark when filled).

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: create medical visit physical exam form as accordion"
```
'

run_phase "Phase 11 — Medical: Suffering Form + Vaccinations" '
You are a Senior Full-Stack Engineer. Read overnight-features-spec.md FEATURE 3 sections C and D.

Read:
- src/app/(app)/medical/conditions/page.tsx
- src/app/(app)/medical/vaccinations/page.tsx (or children/[id] vaccination sub-page)
- src/lib/actions/medical.ts
- prisma/schema.prisma (Vaccination model)

Task 1: Enhance or create the General Information / Suffering Form with:
- Assessment rows (Select + Remarks for each): Hearing, Speaking, Sight, Respiration, Worms, Heart, Arteries, Urine, Epilepsy, Migraine, Eating Disorder, Chronic Blood Problems, Other Health Problems
- Conclusion dropdown: "How do you assess General Health of your child?"

Task 2: Enhance the Vaccination tracking page with a timeline view:
- Standard vaccines: Hepatitis B (Birth), IPV (2 mos), OPV (4/6/18 mos, 4/10 yrs), DPT-Hib-HepB, Measles, MMR, DPT, DT
- Data per dose: Date Given, Administrated By (Select/Text)
- Visual timeline showing which doses are given vs overdue vs upcoming

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: add suffering form assessments and vaccination timeline tracker"
```
'

run_phase "Phase 12 — Developmental Assessment: Age Bracket Tabs" '
You are a Senior Frontend Engineer. Read overnight-features-spec.md FEATURE 4.

Read:
- src/components/assessments/assessment-form.tsx
- src/lib/actions/assessments.ts
- prisma/schema.prisma (Assessment model)

Enhance the assessment form with:
1. Age bracket tabs at the top: 0-3 mos, 4-7 mos, 8-12 mos, 13-18 mos, 19-24 mos, 24-36 mos, 3-4 yrs, 4-5 yrs

2. For each age bracket, display items grouped by category with large tappable [ Yes ] / [ No ] pill buttons (not small radio buttons):
   - Gross Motor (7-10 items per bracket)
   - Fine Motor (6-8 items)
   - Language (8-10 items)
   - Cognitive (6-8 items)
   - Self-Help (3-5 items)
   - Social/Emotional (5-7 items)

3. Developmental Red Flags section (checkboxes — critical for Ministry): Frequent falling, Drooling/unclear speech, Inability to build tower of 4 blocks, etc.

4. Comments textarea for final teacher notes.

Use the 24-36 months example from the spec as the template. Style the Yes/No pills as large, touch-friendly buttons with green (Yes) and gray (No) states.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance assessment form with age bracket tabs and yes/no pill buttons"
```
'

run_phase "Phase 13 — Food Calendar: Month View with Pill Tags" '
You are a Senior Frontend Engineer. Read overnight-features-spec.md FEATURE 5.

Read:
- src/components/food/food-listing-client.tsx
- src/lib/actions/food.ts
- src/app/(app)/food/calendar/page.tsx

Enhance the food calendar with:
1. Full-width month view calendar grid (7 columns for days). Each day cell shows meals as colored rounded pill-tags: Breakfast=Yellow, Lunch=Green, Dessert=Pink.

2. Click-to-edit modal: when clicking a day cell, open a dialog with:
   - Breakfast: Searchable combobox (using cmdk) from Food table
   - Lunch: Searchable combobox
   - Dessert: Searchable combobox with prominent "None" option
   - Primary Save button, distinct red "Clear Day" button

3. Navigation: Month/Year selector with prev/next arrows.

Use the existing food actions (getFoodCalendar, setFoodCalendarEntry, etc). Enhance the UI, not the backend.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance food calendar with month grid view and pill tag meals"
```
'

run_phase "Phase 14 — Holiday Calendar + Notification Triggers" '
You are a Senior Full-Stack Engineer. Read overnight-features-spec.md FEATURE 6.

Read:
- src/app/(app)/settings/holidays/page.tsx
- src/lib/actions/settings.ts (holiday-related functions)
- prisma/schema.prisma (Holiday model)

Enhance the holiday management:
1. Calendar view showing holidays as spanning event blocks across multiple days (not just single cells). Use a month view similar to the food calendar but with colored event bars.

2. Holiday event form (dialog):
   - Description/Name (text input)
   - Recurrence: "Repeated" or "One Time" (segmented control)
   - Start Date and End Date pickers (multi-day support)
   - Status: Active/Inactive switch
   - Notification Body: textarea for parent notification message
   - Notification Trigger: Select dropdown for "days before" (1 Day, 3 Days, 1 Week, None)

3. If the Holiday model doesnt have notification fields, add them to the schema:
   ```
   notificationBody String?
   notificationDaysBefore Int?
   ```
   Run prisma db push if schema changes are needed.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance holiday calendar with spanning events and notification triggers"
```
'

run_phase "Phase 15 — Notifications Hub: Templates + Logs" '
You are a Senior Full-Stack Engineer. Read overnight-features-spec.md FEATURE 7.

Read:
- src/app/(app)/settings/notifications/page.tsx
- src/lib/actions/settings.ts (notification/event type functions)
- prisma/schema.prisma (Notification, EventType models)

Create a two-tab Notifications Hub page:

Tab A - Templates: Configure automated notification templates.
- Categories: Birthday, Missing Reports, Medicine, Insurance, Assessment, Vaccinations, Expiration, Control
- Each category shows: Enable/Disable master switch, Subject (text input), Message Body (rich textarea), Variable chips below textarea (clickable to insert at cursor): [[child_name]], [[parent_name]], [[date]], [[branch_name]], [[class_name]]

Tab B - Sent Logs: Audit trail of sent notifications.
- Filterable by category (Calendar, General, Assessment, Reports, Medicine, Birthdays, Events, Insurance, Messages, Contracts)
- Table columns: ID, Type (badge), Content (snippet), Date, Status (Seen/Unseen badge), Actions (Resend)
- Date range filter (From/To pickers) in table header

If notification template models dont exist in schema, create a NotificationTemplate model and run prisma db push.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: create notifications hub with templates and sent logs tabs"
```
'

run_phase "Phase 16 — Accounting: Sticky DataTable + Payment Modal" '
You are a Senior Full-Stack Engineer. Read overnight-features-spec.md FEATURE 8.

Read:
- src/app/(app)/accounting/page.tsx
- src/components/accounting/quick-payment-dialog.tsx
- src/lib/actions/payments.ts
- src/lib/actions/accounting.ts

Enhance the accounting page:
1. Fee category tabs at top: Total Payments Summary, Registration Fees, Monthly Fees, Bus Fees, Xtra-time Fees, Other Fees.

2. DataTable with sticky first column (Child Name) and horizontal scroll for months (Jan-Dec). Each cell shows the payment amount for that child/month.

3. Enhance the payment modal with ALL fields:
   - Child Info (prefilled read-only badge)
   - Amount (number input with Zod validation)
   - Currency (USD, LBP dropdown)
   - Fee Type (prefilled by active tab)
   - Payment Method: Cash, Cheque, Credit Card, Bank Transfer (radio group with icons)
   - Notes textarea
   - Payment Date (date picker)
   - Coverage Period: From Month, To Month (two select dropdowns)
   - Attachment dropzone for receipts

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance accounting with fee tabs, sticky datatable, and full payment modal"
```
'

run_phase "Phase 17 — Messages: Split-Pane Composer" '
You are a Senior Frontend Engineer. Read overnight-features-spec.md FEATURE 9.

Read:
- src/app/(app)/messages/compose/page.tsx (and sub-pages)
- src/app/(app)/messages/inbox/page.tsx
- src/lib/actions/messages.ts

Enhance the messaging system:
1. Split-pane compose layout: Left pane = recipient selector, Right pane = message composer.

2. Left pane (Recipient Selector):
   - Branch dropdown filter, Class dropdown filter
   - Bulk actions: [Select All Children], [Select All Active], [Unselect All]
   - Scrollable list of children with checkboxes, colored avatars, names

3. Right pane (Composer):
   - Nature: General, Urgent, Legal, Event (select dropdown)
   - Subject: text input
   - Message body: rich textarea

4. Sent Messages tab: Data table with columns: #, To, Date, Nature, Subject, Message snippet, Thread link, Actions (View/Resend).

Adapt the existing compose pages. Do not create duplicate routes.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance message composer with split-pane layout and recipient selector"
```
'

run_phase "Phase 18 — Monthly Attendance Heatmap" '
You are a Senior Frontend Engineer. Read overnight-features-spec.md FEATURE 10.

Read:
- src/app/(app)/attendance/page.tsx (or wherever attendance lives)
- src/lib/actions/attendance.ts
- src/components/shared/data-table.tsx

Create a GitHub-style attendance heatmap component:
1. Grid: Rows = children names (sticky left column), Columns = days of the month (1-31). Each cell is a colored dot.

2. Color legend:
   - 🟢 Green: Present (daily report completed)
   - 🔴 Red: Absent (absence report exists)
   - 🟣 Purple: No Report (child status unknown, report missing)

3. CRITICAL "Magic" workflow: Clicking a Purple dot opens a slide-out Sheet (shadcn) containing the Daily Report form. It must PREFILL:
   - Child ID from the row
   - Date from the column
   This lets teachers fill missing reports without leaving the page.

4. Month/Branch/Class filters at the top.

5. Server action: getMonthlyAttendanceGrid(month, year, branchId?, classId?) that returns the grid data efficiently using Prisma queries.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: create monthly attendance heatmap with click-to-fill missing reports"
```
'

run_phase "Phase 19 — Children Enrollment: 5-Step Wizard" '
You are a Senior Frontend Engineer. Read overnight-features-spec.md FEATURE 13 section 2.

The child form already exists at src/components/children/child-form.tsx (1761 lines). ENHANCE it as a 5-step wizard, do NOT rewrite from scratch.

Read:
- src/components/children/child-form.tsx (scan structure, identify existing sections)
- src/lib/validations/child.ts

Enhance to a stepped wizard layout:
1. Add step navigation at the top (Step 1 of 5, Step 2 of 5, etc.) with progress indicator
2. Organize existing fields into 5 steps:
   - Step 1: Core Child Info (name, DOB, gender, nationality, branch, language, joining date)
   - Step 2: Addresses & Family (useFieldArray for addresses, parents, siblings, authorized persons)
   - Step 3: General & Medical (school context, health, logistics, milk tracker, routines)
   - Step 4: Financial Info (fee categories with live Net$ calculator: Base Amount - Discount% + TVA%)
   - Step 5: Attachments (Photo, ID, Vaccination Card, Doctor Assessment, Medical Report — drag-drop zone)

3. Add Next/Previous buttons at the bottom of each step. Validate the current step before allowing Next.

4. Show a step summary sidebar on desktop (left side) showing completion status of each step.

Do NOT delete any existing fields. Only reorganize into steps and add any missing fields from the spec.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance child enrollment as 5-step wizard with live fee calculator"
```
'

run_phase "Phase 20 — Child Profile: CRM Dashboard" '
You are a Senior Frontend Engineer. Read overnight-features-spec.md FEATURE 13 section 3.

Read:
- src/app/(app)/children/[id]/page.tsx
- src/app/(app)/children/[id]/dashboard/page.tsx (if exists)
- src/components/children/child-sub-nav.tsx

Enhance the individual child profile page:
1. Profile Card (sidebar or top section): Large rounded avatar, status badge (Active/Inactive), info grid: Age (calculated from DOB), Joining Age, Blood Type, Allergies (red highlight), Parents names & phone numbers, Authorized pickups.

2. Quick Actions bar: [+ New Call Report], [+ New Accident Report], [Child Calendar], [Send Message] as prominent buttons.

3. Health & Attendance KPIs row: Total Payments ($), Total Attendance vs Absence, Missing Daily Reports count, Missing Absent Reports count, small donut chart (Present vs Absent ratio).

4. Tabbed historical data: Daily Reports tab, Absence Reports tab, Medical Reports tab (with completion badges), Assessments tab (with age bracket completion status).

Enhance the existing child detail page. Use the sub-nav component for tab navigation.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance child profile as CRM dashboard with KPIs and tabbed history"
```
'

run_phase "Phase 21 — Classes + Teacher Profile Form" '
You are a Senior Full-Stack Engineer. Read overnight-features-spec.md FEATURE 14.

Read:
- src/components/classes/classes-client.tsx
- src/components/employees/employee-form-client.tsx (first 200 lines)
- prisma/schema.prisma (Class, Teacher models)

Task 1: Enhance class form to include ALL fields: Class Image (drag-drop upload), Branch (select), Class Name, Class Language, Age From (Years + Months), Age To (Years + Months), Camera Number, Max Students.

Task 2: Enhance the employee form (which is shared across teacher/nurse/doctor/manager) to organize as 6-section tabbed layout:
- Section A: Account & Core Info (username, personal details, medical case)
- Section B: Contact & Address (address selects, phone, email)
- Section C: Education & Languages (degrees, CNSS, language proficiency matrix)
- Section D: Experience (dynamic arrays: work, internship, workshop — useFieldArray)
- Section E: Placement (remarks, active status, branch, class)
- Section F: Compliance Documents (contract, medical test, first aid, certificates — each with file upload + expiry date)

Use vertical tabs on desktop. The form is already 921 lines — reorganize into sections with tab navigation, dont add unnecessary code.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance class form and teacher profile as 6-section tabbed layout"
```
'

run_phase "Phase 22 — Branch Compliance: Ministry Form" '
You are a Senior Full-Stack Engineer. Read overnight-features-spec.md FEATURE 15 section 3.

CRITICAL: All UI labels in this form MUST be in Arabic. English only for code/schema.

Read:
- src/app/(app)/branches/[id]/compliance/page.tsx
- src/components/branches/branch-compliance-form.tsx
- prisma/schema.prisma (BranchCompliance model)

Enhance the compliance form as a Vertical Tabs / Stepper with these sections:

Header (static display):
الجمهورية اللبنانية / وزارة الصحة العامة / مديرية الوقاية الطبية / دائرة صحة الأم والولد والمدارس

Section A: Legal Entity (radio: شخص طبيعي / شخص معنوي)
Section B: Owner Info (الاسم, اسم الأب, العائلة, اسم الأم, شهرة الأم, تاريخ الولادة, محل الولادة, الجنسية, رقم السجل)
Section C: Nursery Name (بالعربية, باللاتينية)
Section D: Nursery Address (المحافظة, القضاء, البلدة, المنطقة العقارية, رقم العقار, القسم, الشارع, المبنى, الطابق, رقم الهاتف, الفاكس, البريد الإلكتروني, الرمز البريدي)
Section E: Staff Compliance (read-only tables pulling from employees module)
Section F: Ministry Attachments (7 required docs, each with file upload + title + expiry date)

If the BranchCompliance model doesnt have all these fields, add them to schema and run prisma db push.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: enhance ministry compliance form with Arabic labels and all sections"
```
'

run_phase "Phase 23 — Admin Organization Management Panel" '
You are a Senior Full-Stack Engineer. There is NO self-service signup. The platform owner manually onboards every nursery.

Read:
- src/lib/require-org.ts
- src/lib/actions/branches.ts (for CRUD action patterns)
- src/app/(app)/settings/page.tsx
- prisma/schema.prisma (Organization, User models)

Create src/lib/actions/organizations.ts with server actions:
1. getOrganizations() — ADMIN only. List all orgs with branch count, user count, plan, isActive.
2. getOrganization(id) — ADMIN only. Full details with branches and users.
3. createOrganization(data) — Creates org + default branch + default school year + first admin user with temp password (hashed with bcryptjs). Returns org and temp password.
4. updateOrganization(id, data) — Update name, slug, plan, isActive.
5. toggleOrganizationStatus(id) — Toggle isActive.
6. createOrgUser(orgId, data) — Create a user in an org with temp password.
7. resetUserPassword(userId) — Generate new temp password.

Create pages:
- src/app/(app)/settings/organizations/page.tsx — Table of all orgs
- src/app/(app)/settings/organizations/[id]/page.tsx — Org detail with users table

Add "Organizations" link to settings nav (ADMIN only).

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: add admin organization management panel"
```
'

run_phase "Phase 24 — Global Search Wiring + Class Filter Fix" '
You are a Senior Full-Stack Engineer.

Read:
- src/components/layout/global-search.tsx
- src/lib/actions/search.ts
- src/components/children/child-form.tsx (find the class dropdown section)
- src/lib/actions/classes.ts

Task 1: Wire the command palette (global-search.tsx) to the real globalSearch server action:
- Debounced search (300ms)
- Results grouped by type: Children (name, class, branch → /children/[id]), Staff (name, branch → /employees/staff)
- Icons per type, loading spinner, "No results" state
- Keep existing keyboard shortcut (Cmd+K) and quick nav items

Task 2: Fix class dropdown in child form — must filter by selected branchId. When branch changes, refetch classes for that branch and clear selected classId.

Task 3: Same fix in employee form if applicable — class dropdown should filter by branch.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "feat: wire global search and fix class dropdown branch filtering"
```
'

# ═══════════════════════════════════════════════
# BLOCK 3: CREATIVE DIRECTION & BRANDING (Phases 25-37)
# ═══════════════════════════════════════════════

run_phase "Phase 25 — Research: Top Nursery App Designs Worldwide" '
You are a Senior Creative Director specializing in childcare/education software. Your task is to research the best nursery and childcare management app designs worldwide and document findings.

Use web search to research these topics:
1. "best nursery management app UI design 2025 2026"
2. "childcare app design inspiration dribbble behance"
3. "daycare software modern interface design"
4. "Apple design language for education apps"
5. "best SaaS dashboard design for schools nurseries"

Find and document:
- Top 5-10 nursery/childcare apps with great design (HiMama/Lillio, Brightwheel, Famly, KidsVista, Procare, etc.)
- What makes their UIs successful (color choices, layout patterns, navigation, mobile-first)
- Common design patterns across the best apps (rounded cards, playful icons, warm colors, simple navigation)
- What "Apple for nurseries" means: clean, intuitive, delightful, professional yet warm

Write your findings to a file: docs/design-research.md

Include specific observations about:
- Color palettes used (specific hex codes if possible)
- Typography choices
- Layout patterns (sidebar vs top nav, card grids vs tables)
- Icon styles (line, filled, duotone)
- What makes them feel "human" and "playful" without being childish

Do NOT change any code in this phase. Research only.

Commit:
```
git add docs/design-research.md && git commit -m "docs: nursery app design research findings"
```
'

run_phase "Phase 26 — Research: Color Psychology for Childcare" '
You are a Senior Brand Designer specializing in color theory for childcare environments.

Use web search to research:
1. "color psychology childcare nursery environments"
2. "best color palette for nursery management software"
3. "warm playful professional color scheme education apps"
4. "accessible color palette WCAG childcare"
5. "modern SaaS color palette 2025 2026 playful"

Read: docs/design-research.md (from previous phase)

Create a comprehensive color palette document at docs/color-palette.md:

Requirements for the palette:
- Must feel warm, playful, professional, and human (NOT corporate, NOT childish)
- Think "Apple meets nursery" — clean, premium, with pops of color
- Primary color: something warm and inviting (NOT terracotta, NOT basic blue)
- Background: clean and bright (NOT cream/parchment — something fresher)
- Accent colors: playful but coordinated (for different modules: health=green, attendance=blue, alerts=amber, etc.)
- Sidebar: modern, could be light or dark depending on research findings
- Must pass WCAG AA contrast ratios

Document:
- Primary, secondary, accent colors with hex values
- Background, surface, border colors
- Semantic colors (success, warning, error, info)
- Module-specific accent colors
- Light/dark mode considerations
- Contrast ratio verification

Do NOT change any code. Research and document only.

Commit:
```
git add docs/color-palette.md && git commit -m "docs: color palette research for nursery brand"
```
'

run_phase "Phase 27 — Research: Typography for Nursery Apps" '
You are a Senior Type Designer / Brand Typographer.

Use web search to research:
1. "best fonts for nursery education apps 2025"
2. "playful professional typeface pairing SaaS"
3. "rounded friendly font for childcare software"
4. "Google Fonts best for education dashboard"
5. "Apple SF Pro alternative warm friendly fonts"

Read: docs/design-research.md and docs/color-palette.md

Create docs/typography-guide.md with:

1. Font selection (2-3 fonts max):
   - Display/heading font: something with personality, warm, rounded but not childish
   - Body font: highly readable, clean, works at 14-16px
   - Mono font (optional): for IDs, codes, numbers

2. For each font: name, Google Fonts URL (or CDN), weight range needed, what makes it right for this app

3. Type scale: specific sizes for h1-h6, body, small, caption
4. Line heights and letter spacing recommendations
5. Font pairing rationale

Requirements:
- Must be FREE (Google Fonts or similar)
- Must support Arabic text (the compliance forms are in Arabic)
- Must feel modern, friendly, and readable
- NOT Inter, NOT Roboto, NOT system fonts — something with character

Do NOT change any code. Research and document only.

Commit:
```
git add docs/typography-guide.md && git commit -m "docs: typography research and font selection guide"
```
'

run_phase "Phase 28 — Create Design System: Token Architecture" '
You are a Senior Design Systems Engineer.

Read these research docs:
- docs/design-research.md
- docs/color-palette.md
- docs/typography-guide.md

Also read the current design system:
- src/app/globals.css

Create docs/design-system.md — the comprehensive design system specification:

1. COLOR TOKENS: Map the researched palette to CSS custom properties:
   - --background, --foreground, --card, --card-foreground
   - --primary, --primary-foreground (the main brand color)
   - --secondary, --secondary-foreground
   - --muted, --muted-foreground
   - --accent, --accent-foreground
   - --destructive, --destructive-foreground
   - --border, --input, --ring
   - --sidebar, --sidebar-foreground, --sidebar-primary, etc.
   - --chart-1 through --chart-5
   - Module accents: --color-health, --color-attendance, --color-finance, --color-alerts

2. TYPOGRAPHY TOKENS: Font families, sizes, weights, line heights

3. SPACING: Base unit, scale (4px grid)

4. RADIUS: Border radius scale (sm, md, lg, xl)

5. SHADOWS: Elevation scale (sm, md, lg) — warm-tinted shadows, not pure black

6. TRANSITIONS: Standard easing, durations

7. COMPONENT PATTERNS: Card style, button style, input style, badge colors

This document becomes the source of truth. Include exact CSS custom property declarations ready to paste into globals.css.

Commit:
```
git add docs/design-system.md && git commit -m "docs: comprehensive design system token architecture"
```
'

run_phase "Phase 29 — Implement Design System: globals.css" '
You are a Senior Design Systems Engineer implementing the new brand.

Read:
- docs/design-system.md (the token spec from previous phase)
- docs/typography-guide.md (font choices)
- src/app/globals.css (current file to replace)

Rewrite src/app/globals.css with the new design system:

1. Import the chosen Google Fonts (from typography guide)
2. Replace ALL color tokens in :root with the new palette from design-system.md
3. Set the new font families
4. Update the base styles (body, headings, links)
5. Keep ALL existing utility classes that components depend on (.print-only, etc.)
6. Keep the @layer structure and Tailwind directives
7. Update the sidebar dark variant colors
8. Update chart colors
9. Keep print styles intact

Also update src/app/layout.tsx if font imports need to change (Next.js font optimization).

IMPORTANT: Do NOT break existing components. The new tokens must map to the same CSS variable names so shadcn/ui components automatically pick up the new colors.

Run: npx tsc --noEmit
Start dev server briefly to verify the app loads with new colors:
```
pkill -f "next dev" || true
sleep 2
pnpm exec next dev --port 3334 &
sleep 12
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/login
pkill -f "next dev" || true
```

Commit:
```
git add -A && git commit -m "design: implement new playful nursery design system in globals.css"
```
'

run_phase "Phase 30 — Implement: shadcn/ui Component Tokens" '
You are a Senior Design Systems Engineer applying the new brand to components.

Read:
- docs/design-system.md
- src/components/ui/button.tsx
- src/components/ui/card.tsx
- src/components/ui/badge.tsx
- src/components/ui/input.tsx

Update shadcn/ui component variants to match the new design:

1. button.tsx: Ensure variants use the new primary color. Add any custom variant needed (e.g., "playful" with rounded-full and slight shadow).

2. card.tsx: Update default card styling — ensure warm shadows (not pure black), proper border radius from design system.

3. badge.tsx: Update color variants to use the new module-specific accent colors (health=green, attendance=blue, alerts=amber, finance=emerald, etc.)

4. input.tsx: Ensure focus rings use the new primary color. Proper border color from tokens.

5. Also update: dialog.tsx, sheet.tsx, select.tsx, tabs.tsx if they need brand-specific tweaks.

Do NOT fundamentally change component APIs. Only update colors, shadows, border-radius, and hover states to match the new design system.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "design: update shadcn/ui components with new brand tokens"
```
'

run_phase "Phase 31 — Implement: Logo & Brand Identity" '
You are a Senior Brand Designer implementing the visual identity.

Read:
- docs/design-system.md
- src/components/layout/header.tsx (find the logo)
- src/components/layout/app-sidebar.tsx (find the logo)
- src/app/(auth)/login/page.tsx (find the logo)
- public/manifest.json (or next.config.ts for PWA)

Tasks:
1. Update the KiddzOnline logo styling in header and sidebar. The logo text should use the new brand font and primary color. If theres an SVG logo, update its colors.

2. Create or update the favicon. Use a simple, recognizable mark in the primary brand color. Create public/icon.svg (or update existing).

3. Update PWA manifest (public/manifest.json):
   - name: "KiddzOnline"
   - short_name: "Kiddz"
   - theme_color: [new primary color]
   - background_color: [new background color]

4. Update the login page logo and branding to match the new design.

5. Ensure the footer copyright uses the new brand styling.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "design: update logo, favicon, and brand identity across app"
```
'

run_phase "Phase 32 — Design: Login & Auth Pages" '
You are a Senior UI Designer creating a memorable first impression.

Read:
- docs/design-system.md
- docs/color-palette.md
- src/app/(auth)/login/page.tsx
- src/app/(auth)/forgot/page.tsx

Redesign the login page:
1. Clean, centered card with the new brand colors
2. KiddzOnline logo prominently at top
3. Warm, inviting background (gradient or subtle pattern, NOT flat white)
4. Email and password fields with the new input styling
5. Primary-colored submit button with proper hover state
6. "Forgot password?" link
7. Subtle playful element (maybe a small illustration or icon)
8. Mobile-responsive

Redesign the forgot password page to match.

The login page is the first thing users see — it must feel warm, professional, and easy.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "design: redesign login and auth pages with new brand"
```
'

run_phase "Phase 33 — Design: Sidebar Navigation" '
You are a Senior UI/UX Designer redesigning the main navigation.

Read:
- docs/design-system.md
- src/components/layout/app-sidebar.tsx

Redesign the sidebar:
1. Apply the new brand colors (light or dark based on design research findings)
2. Clean grouping of nav sections (Overview, Daily Ops, Children, Health, Finance, Settings)
3. Modern active state indicator (subtle background highlight + left border or colored icon)
4. Badge counts with the new accent colors
5. Proper icon sizing and spacing
6. Logo at the top with proper brand treatment
7. Smooth hover transitions
8. Collapsible sections on mobile
9. User info at the bottom

The sidebar should feel like a premium app — clean lines, intentional spacing, purposeful color use. NOT heavy or cluttered.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "design: redesign sidebar navigation with new brand"
```
'

run_phase "Phase 34 — Design: Header & Mobile Nav" '
You are a Senior UI Designer.

Read:
- docs/design-system.md
- src/components/layout/header.tsx
- src/components/layout/mobile-nav.tsx
- src/components/layout/branch-year-selector.tsx

Redesign the header:
1. Clean, minimal header with the new brand
2. Logo/app name on the left
3. Branch/Year selector styled with the new tokens
4. Search bar (Cmd+K trigger) styled as a subtle pill
5. Notification bell + inbox icon with badge counts
6. User avatar + dropdown
7. Frosted glass or clean background effect
8. Proper height (not too tall, not cramped)

Redesign the mobile bottom nav:
1. Clean tab bar with the new brand icons
2. Active state with primary color
3. 4-5 key items: Dashboard, Children, Reports, Messages, More
4. Proper safe area padding for iPhone

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "design: redesign header and mobile navigation"
```
'

run_phase "Phase 35 — Design: Dashboard Page" '
You are a Senior UI Designer creating the most important page.

Read:
- docs/design-system.md
- src/app/(app)/dashboard/page.tsx
- src/components/dashboard/stat-card.tsx
- src/components/dashboard/status-board.tsx
- src/components/dashboard/action-center.tsx

Redesign the entire dashboard with the new brand:
1. Morning greeting section: warm, personal, shows date and weather-like context
2. KPI stat cards: elevated with subtle shadows, module-specific accent colors
3. Status board / compliance row: clear semantic colors (green=good, amber=warning, red=action needed)
4. Charts: update Recharts colors to match new palette
5. Action center 3x3 grid: clean cards with icons and counts
6. Overall layout: proper spacing, visual hierarchy, breathing room
7. Make it feel like opening a friendly dashboard, not a spreadsheet

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "design: redesign dashboard page with new brand"
```
'

run_phase "Phase 36 — Design: Data Tables & List Pages" '
You are a Senior UI Designer modernizing all list/table pages.

Read:
- docs/design-system.md
- src/components/shared/data-table.tsx
- src/components/children/children-page-client.tsx (first 100 lines for structure)
- src/components/layout/page-header.tsx

Update the shared data table component:
1. Rounded corners on the table container
2. Subtle row hover states with the new accent color
3. Proper header styling (sticky, slightly darker background)
4. Badge/status column styling with new colors
5. Action buttons with new primary color
6. Pagination with new styling

Update the page header component:
1. Clean breadcrumbs
2. Title with proper typography
3. Action buttons area

Apply consistently across: children list, employees list, daily reports list, medical records list. Read each page briefly to ensure the data-table styles cascade properly.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "design: redesign data tables, list pages, and page headers"
```
'

run_phase "Phase 37 — Design: Forms & Dialogs" '
You are a Senior UI Designer making forms beautiful and easy to use.

Read:
- docs/design-system.md
- src/components/ui/form-section.tsx
- src/components/ui/dialog.tsx
- src/components/ui/sheet.tsx

Redesign form patterns:
1. Form sections: clean card containers with subtle borders, section titles with the new typography
2. Input fields: proper sizing (not too small), clear labels, focus states with primary color ring
3. Select dropdowns: styled with new colors
4. Radio groups / checkboxes: properly sized for touch, using brand colors
5. Date pickers: calendar popover with brand colors
6. Form buttons: primary action stands out, secondary is muted, destructive is red
7. Error states: clear red borders with error messages below fields
8. Disabled states: properly grayed out

Update dialog/sheet patterns:
1. Clean header with title
2. Proper padding and spacing
3. Footer with action buttons
4. Overlay/backdrop styling

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "design: redesign forms, dialogs, and input patterns"
```
'

# ═══════════════════════════════════════════════
# BLOCK 4: UX EXPERT REDESIGN (Phases 38-49)
# ═══════════════════════════════════════════════

run_phase "Phase 38 — UX Research: Nursery Software Best Practices" '
You are a Senior UX Researcher specializing in childcare management software.

Use web search to research:
1. "nursery management software UX best practices"
2. "childcare app usability study findings"
3. "teacher daily workflow nursery app"
4. "SaaS onboarding best practices education"
5. "dashboard information hierarchy best practices"

Write docs/ux-research.md with findings on:
- How teachers actually use nursery apps (their daily workflow, pain points, time constraints)
- Best navigation patterns for multi-role apps (manager vs teacher vs nurse views)
- Form design for high-frequency data entry (daily reports happen 20+ times/day)
- Dashboard design for "morning briefing" use case
- Mobile-first considerations (teachers use tablets/phones, not desktops)
- Accessibility for Arabic text (RTL considerations)
- Key UX principles: reduce clicks, surface what matters, forgive errors

Also read the current app structure:
- src/components/layout/app-sidebar.tsx (navigation structure)
- src/app/(app)/dashboard/page.tsx

Document specific UX improvements for KiddzOnline based on the research.

Commit:
```
git add docs/ux-research.md && git commit -m "docs: UX research findings for nursery management software"
```
'

run_phase "Phase 39 — UX: Navigation & Information Architecture" '
You are a Senior UX Architect redesigning the apps information architecture.

Read:
- docs/ux-research.md
- src/components/layout/app-sidebar.tsx
- src/app/(app)/layout.tsx

Improve the navigation:
1. Reorganize sidebar sections based on user workflow priority:
   - Quick Access: Dashboard, Today View
   - Daily Operations: Daily Reports, Attendance, Food Calendar (what teachers use every day)
   - Children: All Children, Enrollments, Assessments
   - Health: Medical Records, Vaccinations, Accidents, Conditions
   - Communication: Messages, Notifications
   - Finance: Accounting, Payments
   - Management: Branches, Classes, Employees, School Years
   - Settings: at the bottom

2. Add contextual quick-actions: "New Daily Report" shortcut in the sidebar for teachers

3. Improve breadcrumb navigation in the page header — always show the path back

4. Add a "Recently Visited" section or quick-jump feature

5. Ensure the sidebar collapses properly on tablet (icon-only mode)

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: reorganize navigation and information architecture"
```
'

run_phase "Phase 40 — UX: Search & Command Palette" '
You are a Senior UX Engineer improving search and discovery.

Read:
- src/components/layout/global-search.tsx
- src/lib/actions/search.ts

Improve the command palette (Cmd+K):
1. Prominent search trigger in the header (not just a small icon)
2. Recent searches shown when opening with empty query
3. Search results grouped by type with clear visual hierarchy:
   - Children: avatar, name, class, branch → links to profile
   - Staff: avatar, name, role, branch → links to profile
   - Quick Actions: "New Daily Report", "New Child", "View Calendar" etc.
4. Keyboard navigation (up/down arrows, enter to select)
5. Loading state with skeleton results
6. "No results found" with helpful suggestions

Also add contextual search on list pages:
- Children list: inline search filter that works without full page reload
- Employees list: same pattern

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: improve search and command palette experience"
```
'

run_phase "Phase 41 — UX: Forms — Child Enrollment & Daily Reports" '
You are a Senior UX Designer optimizing the two most important forms.

Read:
- docs/ux-research.md
- src/components/children/child-form.tsx (scan first 200 lines for structure)
- src/components/daily-reports/daily-report-form.tsx (scan first 200 lines)

Improve the child enrollment wizard UX:
1. Clear step indicator with labels (not just dots)
2. Show a completion percentage
3. Required fields marked with subtle asterisk
4. Inline validation — show errors as user types, not after submit
5. Auto-save draft between steps (save to localStorage or server)
6. "Save as Draft" button visible at all times
7. Summary review before final submit

Improve the daily report form UX:
1. The Present/Absent toggle must be HUGE and obvious (first thing teachers see)
2. Color-coded section islands: Meals=warm, Sleep=blue, Hygiene=green, Health=red
3. Portion selectors: use visual icons (plate full, half plate, etc.) not just text labels
4. Time pickers: default to current time for convenience
5. "Copy from yesterday" quick action for recurring data
6. Touch-friendly for tablet use (minimum 44px tap targets)

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: improve child enrollment wizard and daily report form usability"
```
'

run_phase "Phase 42 — UX: Tables & Data Display" '
You are a Senior UX Designer improving data consumption patterns.

Read:
- src/components/shared/data-table.tsx
- src/components/children/children-columns.tsx
- src/components/employees/employee-columns.tsx

Improve the data table experience:
1. Column visibility toggle — let users hide/show columns
2. Bulk selection with "Select All" and bulk actions (delete, export, change status)
3. Row click navigates to detail (entire row is clickable, not just an action button)
4. Sticky first column on horizontal scroll
5. Status columns use colored badges consistently
6. Avatar + name columns show tooltip with extra info on hover
7. Proper empty state when no data matches filters
8. Loading skeleton that matches table structure
9. Column sorting with clear visual indicator (arrow icon)
10. Filter chips at the top showing active filters with [x] to remove

Apply these improvements to the shared data-table component so ALL list pages benefit.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: improve data table with column visibility, bulk actions, and better filtering"
```
'

run_phase "Phase 43 — UX: Empty States & Error States" '
You are a Senior UX Designer creating delightful empty and error states.

Read:
- src/components/ui/empty-state.tsx
- src/app/(app)/error.tsx (or global error boundary)

Create beautiful, helpful empty states:
1. Update or create src/components/ui/empty-state.tsx with:
   - A friendly illustration or icon (not just text)
   - Context-specific message ("No children enrolled yet")
   - Clear call-to-action button ("Add your first child")
   - Appropriate for each module

2. Add empty states to key pages (read each page first):
   - Children list when empty: "No children yet. Start by enrolling your first child!"
   - Daily reports when empty: "No reports for today. Start creating daily reports!"
   - Messages when empty: "Your inbox is empty"
   - Attendance when empty: "No attendance records for this period"

3. Improve error states:
   - The "Something went wrong" error page should be friendly, not scary
   - Add a helpful message and "Go to Dashboard" button
   - Add a "Report this issue" link
   - Use warm colors, not aggressive red

4. 404 page: Create a friendly not-found page at src/app/not-found.tsx

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: add friendly empty states, error states, and 404 page"
```
'

run_phase "Phase 44 — UX: Loading States & Skeletons" '
You are a Senior UX Designer polishing loading experiences.

Read:
- src/components/skeletons/table-page-skeleton.tsx
- src/components/skeletons/form-page-skeleton.tsx
- src/components/skeletons/card-grid-skeleton.tsx

Improve loading states across the app:
1. Update skeleton components to use proper shimmer animation (NOT just static gray blocks):
   ```css
   @keyframes shimmer {
     0% { background-position: -200% 0; }
     100% { background-position: 200% 0; }
   }
   ```
   Background: linear-gradient(90deg, muted 25%, slightly-lighter 50%, muted 75%)
   Animation: shimmer 1.5s infinite

2. Ensure skeletons match the ACTUAL layout of each page:
   - Dashboard skeleton: stat cards + chart placeholders + action grid
   - Children list skeleton: filters + table rows with avatar placeholders
   - Form skeleton: section cards with input field placeholders
   - Profile skeleton: sidebar + tabs + content area

3. Add Suspense boundaries with skeleton fallbacks on key pages if not already present.

4. Add subtle fade-in transition when real content replaces skeleton (150ms ease-out).

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: improve skeleton loaders with shimmer animation and page-matched layouts"
```
'

run_phase "Phase 45 — UX: Mobile Responsive" '
You are a Senior Mobile UX Designer ensuring the app works on tablets and phones.

Read:
- src/components/layout/mobile-nav.tsx
- src/components/layout/mobile-more-sheet.tsx
- src/app/globals.css (check for responsive breakpoints)
- src/components/dashboard/stat-card.tsx

Check and fix mobile responsiveness:
1. Dashboard: stat cards should stack on mobile (1 column), 2 columns on tablet
2. Data tables: horizontal scroll with sticky first column on mobile
3. Forms: full-width inputs on mobile, proper spacing
4. Sidebar: hidden on mobile, sheet/drawer on hamburger tap
5. Bottom nav: 5 tabs max, proper safe area padding (iPhone notch)
6. Dialogs/sheets: full-screen on mobile, centered on desktop
7. Touch targets: minimum 44px height for all tappable elements
8. Font sizes: readable on small screens (minimum 14px body)

Read 2-3 list page components and form components. Fix any that break on mobile widths (< 768px).

Add responsive Tailwind classes where missing (sm:, md:, lg: breakpoints).

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: fix mobile responsive issues across dashboard, tables, and forms"
```
'

run_phase "Phase 46 — UX: Micro-interactions & Transitions" '
You are a Senior Motion Designer adding polish and delight.

Read:
- src/app/globals.css
- src/components/ui/button.tsx
- src/components/layout/app-sidebar.tsx

Add subtle, purposeful micro-interactions:
1. Page transitions: add a subtle fade-in when navigating between pages. In layout.tsx or a wrapper component, add: opacity transition 150ms on content area.

2. Button hover states: slight scale (1.02) on hover, subtle shadow increase. Active state: scale(0.98) for a satisfying click feel.

3. Card hover: subtle lift (translate-y -1px + shadow increase) on interactive cards (stat cards, action center items).

4. Sidebar: smooth expand/collapse transition (width animation 200ms ease).

5. Toast notifications: slide in from top-right with spring animation.

6. Form submission: button loading state with spinner animation.

7. Badge count updates: brief pulse/scale animation when count changes.

8. Tab switching: content cross-fade (150ms).

Keep animations SUBTLE and fast (100-300ms). Nothing should feel slow or bouncy. Think Apple — refined, almost invisible, but it feels great.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: add subtle micro-interactions and transitions"
```
'

run_phase "Phase 47 — UX: Accessibility" '
You are a Senior Accessibility Engineer ensuring WCAG 2.1 AA compliance.

Read:
- src/app/globals.css (color contrast check)
- src/components/ui/button.tsx
- src/components/layout/app-sidebar.tsx
- src/components/shared/data-table.tsx

Fix accessibility issues:
1. Color contrast: Verify all text/background combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Fix any that fail.

2. Focus indicators: Every interactive element must have a visible focus ring. Use the primary color ring with 2px offset.

3. Keyboard navigation: Ensure all major workflows work with Tab + Enter:
   - Sidebar navigation
   - Form inputs
   - Data table rows and actions
   - Dialog open/close
   - Dropdown menus

4. ARIA labels: Add aria-label to icon-only buttons, aria-describedby for form errors, role="alert" for error messages.

5. Screen reader: Ensure page headings use proper h1-h6 hierarchy (only one h1 per page).

6. Reduced motion: Add @media (prefers-reduced-motion: reduce) to disable animations for users who prefer it.

7. Arabic text support: Ensure RTL direction works for Arabic content in compliance forms. Add dir="rtl" to Arabic text containers.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: fix accessibility issues — contrast, focus, keyboard nav, ARIA"
```
'

run_phase "Phase 48 — UX: Print Views" '
You are a UX Engineer ensuring all print views work perfectly.

Read:
- src/app/globals.css (existing @media print styles)
- src/app/(app)/daily-reports/[id]/print/page.tsx
- src/app/(app)/food/calendar/print/page.tsx

Verify and fix print views:
1. Daily report print: clean, professional layout. Shows all report data. No navigation, no sidebar. Proper margins.

2. Food calendar print: month grid with meals clearly labeled. Landscape orientation.

3. Children list print: table format with all relevant columns. No action buttons.

4. Attendance heatmap print: grid with legend. Proper colors even in print.

5. Medical records print: organized sections, no overflow.

Ensure global print styles in globals.css:
- Hide: sidebar, header, footer, mobile nav, action buttons
- Show: content area full-width
- White background, black text
- Proper page margins (1.5cm)
- Page breaks: avoid breaking inside cards/sections

Test by reading each print page and verifying the CSS.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: fix and polish all print views"
```
'

run_phase "Phase 49 — UX: Final Polish Pass" '
You are a Lead UX Designer doing a final consistency and quality pass.

Read these components and look for inconsistencies:
- src/components/dashboard/stat-card.tsx
- src/components/layout/page-header.tsx
- src/components/layout/app-sidebar.tsx
- src/components/shared/data-table.tsx
- src/app/globals.css

Final polish checklist:
1. CONSISTENCY: Verify all pages use the same spacing between sections (consistent padding/margin)
2. TYPOGRAPHY: All headings use the display font, all body text uses the body font consistently
3. COLORS: No remnants of the old terracotta/cream/teal themes anywhere
4. ICONS: Consistent icon library usage (lucide-react) with consistent sizing
5. BADGES: Status badges use consistent colors across all modules
6. BUTTONS: Primary action buttons are consistent size and placement
7. BORDERS: Consistent border color and radius across all cards and containers
8. SHADOWS: Consistent shadow depth across similar elements
9. SPACING: No cramped or overly spacious sections — even visual rhythm
10. Remove any TODO comments, console.logs, or debug code

Fix any inconsistencies found. This is the final visual quality gate.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "ux: final polish pass — consistency, spacing, typography cleanup"
```
'

# ═══════════════════════════════════════════════
# BLOCK 5: QA TESTING (Phases 50-58)
# ═══════════════════════════════════════════════

run_phase "Phase 50 — QA: Auth Flow + Dashboard" '
You are a QA Engineer testing the authentication and dashboard.

Start the dev server:
```
pkill -f "next dev" || true
sleep 2
pnpm exec next dev --port 3334 &
sleep 15
```

Test 1: Login page loads
```
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/login)
echo "Login page: $STATUS"
```

Test 2: Dashboard redirects to login when not authenticated
```
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L http://localhost:3334/dashboard)
echo "Dashboard redirect: $STATUS"
```

Test 3: Read the dashboard page and verify no obvious errors:
- Read src/app/(app)/dashboard/page.tsx — verify all imports resolve
- Read src/lib/actions/dashboard.ts — verify getMorningBriefing has try/catch or graceful error handling
- Verify the stat cards, charts, and action center components are properly imported

Test 4: TypeScript check
```
npx tsc --noEmit 2>&1 | tail -20
```

If any issues found, fix them.

Kill dev server:
```
pkill -f "next dev" || true
```

Commit fixes:
```
git add -A && git commit -m "test: fix issues found in auth and dashboard QA" || echo "No fixes needed"
```
'

run_phase "Phase 51 — QA: Children Module" '
You are a QA Engineer testing the children module end-to-end.

Read and verify these files compile and make sense:
- src/app/(app)/children/page.tsx
- src/app/(app)/children/new/page.tsx
- src/app/(app)/children/[id]/page.tsx
- src/components/children/child-form.tsx (first 100 lines — verify imports)
- src/components/children/children-page-client.tsx (first 50 lines)
- src/lib/actions/children.ts (verify getChildren, getChild, createChild have org scoping)

Check:
1. All imports resolve (no missing files or circular deps)
2. Server actions use requireOrg() or requireOrgSafe()
3. Forms have proper validation (Zod schema)
4. List page uses data-table with proper columns
5. Detail page loads child data with proper error handling

Start dev server and test routes:
```
pkill -f "next dev" || true
sleep 2
pnpm exec next dev --port 3334 &
sleep 15
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/children
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/children/new
pkill -f "next dev" || true
```

Fix any issues found.

Commit:
```
git add -A && git commit -m "test: fix issues found in children module QA" || echo "No fixes needed"
```
'

run_phase "Phase 52 — QA: Daily Reports & Absence Reports" '
You are a QA Engineer testing the reporting modules.

Read and verify:
- src/app/(app)/daily-reports/page.tsx
- src/app/(app)/daily-reports/new/page.tsx
- src/components/daily-reports/daily-report-form.tsx (first 100 lines)
- src/lib/actions/daily-reports.ts (verify org scoping)
- src/app/(app)/absent-reports/page.tsx
- src/lib/actions/absent-reports.ts (verify org scoping)

Check:
1. Daily report form has all required sections (meals, sleep, hygiene, health)
2. Present/Absent toggle works logically
3. Batch food action exists and is functional
4. Absence report form has all required fields
5. Both list pages use data-table with status badges
6. Print page (daily-reports/[id]/print) renders correctly

Test routes:
```
pkill -f "next dev" || true
sleep 2
pnpm exec next dev --port 3334 &
sleep 15
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/daily-reports
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/absent-reports
pkill -f "next dev" || true
```

Fix any issues.

Commit:
```
git add -A && git commit -m "test: fix issues found in reports module QA" || echo "No fixes needed"
```
'

run_phase "Phase 53 — QA: Employees Module" '
You are a QA Engineer testing the employees module.

Read and verify:
- src/app/(app)/employees/teachers/page.tsx
- src/app/(app)/employees/nurses/page.tsx
- src/app/(app)/employees/doctors/page.tsx
- src/app/(app)/employees/managers/page.tsx
- src/components/employees/employee-form-client.tsx (first 100 lines)
- src/lib/actions/employees.ts (verify org scoping)

Check:
1. All 4 employee types have list, create, view, edit pages
2. Shared employee form handles all types correctly
3. 6-section tabbed layout works (if implemented)
4. Document upload sections exist
5. Language matrix exists
6. Experience dynamic arrays exist

Test routes:
```
pkill -f "next dev" || true
sleep 2
pnpm exec next dev --port 3334 &
sleep 15
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/employees/teachers
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/employees/nurses
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/employees/doctors
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/employees/managers
pkill -f "next dev" || true
```

Fix any issues.

Commit:
```
git add -A && git commit -m "test: fix issues found in employees module QA" || echo "No fixes needed"
```
'

run_phase "Phase 54 — QA: Medical Module" '
You are a QA Engineer testing all medical functionality.

Read and verify:
- src/app/(app)/medical/vaccinations/page.tsx
- src/app/(app)/medical/visits/page.tsx (if exists)
- src/app/(app)/medical/conditions/page.tsx
- src/app/(app)/children/[id]/accidents/page.tsx
- src/lib/actions/medical.ts (verify org scoping on all functions)

Check:
1. Vaccination timeline shows correct vaccines and dates
2. Medical visit accordion/stepper form works
3. Accident report form has all fields
4. Suffering form has all assessment categories
5. All medical actions have org scoping

Test routes:
```
pkill -f "next dev" || true
sleep 2
pnpm exec next dev --port 3334 &
sleep 15
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/medical/vaccinations
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/medical/conditions
pkill -f "next dev" || true
```

Fix any issues.

Commit:
```
git add -A && git commit -m "test: fix issues found in medical module QA" || echo "No fixes needed"
```
'

run_phase "Phase 55 — QA: Food, Attendance & Classes" '
You are a QA Engineer testing food calendar, attendance, and classes.

Read and verify:
- src/app/(app)/food/calendar/page.tsx
- src/components/food/food-listing-client.tsx (first 100 lines)
- src/lib/actions/food.ts (verify org scoping)
- src/lib/actions/attendance.ts (verify org scoping)
- src/components/classes/classes-client.tsx (first 100 lines)
- src/lib/actions/classes.ts (verify org scoping)

Check:
1. Food calendar renders month grid properly
2. Click-to-edit modal works for setting meals
3. Attendance heatmap renders (if implemented)
4. Classes list shows proper data with capacity info
5. All actions have org scoping

Test routes:
```
pkill -f "next dev" || true
sleep 2
pnpm exec next dev --port 3334 &
sleep 15
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/food/calendar
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/classes
pkill -f "next dev" || true
```

Fix any issues.

Commit:
```
git add -A && git commit -m "test: fix issues found in food, attendance, classes QA" || echo "No fixes needed"
```
'

run_phase "Phase 56 — QA: Messaging & Notifications" '
You are a QA Engineer testing communication features.

Read and verify:
- src/app/(app)/messages/inbox/page.tsx
- src/app/(app)/messages/compose/page.tsx
- src/lib/actions/messages.ts (verify org scoping)
- src/app/(app)/settings/notifications/page.tsx
- src/components/layout/notification-dropdown.tsx

Check:
1. Inbox loads messages with proper threading
2. Compose page has split-pane layout (or functional compose flow)
3. Recipient selector works with branch/class filters
4. Notification templates tab works (if implemented)
5. Sent logs tab shows historical notifications
6. Notification dropdown in header loads counts properly

Test routes:
```
pkill -f "next dev" || true
sleep 2
pnpm exec next dev --port 3334 &
sleep 15
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/messages/inbox
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/settings/notifications
pkill -f "next dev" || true
```

Fix any issues.

Commit:
```
git add -A && git commit -m "test: fix issues found in messaging and notifications QA" || echo "No fixes needed"
```
'

run_phase "Phase 57 — QA: Accounting, Settings & Compliance" '
You are a QA Engineer testing finance and admin features.

Read and verify:
- src/app/(app)/accounting/page.tsx
- src/lib/actions/accounting.ts (verify org scoping)
- src/lib/actions/payments.ts (verify org scoping)
- src/app/(app)/settings/page.tsx
- src/app/(app)/branches/[id]/compliance/page.tsx
- src/lib/actions/settings.ts (verify org scoping on holiday, event functions)

Check:
1. Accounting page loads with fee tabs
2. Payment modal has all required fields
3. Settings pages load correctly
4. Branch compliance form renders Arabic labels properly
5. Ministry document uploads section exists
6. Holiday calendar renders

Test routes:
```
pkill -f "next dev" || true
sleep 2
pnpm exec next dev --port 3334 &
sleep 15
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/accounting
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/settings
curl -s -o /dev/null -w "%{http_code}" http://localhost:3334/settings/holidays
pkill -f "next dev" || true
```

Fix any issues.

Commit:
```
git add -A && git commit -m "test: fix issues found in accounting and settings QA" || echo "No fixes needed"
```
'

run_phase "Phase 58 — QA: Final Build Verification" '
You are the QA Lead doing the final verification of the entire overnight run.

1. TypeScript check — must pass clean:
```
npx tsc --noEmit 2>&1 | tail -30
```
Fix any errors.

2. Production build — must succeed:
```
pnpm exec next build 2>&1 | tail -40
```
Fix any build errors. Common issues: missing imports, unused vars, type mismatches.

3. If build passes, verify key files:
- Read src/lib/require-org.ts — should export requireOrg and requireOrgSafe
- Read src/lib/require-role.ts — should export requireRole
- Read docs/design-system.md — should have full color palette
- Read src/app/globals.css — should have new design system (NOT terracotta/cream)

4. Grep for leftover old theme colors:
```
grep -rn "#C35A2C\|#F5F0E8\|#2C2420\|terracotta\|sienna\|parchment" src/ --include="*.tsx" --include="*.ts" --include="*.css" | head -20
```
If found, these are remnants of the old Claude theme — remove them.

5. Grep for potential data leaks (queries without org scoping):
```
grep -rn "findMany\|findFirst\|count\|aggregate" src/lib/actions/ --include="*.ts" | grep -v "organizationId\|orgId\|requireOrg\|getOrgBranch\|userId\|// global\|// user-scoped\|province\|district\|region" | head -20
```

6. Commit any final fixes:
```
git add -A && git commit -m "chore: final build verification and cleanup"
```

7. Final push:
```
git push origin ux-improvements
```
'

echo "" >> "$LOG_FILE"
echo "=============================================" >> "$LOG_FILE"
echo "=== ALL 58 PHASES COMPLETE — $(date) ===" >> "$LOG_FILE"
echo "=============================================" >> "$LOG_FILE"
