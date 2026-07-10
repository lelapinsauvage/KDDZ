# Kiddz Online Canonical Flow Inventory

**Status:** Discovery draft 1
**Last updated:** 2026-07-10
**Scope:** Modern web application, legacy web aliases, parent web surface, and native parent API contracts

## Purpose

The repository contains 244 page files, but users do not experience 244 independent products. This inventory groups the current route surface into canonical jobs so the redesign can improve workflows without losing legacy behavior.

A canonical flow is the modern experience. Legacy `.php` routes, encrypted-id bridges, print views, and native response contracts remain supported entry points or outputs; they do not each receive a separate visual design.

## Authoritative Inputs

- `src/components/layout/app-sidebar.tsx`: current role navigation and permission filtering.
- `src/app/**/page.tsx`: current web route surface.
- `src/app/api/parent/**/route.ts`: parent API surface.
- `src/app/ws/**/route.ts`: native legacy aliases.
- `prisma/schema.prisma`: roles, record states, and data relationships.
- `docs/page-parity-matrix.json`: 1,713-row behavior-preservation source.
- `docs/legacy-inventory.md`: archived PHP, JavaScript, webservice, and SQL inventory.
- `docs/redesign/parity-domain-ledger.json`: deterministic row-to-domain mapping for all 1,713 parity rows.
- Browser baseline captures in `docs/redesign/baseline/`.

## Roles

| Role | Current navigation model | Canonical home need |
| --- | --- | --- |
| Administrator | Full entity-oriented navigation plus dynamic classes and system administration | Cross-branch state, risk, money, staffing, and exceptions |
| Manager | Same broad structure as administrator, filtered by permissions | Branch readiness, ratios, staffing, attendance, parent and compliance actions |
| Teacher | Today, reports, children, communication | Room roster, attendance, care recording, handover, messages |
| Nurse | Dashboard, health, children, communication | Medical exceptions, medication, vaccinations, incidents, follow-up |
| Doctor | Same health navigation as nurse | Assigned reviews, medical history, clinical actions |
| Parent | Separate web/native surface | Child day, messages, notifications, calendar, finance |

## Canonical Product Domains

| ID | Domain | Core user intent | Canonical modern routes | Representative legacy/native entry points | Primary roles |
| --- | --- | --- | --- | --- | --- |
| F01 | Authentication and recovery | Enter the correct organization and recover access safely | `/login`, `/forgot`, `/signup`, `/profile` | `/users/index.php`, legacy activation/disabled/public-profile routes | All roles |
| F02 | Organization context | Know and change the active branch and school year without losing work | Global header context switcher, `/settings/organizations` | Legacy session database, scholastic-year, and garderie registry behavior | Admin, manager |
| F03 | Today and opening readiness | See the live nursery state and start the highest-priority work | `/today`, `/dashboard` | `/index.php`, admin home aliases | Admin, manager, teacher |
| F04 | Attendance and check-in | Mark arrivals, absences, and departures accurately and quickly | `/today`, `/children/[id]/attendance`, `/attendance/heatmap` | `/child_attend_det.php`, `/child_attend_det_data.php` | Manager, teacher |
| F05 | Branch and room operations | Review branches, classes, capacity, performance, and room context | `/branches`, `/branches/[id]/**`, `/classes`, `/classes/[id]` | `/branches.php`, `/branch.php`, `/Branch_Dashboard.php`, `/classes.php`, `/class.php`, `/class_dashboard.php` | Admin, manager |
| F06 | Child roster and enrollment | Find, create, classify, activate, move, export, or remove a child | `/children`, `/children/new`, `/children/drafts` | `/children.php`, `/children_drafts.php`, `/Child_Details.php` | Admin, manager, teacher |
| F07 | Child workspace | Understand one child and move between care, attendance, health, finance, calls, and reports | `/children/[id]/**` | Child dashboard, absence, accident, accounting, attendance, calls, report PHP routes | Admin, manager, teacher, nurse, doctor |
| F08 | Daily care reports | Record, batch, draft, submit, review, print, and export a child's day | `/daily-reports/**` | `/dailyreport.php`, native `/ws/daily.php`, `/ws/newdaily.php` | Teacher, manager, parent read-only |
| F09 | Absence workflows | Record absence, preserve evidence, review status, and report missing absence records | `/absent-reports/**`, `/children/[id]/absence` | `/absentreport.php`, `/absentreports.php`, `/absentreportsD.php`, `/ws/absence.php` | Teacher, manager, parent read-only |
| F10 | Medical and incidents | Create and review general medical, conditions, visits, vaccinations, medication, and accidents | `/medical/**`, `/children/[id]/medical`, `/children/[id]/accidents` | Medical form PHP bridges, accident aliases, vaccination/medicine alarm feeds | Nurse, doctor, manager |
| F11 | Assessments and development | Create, draft, submit, schedule, and review developmental assessments | `/assessments/**` | `/assessment_1.php` through `/assessment_7.php`, assessment alarm aliases | Teacher, manager |
| F12 | Parent contact and calls | Log parent calls, causes, outcomes, and child-linked history | `/calls/**`, `/children/[id]/calls` | `/calls.php`, `/call.php`, `/bcalls.php`, `/child_calls.php` | Admin, manager, teacher |
| F13 | Messaging | Read, compose, target, send, and audit direct/class/broadcast messages | `/messages/**` | `/Msg_list.php`, `/message_portal.php`, `/message_portal_class.php`, `/message_portal_single.php`, native message aliases | All staff, parent |
| F14 | Alerts and follow-up | See, filter, understand, and resolve operational notifications | `/alarms/**`, global alarm bar | `/alarms.php`, alarm-family aliases, native `/ws/*_alarms.php` | Role and permission dependent |
| F15 | Food and calendars | Manage food items, branch menus, holidays, events, and print calendars | `/food/**`, `/settings/holidays`, `/settings/events` | `/food.php`, `/food_calendar.php`, `/holiday_calendar.php`, `/NotifCalendar.php`, parent calendar APIs | Admin, manager, teacher, parent read-only |
| F16 | Staff lifecycle | Find, create, edit, review, document, activate, and remove staff by role | `/employees/teachers/**`, `/employees/managers/**`, `/employees/nurses/**`, `/employees/doctors/**`, `/employees/staff` | Staff listing/detail PHP routes and profile downloads | Admin, manager |
| F17 | Staff attendance and scheduling | Review calendars, import attendance, inspect logs, and resolve coverage | `/employees/calendar`, `/employees/attendance`, `/employees/attendance-logs` | `/calendar.php`, `/attendance.php`, `/PA_logs.php`, payroll data aliases | Admin, manager, teacher read-only where allowed |
| F18 | Accounting and payments | Understand balances, record payments, inspect child ledgers, print invoices, and export | `/accounting`, `/accounting/invoice/[id]`, `/children/[id]/accounting` | `/accounting.php`, `/invo.php`, native `/ws/finance.php` | Admin, manager, parent read-only |
| F19 | Reports and exports | Answer attendance, branch, finance, care, compliance, and audit questions | `/reports/monthly`, `/reports/monthly-branch`, `/settings/export`, print routes | Legacy TableTools exports, print/PDF routes | Admin, manager |
| F20 | Compliance and branch evidence | Maintain legal entity, capacity, insurance, lease, management, ministry, and staff evidence | `/branches/[id]/compliance/**` | Legacy branch and attachment records | Admin, manager |
| F21 | Administration and access | Configure nursery, users, roles, permissions, notifications, regions, school years, and legacy controls | `/settings/**`, `/users/admin/**` | `/settings.php`, `/users.php`, `/levels.php`, `/newyear.php`, `/nurseryinfo.php`, address aliases | Admin |
| F22 | Parent experience and native compatibility | Give parents secure access to child day, messages, alarms, calendars, and finance | `/parent`, `/parent/login`, `/api/parent/**` | `/ws/*.php`, legacy iOS and Android parsers | Parent |

## Critical End-to-End Journeys

### J01 - Open the nursery safely

1. Choose or confirm branch and school year.
2. See opening state: expected children, checked-in children, absent children, staff present, room ratios, medical/safeguarding exceptions.
3. Resolve unsafe or unknown states.
4. Confirm opening readiness and preserve the audit event.

**Current components:** context switcher, dashboard summaries, `/today` attendance marker, alarms, staff attendance.

**Current gap:** no single surface combines staff presence, child attendance, and live room ratios.

### J02 - Mark attendance with exceptions

1. Select branch and room.
2. Review expected children.
3. Mark arrivals, known absences, late arrivals, and unknowns.
4. Surface medical or collection alerts before confirmation.
5. Confirm with an exception summary and undo path.
6. Update live ratio and parent-facing state.

**Current components:** `/today`, absence reports, child medical data, attendance history.

**Current risk:** the visible Today screen begins with every child selected and instructs the user to uncheck absent children, making accidental false-present confirmation possible.

### J03 - Record the room's care activity

1. Start from the room roster.
2. Apply a shared meal, sleep, mood, activity, or care value in batch.
3. Edit individual exceptions.
4. See incomplete children before submission.
5. Save drafts safely during interruption.
6. Submit and communicate the completed day.

**Current components:** `/daily-reports/batch`, single reports, drafts, child report history.

### J04 - Resolve a child safety or health issue

1. Enter from alert, Today, child search, or room roster.
2. See the child's identity, guardians, allergies, conditions, medication, insurance, and recent incidents.
3. Record the correct medical or accident workflow.
4. Attach evidence and identify the responsible staff member.
5. Notify or follow up with authorized people.
6. Preserve an audit trail.

### J05 - Resolve a staffing and ratio exception

1. Detect the room and time period at risk.
2. Understand which child age band or staff absence caused it.
3. Find qualified available cover.
4. Reassign or adjust attendance.
5. Confirm restored compliance and record the decision.

**Current components:** staff listings, staff attendance logs, classes, child attendance.

**Current gap:** these components are separate and no ratio-resolution flow exists.

### J06 - Collect and reconcile payment

1. Find a child, family, invoice, or overdue amount.
2. Understand the balance and its components.
3. Record payment method, amount, date, and evidence.
4. Confirm allocation and updated balance.
5. Generate receipt or invoice and communicate it.

### J07 - Prepare for inspection

1. See missing or expiring evidence by branch.
2. Assign or resolve each issue.
3. Inspect child, staff, branch, medical, attendance, and policy evidence.
4. Export a complete, dated package.
5. Preserve who generated it and from which source data.

## Role-to-Task Matrix

| Task | Admin | Manager | Teacher | Nurse | Doctor | Parent |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| Cross-branch state | Primary | Scoped | - | - | - | - |
| Opening readiness and ratios | Oversight | Primary | Room input | Health exceptions | Clinical exceptions | - |
| Child attendance | Oversight | Primary | Primary | Read | Read | Own child read |
| Daily care reports | Oversight | Review | Primary | Health contribution | Read | Own child read |
| Child profile | Full | Full | Scoped | Health scope | Health scope | Own child subset |
| Medical and incidents | Oversight | Operational | Initiate incident | Primary | Primary | Own child subset |
| Assessments | Oversight | Review | Primary | - | - | Own child subset |
| Staff and scheduling | Full | Primary | Own schedule | Own schedule | Own schedule | - |
| Messaging and calls | Full | Primary | Primary | Scoped | Scoped | Own threads |
| Finance | Full | Primary | - | - | - | Own child subset |
| Compliance and evidence | Full | Primary | Contributions | Contributions | Contributions | Required forms only |
| Settings and access | Primary | Limited | - | - | - | Account only |

Permission mapping remains authoritative in the existing server checks and imported legacy PAGE/ACTION controls. This matrix describes the intended work relationship, not a replacement ACL.

## Task Priority Model

Each canonical flow will be ranked with four separate values:

- **Frequency:** actions per day or week.
- **Urgency:** how quickly the state must be understood or changed.
- **Risk:** safeguarding, legal, medical, financial, privacy, or data-integrity consequence.
- **Breadth:** number of roles and records affected.

Initial high-priority flows:

| Flow | Frequency | Urgency | Risk | Redesign priority |
| --- | --- | --- | --- | --- |
| Attendance and check-in | Very high | Immediate | High | P0 |
| Live ratios and staffing | Continuous | Immediate | Critical | P0 |
| Medical/safeguarding exceptions | Variable | Immediate | Critical | P0 |
| Daily care batch recording | Very high | Same day | Medium/high | P0 |
| Today and action-needed triage | Very high | Immediate | High | P0 |
| Child search and workspace | High | Immediate | High | P0 |
| Parent messaging | High | Same day | Medium/high | P1 |
| Staff absence and cover | Daily | Immediate | High | P1 |
| Billing and overdue payments | Weekly/daily | Time sensitive | High | P1 |
| Compliance evidence | Weekly/periodic | Deadline driven | Critical | P1 |
| Configuration and legacy administration | Low | Planned | High when used | P2 |

## Legacy Entry-Point Rules

1. A `.php` route may resolve ids, preserve query semantics, redirect, or render the canonical page, but must not fork the redesign into a second UI.
2. Legacy query fields such as `id`, `fid`, `from`, `to`, and `year` remain behavior contracts.
3. Print and PDF views are output templates, not general navigation destinations.
4. Native `/ws/*.php` aliases keep parser-safe response shapes and do not inherit visual redesign work.
5. Every redesigned flow records the parity rows and aliases it covers before the old presentation can be retired.
6. Permission filtering remains server enforced; hiding navigation is not sufficient authorization.

## Coverage Ledger

| Evidence area | Status | Next evidence |
| --- | --- | --- |
| Admin/manager navigation | Captured from source and browser | Permission variants and dynamic class behavior |
| Teacher navigation | Captured from source | Authenticated teacher runtime baseline |
| Nurse/doctor navigation | Captured from source | Authenticated nurse and doctor runtime baseline |
| Parent web/native | Route and API inventory complete | Runtime parent flow and native Mobbin analogues |
| Dashboard and Today | Desktop baseline complete | Compact desktop, tablet, mobile, and interaction traces |
| Lists and tables | Representative children, staff, medical, reports captured | Keyboard, selection, export, delete, and empty/error behavior |
| Child workspace | Details baseline complete | Edit, attendance, health, finance, and report subflows |
| Finance | Overview baseline complete | Record-payment and invoice flows |
| Messaging | Empty inbox baseline complete | Compose, target selection, sent, thread, and error states |
| Settings and access | Hub baseline complete | High-risk permission and legacy-user mutations |
| Parity row mapping | 1,713 of 1,713 rows assigned; zero unmapped | Review domain rules when the parity matrix changes |

## Next Discovery Actions

1. Capture role-specific runtime baselines for teacher, nurse, doctor, manager, and parent.
2. Trace J01 through J07 step by step, including mutations and error recovery.
3. Record real nursery policy inputs for ratios, funded hours, billing, and compliance jurisdiction.
4. Validate task priority with nursery operators or operational evidence.
5. Rerun `pnpm exec tsx src/scripts/report-redesign-parity-domains.ts` after parity-matrix changes.
