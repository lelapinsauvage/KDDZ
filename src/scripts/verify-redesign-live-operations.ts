import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  applyAttendanceCommand,
  projectAttendanceSession,
  projectBranchReadiness,
  projectRatioSnapshot,
  projectRoomOperation,
  submitAttendanceSession,
  type AttendanceCommand,
} from "../lib/redesign-live-operations"
import {
  assignFixtureCover,
  buildFixtureOperations,
  createFixtureAttendanceSession,
  createForecastFixtureStaff,
  createCurrentFixtureStaff,
  fixtureContext,
  fixturePolicy,
  recordFixtureAttendance,
} from "../lib/redesign-live-operations-fixtures"

const read = (path: string) => readFileSync(resolve(path), "utf8")

const initialSession = createFixtureAttendanceSession()
const initialAttendance = projectAttendanceSession(initialSession)
assert.equal(initialAttendance.counts.PRESENT, 3)
assert.equal(initialAttendance.counts.UNKNOWN, 1)
assert.equal(initialAttendance.isComplete, false)
assert.throws(() => submitAttendanceSession(initialSession, {
  submissionId: "submission-incomplete",
  idempotencyKey: "submit-incomplete-once",
  submittedAt: "2026-07-14T09:18:30+01:00",
  submittedById: "user-karim",
  expectedRevision: initialSession.revision,
}), /Unknown attendance must remain visible/)

const initialOperations = buildFixtureOperations(initialSession, createForecastFixtureStaff())
assert.equal(initialOperations.branch.status, "UNKNOWN")
assert.equal(initialOperations.room.current.status, "UNKNOWN")
assert.equal(initialOperations.room.current.presentChildren, 3)
assert.equal(initialOperations.room.current.unknownChildren, 1)
assert.deepEqual(initialOperations.workItems.map((item) => item.kind), ["ATTENDANCE_UNKNOWN"])

const presentSession = recordFixtureAttendance(initialSession, "PRESENT")
const presentOperations = buildFixtureOperations(presentSession, createForecastFixtureStaff())
assert.equal(projectAttendanceSession(presentSession).counts.PRESENT, 4)
assert.equal(presentOperations.room.current.status, "SAFE")
assert.equal(presentOperations.room.forecast?.status, "NEEDS_ATTENTION")
assert.equal(presentOperations.room.status, "SAFE_WITH_EXCEPTIONS")
assert.deepEqual(presentOperations.workItems.map((item) => item.kind), ["RATIO_FORECAST"])

const coveredStaff = assignFixtureCover(createForecastFixtureStaff())
const coveredOperations = buildFixtureOperations(presentSession, coveredStaff)
assert.equal(coveredOperations.room.forecast?.status, "SAFE")
assert.equal(coveredOperations.branch.status, "SAFE")
assert.equal(coveredOperations.workItems.length, 0)
assert(coveredOperations.room.forecast?.sourceEventIds.includes("cover-sam-meadow-1230"))

const presentEvent = presentSession.events.at(-1)
assert(presentEvent)
const duplicate = applyAttendanceCommand(presentSession, {
  ...presentEvent,
  expectedRevision: presentSession.revision,
})
assert.equal(duplicate.duplicate, true)
assert.equal(duplicate.session, presentSession)

assert.throws(() => applyAttendanceCommand(presentSession, {
  ...presentEvent,
  actorId: "different-actor",
  expectedRevision: presentSession.revision,
}), /Idempotency key was reused/)

assert.throws(() => recordFixtureAttendance(presentSession, "ABSENT"), /contradictory absence requires a correction/)

const submitted = submitAttendanceSession(presentSession, {
  submissionId: "submission-meadow-1",
  idempotencyKey: "submit-meadow-once",
  submittedAt: "2026-07-14T09:19:00+01:00",
  submittedById: "user-karim",
  expectedRevision: presentSession.revision,
})
assert.equal(submitted.status, "SUBMITTED")
assert.equal(submitted.submissions.length, 1)
assert.equal(submitAttendanceSession(submitted, {
  submissionId: "submission-meadow-1",
  idempotencyKey: "submit-meadow-once",
  submittedAt: "2026-07-14T09:19:00+01:00",
  submittedById: "user-karim",
  expectedRevision: presentSession.revision,
}), submitted)

const departed = applyAttendanceCommand(submitted, {
  eventId: "event-alma-departure",
  idempotencyKey: "depart-alma-once",
  expectedRevision: submitted.revision,
  childId: "child-alma",
  occurredAt: "2026-07-14T15:14:00+01:00",
  recordedAt: "2026-07-14T15:14:02+01:00",
  actorId: "user-lina",
  source: "STAFF_OBSERVATION",
  kind: "CHECK_OUT",
  roomId: "room-meadow",
}).session
assert.equal(departed.status, "OPEN")
assert.equal(departed.submissions.length, 1)
assert.equal(projectAttendanceSession(departed).children.find((child) => child.childId === "child-alma")?.state, "DEPARTED")
const resubmitted = submitAttendanceSession(departed, {
  submissionId: "submission-meadow-2",
  idempotencyKey: "submit-meadow-departure-once",
  submittedAt: "2026-07-14T15:14:05+01:00",
  submittedById: "user-lina",
  expectedRevision: departed.revision,
})
assert.equal(resubmitted.status, "SUBMITTED")
assert.equal(resubmitted.submissions.length, 2)

const correction: AttendanceCommand = {
  eventId: "event-alma-correction",
  idempotencyKey: "correct-alma-once",
  expectedRevision: submitted.revision,
  childId: "child-alma",
  occurredAt: "2026-07-14T09:20:00+01:00",
  recordedAt: "2026-07-14T09:20:04+01:00",
  actorId: "user-karim",
  source: "STAFF_OBSERVATION",
  kind: "CORRECT",
  correctsEventId: presentEvent.eventId,
  reason: "Arrival was attributed to the wrong child",
  replacement: { state: "ABSENT", roomId: null },
}
const corrected = applyAttendanceCommand(submitted, correction).session
assert.equal(corrected.status, "CORRECTED")
assert.equal(projectAttendanceSession(corrected).children.find((child) => child.childId === "child-alma")?.state, "ABSENT")
assert.deepEqual(corrected.events.map((event) => event.eventId).slice(-2), [presentEvent.eventId, correction.eventId])

const missingPolicy = projectRatioSnapshot({
  snapshotId: "missing-policy",
  context: fixtureContext,
  roomId: "room-meadow",
  roomName: "Meadow",
  attendance: presentSession,
  staff: createCurrentFixtureStaff(),
  policy: { ...fixturePolicy, status: "MISSING", policyPackId: null, ruleId: null, requiredAdults: null },
  sourceFreshness: "FRESH",
})
assert.equal(missingPolicy.status, "UNKNOWN")

const staleSources = projectRatioSnapshot({
  snapshotId: "stale-sources",
  context: fixtureContext,
  roomId: "room-meadow",
  roomName: "Meadow",
  attendance: presentSession,
  staff: createCurrentFixtureStaff(),
  policy: fixturePolicy,
  sourceFreshness: "STALE",
})
assert.equal(staleSources.status, "UNKNOWN")

const failedCondition = projectRatioSnapshot({
  snapshotId: "failed-condition",
  context: fixtureContext,
  roomId: "room-meadow",
  roomName: "Meadow",
  attendance: presentSession,
  staff: createCurrentFixtureStaff(),
  policy: {
    ...fixturePolicy,
    conditions: [{ id: "composition", label: "Required qualification composition failed", status: "FAIL" }],
  },
  sourceFreshness: "FRESH",
})
assert.equal(failedCondition.status, "NEEDS_ATTENTION")

const currentRisk = projectRatioSnapshot({
  snapshotId: "current-risk",
  context: fixtureContext,
  roomId: "room-meadow",
  roomName: "Meadow",
  attendance: presentSession,
  staff: createCurrentFixtureStaff().map((staff) => staff.staffId === "staff-lina"
    ? { ...staff, state: "ON_BREAK" as const, exclusionReason: "Unexpected break" }
    : staff),
  policy: fixturePolicy,
  sourceFreshness: "FRESH",
})
assert.equal(currentRisk.status, "NEEDS_ATTENTION")

const riskRoom = projectRoomOperation(currentRisk, null, null)
assert.equal(projectBranchReadiness([coveredOperations.room, riskRoom]).status, "NEEDS_ATTENTION")

assert.throws(() => assignFixtureCover(createCurrentFixtureStaff().map((staff) =>
  staff.staffId === "staff-sam" ? { ...staff, assignedRoomId: "room-seedlings" } : staff,
)), /already has a room assignment/)

const markerSource = read("src/components/today/attendance-marker.tsx")
const actionSource = read("src/lib/actions/attendance.ts")
const labSource = read("src/app/design-lab/operations/_components/live-operations-lab.tsx")
const labStyles = read("src/app/design-lab/operations/operations.css")
const labHarness = read("src/app/design-lab/operations/_components/operations-axe-harness.tsx")
const contractDocument = read("docs/redesign/live-operations-contract.md")
assert.match(markerSource, /Uncheck absent children, then confirm/)
assert.match(markerSource, /!absentIds\.has\(c\.id\)/)
assert.match(markerSource, /localStorage\.setItem\(`attendance-marked-/)
assert.match(actionSource, /absentChildIds: string\[\]/)
assert.match(actionSource, /db\.absenceReport\.create/)
assert.match(labSource, /useState<FixtureAttendanceChoice \| null>\(null\)/)
assert.match(labSource, /buildFixtureOperations\(attendance, forecastStaff\)/)
assert.match(labSource, /data-stage=\{stage\}/)
assert.match(labSource, /aria-live="polite"/)
assert.doesNotMatch(labSource, /localStorage|recharts|<svg/)
assert.match(labHarness, /auditNodeId="kiddz-operations-axe-audit"/)
assert.match(labStyles, /@media \(max-width: 700px\)/)
assert.match(labStyles, /min-height: 44px/)
assert.doesNotMatch(labStyles, /gradient\(/)
assert.match(contractDocument, /## Additive Production Migration/)
assert.match(contractDocument, /zero axe violations/)

process.stdout.write(
  "Redesign live operations verification passed (explicit attendance, idempotency, append-only correction, policy-owned ratio, forecast cover, source-gap guard)\n",
)
