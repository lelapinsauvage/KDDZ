# Kiddz Online Medical Incident Lifecycle Contract

**Date:** 2026-07-11
**Status:** Executable territory-neutral behavior contract; production persistence, jurisdiction policy, and operator validation open
**Prototype:** `/design-lab/incident`
**Contract:** `src/lib/redesign-medical-incident-contracts.ts`

## Question

Can a nursery record, review, communicate, acknowledge, follow up, close, and correct a medical or safety incident without collapsing those facts into one mutable status or losing the restored legacy record?

## Current Product Audit

The restored product preserves valuable medical data, routes, attachments, alarms, PDFs, and legacy definitions, but its current mutation surface is not an accountable incident lifecycle:

- `MedicalFormStatus` contains only `DRAFT`, `SUBMITTED`, and `REVIEWED`.
- Create and update callers may assign status directly; the server does not own typed transitions.
- Updating entries deletes every current `MedicalFormEntry` row before recreating them, so it does not preserve a revision ledger.
- Generic and accident-specific deletion both hard-delete the `MedicalForm`, including submitted accident records.
- The accident dialog uploads every attachment before creating the source form. Upload failure leaves React state on that browser, but no durable draft or resumable upload receipt exists.
- Submission creates the form but does not atomically create manager review, clinical review, parent delivery, acknowledgment, follow-up, or closure obligations.
- Legacy medical alarms and `NotificationReceipt` rows preserve compatibility delivery projections, but they are not linked to a source incident transition or a separate parent acknowledgment.
- Organization access is checked, but draft, submit, review, notify, acknowledge, follow-up, close, correct, and delete are not independent capabilities.
- There is no expected source revision or idempotency key on the current mutation path.

This contract does not discard those restored records. It supplies the missing canonical lifecycle around them.

## Executable Contract

### Source and obligation boundary

The incident source owns child scope, facts, evidence, selected policy version, source state, source revision, accepted events, and closure receipt. It does not pretend that downstream obligations are part of the same status.

The selected policy creates only the obligations it requires:

- manager safeguarding review;
- clinical review;
- parent delivery;
- parent acknowledgment;
- room or clinical follow-up.

Each obligation owns its state, owner, due time, source revision, attempts, failure, retry work item, and receipt. Policy is supplied and versioned; the synthetic all-required fixture is not a hard-coded jurisdiction rule.

### Deterministic projection

The source and current obligation cycle project to:

- `DRAFT_INCOMPLETE`: required facts or evidence are unresolved;
- `DRAFT_READY`: required facts and evidence are available;
- `REVIEW_REQUIRED`: one or more typed reviews remain;
- `PARENT_DELIVERY_PENDING`: reviews are complete and family delivery is ready;
- `DELIVERY_FAILED`: delivery failed and retry work is open;
- `ACKNOWLEDGMENT_PENDING`: provider delivery exists but parent acknowledgment does not;
- `FOLLOW_UP_REQUIRED`: acknowledgment exists and named follow-up remains;
- `READY_TO_CLOSE`: every current obligation is satisfied;
- `CLOSED`: closure was accepted from fresh source and obligation revisions.

Delivery is not acknowledgment. Submission is not review. Review is not follow-up. Notification failure is not source rollback. Closed is not deleted.

### Transition boundary

Every accepted command requires:

- event ID and idempotency key;
- actor and occurrence timestamp;
- expected incident revision;
- a dedicated capability;
- exact obligation source revision when acting on an obligation.

Close additionally requires the current source revision of every obligation. Exact replay is idempotent. Reusing a key with changed input, stale source data, unavailable dependencies, missing evidence, or missing capability fails.

### Failure and correction

Evidence retry updates only the failed evidence item and retains entered facts. Parent delivery failure keeps the incident submitted, records the provider reason, increments attempts, and creates a stable retry work-item ID. A later successful attempt stores a provider receipt and only then opens acknowledgment.

Correction is append-only. It records a reason and corrected fact, clears closure, retains all previous satisfied obligations and receipts, and appends a new policy-derived obligation cycle only for consequences that must be revisited. Submitted or closed incidents are never silently overwritten or hard-deleted in the canonical model.

## Role Projection

- A practitioner can complete a draft and submit it, but cannot review, notify, acknowledge, close, or correct.
- A manager can complete manager review, deliver the parent update, close, and correct.
- A nurse can complete clinical review and follow-up.
- A parent can see only a published family-safe summary and acknowledge receipt. Internal draft facts, evidence, provider errors, staff work, and review notes are hidden before delivery.

The design-lab role control demonstrates capability-safe actions and the parent-safe publication boundary without asserting that a client-side control is production authorization.

## Interaction Fixture

The synthetic Alma/Riverside/Meadow fixture proves ten deterministic states:

1. A failed photo upload and missing witness note leave a retained incomplete draft.
2. Evidence retry and witness completion produce a ready draft without losing entered facts.
3. Submission creates five policy-derived obligations.
4. Manager and clinical review complete independently.
5. Parent delivery can fail while the submitted source remains intact and retry work opens.
6. Successful retry stores a provider receipt and opens acknowledgment.
7. Parent acknowledgment opens follow-up.
8. Clinical follow-up produces a closure-ready preflight.
9. Closure revalidates every obligation source revision.
10. A reasoned correction appends a new cycle while the original receipts remain immutable.

## Browser Evidence

Agent Browser replayed ten deterministic lifecycle states at `1440 x 900`, `390 x 844`, and `320 x 568`, for 30 state/viewport combinations:

- incomplete retained draft;
- ready draft;
- review required;
- ready for parent delivery;
- delivery failed;
- awaiting parent acknowledgment;
- follow-up required;
- ready to close;
- closed;
- correction reopened.

Every combination retains one H1, the expected projected status, zero horizontal overflow, zero unnamed visible controls, and no undersized compact controls. Axe 4.12.1 completed all 30 runs with zero violations and zero incomplete findings.

Two additional parent-policy runs prove that internal facts, evidence, obligations, provider detail, review notes, and history are absent before publication; after delivery, only the family-safe summary and acknowledgment action appear. Accepted parent acknowledgment and practitioner submission both update the polite live region and move focus to the changed heading. The 320px failed-delivery visual pass exposed and closed one wrapped-brand header issue; the final compact header remains 68px high with 48px controls and zero overflow.

Focused ESLint, full TypeScript, the medical incident verifier, child workspace, Action Center, handover, live operations, search, navigation, route, state, territory-selection, Calls, native-parent, and medical/accident legacy parity regressions pass. Both database-backed medical message-side-effect and push-delivery verifiers pass and clean up their synthetic rows. The production build passes, the route verifier covers 337 app routes and 30 critical aliases, and `/design-lab/incident` emits statically with only the repository's documented middleware, print CSS, PostgreSQL SSL-mode, and legacy dynamic-prerender warnings.

## Additive Production Migration

1. Add incident revision, transition event, policy snapshot, obligation, delivery attempt, acknowledgment, follow-up, closure, and correction persistence without removing `MedicalForm`, `MedicalFormEntry`, `FormAttachment`, legacy form definitions, alarms, notification receipts, or route aliases.
2. Backfill each imported/current medical form as a provenance-labeled source revision. Do not synthesize review, delivery, acknowledgment, or closure receipts that the legacy data cannot prove.
3. Preserve legacy entry rows and raw JSON. New canonical corrections append revisions; a compatibility projection can still render the latest values in existing forms and PDFs.
4. Move draft facts and evidence metadata into one transaction boundary. Upload completion may remain asynchronous, but failed evidence must be resumable and cannot discard the draft.
5. Introduce draft, submit, manager-review, clinical-review, notify-parent, acknowledge-parent, follow-up, close, correct, and exceptional-retention capabilities with organization, branch, child, and incident scope.
6. Select versioned requirements by operator and jurisdiction policy. Dual approval, deadlines, channels, retention, regulator reporting, and medical severity remain explicit policy inputs.
7. Use an outbox for parent delivery. Map successful provider attempts to canonical receipts and project required legacy `Alarm` and `NotificationReceipt` rows from the same committed source event.
8. Keep acknowledgment separate from read/delivery state. Parent web and future native clients must call one idempotent acknowledgment transition.
9. Close in a transaction that locks or revalidates the incident and every current obligation revision. Return changed sources instead of accepting a stale preflight.
10. Replace submitted-record hard delete with capability-gated correction, exceptional retention workflows, and append-only audit. Existing legacy deletion behavior remains until migration and retention policy are verified.
11. Dual-read representative general, condition, visit, vaccination, and accident forms before switching current medical pages, parent views, alarm jobs, PDFs, exports, or native payloads.

## Parity Boundary

This slice is additive and synthetic. It changes no production Prisma model, database row, server action, upload, alarm job, notification receipt, parent endpoint, PDF, export, native payload, current medical page, accident form, or legacy alias. The existing restoration verifiers remain required gates.

The final production adapter must preserve:

- `MedicalForm` and `MedicalFormEntry` imported provenance and reconciliation;
- `LegacyMedicalFormDefinition` selection behavior;
- active `FormAttachment` access and existing storage URLs;
- accident roster, child accident route, and PDF behavior;
- medical alarm generation and staff/parent legacy receipt projections;
- current organization/child access checks while adding typed action capabilities;
- general, condition, visit, vaccination, accident, parent, export, and native compatibility surfaces.

## Open Validation

- Which severity levels require manager, clinical, dual, regulator, or safeguarding review?
- Which family delivery channels and deadlines apply by provider and jurisdiction?
- Does a read receipt satisfy any policy, or is explicit parent acknowledgment always required?
- Which corrections require a new parent update, new acknowledgment, renewed follow-up, or regulator notification?
- What evidence is required, optional, restricted, redacted, or retained for each incident class?
- Which emergency actions must be possible before the source record is complete?
- Which roles may record facts, administer treatment, review, waive, correct, export, and invoke exceptional deletion/retention workflows?

These questions block production policy activation, not continued reversible schema, adapter, authorization, browser, and compatibility work.
