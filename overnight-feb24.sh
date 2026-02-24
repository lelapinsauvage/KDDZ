#!/bin/bash
# Overnight Script — Feb 24, 2026
# NO set -e — we want to continue on failure
cd /Users/karimsaab/Desktop/garderie
LOG_FILE="./overnight-feb24-log.txt"

echo "=== OVERNIGHT SCRIPT STARTED — $(date) ===" > "$LOG_FILE"

run_phase() {
  local name="$1"
  local prompt="$2"
  echo "" | tee -a "$LOG_FILE"
  echo "========================================" | tee -a "$LOG_FILE"
  echo "PHASE: $name" | tee -a "$LOG_FILE"
  echo "STARTED: $(date)" | tee -a "$LOG_FILE"
  echo "========================================" | tee -a "$LOG_FILE"
  claude --dangerously-skip-permissions -p "$prompt" --max-turns 80 2>&1 | tee -a "$LOG_FILE"
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "WARNING: $name FAILED (exit $exit_code) — continuing..." | tee -a "$LOG_FILE"
  fi
  echo "PHASE $name COMPLETE — $(date)" | tee -a "$LOG_FILE"
}

# ═══════════════════════════════════════════════════
# PHASE 0: INVENTORY — Scan what exists before doing work
# ═══════════════════════════════════════════════════
run_phase "0-inventory" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

Your job is to do a quick inventory of what currently exists. Read these files and write a summary to /tmp/garderie-inventory.md:

1. Read prisma/schema.prisma — note all models, especially: Child (what fields exist), Teacher, Nurse, Doctor, Class, FoodItem/FoodCalendar, Notification/Alarm models
2. Run: find src/app -name 'page.tsx' | sort — list all route pages
3. Run: find src/components -name '*.tsx' | sort — list all components
4. Run: find src/lib/actions -name '*.ts' | sort — list all server actions

Write a concise summary to /tmp/garderie-inventory.md with:
- All Child model fields
- All Teacher model fields
- All Class model fields (if exists)
- All food-related models
- All notification/alarm models
- List of all routes
- List of all action files

Do NOT modify any files. Just read and document.
"

# ═══════════════════════════════════════════════════
# PHASE 1: FIX ALL 404s — Find and create missing route pages
# ═══════════════════════════════════════════════════
run_phase "1-fix-404s" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Fix all broken links / 404s in the app.

Known missing routes:
1. /daily-reports/[id]/page.tsx — detail page for viewing a daily report
2. /absent-reports/[id]/ — detail page for viewing an absence report

ALSO: Search the entire codebase for any Link href or router.push that points to a route that doesn't have a page.tsx. Common patterns to check:
- grep -r 'href=\"/' src/components/ — find all Link hrefs
- grep -r 'router.push' src/components/ — find all programmatic navigations
- Cross-reference each with actual page.tsx files

For each missing route, create a proper page.tsx that:
- Fetches the relevant data using existing server actions
- Renders a proper detail view using existing client components or creates a simple one
- Follows the existing pattern of other detail pages in the app

Style rules: Use Tailwind semantic classes (text-foreground, bg-muted, border-border, rounded-2xl). No hex colors.

After fixing all 404s, run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'fix: create missing route pages for daily reports, absence reports, and other 404s'
"

# ═══════════════════════════════════════════════════
# PHASE 2: FIX EMPTY BUTTON CLASSNAMES
# ═══════════════════════════════════════════════════
run_phase "2-fix-buttons" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Fix 5 Button components that have empty className lines where styling should be.

Files to fix:
1. Search in src/components/medical/ for files containing Button with empty className or missing variant — there should be 4 files (general, conditions, visits, accidents detail clients)
2. src/components/accounting/payment-dialog.tsx — around line 402, a Button with empty attribute

For each: the Button should either use the default variant (remove the empty className) or use an appropriate variant like variant='default' or variant='outline' depending on context. Read each file to understand what the button does, then pick the right variant.

After fixing, run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'fix: restore missing Button variants in medical and payment components'
"

# ═══════════════════════════════════════════════════
# PHASE 3: FOOD CRUD — Add/Edit/Delete food items
# ═══════════════════════════════════════════════════
run_phase "3a-food-crud-backend" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Build the backend for Food Item CRUD (catalog of food items that can be reused in the food calendar).

1. Read prisma/schema.prisma to check if a FoodItem model exists. If not, create one:
   - id, name (unique), category (BREAKFAST/LUNCH/DESSERT/SNACK enum or string), isActive, createdAt, updatedAt
   - Run: npx prisma migrate dev --name add-food-item-model

2. Read src/lib/actions/ to find any existing food-related actions. Check food.ts or food-calendar.ts.

3. Create or update src/lib/actions/food.ts with:
   - getFoodItems() — list all food items, optionally filtered by category
   - createFoodItem(data) — create new food item
   - updateFoodItem(id, data) — edit existing
   - deleteFoodItem(id) — soft delete or hard delete
   - Revalidate paths after mutations

4. Create src/lib/validations/food.ts with zod schema for food item form.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: add FoodItem model and CRUD server actions'
"

run_phase "3b-food-crud-frontend" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Build the frontend for Food Item CRUD.

1. Read /tmp/garderie-inventory.md for context on existing routes and components.
2. Read src/lib/actions/food.ts to see the actions you have available.
3. Read an existing listing page (e.g. src/app/(app)/branches/page.tsx and src/components/branches/branches-client.tsx) to understand the pattern.

Create:
- src/app/(app)/food/page.tsx — server page that fetches food items and renders client
- src/components/food/food-listing-client.tsx — client component with:
  - Table/grid of food items showing name, category, actions (edit/delete)
  - 'Add Food Item' button that opens a dialog
  - Edit dialog (reuse same form)
  - Delete confirmation dialog
  - Search/filter by category
  - Uses the server actions for all mutations

Also check if there's an existing food calendar page. If so, update its dropdowns to use FoodItem records instead of hardcoded values. If the food calendar page uses a different data source, connect it to the new FoodItem model.

Style: rounded-2xl cards, text-foreground, bg-muted, hover:-translate-y-0.5, hover:shadow-md transitions. Match the branches-client.tsx style.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: add food items listing page with CRUD dialogs'
"

# ═══════════════════════════════════════════════════
# PHASE 4: CLASSES CRUD
# ═══════════════════════════════════════════════════
run_phase "4a-classes-backend" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Build the backend for Class management. Classes belong to a branch.

1. Read prisma/schema.prisma — check if a Class model exists.
   If it exists, check if it has ALL these fields: name, language, ageFrom, ageTo, ageFromUnit (YEARS/MONTHS), ageToUnit (YEARS/MONTHS), cameraNumber, maxStudents, imageUrl, branchId (relation to Branch).
   Add any missing fields.
   If it doesn't exist, create the model with all those fields + id, createdAt, updatedAt.
   Also add a 'classes Class[]' relation on the Branch model if not present.
   Run: npx prisma migrate dev --name add-class-model-fields

2. Create src/lib/actions/classes.ts with:
   - getClasses(branchId?) — list classes, optionally filtered by branch
   - getClass(id) — single class with branch info
   - createClass(data) — create new class
   - updateClass(id, data) — edit
   - deleteClass(id) — delete
   - Revalidate paths after mutations

3. Create src/lib/validations/class.ts with zod schema.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: add Class model and CRUD server actions'
"

run_phase "4b-classes-frontend" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Build the frontend for Class management.

1. Read src/lib/actions/classes.ts for available actions.
2. Read src/lib/validations/class.ts for the schema.
3. Read src/components/branches/branches-client.tsx for the style pattern to follow.

Create:
A) Top-level classes listing:
   - src/app/(app)/classes/page.tsx — fetches all classes
   - src/components/classes/classes-client.tsx — listing with:
     - Card grid showing: class image (or colored placeholder), name, language, age range, max students, branch name
     - Add Class button → dialog with form: branch (dropdown), name, language, age from/to with years/months radio, camera number, max students, image upload placeholder
     - Edit/Delete actions per card
     - Filter by branch dropdown

B) Classes tab within branch detail:
   - src/app/(app)/branches/[id]/classes/page.tsx — fetches classes for this branch
   - Reuse the same classes-client component, passing branchId to filter

C) Add 'Classes' to the branch sub-navigation:
   - Read src/components/branches/branch-sub-nav.tsx
   - Add a 'Classes' tab linking to /branches/[id]/classes

Style: rounded-2xl cards, playful colored class icons (use the class name's first letter as avatar with a colored background), hover lifts, semantic Tailwind classes only.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: add classes management pages with CRUD'
"

# ═══════════════════════════════════════════════════
# PHASE 5: CHILD FORM — Compare and fill missing fields
# ═══════════════════════════════════════════════════
run_phase "5a-child-schema" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Compare the Child model in the database with the required fields from the old app and add any missing fields.

1. Read prisma/schema.prisma — document ALL current Child model fields.
2. Read /tmp/garderie-inventory.md for reference.

The old app's child form has these fields that MUST exist in the schema. Add any that are missing:

Child model fields needed:
- firstName, middleName, lastName, dateOfBirth, placeOfBirth, gender, nationality
- motherName, motherNationality, motherPhone, motherProfession, motherEmail, motherMaritalStatus, motherCanPickUp
- fatherName (or relation to parent), fatherPhone, fatherProfession, fatherEmail, fatherMaritalStatus, fatherCanPickUp
- branchId, classId (relation to Class if exists), language, joiningDate, childNumber
- scholasticYear, isActive, isDraft, bloodType, allergy
- bus (boolean or enum), diapersType, lunch (boolean or enum)
- milk, milkPortion, milkScoop, feedingTimes (Json or String[])
- sleepFrom, sleepTo, wasInGarderieBefore (boolean)
- remarks, imageUrl
- Financial: garderieFees, extraFees, busFees, apronFees, registrationFees, activitiesFees (all Decimal/Float), discount, tva, financialRemarks

Related models needed (check if they exist):
- ChildAddress: addressType, country, governorate, district, region, city, street, building, telephone, childId
- ChildSibling: relation, firstName, dateOfBirth, medicalCase, canPickUp, childId
- AuthorizedPerson: relation, firstName, lastName, telephone, mobile, isEmergencyContact, childId
- ChildAttachment: fileUrl, title, childId

Only add fields/models that are genuinely missing. Do NOT duplicate existing fields.
Run: npx prisma migrate dev --name add-missing-child-fields
Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: add missing child model fields and related models'
"

run_phase "5b-child-form-update" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Update the child create/edit form to include missing fields.

1. Read prisma/schema.prisma to see the current Child model (just updated in previous phase).
2. Find the child form component — search for files in src/components/children/ that contain a form for creating/editing children.
3. Read the existing child form to understand what fields are already there.
4. Read src/lib/validations/ for any child validation schema.
5. Read src/lib/actions/ for child-related actions (create, update).

Update the form to add missing sections. The form should have collapsible sections using the FormSection component (read src/components/ui/form-section.tsx for the pattern):

Sections needed:
1. Child Info — basic fields (most likely already exists)
2. Addresses — dynamic list of addresses (Add/Remove)
3. Parents — Father and Mother sub-sections
4. Brothers & Sisters — dynamic list
5. Authorized Persons — dynamic list with emergency contact flag
6. General Info — scholastic year, class, blood type, allergy, bus, diapers, lunch, milk details, sleep schedule
7. Financial Info — fee rows with discount/TVA/net calculation
8. Attachments — dynamic list with file upload placeholder (stub with 'Coming soon' for actual upload)

For dynamic lists, use a pattern like:
- State array managed with useState
- Add button appends empty entry
- Remove button removes by index
- Each entry renders its fields inline

Only add sections that are genuinely missing. If the form already has some of these, leave them alone.

Update the validation schema and server actions to handle new fields.

Style: Use FormSection component for collapsible sections. Match existing app style.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: expand child form with addresses, parents, siblings, authorized persons, financials'
"

# ═══════════════════════════════════════════════════
# PHASE 6: CHILD DASHBOARD — Compare and fill missing
# ═══════════════════════════════════════════════════
run_phase "6-child-dashboard" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Enhance the child detail/dashboard page to match the old app's comprehensive overview.

1. Read src/app/(app)/children/[id]/page.tsx (or layout.tsx) — understand current structure.
2. Read any client components in src/components/children/ that render the child detail view.
3. Read src/lib/actions/ for child-related data fetching actions.

The child dashboard should show (check what exists, add what's missing):

A) Child Info Summary Card — key details in a clean card:
   - Photo, name, child number, active status
   - Gender, language, nationality, branch, class
   - Joining date, current age (calculated), joining age (calculated)
   - Mother/father phone numbers
   - Milk details, diapers, bus, lunch, allergy
   - Authorized persons list with emergency contact flag

B) Quick Action Buttons row:
   - New Call Report, New Accident Report, Child Calendar, Send Message
   - These can link to relevant pages or open dialogs

C) Stat Cards (2 rows):
   Row 1: Incoming/Outgoing Calls, Accident Reports, Total Payments
   Row 2: Total Attendance, Total Absence, Missing Daily Reports, Missing Absent Reports
   - Use the existing StatCard component or create compact versions
   - Each card links to its relevant section

D) Attendance Statistics — pie chart (Present/Absent/No Report) using Recharts
E) Reports Summary — paginated table of daily reports (Date, Breakfast, Lunch, Dessert, Status, View Report link)
F) Absence Reports — table (Date, Reason, From, To, View Report link)
G) Medical Reports Summary — table (Type, Status, Date, Action) with year filter
H) Assessments Summary — table (Type, Status, Date, Action)

Fetch data using existing server actions where possible. For data that doesn't have actions yet, create simple query functions in the relevant action file.

Style: Modern card-based layout. Use the app's rounded-2xl cards, subtle shadows, colored stat cards (teal, pink, blue, gray). Responsive grid. No hex colors — semantic Tailwind only.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: enhance child dashboard with stats, charts, reports, and quick actions'
"

# ═══════════════════════════════════════════════════
# PHASE 7: ARABIC TITLES ON COMPLIANCE DOCUMENTS
# ═══════════════════════════════════════════════════
run_phase "7-arabic-compliance" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Add Arabic titles to compliance documents and form sections.

1. Read src/components/branches/compliance-documents-client.tsx

Update the REQUIRED_DOCUMENTS array to include arabicLabel for each document type:
- COMMERCIAL_REGISTER: 'السجل التجاري'
- CIVIL_STATUS: 'صورة عن تذكرة الهوية او اخراج قيد'
- CRIMINAL_RECORD: 'سجل عدلي'
- LEASE_CONTRACT: 'سند ملكية أو إيجار أو عقد إستثمار'
- PROPERTY_DEED: 'سند ملكية'
- HEALTH_LICENSE: 'الملف الصحي الصادر عن وزارة الصحة العامة'
- FIRE_SAFETY: 'شهادة السلامة من الحريق'
- INSURANCE_CERTIFICATE: 'عقد ضمان لسلامة الأطفال'
- DIRECTOR_DIPLOMA: 'شهادات المديرة المسؤولة'
- DOCTOR_LICENSE: 'اجازة ممارسة مهنة الطب'
- FLOOR_PLAN: 'خريطة البناء (لا تقل عن 200 م²)'
- OTHER: 'مستندات أخرى'

In the JSX, show the Arabic title on each document card. Use a Tooltip (from shadcn/ui) — Arabic as secondary text below the English label in a smaller font with text-muted-foreground, or as a tooltip. Pick whichever looks cleaner. The Arabic should be visually present but not overwhelming — maybe a small line under the English label in a lighter color.

2. Read the compliance form section components in src/components/branches/compliance/:
   - legal-entity-section.tsx, registration-section.tsx, signatory-section.tsx, nursery-identity-section.tsx, address-section.tsx, property-section.tsx, management-section.tsx, capacity-section.tsx, insurance-section.tsx

Add Arabic section titles to the FormSection headers. The FormSection title prop currently takes a string — add the Arabic after the English in parentheses or as a subtitle. Example: title='Legal Entity' with Arabic subtitle 'الشخصية القانونية'. You may need to modify FormSection to accept a subtitle prop. Check src/components/ui/form-section.tsx first.

Arabic section titles:
- Legal Entity: الشخصية القانونية
- Registration: التسجيل
- Authorized Signatory: المفوض بالتوقيع
- Nursery Identity: هوية الحضانة
- Address: عنوان الحضانة
- Property: الملكية او سند الايجار
- Management: الادارة
- Capacity: السعة
- Insurance: الضمان

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: add Arabic titles to compliance documents and form sections'
"

# ═══════════════════════════════════════════════════
# PHASE 8: FOOD CALENDAR — Make editable
# ═══════════════════════════════════════════════════
run_phase "8-food-calendar" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Make the food calendar fully editable with click-to-edit functionality.

1. Search for existing food calendar components: find src/ -name '*food*' -o -name '*calendar*' | grep -i food
2. Read whatever food calendar page/component exists.
3. Read src/lib/actions/food.ts (or wherever food calendar actions live).

The food calendar should:
- Show a monthly grid (Sun-Sat) per branch
- Each day cell shows: Breakfast, Lunch, Dessert text
- Click a day → opens a dialog with:
  - Breakfast dropdown (populated from FoodItem model, category BREAKFAST)
  - Lunch dropdown (populated from FoodItem model, category LUNCH)
  - Dessert dropdown/text input (from FoodItem model, category DESSERT)
  - Snack field if it exists
  - Update / Remove / Close buttons
- Month navigation arrows + today button
- Branch selector (if not already scoped by route)

If a calendar component already exists, enhance it with the click-to-edit dialog.
If it doesn't exist, create a simple month grid component. You can use a basic CSS grid (7 columns) — no need for a heavy calendar library.

Connect the dropdowns to FoodItem records from the database. Use the actions from food.ts.

Style: Green-tinted day cells when food is assigned (bg-emerald-50 or similar). Clean dialog with rounded-2xl. Semantic Tailwind.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: make food calendar editable with click-to-edit dialog'
"

# ═══════════════════════════════════════════════════
# PHASE 9: EMPLOYEE FORM — Add missing fields/sections
# ═══════════════════════════════════════════════════
run_phase "9a-employee-schema" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Ensure the Teacher/Employee schema has all required fields from the old app.

1. Read prisma/schema.prisma — check Teacher, Nurse, Doctor models.

Required Teacher fields (add missing ones):
- username, firstName, middleName, lastName, dateOfBirth, placeOfBirth, registerNumber
- nationality, maritalStatus, numberOfChildren, gender, medicalCase, medicalCaseDescription
- governorate, district, region, city, street, building (address fields)
- telephone, mobile, cnss, email, cnssNo
- secondaryDegree, secondaryDegreeYear, universityDegree, universityDegreeYear
- remarks, isActive, branchId, classId
- imageUrl

Related models needed:
- TeacherLanguage: teacherId, language (English/French/Arabic), canRead, canWrite, canSpeak (proficiency levels)
- TeacherExperience: teacherId, type (WORK/STAGE/WORKSHOP), company, position, fromDate, toDate, description
- TeacherDocument: teacherId, type (CONTRACT/MEDICAL_TEST/CERTIFICATE/ATTACHMENT), fileUrl, title, expiryDate, date

Check if these models already exist. Only add what's missing.

Run: npx prisma migrate dev --name add-employee-fields
Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: add missing employee schema fields and document models'
"

run_phase "9b-employee-form" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Update the teacher/employee edit form with missing sections.

1. Read prisma/schema.prisma for current Teacher model.
2. Find teacher form components: search src/components/staff/ or src/components/employees/ for form files.
3. Read the existing teacher form.
4. Read src/lib/actions/ for teacher-related actions.
5. Read src/lib/validations/ for teacher validation schema.

The teacher form needs these sections (add what's missing, don't duplicate):

1. System Username (username field)
2. Teacher Info (name, DOB, place of birth, register #, nationality, marital status, children count, gender, medical case)
3. Address (governorate, district, region, city, street, building)
4. General Info (telephone, mobile, CNSS, email, CNSS #, secondary degree + year, university degree + year)
5. Languages (English/French/Arabic with read/write/speak dropdowns)
6. Work Experience (dynamic list — add/remove entries)
7. Stage Experience (dynamic list)
8. Workshop (dynamic list)
9. Garderie Info (remarks, active, branch, class dropdowns)
10. Contract Documents (dynamic list — file stub + expiry date)
11. Medical Test Documents (dynamic list — file stub + expiry date)
12. Certificates (dynamic list — file stub + date + title)
13. Attachments (dynamic list — file stub + title)

Use FormSection component for collapsible sections. For file uploads, show a 'Coming soon' placeholder button.
Update the validation schema and server actions accordingly.

Style: Semantic Tailwind, rounded-2xl, collapsible FormSection for each group.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: expand employee form with languages, experience, documents sections'
"

# ═══════════════════════════════════════════════════
# PHASE 10: NOTIFICATION CENTER FOUNDATION
# ═══════════════════════════════════════════════════
run_phase "10-notifications" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Build the notification center foundation — settings page where managers configure auto-notifications, and a notification bell in the header.

1. Read prisma/schema.prisma for any existing Alarm/Notification models.
2. Read src/components/layout/ or src/app/(app)/layout.tsx for the app shell/header.
3. Read src/app/(app)/alarms/ to see what alarm pages already exist.

A) Notification Settings Page — create or enhance:
   - Route: /settings/notifications (or enhance existing alarms settings)
   - List all notification types with toggle on/off:
     * Birthday greetings
     * Missing daily reports
     * Missing absence reports
     * Assessment due
     * Medicine reminders
     * Insurance expiring
     * Contract expiring
     * Vaccination due
     * Holiday announcements
     * Payment overdue
   - Each type has:
     * Active toggle (on/off)
     * Days before (number input, for advance warnings)
     * Template editor (textarea with shortcode hints: {{child_name}}, {{parent_name}}, {{date}}, {{branch_name}}, {{amount}})
   - Save settings using the existing settings actions (setSetting)

B) Notification Bell in Header:
   - Add a bell icon (from lucide-react) to the app header/nav
   - Show unread count badge (red circle with number)
   - Click opens a dropdown panel showing recent notifications:
     * Grouped by type with colored icons
     * Each notification: icon, title, description, time ago, link to action
     * 'Mark all as read' button
     * 'View all' link to full notifications page
   - For now, the bell can pull from the existing alarms/notifications data
   - If no notification data exists yet, show an empty state: 'All caught up!'

Style: Bell icon in header nav bar. Dropdown panel: rounded-2xl, shadow-lg, max-h with scroll. Notification items: compact rows with colored left border by type. Badge: bg-red-500 text-white text-xs rounded-full.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: add notification center with settings page and header bell icon'
"

# ═══════════════════════════════════════════════════
# PHASE 11: HOLIDAY CALENDAR — Editable with notifications
# ═══════════════════════════════════════════════════
run_phase "11-holiday-calendar" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Enhance the holiday calendar with a visual calendar view and edit dialog.

1. Read src/app/(app)/settings/holidays/page.tsx
2. Read src/components/settings/holidays-client.tsx (or similar)
3. Read src/lib/actions/settings.ts for holiday actions

The holidays page likely has a list/table view. Add a calendar view:

A) Calendar View:
   - Monthly grid (Sun-Sat) showing holidays as colored bars spanning their date range
   - Green bars for holidays, toggle between list and calendar view
   - Click a holiday → edit dialog

B) Holiday Edit Dialog:
   - Description (text)
   - Repeated / One Time (radio buttons)
   - Start Date, End Date (date pickers)
   - Notification title (text)
   - Notification message (textarea for parent notification)
   - Type dropdown (Holiday/Event) + Active checkbox
   - Days Before (number — when to send notification)
   - Update / Remove / Close buttons

C) Create Holiday:
   - Same dialog but empty, triggered by 'Add Holiday' button

If the holiday model doesn't have notification-related fields (notificationTitle, notificationMessage, daysBefore), add them to the schema and migrate.

Style: Calendar grid matching food calendar style. Holiday bars in emerald-500. Dialog: rounded-2xl, clean form layout.

Run: npx tsc --noEmit
Then commit: git add -A && git commit -m 'feat: add calendar view to holidays with edit dialog and notification fields'
"

# ═══════════════════════════════════════════════════
# PHASE 12: FINAL VERIFICATION
# ═══════════════════════════════════════════════════
run_phase "12-final-verify" "
You are working on the garderie (KiddzOnline) Next.js 15 app at /Users/karimsaab/Desktop/garderie on the ux-improvements branch.

TASK: Final verification pass.

1. Run: npx tsc --noEmit — fix ANY type errors that exist
2. Run: git log --oneline -20 — show what was committed tonight
3. Check that the dev server still works: curl -s -o /dev/null -w '%{http_code}' http://localhost:3333
4. If there are any type errors, fix them and commit: git add -A && git commit -m 'fix: resolve remaining type errors from overnight work'

Write a summary of everything that was done tonight to /tmp/overnight-feb24-summary.md including:
- What was built
- What was fixed
- Any issues encountered
- What still needs to be done (file uploads, notification sending logic, etc.)
"

echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "OVERNIGHT SCRIPT FINISHED — $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
