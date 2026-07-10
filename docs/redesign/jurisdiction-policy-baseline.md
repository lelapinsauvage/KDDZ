# Jurisdiction And Funding Policy Baseline

**Research date:** 2026-07-10  
**Candidate markets:** England (`GB-ENG`) and Ireland (`IE`)  
**Status:** Product and data architecture baseline, not production legal configuration  
**Legal review:** Required before any policy pack can determine compliance in production

## Purpose

Kiddz currently has no versioned ratio rule, qualification eligibility model, funding-entitlement ledger, or jurisdiction-aware inspection contract. A live ratio or funded-hours balance would therefore be unsafe if it were calculated from hard-coded UI constants.

This baseline establishes:

1. which current official sources govern the first candidate markets;
2. which facts are stable regulatory requirements versus annual programme configuration;
3. the minimum data model for explainable ratio, attendance, funding, and evidence decisions;
4. the UI behavior required when policy, qualification, presence, or programme data is missing;
5. the questions that still require operator, local-authority, programme, or legal validation.

This document is not legal advice. It does not activate England or Ireland as the launch market and does not authorize production compliance claims.

## Source Classes

Kiddz must not flatten all policy sources into one undifferentiated settings table.

| Class | Examples | Product treatment |
| --- | --- | --- |
| Legislation / statutory framework | EYFS, Irish Early Years Services Regulations | Versioned policy pack; changes require controlled migration and regression fixtures |
| Regulator or department guidance | Ofsted guidance, Tusla QRF, qualification finder | Source-linked interpretation attached to the legal rule; never silently overrides it |
| Annual programme rules | England funding year, ECCE year, NCS/Core Funding year | Effective-dated programme configuration with renewal workflow |
| Local agreement | English local-authority provider agreement, service fee table | Tenant or branch configuration with approval, source attachment, and expiry |
| Announced future change | A published change not yet effective | Visible planning state only; excluded from current compliance and billing calculations |

Every active rule needs jurisdiction, provider/service type, effective dates, source URL, source version/date, review owner, review date, and a content hash or immutable source attachment.

## England Baseline

### Primary sources

- [EYFS statutory framework collection](https://www.gov.uk/government/publications/early-years-foundation-stage-framework--2), last updated 1 September 2025 and applicable to England.
- [EYFS framework for group and school-based providers](https://assets.publishing.service.gov.uk/media/68c024cb8c6d992f23edd79c/Early_years_foundation_stage_statutory_framework_-_for_group_and_school-based_providers.pdf.pdf), effective 1 September 2025.
- [Early education and childcare statutory guidance](https://www.gov.uk/government/publications/early-education-and-childcare--2), current version valid from 1 April 2026.
- [Early years funding operational guide 2026 to 2027](https://www.gov.uk/government/publications/early-years-funding-2026-to-2027/early-years-entitlements-local-authority-funding-operational-guide-2026-to-2027), updated 13 January 2026.
- [Free childcare entitlements and model agreement guidance](https://www.gov.uk/government/publications/free-early-years-provision-and-childcare-model-agreement/free-childcare-entitlements-and-model-agreement-guidance), updated 9 February 2026.

### Candidate ratio rules

The following applies to the group and school-based provider framework. Provider type and school-specific exceptions remain first-class inputs.

| Child / provision condition | Baseline ratio | Qualification and policy conditions |
| --- | ---: | --- |
| Under 2 | 1:3 | At least one approved level 3 or approved experience-based-route practitioner, suitably experienced with under-2s; at least half of other staff approved level 2; additional baby-care requirements |
| Age 2 | 1:5 | At least one approved level 3 or approved experience-based-route practitioner; at least half of other staff approved level 2 |
| Age 3+ in registered provision with QTS/EYPS/EYTS working directly | 1:13 | At least one other approved level 3 or approved experience-based-route practitioner |
| Age 3+ in registered provision without QTS/EYPS/EYTS working directly | 1:8 | At least one approved level 3 or approved experience-based-route practitioner; at least half of other staff approved level 2 |

Important constraints:

- Ofsted may require a higher ratio to protect safety and welfare.
- No more than 50% of staff counted at level 3 at a premises may rely on experience-based-route status at one time.
- School type, pupil status, majority age, teacher presence, out-of-school provision, and short teacher absences introduce additional branches. They cannot be represented by one `age -> ratio` map.
- `Working directly with children` is an observed assignment/presence condition, not a static staff-profile flag.
- A qualification must be approved for the relevant level and effective on the operational date. A free-text certificate label is not enough.
- Mixed-age handling and exceptional circumstances require legal validation and explicit test cases before launch. Kiddz must not average ages or quietly apply the most permissive band.

### Attendance, safety, and evidence

The current EYFS framework requires or supports the following product contracts:

| Obligation | Product implication |
| --- | --- |
| Daily child record includes names, attendance hours, and each child's key person | Attendance is a time-bounded session with source, recorder, and key-person projection, not a daily present boolean |
| Unnotified or prolonged absence must be followed up with vulnerability and pattern considered | Absence produces owned follow-up work with contact attempts, outcome, and escalation evidence |
| Written accident/injury and first-aid record; parent informed same day or as soon as reasonably practicable | Incident workflow separates record, treatment, parent communication, and acknowledgement timestamps |
| Serious accident, illness, injury, or death notification as soon as reasonably practicable and within 14 days | Notification rule is deadline-bearing, regulator-scoped, and server-owned; completion requires submission evidence |
| Written record each time medicine is administered; parent informed same day or as soon as reasonably practicable | Medication administration cannot close without dose/time/administrator and communication state |
| Records accessible to authorized people, confidential, and retained for a reasonable period after a child leaves | Record access and retention are policy decisions with legal basis, not UI visibility toggles |

The phrase `reasonable period` is not a deployable retention duration. Legal and operator review must turn it into a documented retention schedule before automated deletion is possible.

### Funded-hours baseline

For 2026 to 2027 the official funding guide identifies:

- 30 hours for qualifying children of working parents from 9 months until age 2;
- 30 hours for qualifying 2-year-olds of working parents;
- 15 hours for eligible 2-year-olds receiving additional support;
- universal 15 hours for all 3- and 4-year-olds plus an additional 15 hours for qualifying working parents.

The DfE standardizes one part-time equivalent as 15 hours across 38 weeks, or 570 annual hours. From 2026 to 2027, national allocations move to termly census headcounts for all entitlement streams except DAF. Local authorities still determine provider arrangements and local hourly funding through their agreements and formulae.

Product consequences:

- Eligibility, booked hours, attended hours, claimed hours, local-authority payment, parent charge, adjustment, and reconciliation are separate ledger entries.
- The product stores entitlement code validity and eligibility period; it does not infer eligibility from child age alone.
- `15` and `30` are programme limits, not a universal invoice discount.
- Stretched offers require an explicit calendar and annual-hour ledger; Kiddz must not assume 38 identical weekly invoices.
- Local-authority rate, supplements, census/headcount period, adjustment, and provider agreement are effective-dated configuration.
- Universal entitlement, working-parent entitlement, additional-support entitlement, EYPP, DAF, and SENIF are distinct funding streams even when shown in one family account.

## Ireland Baseline

### Primary sources

- [Child Care Act 1991 (Early Years Services) Regulations 2016](https://www.gov.ie/en/publication/1a6d67-child-care-act-1991-early-years-services-regulations-2016/).
- [Official Regulations PDF, including Schedule 6](https://www.tusla.ie/uploads/content/20160510ChildCareActEarlyYrsRegs2016SI221of2016.pdf).
- [Childminding regulations and transition programme](https://www.gov.ie/en/department-of-children-disability-and-equality/campaigns/national-action-plan-for-childminding-2021-2028/), covering the separate 2024 childminding regime.
- [Recognition of an Early Years Qualification](https://www.gov.ie/en/department-of-children-disability-and-equality/services/recognition-of-an-early-years-qualification/), updated 6 May 2026.
- [ECCE programme](https://www.gov.ie/en/department-of-children-disability-and-equality/publications/early-childhood-care-and-education-programme-ecce/), including 2025/2026 programme rules.
- [Core Funding fee management conditions](https://www.gov.ie/en/department-of-children-disability-and-equality/publications/core-funding-fee-management-conditions/).
- [Early Years Simplification Plan 2026-2030](https://www.gov.ie/en/department-of-children-disability-and-equality/publications/simplify-to-support-the-early-years-simplification-plan-20262030/).

### Candidate ratio rules

The legal service class changes the applicable ratio. This table maps the preschool service classes in Schedule 6 of the 2016 Regulations; it is not a childminding policy pack. Childminding services are separately regulated under the 2024 childminding regulations and require a separate source and fixture pass.

| Service type | Age band | Baseline ratio |
| --- | --- | ---: |
| Full day or part-time day care | 0-1 | 1:3 |
| Full day or part-time day care | 1-2 | 1:5 |
| Full day or part-time day care | 2-3 | 1:6 |
| Full day or part-time day care | 3-6 | 1:8 |
| Sessional preschool | 0-1 | 1:3 |
| Sessional preschool | 1-2.5 | 1:5 |
| Sessional preschool | 2.5-6 | 1:11 |
| Drop-in or temporary preschool | 0-6 | 1:4 |
| Overnight preschool | 0-1 | 1:3 |
| Overnight preschool | 1-6 | 1:5 |

Additional constraints include:

- A preschool service other than childminding or sessional service must have at least two adults on the premises at all times.
- Single-handed sessional provision has a nearby emergency-assistance requirement under the mapped 2016 framework.
- Childminding is excluded from this candidate pack until the 2024 regulations, three-year transition, service limits, and evidence duties are mapped independently.
- Unpaid workers do not count toward Schedule 6 ratios.
- A service providing sessional and full/part-time care contemporaneously applies the sessional ratio to children attending the sessional service for that duration.
- Sessional provision has room and space constraints, including a 22-child room limit in the specified regulation context.
- Staff working directly with children must hold at least a Level 5 major award in early childhood care and education on the NFQ or a qualification deemed equivalent. The official recognized-qualification list is versioned separately.

The product therefore needs service class, room, age band, actual attendance, actual staff presence, direct assignment, paid/unpaid status, qualification decision, and minimum-adults-on-premises checks. A headcount-only ratio is insufficient.

### Attendance, safety, and evidence

| Obligation | Product implication |
| --- | --- |
| Each child is checked in and out by an employee or unpaid worker | Check-in/out is an attributed event with collection authority and correction history |
| Daily attendance and daily staff rosters are recorded | Ratio evidence can join child attendance, staff presence, breaks, and room assignment for the same time interval |
| Medication, accident, injury, and incident details are recorded | Health and incident objects retain source, actor, parent-sharing state, and revision history |
| Child and service records have inspection/access rules | Access is relationship and role scoped; parent access never exposes another child or internal-only material |
| Child records are retained for 2 years after leaving; specified service records have defined periods | Retention rules are object- and jurisdiction-specific, not one tenant-wide duration |
| Entry records for other persons are retained for 1 year | Visitor log is a distinct evidence object from child attendance |
| Fire records are retained for 5 years | Inspection packaging must preserve evidence by rule family and period |
| Specified serious incidents are notified to Tusla within 3 working days | Deadline engine needs working-day calendar, notification category, submission evidence, correction, and escalation |

### ECCE, NCS, and Core Funding baseline

ECCE 2025/2026 is described as:

- 3 hours per day;
- 5 days per week;
- 38 weeks or the provider's 182-day ECCE calendar;
- programme year from 1 September to 30 June;
- eligible from 2 years 8 months by 31 August, with a maximum age of 5 years 6 months at the programme-year end;
- 15 programme hours per week free at the point of use;
- registration and parent-statement workflows that may include separately agreed additional hours, discounts, and permitted optional extras.

NCS subsidy, ECCE capitation, Core Funding supply-side support, parent fees, discounts, deposits, optional extras, and AIM support are separate financial objects. They must never be collapsed into one `discount` field.

Core Funding rules and caps are programme-year configuration. The 2025/2026 fee-cap bands are not permanent constants. The Department announced new maximum fee caps for the programme year beginning September 2026 and separate autumn-2026 changes to NCS income thresholds. Announced values remain future configuration until their effective policy pack is reviewed and activated.

The Irish government's 2026-2030 simplification plan explicitly targets duplicated reporting and administrative burden. Kiddz should use one attributed attendance, roster, qualification, fee, and evidence record to satisfy multiple authorized projections instead of asking the provider to re-enter the same fact for Tusla, ECCE, NCS, and internal operations.

## Canonical Policy Model

### `PolicyPack`

Minimum fields:

```text
id
jurisdictionCode
providerOrServiceClass
policyFamily
version
status: draft | reviewed | active | superseded | withdrawn
effectiveFrom
effectiveTo
sourceTitle
sourceAuthority
sourceUrl
sourcePublishedAt
sourceRetrievedAt
sourceHash
reviewedBy
reviewedAt
legalApprovalReference
supersedesPolicyPackId
```

No `draft` or expired policy pack can produce a `Safe` or `Compliant` label.

### `RatioRule`

```text
policyPackId
serviceClass
providerType
ageBandStart / ageBandEnd
childUnits
adultUnits
minimumAdultsOnPremises
maximumGroupSize
spaceRuleReference
requiredQualificationComposition
directWorkRequirement
paidStatusRequirement
exceptionType
```

### `QualificationDecision`

This object records the result of checking one staff qualification against one policy pack and date. It must preserve the source qualification, recognition route, level, effective/expiry dates, evidence attachment, reviewer, and decision reason. Editing a staff label cannot rewrite historical ratio evidence.

### `RatioSnapshot`

```text
organization / branch / room
intervalStart / intervalEnd
operationalLocalTimeZone
policyPackId / ratioRuleId
childAttendanceEventIds
staffPresenceEventIds
roomAssignmentIds
qualificationDecisionIds
requiredAdultCount
countedAdultCount
status: safe | atRisk | below | unknown
reasonCodes
calculatedAt
calculationVersion
```

`Unknown` is mandatory when policy, attendance, assignment, presence, or qualification evidence is unresolved. Unknown must never be converted to safe by omission.

### Funding objects

- `EntitlementAward`: programme, child, eligibility period, authorized hours/rate basis, evidence, status.
- `ProvisionCalendar`: programme year, term/week/day, planned hours, closures, provider agreement.
- `AttendanceAllocation`: observed attendance allocated to one or more authorized streams without double counting.
- `FundingClaim`: claimed period, hours, rate/config version, submission, response, adjustment, status.
- `FamilyCharge`: provider charge before funding and subsidy, with session/fee-list source.
- `FundingCredit`: ECCE/NCS/English entitlement or other payment allocated against a charge.
- `ParentBalance`: ledger projection, never an independently edited balance.

## UX Contracts

### Today and room ratios

- Show room, local time, observed children, counted staff, required staff, current status, next forecast change, policy label, and source freshness together.
- Explain every excluded adult: absent, on break, assigned elsewhere, unpaid, qualification unknown, qualification expired, or not working directly.
- A forecast is visibly distinct from observed current state.
- Policy change, missing source, or stale presence produces `Unknown` or `Needs review`, not a reassuring color.
- Resolving cover writes assignment and presence evidence; it does not merely dismiss an alert.

### Team and rota

- Staff profile shows qualification evidence and policy decisions separately.
- Rota planning can preview future ratio outcomes using the policy effective on the scheduled date.
- Breaks and cross-room cover are time bounded.
- A future policy change can be simulated without changing today's compliance history.

### Attendance

- Child and staff presence use event timelines with actor, source device, local time, correction reason, and revision.
- Ireland check-in/out actor and England key-person projection remain available where applicable.
- Absence follow-up is a work item with deadline and safeguarding escalation rules, not a badge.

### Finance and funded hours

- Show booked, attended, eligible, claimed, accepted, adjusted, funded, parent-charged, and outstanding values separately.
- Identify programme year and policy source on every calculation explanation.
- Never infer eligibility, rate, or funding approval from age or attendance alone.
- Reconciliation and corrections preserve the original claim and response.

### Inspection and export

- Inspection packages are generated by jurisdiction, provider/service class, date range, and evidence template.
- Preflight names missing attendance, roster, qualification, incident, medication, parent-contact, notification, and retention evidence.
- The export manifest identifies policy versions and source-as-of time.
- A package cannot claim legal completeness until its jurisdiction template is legally approved.

## Required Fixtures Before Production

### Ratio fixtures

1. England under-2 room with 7 present children requires 3 counted adults and the qualification composition check.
2. England age-2 room with 11 present children requires 3 counted adults.
3. England age-3+ room changes between 1:13 and 1:8 only when the qualifying person is actually working directly with children and all composition conditions pass.
4. England experience-based-route practitioners above the permitted composition threshold cannot all be counted at level 3.
5. Ireland full-day age-3-to-6 room with 17 present children requires 3 counted adults.
6. Ireland sessional age-2.5-to-6 room with 22 children requires 2 counted adults and remains at the stated room cap.
7. Ireland full/part-time service with a compliant room ratio but only one adult on premises fails the separate premises rule.
8. An unpaid Irish worker is visible in the room but excluded from the Schedule 6 counted-adult total.
9. Missing or expired qualification evidence produces `Unknown`, never `Safe`.
10. A policy effective-date boundary recalculates future forecasts without changing historical snapshots.

### Funding fixtures

1. England universal 15 hours and working-parent additional hours are distinct awards but cannot exceed the authorized combined limit.
2. England stretched provision consumes annual authorized hours against a dated calendar rather than resetting to 15/30 every week.
3. An English local-authority rate change affects new claim periods only.
4. Ireland ECCE hours, NCS subsidy, Core Funding conditions, parent fee, and optional extra remain independently traceable.
5. An announced but not effective Irish fee or NCS threshold change appears in planning and never changes a current invoice.
6. A corrected attendance event creates a claim adjustment and history rather than rewriting a submitted claim.

## Decisions

1. Build jurisdiction as a versioned policy subsystem, not tenant booleans and UI constants.
2. Treat service/provider class, qualification eligibility, actual presence, and direct assignment as ratio inputs.
3. Separate regulatory state, programme eligibility, claims, provider fees, subsidies, and family ledger entries.
4. Preserve one source fact and project it into authorized operational, regulator, programme, parent, and export views.
5. Fail visibly to `Unknown` when an input or approved policy pack is missing.
6. Preserve historical decisions with their original policy version.

## Open Validation Gates

1. Select the first launch jurisdiction and exact provider/service classes; do not include Irish childminding until its separate 2024 pack is mapped and approved.
2. Obtain legal review of mixed-age rooms, school exceptions, exceptional circumstances, breaks, outings, agency staff, volunteers, and emergency overrides.
3. Confirm the staff qualification evidence and recognition workflow used by real operators.
4. Obtain the first English local-authority provider agreement and Irish NCS/ECCE/Core programme packs used by pilot nurseries.
5. Confirm retention schedules where the official source is non-specific or interacts with insurance, safeguarding, tax, and data-protection duties.
6. Validate working-day calendars and regulator notification categories.
7. Validate whether the first product release calculates claims, reconciles imported results, or both.
8. Have nursery operators test the ratio explanation, override, correction, and inspection-preflight language.

Until these gates close, all policy calculations remain design and test fixtures and must not be presented as production legal advice.
