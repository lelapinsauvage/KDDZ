# Overnight Features Script — Collected Specs

## Status: COLLECTING (not yet converted to script)

---

## META-REQUIREMENTS (Apply to ALL phases)

### Critical Bugs to Fix First
- **Dashboard crash:** `requireOrg()` throws "No organization context" because users have NULL `organizationId` in DB
- **Root cause:** Backfill script may not have set org on all users. Auth flow falls back to `user.branch?.organizationId` but that's also NULL
- **Fix needed:** Re-run backfill, ensure ALL users have organizationId set. Make dashboard gracefully handle missing org (show empty state, not crash)

### Design Direction — NOT Claude Style
- **REJECT** the terracotta/cream Claude aesthetic from overnight phases 19-30
- **TARGET:** "Apple for nurseries" — playful, modern, colorful, human, extremely easy to use
- Research agents must investigate best nursery/childcare app designs
- Create proper palette, typography, spacing system BEFORE touching components
- Think: bright but not garish, rounded but not childish, professional but warm

### Adapt, Don't Replicate
- Many features below ALREADY EXIST in the current app (daily reports, children, employees, medical, etc.)
- The agent must READ the current implementation first and ENHANCE/REDESIGN it
- Do NOT create duplicate pages or rewrite from scratch
- Fill gaps, improve UX, add missing fields, redesign visually

### Current App State (from audit)
- **120 pages** already exist across all modules
- **93 components** (child-form 1761 lines, employee-form 921 lines, daily-report-form 660 lines)
- **23 action files** (10,160 lines total) — all fully implemented with Prisma queries
- **69 Prisma models** — comprehensive schema
- **29 shadcn/ui components** installed
- **Key existing features:** Dashboard with morning briefing + charts, Children CRUD with full enrollment form, Daily Reports with fever/milk tracking, Employees (4 types) with full HR forms, Medical module (vaccinations, conditions, visits, accidents), Messaging (threads, compose, inbox), Food calendar, Attendance, Payments, Branch compliance, Assessments, Settings with regions/zones/holidays/events
- **What's partially built:** Alarms module (structure only), Messages compose flow, Classes detail pages
- **What's missing:** Proper design system (current one is terracotta/Claude), better UX patterns, some specific fields from legacy app

### Verification After Every Phase
- Every phase MUST end with: `npx tsc --noEmit` (fix errors before committing)
- Every phase MUST verify the dev server starts: `timeout 15 pnpm exec next dev --port 3334` (use different port to avoid conflicts)
- If a page was modified, curl it to verify no 500 errors
- Only commit if verification passes

### No Self-Service Signup
- Onboarding is manual — admin creates orgs, users, shares temp passwords over phone
- No public signup page

---

## FEATURE 1: Class Dashboard (The Command Center)

**Target User:** Teachers (for their own class) and Managers (viewing from the top down).

**UX:** Replace old rigid block layout with vibrant, rounded-card grid. Use distinct color coding for Daily, Medical, and Assessment tabs.

### UI Elements:
- **Header Stats:** Total Children, Max Capacity, Total Males, Total Females → Minimalist badge row at top
- **Status Cards:** Children Without Daily Report, Completed Reports, Incomplete Reports, Drafts → 4 large clickable summary cards with playful icons (sparkling checkmark for 'Completed')
- **Data Table:** Child ID, First Name, Last Name, Status, Report (Yes/No badge), Action (Create Report) → Rounded table with colored avatars, sticky headers, quick-action buttons in last column

---

## FEATURE 2: Daily Report (The Bread & Butter Workflow)

**Target User:** Teachers. High-frequency data entry.

**UX:** Unified single-page scroll with distinct color-backed "islands" (cards) for Meals, Sleep, Hygiene, Health. Massive clear toggle at top: [ Present ] or [ Absent ].

### A. The "Present" Flow

| Section | Fields | Input Type |
|---------|--------|------------|
| Breakfast | Item (Dropdown), Time (HH:MM), Portion (Well/Half/Little/None) | Select, Time Picker, Radio Group |
| Lunch | Item (Dropdown), Time (HH:MM), Portion (Well/Half/Little/None) | Select, Time Picker, Radio Group |
| Dessert | Item (Dropdown), Portion (PCS), Time (HH:MM), "No Dessert" (Checkbox) | Select, Number Input, Time Picker, Checkbox |
| Batch Action | "Apply Food For All Class Members (Food Type & Time should be filled)" | Checkbox (highlight to save teachers time) |
| Milk | Amount (CC), Time (HH:MM), [+] Add multiple | Array Field (Dynamic list) |
| Nap Time | From (HH:MM), To (HH:MM) | Time Range Picker |
| Hygiene Matrix | Rows: Diaper, Pot, Diapers. Columns: Urine (5 checks), Stool (5 checks) | Custom grid of rounded checkboxes |
| Health | Fever Temp (Decimal), Time (HH:MM), [+] Add multiple, Note (Textarea) | Array Field + Textarea |
| Xtra Clothes | Pants, Sweater/Long-sleeve, T-shirt, Underwear, Socks | Visual toggle buttons with playful clothing vector icons |
| Attachments | Choose File, Title, [+] Add New Attachment | Drag-and-drop zone |

### B. The "Absent" Flow

| Section | Fields | Input Type |
|---------|--------|------------|
| General Info | Date, Class, Teacher, Reason of absence, Absent From, Absent To | Date Pickers, Selects |
| Hospital Infos | Does the Child attend Hospital? (Yes/No) | Radio Group or Switch |

---

## FEATURE 3: Medical & Incident Tracking

**Target User:** Nurses, Doctors, and Teachers.

**UX:** Clear error states and Zod validation. Nothing gets missed.

### A. Accident & Call Reports

| Form Type | Fields |
|-----------|--------|
| Accident Report | Cause (Text), Date, Time, The accident happened (Select), Specify Area (Text), Camera Number (Text), First Aid (Select), Emergency Hospital (Select), Treatment (Select), Teacher who filled report, Attachments |
| Call Report | Call Type (Incoming/Outgoing Select), Date, Time, Cause of Call (Select), Subject (Text), Remarks (Text), Teacher who filled report, Attachments |

### B. Medical Visit (The Big Physical Exam)

**UX:** Accordion or side-nav stepper. Do NOT overwhelm with 100 fields at once.

Every category requires "Other Problems / Additional Notes" text field:

- **Vitals:** Height (cm), Weight (kg), Blood Pressure (mm HG)
- **Eyes:** With Glasses (Check), Left Eye (Select), Right Eye (Select), Crooked Eyes (Yes/No)
- **Ears:** Wax in Left/Right (Select), Drum in Left/Right, Hearing in Left/Right
- **Systems (All Normal/Select states):** Nose/Throat (Paranasal Sinuses), Thyroid, Lymph nodes, Heart and Arterial System, Respiratory, Motor System (Bones, Joint, BackBones, Muscles), Abdomen - Genitals
- **Skin/Hair/Nails:** Lice-Lupus, Dermatitis, Skin Allergy, Hair, Nails

### C. General Information / Suffering Form

Assessments (Select + Add Remarks for each): Hearing, Speaking, Sight, Respiration, Worms, Heart, Arteries, Urine, Epilepsy, Migraine, Eating Disorder, Chronic Blood Problems, Other Health Problems.

Conclusion: "How do you assess General Health of your child?" (Dropdown).

### D. Vaccinations

Standard timeline tracking for: Hepatitis B (Birth), IPV (2 mos), OPV (4/6/18 mos, 4/10 yrs), DPT-Hib-HepB, Measles, MMR, DPT, DT.

Data points per dose: Date Given, Administrated By (Select/Text).

---

## FEATURE 4: Developmental Assessment Reports

**Target User:** Teachers and Managers.

**UX:** Age bracket tabs (0-3 mos, 4-7 mos, up to 4-5 years). Clean conversational UI. Large tappable [ Yes ] / [ No ] pill buttons instead of legacy radio buttons.

### Example Form Structure (24-36 Months):

Every item = Yes/No answer.

- **Gross Motor:** Climbs well, Walks down stairs (both feet), Walks up stairs (alternating feet), Swings leg to kick, Runs easily, Pedals tricycle, Bends over easily
- **Fine Motor:** Makes vertical/horizontal/circular strokes, Turns book pages one at a time, Holds pencil in writing position, Screws/unscrews jars, Turns rotating handles, Builds tower of >6 blocks
- **Language:** Uses pronouns, Understands most sentences, Recognizes common objects in pictures, Shows frustration when not understood, Understands physical relationships (in, on, under), Can say name/age, Uses words to communicate wants, Knows simple rhymes/songs, Strangers can understand most words
- **Cognitive:** Makes mechanical toys work, Matches object to picture in book, Plays make-believe, Sorts objects by color, Completes puzzles (3-4 pieces), Understands concept of "two", Listens to stories, Knows several body parts
- **Self-Help:** Pulls pants down with help, Helps put things away, Serves self at table
- **Social/Emotional:** Uses word "mine", Says "no" but complies, Expresses wide range of emotions, Objects to major changes in routine, Begins to follow simple rules, Separates easily from parents

### Developmental Red Flags (Checkboxes - Critical for Ministry):
Frequent falling, Drooling/unclear speech, Inability to build tower of 4 blocks, Difficulty manipulating small objects, Inability to copy a circle, Inability to communicate in short phrases, No involvement in pretend play, Cannot feed self, Failure to understand simple instructions, Little interest in other children, Extreme difficulty separating from caregiver.

**Comments:** Text area for final teacher notes.

---

## FEATURE 5: Food Calendar

**Target User:** Managers and Teachers (viewing).

**UX:** Modern full-width calendar component. Meals appear as colored rounded pill-tags directly on month view (Breakfast=Yellow, Lunch=Green, Dessert=Pink).

### Click-to-Edit Modal:
- **Breakfast:** Food Item → Searchable Select (Combobox via cmdk)
- **Lunch:** Food Item → Searchable Select (Combobox)
- **Dessert:** Food Item → Searchable Select with prominent "None" option
- **Actions:** Primary Save button, distinct red Clear Day button, standard modal close

---

## FEATURE 6: Holiday Calendar

**Target User:** Managers.

**UX:** Holidays rendered as spanning event blocks across multiple days (not just background color on a cell).

### Holiday Event Form:
- **Description:** Name of the holiday (e.g., "Eid Al-Adha") → Text Input
- **Recurrence:** "Repeated" or "One Time" → Segmented Control or Radio Group
- **Date Range:** Start Date and End Date Pickers (multi-day native)
- **Status:** "Active" toggle → Switch (shadcn)
- **Notification Body:** Custom message to parents ("Dear Parents...") → Textarea
- **Notification Trigger:** Days Before (e.g., "< 1 Day") → Select Dropdown

---

## FEATURE 7: Notifications Hub (Templates + Logs)

**Target User:** Managers.

**UX:** Single page with two tabs: Templates and Logs. Combines legacy "Setting > Notifications" viewing with "Admin Panel" template configuration.

### Tab A: Notification Templates

Categories: Birthday, Missing Reports, Medicine, Insurance, Assessment, Vaccinations, Expiration, Control.

Fields per category:
- **Enable/Disable:** Master Switch toggle
- **Subject:** Text Input
- **Message Body:** Rich Textarea
- **Variables:** Clickable chip-buttons below textarea that inject shortcodes (e.g., [[child_name]]) at cursor position

### Tab B: Sent Logs (Audit Trail)

Filterable categories: Calendar, General, Assessment, Reports Reminders, Medicine, Birthdays, Events, Insurance, Messages, Contracts.

Table columns: # (ID), Type, Content (snippet), Time Range Filters (From/To date pickers in header), Status (Seen/Unseen badge), Actions (Reset/Resend)

---

## FEATURE 8: Accounting Management (Finance Dashboard)

**Target User:** Managers and Accountants.

**UX:** Modernized shadcn DataTable with sticky first column (Child Name), horizontal scroll for months.

### Fee Category Tabs:
Total Payments Summary, Registration Fees, Monthly Fees, Bus Fees, Xtra-time Fees, Other Fees.

### "New Payment" Modal:
- **Child Info:** Child # (ID) → Prefilled read-only badge
- **Amount:** Number input → `type="number"` with Zod validation
- **Currency:** US, LL (Lebanese Pounds) → Select
- **Fee Type:** Registration, Monthly, etc. → Select (prefilled by active tab)
- **Payment Method:** Cash, Cheque, Credit Card, Bank Transfer → Radio Group with distinct icons
- **Notes:** "Add Notes if Needed" → Textarea
- **Payment Date:** Exact transaction date → Date Picker (shadcn calendar popover)
- **Coverage Period:** From (Month), To (Month) → Two Select dropdowns
- **Attachment:** File Upload for receipts/cheque scans → Dropzone (placeholder for S3/R2)

---

## FEATURE 9: Messages Portal (Single/Bulk Messaging)

**Target User:** Managers.

**UX:** Modern split-pane design: sticky composer on right, filterable searchable directory on left.

### A. Recipient Selector (Left Pane):
- Filters: Branch dropdown, Class dropdown
- Bulk Actions: [Select All Children], [Select All Active Children], [Unselect All]
- List: Checkboxes next to colored Child Avatars and Names

### B. Message Composer (Right Pane):
- **Nature:** General, Urgent, Legal, Event → Select
- **Subject:** Text input
- **Message:** Body → Rich Textarea

### C. Sent Messages (Audit Log Tab):
Table: #, To, Date, Nature, Subject, Message (snippet), Thread, Actions (View/Reset)

---

## FEATURE 10: Monthly Attendance Heatmap

**Target User:** Managers checking compliance.

**UX:** GitHub-style contribution graph / heatmap grid — children as rows, days of month as columns.

### Compliance Legend (Strict Color Mapping):
- Green: Present (Report completed)
- Pink/Red: Absent
- Purple: No Report (Child present/unknown but daily report missing)

### "Magic" Workflow (Critical UX):
Clicking a Purple (Missing Report) dot opens a slide-out Sheet (shadcn) containing the Daily Report component. Prefills Child ID and Date from the exact grid cell clicked.

---

## FEATURE 11: Manager's Dashboard & Analytics

**Target User:** Nursery Managers and Owners.

### 1. Global Controls & Context

- **Date Range Filter:** Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, This Year, Last Year, Custom Range → DateRangePicker popover with sidebar of quick-select preset buttons (sticky in top-right header)
- **Scholastic Year:** Dropdown (e.g., "2019-2020 - Current") → Select component next to Date Filter

### 2. Tier 1: Nursery Overview (Top KPIs)

Elevated colorful stat cards:
- Total Branches (hidden if viewing branch-level dashboard)
- Total Classes
- Total Active Children

### 3. Tier 2: Demographic Insights (Charts)

Sleek interactive Donut Charts (Recharts):
- **Children Per Class:** Donut chart mapped to branch colors
- **Gender Statistics:** Donut chart comparing Male vs Female percentages

### 4. Tier 3: Daily Compliance & Attendance

Semantic color cards (Red=missing, Green=attendance):
- Total Attendance
- Total Absence
- Missing Daily Reports (Critical KPI)
- Missing Absent Reports

**Interactive:** "View More" on any card routes to pre-filtered Data Table (e.g., Missing Daily Reports → Daily Reports list filtered by "Status: Missing")

### 5. Tier 4: Action Center (The 9-Grid)

Clean 3x3 grid using shadcn Card. Fix legacy naming bugs ("Total Drafts" repeated 3x):

| # | Legacy Data Point | Modern Label |
|---|-------------------|--------------|
| 1 | Total Payments ($ Amount) | Financial: Total Payments Collected |
| 2 | Accident Reports (Count) | Medical: Incident / Accident Reports |
| 3 | Incoming/Outgoing Calls | Comms: Logged Calls |
| 4 | Total Medical Reports | Medical: Completed Medical Visits |
| 5 | Missing Medical Reports | Compliance: Missing Medical Visits |
| 6 | Missing Assessments | Compliance: Missing Assessments |
| 7 | Total Drafts (Daily Report Icon) | Drafts: Pending Daily Reports |
| 8 | Total Drafts (Medical Icon) | Drafts: Pending Medical Reports |
| 9 | Total Drafts (Assessment Icon) | Drafts: Pending Assessments |

### 6. Branch-Level Drill Down

When navigating to Branches Management → [Branch ID] → Dashboard: re-render exact same layout but omit "Total Branches" card and scope ALL API calls to that branchId.

---

## FEATURE 12: RBAC & Dashboard Data Layer

### 1. Role-Based Access Control (Auth.js)

Strict data scoping by role + branch:

- **Manager / Admin (Global):** View aggregate dashboard (branchId = null)
- **Manager (Branch Level):** Forced to view only their assigned branchId. "Total Branches" card hidden.
- **Teacher:** Auto-redirect away from Manager Dashboard → their specific Class "Today" view
- **Nurse / Doctor:** Default to Medical Dashboard or pre-filtered Action Center (Medical Reports / Accident Reports)

**Implementation:** Create reusable `requireRole(allowedRoles, branchId?)` utility wrapper for all Server Actions fetching dashboard data.

### 2. Dashboard Server Actions (Prisma Data Layer)

**Requirement:** Heavy aggregation. Use Prisma `aggregate`, `groupBy`, `count` — never fetch raw records to client.

#### Action 1: `getNurseryDemographics(branchId?, scholasticYearId)`
- Total Branches: `prisma.branch.count()`
- Total Classes: `prisma.class.count({ where: { branchId } })`
- Total Active Children: `prisma.child.count({ where: { status: 'ACTIVE', branchId } })`
- Gender Stats: `prisma.child.groupBy({ by: ['gender'], _count: true })`
- Class Distribution: `prisma.child.groupBy({ by: ['classId'], _count: true })`

#### Action 2: `getDailyComplianceStats(dateRange, branchId?)`
Powers the most critical dashboard row (Attendance & Missing Reports):
- Total Attendance / Absence: Count records in Attendance table within dateRange
- Missing Daily Reports: Query active children marked "Present" but no DailyReport for given date
- Missing Absent Reports: Query children marked "Absent" but missing formal AbsentReport reason form

#### Action 3: `getActionCenterMetrics(dateRange, branchId?)`
Powers the 3x3 grid. Execute `Promise.all()` for 9 independent counts:
1. Sum of `Payment.amount` (Financials)
2. Count of `AccidentReport`
3. Count of `CallLog`
4. Count of `MedicalVisit` (Completed)
5. Count of pending/missing Medical Visits
6. Count of pending/missing Assessments
7. Count of `DailyReport` where status == DRAFT
8. Count of `MedicalReport` where status == DRAFT
9. Count of `Assessment` where status == DRAFT

---

## FEATURE 13: Children Management & Enrollment

### 1. Children Directory (The Roster)

**Target User:** Managers and Teachers.

Powerful shadcn DataTable:
- **Columns:** ID, Image (Colored Avatar), First Name, Last Name, DOB, Branch, Class, Gender, Date, Actions
- **Filters:** Sticky search bar (cmdk) + dropdown filters for Branch, Class, Status (Active/Inactive) above table

### 2. The Enrollment Form (New Child) — 5-Step Wizard

**Target User:** Managers/Admins. Break monolithic page into logical steps.

#### Step 1: Core Child Info
- First, Middle, Last Name → Grid of Text Inputs
- Date of Birth, Place of Birth → Date Picker, Text Input
- Gender, Nationalities (Child & Mother's) → Select Dropdowns
- Branch, Language, Joining Date → Selects, Date Picker
- Child Number, Remarks → Number Input, Textarea

#### Step 2: Addresses & Family (Dynamic Arrays — useFieldArray)
- **Addresses:** Address Type, Country, Mouhafaza, Qadaa, Region, City, Street, Building, Telephone, Remarks, Map Location (Lat/Long)
- **Parents (Father & Mother):** First/Last Name, Profession, Work Tel, Mobile, Marital Status, Divorce Situation, Medical Case, Email, Can Pick Up (Yes/No)
- **Brothers & Sisters:** Relation, First Name, DOB, Medical Case, Can Pick Up
- **Authorized Persons:** Relation, First/Last Name, Telephone, Mobile, Emergency Contact (Yes/No)

#### Step 3: General & Medical Info
- **School Context:** Scholastic Year, Branch, Class, Active Status (Switch)
- **Health:** Blood Type, Allergy (Add notes/None)
- **Logistics & Care:** Bus (Yes/No + Options), Diapers Type, Lunch (Select)
- **Milk Tracker:** Milk Brand, Portion (ML), Scoop, At (Time)
- **Routines:** Remarks, Sleep From/To, "Did your child was in Garderie before?" (Yes/No)

#### Step 4: Financial Info (Live Calculator)
Fee Categories: Garderie Fees, Xtra Fees, Bus Fees, Apron Fees, Registration Fees, Activities Fees.
Fields per category: Base Amount, Discount %, TVA %, Net $ (Read-only/Calculated auto).

#### Step 5: Attachments
Required Docs: Photo, ID, Vaccination Card, Doctor Assessment, Medical Report.
Action: Drag-and-drop zone (currently "Coming Soon" placeholder).

### 3. Individual Child Dashboard (CRM Profile)

**Target User:** Managers, Teachers, Doctors.

Layout: Left Sidebar (static info) + Right Main Content (tabbed reports).

#### A. Profile Card (Sidebar):
- Large rounded Avatar
- Status Badge (Active/Inactive)
- High-density info grid: Age (calculated from DOB), Joining Age, Blood Type, Allergies (red highlight), Parents' names & numbers, Authorized pickups

#### B. Quick Actions (Header Bar):
Buttons: [+ New Call Report], [+ New Accident Report], [Child Calendar], [Send Message]

#### C. Health & Attendance KPIs (Top Row):
- Total Payments ($)
- Total Attendance vs. Total Absence
- Missing Daily Reports & Missing Absent Reports (critical flags)
- Small Recharts donut chart: Present vs. Absent ratio

#### D. Historical Data (Tabbed Data Tables):
- **Daily Reports:** Date, Breakfast, Lunch, Dessert, Status
- **Absence Reports:** Date, Reason, From, To
- **Medical Reports:** General Form, Suffering Form, Medical Visit, Vaccination Report (with Completion Status badges)
- **Assessments:** Age brackets (e.g., 24-36 Months) with completion status

---

## FEATURE 14: Classes & Staff Management

### 1. Classes Management

**Target User:** Managers and Admins. Visual grid of Cards or modern DataTable.

#### Class Form Fields (Create/Edit):
- **Class Image:** Drag-and-drop avatar upload zone
- **Branch:** Select dropdown (e.g., Branch 4)
- **Class Name:** Text Input (e.g., "Vanilla", "Caramel")
- **Class Language:** Select dropdown (English, French)
- **Age From:** Two Number Inputs side-by-side: Years and Months
- **Age To:** Two Number Inputs side-by-side: Years and Months
- **Camera Number:** Text/Number Input (CCTV tracking)
- **Max Number of Students:** Number Input (critical for capacity compliance alarms)

### 2. Teachers Listing (The Roster)

Rich directory with sticky column headers and global search.

**Columns:** Image, First Name, Last Name, DOB, Branch, Class, Nationality, Gender, Registration Date, Actions (Edit/Delete)

### 3. The Teacher Profile Form (HR & Compliance) — 6-Section Tabbed Layout

Massive form. Use vertical Tabbed Layout (tabs left, form right) or Accordion. React Hook Form `useFieldArray` extensively.

#### Section A: Account & Core Info
- System Username: Text input
- **Teacher Infos:** First Name, Middle Name, Last Name, DOB (Picker), Place of Birth, Register N (ID), Nationality, Marital Status (Select), Number of Children, Gender (Select)
- **Medical Case:** Any Medical Case? (Yes/No), Define (Textarea if Yes)

#### Section B: Contact & Address
- **Address:** Mouhafaza (Select), Qadaa (Select), Region (Select), City (Text), Street (Text), Building (Text)
- **Contact:** Telephone, Mobile, Email Address

#### Section C: Education & Languages
- **Degrees:** Secondary Degree (Text) + Year (YYYY), University Degree (Text) + Year (YYYY)
- **CNSS (Social Security):** CNSS Checkbox/Status, CNSS No (Text)
- **Languages Matrix:** Grid for English, French, Arabic — each with Select/Radio for Read, Write, Speak proficiency levels

#### Section D: Experience (Dynamic Arrays — useFieldArray)
Repeatable blocks with [+ Add] button:
- Work Experience: Add Work Experience
- Stage (Internship) Experience: Add Stage Experience
- Work Shop: Add Work Shop

#### Section E: Placement (Garderie Infos)
- **Status & Location:** Remarks (Textarea), Active (Yes/No Switch), Branch (Select), Class (Select)

#### Section F: Compliance Documents (File Uploads)
Every doc block = File Upload zone + Expiry/Issue Date + [+ Add] for multiples:
- Contract Document: File + Expiry Date
- Medical Test Document: File + Expiry Date
- First Aid Document: File + Expiry Date
- Certificates: File + Date + Title
- General Attachments: File + Date + Title (Photo, ID, Vaccination Card)

---

## FEATURE 15: Branch & Compliance Management

### 1. Branches Directory

**Target User:** Nursery Owner / Super Admin. Modern shadcn DataTable.

**Columns:** Image (Avatar), Branch Name, Location, Mobile, Info (Button for Ministry Form), Date Created, Actions (Dashboard Link, Edit, Delete)

### 2. Basic Branch Form (Create/Edit)

Clean centered card form:
- Branch Name (e.g., "Branch 4")
- Branch Prefix (e.g., "Sai" for Saida)
- Branch Location
- Mobile (Telephone Input)
- Telephone (Telephone Input)
- Branch Image (drag-and-drop upload)

### 3. Ministry Compliance Form ("Edit Garderie Info")

**CRITICAL:** All UI labels in Arabic. Do NOT translate to English. English only for Zod schema + Prisma models.

**Layout:** Vertical Tabs or Stepper UI (prevent overwhelm from long scroll).

#### Header (Static display):
```
الجمهورية اللبنانية
وزارة الصحة العامة
مديرية الوقاية الطبية
دائرة صحة الأم والولد والمدارس
```

#### Section A: Legal Entity Type
Radio Group:
- شخص طبيعي (Natural Person)
- شخص معنوي (Legal Entity)

#### Section B: معلومات عن صاحب العلاقة (Owner Information)
Grid layout:
- الاسم (First Name)
- اسم الأب (Father's Name)
- العائلة (Family Name)
- اسم الأم (Mother's First Name)
- شهرة الأم (Mother's Maiden Name)
- تاريخ الولادة (DOB — Date Picker)
- محل الولادة (Place of Birth)
- الجنسية (Nationality)
- رقم السجل (Registry Number)

#### Section C: اسم الحضانة (Nursery Name)
- بالعربية (In Arabic)
- باللاتينية (In Latin/English)

#### Section D: عنوان الحضانة (Nursery Address)
- المحافظة (Governorate — Select)
- القضاء (District — Select)
- البلدة (Town/City)
- المنطقة العقارية (Real Estate Area)
- رقم العقار (Property Number)
- القسم (Section)
- الشارع (Street)
- المبنى (Building)
- الطابق (Floor)
- رقم الهاتف (Telephone)
- الفاكس (Fax)
- البريد الإلكتروني (Email)
- الرمز البريدي (Postal Code)

#### Section E: Staff Compliance Verification (Read-Only Data Tables)
Pulls from Teachers/Employees module. Manager reviews for compliance:
- عقود العمل لموظفي الحضانة (Employment contracts)
- شهادة صحية لموظفي الحضانة (Health certificates)
- إفادات الإسعاف الأولي لموظفي الحضانة (First aid certificates)
- شهادات موظفي الحضانة الدراسية (Educational certificates)
- إجازة ممارسة مهنة الطب للطبيب المسؤول (Medical practice license)
- تعهد الطبيب المسؤول (Doctor's commitment)
- إجازة ممارسة مهنة التمريض للممرضة (Nursing practice license)

#### Section F: Required Ministry Attachments (File Uploads)
Each requires: File Upload dropzone + Title input + Expiry Date input:
- صورة شمسية لصاحب الطلب مصدقة من مختار المحلة (Certified Passport Photo)
- صورة عن تذكرة الهوية أو إخراج قيد (Copy of ID)
- خريطة للبناء المنوي اتخاذه دار حضانة (Building map — min 200 sqm)
- سند ملكية أو إيجار أو عقد إستثمار (Property deed/lease)
- صورة عن عقد ضمان لسلامة الأطفال (Child safety insurance)
- النظام الداخلي لدار الحضانة (Internal Regulations doc)
- الملف الصحي الصادر عن وزارة الصحة العامة (Health File doc)

---

## MORE FEATURES COMING — User is still sending specs...
