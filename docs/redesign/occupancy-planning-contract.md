# Occupancy And Future Places Contract

**Status:** Territory-neutral executable Wave 5 foundation
**Scope:** Room capacity, booked utilization, live occupancy, future availability, place requests, holds, blocks, funding-hour separation, and downstream projections
**Production impact:** None. The contract and lab use synthetic records; existing classes, children, attendance, finance, routes, permissions, exports, database models, and native contracts are unchanged.

## Decision

Kiddz Online must never relabel a class roster count as live occupancy, booked utilization, or future availability. Those questions have different source objects and consequences:

- **Current roster:** active children assigned to a class, without day/session expectation.
- **Booked utilization:** confirmed bookings for a named room and session against effective capacity.
- **Live occupancy:** explicit observed attendance for that room and session.
- **Future sellable places:** effective capacity minus confirmed bookings and unexpired holds.
- **Funding and billing:** booked, attended, claimed, and invoiced minutes, each with its own source.

## Current Product Audit

The current schema stores `Class.maxStudents` and duplicate `Class.capacity`, one current `Child.classId`, one `Child.enrollmentDate`, active/draft state, and static branch-compliance totals. The class importer maps legacy `t_class.max_students` to both capacity fields and deliberately ignores `current_students` as computed UI data. Class and branch list `_count.children` values do not provide schedule semantics; dashboard demographics group active non-draft children by current class. There is no booking/session schedule, place request, waitlist, expiring hold, effective-dated capacity policy, auditable capacity block, or funded-hours ledger.

These fields remain valid roster and configuration evidence. They cannot prove that a child is expected in a particular session, present now, consuming a future place, funded, or invoiced.

## Accountable Object

`OccupancyPlan` owns:

- branch, planning date, and named session window;
- physical, policy, and staffing capacities with exact source revisions;
- confirmed and cancelled booking history;
- time-bounded capacity blocks with source, reason, owner, and release history;
- place requests and expiring holds;
- distinct booked, attended, funded-claim, and invoiced minutes;
- optional live attendance observations with source and time;
- attendance-expectation and billing-input projections created only after booking confirmation;
- append-only actor, time, idempotency, and resulting-revision events.

## Capacity Equation

For each room/session:

1. `base capacity = min(physical capacity, policy capacity, staffing capacity)`.
2. `effective capacity = max(0, base capacity - active named blocks)`.
3. `sellable places = max(0, effective capacity - confirmed bookings - unexpired holds)`.
4. `conflict places = max(0, confirmed bookings - effective capacity)`.

The UI may display zero sellable places, but it must also expose conflict places. Clamping a negative result to zero cannot hide an overbooking.

The policy and staffing capacities are supplied decisions, not hard-coded legal calculations. Production activation requires approved first-market policy and qualified-staffing sources.

## State Machine

`SOURCE_GAP -> CAPACITY_CONFLICT -> BLOCK_REVIEW -> AVAILABLE -> REQUEST_REVIEW -> HOLD_ACTIVE -> BOOKING_CONFIRMED`

An unconsumed hold can move to `HOLD_EXPIRED` without creating a booking. Any tracked capacity source change moves the plan to `SOURCE_CHANGED`; holding or confirming is rejected until a fresh non-regressing source snapshot is accepted.

## Invariants

1. All three capacity inputs and source revisions are required before availability can be asserted.
2. Live occupancy is `UNKNOWN` without an explicit room/session attendance source, even when roster and booking data exist.
3. A confirmed booking, active hold, and request are separate records and cannot be inferred from one another.
4. A hold consumes availability only until expiry or confirmation.
5. Booking confirmation requires the current request, active hold, room-source revisions, and plan revision.
6. Confirmation atomically consumes the hold, confirms the request, appends the booking, and creates downstream attendance and billing input identities.
7. Overbooking is explicit and blocks new place work.
8. Booking cancellation and block release append reasons and source revisions; history is not deleted.
9. Capacity blocks require positive places, source kind, reason, owner, start, expiry, and release evidence.
10. Booked, attended, funded-claim, and invoiced minutes never substitute for one another.
11. Exact idempotent replay is accepted; changed input with a reused key is rejected.
12. Missing capabilities and stale revisions fail closed.
13. Non-admissions roles do not receive family/child request identity; roles without funding access do not receive hour values.
14. A current class count is classified only as `CURRENT_ROSTER_ONLY`.

## Capability Boundary

- `occupancy.view`: inspect a scoped plan and source freshness.
- `occupancy.configure`: accept capacity sources and refresh a stale projection.
- `occupancy.manage_requests`: create and identify place requests.
- `occupancy.manage_bookings`: hold, renew, confirm, or cancel bookings.
- `occupancy.manage_blocks`: release or create reasoned capacity blocks.
- `occupancy.view_funding`: inspect separated hour ledgers.
- `occupancy.audit`: inspect history, expire holds, and record source drift.

Navigation visibility never grants these capabilities. Production actions must repeat organization, branch, room, child/family relationship, source revision, and transition checks.

## Additive Production Migration

1. Confirm first-market session, booking, cancellation, notice, capacity, staffing, funding, and billing policy with accountable owners.
2. Add effective-dated room-capacity, session, booking, request, hold, capacity-block, and hour-ledger persistence.
3. Preserve current `Class.maxStudents/capacity`, class assignment, enrollment date, imported provenance, and compliance totals as source fields; do not overwrite them with projections.
4. Backfill no historical bookings from roster membership unless authoritative schedules exist. Mark unknown periods unknown.
5. Add read-only compatibility adapters from confirmed bookings to expected attendance and billing inputs, then dual-read before cutover.
6. Require transactions for hold/confirm/cancel and source revision checks.
7. Add typed capability enforcement, privacy-safe projections, retention, audit export, and representative-scale indexes.
8. Validate wording, capacity decisions, hold expiry, funding separation, staff exceptions, and admissions workflow with managers, administrators, policy owners, finance staff, and practitioners.
9. Preserve all class, child, branch, attendance, accounting, export, legacy PHP, parent, and native behavior until parity evidence passes.

## Verification Evidence

The deterministic verifier covers source gaps, exact capacity arithmetic, explicit overbooking, roster classification, unknown live state, block release, request/hold/expiry/renewal/confirmation, downstream projection, stale source rejection and refresh, idempotency, capability denial, privacy-safe projections, and hour-ledger separation. `/design-lab/occupancy` exposes the same lifecycle for desktop, tablet, mobile, role, focus, reduced-motion, overflow, and axe verification.
