# Role-Specific Runtime Audit

**Status:** Discovery pass 1
**Last updated:** 2026-07-10
**Viewport:** 1440 x 900 desktop
**Roles inspected:** Manager, teacher, nurse, doctor, and parent

## Method and Privacy Boundary

The staff roles were inspected with short-lived local audit users linked to the existing development organization and one active branch. The parent role used a short-lived parent audit user linked read-only to one active development child so the actual portal contract could load.

All five audit users were deleted immediately after the run. The parent session was signed out before deletion. No attendance, care, medical, message, finance, or profile record was created or changed.

The audit recorded route behavior, navigation structure, action labels, structural counts, and layout measurements. It intentionally did not commit role screenshots, names, record content, medical remarks, credentials, or tokens because the repository is public and the migrated development database contains personal records.

### Limitation

The temporary staff users had no migrated per-user legacy access-control rows. Unconfigured legacy permissions therefore used the product's role defaults. This pass proves default role architecture and route behavior; it does not prove every real user's custom permission combination.

## Manager

### Observed entry

- `/dashboard`
- Full administrator-style home with Overview, Daily Compliance, Operations, Medical Reports, and Assessments.
- Quick action: New Daily Report.
- Primary navigation: Dashboard, Garderie Management, dynamic Classes, Messages, Children Management, Food Management, Employees Management, and Setting.

### Finding

The manager label changes, but the information architecture and dashboard remain the administrator product. The home does not prioritize branch readiness, staffing, ratios, attendance unknowns, or the manager's current action queue.

### Requirement

Manager and administrator share domain objects but need different home emphasis and scope. The manager home leads with the active branch and live operating state; the administrator/owner can add cross-branch, configuration, and financial oversight.

## Teacher

### Observed entry

- A request to `/dashboard` redirects to `/today`.
- Navigation is reduced to Today, Daily Operations, Children, and Communication.
- Quick action: New Daily Report.
- Today exposes Start Daily Reports, Single Report, Report Absence, Send Message, class filtering, Skip, and Confirm Attendance.

### Finding

Teacher entry is correctly task-first. However, all 14 visible children began in the selected state before observation. The page also exposed 14 child detail links and 14 individual report actions, confirming that Today combines batch intent with record-level depth.

### Requirement

Preserve Today as the teacher's home seed, but replace selected/present-by-default with explicit expected, present, absent, late, and unknown states. Keep batch speed, exception editing, child context, confirmation summary, and undo.

## Nurse

### Observed entry

- `/dashboard`
- The same generic dashboard sections as manager/admin.
- Navigation: Dashboard, Health, Children, and Communication.
- Health expands to General Info, Vaccinations, Accidents, and Conditions.
- Quick action: Log Accident.

### Finding

The navigation is clinically narrowed, but the home is not. General attendance, accounting, and assessment summaries compete with unresolved medical work, medication, vaccination, incidents, and follow-up.

### Requirement

The nurse home should lead with time-sensitive health and safeguarding work, assigned follow-up, medication schedule, missing consent/evidence, and recent incidents while preserving authorized child context.

## Doctor

### Observed entry

- `/dashboard`
- The same generic dashboard and the same Health, Children, Communication navigation as nurse.
- Quick action: Log Accident.

### Finding

Doctor and nurse are currently differentiated only by the role label. No current home or navigation distinction reflects clinical review, assigned cases, medical history, approval, or follow-up responsibilities.

### Requirement

Validate the real nurse/doctor responsibility split. If both roles remain, their queues, permissions, and completion states must express that split; otherwise the interface promises a distinction the workflow does not honor.

## Parent

### Observed entry

- Separate `/parent/login` and `/parent` surface rather than the staff shell.
- Summary labels: Daily reports, Payments, Messages, and Notifications.
- Latest daily-care summary.
- Tabs: Daily, Payments, Absence, Messages, Calendar, and Notifications.
- Global actions: Refresh and Sign out.

### Structural measurement

For the audited child, the Daily tab rendered 213 historical report markers at once. At 1440 x 900, the page measured approximately 17,400 CSS pixels tall with 3,822 DOM elements. The six-tab shell fit the viewport width, but the active history was not paginated or progressively disclosed.

### Finding

The parent portal successfully consolidates the legacy native contract into one web surface, but it treats a multi-year archive as a single page. Recency, unread state, obligations, and next actions are weaker than raw history depth.

### Requirement

Lead with today's child state, unread communication, upcoming obligations, and recent changes. Paginate or virtualize history, preserve search/filter/export where needed, and keep the full legacy record reachable on demand.

## Cross-Role Findings

1. **Role filtering is not role experience.** Hiding modules is insufficient when the landing hierarchy remains generic.
2. **Today is the best current home pattern.** It begins with a real job, related people, and adjacent actions rather than category totals.
3. **Manager and administrator need scope differentiation.** Branch operations and enterprise/configuration oversight should not compete equally by default.
4. **Clinical roles need owned work.** Medical records become a queue with assignment, urgency, completion, and evidence, not only a set of tables.
5. **Parent history needs progressive disclosure.** Full parity does not require rendering the entire archive simultaneously.
6. **Shared objects, specialized surfaces.** Child, room, incident, message, invoice, and attendance states remain consistent while role actions and density change.

## Target Role Homes

| Role | Home question | First objects | Primary action family |
| --- | --- | --- | --- |
| Administrator/owner | Are all sites controlled, compliant, and financially healthy? | Cross-site exceptions, occupancy, finance, evidence, access | Investigate, assign, configure |
| Manager | Is this nursery safe and ready now? | Rooms, ratios, attendance unknowns, staff coverage, urgent actions | Resolve live exception |
| Teacher/room leader | What does my room need next? | Roster, arrivals, care tasks, handover, messages | Record in batch, edit exceptions |
| Nurse | What health action is due or unsafe? | Medication, incidents, consent, vaccinations, follow-up | Record, administer, escalate |
| Doctor | What requires clinical review or decision? | Assigned reviews, history, evidence, follow-up | Review, decide, document |
| Parent | What changed for my child and what do I need to do? | Today's summary, unread messages, obligations, recent records | Read, respond, complete |

## Next Validation

1. Inspect real migrated permission variants without exposing identities.
2. Trace create, edit, confirmation, error, and recovery for the seven critical journeys.
3. Validate the nurse/doctor responsibility split with policy or an operator.
4. Measure parent portal data loading and network behavior with larger histories.
5. Test the same role homes at compact desktop, tablet, and mobile sizes when reliable viewport control is available.
