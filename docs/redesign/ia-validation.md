# Kiddz Online IA Validation

**Date:** 2026-07-10  
**Status:** Internal browser validation complete; operator validation open  
**Prototype:** `/design-lab/ia`

## Question

Can the proposed seven-domain staff IA make common nursery work findable, preserve branch and role context, replace alarm-family navigation with owned work, and project cleanly from desktop to mobile without selecting a creative territory?

## Prototype Boundary

The architecture lab is an interactive routing model, not production UI and not a fourth creative territory. It uses synthetic records and local state to test:

- stable primary domains;
- role-specific visibility;
- branch context scope;
- global search grouping and routing;
- owned-work queue routing;
- canonical task paths;
- responsive collapse and navigation focus.

It does not write to the database, call production mutations, change permissions, replace current routes, or modify legacy/native compatibility.

## Implemented IA

### Manager and administrator projection

- Today
- Children
- Rooms
- Team
- Messages
- Finance
- Reports
- Settings, visually separated

### Teacher projection

- Today
- Children
- Messages

### Nurse and doctor projections

- Today
- Children
- Messages

Health and clinical work appears as authorized Children saved views and owned work rather than a duplicate global object model.

### Global utilities

- Branch context.
- Live date/time state.
- Research-only role projection control.
- Global people/work/record search.
- Owned work queue.
- Informational notifications.

The role control exists only to test projections. A shipping user does not casually switch authority; production derives capability and scope from the authenticated session and current assignment.

## Synthetic Test Tasks

| Task | Canonical destination | Why it remains open |
| --- | --- | --- |
| Review Leo's accident | Children / child / Health and safety / incident | Parent acknowledgment remains pending after manager review |
| Assign Meadow cover | Rooms / room / Coverage / time window | Forecast ratio risk requires qualified cover |
| Complete four care reports | Children / Care incomplete / Today | Handover cannot close while factual reports are missing |
| Confirm Alma's arrival | Children / Attendance unknown / child | Room ratio remains provisional while attendance is unknown |
| Allocate EUR 240 | Finance / Needs allocation / family | Payment exists but has not reduced an invoice balance |
| Run inspection preflight | Reports / Compliance / Inspection preflight | Required evidence expires within 30 days |
| Reply to Theo's parent | Messages / Needs reply / family | Message is linked to today's lunch care record |
| Finish Alma's parent call report | Messages / Calls / Drafts / child | `CallLog.isDraft` remains incomplete until required report fields are submitted |

## Browser Evidence

### Role projection

- Manager exposed seven work domains plus separated Settings and eight available tasks.
- Teacher collapsed to Today, Children, and Messages with four relevant tasks.
- Nurse collapsed to Today, Children, and Messages with two relevant tasks.
- Doctor collapsed to Today, Children, and Messages with clinical-review work and no Settings access.
- Returning to Manager restored the complete manager projection.
- A role change automatically returned to Today when the previous domain was not authorized in the new projection.
- The lab now derives all five projections from effective capability decisions rather than a role-to-destination lookup.

### Branch context

- Administrator exposed `All branches (read-only)`, `Riverside`, and `Hamra`; write targets remained concrete branches.
- Manager exposed assigned Hamra and Riverside contexts without an all-branch option.
- Teacher exposed only `Riverside` in the synthetic assignment.
- Switching from administrator `All branches (read-only)` to teacher automatically returned context to `Riverside`.

The executable projector and seven role/scope fixtures are documented in `navigation-capability-fixtures.md`. This remains prototype evidence for the interaction rule, not production authorization. Production options must come from a server-owned effective capability and record-scope decision.

### Global search

- Searching `payment` returned the one in-scope EUR 240 task.
- Opening the result changed the canonical domain to Finance.
- The path preview became `Finance / Needs allocation / Martin family`.
- The search dialog closed and the source task remained selected.

### Owned work queue

- Manager queue exposed eight synthetic items.
- Selecting Meadow coverage opened Rooms.
- The path preview became `Rooms / Meadow / Coverage / 12:30-13:00`.
- The queue closed after navigation.
- Opening the draft call report as manager or teacher opened Messages with `Messages / Calls / Drafts / Alma Reyes`.
- The 390px teacher queue exposed the same call task, routed to the same path, and closed after navigation.

### Responsive behavior

- `1280 x 720` production capture: no horizontal overflow; full manager navigation, readiness, domain anatomy, and work routing remain visible.
- `768 x 1024` dev measurement: no horizontal overflow and no out-of-bounds visible elements.
- `390 x 844` production capture: no horizontal overflow, no visible interactive target smaller than 44px, no unnamed button, and desktop comparison becomes one ordered column.
- Mobile sidebar is `visibility: hidden` and non-interactive while closed.
- Opening the mobile sidebar moves focus to its close control.
- Closing returns focus to the menu trigger.
- The call-routing pass produced no architecture-route warning or error log.

### Automated verification

- `pnpm exec eslint src/app/design-lab/ia --max-warnings=0`: passed.
- `pnpm exec tsc --noEmit --pretty false`: passed.
- `git diff --check`: passed.
- `pnpm build`: passed and emitted `/design-lab/ia` as a static route.
- `pnpm exec tsx src/scripts/verify-redesign-route-compatibility.ts`: passed against 332 App Router routes and 30 critical aliases.
- `pnpm exec tsx src/scripts/verify-redesign-navigation-contracts.ts`: passed against seven fixtures and all five staff roles, including missing/conflicting policy and unknown-branch defenses.
- `pnpm exec tsx src/scripts/verify-redesign-call-workflow.ts`: passed against three call surfaces, three record/work states, six target capabilities, and four legacy call aliases.

The build continues to log known dynamic-route prerender messages from unrelated legacy pages that call request-scoped APIs. The build exits successfully; the IA route itself is static and clean.

## Captures

| Evidence | Artifact |
| --- | --- |
| Compact desktop IA | `ia/architecture-lab-desktop.png` |
| Mobile projection | `ia/architecture-lab-mobile.png` |
| Owned work queue | `ia/architecture-lab-work-queue.png` |

## Findings

### 1. Stable domains survive role projection

The manager IA remains shallow without putting classes, alarm families, report types, or staff roles in the sidebar. Removing destinations for teacher/nurse/doctor projections does not change the meaning or order of the domains that remain.

### 2. Work is a better alert model than alarm taxonomy

The same queue can express urgent, forecast, required, and waiting states while preserving owner, consequence, due time, source object, and destination. This is more actionable than navigating separate birthday, medical, payment, insurance, request, contract, and message directories.

Informational events can remain notifications. Actionable events require a work lifecycle.

### 3. Search and queue must resolve to source objects

Payment and coverage tasks became useful only when they opened Finance and Rooms with a canonical path. A global result should not terminate in a generic alert detail.

### 4. Branch context is part of authorization UX

The prototype initially exposed `All branches` to every role. Browser testing caught and corrected this. The lab now derives every option from effective decisions and scope, labels all-branch oversight read-only, and keeps writes on concrete branches. Production direct routes, queries, mutations, search, queue, exports, aliases, and APIs must still reach the same server decision.

### 5. Mobile should preserve task order, not desktop concurrency

The 390px projection keeps readiness and domain views in sequence. It does not stack the entire desktop work queue beside them. Search and owned work stay available as top-level utilities.

### 6. Calls under Messages has an honest internal fixture

The architecture groups calls with auditable parent/staff communication while retaining child-context call history. The prototype now routes a real unfinished state, `CallLog.isDraft = true`, to `Messages / Calls / Drafts`; it does not turn `MISSED` direction into fake callback work. Source, route, and synthetic first-click evidence support this reversible placement. Manager and practitioner terminology validation is still required before production navigation changes.

### 7. Compliance must stay visible from Today and Reports

Inspection preflight maps to Reports, but urgent missing/expiring evidence must also appear in Today and the branch/room context. A single archive destination would bury legal anxiety again.

## Accepted IA Hypotheses

- Today is the operational home and work surface.
- Children, Rooms, Team, Messages, Finance, and Reports are stable manager domains.
- Settings remains separated from daily work.
- Work queue is a global utility with source-object routing.
- Branch and live/history date are persistent context.
- Dynamic classes and alarm families leave global navigation.
- Role projections remove domains without creating alternate object models.
- Mobile keeps search/work available while collapsing comparison density.

## Open Gate

The following evidence is still required before production navigation changes:

- Nursery manager and practitioner card sorting.
- First-click testing for attendance, cover, incident, care, call, payment, and inspection tasks.
- Validation of `Rooms`, `Team`, and `Reports` labels in the first-market language.
- Operator validation of Calls-under-Messages terminology and grouping; the source contract and synthetic first-click fixture are complete.
- Production capability integration and allowed/denied direct-route evidence across reads, writes, exports, aliases, APIs, and native contracts; the territory-neutral shell fixtures are complete.
- Screen-reader and 200% zoom testing.
- Real-device native acceptance and supported-version evidence; the source-level comparison is complete and confirms the preserved iOS/Android clients are parent-only, not staff apps.
- Pilot browser-history, deep-link, and authorization evidence against the accepted `route-compatibility-plan.md`; the territory-neutral route/analytics plan and executable registry are complete.

## Decision

Advance this IA as the working structure for territory-neutral wireflows and design-system acceptance criteria. The route compatibility plan and executable registry are accepted as the reversible migration baseline. Do not replace production navigation or introduce `/rooms`, `/team`, `/finance`, or a `/reports` root until operator validation and pilot browser tests close the remaining gate.
