# Kiddz Online Information Architecture

**Date:** 2026-07-10  
**Status:** Territory-neutral IA specification  
**Applies to:** Staff web product, responsive staff projections, and compatibility routing

## Purpose

This specification turns the current entity- and legacy-owned navigation into a shallow operating model without removing capability. It is grounded in:

- 22 canonical product domains;
- 1,713 mapped parity rows;
- authenticated manager, teacher, nurse, doctor, and parent runtime audits;
- the seven critical journeys in `flow-inventory.md` and `journey-state-audit.md`;
- the authorization and data-scope audit;
- the operational and cross-device architecture syntheses;
- the three territory prototypes and their responsive browser evidence.

The IA is independent of the selected creative territory. It can be tested and refined without committing production UI to Daylight, Signal, or Carebook.

## Decision

The staff product uses seven stable work domains and one separated administration destination:

1. Today
2. Children
3. Rooms
4. Team
5. Messages
6. Finance
7. Reports
8. Settings, visually separated at the bottom of desktop navigation

This is the maximum desktop set, not a promise that every role sees every destination. Navigation visibility must come from the same server-owned capability and scope decision as route authorization.

Alerts are not a primary destination. They become owned work surfaced through Today, contextual record workspaces, and a global work-queue utility. Branches and school years are context, not menu folders. Dynamic class lists are searchable/saved data views, not global navigation.

## IA Principles

### Stable domains, changing work

The sidebar remains predictable while live room, child, staff, incident, and payment states change inside it. A new room, class, alarm family, or branch must never add another global navigation item.

### Context before destination

Branch, operational date, school year, role projection, and freshness are visible before a user acts. Switching context previews affected drafts and never silently discards scope.

### Work before archives

Today and record workspaces show current state, owned work, and the next valid action before complete history. Archive breadth stays reachable through tabs, filters, and Reports.

### One object, one canonical workspace

A child, room, staff member, incident, invoice, message thread, and compliance item each have one canonical destination. Alerts and legacy aliases deep-link into that destination with source context rather than creating a competing detail page.

### Capability is not menu visibility

Hidden navigation is not authorization. Every route, query, mutation, export, and compatibility alias must independently enforce tenant, role, assignment, relation, capability, and transition policy.

### Progressive disclosure preserves parity

Legacy fields and infrequent actions are not deleted. They move into appropriately named history, documents, advanced, or administration sections after the current state and common action.

## Global Product Shell

### Persistent desktop anatomy

1. **Primary navigation:** stable role-allowed domains.
2. **Operational context:** organization/branch, live or historical date, and school year when relevant.
3. **Page identity:** destination, current record, and unsaved or stale state.
4. **Global search:** people, rooms, branches, records, dates, states, and commands.
5. **Work queue:** owned, assigned, forecast, waiting, failed, and recently completed work.
6. **Notifications:** informational events only; actionable events create or link to work.
7. **Account and presence:** identity, role projection, device/sync state, and sign out.

### Context rules

- Branch context persists across Today, Children, Rooms, Team, Finance, and Reports.
- Historical date context does not silently affect live operations. The mode must visibly change from `Live` to `History`.
- School year applies to enrollment, assessments, reporting, and historical analysis; it must not redefine current attendance or live ratios.
- A multi-branch user can open an `All branches` oversight projection, but writes require a concrete branch.
- Switching branch with a draft open requires save, discard, or cancel. No silent cross-branch draft carryover.

### Global search result groups

- People: children, guardians, staff.
- Places: branches and rooms/classes.
- Work: assigned reviews, unknown attendance, missing care, payment follow-up, compliance evidence.
- Records: incidents, medical entries, assessments, calls, messages, invoices, reports.
- Commands: create child, mark attendance, record care, compose message, record payment, export report, change context.

Results expose scope and current state before navigation. Out-of-scope records are never revealed through autocomplete.

## Primary Navigation

### Today

**Job:** Understand the nursery in three seconds and resolve the most consequential current work.

**Contains:** Readiness statement, room operating plane, live attendance/ratio/staffing state, owned work queue, handover progress, and time-mode transitions.

**Does not contain:** Equal dashboard tiles, generic totals, a second alarms directory, broad reports, or fabricated charts.

**Canonical routes:** `/today` becomes the role-aware operational home. `/dashboard`, `/index.php`, and admin-home aliases resolve here while preserving allowed query context.

### Children

**Job:** Find a child or cohort, understand current restrictions and work, and enter the correct child workflow.

**Root views:** All children, attendance unknown, care incomplete, health/safety follow-up, assessment due, drafts, archived/inactive where permitted.

**Child workspace sequence:** Identity and guardians; critical restrictions; current attendance and room; current work; day/care; health; development; communication; finance where permitted; documents; history.

**Canonical routes:** `/children`, `/children/new`, `/children/drafts`, `/children/[id]/**`, `/daily-reports/**`, `/absent-reports/**`, `/medical/**`, `/assessments/**` when entered through child or cohort context.

### Rooms

**Job:** Operate the physical nursery: roster, ratio, staff coverage, schedule, menu, and branch evidence.

**Root views:** Live rooms, attendance, coverage, capacity/occupancy, planning, food/calendar, branch compliance.

**Room workspace sequence:** Live state; roster and expected arrivals; ratio source and forecast; staff assignment; active exceptions; room care completion; schedule; documents/history.

**Canonical routes:** `/classes`, `/classes/[id]`, `/branches`, `/branches/[id]/**`, `/food/**`, relevant calendar routes, and branch compliance routes.

The user-facing term is `Rooms` even if legacy storage calls them classes. The compatibility layer preserves legacy route and query semantics.

### Team

**Job:** Find staff, understand availability and qualification, manage lifecycle, and resolve coverage.

**Root views:** Staff, on duty, absent, coverage needed, schedules, attendance import/logs, expiring evidence.

**Staff workspace sequence:** Identity and role; current duty/room; qualifications and restrictions; current work; schedule/attendance; documents; history; administration.

**Canonical routes:** `/employees/**`, staff legacy detail/list aliases, attendance import, attendance logs, and staff calendars.

### Messages

**Job:** Communicate with parents and staff while preserving audience, source, delivery, reply, and follow-up state.

**Root views:** Inbox, needs reply, sent, drafts, calls, compose.

**Thread workspace sequence:** Participants and child/room context; current message; delivery/read state; replies; linked work; attachments; audit history.

**Canonical routes:** `/messages/**`, `/calls/**`, child-linked calls, and legacy messaging aliases.

Calls live here as another auditable communication record, not under Children Management. Child workspaces still expose the same call history contextually.

### Finance

**Job:** Understand balances, record and allocate payments, issue invoices, and resolve discrepancies.

**Root views:** Overview, needs allocation, overdue, invoices, payments, families, exports.

**Financial workspace sequence:** Family/child identity; current balance and source; open invoices; unallocated payments; ledger; documents; history.

**Canonical routes:** `/accounting`, `/accounting/invoice/[id]`, `/children/[id]/accounting`, finance exports, and compatibility aliases.

### Reports

**Job:** Answer a named historical, compliance, occupancy, attendance, care, finance, or inspection question from traceable data.

**Root views:** Saved reports, attendance, occupancy, staffing cost, finance, care completion, development, health/safety, compliance, inspection exports.

**Rules:** A report states source, scope, date/time, freshness, missing evidence, and export provenance. Charts appear only when a trend, distribution, forecast, or comparison answers the named question.

**Canonical routes:** `/reports/**`, `/settings/export`, print/PDF routes, monthly reports, and inspection-package work when implemented.

### Settings

**Job:** Change system behavior intentionally and infrequently.

**Groups:** Nursery and organizations; access and roles; parent accounts; notifications; school years; calendars/events; addresses/regions; storage/export; legacy administration.

**Rules:** Settings is searchable, permission-scoped, and risk-labeled. High-risk changes show consequence, affected scope, server result, and history.

**Canonical routes:** `/settings/**`, `/users/admin/**`, and compatible legacy administration routes.

## Work Queue Model

The global work queue replaces the alarm-family directory as the daily resolution surface.

### Queue views

- Mine
- My room or branch
- Unassigned
- Waiting on someone
- Forecast
- Failed or needs retry
- Recently completed

### Required item anatomy

- Plain-language state and affected object.
- Consequence if unresolved.
- Due or forecast time.
- Owner and assignment state.
- Source record and freshness.
- One valid next action.
- Waiting, failure, correction, and completed state.

Informational birthdays or announcements can remain notifications. Vaccination, medical, payment, request, contract, insurance, message, assessment, and missing-record events become typed work only when a user can act, assign, wait, or close them.

## Role Projections

| Role | Primary navigation | Default Today projection |
| --- | --- | --- |
| Administrator | Today, Children, Rooms, Team, Messages, Finance, Reports, Settings | All-branch oversight, unresolved risk, money, staffing, and branch comparison |
| Manager | Today, Children, Rooms, Team, Messages, Finance, Reports; limited Settings | Branch readiness, ratios, attendance, coverage, parent follow-up, and compliance work |
| Teacher | Today, Children, Messages | Assigned room roster, attendance, care recording, handover, and parent communication |
| Nurse | Today, Children, Messages; Health saved view in Children | Medical exceptions, medication/vaccination work, incidents, follow-up |
| Doctor | Today, Children, Messages; Reviews saved view in Children | Assigned clinical reviews, recent evidence, overdue follow-up |
| Parent | Separate parent IA | Own child day, messages, notifications, calendar, finance, and account |

The role projection does not replace assignment and record-relation checks. A nurse or teacher may see the Children domain while still receiving only explicitly authorized records and fields.

## Record Workspace Model

All canonical workspaces use the same information logic without forcing one visual template:

1. Identity and current scope.
2. Critical restrictions and legal/medical warnings.
3. Current state and freshness.
4. Owned or waiting work.
5. Frequent domain action.
6. Recent activity.
7. Complete domain detail.
8. Attachments, source, and audit history.
9. Advanced/legacy fields where parity requires them.

### Contextual navigation

- Tabs are used for peer views of one object, not unrelated destinations.
- Breadcrumbs show hierarchy when a record sits under branch/room or family/child.
- Related records open in a side panel only when the current task can safely continue; consequential work receives a full workspace.
- Closing a side panel returns focus and preserves list position, filters, selection, and branch/date context.

## Responsive Projection

### Wide and compact desktop

- Full primary navigation remains visible.
- Today compares rooms and owned work concurrently.
- Dense tables preserve column meaning; low-priority context compresses before any action or status.
- Record workspaces can use a bounded details panel for adjacent inspection.

### Tablet

- Navigation becomes a drawer, but destination order and labels remain stable.
- One room or record becomes primary; cross-room comparison remains available as a switcher or summary.
- Touch targets are at least 44px and all hover-only affordances receive visible alternatives.

### Mobile staff

- Today, Children, Care/role action, and Messages may appear in a role-specific bottom navigation.
- Global work and search remain top-level utilities.
- Complex tables become summary lists and open one record at a time.
- Finance reconciliation, permission administration, and multi-record comparison may be read-only or handed to desktop when the consequence cannot be safely represented.

### Parent

The existing parent surface remains a separate, child-centered projection. Staff navigation is never merely collapsed into the parent app.

## Legacy and Deep-Link Resolution

The executable migration baseline is defined in `route-compatibility-plan.md` and `src/lib/redesign-route-compatibility.ts`. It distinguishes desired IA roots from safe current landings, prevents planned roots from appearing before review, classifies native/parent endpoints separately, and provides a privacy-safe domain observation without changing production routing.

1. Every legacy route resolves to one canonical destination with equivalent id/query context.
2. `.php` aliases may redirect or render the canonical route but never fork the redesigned UI.
3. `id`, `fid`, `from`, `to`, `year`, branch, room/class, and source parameters remain compatibility contracts.
4. Native `/ws/*.php` responses remain parser-safe and are not coupled to visual navigation.
5. Permission denial preserves a safe return destination and does not reveal whether an out-of-scope record exists.
6. Print/PDF routes remain output templates and return to the source workspace.

## Route Migration Map

| Current family | Target domain | Canonical entry |
| --- | --- | --- |
| Dashboard, Today, alarm overview | Today | `/today` plus global work queue |
| Children, drafts, child dashboard | Children | `/children`, `/children/[id]` |
| Daily/absence reports | Children and room workflow | Contextual care/attendance views with existing route compatibility |
| Medical and assessments | Children | Saved cohort views and child workspace tabs |
| Branches, classes, compliance | Rooms | `/rooms` hypothesis with existing `/branches` and `/classes` compatibility |
| Food, menus, operational calendars | Rooms | Planning views |
| Employees, staff attendance, calendar | Team | `/team` hypothesis with existing `/employees/**` compatibility |
| Messages and calls | Messages | `/messages` and contextual communication records |
| Accounting and invoices | Finance | `/finance` hypothesis with `/accounting` compatibility |
| Monthly reports, exports, print | Reports | `/reports` |
| Nursery, access, users, events, regions | Settings | `/settings` |

New route names such as `/rooms`, `/team`, and `/finance` are hypotheses. They should be introduced only when compatibility redirects, analytics, authorization, and deep-link tests are ready. Existing canonical routes may remain underneath the first IA implementation.

The route compatibility verifier additionally holds `/reports` as a planned root because only its monthly child routes currently exist. The first production pilot should use current safe routes and promote a planned root only through the staged gate in `route-compatibility-plan.md`.

`calls-communication-placement.md` makes the call decision explicit: global calls and draft reports sit under Messages, while a child's Calls view remains available in child context over the same records. Only `isDraft` is currently eligible for Today/work routing. `MISSED` is a direction, not callback workflow state.

## Acceptance Tests

### Findability

- A manager can name the destination for attendance, cover, accident review, parent message, payment allocation, and inspection export without opening more than one sidebar group.
- A teacher can reach room attendance and care in two actions from Today.
- A nurse can reach assigned medical follow-up without traversing the manager IA.

### Context preservation

- Branch, date mode, filters, scroll position, and selected object survive contextual round trips.
- Deep links land in the same object state as navigation.
- Switching context never discards a draft silently.

### Capability integrity

- Navigation, search, queue, direct route, mutation, and export agree on scope.
- Hidden destinations cannot be reached through aliases without the same authorization decision.
- Search does not leak out-of-scope names or existence.

### Responsive integrity

- Destination labels and order remain recognizable across desktop and tablet.
- Mobile removes comparison density before it removes state, consequence, or the primary action.
- No required action depends on hover, color alone, or a target below 44px.

## Open Validation

- Operator card sorting and first-click tests for `Rooms`, `Team`, `Reports`, and the placement of compliance.
- Jurisdiction-specific language for rooms/classes, safeguarding, funded hours, and inspection.
- Whether calls belong under Messages for every deployed workflow.
- Which manager settings are genuinely delegated versus admin-only.
- Which staff mobile actions must work offline and which must explicitly hand off.
- Whether a dedicated global `Work` destination is required after real queue volume is observed.

Until operator evidence arrives, these decisions remain reversible IA hypotheses. They are strong enough to drive wireflows and compatibility planning, not strong enough to remove or rename production capability.
