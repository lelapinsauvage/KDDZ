# Kiddz Online Handover and Closure Contract

**Date:** 2026-07-11
**Status:** Executable territory-neutral behavior contract; production persistence and operator policy open
**Prototype:** `/design-lab/handover`
**Contract:** `src/lib/redesign-handover-contracts.ts`

## Question

Can a nursery team close a lunch or end-of-day handover without treating a draft, notification dismissal, browser flag, or unacknowledged assignment as completed work?

## Current Product Audit

The current product has useful source records but no canonical handover lifecycle:

- Today computes care completion from daily-report status and separately hides the attendance step with an origin-local browser flag.
- Daily reports distinguish `DRAFT` and `SUBMITTED`, but there is no room-level handover session that snapshots required source revisions.
- Attendance, care drafts, safety/medical review, messages, parent acknowledgment, ratios, and staffing are separate pages or alert families.
- Alerts and dashboard percentages do not own a resolution, incoming owner, acknowledgment, carry reason, or close receipt.
- Current records have no common preflight proving which obligations block closure and which policy permits to continue.
- There is no atomic stale-source guard across the evidence used to close a handover.

This slice does not infer that every nursery uses the same lunch or closing policy. It makes the missing behavior explicit for operator validation.

## Executable Contract

### Session and source boundary

A `HandoverSession` owns organization, concrete branch, room, operational local date, time zone, period, revision, obligations, accepted events, incoming acknowledgments, and closure receipt.

Every obligation declares:

- kind and canonical source path;
- `UNKNOWN`, `OPEN`, `RESOLVED`, or `CARRIED` state;
- `BLOCKS_CLOSE`, `CARRY_ALLOWED`, or `INFORMATION` consequence;
- source ID and source revision;
- current owner, incoming owner, and carry reason.

Unknown is not complete. Draft is not submitted. Carried is not resolved.

### Readiness projection

The projection is deterministic:

- `UNKNOWN`: a required source is unknown;
- `BLOCKED`: a close-blocking obligation remains open;
- `READY_WITH_CARRY`: blockers are resolved but an allowed obligation needs an incoming owner and reason;
- `AWAITING_ACKNOWLEDGMENT`: carry-forward is assigned but the incoming owner has not accepted it;
- `READY_TO_CLOSE`: blockers are resolved and every carried obligation is acknowledged;
- `CLOSED`: closure receipt was accepted from the named source revisions.

The closed handover may retain carried work. Its `openCount` remains visible because that work continues with the incoming owner rather than disappearing.

### Transition boundary

Resolve, carry, acknowledge, and close commands require:

- event ID and idempotency key;
- actor, timestamp, expected session revision, and required capability;
- exact source revision for resolve/carry;
- named incoming owner and non-empty reason for carry;
- every current source revision for close.

Exact replay is idempotent. Reusing a key with changed input fails. Source or session revision drift fails. Events append; accepted history is not overwritten.

Only `CARRY_ALLOWED` work can move forward. A blocking attendance or care obligation cannot be relabeled as carried to force closure.

## Interaction Fixture

The synthetic Riverside/Meadow lunch handover proves one complete causal sequence:

1. Alma's unknown attendance, two draft care reports, and one parent reply produce `UNKNOWN` with three open obligations.
2. Confirming Alma's observed arrival appends source revision 4 and leaves care as the remaining blocker.
3. Submitting two confirmed care reports appends source revision 5 and leaves one communication carry decision.
4. The manager selects incoming room lead Sam and records why the parent reply continues.
5. The session waits until Sam explicitly acknowledges the carried obligation.
6. The manager closes from all three current source revisions.
7. The closed receipt retains five accepted events and the acknowledged parent reply remains visibly carried, not falsely resolved.

Each accepted action focuses the changed decision heading and updates a polite status region. The source list, event history, and readiness summary change together.

## Browser Evidence

Agent Browser replayed seven states at `1440 x 900`, `390 x 844`, and `320 x 568`, for 21 state/viewport combinations:

- unknown;
- blocker remaining;
- carry form empty;
- carry form ready;
- awaiting acknowledgment;
- ready to close;
- closed.

All combinations retain the expected source counts and accepted-event progression, one H1, zero horizontal overflow, zero unnamed controls, zero undersized visible targets, zero axe violations, and zero unresolved axe findings. Focus moves to the changed decision heading after each accepted transition. Normal 390px captures confirm the overview, source obligations, append-only history, carry form, and sticky desktop action plane reflow into one readable mobile sequence.

Focused ESLint, full TypeScript, handover/live-operations/search/navigation/route/state/selection verifiers, diff checks, and the production build pass. The route verifier covers 334 app routes, and `/design-lab/handover` emits statically with only the repository's documented legacy dynamic-prerender messages, middleware deprecation, and print CSS warning.

## Additive Production Migration

1. Add handover policy, session, obligation snapshot, event, acknowledgment, carry, and closure persistence without removing current attendance, care, medical, message, alarm, or staff records.
2. Define effective lunch, room-change, shift, and closing periods per branch/provider policy; do not hard-code the fixture sequence globally.
3. Derive obligations from canonical attendance, care, safety, communication, staffing, and evidence sources with versioned source adapters.
4. Map current `DailyReport`, `AbsenceReport`, medical forms, call/message records, alarm state, staff events, and legacy aliases as provenance-labeled compatibility sources.
5. Enforce resolve, carry, acknowledge, close, override, and correction capabilities with concrete branch/room/record scope.
6. Close inside a transaction that locks or revalidates the session and every source revision; stale preflight returns the changed source.
7. Project closure and carried work back to Today, room, child, message, staff, parent-safe, export, and audit views without deleting source history.
8. Dual-read representative branch/day fixtures before any current completion percentage or alert is replaced.

## Parity Boundary

This slice adds only a territory-neutral contract and design-lab proof. It changes no production Today behavior, report mutation, attendance source, alert, message, Prisma model, database row, permission, route, export, legacy alias, native payload, or restored capability.

Production activation requires parity mapping for every affected attendance, report, medical, message, staff, alarm, parent, export, and native flow. Imported history must remain distinguishable from canonical observed evidence.

## Open Gate

- Validate opening, room-to-room, lunch, shift-change, departure, and closing sequences with real managers and practitioners.
- Decide which obligations block, permit authorized carry, require dual approval, or require parent acknowledgment in each launch jurisdiction/provider class.
- Add persistent schema, migrations, transaction boundaries, operation receipts, retention, and correction rules.
- Integrate server authorization and concrete room/record assignment.
- Prove notification, parent delivery, offline/shared-device, native, export, and inspection consequences.
- Run representative-scale, 200% zoom, screen-reader, RTL, reduced-motion, shared-tablet, and physical-device acceptance in the selected visual system.

## Decision

Use this contract as the Today/action-center handover foundation. Closure is a versioned server transition with acknowledged carry-forward, not a percentage, dismissed alert, or celebratory message.
