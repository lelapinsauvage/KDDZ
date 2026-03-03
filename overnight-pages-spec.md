# Overnight Page Restructure — Comprehensive Spec

## Goal
Match every Next.js listing page to the old PHP app's exact columns, filters, and content structure while keeping the modern UI (StatCard, data-table, shadcn, Tailwind).

## Design Rules
- Keep existing UI components (StatCard, data-table, Card, shadcn dialogs, etc.)
- Match the OLD app's table columns, column ORDER, and filter types
- Every listing page: column filters, pagination, action column
- Reference old PHP files at `/Users/karimsaab/Desktop/Garderie-old-backup/Front/templates/admin/`
- Run `npx tsc --noEmit` after every phase
- Commit after every phase

---

## Phase 1: Dashboard Layout Reorder

**Status:** Charts currently at bottom. Need to move between stat card rows.

**Target layout order:**
1. Greeting + DashboardHeader (date range picker)
2. Row 1: Branches, Classes, Children (Overview)
3. Row 2: Charts (Attendance pie, Children Per Class pie, Gender pie) — 3-col grid
4. Row 3: Attendance, Absence, Missing Reports, Missing Absence Reports (Daily Compliance)
5. Row 4: Accounting, Accidents, Calls (Operations)
6. Row 5: Medical Published, Medical Missing, Medical Drafts
7. Row 6: Assessments Published, Assessments Missing, Assessments Drafts

**Files:** `src/app/(app)/dashboard/page.tsx`
**Action:** Move `<DemographicsSection>` from after Row 5 to after Row 1. Update dashboard-skeleton.tsx to match.

---

## Phase 2: Children Listing

**Old:** children.php → **New:** `src/components/children/children-page-client.tsx`, `children-columns.tsx`

**Old columns (exact order):**
1. Image (profile photo, not just initials)
2. First Name (separate column)
3. Last Name (separate column)
4. Date of Birth
5. Branch
6. Class
7. Nationality (MISSING in new — add column)
8. Gender
9. Created Date (MISSING in new — add column)
10. Action (view/edit/delete)

**Current new columns:** Avatar, Full Name (combined), Class, Branch, Gender, DOB, Status, Actions

**Changes needed:**
- Split "Full Name" into separate "First Name" and "Last Name" columns
- Add "Nationality" column after Class
- Add "Created Date" column after Gender
- Reorder to match old: Image → FName → LName → DOB → Branch → Class → Nationality → Gender → Created Date → Action
- Keep Status as additional column (new app improvement)

**Old filters:** Name, Last Name, DOB, Branch dropdown, Class text, Nationality, Gender, Date range
**Current new filters:** Search, Branch, Class, Gender, Status
**Add:** Nationality filter, Date range filter

---

## Phase 3: Daily Reports Listing

**Old:** dailyreports.php → **New:** `src/app/(app)/daily-reports/`

**Old columns:**
1. Image
2. First Name
3. Last Name
4. Status (submitted/draft/missing)
5. Branch
6. Class
7. Report Date
8. Created Date
9. Action

**Old filters:** Name, Status dropdown, Branch dropdown, Class dropdown, Report Date, Date range

**Action:** Match columns and filters. Ensure Status shows old values (submitted/draft/missing/incomplete).

---

## Phase 4: Absent Reports Listing

**Old:** absentreports.php → **New:** `src/app/(app)/absent-reports/`

**Old columns:** Same as daily reports: Image, FName, LName, Status, Branch, Class, Report Date, Created Date, Action

**Old filters:** Name, Status, Branch, Class, Report Date, Date range

**Action:** Match columns and filters. Identical structure to daily reports.

---

## Phase 5: Medical General Info + Suffering + Visits Listings

**Old:** Medical_forms1.php, Medical_forms2.php, Medical_forms3.php
**New:** `src/app/(app)/medical/general/`, `medical/suffering/`, `medical/visits/`

**Old columns (all three):**
1. Image
2. First Name
3. Last Name
4. DOB
5. Branch
6. Class
7. Year (scholastic year)
8. Gender
9. Created Date
10. Action

**Old filters:** Name, DOB, Branch, Class, Year, Gender, Date range

**Action:** Match columns across all three medical listing pages. Add "Year" column if missing.

---

## Phase 6: Vaccinations + Accidents Listings

**Old:** Medical_forms4.php, Medical_forms5.php
**New:** `src/app/(app)/medical/vaccinations/`, `medical/accidents/`

**Vaccinations old columns:**
1. Image
2. First Name
3. Last Name
4. DOB
5. Branch
6. Class
7. Nationality
8. Gender
9. Created Date
10. Action

**Accidents old columns:**
1. Image
2. First Name
3. Last Name
4. Cause
5. Branch
6. Class
7. Place
8. First Aid
9. Date
10. Action

**Action:** Match each page's columns to the old structure. Accidents needs "Cause", "Place", "First Aid" columns specifically.

---

## Phase 7: Employee Listings (Teachers)

**Old:** teachers.php → **New:** `src/components/employees/employee-listing-client.tsx`, `employee-columns.tsx`

**Old columns:**
1. Image
2. First Name
3. Last Name
4. DOB
5. Branch
6. Mobile
7. Nationality
8. Gender
9. Created Date
10. Action

**Current new columns:** Avatar, Full Name, Email, Phone, Branch, Specialization, Hire Date, Status, Actions

**Changes needed:**
- Split Full Name into First Name + Last Name
- Replace Email with DOB
- Replace Phone with Mobile
- Add Nationality column
- Add Gender column
- Replace Hire Date with Created Date
- Keep Status (improvement)
- Reorder to match old

**Old filters:** Name, DOB, Branch dropdown, Mobile, Nationality, Gender
**Current filters:** Single text search only
**Add:** All missing filters (DOB, Branch dropdown, Mobile, Nationality, Gender)

---

## Phase 8: Nurses + Doctors + Managers Listings

**Old:** nurses.php, doctors.php, managers.php → **New:** Same shared employee components

**All three use SAME columns as teachers:**
Image, FName, LName, DOB, Branch, Mobile, Nationality, Gender, Created Date, Action

**Action:** Since these share `employee-columns.tsx` with teachers, Phase 7 should handle all four. Verify all four pages render correctly after Phase 7 changes.

---

## Phase 9: Classes Listing

**Old:** classes.php → **New:** `src/components/classes/classes-client.tsx`

**Old columns:**
1. Image
2. Class Name
3. Language
4. Max Students
5. Branch
6. Created Date
7. Action

**Current new:** Card-based grid (no DataTable)

**Action:** Add a DataTable view option (table/card toggle like children page). Table columns match old. Keep card view as secondary option.

---

## Phase 10: Branches Listing

**Old:** branches.php → **New:** `src/components/branches/branches-client.tsx`

**Old columns:**
1. Image
2. Branch Name
3. Location
4. Mobile
5. Info
6. Created Date
7. Action

**Current new:** Card-based grid with stat cards

**Action:** The new card layout is actually better. Keep cards but ensure all old data fields are visible on cards (Location/Address, Mobile/Phone, Info/Email).

---

## Phase 11: Food Listing

**Old:** food.php → **New:** `src/components/food/food-listing-client.tsx`

**Old columns:** Type, Name, Active (On/Off), Date (Created), Action
**Current new:** Name, Category (badge), Status, Actions

**Changes needed:**
- Add "Created Date" column
- Ensure Type/Category filter matches old (Breakfast/Lunch/Dessert — keep SNACK as improvement)

---

## Phase 12: Calls Module (NEW — Does Not Exist)

**Old:** calls.php + call.php + bcalls.php
**New:** COMPLETELY MISSING

**Old calls listing columns:**
1. Image
2. First Name
3. Last Name
4. Call Type (Incoming/Outgoing)
5. Branch
6. Class
7. Cause
8. Subject
9. Date
10. Action

**Old call form sections:**
1. Call Section: Call Type (Incoming/Outgoing), Date, Time
2. Cause of Call: Cause dropdown
3. Subject Section: Subject, Remarks, Teacher who filled report
4. Attachments

**Action:** This is a MAJOR gap. Need to:
- Check if CallReport model exists in Prisma schema
- If not, this is a schema + feature gap that may be too large for one overnight phase
- At minimum, create a basic listing page and form page stub

---

## Phase 13: Accounting Summary

**Old:** accounting.php → **New:** `src/app/(app)/accounting/`

**Old structure:** 6 tabs (Total, Registration, Monthly, Bus, Xtra-time, Other)
Each tab shows a child × month matrix (Oct-Sep) with payment amounts.

**Current new:** Quick payment dialog exists but missing the summary dashboard.

**Action:** Add summary stat cards (Total Revenue, Pending, Overdue, This Month) above the payment listing. Add fee category filter tabs. The full 12-month matrix may be too complex for one phase — focus on listing with proper columns.

**Old payment columns:** Child Name, Branch, Class, Fee Type, Amount, Method, Date, Status, Action
**Ensure the new listing shows these.**

---

## Phase 14: Class Dashboard (NEW — Does Not Exist)

**Old:** class_dashboard.php (1,957 lines) + js/class_dashboard.js
**New:** COMPLETELY MISSING

**Old class dashboard had 3 tabs with 49 stat cards:**

Tab 1 — Daily Reports (5 cards):
- Birthdays, Without Report, Completed, Incomplete, Drafts

Tab 2 — Medical (16 cards):
- Forms 1-6, each with Published/Incomplete/Drafts

Tab 3 — Assessments (28 cards):
- Assessments 1-7, each with Completed/Without/Incomplete/Drafts

**Action:** Create `/classes/[id]/dashboard/page.tsx` with:
- Class info header (name, branch, teacher, student count)
- StatCards in 3 tab sections using existing StatCard component
- This is a MAJOR feature. Focus on the page structure + stat card layout. Data fetching can use placeholder actions.

---

## Phase 15: Child Dashboard Enhancement

**Old:** child_dashboard.php + js/child_dashboard.js
**New:** `src/app/(app)/children/[id]/dashboard/` (exists but needs enhancement)

**Old stat cards (14):**
1. Check-In/Check-Out (purple)
2. Accident Reports (red)
3. Accounting Total (green)
4. Total Attendance (green)
5. Total Absence (red)
6. Missing Daily Reports (blue-hoki)
7. Missing Absence Reports (blue-hoki)
8. Medical Reports (green)
9. Medical Missing (red-pink)
10. Medical Drafts (blue-hoki)
11. Assessment Published (green)
12. Assessment Missing (red-pink)
13. Assessment Items (red)
14. Assessment Drafts (blue-hoki)

**Old data tables:**
- Nutrition/Feeding table: Date, Breakfast, Lunch, Dessert, Status, Action
- Absence Reports table: Date, Reason, From, To, Action

**Action:** Read current child dashboard page. Add missing stat cards. Add data tables if missing.

---

## Phase 16: Parent Users

**Old:** parent_users.php → **New:** `src/app/(app)/settings/parent-users/`

**Old structure:** TWO separate tables on one page:
Table 1 — Children WITH parent user: Name, Username, Status, Branch, Class, Action
Table 2 — Children WITHOUT parent user: Name, Branch, Class, Action (create user)

**Current new:** Single unified table

**Action:** Verify the two-table structure or ensure the single table clearly distinguishes children with/without parent accounts.

---

## Phase 17: Address Management

**Old:** Zones_Management.php, Areas.php, regions.php
**New:** `src/app/(app)/settings/zones/`, `areas/`, `regions/`

**Missing in new:** Reference Number field in all three pages
**Old had:** Name, Reference Number, Parent entity, Created Date, Action

**Action:** Add "Reference Number" field to zone/area/region forms and listing columns. Add Created Date column to listings.

---

## Phase 18: Messages

**Old:** alarmsMsg.php (inbox), Msg_list.php (sent), message_portal*.php (compose)
**New:** `src/app/(app)/messages/`

**Old inbox columns:** From, Date, Nature, Subject, Message, Status, Actions
**Current new:** From, Subject, Date, Status, Actions

**Missing:**
- "Nature" column (General/Urgent/Legal/Event)
- Date range filter
- Message body preview in listing

**Old compose had:** WhatsApp/SMS toggle checkboxes
**Current new:** Missing WhatsApp/SMS toggles

**Action:** Add Nature column to inbox/sent listings. Add nature filter. Message compose already has nature dropdown — verify it works.

---

## Phase 19: Alarm Pages

**Old:** alarms.php + 12 alarm sub-pages
**New:** `src/app/(app)/alarms/` + sub-routes (ALL 12 TYPES EXIST)

**Status:** All 12 alarm types are implemented. Main gaps:
- Missing action buttons on individual alarm rows
- Missing date range filter
- Missing "Viewed/New" status tracking
- Missing alarm history section on main page

**Action:** Add action buttons (mark as viewed, dismiss) to alarm rows. Add date range filter to alarm pages.

---

## Phase 20: Attendance Heatmap

**Old:** Monthly_report.php + Monthly_report_b.php
**New:** `src/app/(app)/attendance/heatmap/`

**Status:** New is actually BETTER (unified page + interactive purple cells).

**Verify:**
- Legend: Purple (No Report), Green (Present), Pink (Absent), Red (Weekends), Yellow (Holidays)
- Branch + Class filters work
- Month/Year picker works
- Print view works

**Action:** Minor verification phase. Fix any discrepancies with old color coding.

---

## Phase 21: Holiday Calendar + Employee Calendar

**Old:** holiday_calendar.php, calendar.php
**New:** `src/app/(app)/settings/holidays/`, `employees/calendar/`

**Holiday form fields (old):** Description, Repeated/One Time, Date, Notification Subject, Notification Message, Type (Holiday/Strike), Active, Days Before (1-7), Inform Teachers, Send via (WhatsApp/SMS/Both)

**Employee calendar events (old):** Status (Sick/Absent/Day Off/Warning), Reference Number, Date

**Action:** Verify both calendars have proper event creation forms. Add missing fields if needed.

---

## Phase 22: Assessments

**Old:** assessment_1.php through assessment_7.php
**New:** `src/app/(app)/assessments/`, `src/lib/assessment-types.ts`

**Status:** FULLY MODERNIZED. All 7 types defined in single TypeScript config. Reusable form component with tabbed interface. All assessment questions preserved.

**Action:** Verify listing page has proper columns. No major gaps expected.

---

## Phase 23: Employee Attendance Upload + Logs

**Old:** attendance.php (file upload), PA_logs.php (log table)
**New:** `src/app/(app)/employees/attendance/`, `employees/attendance-logs/`

**Old PA_logs columns:** AC No., Name, Log Type, Date Out, Time Out, Date In, Time In, Datetime

**Action:** Verify both pages exist and match structure. Ensure attendance upload form works.

---

## Phase 24: Food Calendar

**Old:** food_calendar.php + printFoodCal.php
**New:** `src/app/(app)/food/calendar/`

**Old features:** FullCalendar with meals per day (Breakfast, Lunch, Early Dinner/Snack, Dessert), per-branch filtering, print button, modal to assign meals.

**Action:** Verify food calendar page exists and has meal assignment UI. Ensure branch filtering works.

---

---

## Phase 25: Daily Report FORM — verify form sections

**Old:** dailyreport.php → **New:** `src/app/(app)/daily-reports/[id]/edit/` or `new/`

**Old daily report form sections:**
1. Attendance Section: Check-in time, Check-out time, Absent (yes/no)
2. Meals Section: Breakfast (portion %), Lunch (portion %), Dessert (portion %)
3. Milk Section: Milk type, Milk portions (ml), Milk scoops, Milk times
4. Sleep Section: Sleep from (time), Sleep to (time), Sleep quality
5. Diaper Section: Number of diapers, Diaper condition notes
6. Mood Section: Mood indicator (happy/normal/sad/crying)
7. Activities Section: Activities notes/textarea
8. Health Section: Temperature, Fever (yes/no), Medicine given, Health notes
9. General Notes: Teacher remarks textarea
10. Status: Submit / Save as Draft

**Action:** Read the current daily report form and verify ALL sections above exist. Add any missing sections.

---

## Phase 26: Absent Report FORM — verify form sections

**Old:** absentreport.php → **New:** `src/app/(app)/absent-reports/[id]/edit/` or `new/`

**Old absent report form sections:**
1. Child Selection (dropdown)
2. Absence Date (date picker)
3. Absence Reason (dropdown: sick, family, travel, other)
4. Absence Period: Date From, Date To
5. Hospital Section: Hospitalized (yes/no), Hospital name, Doctor name
6. Attachments: File uploads (medical certificates, etc.)
7. Notes: Remarks textarea
8. Status: Submit / Save as Draft

**Action:** Read current absent report form. Critical gaps from analysis: missing hospital section, absence period dates, and attachments.

---

## Phase 27: Nursery Settings — government compliance

**Old:** nurseryinfo.php (88KB, massive form) → **New:** `src/app/(app)/settings/nursery/`

**Old nursery settings form — KEY sections:**
1. Government Compliance: Registration number, Registration date
2. Owner Type toggle: Natural Person vs Legal Entity
3. Natural Person: Name, Father's name, Family name, Mother's name, ID number, Nationality, Place of birth, Date of birth
4. Legal Entity: Legal name, Type (company/association/organization/other), Company subtype, Subject/Purpose, Registration details, Authorized representative info
5. Nursery Name: Arabic name, Latin name
6. Address: Country (Lebanon), Governorate (Mouhafaza dropdown), District (Quadaa dropdown), Region dropdown
7. Contact: Phone, Email
8. Hours: Opening/Closing times, Working days
9. Preferences: Default milk, Default diapers

**Current new:** Simplified form with only Name, Email, Address, Phone, Logo, Working Hours, Supplies, Notifications.

**Action:** The government compliance section is CRITICALLY MISSING. Add at minimum: Registration Number, Registration Date, Owner Type fields. The full government form is documented in `/Users/karimsaab/.claude/projects/-Users-karimsaab/memory/government-compliance-form.md`.

---

## Phase 28: New Year Setup (NEW — Does Not Exist)

**Old:** newyear.php → **New:** COMPLETELY MISSING

**Old new year workflow:**
1. Create new academic year (generates new garderie instance name)
2. Optional imports: General Forms, Vaccination Forms, Suffering Forms, Teachers, Nurses, Managers, Doctors, Holidays
3. Mandatory imports: Classes, Branches, Children, Parents
4. Teacher reassignment: Table showing each teacher → select new class
5. Child progression: Table showing each child → select new class + new serial number
6. Submit: Archives current year, creates new year with selected data

**Action:** Create a basic page at `src/app/(app)/settings/new-year/page.tsx` with:
- Year name display
- Checkboxes for optional imports
- Teacher reassignment table (teacher name + current class + new class dropdown)
- Child progression table (child name + current class + new class dropdown)
- Submit button
- This is a complex workflow — create the UI structure with TODO comments for the server actions.

---

## Phase 29: Events/Notification Calendar

**Old:** NotifCalendar.php → **New:** `src/app/(app)/settings/events/`

**Old structure:** FullCalendar with event/notification management. Create/edit events with notifications to parents.

**Action:** Verify the events page has a calendar view with event creation. If it's a stub, add a basic FullCalendar or date-based event list.

---

## Phase 30: Branch Dashboard — verify completeness

**Old:** Branch_Dashboard.php → **New:** `src/app/(app)/branches/[id]/dashboard/`

**Old branch dashboard showed:** Total Classes (link to classesperbranch.php), Total Active Children (link to childrenperbranch.php)

**New branch dashboard shows:** 6 stat cards (Children, Classes, Teachers, Nurses, Doctors, Managers) + Compliance + Documents

**Action:** The new version is BETTER than old. Just verify:
1. All 6 stat cards display correct counts
2. Stat cards link to filtered views (e.g., clicking Classes goes to /branches/[id]/classes)
3. Compliance percentage displays correctly

---

## Phase 31: Invoice/Receipt Printing

**Old:** invo.php → **New:** Likely missing or partial

**Old invoice page:** Receipt/invoice template for printing payment records. Shows: nursery name, child name, payment details, amount, date, receipt number.

**Action:** Check if any print/invoice route exists under accounting. If not, create a basic print-friendly invoice page at `src/app/(app)/accounting/invoice/[id]/page.tsx` that shows payment details in a printable format.

---

## Phase 32: Draft Pages — verify redirects work

**Old:** children_drafts.php, dailyreportsd.php, absentreportsd.php
**New:** `/children/drafts`, `/daily-reports/drafts`, `/absent-reports/drafts`

**Action:** Verify each draft page correctly filters to show only draft items. The new app may use redirects (e.g., /children/drafts → /children?status=DRAFT) or have dedicated pages. Either approach is fine — just verify they work.

---

## General Rules for Each Phase

1. **Read the old PHP file** to understand exact content
2. **Read the current Next.js page** to understand what exists
3. **Match columns/content** — add missing columns, reorder to match old
4. **Keep the modern UI** — use existing data-table, StatCard, Card components
5. **Run `npx tsc --noEmit`** at the end
6. **Commit** with descriptive message
