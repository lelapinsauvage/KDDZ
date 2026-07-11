# Kiddz Online Core Workflow Blueprints

**Date:** 2026-07-10  
**Status:** Territory-neutral workflow specification  
**Scope:** J01-J07 critical journeys

## Purpose

These blueprints turn the journey-state audit into buildable user and system contracts. They describe entry, state, mutation, recovery, authorization, cross-device projection, and completion without selecting a visual territory or inventing backend truth.

Every implementation must map the affected parity rows, legacy aliases, native contracts, and database sources before replacing presentation.

## Shared Action Contract

Every consequential action follows this sequence:

1. Enter from the affected child, room, work item, message, invoice, or compliance record.
2. Show the source state, freshness, owner, and scope.
3. Explain the consequence of the proposed change.
4. Collect only required factual input; never prefill an observation as fact.
5. Validate locally for speed and on the server for authority.
6. Persist atomically or return a resumable failure with input preserved.
7. Update the source object and every linked projection from the server result.
8. Append actor, time, scope, source revision, and reason to history where risk requires it.
9. Keep correction, retry, assignment, or waiting state adjacent.

## Shared State Vocabulary

| State | Meaning | UI obligation |
| --- | --- | --- |
| Unknown | Required fact has not been observed or confirmed | Name the missing fact and a valid owner/action |
| Draft | User input is persisted but not authoritative completion | Show saved time, scope, device, and resume action |
| Ready | Required input is valid and can be submitted | Expose consequence before commit |
| Submitted | Server accepted the source transition | Update source record and append history |
| Waiting | Another person or external event is required | Name who/what, since when, and escalation/cancel rule |
| Forecast | A future constraint is predicted from named inputs | Show source, time, confidence, and prevention action |
| Failed | Server or sync did not accept the transition | Preserve input, explain safe next step, allow retry |
| Corrected | A submitted fact was changed through an authorized correction | Preserve original, reason, actor, and new revision |
| Closed | All required downstream obligations are complete | Keep result and evidence discoverable |

## J01 - Open the Nursery Safely

### User outcome

The manager understands current readiness in three seconds, resolves unknown or unsafe states, and preserves a server-confirmed opening event.

### Entry

- Default manager Today projection during opening mode.
- Direct branch opening work item.
- Branch switch from all-branch oversight.

### Source objects required

- Concrete branch and operational date.
- Expected child roster and child presence facts.
- Staff presence, shift, qualification, and room assignment facts.
- Effective-dated ratio rules.
- Active medical, safeguarding, collection, and facility exceptions.
- Draft/complete care and handover work relevant to opening.

Several of these objects are not complete in the current schema. The UI must not manufacture readiness until the named data contracts exist.

### Flow

1. Confirm branch and live date mode.
2. Read one readiness statement: safe, unsafe, or unknown.
3. Compare room state, expected/present children, staff, ratio source, and next change.
4. Expand only rooms with unknown, unsafe, or forecast conditions by default.
5. Resolve attendance, staff presence, qualification, or medical/safeguarding blockers in context.
6. Review the final exception summary.
7. Confirm opening readiness.
8. Receive a persisted opening event with actor, branch, time, source revisions, and unresolved accepted exceptions where policy allows.

### Completion

- The readiness source updates to `Opened at HH:MM by Name`.
- Room and queue projections reflect the confirmed state.
- Future forecast work remains visible and owned; opening confirmation does not erase it.

### Failure and recovery

- Stale source revision: show which room/fact changed and refresh without discarding unrelated work.
- Missing policy/rule: fail closed and route to authorized configuration/support.
- Offline: allow read-only cached state; do not claim opening confirmation until server accepted.
- Correction: authorized manager records reason and new revision; original opening event remains.

### Authorization

Branch scope, opening capability, room assignment, and source transition must all pass server-side. All-branch oversight cannot write without selecting one branch.

### Device projection

- Desktop: branch readiness plus room comparison and work queue.
- Tablet: one room primary with branch summary.
- Mobile: assigned blocker resolution and status; branch-wide opening confirmation only when policy and evidence fit safely.

## J02 - Mark Attendance With Exceptions

### User outcome

The practitioner records observed presence without false defaults, handles exceptions, and immediately updates ratios and parent-facing state.

### Entry

- Today room row.
- Room roster.
- Child workspace attendance.
- Unknown attendance work item.

### Source objects required

- Expected roster for branch, room, and date.
- Existing arrival, departure, absence, late, and correction events.
- Child restrictions relevant to arrival/collection.
- Current room and ratio source.

### Flow

1. Open expected roster with all attendance values unset unless a server fact already exists.
2. Mark observed arrivals individually or use an explicit batch action after physical confirmation.
3. Record known absence, late/expected, or not expected with reason/evidence rules.
4. Surface medical, safeguarding, and collection restrictions before final confirmation.
5. Review unknowns and the ratio consequence.
6. Submit a server-owned attendance event set.
7. Show resulting present/absent/unknown state, room ratio, and parent-visible update.

### Completion

- Every roster child has an explicit observed state or remains visibly unknown.
- Presence is represented by a persisted fact, not inferred from the lack of absence.
- Duplicate submits are idempotent.

### Failure and recovery

- Network failure preserves unsent changes as a named local draft where offline policy permits.
- Conflict shows the server event, local observation, and authorized correction path.
- A mistaken arrival is corrected through an event/revision, never destructive deletion.
- Browser flags never hide authoritative attendance work.

### Authorization

Teacher writes require active assignment to the branch/room or a documented delegated capability. Nurses/doctors may read where clinical responsibility allows but do not inherit attendance mutation.

### Device projection

- Desktop: roster table, batch tools, exception summary, ratio side effect.
- Tablet: large roster rows and rapid explicit states.
- Mobile: scan/search one child, mark state, and resume room progress.

## J03 - Record Room Care

### User outcome

The practitioner records only observed care facts, handles child exceptions, survives interruption, and completes the room handover without inventing data.

### Entry

- Today care-completion work item.
- Assigned room.
- Child day workspace.
- Draft resume.

### Source objects required

- Room roster and current attendance.
- Existing daily report/draft revision per child/date.
- Required care fields and room policy.
- Absence object from the same attendance source, not an independent flag.

### Flow

1. Choose the observed children or explicitly select the observed room group.
2. Enter a shared observation with factual fields initially unset.
3. Review the exact children who will inherit the shared value.
4. Add child exceptions without overwriting unrelated child facts.
5. Attach evidence where relevant.
6. Save a versioned draft automatically and on demand.
7. Review missing required fields, absent children, and conflicts.
8. Submit selected reports.
9. See room completion and parent-communication consequence.

### Completion

- Submitted reports are distinct from drafts.
- Each child record identifies source, author, time, revision, and shared-entry provenance.
- The Today care work item decrements from the confirmed server result.

### Failure and recovery

- Draft save failure remains visible in a stable status region; input stays editable.
- Cross-device conflict offers server version, local version, and merge/correction rules.
- Offline capture queues only fields approved for offline storage and shows unsynced scope.
- Correction creates a new revision and preserves parent-visible history policy.

### Authorization

Write scope follows active room/child assignment and required care capability. Parent access is read-only and relation-scoped.

### Device projection

- Desktop: room group, shared observation, child exceptions, and completion together.
- Tablet: primary capture surface with large controls.
- Mobile: quick factual capture, photo/voice where policy permits, draft resume.

## J04 - Resolve Child Safety or Health Work

### User outcome

Authorized staff record the correct incident or medical event, preserve evidence, complete review and notification obligations, and maintain an immutable history.

### Entry

- Urgent Today/work-queue item.
- Child critical banner.
- Room roster alert.
- Medical saved view.
- Existing incident/visit/vaccination/condition record.

### Source objects required

- Child identity, guardians, allergies, conditions, medication, insurance, collection restrictions.
- Typed medical/incident workflow and required evidence.
- Role/qualification and transition policy.
- Attachments, notifications, acknowledgments, and audit events.

### Flow

1. Confirm child and event type before entry.
2. Show critical restrictions and recent related records.
3. Capture observed event, time, location, immediate care, child state, and responsible staff.
4. Trigger type-specific required fields/evidence.
5. Save an interruptible draft.
6. Review consequence: manager review, parent notification, clinical follow-up, regulator evidence.
7. Submit the source record.
8. Assign/complete manager or clinical review.
9. Track delivery and acknowledgment separately from sending.
10. Close only when workflow obligations are satisfied.

### Completion

- Submission, manager review, parent delivery, acknowledgment, follow-up, and closure remain distinct events.
- The source record timeline appends every transition.
- Urgent work remains open while any required obligation is pending.

### Failure and recovery

- Attachment failure does not discard entered facts.
- Notification failure creates retry work; it does not roll back the source record.
- Corrections are reasoned revisions; hard delete is prohibited for submitted high-risk records.
- Missing policy or authorization fails closed without revealing extra child data.

### Authorization

Transition policy varies by event type and role. Initiate, edit draft, submit, review, notify, correct, and close are separate capabilities.

### Device projection

- Tablet/mobile: immediate factual capture and evidence.
- Desktop: review, linked history, obligation tracking, correction, and export.

## J05 - Resolve Staffing and Ratio Risk

### User outcome

The manager sees a current or forecast ratio risk, understands its cause, assigns qualified cover, and preserves the resolution.

### Entry

- Room operating plane.
- Forecast work item.
- Team coverage view.
- Staff absence event.

### Source objects required

- Effective-dated child age/ratio policy.
- Child presence and expected changes.
- Staff presence, shifts, breaks, room assignment, qualification, and availability.
- Explainable ratio snapshot and forecast.
- Time-bounded cover assignment and resolution record.

These contracts are currently incomplete and must be implemented before the UI can claim automated compliance.

### Flow

1. Open the affected room/time window.
2. Show current ratio, required ratio, source children/staff, and forecast change.
3. Explain the exact cause: arrival, departure, break, absence, qualification, or assignment.
4. List only qualified, available, in-scope cover candidates with conflicts.
5. Preview every affected source and target room after the proposed move; block the commit if any room becomes unsafe or unknown.
6. Assign cover or record an authorized alternative.
7. Recalculate and persist the ratio snapshot.
8. Show restored compliance and append the decision history.

### Completion

- Room state, team schedule, work queue, and audit history update from one confirmed result.
- No accepted cover assignment can resolve the target room by creating a new source-room risk.
- A temporary cover assignment expires at the stated time and does not silently become permanent.

### Failure and recovery

- Stale schedule or attendance data blocks commit and shows the changed source.
- No valid candidate keeps the risk open and offers escalation, attendance adjustment where legitimate, or management action.
- Offline mode may show cached risk but cannot claim a confirmed compliant resolution.

### Authorization

Requires branch scope plus staff-scheduling/coverage capability. Candidate search must not expose staff outside allowed organizations or records.

### Device projection

- Desktop: compare candidates, schedules, and consequences.
- Tablet: resolve an assigned room risk.
- Mobile: receive risk, inspect cause, contact/assign only when the policy can be represented safely.

## J06 - Collect and Reconcile Payment

### User outcome

Finance staff understand the family balance, record or locate a payment, allocate it to invoices, and leave ledger and receipt history consistent.

### Entry

- Finance needs-allocation view.
- Family/child finance workspace.
- Invoice.
- Payment alarm/work item.
- Global search by child, guardian, invoice, amount, or reference.

### Source objects required

- Family/child account relation.
- Invoices and charge lines.
- Payments with method, date, amount, evidence, and reference.
- Explicit payment allocations.
- Ledger events, balance derivation, receipts, and corrections.

The current disconnected `Payment` and `AccountingEntry` stores must be reconciled by a named data contract before redesign claims one balance.

### Flow

1. Confirm family, child, branch, and current balance source.
2. Open an existing unallocated payment or record a new one.
3. Show amount, method, date, evidence, duplicate warning, and available invoices.
4. Allocate full or partial amounts with remaining-balance preview.
5. Review resulting family and invoice balances.
6. Submit one atomic payment/allocation transition.
7. Generate receipt/invoice output from the confirmed result.
8. Track communication separately from allocation completion.

### Completion

- Payment, allocations, invoice balances, account ledger, and displayed totals agree.
- Source history shows import/record, allocation, actor, time, and correction lineage.
- Work item closes only when required allocation is complete.

### Failure and recovery

- Duplicate/idempotency checks prevent accidental double recording.
- Partial failure cannot leave allocation and ledger totals divergent.
- Correction/reversal preserves original event and reason.
- Offline write is prohibited unless a robust queued-finance policy is explicitly approved.

### Authorization

Finance query, record, allocate, correct, export, and communicate are separate capabilities. Parent access is relation-scoped read only.

### Device projection

- Desktop: primary reconciliation and ledger surface.
- Tablet/mobile: balance lookup, receipt access, and perhaps payment evidence capture; complex allocation may hand off to desktop.

## J07 - Prepare for Inspection

### User outcome

The manager sees missing/expiring evidence, resolves ownership, generates a complete dated package, and preserves provenance.

### Entry

- Today compliance work.
- Reports compliance view.
- Branch workspace.
- Staff/child document expiry.

### Source objects required

- Jurisdiction and inspection profile.
- Required evidence manifest by branch, child, staff, policy, medical, attendance, finance, and facility domain.
- Document versions, expiry, owner, source, and access policy.
- Export job, manifest, missing-evidence report, checksum/provenance, and generation history.

### Flow

1. Choose branch, jurisdiction/profile, and inspection date range.
2. Run preflight against the named requirement manifest.
3. Group blockers by consequence and owner, not storage folder.
4. Assign or resolve missing, expired, inaccessible, or inconsistent evidence.
5. Re-run preflight and preserve accepted exceptions with authority/reason.
6. Preview package contents, redactions, date/source, and missing evidence.
7. Generate the package as a server job.
8. Verify completion, manifest, provenance, and access expiry.
9. Record who generated/downloaded it and when.

### Completion

- The package is not labeled complete unless preflight policy passes or authorized exceptions are explicit.
- SQL backup remains a separate restoration artifact, never presented as an inspection package.
- Generated output links back to source records and manifest revision.

### Failure and recovery

- Long-running generation exposes named progress and can resume/retry safely.
- Missing file or permission creates a precise blocker without leaking unauthorized content.
- Expired download links can be regenerated from the preserved job/manifest.
- A changed source after generation marks the package as historical, not current.

### Authorization

Preflight, view sensitive evidence, accept exception, generate, download, and audit are separate capabilities. Redaction follows recipient and purpose.

### Device projection

- Desktop: preflight, resolution, preview, and generation.
- Tablet/mobile: assigned evidence capture and status; package generation may be read-only or explicitly handed off.

## Cross-Workflow Wireflow Rules

### From Today to source and back

- Opening a work item preserves branch, date, room, queue position, and scroll.
- Successful completion returns to the exact source projection or updates it in place.
- Waiting and failed states remain in the queue; success never removes work before the server result.

### From list to record and back

- Search, saved view, filters, selection, sort, pagination, and scroll survive the round trip.
- Side panels are allowed for read/triage. Consequential multi-step work opens a full workspace.
- Browser back returns to the previous list state, not a default route.

### Draft continuity

- Draft identity includes user, organization, branch, record scope, workflow, and source revision.
- Resume surfaces show last saved time, device/channel, sync state, and conflict.
- A draft is never counted as submitted completion.

### Completion feedback

- Immediate feedback uses a stable inline region and source-state change.
- Toasts may acknowledge but cannot be the only proof.
- High-frequency actions settle quickly; high-consequence actions may use richer but non-blocking confirmation.
- Reduced motion preserves state, order, and confirmation without spatial dependency.

## Verification Matrix

| Journey | Browser happy path | Error/recovery | Authorization | Responsive | Parity/native |
| --- | --- | --- | --- | --- | --- |
| J01 Opening | Required | Required | Branch + transition | Desktop/tablet/mobile status | Dashboard/Today aliases |
| J02 Attendance | Required | Conflict, retry, correction | Assignment + capability | Desktop/tablet/mobile capture | Attendance and absence aliases |
| J03 Care | Required | Draft, offline, conflict, correction | Room/child assignment | Desktop/tablet/mobile capture | Daily report/native contracts |
| J04 Safety/health | Required | Attachment, notify, revise | Typed transition policy | Capture and review projections | Medical aliases and PDFs |
| J05 Ratio/cover | Required | Stale source, no candidate | Scheduling capability | Desktop plus assigned mobile | New contracts plus existing staff data |
| J06 Finance | Required | Duplicate, atomic failure, reversal | Finance action capabilities | Desktop primary, mobile lookup | Accounting/native finance |
| J07 Inspection | Required | Missing evidence, job retry | Evidence/export capabilities | Desktop primary, mobile contribution | Export, storage, backup distinction |

## Build Order

1. Shared context, capability, audit, idempotency, correction, and draft contracts.
2. Presence timeline and explicit attendance events.
3. Staff shift, qualification, room assignment, ratio policy, snapshot, and forecast.
4. Today readiness and room operating plane.
5. Attendance and room-care workflows.
6. Typed medical/safety transitions and obligations.
7. Payment allocation and ledger reconciliation.
8. Compliance manifest and inspection package.

The visual redesign may prototype later stages, but production implementation cannot reverse this dependency order without inventing data or weakening trust.

The territory-neutral behavior foundation for steps 2-5 is now executable in `src/lib/redesign-live-operations.ts` and `/design-lab/operations`, with evidence in `live-operations-contract.md`. It proves explicit unknown attendance, idempotent accepted events, append-only correction, policy-supplied ratio decisions, explainable staff inclusion, forecast work, time-bounded floating cover, and pre-commit source/target room consequence preview. It remains synthetic and additive; production persistence, atomic transactions, policy activation, authorization, and compatibility migration are still open.

The handover boundary is now executable in `src/lib/redesign-handover-contracts.ts` and `/design-lab/handover`, with evidence in `handover-contract.md`. It proves that unknown sources and drafts block closure, only policy-allowed work can carry, incoming ownership requires acknowledgment, and close revalidates every source revision while retaining carried work. It remains synthetic and additive; operator policy, persistence, authorization, parent/native consequences, and parity migration are still open.

## Open Validation

- Operator sequencing at opening, lunch cover, handover, and closing.
- First-market ratio, safeguarding, funded-hours, billing, and inspection policy.
- Actual shared-device, interruption, and offline patterns.
- Which medical transitions require dual approval.
- Parent notification and acknowledgment deadlines.
- Payment allocation, correction, and receipt policy.
- Inspection package contents, redaction, and retention.

These questions block policy finalization, not continued reversible IA, prototype, test-infrastructure, and compatibility work.
