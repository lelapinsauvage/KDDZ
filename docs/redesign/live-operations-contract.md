# Kiddz Online Live Operations Contract

**Date:** 2026-07-11
**Status:** Executable territory-neutral behavior contract; production persistence and policy activation open
**Prototype:** `/design-lab/operations`
**Contract:** `src/lib/redesign-live-operations.ts`

## Question

Can one accepted attendance observation update current room state, ratio evidence, forecast work, and append-only history without treating absence, a daily report, or a browser flag as proof of presence?

## Current Source Boundary

The current product cannot answer that question safely:

- `AttendanceMarker` begins with every child visually present and asks the user to uncheck absences.
- `markBulkAttendance` persists only selected `AbsenceReport` rows; it does not persist observed presence for the other children.
- Today hides the attendance step using `localStorage`, so workflow visibility can diverge by browser while the server has no complete attendance session.
- Daily-report submission is also used as historical evidence of presence, even though care completion and attendance are different facts.
- Staff presence comes from imported/manual `TeacherAttendance` rows and absence events without a canonical room assignment or correction timeline.
- No active production model owns effective ratio policy, qualification eligibility, time-bounded cover, or explainable ratio snapshots.

The authenticated `/today` browser reproduction could not proceed because the demo credentials printed on `/login` are stale. This limitation is explicit. The current mutation and client behavior above are source-confirmed; no runtime completion claim is inferred from the failed login.

## Executable Contract

### Operational context

Every source fact carries organization, concrete branch, operational local date, time zone, mode, and as-of time. All-branch oversight is not a write context. Historical and planning projections cannot be mistaken for live state.

### Expected roster and unknown

An `AttendanceSession` owns one expected-roster revision. Every expected child projects to `UNKNOWN` until an accepted event establishes one of:

- `PRESENT`;
- `ABSENT`;
- `LATE_EXPECTED`;
- `NOT_EXPECTED`;
- `DEPARTED`.

There is no default-present transition. An open session cannot be submitted while any expected child remains unknown.

### Accepted events

The contract supports:

| Command | Valid source state | Required result |
| --- | --- | --- |
| Mark present | Unknown, late expected, or departed | Current room and accepted arrival source |
| Mark absent | Unknown or late expected | Explicit absence without inventing presence |
| Mark late expected | Unknown | Expected time remains distinct from observed arrival |
| Mark not expected | Unknown | Child leaves the current expected denominator with reason/source |
| Check out | Present in the named room | Departed state and last room preserved |
| Move room | Present in the exact source room | New current room with source transition retained |
| Correct | Accepted event on the same child | Original event, reason, replacement, actor, and new revision retained |

Each command requires an expected revision and idempotency key. Replaying the same key and payload returns the accepted event; reusing the key with different input fails. A contradictory absence after a present event requires correction rather than silent replacement.

Submission receipts are append-only. A later legitimate transition such as departure reopens the session for a new server submission while retaining earlier receipts and source revisions; it never leaves a stale submitted flag attached to newer unsubmitted events.

### Ratio decision boundary

The live-operations projector does not calculate law from a UI constant. It consumes a server-owned `RatioPolicyDecision` containing:

- approved/missing/stale/unresolved status;
- policy-pack and rule identifiers;
- required counted-adult result;
- named pass/fail/unknown policy conditions.

The policy subsystem remains responsible for jurisdiction, provider/service class, age band, mixed-age rules, qualification composition, premises rules, and effective dates. The prototype uses a visibly synthetic approved fixture only.

The ratio snapshot counts only children with accepted `PRESENT` events in the room and staff who are present, working directly, assigned to that room, and already adjudicated as countable. Every excluded or unknown adult remains explainable.

Missing policy, stale sources, unknown child attendance, unknown staff presence, or unknown eligibility produces `UNKNOWN`, never `SAFE`.

### Current and forecast work

The room projection distinguishes:

- `UNKNOWN`: a current source fact prevents confirmation;
- `NEEDS_ATTENTION`: the accepted current sources fail the supplied decision;
- `SAFE_WITH_EXCEPTIONS`: current state is safe but a named forecast needs work;
- `SAFE`: current and next supplied projections are confirmed.

Owned work is derived from the source condition. A current unknown suppresses derivative forecast tasks until the current cause is resolved, preventing duplicate work for the same missing fact.

### Time-bounded cover

Cover has a start, end, actor, assignment ID, explicit source room, target room, and source revision. A candidate must be present, directly working, and already eligible. The candidate's declared source room must match the current assignment so a stale or ambiguous move fails before projection.

The executable preview now recalculates every affected source and target room before acceptance. It returns:

- `ACCEPTABLE` only when every affected room remains safe;
- `BLOCKED` when the move would leave any affected room needing attention;
- `UNKNOWN` when missing policy or source facts prevent a safe decision.

Acceptance consumes the preview and fails unless its status is `ACCEPTABLE`. Production must preserve the same invariant inside one transaction with fresh attendance, staffing, policy, qualification, and assignment revisions.

## Interaction Fixture

The synthetic Meadow and Seedlings fixture tests one complete causal chain:

1. Meadow has three accepted arrivals and one unknown child; Seedlings has five accepted arrivals and confirmed staffing. Branch readiness is `Unknown` with one attendance work item.
2. No attendance choice is preselected.
3. Recording Alma as present appends revision 9, changes Meadow from three to four present children, and changes branch state to `Safe with exceptions`.
4. Lina's 12:30 break produces one forecast cover item with zero counted adults against the supplied requirement of one.
5. Noor appears as present and eligible but is currently one of Seedlings' two required counted adults. Her preview makes Meadow safe while reducing Seedlings to one of two, so the assignment is blocked before commit.
6. Sam appears as present, eligible, directly working, floating, and conflict-free. His preview keeps every affected room safe.
7. Assigning Sam from 12:30 to 13:00 appends assignment provenance, makes the forecast safe, and reduces open work to zero without changing Seedlings.

The UI uses source-state changes and a polite live region. A toast, animation, or local browser flag is never the only proof.

## Browser Evidence

Agent Browser replayed the full attendance -> forecast cover -> handled flow at:

- `1440 x 900` with the desktop compact-control floor;
- `390 x 844` with a 44px target floor;
- `320 x 568` with a 44px target floor.

All nine original stage/viewport combinations produced the same `Unknown -> Safe with exceptions -> Safe` progression, one H1, zero page overflow, zero unnamed controls, zero clipped critical text, zero undersized visible targets, zero axe violations, and zero unresolved axe findings.

The expanded multi-room flow adds five states: attendance unknown, cover unselected, Noor blocked, Sam acceptable, and resolved. Agent Browser completed all five at `1440 x 900`, `390 x 844`, and `320 x 568`, for 15 expanded state/viewport combinations. The blocked preview showed Seedlings at `1 of 2 counted`, kept the primary action disabled, and retained one open work item; the acceptable preview enabled Sam's assignment; the resolved state showed both rooms safe and zero open work.

Every expanded state retained one H1, the expected `1 -> 1 -> 1 -> 1 -> 0` open-work sequence, zero page overflow, zero unnamed controls, zero clipped critical text, zero undersized visible targets, zero axe violations, and zero unresolved axe findings. Normal viewport captures at `390 x 844` confirmed the operations overview and blocked consequence panel remain readable and correctly reflowed.

Browser interaction also confirmed that each accepted action moves focus to the changed work heading and announces the server-style consequence. A natural-size desktop visual pass confirmed the room comparison, source fact, decision panel, and owned work remain readable together. The first visual pass exposed and removed a duplicate derivative forecast task.

Focused ESLint, full TypeScript, the live-operations verifier, 333-route compatibility, navigation/state/selection regressions, diff hygiene, and the production build pass for this slice. The build emits `/design-lab/operations` as a static route and retains only the documented legacy dynamic-prerender messages and print CSS warning.

## Additive Production Migration

1. Add canonical attendance session/event, staff presence, time-bounded room assignment, qualification decision, policy decision, ratio snapshot, operation receipt, and audit-event persistence without removing current tables.
2. Import historical `DailyReport`, `AbsenceReport`, `TeacherAttendance`, `EmployeeEvent`, and class membership as provenance-labeled compatibility evidence. Do not relabel missing historical presence as observed.
3. Add server-owned capability and transition checks for session read, observe, submit, correct, room move, cover search, cover assignment, override, and closure.
4. Dual-read old and new projections over representative branch/date fixtures; publish contradictions and unknowns rather than forcing equality.
5. Move new attendance writes to canonical events while deriving current absence lists, child attendance history, heatmaps, daily-care eligibility, parent-safe state, exports, legacy aliases, and native outputs through adapters.
6. Add effective policy and qualification adjudication only after launch-market, provider/service-class, legal, and operator approval.
7. Activate ratio snapshots and cover mutation only after database transactions, optimistic concurrency, idempotency receipts, atomic source-and-target recalculation, and audit-history tests pass.
8. Remove the browser completion flag only after every supported route and client consumes server session state.

## Parity Boundary

This slice changes no production route, query, action, Prisma model, database row, permission, export, legacy alias, native payload, or product visual. Existing absence forms, drafts, attachments, daily reports, attendance histories, heatmaps, staff attendance imports/logs, class membership, payroll outputs, and parent/native contracts remain intact.

Future activation must map every affected parity row and prove both canonical and compatibility projections before any old representation stops receiving supported traffic.

## Open Gate

- Select the launch jurisdiction and approve the exact provider/service classes and ratio policy packs.
- Validate attendance, correction, check-out, room-move, break, substitute, and emergency sequences with nursery operators.
- Add persistent schema, migrations, transaction boundaries, operation receipts, and representative-scale fixtures.
- Integrate server-owned role, branch, room-assignment, record-relation, and transition authorization.
- Define parent notification and acknowledgment rules for attendance corrections.
- Define protected offline capture, device identity, retention, and conflict ownership.
- Prove legacy/native adapters, parent-safe delivery, reports/exports, and historical provenance.
- Run actual 200% zoom, VoiceOver/NVDA, reduced-motion, shared-tablet, and physical-device acceptance.

## Decision

Use this contract as the required behavior foundation for the selected-direction Today, attendance, live-room, and ratio pilot. It earns internal core-UX progress because the causal flow is executable and browser-tested. It does not earn production persistence, legal compliance, authorization, final visual-system, or rollout completion.
