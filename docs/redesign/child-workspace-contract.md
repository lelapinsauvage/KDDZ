# Kiddz Online Child Workspace Contract

**Date:** 2026-07-11
**Status:** Executable territory-neutral behavior contract; production capability integration and persistence open
**Prototype:** `/design-lab/child-workspace`
**Contract:** `src/lib/redesign-child-workspace-contracts.ts`

## Question

Can one child workspace preserve the full restored dossier while exposing only the sections, safety notices, timeline events, actions, and parent summaries each viewer is authorized to use?

## Current Product Audit

The restored child surface is broad and valuable, but its composition is not yet a safe product contract:

- `getChild` checks organization ownership, then includes parents, relatives, siblings, class, branch, school year, accounting entries, addresses, attachments, and previous nurseries in one result.
- The child sub-navigation renders the same Details, Dashboard, Edit Profile, Attendance, Absence, Accidents, Medical, Accounting, Calls, and Reports destinations for every staff role.
- `getChildTimeline` checks organization-child ownership, then queries daily reports, absences, medical forms, vaccinations, payments, accident forms, and calls without per-event capability or assigned branch/room scope.
- Timeline entries use date-only strings, generic family routes, no source revision, no provenance classification, no publication state, and no correction chain.
- Draft care and medical sources can sit beside submitted records without a common rule for parent publication.
- Parent daily APIs correctly limit daily reports to `SUBMITTED`, but parent daily, finance, messages, alarms, and notifications remain separate adapters rather than one governed child projection.
- Legacy route and parity work deliberately restored detailed dossier, attendance, accounting, calls, reports, print, edit, attachments, and nested-row fidelity; redesign must not flatten or discard that breadth.

## Executable Contract

### Base access before composition

A child workspace opens only after one base decision:

- staff: organization match, allowed branch, and `children.view`;
- parent: organization match, allowed branch, `parent.child.view`, and explicit child relationship.

Denied access returns no identity, section, safety notice, event, or count.

### Independently authorized sections

Overview, Care, Attendance, Health, Communication, Finance, Documents, and Audit each declare separate staff and parent capabilities. The projector builds navigation from accepted decisions; a hidden tab is never treated as server authorization.

No hidden denied count is returned. A practitioner sees five timeline events, not a seven-event total with two unexplained omissions.

### Source-backed timeline

Every event declares:

- child, organization, and branch scope;
- source kind, source ID, and source revision;
- effective time and recorded time;
- draft/submitted/waiting/resolved/corrected state;
- observed/submitted/derived/imported/correction provenance;
- staff and parent capabilities;
- draft/internal/published delivery state;
- routine/sensitive/restricted sensitivity;
- separate staff and parent title, detail, and path.

Draft is not parent-visible. Internal staff calls, clinical detail, safeguarding records, and missing parent-safe content do not enter the parent projection. Staff summaries are never reused as parent copy.

Timeline order uses the full effective timestamp, then recorded timestamp and stable event ID. Source paths lead back to the authoritative record rather than a generic dashboard percentage.

### Safety context

Safety notices use the same base scope plus notice-specific capabilities. The fixture exposes the allergy plan to every role that needs it, while a restricted collection source is visible only to safeguarding-capable staff. A parent receives approved parent-safe wording, not the protected staff detail.

### Append-only correction

A correction requires:

- event and idempotency IDs;
- actor and recorded timestamp;
- expected workspace and source revisions;
- a strictly newer accepted source revision;
- corrected effective timestamp, reason, and staff detail;
- `child_timeline.correct`, `audit.read`, and source-read capability;
- parent-safe replacement detail when the corrected source was published.

Exact replay is idempotent. Changed input, stale workspace/source state, duplicate correction, missing capability, unchanged revision, or missing parent-safe content fails.

The correction appends a new event. Audit-capable staff retain the superseded original and the reason. Ordinary staff and parents see only the current event, so correction history does not create a false duplicate operational fact.

## Role Fixture

The synthetic Alma Reyes workspace proves four distinct projections:

| Viewer | Sections | Timeline | Safety notices | Deliberately absent |
| --- | ---: | ---: | ---: | --- |
| Manager | 8 | 7 | 1 | restricted clinical and safeguarding detail |
| Practitioner | 5 | 5 | 1 | finance, documents, audit, clinical detail, safeguarding |
| Nurse | 5 | 5 | 2 | finance, care drafts, internal calls |
| Parent | 7 | 5 | 1 | drafts, internal calls, clinical detail, safeguarding, staff wording |

The manager can correct the arrival source from 09:14 revision 4 to 09:12 revision 5 using the signed room register. The manager timeline grows from seven to eight because audit preserves both events. Practitioner and parent timelines remain at five because the superseded operational fact is replaced, not duplicated.

## Browser Evidence

Agent Browser replayed eight states at `1440 x 900`, `390 x 844`, and `320 x 568`, for 24 state/viewport combinations:

- manager overview;
- manager finance section;
- correction reason ready;
- manager corrected history;
- practitioner projection;
- nurse projection;
- nurse Health section;
- parent-safe projection.

All combinations retain one H1, expected role counts and section/event filtering, accepted-correction focus, zero horizontal overflow, zero clipped critical text, zero unnamed controls, zero undersized visible targets, zero axe violations, and zero unresolved axe findings. Browser warning/error logs are empty.

The matrix proves manager `7 events / 8 sections / 1 notice` before correction and `8 / 8 / 1` after audit retention; practitioner `5 / 5 / 1`; nurse `6 / 5 / 2` after correction; and parent `5 / 7 / 1`. Practitioner receives no finance, clinical detail, or safeguarding content. Nurse receives clinical and safeguarding sources but no care draft or finance. Parent receives the parent-safe finance event but no draft, staff call note, clinical detail, safeguarding record, staff recorder wording, audit section, or denied count.

Two defects were corrected during browser review:

1. Whole-row opacity on a superseded event caused four small-text contrast failures; the row now uses explicit `Superseded` content and a neutral surface without reducing text opacity.
2. Phone section navigation left a button partially obscured inside a horizontal scroller; phone sections now use a two-column grid with every destination visible and touchable.

Focused ESLint, full TypeScript, child-workspace/Action Center/handover/live-operations/search/navigation/route/state/selection/Calls/native-parent verifiers, parent daily and notification contracts, child attendance/history/report/grouped-header parity verifiers, diff checks, and the production build pass. The route verifier covers 336 app routes and 30 critical aliases, and `/design-lab/child-workspace` emits statically with only the repository's documented legacy dynamic-prerender messages, middleware deprecation, and print CSS warning. Parent contract verifiers used a process-local test secret because the shell intentionally exposes no production parent JWT secret.

## Additive Production Migration

1. Add a server-owned child workspace query that first resolves effective capability, assignment, branch, room, relationship, and record scope.
2. Keep current child, parent, relative, sibling, address, accounting, attachment, previous-nursery, medical, attendance, report, call, assessment, and document stores intact.
3. Split current broad dossier loading into section-specific server queries with named capability decisions and bounded collection contracts.
4. Add versioned source adapters for attendance, care, absence, medical, vaccination, accident, communication, finance, documents, assessments, profile edits, and imported legacy records.
5. Preserve source effective time, recorded time, actor, status, provenance, revision, correction, and legacy identity. Do not synthesize observed attendance from reports or imported history.
6. Define parent publication policy per source family. Existing parent API payloads remain live through compatibility adapters and installed-client cutover.
7. Add append-only correction persistence and source receipts; do not mutate submitted high-risk history in place.
8. Generate section navigation and actions from the same server capability decisions used by queries and mutations.
9. Preserve every current and legacy child URL. New information architecture may change labels and grouping only after route-entry, history, export, print, native, and parity acceptance.
10. Dual-read representative children across roles and compare source counts, fields, attachments, outputs, and parser contracts before replacing any production child surface.

## Parity Boundary

This slice adds only a deterministic contract, synthetic fixture, verifier, documentation, and isolated design-lab route. It changes no production child query, dossier, sub-navigation, timeline, report, medical form, attendance source, payment, call, attachment, action, Prisma model, database row, permission, route, print/export, legacy alias, parent/native payload, or restored capability.

The 1,713-row parity matrix and child-specific legacy verifiers remain the functional preservation source. The redesign may consolidate presentation but cannot remove nested dossier data, attendance matrices, accounting categories, call/report fields, attachments, print/export, map coordinates, legacy IDs, or direct workflow actions.

## Open Gate

- Define production child section and transition capabilities against imported grants, assignments, health responsibility, safeguarding policy, and parent relationship.
- Validate manager, practitioner, nurse, doctor, administrator, and parent terminology and task sequences.
- Add canonical timeline adapters, revisions, correction persistence, pagination, retention, and export.
- Reconcile staff and parent publication, notification, acknowledgment, and correction policy by source family.
- Prove representative-scale, 200% zoom, screen-reader, RTL, reduced-motion, shared-device, offline/read-only, native parser, print/PDF, and physical-device behavior in the selected visual system.

## Decision

Use this contract as the Phase 6 child-profile foundation. One child identity may compose many source domains; access, publication, and correction remain explicit at every section and event.
