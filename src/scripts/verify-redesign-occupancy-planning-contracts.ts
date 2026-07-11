import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  cancelConflictingBooking,
  classifyCurrentClassCount,
  confirmOccupancySources,
  confirmPlaceBooking,
  createOccupancyPlanFixture,
  createOccupancyScenario,
  createPlaceRequest,
  holdRequestedPlace,
  markOccupancySourceChanged,
  occupancyPlanStatus,
  projectOccupancyPlan,
  projectRoomOccupancy,
  refreshOccupancyPlan,
  renewExpiredPlaceHold,
  type OccupancyCapability,
  type OccupancyCommand,
  type OccupancyPlan,
} from "../lib/redesign-occupancy-planning-contracts"

const allCapabilities: OccupancyCapability[] = [
  "occupancy.view",
  "occupancy.configure",
  "occupancy.manage_requests",
  "occupancy.manage_bookings",
  "occupancy.manage_blocks",
  "occupancy.view_funding",
  "occupancy.audit",
]

function command(plan: OccupancyPlan, id: string, capabilities = allCapabilities): OccupancyCommand {
  return {
    eventId: `${id}-${plan.revision}`,
    idempotencyKey: `${id}-${plan.revision}-once`,
    actorId: "verifier-manager",
    occurredAt: "2026-08-01T08:05:00+01:00",
    expectedRevision: plan.revision,
    actorCapabilities: capabilities,
  }
}

assert.equal(occupancyPlanStatus(createOccupancyScenario("source-gap")), "SOURCE_GAP")
assert.equal(occupancyPlanStatus(createOccupancyScenario("capacity-conflict")), "CAPACITY_CONFLICT")
assert.equal(occupancyPlanStatus(createOccupancyScenario("block-review")), "BLOCK_REVIEW")
assert.equal(occupancyPlanStatus(createOccupancyScenario("available")), "AVAILABLE")
assert.equal(occupancyPlanStatus(createOccupancyScenario("request-review")), "REQUEST_REVIEW")
assert.equal(occupancyPlanStatus(createOccupancyScenario("hold-active")), "HOLD_ACTIVE")
assert.equal(occupancyPlanStatus(createOccupancyScenario("hold-expired")), "HOLD_EXPIRED")
assert.equal(occupancyPlanStatus(createOccupancyScenario("booking-confirmed")), "BOOKING_CONFIRMED")
assert.equal(occupancyPlanStatus(createOccupancyScenario("source-changed")), "SOURCE_CHANGED")

const sourceGap = createOccupancyScenario("source-gap")
const sourceGapMeadow = projectRoomOccupancy(sourceGap, "room-meadow")
const sourceGapSunroom = projectRoomOccupancy(sourceGap, "room-sunroom")
assert.equal(sourceGapMeadow.configured, false)
assert.equal(sourceGapMeadow.effectiveCapacity, undefined)
assert.equal(sourceGapMeadow.sellablePlaces, undefined)
assert.equal(sourceGapMeadow.liveState, "UNKNOWN")
assert.equal(sourceGapSunroom.liveState, "OBSERVED")
assert.equal(sourceGapSunroom.livePresent, 7)

const conflict = projectRoomOccupancy(createOccupancyScenario("capacity-conflict"), "room-meadow")
assert.equal(conflict.physicalCapacity, 14)
assert.equal(conflict.policyCapacity, 10)
assert.equal(conflict.staffingCapacity, 10)
assert.equal(conflict.blockedPlaces, 1)
assert.equal(conflict.effectiveCapacity, 9)
assert.equal(conflict.confirmedBookings, 10)
assert.equal(conflict.conflictPlaces, 1)
assert.equal(conflict.sellablePlaces, 0)

const availablePlan = createOccupancyScenario("available")
const available = projectRoomOccupancy(availablePlan, "room-meadow")
assert.equal(available.effectiveCapacity, 10)
assert.equal(available.confirmedBookings, 9)
assert.equal(available.activeHolds, 0)
assert.equal(available.sellablePlaces, 1)

const requested = createOccupancyScenario("request-review")
assert.equal(projectRoomOccupancy(requested, "room-meadow").sellablePlaces, 1)
const held = createOccupancyScenario("hold-active")
assert.equal(projectRoomOccupancy(held, "room-meadow").activeHolds, 1)
assert.equal(projectRoomOccupancy(held, "room-meadow").sellablePlaces, 0)
const expired = createOccupancyScenario("hold-expired")
assert.equal(projectRoomOccupancy(expired, "room-meadow").activeHolds, 0)
assert.equal(projectRoomOccupancy(expired, "room-meadow").sellablePlaces, 1)

const confirmed = createOccupancyScenario("booking-confirmed")
assert.equal(projectRoomOccupancy(confirmed, "room-meadow").confirmedBookings, 10)
assert.equal(confirmed.holds.at(-1)?.status, "CONSUMED")
assert.equal(confirmed.requests.at(-1)?.status, "CONFIRMED")
assert.equal(confirmed.downstreamProjections.length, 1)
assert.equal(confirmed.downstreamProjections[0].expectedAttendanceId, "expected-attendance-haddad")
assert.equal(confirmed.downstreamProjections[0].billingInputId, "billing-input-haddad")

assert.deepEqual(classifyCurrentClassCount(), {
  classification: "CURRENT_ROSTER_ONLY",
  canProveLiveOccupancy: false,
  canProveBookedUtilization: false,
  canProveFutureAvailability: false,
  canProveFundedHours: false,
})

const fundingProjection = projectOccupancyPlan(confirmed, allCapabilities)
assert.deepEqual(
  fundingProjection.hourLedgers.map((item) =>
    "access" in item
      ? null
      : [item.bookedMinutes, item.attendedMinutes, item.fundedClaimMinutes, item.invoicedMinutes],
  ),
  [[1200, 900, 600, 600]],
)

const practitioner = projectOccupancyPlan(confirmed, ["occupancy.view"])
assert.equal(practitioner.requests[0].familyDisplayName, "Restricted family")
assert.equal(practitioner.requests[0].childDisplayName, "Restricted child")
assert.equal("access" in practitioner.hourLedgers[0] && practitioner.hourLedgers[0].access, "RESTRICTED")
assert.throws(() => projectOccupancyPlan(confirmed, []), /Missing capability: occupancy.view/)

let idempotentPlan = createOccupancyPlanFixture()
const sourceCommand = {
  ...command(idempotentPlan, "confirm-sources"),
  roomId: "room-meadow",
  physicalCapacity: 14,
  policyCapacity: 10,
  staffingCapacity: 10,
  sourceSnapshot: [
    { sourceId: "class-meadow-capacity", revision: 4 },
    { sourceId: "policy-meadow", revision: 6 },
    { sourceId: "staff-plan-meadow", revision: 9 },
  ],
}
idempotentPlan = confirmOccupancySources(idempotentPlan, sourceCommand)
assert.equal(confirmOccupancySources(idempotentPlan, sourceCommand), idempotentPlan)
assert.throws(
  () => confirmOccupancySources(idempotentPlan, { ...sourceCommand, staffingCapacity: 9 }),
  /Idempotency key reused with different input/,
)
assert.throws(
  () => confirmOccupancySources(createOccupancyPlanFixture(), {
    ...command(createOccupancyPlanFixture(), "unauthorized", ["occupancy.view"]),
    roomId: "room-meadow",
    physicalCapacity: 14,
    policyCapacity: 10,
    staffingCapacity: 10,
    sourceSnapshot: sourceCommand.sourceSnapshot,
  }),
  /Missing capability: occupancy.configure/,
)

const conflictPlan = createOccupancyScenario("capacity-conflict")
assert.throws(
  () => cancelConflictingBooking(conflictPlan, {
    ...command(conflictPlan, "stale-cancel"),
    bookingId: "booking-meadow-10",
    expectedSourceRevision: 0,
    reason: "Verified duplicate",
  }),
  /Booking source revision changed/,
)
assert.throws(
  () => createPlaceRequest(createOccupancyScenario("capacity-conflict"), {
    ...command(createOccupancyScenario("capacity-conflict"), "blocked-request"),
    requestId: "request-blocked",
    familyDisplayName: "Blocked family",
    childDisplayName: "Blocked child",
    roomId: "room-meadow",
    requestedStartDate: "2026-08-15",
  }),
  /current available plan/,
)

const requestPlan = createOccupancyScenario("request-review")
const request = requestPlan.requests[0]
assert.throws(
  () => holdRequestedPlace(requestPlan, {
    ...command(requestPlan, "stale-hold"),
    requestId: request.id,
    expectedRequestRevision: request.sourceRevision,
    expectedRoomSources: [{ sourceId: "stale", revision: 1 }],
    holdId: "hold-stale",
    expiresAt: "2026-08-01T12:00:00+01:00",
  }),
  /Room capacity sources changed/,
)

const expiredRequest = expired.requests.at(-1)!
const expiredHold = expired.holds.at(-1)!
const renewed = renewExpiredPlaceHold(expired, {
  ...command(expired, "renew"),
  requestId: expiredRequest.id,
  expiredHoldId: expiredHold.id,
  expectedHoldRevision: expiredHold.sourceRevision,
  holdId: "hold-renewed",
  expiresAt: "2026-08-01T16:00:00+01:00",
  expectedRoomSources: projectRoomOccupancy(expired, "room-meadow", "2026-08-01T12:05:00+01:00").sources,
})
assert.equal(occupancyPlanStatus(renewed), "HOLD_ACTIVE")
assert.equal(renewed.holds.at(-2)?.status, "EXPIRED")
assert.equal(renewed.holds.at(-1)?.status, "ACTIVE")
assert.equal(
  renewExpiredPlaceHold(renewed, {
    ...command(expired, "renew"),
    requestId: expiredRequest.id,
    expiredHoldId: expiredHold.id,
    expectedHoldRevision: expiredHold.sourceRevision,
    holdId: "hold-renewed",
    expiresAt: "2026-08-01T16:00:00+01:00",
    expectedRoomSources: projectRoomOccupancy(expired, "room-meadow", "2026-08-01T12:05:00+01:00").sources,
  }),
  renewed,
)

assert.throws(
  () => confirmPlaceBooking(expired, {
    ...command(expired, "confirm-expired"),
    requestId: expiredRequest.id,
    expectedRequestRevision: expiredRequest.sourceRevision,
    holdId: expiredHold.id,
    expectedHoldRevision: expiredHold.sourceRevision,
    expectedRoomSources: projectRoomOccupancy(expired, "room-meadow").sources,
    bookingId: "booking-expired",
    childId: "child-expired",
    expectedAttendanceId: "attendance-expired",
    billingInputId: "billing-expired",
  }),
  /active unexpired place hold/,
)

const heldForDrift = createOccupancyScenario("hold-active")
const drifted = markOccupancySourceChanged(heldForDrift, {
  ...command(heldForDrift, "drift"),
  sourceId: "staff-plan-meadow",
  nextRevision: 10,
})
assert.equal(occupancyPlanStatus(drifted), "SOURCE_CHANGED")
assert.throws(
  () => confirmPlaceBooking(drifted, {
    ...command(drifted, "confirm-stale"),
    requestId: drifted.requests[0].id,
    expectedRequestRevision: drifted.requests[0].sourceRevision,
    holdId: drifted.holds[0].id,
    expectedHoldRevision: drifted.holds[0].sourceRevision,
    expectedRoomSources: projectRoomOccupancy(drifted, "room-meadow").sources,
    bookingId: "booking-stale",
    childId: "child-stale",
    expectedAttendanceId: "attendance-stale",
    billingInputId: "billing-stale",
  }),
  /refresh before confirming/,
)
const refreshed = refreshOccupancyPlan(drifted, {
  ...command(drifted, "refresh"),
  sourceSnapshot: [
    { sourceId: "class-meadow-capacity", revision: 4 },
    { sourceId: "policy-meadow", revision: 6 },
    { sourceId: "staff-plan-meadow", revision: 10 },
    { sourceId: "class-sunroom-capacity", revision: 2 },
    { sourceId: "policy-sunroom", revision: 3 },
    { sourceId: "staff-plan-sunroom", revision: 5 },
  ],
})
assert.equal(occupancyPlanStatus(refreshed), "HOLD_ACTIVE")
assert.equal(projectRoomOccupancy(refreshed, "room-meadow").sources.at(-1)?.revision, 10)
assert.equal(refreshed.sourceSnapshot.length, 6)

const schema = readFileSync(resolve("prisma/schema.prisma"), "utf8")
const classMigration = readFileSync(resolve("src/scripts/migration/migrate-classes.ts"), "utf8")
const dashboardActions = readFileSync(resolve("src/lib/actions/dashboard.ts"), "utf8")
const classActions = readFileSync(resolve("src/lib/actions/classes.ts"), "utf8")
const contractDocument = readFileSync(resolve("docs/redesign/occupancy-planning-contract.md"), "utf8")
assert.match(schema, /maxStudents\s+Int\s+@default\(0\)/)
assert.match(schema, /capacity\s+Int\s+@default\(0\)/)
assert.doesNotMatch(schema, /model (PlaceBooking|BookingHold|OccupancyPlan)/)
assert.match(classMigration, /t_class\.max_students\s+→ Class\.maxStudents\/Class\.capacity/)
assert.match(classMigration, /current_students/)
assert.match(classMigration, /Not migrated \(computed\/UI-only\)/)
assert.match(dashboardActions, /by: \["classId"\][\s\S]*isActive: true, isDraft: false/)
assert.match(classActions, /_count: \{ select: \{ children: true \} \}/)
assert.match(contractDocument, /CURRENT_ROSTER_ONLY/)
assert.match(contractDocument, /## Additive Production Migration/)

const labSource = readFileSync(resolve("src/app/design-lab/occupancy/_components/occupancy-lab.tsx"), "utf8")
const labStyles = readFileSync(resolve("src/app/design-lab/occupancy/occupancy.css"), "utf8")
const harnessSource = readFileSync(resolve("src/app/design-lab/occupancy/_components/occupancy-axe-harness.tsx"), "utf8")
assert.match(labSource, /projectOccupancyPlan/)
assert.match(labSource, /aria-live="polite"/)
assert.doesNotMatch(labSource, /localStorage|sessionStorage|recharts|<svg/)
assert.match(labStyles, /@media \(max-width: 480px\)/)
assert.match(labStyles, /min-height: 48px/)
assert.doesNotMatch(labStyles, /gradient\(/)
assert.match(harnessSource, /auditNodeId="kiddz-occupancy-axe-audit"/)

process.stdout.write(
  "Redesign occupancy planning verification passed (roster distinction, source capacity, conflict, block, request, hold, expiry, booking, hour separation, privacy, stale refresh)\n",
)
