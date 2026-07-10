# Kiddz Online Current-State UX Findings

**Status:** Discovery draft 1
**Last updated:** 2026-07-10
**Viewport tested:** 1440 x 900 desktop
**User context:** Authenticated administrator with live migrated data

## Evidence Set

The following browser captures are preserved under `docs/redesign/baseline/`:

- `dashboard-desktop-1440.png`
- `today-desktop-1440.png`
- `branches-desktop-1440.png`
- `children-desktop-1440.png`
- `child-profile-desktop-1440.png`
- `daily-reports-desktop-1440.png`
- `teachers-desktop-1440.png`
- `medical-general-desktop-1440.png`
- `accounting-desktop-1440.png`
- `messages-inbox-desktop-1440.png`
- `settings-desktop-1440.png`

Findings below combine browser evidence with `app-sidebar.tsx`, route inventory, Prisma roles, and the parity matrix. They describe the current experience; they are not yet visual-design decisions.

## Executive Finding

Kiddz Online is functionally broad but mentally organized like its legacy database and PHP menu. The product exposes most required capabilities, yet the manager must assemble the nursery's live state across dashboard cards, Today attendance, staff logs, classes, alarms, health records, and finance. The redesign opportunity is to convert breadth into a coherent operational system without reducing access.

The strongest existing pattern is `/today`: it starts from a real task, exposes children directly, and offers adjacent report, absence, and messaging actions. The weakest pattern is the administrator dashboard: it prioritizes totals and category blocks while urgent operational state and resolution paths remain elsewhere.

## Critical Findings

### 1. Attendance begins from an unsafe assumption

The Today screen presents every child as selected and says, "Uncheck absent children, then confirm." This makes "present" the default before the practitioner has observed the room. An interruption or accidental confirmation could create a false attendance record.

**Risk:** Safeguarding, ratios, parent trust, and audit accuracy.

**Design requirement:** Attendance needs explicit state handling for present, absent, expected, late, and unknown. Confirmation must summarize exceptions and remain reversible.

### 2. Ratio compliance is not visible in the daily core

Neither the administrator dashboard nor Today baseline shows live room ratios, staff presence, qualification coverage, or an unsafe-room state. The user must mentally combine children, classes, and employee attendance.

**Risk:** Legal compliance and child safety.

**Design requirement:** Live ratio state becomes a first-class operational object, with cause, time, room, and resolution path.

### 3. The dashboard fails at its primary desktop viewport

At 1440 x 900, the dashboard content extends beyond the visible width. Overview cards and chart panels are cut off horizontally. Chart labels visibly collide around the attendance donut.

**Risk:** Core information is hidden and users may not realize horizontal content exists.

**Design requirement:** The manager home must fit its primary information hierarchy without page-level horizontal scrolling. Data visualization must reserve stable label space and handle zero/dominant values.

### 4. Urgency is flattened into categories

The dashboard groups Overview, Daily Compliance, Operations, Medical Reports, and Assessments. A missing medical record, a missing daily report, and a static total use similar card treatment and generic "View More" language.

**Risk:** The user cannot distinguish "know this" from "act now," or understand impact and deadline.

**Design requirement:** Separate state, insight, and action. Action-needed items need reason, severity, owner, age, and direct resolution.

### 5. Time context is ambiguous

The global switcher shows school year `2018-2019` while the current date is July 2026. The dashboard date control shows today, and tables contain a mixture of historical and current-looking records. The relationship between operational date, school year, and imported history is not explained.

**Risk:** Users act on the wrong dataset or misread historical totals as current state.

**Design requirement:** Branch, operational date, and academic year must be persistent, explicit, and appropriate to the task. Historical context needs a visible mode.

### 6. Navigation reflects entities and legacy ownership

The admin sidebar uses Garderie Management, Classes, Messages, Children Management, Food Management, Employees Management, and Setting. It nests some flows three levels deep and inserts dynamic classes into the global navigation.

Consequences:

- Related daily work is separated by data owner.
- Classes appear both under Garderie Management and as a dynamic section.
- Parent users live inside Children Management but also belong to access/communication.
- Notifications live inside Setting despite being active work.
- Staff attendance and coverage are buried under Employees Management.

**Design requirement:** Navigation should follow stable work domains, while search, recents, saved views, and contextual child/branch workspaces handle record access.

### 7. The shell repeats identity and competes with content

KiddzOnline branding appears in both the fixed header and the sidebar. The dark shell occupies substantial width and height, while alarms, context, search, and user controls compete in one dense row.

**Design requirement:** One clear brand anchor, one stable context control, and one notification model. The shell must create working space rather than dominate it.

### 8. Lists expose power without a clear operating rhythm

Children, staff, medical, and daily-report screens provide search, multiple filters, column filters, export, print, selection, sorting, pagination, and row actions. The capability is valuable, but controls compete without a hierarchy or saved-view model.

Observed issues:

- Repeated global filters and per-column filters.
- Icon-only row actions with weak visible labels.
- Very wide tables on ordinary desktop widths.
- High-risk actions such as delete share the row-action cluster.
- Filter state and result intent are not summarized.

**Design requirement:** Establish primary search, common saved views, progressive filters, bulk-action mode, safe destructive actions, and record previews.

### 9. The child dossier is complete but cognitively expensive

The child detail route successfully consolidates rich legacy data and offers direct actions. It also presents ten workspace tabs, a profile sidebar, quick actions, and long sections of labeled values on one page.

Strengths to preserve:

- Child identity remains visible.
- Direct routes exist for attendance, absence, accidents, medical, accounting, calls, and reports.
- Quick report and absence actions are contextual.
- Legacy data breadth is accessible.

Problems to solve:

- Critical alerts do not lead the hierarchy.
- Routine and archival details have similar visual weight.
- The tab count exceeds quick scanning.
- The detail page and child dashboard are separate concepts without a clear distinction.

**Design requirement:** Build one child workspace with a glanceable summary, critical context, recent activity, and progressively disclosed records.

### 10. Settings is a flat capability directory

The settings home lists sixteen destinations with equal card treatment, mixing organization structure, security, legacy administration, geographic reference data, calendars, notifications, parents, and export.

**Risk:** High-impact security and data controls are difficult to distinguish from routine content settings.

**Design requirement:** Group settings by organization, people/access, operations, communication, data, and legacy administration. Show scope and consequence before entry.

### 11. Role-aware navigation stops at menu filtering

Authenticated runtime passes show that the teacher is correctly redirected from Dashboard to Today, but the manager receives the administrator dashboard and information architecture. Nurse and doctor receive the same generic dashboard and the same Health, Children, and Communication navigation, differing only by role label.

**Risk:** Users see fewer modules without receiving a home organized around their responsibilities, urgency, ownership, and completion criteria.

**Design requirement:** Build role-specific home priorities on shared domain objects. Manager focuses live branch readiness; administrator focuses cross-site control; nurse focuses due health work; doctor focuses clinical review; teacher focuses the room; parent focuses child changes and obligations.

## Important Findings

### 12. Loading behavior can obscure page identity

The first branch capture contained only shell and skeleton content after DOM ready; meaningful content arrived later. Streaming is appropriate, but the skeleton did not preserve a strong page identity or explain what was loading.

**Design requirement:** Stable page frames, realistic skeleton geometry, and independent loading for slow sections.

### 13. Empty-state quality is inconsistent but promising

The message inbox provides a clear empty-state title and explanation. Other zero states appear as KPI values or blank chart regions without next actions.

**Design requirement:** Reuse the message pattern: explain state, preserve filters, and offer the most relevant next step when one exists.

### 14. The product mixes multiple visual eras

The shell uses a dark enterprise palette; dashboard cards use saturated blocks; data tables use modern React controls; legacy terminology and imported dates remain visible; the settings hub resembles a separate component family.

**Design requirement:** The design system must unify dense operations, forms, reports, records, and brand moments rather than polishing only the dashboard.

### 15. Generic labels reduce confidence

"View More," "Setting," "General Info," "Medical Missing," and icon-only actions often omit the object, consequence, or expected result.

**Design requirement:** Use task language such as "Review 12 incomplete medical records" or "Record payment," while keeping labels concise.

### 16. The parent portal eagerly renders deep history

The authenticated parent pass rendered 213 daily reports into the active tab at once. The resulting document was approximately 17,400 CSS pixels tall and contained 3,822 DOM elements at 1440 x 900.

**Risk:** Initial load, memory, scanning, and return-to-position degrade as a child's history grows. Recent and actionable information competes with years of archival records.

**Design requirement:** Prioritize today, unread state, obligations, and recent changes. Paginate, virtualize, or progressively disclose history while keeping every legacy record reachable.

### 17. Attendance confirmation does not prove presence

The Today confirmation sends only absent child IDs and creates only new absence reports. Confirming every child present writes no durable attendance or confirmation record. A date-only browser storage flag can then hide the attendance task, while existing absence records are not loaded back into the visible selection.

**Risk:** The interface can report completion without a database fact proving who was present, who checked the room, or which roster was confirmed.

**Design requirement:** Use a server-confirmed, room-scoped attendance session with explicit unknown/present/absent/late/left states, correction history, and downstream ratio/parent projections.

### 18. Batch care entry can turn defaults into invented observations

The batch daily-report form pre-fills meal portions, nap, sleep time, and mood. It also labels any existing report, including a draft, as done. The separate absent mode writes absence metadata into a daily report instead of the absence object consumed by attendance.

**Risk:** Unobserved care can be submitted, drafts can look complete, and adjacent modules can disagree about a child's day.

**Design requirement:** Begin factual observations unset, support explicit shared values plus exceptions, preserve autosaved drafts, and converge attendance and care on one child-day state.

### 19. High-risk records lack complete server-owned transitions

Medical form clients enforce important required fields, but the generic server action does not independently enforce each form's evidence, role authority, or status transition. Several medical and daily-report updates destructively replace nested records without a complete transaction or revision ledger.

**Risk:** Direct action calls can bypass visible safeguards, partial failures can remove evidence, and reviewers cannot reconstruct corrections reliably.

**Design requirement:** Give every high-risk workflow a server-owned schema, state machine, atomic versioned mutation, action-level authorization, owner, escalation, and durable audit history.

### 20. Recorded payments and displayed balance are separate truths

Payments and accounting entries are stored independently, with no allocation relation. The child surface calculates balance from accounting entries while showing paid totals from payment rows. Recording a payment does not necessarily reduce the balance source.

**Risk:** Staff and parents can see contradictory financial state, and reconciliation cannot explain which charge a payment settled.

**Design requirement:** Establish one family ledger with explicit charge, payment, allocation, credit, reversal, and balance events while preserving imported provenance.

### 21. Export descriptions overstate package completeness

Settings export cards promise parent contacts, detailed care, medical categories, invoices, and multiple file formats that the generated files do not fully contain. There is no inspection preflight, manifest, data-as-of time, generated-by audit, or missing-evidence summary.

**Risk:** A manager may trust an incomplete inspection package or discover omissions only under deadline.

**Design requirement:** Make export labels exact and introduce versioned inspection packages with completeness checks, provenance, redaction, progress, and an audit trail. Keep database backup separate from regulator evidence.

### 22. Breakpoints change geometry but not the job

Authenticated measurements across six routes show that the current product mostly collapses navigation and stacks desktop content. At 390 pixels, Dashboard reaches 3,602 CSS pixels, Today reaches 9,085 pixels with 192 interactive elements, and Accounting reaches 3,886 pixels. Children retains page-level overflow and 77 partially out-of-bounds interactive elements on mobile. At 1024, chart labels clip and wide tables still overflow.

**Risk:** Smaller screens preserve nearly the full desktop decision burden while losing comparison space, touch comfort, and visible priority.

**Design requirement:** Keep the product desktop first, then intentionally compose a tablet room workspace and mobile daily companion from the same domain objects. Define responsive behavior per chart, table, form, toolbar, card family, and fixed shell region.

### 23. Role navigation is broader than the authorization boundary

A branch-bound teacher runtime pass confirmed direct access to medical accidents, staff attendance and logs, teacher records, parent users, sensitive exports, alarms, and monthly reports even though those entries were absent from teacher navigation. The local migration contains no legacy access-control rows, so unconfigured legacy page/action decisions default to allowed. Organization record helpers do not intersect access with the user's assigned branch or room.

**Risk:** A cleaner redesign could make already broad access easier to discover, while hidden direct routes and server actions remain callable. An unscoped authenticated user can also fall back to the first organization in the database.

**Design requirement:** Establish one fail-closed capability and scope service for navigation, routes, reads, mutations, transitions, APIs, and exports. Preserve imported grants as policy inputs, not the only boundary.

### 24. Offline plumbing can persist protected data beyond authorization

The parent portal registers a root-scope production service worker using Serwist's default runtime cache. The generated worker applies network-first caching to same-origin GET APIs, RSC payloads, HTML, and catch-all reads. New-child enrollment also writes the full sensitive form to one unscoped `localStorage` key every second, and staff logout does not clear it. Parent bearer credentials are stored in persistent JavaScript-readable storage.

**Risk:** A shared browser can retain child, parent, medical, financial, or role-scoped data after logout, scope change, or organization change. Framework caching defaults can replay a response without re-running the application's authorization decision.

**Design requirement:** Replace framework-default runtime caching with a Kiddz-owned static-only allowlist, purge protected state at identity/scope boundaries, move sensitive drafts to authorized server records, and preserve native authentication through compatibility adapters rather than browser persistence.

### 25. Pending UI has no shared retry, receipt, or conflict truth

The production runtime has 230 transition calls but no optimistic-state primitive, connectivity listener, idempotency receipt, aggregate version field, or shared retry contract. Payment creation can be repeated after an ambiguous response, and medical updates delete and recreate nested evidence through multiple writes without one transaction.

**Risk:** A timeout can leave the user unable to distinguish failed, committed, duplicated, partial, or overwritten work. Retrying can create a second real-world effect, while a success toast or refreshed page cannot prove which operation committed.

**Design requirement:** Introduce typed operation IDs and receipts, aggregate versions, server-owned drafts, atomic mutation boundaries, explicit interrupted/conflict states, and consequence-specific offline classes. High-risk work remains online-confirmed.

### 26. Core workflows are not accessibility-complete processes

An authenticated eight-route audit found no skip links or persistent live regions, unnamed tables, missing/unstable page headings, widespread icon/control naming gaps, and hundreds of targets below the 44px product rule. New Child displays validation errors without moving focus, associating errors, or announcing them. Children, Daily Reports, New Child, and Today fail 320px page reflow; current primary button and focus-color pairings fail contrast targets.

**Risk:** Keyboard, screen-reader, low-vision, color-vision, touch, and interruption needs can prevent staff from completing safety, care, medical, and financial work even when every legacy route technically exists.

**Design requirement:** Make accessibility a shared component/API invariant and complete-process release gate: PageFrame/heading/skip link, Field/ErrorSummary, IconAction, StatusRegion, DataTable/RecordList, DataFigure, and focus-safe Dialog/Drawer contracts must pass semantic, target, contrast, reflow, reduced-motion, keyboard, and assistive-technology fixtures before rollout.

### 27. Warm route speed hides eager data and delivery breadth

Authenticated production-build navigation is usually sub-second after the first visit, but the architecture does more work than the first viewport requires. Daily Reports requests every matching report and paginates in the client; Accounting requests every payment and child before building a 2,136-element main matrix; Today renders the complete roster with 266 interactive elements; and the parent portal eagerly maps multi-domain histories. Source/build scanning finds 192 client files, only two explicit Suspense boundaries, three dynamic imports, 395 unbounded-query triage candidates, and no cursor-based `findMany` contract.

**Risk:** Current demo-scale and warm-cache performance can degrade sharply with real nursery history, slower hardware, patchy Wi-Fi, larger organizations, or a cold service-worker state. Browser filtering can also ship protected records outside the visible/needed window.

**Design requirement:** Instrument field CWV and server/query cost, attribute route payloads, bound interactive data on the server, stream secondary evidence, split optional client modules, and test representative scale/cold/warm/offline fixtures. Preserve complete access through pagination, history, and export contracts; never improve a metric by silently dropping records or capability.

## Existing Strengths to Preserve

1. **Functional breadth:** The modern app exposes a large restored legacy surface.
2. **Role-aware navigation:** Teacher and clinical roles already receive reduced navigation.
3. **Context switcher:** Branch and academic year are globally available.
4. **Direct deep links:** Child, branch, class, staff, report, medical, and invoice records have stable destinations.
5. **Batch intent:** Today attendance and batch daily reports acknowledge high-volume nursery work.
6. **Child workspace:** Related workflows are already linked from the child context.
7. **Search and command entry:** A global search/command surface exists.
8. **Export and print:** Operational users retain the legacy outputs they depend on.
9. **Draft states:** Daily, absence, medical, and assessment records support interruption and later completion.
10. **Compatibility layer:** Legacy web and native entry points can converge on canonical modern flows.

## Current Manager Journey

### Opening the app

1. Land on Dashboard.
2. Interpret branch and school-year context.
3. Scan totals and charts.
4. Notice missing reports or medical/assessment counts.
5. Open separate modules to understand who or what is affected.
6. Navigate to Today for actual attendance work.
7. Navigate to employee attendance to infer staffing.
8. Navigate to classes to infer room context.
9. Use alarms for additional exceptions.

The product currently asks the manager to build the operational model in their head. The target experience should perform that synthesis and let the manager inspect the underlying records on demand.

## Problem Statements

### P01 - Three-second state comprehension

When a manager opens Kiddz Online, they need to understand whether the nursery is safe and ready within three seconds, so they can intervene before children and staff are affected.

**Measure:** Correctly identify unsafe rooms, missing staff, attendance unknowns, and critical health alerts without navigating away.

### P02 - Two-action routine work

When a practitioner records routine care for a room, they need batch-first entry with exception editing, so they remain present with children.

**Measure:** Common room updates require no more than two primary actions before exception review.

### P03 - One operational source of truth

When a user changes branch, room, date, or academic year, they need every dependent surface to reflect that context clearly, so they do not act on the wrong records.

**Measure:** Users can state the active scope at any point and detect historical mode.

### P04 - Depth without overload

When a user opens a child, staff member, branch, or invoice, they need critical state first and complete records on demand, so power does not become clutter.

**Measure:** Top tasks are visible without scrolling while every legacy field remains reachable.

### P05 - Resolution, not notification

When an alert appears, the responsible user needs to understand cause, consequence, owner, and next action, so notifications become completed work rather than accumulating badges.

**Measure:** Each actionable alert can be resolved or assigned from its detail context.

## Initial IA Implications

These are hypotheses to test, not final navigation:

- Merge the useful parts of Today and Dashboard into a role-aware operational home.
- Promote live ratios, attendance state, health/safeguarding exceptions, staff coverage, and action-needed work.
- Organize primary navigation around Today, Children, People, Places, Communication, Finance, Reports, and Settings.
- Move record-specific breadth into contextual workspaces.
- Keep global search, recents, and saved views for fast access.
- Treat alarms as a work queue with ownership and resolution.
- Separate live operational date from historical academic-year analysis.

## Research Questions Still Open

1. Which jurisdiction and age-band ratio rules are authoritative for the deployed nurseries?
2. What does the manager check first at opening, midday, handover, and closing?
3. Which missing records are legal blockers versus administrative follow-up?
4. How are funded hours, occupancy forecasts, rotas, and staff costs represented today outside the visible routes?
5. Which roles share devices, and how often do they work with one hand or under interruption?
6. Which operations may enter the audit's queueable Class C on approved devices, and who resolves each conflict type?
7. Which exports are used operationally versus retained only for legacy parity?
8. What notification channels and response deadlines exist for parents and staff?
9. Which records require dual approval or immutable audit evidence?
10. Which terms should be localized or replaced while keeping legacy aliases stable?

The complete mutation and recovery evidence for J01-J07 is recorded in `docs/redesign/journey-state-audit.md`.

## Next Validation

- Connect findings to specific parity rows and existing verification scripts.
- Validate priority and terminology with real nursery operators or owner-provided operational policy.
- Use `docs/redesign/role-runtime-audit.md` as the current role-home evidence and preserve its privacy boundary.
- Use `docs/redesign/journey-state-audit.md` as the critical mutation/recovery baseline and validate its open legal and operator questions.
- Use `docs/redesign/responsive-runtime-audit.md` and `responsive-baseline-metrics.json` as the current cross-device evidence baseline.
- Use `docs/redesign/authorization-scope-audit.md` as the role, capability, scope, and denial baseline.
- Use `docs/redesign/reliability-offline-audit.md` as the browser storage, cache, retry, transaction, draft, and cross-device delivery baseline.
- Use `docs/redesign/accessibility-runtime-audit.md` as the source/runtime accessibility debt, shared-component migration, and assistive-technology acceptance baseline.
