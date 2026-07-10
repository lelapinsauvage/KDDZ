# Kiddz Online Critical Journey State Audit

**Status:** Source-backed discovery baseline
**Last updated:** 2026-07-10
**Scope:** J01-J07 from visible entry through mutation, validation, confirmation, recovery, and audit
**Runtime policy:** Read-only inspection of migrated records; no operational record was changed

## Purpose

This audit tests whether the current product merely presents each critical job or actually carries it to a trustworthy conclusion. It is intentionally deeper than a screen inventory. For every journey it identifies:

- the visible entry point;
- the current source of truth;
- the server mutation and validation boundary;
- what the interface calls complete;
- what happens after interruption, error, correction, or deletion;
- the parity behavior that cannot disappear;
- the state contract the redesign must establish.

The target is not to hide legacy complexity behind cleaner cards. The target is to make completion true, explainable, reversible where appropriate, and auditable for nursery operations.

## Evidence Boundary

Evidence comes from authenticated role runtime inspection and the following implementation surfaces:

- Dashboard and Today pages and actions.
- Child and staff attendance actions, forms, and Prisma models.
- Daily-report forms, batch entry, validation, approval, and persistence.
- Medical and accident forms and actions.
- Staff events, imported attendance logs, classes, and employee records.
- Payment, accounting-entry, receipt, and invoice surfaces.
- Monthly reports, settings exports, and SQL backup routes.

No production operator was interviewed during this pass. Legal ratio rules, approval authority, notification deadlines, and the desired offline conflict policy remain validation questions. Findings about what the code does are confirmed; target workflow details remain hypotheses until operator and jurisdiction validation.

## State-Contract Vocabulary

| Dimension | Question the product must answer |
| --- | --- |
| Entry | Where does the user begin, and is the active branch, room, date, and role unambiguous? |
| Source of truth | Which persisted object proves the state? |
| Mutation | Which server operation changes it, and is the operation atomic and idempotent? |
| Validation | Does the server independently enforce scope, permission, required evidence, and transition rules? |
| Confirmation | Does the UI report what actually changed rather than what the client intended? |
| Recovery | Can interruption, duplicate action, partial failure, correction, and deletion be handled safely? |
| Audit | Can an authorized person establish who changed what, when, why, and from which prior state? |
| Downstream effect | Do ratios, parent state, finance, work queues, and exports consume the same canonical state? |

## Executive Risk Register

| ID | Confirmed current behavior | Operational consequence | Priority |
| --- | --- | --- | --- |
| R01 | Confirming child attendance stores only new absence rows; no present or confirmation record is written | The UI can say attendance is complete when the database cannot prove it | P0 |
| R02 | Attendance defaults every visible child to present and does not hydrate existing absences | A reload or interruption can visually reverse an absence and invite false confirmation | P0 |
| R03 | Batch care entry pre-fills observed facts and counts drafts as done | Unobserved care can be submitted and incomplete records can appear complete | P0 |
| R04 | An absent daily report does not create the absence object consumed by attendance | The same child/date can be interpreted differently by adjacent modules | P0 |
| R05 | Medical required fields and status transitions are not independently enforced by the server action | A direct invocation can bypass the visible safety workflow | P0 |
| R06 | Medical and daily-report updates use destructive replace steps without a complete transaction | Partial failure can remove nested health or care evidence | P0 |
| R07 | Staff logs, absence events, room membership, and capacity are isolated; no ratio engine or rota exists | The manager cannot complete a staffing/ratio exception journey in the product | P0 |
| R08 | Payments and accounting entries are separate ledgers with no allocation relation | A recorded payment does not necessarily update the balance shown from accounting entries | P0 |
| R09 | Export labels promise richer evidence and formats than the generated files contain | An inspection package can look complete while omitting required evidence | P0 |
| R10 | Sensitive medical and daily records can be hard-deleted without reason or durable change history | Audit reconstruction and accountability are weakened | P0 |

## J01 - Open The Nursery Safely

### Current path

1. Administrator or manager lands on `/dashboard`; teacher is redirected to `/today`.
2. Dashboard loads demographic totals, daily compliance counts, and action-center metrics.
3. The user must visit Today, employee attendance, classes, alarms, and medical modules to infer readiness.
4. There is no opening-readiness confirmation or persisted audit event.

### Current source and mutation

- `src/app/(app)/dashboard/page.tsx` calls `getDashboardDemographics`, `getDailyComplianceStats`, and `getActionCenterMetrics`.
- `src/lib/actions/dashboard.ts` also contains `getMorningBriefing`, but the dashboard does not consume it.
- The latent briefing estimates child presence from daily reports and staff presence from employee headcount minus absence events. It does not consume actual check-in/out logs, room assignment, qualification coverage, or a ratio rule.
- There is no canonical `OpeningReadiness`, `RoomCoverage`, or `RatioSnapshot` object and no mutation that confirms readiness.

### What works today

- Branch and academic-year context are globally available.
- Dashboard metrics, Today, staff logs, classes, alarms, and medical records expose many of the underlying facts.
- Stable deep links preserve access to the source records.

### Completion, error, and recovery gap

- No state says whether a room is ready, unsafe, awaiting attendance, awaiting staff, or blocked by a health exception.
- Dashboard totals can be complete while live readiness is unknown.
- There is no accountable owner, resolution path, override reason, confirmation, reopen behavior, or audit history.
- Role runtime shows manager receives the administrator home rather than a branch-opening workflow.

### Target contract

1. Opening readiness is computed from canonical child attendance, staff presence, room assignment, qualification evidence, jurisdiction rules, and active safety exceptions.
2. Every room has `UNKNOWN`, `AT_RISK`, `SAFE`, or `CLOSED` state with timestamped causes.
3. Manager confirmation records scope, source-data version, confirming user, time, unresolved exceptions, and any authorized override reason.
4. Subsequent child/staff changes automatically invalidate or update the relevant readiness state.
5. Every summary drills into the exact records producing it; no inferred status is presented as observed fact.

### Parity constraints

Existing dashboard, Today, alarm, employee attendance, class, and branch destinations remain reachable. The redesign may synthesize them, but cannot delete their records, exports, aliases, or role restrictions.

## J02 - Mark Attendance With Exceptions

### Current path

1. Teacher or manager opens `/today`.
2. Every filtered child appears selected as present because `absentIds` starts empty.
3. The UI says to uncheck absent children and confirm.
4. `markBulkAttendance` receives only the absent child IDs.
5. The client writes `attendance-marked-${date}` to browser local storage and can hide the marker.

### Current source and mutation

- `src/components/today/attendance-marker.tsx` owns the client selection and local completion marker.
- `src/lib/actions/attendance.ts::markBulkAttendance` verifies absent child IDs belong to the organization, avoids duplicate absence rows, and creates `AbsenceReport` records for newly absent children.
- It writes no present record, no roster snapshot, and no attendance-confirmation object.
- Monthly attendance later infers `PRESENT` from the existence of a `DailyReport` and `ABSENT` from an `AbsenceReport`.

### Confirmed integrity failures

- Confirming everybody present with zero absences writes nothing to the database.
- Existing absence rows are not loaded into the selection, so reload can show an absent child as present.
- Re-selecting an absent child does not remove or resolve the existing absence.
- The local-storage marker is scoped only by date, not organization, branch, room, or user.
- The component ignores the server error result and offers no visible retry or correction path.
- Dates use a UTC ISO conversion in the client, which can disagree with local nursery date near a timezone boundary.
- The separate staff-attendance screen has a similar default: each staff member is treated as present until edited, and submission appends logs without duplicate or replacement semantics.

### What works today

- Organization membership is checked server-side for absent children.
- Duplicate absence creation for the same submitted child/date is avoided.
- Absence records support detailed follow-up, attachments, status, and legacy data through the full absence form.

### Target contract

1. A canonical `AttendanceSession` identifies organization, branch, room, local operational date, expected roster version, recorder, and status.
2. Every expected child begins `UNKNOWN`; the user explicitly records `PRESENT`, `ABSENT`, `LATE`, `EXPECTED`, `LEFT`, or an approved local equivalent.
3. Confirmation persists all child states atomically and returns the server-confirmed summary.
4. Existing state hydrates exactly on reload; a correction transitions the same attendance fact rather than creating a contradictory fact.
5. Medical, authorized-collection, and safeguarding warnings appear before the relevant child transition, subject to role scope.
6. Undo is a recorded correction with actor and reason, not silent deletion.
7. Ratio and parent-facing state consume the same canonical attendance event stream.
8. Offline work uses a scoped queued session with visible sync/conflict state; local storage alone never represents completion.

### Parity constraints

Absence forms, drafts, attachments, reports, child attendance history, heatmaps, legacy attendance aliases, and native outputs remain available. The new attendance source must be able to derive compatible historical views without rewriting imported history blindly.

## J03 - Record The Room's Care Activity

### Current path

1. Practitioner opens `/daily-reports/batch` or an individual report.
2. The batch page exposes one expandable child at a time.
3. The inline form is pre-filled with meal portions, nap, sleep time, mood, and false health flags.
4. Save creates a draft or submitted `DailyReport`; the page then labels children with any report as done.

### Current source and mutation

- `src/app/(app)/daily-reports/batch/batch-report-client.tsx` manages the batch roster and completion display.
- `src/components/daily-reports/daily-report-form.tsx` provides the full record workflow.
- `src/lib/actions/daily-reports.ts` creates, updates, approves, and deletes reports.
- `src/lib/validations/daily-report.ts` validates the form shape.
- `src/lib/legacy-daily-report-approval.ts` preserves legacy completeness and approval behavior.

### Confirmed integrity failures

- The batch form defaults breakfast and lunch to `ALL`, nap to true, sleep to 12:30-14:30, and mood to `HAPPY`. These are observations, not harmless UI defaults.
- A user can submit those values without touching them.
- `completedChildren` is initialized from any `hasReport`; drafts therefore render as done, making the draft badge path effectively unreachable.
- The batch screen is not a true shared-value/exception workflow and provides no autosaved interruption recovery.
- The full form supports an `ABSENT` attendance mode, but creation stores that state in daily-report legacy JSON rather than creating the `AbsenceReport` read by attendance.
- `applyFoodForAll` is recorded as metadata but does not apply a value to multiple children.
- Update removes nested fever/milk rows and attachments in separate destructive operations rather than one complete transaction. A partial failure can lose evidence.
- Hard deletion has no reason, undo period, or durable activity record.
- There is no optimistic concurrency guard if two users edit the same report.

### What works today

- Child organization and user access are checked.
- The child/date uniqueness rule prevents duplicate daily reports.
- Draft, submitted, approved, and legacy approval paths exist.
- Creation uses nested persistence for several child records, and validation errors can reach the form.
- Print, export, parent access, and historical records are preserved.

### Target contract

1. Unobserved care values begin unset; defaults are allowed only for non-factual preferences such as the user's last selected room.
2. A true `RoomCareSession` applies an explicitly chosen shared observation to selected children, then surfaces exceptions and incomplete children.
3. Draft state autosaves with server revision, local sync state, and interruption recovery.
4. Draft, submitted, approved, and communicated are visually and semantically distinct.
5. Absence is one canonical attendance transition referenced by the care report, not a second incompatible absence representation.
6. Nested update is atomic and uses version conflict detection.
7. Submission returns the server-confirmed child count, omissions, warnings, parent-delivery state, and direct correction path.

### Parity constraints

All imported fields, legacy completeness rules, direct approval permissions, drafts, print views, parent reports, batch entry, food/sleep/health rows, attachments, and native daily-report contracts remain represented.

## J04 - Resolve A Child Safety Or Health Issue

### Current path

1. User enters from Today, child workspace, medical navigation, accident list, or alarms.
2. The selected form collects health or incident data and optional evidence.
3. The client presents Save as Draft or a form-specific submit action.
4. Records can later be reviewed, edited, exported, or deleted.

### Current source and mutation

- `src/lib/actions/medical.ts` provides generic medical-form create, update, and delete operations.
- Accident, general health, conditions, visits, vaccinations, and other clients shape their own form UI.
- `src/app/(app)/medical/accidents/[id]/accident-detail-client.tsx` enforces several required accident fields in the browser.
- `MedicalForm`, nested entries, and attachments persist the result.

### Confirmed integrity failures

- Generic server creation validates child, form type, and organization scope, but does not independently enforce the required form-specific evidence shown by the client.
- Any authenticated organization user able to invoke the action reaches the same create/update/delete boundary; the action does not enforce role/action authority.
- Status can be supplied or changed without a transition policy, reviewer authority, acknowledgment, or concurrency check.
- Update replaces nested entries by deleting and recreating them outside a complete transaction; the main form and attachment writes are separate.
- Records do not preserve `updatedBy`, a version ledger, approval history, parent acknowledgment, or a manager escalation state.
- Submitting a form does not itself create a clearly owned notification/follow-up action.
- Delete hard-deletes sensitive evidence without deletion reason or recoverable tombstone.

### What works today

- Child and organization scoping is enforced.
- Creation can persist nested entries and attachments atomically.
- Draft/submitted/reviewed states and broad medical record coverage already exist.
- Alarm generation and delivery auditing exist elsewhere in the product.
- Child context, historical views, and attachments preserve important legacy breadth.

### Target contract

1. Each health workflow has a server-owned schema, required evidence, allowed roles, and explicit state machine.
2. `DRAFT`, `SUBMITTED`, `TRIAGED`, `REVIEWED`, `PARENT_NOTIFIED`, `ACKNOWLEDGED`, and `CLOSED` are introduced only where the real workflow requires them.
3. Save and transition operations are atomic, versioned, and attributed.
4. A submitted incident creates an owned work item with deadline, severity, assignee, required communication, and escalation policy.
5. Sensitive corrections append history; deletion is permissioned, reasoned, recoverable where law permits, and audit-visible.
6. The child safety summary exposes only role-appropriate information and always links to the exact source record.

### Parity constraints

Every medical form family, imported field, attachment, draft, report, alarm, child link, legacy route, and native parent-safe projection remains supported. New state must wrap and strengthen those records rather than flattening them into one generic incident.

## J05 - Resolve A Staffing And Ratio Exception

### Current path

There is no complete current path. A manager can inspect staff lists, create absence/day-off/warning events, import or manually append attendance logs, inspect classes, and inspect child attendance separately.

### Current source and mutation

- `EmployeeEvent` records `SICK`, `ABSENT`, `DAY_OFF`, or `WARNING` for an employee/date.
- `TeacherAttendance` stores check-in/out, late, and early-leave logs for teacher, nurse, doctor, or manager records.
- `Class` stores age range, capacity, max students, child membership, and teacher membership.
- `src/lib/actions/employee-events.ts` verifies employee branch ownership and appends/updates events or logs.
- The manual staff-attendance screen defaults every active filtered employee to present, converts absence to a log with a note, and appends one record per filtered employee.

### Confirmed missing capability

- No rota, shift, availability, room assignment over time, required qualification, qualification expiry, age-band rule, mixed-age rule, staff break, agency cover, or ratio-calculation model exists.
- No server or UI path detects a room/time at risk, explains the cause, suggests qualified cover, records a reassignment, or confirms restored compliance.
- Attendance log creation has no uniqueness or idempotency rule; repeated submissions can append duplicate logs.
- `employeeId` and `employeeType` are polymorphic strings without database relations to employee records.
- Event/log changes have organization checks but no action-level role policy, updated-by history, or reasoned correction history.
- The latent dashboard briefing uses headcount minus absence events rather than actual live check-ins or room coverage.

### What works today

- Staff directories, class membership/capacity, absence events, scanner-compatible imports, manual attendance, log correction, and legacy attendance fields are present.
- Branch ownership checks reduce cross-organization mutation risk.

### Target contract

1. Introduce jurisdiction-configured `RatioRule`, versioned `StaffQualification`, `Shift`, `RoomAssignment`, `PresenceEvent`, and computed `RatioSnapshot` concepts after legal validation.
2. Preserve imported scanner logs as evidence while deriving one canonical staff-presence timeline with duplicate detection and correction history.
3. A ratio exception names room, time range, affected age band, observed/required staffing, missing qualification, and source records.
4. The resolution workflow offers only available, qualified, permitted cover and models knock-on risk to the source room.
5. Reassignment or override is atomic, attributed, time-bounded, and recalculates both rooms immediately.
6. The manager can confirm resolution or escalate; unresolved unsafe state remains visibly active.
7. Rules are effective-dated and jurisdiction-specific; the interface never hard-codes an unverified legal ratio.

### Parity constraints

Staff listings, events, attendance import, scanner metadata, manual logs, classes, child attendance, payroll aliases, and historical records remain accessible. New scheduling and ratio data supplements these records and must not reinterpret legacy evidence without provenance.

## J06 - Collect And Reconcile Payment

### Current path

1. User enters accounting globally or from a child.
2. User records payment amount, method, category, date/coverage, notes, and optional receipt.
3. The product creates a `Payment`, displays it by category, and can print an invoice/receipt route.
4. A separate `AccountingEntry` ledger produces fee, discount, payment, adjustment, and balance totals.

### Current source and mutation

- `src/lib/actions/payments.ts` owns payment create, quick create, update, delete, summary, and child history.
- `src/lib/actions/accounting.ts` owns accounting entries and balance calculation.
- `Payment` and `AccountingEntry` have no relation or allocation object connecting them.
- Quick payment uses Zod validation and always creates `PAID`; generic create/update trust typed input without independent schema parsing.

### Confirmed integrity failures

- Recording a `Payment` does not create or allocate an `AccountingEntry`, while the child balance is calculated from accounting entries. Total paid and outstanding can therefore come from different ledgers.
- The UI shows payment summary beside accounting-entry balance without explaining the source mismatch.
- `updatePayment` verifies the current payment belongs to the organization but does not verify a replacement `childId` before reassignment.
- There is no duplicate/idempotency key, allocation to fee lines, unapplied balance, split payment, refund, credit, reversal, or reconciliation state.
- Coverage month ordering is not independently validated, and the academic start year derives from the current calendar instead of explicit active context.
- Edit history, `updatedBy`, parent delivery, and acknowledgment are absent.
- Payment deletion is a soft delete and reminder cleanup is transactional, but no actor/reason/undo information is stored.

### What works today

- Quick payment validates positive amount and supported method/category fields.
- Payment creation validates child organization access and stores creator identity.
- Receipts, print output, attachments, category history, summaries, filters, exports, reminders, and native finance projections exist.
- Soft deletion is safer than hard deletion and removes related reminders atomically.

### Target contract

1. Define one accountable family ledger with versioned charge, discount, adjustment, payment, allocation, refund, and reversal events.
2. Recording payment atomically creates the payment and explicit allocation or leaves a visible unapplied amount.
3. Balance, paid, overdue, receipt, parent view, reports, and exports derive from the same ledger.
4. Server validation covers organization scope for every referenced child/charge, currency, amount, coverage, duplicate detection, status transition, and role authority.
5. Corrections use reversal/reallocation with actor and reason rather than destructive replacement.
6. Confirmation reports previous balance, allocation, remaining balance, receipt state, and parent-delivery state.

### Parity constraints

Imported payments and accounting entries retain provenance. Existing invoice/receipt routes, categories, coverage dates, reminders, attachments, child/global accounting, CSV output, and parent/native finance contracts remain supported during ledger convergence.

## J07 - Prepare For Inspection

### Current path

1. User visits monthly reports, branch compliance, medical/attendance lists, or `/settings/export`.
2. Reports can filter, print, copy, and export several tabular formats.
3. Settings export offers SQL, children, daily, medical, finance, and employee cards.
4. Administrator can generate a restorable SQL backup through the protected legacy export route.

### Current source and mutation

- `src/app/(app)/reports/monthly/**` provides operational attendance reporting and row deep links.
- `src/app/(app)/settings/export/page.tsx`, `src/components/shared/export-button.tsx`, and `src/lib/export.ts` build browser downloads.
- `src/app/(app)/exportdb.php/route.ts` and `src/lib/database-sql-export.ts` create database SQL backups.

### Confirmed integrity failures

- The settings format control advertises CSV and Excel, but the selected format is not used for non-SQL exports; they always generate CSV.
- Children export promises parent contacts but omits them.
- Daily export promises meals, naps, and activities but emits only identity, date, status, mood, and remarks.
- Medical export promises vaccinations, conditions, and visits but emits only medical-form metadata.
- Financial export promises invoices and summaries but emits payment rows only.
- Default export dates are hard-coded to February 2026.
- Export failures are logged to the console rather than shown to the user.
- There is no inspection package, completeness check, evidence manifest, provenance summary, data-as-of timestamp, generated-by record, or package audit trail.
- Sensitive files download unencrypted without a purpose/recipient confirmation.
- SQL backup is restorable and admin-protected, but it is a disaster-recovery artifact, not regulator-ready evidence.

### What works today

- Monthly attendance supports useful filters, row deep links, print, copy, XLSX, CSV, and PDF.
- Broad legacy export and print capability has been retained.
- SQL export is administrator-only, uses no-store response headers, and provides a restorable database path.
- Branch compliance and record-specific evidence are accessible in the source modules.

### Target contract

1. An `InspectionPackage` is defined by branch, jurisdiction/template, date range, data-as-of time, requested evidence sets, and generator.
2. Preflight names missing, expired, contradictory, or permission-restricted evidence before generation.
3. Every artifact has a manifest entry with source object, source revision, generated time, format, checksum, and redaction policy.
4. Generation is server-side, role-authorized, visibly progressing, retryable, and auditable.
5. Package state distinguishes draft, blocked, ready, generated, shared, expired, and revoked where needed.
6. Operational export labels exactly match their content and format.
7. Database backup remains a separate administrator recovery tool with confirmation, audit, restore runbook, and encryption policy.

### Parity constraints

All current CSV/XLSX/PDF/print routes, monthly reports, source record deep links, legacy exports, and restorable SQL behavior remain available until the package system reproduces their contracts and passes parity verification.

## Cross-Journey Root Causes

### 1. Completion is often client-declared

Local component state, a toast, a redirect, or browser storage can call work done even when no canonical completion object exists. Completion must become a server-confirmed domain transition.

### 2. Parallel representations disagree

- Child presence is inferred from daily reports while absence uses a separate report.
- Staff presence uses event estimates, imported logs, and manual logs without one timeline.
- Financial balance and recorded payments use separate stores.
- Medical status exists without a complete transition/audit model.

The redesign needs explicit canonical objects and compatibility projections, not another presentation-only aggregation layer.

### 3. Server authorization is too coarse for high-risk actions

Organization membership is frequently checked, which is valuable. Many mutations do not then enforce role, action authority, transition authority, or separation of duties. Navigation filtering is not an authorization boundary.

### 4. Destructive replacement substitutes for versioned change

Several updates delete nested evidence and recreate it. High-risk records need atomic transactions, optimistic concurrency, actor attribution, and append-only history or reasoned corrections.

### 5. Exception ownership is absent

Alarms and statuses expose conditions, but the product rarely records owner, deadline, escalation, resolution evidence, or closure. The target action center must represent work, not badges.

### 6. Time and scope are not one operational context

UTC-derived dates, stale school-year context, branch filters, and unscoped local storage can produce contradictory interpretations. Operational local date/time, branch, room, academic context, and source revision must travel together.

## Required Canonical Objects

Names are provisional; their responsibilities are not.

| Object | Responsibility | First journeys |
| --- | --- | --- |
| OperationalContext | Organization, branch, room, local date/time, academic context, role, and data revision | All |
| AttendanceSession and AttendanceEvent | Explicit expected/present/absent/late/left/unknown state and correction history | J01, J02, J05 |
| RoomCareSession | Batch observation, child exceptions, draft sync, and submission completeness | J03 |
| WorkItem | Cause, severity, owner, deadline, escalation, resolution evidence, and closure | J01, J04, J05, J07 |
| StaffPresence and RoomAssignment | Canonical staff timeline and time-bounded room coverage | J01, J05 |
| RatioRule and RatioSnapshot | Effective-dated legal rule and explainable room result | J01, J05 |
| RecordRevision and AuditEvent | Actor, reason, before/after revision, source, and correlation ID | All high-risk mutations |
| FamilyLedger and Allocation | Charges, payments, credits, reversals, allocation, and one balance | J06 |
| InspectionPackage and ManifestEntry | Preflighted, versioned, attributable evidence bundle | J07 |

## Implementation Order Implied By The Audit

1. Establish operational context, authorization policy, audit events, and idempotent mutation conventions.
2. Build canonical child and staff presence timelines before displaying live ratios.
3. Add versioned room assignment, qualification evidence, ratio rules, and explainable snapshots.
4. Rebuild Today/opening readiness and batch care on those state contracts.
5. Harden medical workflows with server schemas, transitions, transactions, ownership, and history.
6. Converge payment and accounting truth through explicit ledger allocation.
7. Build inspection preflight and package generation from versioned source records.
8. Keep compatibility adapters for every parity row and prove old/new projections during migration.

## Acceptance Gate For Future Design Work

A redesigned critical flow is not accepted until it demonstrates:

- one named persisted source of truth;
- server-side scope, role, and transition validation;
- atomic or safely resumable mutation behavior;
- server-confirmed completion;
- interruption and duplicate-action handling;
- visible correction or undo semantics;
- actor and revision history for high-risk records;
- consistent downstream projection;
- legacy and native parity mapping;
- keyboard, zoom, reduced-motion, and responsive browser verification.

## Open Validation Questions

1. Which candidate policy pack in `jurisdiction-policy-baseline.md`, provider/service classes, and qualification categories must ship first? England and Ireland are researched baselines, not a launch-market decision.
2. Which actions require manager, nurse, doctor, or dual approval?
3. Which attendance corrections must notify parents, and what is the acceptable correction window?
4. Which care facts may be inherited as deliberate batch values, and which must always be recorded child by child?
5. What is the authoritative billing model: monthly charges, funded hours, sessions, subsidies, sibling discounts, credits, or a combination?
6. Which inspection packages and retention/redaction policies are required for the first market?
7. Which critical tasks must operate offline, and who resolves conflicting edits?
8. Which imported legacy records are immutable evidence versus editable operational data?
