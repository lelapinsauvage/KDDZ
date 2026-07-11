# Kiddz Online Action Center Contract

**Date:** 2026-07-11
**Status:** Executable territory-neutral behavior contract; production persistence and operator escalation policy open
**Prototype:** `/design-lab/action-center`
**Contract:** `src/lib/redesign-action-center-contracts.ts`

## Question

Can Today present one trustworthy queue across attendance, ratios, care, medical, messages, finance, documents, and handover without exposing denied records or confusing “viewed,” “owned,” “deferred,” or “alarm hidden” with source resolution?

## Current Product Audit

The restored product contains broad source coverage, but it does not yet have one work lifecycle:

- `getActionableAlarms` combines persisted alarms, overdue vaccinations, overdue payments, and birthdays, then maps types to static critical/warning/info groups.
- The notification-center `resolveAlarm` action sets `Alarm.isActive = false`; it does not prove the vaccination, medical, payment, request, contract, or other source condition changed.
- Snooze writes a new `Alarm.dueDate`, mixing “when I want to see this again” with the canonical source deadline.
- Message `isRead`, `Notification.isRead`, and `NotificationReceipt.isRead` are delivery/attention facts, not reply or resolution evidence.
- Daily and medical drafts, pending absences, ratio risk, staff exceptions, payment status, and handover obligations each use separate states and ownership assumptions.
- Most source records have no common owner, claim history, escalation, source revision, resolution receipt, or correction link.
- The current alarm center uses organization branch membership, but a future cross-domain queue also needs per-item capability and concrete branch/room/record scope before counting or rendering work.

Birthdays and informational announcements may remain useful signals. They do not become work unless an operator policy names a required action, consequence, owner, and completion source.

## Executable Contract

### Source-linked item

An `ActionCenterItem` is a projection of canonical source work. It declares:

- organization, branch, optional room and record scope;
- required read capability;
- source kind, ID, revision, state, update time, and canonical path;
- operational urgency and canonical due time supplied by source policy;
- owner, read receipts, attention deferral, and resolution evidence;
- an independent item revision for optimistic concurrency.

`UNKNOWN`, `OPEN`, and `WAITING` remain active. `RESOLVED` leaves active work only when a newer source revision supplies an evidence path.

### Four facts that never collapse

1. **Viewed is not resolved.** It changes only the viewer receipt.
2. **Claimed is not resolved.** It names accountability while the source remains open.
3. **Deferred is not resolved.** It changes only the next review time. The canonical source due time remains unchanged.
4. **Source-resolved is resolved.** It requires a newer source revision and a durable evidence path.

There is no generic Action Center “mark done” transition.

### Capability and scope projection

The projection filters before grouping or counting:

- organization must match;
- the viewer must hold the item's required capability;
- the branch must be inside the viewer's allowed branch set;
- a concrete branch context further narrows the result.

No hidden denied count is returned. A practitioner who cannot read finance sees four active items rather than a five-item total with one mysterious omission.

### Attention grouping

Authorized active work is deterministically grouped:

- `NEEDS_VERIFICATION`: required source state is unknown;
- `NOW`: critical or overdue source work;
- `TODAY`: active work due in the current operating window;
- `WAITING`: another person or external source transition is required;
- `LATER`: policy-permitted review time or future due work.

Grouping is an attention projection, not source state. Stable ranking uses group, urgency, canonical due time, and item ID only after authorization.

### Transition boundary

View, claim, defer, and source reconciliation commands require event ID, idempotency key, actor, timestamp, expected queue/item/source revisions, source capability, and transition capability where applicable.

- Exact replay is idempotent; changed input under the same key fails.
- Stale state, item, or source revisions fail.
- Critical and unknown work cannot be deferred.
- Deferral requires a reason and a policy-bounded future review time.
- Source resolution requires a strictly newer source revision and evidence path.
- Events append; accepted history is not overwritten.

## Interaction Fixture

The Riverside manager fixture contains five active, source-backed items:

1. Alma's unknown arrival;
2. Meadow's critical ratio cover;
3. two draft Meadow care reports;
4. Theo's parent reply;
5. Luca's overdue payment.

A resolved vaccination source is visible only in recent source-confirmed history. The practitioner fixture receives the same branch context without `finance.view`, so the payment is absent from rows, active count, unread count, ownership count, and recent history.

The interaction proof separates one complete sequence:

1. Reviewing Meadow's ratio decreases unread work but leaves five items active.
2. Claiming it names the manager while the ratio remains open.
3. Theo's reply can be scheduled for review at 13:00 with a reason; its 15:00 canonical due time and open source state remain unchanged.
4. Meadow leaves active work only after live operations accepts source revision 13 and returns a cover receipt path.

## Browser Evidence

Agent Browser replayed seven states at `1440 x 900`, `390 x 844`, and `320 x 568`, for 21 state/viewport combinations:

- initial manager projection;
- source viewed;
- source claimed;
- deferral reason ready;
- reply deferred;
- ratio source resolved;
- practitioner capability projection.

All combinations retain one H1, the expected `5 -> 5 -> 5 -> 5 -> 5 -> 4` active sequence for the manager, the `5 -> 4` unread change after viewing, source-event progression `0 -> 1 -> 2 -> 2 -> 3 -> 4`, zero horizontal overflow, zero unnamed controls, zero undersized visible targets, zero axe violations, and zero unresolved axe findings. Accepted transitions focus the changed decision heading. The practitioner projection shows three remaining active items after ratio resolution and exposes no payment row or hidden finance count.

Normal 390px visual review confirms the white-dominant queue, wrapped source paths, selected source panel, visible post-transition focus, and distinct `Canonical due 15:00` versus `Attention returns 13:00` facts. The first 320px run exposed four ellipsized source paths; narrow rows now wrap those paths, and the complete 320px sequence passes after remediation. Browser warning/error logs are empty.

Focused ESLint, full TypeScript, Action Center/handover/live-operations/search/navigation/route/state/selection/Calls/native-parent verifiers, diff checks, and the production build pass. The route verifier covers 335 app routes and 30 critical aliases, and `/design-lab/action-center` emits statically with only the repository's documented legacy dynamic-prerender messages, middleware deprecation, and print CSS warning.

## Additive Production Migration

1. Add canonical work item, source link, ownership, attention event, escalation policy, and resolution receipt storage without deleting or reinterpreting current alarms, notifications, messages, reports, medical forms, payments, staff events, or handovers.
2. Build versioned adapters for each source family. An adapter declares when a source creates work, how urgency/due policy is supplied, and which source transition proves resolution.
3. Treat current `Alarm.isActive = false` as dismissed legacy presentation unless a mapped source receipt proves completion.
4. Preserve current message and notification read receipts as delivery evidence; do not convert them to reply or follow-up completion.
5. Keep attention deferral separate from canonical due dates. Imported snooze behavior remains provenance-labeled until policy migration is accepted.
6. Enforce source read plus claim, assign, defer, escalate, reconcile, override, and correct capabilities at concrete organization/branch/room/record scope.
7. Reconcile source updates transactionally or through an idempotent outbox. The queue cannot close from a browser-only optimistic result.
8. Project one item into Today, room, child, staff, messages, finance, handover, parent-safe delivery, export, and audit surfaces without duplicating ownership.
9. Dual-read representative source fixtures and compare old alarm/list counts to source-linked projections before replacing any current center.
10. Retain compatibility routes and native payloads; add adapters only after parser and real-device acceptance.

## Parity Boundary

This slice adds only a deterministic contract, synthetic fixture, verifier, documentation, and isolated design-lab route. It changes no production query, alarm mutation, notification/message receipt, report status, payment status, ratio source, handover, Prisma model, database row, permission, route, export, legacy alias, native payload, or restored capability.

Production activation requires source-by-source parity mapping. Imported and dismissed alarms must remain distinguishable from canonical source resolution, and complete source records must remain reachable even when no active Action Center item exists.

## Open Gate

- Validate urgency, source ownership, assignment, deferral, escalation, and closure policy with managers, practitioners, finance, medical staff, and administrators.
- Define source adapters and resolution receipts for every launch family.
- Add schema, migrations, transactions/outbox, retention, corrections, and audit export.
- Integrate server authorization and representative multi-branch scale.
- Prove shared-device, offline/read-only, notification, parent/native, export, and inspection consequences.
- Run selected-system browser, 200% zoom, screen-reader, RTL, reduced-motion, real-device, and operator acceptance.

## Decision

Use this contract as the Wave 1 Today Action Center foundation. Attention may move; accountability may change; only the source can prove the work is handled.
