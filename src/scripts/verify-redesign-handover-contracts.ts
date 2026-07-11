import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  acknowledgeHandover,
  carryHandoverObligation,
  closeHandover,
  createHandoverFixture,
  projectHandover,
  resolveHandoverObligation,
} from "../lib/redesign-handover-contracts"

const capabilities = ["handover.resolve", "handover.carry", "handover.acknowledge", "handover.close"]
const initial = createHandoverFixture()
assert.equal(projectHandover(initial).status, "UNKNOWN")
assert.equal(projectHandover(initial).openCount, 3)
assert.throws(() => closeHandover(initial, {
  eventId: "close-too-soon",
  idempotencyKey: "close-too-soon",
  actorId: "user-manager",
  occurredAt: "2026-07-14T12:04:00+01:00",
  expectedRevision: 0,
  actorCapabilities: capabilities,
  expectedSourceRevisions: {},
}), /not ready/)

const resolveAttendanceCommand = {
  eventId: "resolve-attendance",
  idempotencyKey: "resolve-attendance-once",
  actorId: "staff-lina",
  occurredAt: "2026-07-14T12:05:00+01:00",
  expectedRevision: 0,
  actorCapabilities: capabilities,
  obligationId: "attendance-alma",
  expectedSourceRevision: 3,
  acceptedSourceRevision: 4,
} as const
const attendanceResolved = resolveHandoverObligation(initial, resolveAttendanceCommand)
assert.equal(projectHandover(attendanceResolved).status, "BLOCKED")
assert.equal(projectHandover(attendanceResolved).openCount, 2)
assert.equal(resolveHandoverObligation(attendanceResolved, resolveAttendanceCommand), attendanceResolved)
assert.throws(() => resolveHandoverObligation(attendanceResolved, {
  ...resolveAttendanceCommand,
  eventId: "resolve-attendance-changed",
}), /reused with different input/)

const careResolved = resolveHandoverObligation(attendanceResolved, {
  eventId: "resolve-care",
  idempotencyKey: "resolve-care-once",
  actorId: "staff-lina",
  occurredAt: "2026-07-14T12:07:00+01:00",
  expectedRevision: 1,
  actorCapabilities: capabilities,
  obligationId: "care-meadow",
  expectedSourceRevision: 4,
  acceptedSourceRevision: 5,
})
assert.equal(projectHandover(careResolved).status, "READY_WITH_CARRY")
assert.equal(projectHandover(careResolved).openCount, 1)
assert.throws(() => carryHandoverObligation(careResolved, {
  eventId: "carry-blocker",
  idempotencyKey: "carry-blocker",
  actorId: "user-manager",
  occurredAt: "2026-07-14T12:08:00+01:00",
  expectedRevision: 2,
  actorCapabilities: capabilities,
  obligationId: "care-meadow",
  expectedSourceRevision: 5,
  incomingOwnerId: "staff-sam",
  reason: "Continue later",
}), /cannot be carried/)

const carried = carryHandoverObligation(careResolved, {
  eventId: "carry-parent-reply",
  idempotencyKey: "carry-parent-reply-once",
  actorId: "user-manager",
  occurredAt: "2026-07-14T12:09:00+01:00",
  expectedRevision: 2,
  actorCapabilities: capabilities,
  obligationId: "reply-theo",
  expectedSourceRevision: 2,
  incomingOwnerId: "staff-sam",
  reason: "Incoming lead will confirm lunch preference with the family",
})
assert.equal(projectHandover(carried).status, "AWAITING_ACKNOWLEDGMENT")
assert.equal(projectHandover(carried).carriedCount, 1)

const acknowledged = acknowledgeHandover(carried, {
  eventId: "ack-sam",
  idempotencyKey: "ack-sam-once",
  actorId: "staff-sam",
  occurredAt: "2026-07-14T12:10:00+01:00",
  expectedRevision: 3,
  actorCapabilities: capabilities,
  incomingOwnerId: "staff-sam",
})
assert.equal(projectHandover(acknowledged).status, "READY_TO_CLOSE")
assert.equal(projectHandover(acknowledged).acknowledgedCarryCount, 1)

const sourceRevisions = Object.fromEntries(acknowledged.obligations.map((item) => [item.sourceId, item.sourceRevision]))
assert.throws(() => closeHandover(acknowledged, {
  eventId: "close-stale",
  idempotencyKey: "close-stale",
  actorId: "user-manager",
  occurredAt: "2026-07-14T12:11:00+01:00",
  expectedRevision: 4,
  actorCapabilities: capabilities,
  expectedSourceRevisions: { ...sourceRevisions, "care-session-meadow": 4 },
}), /source revision conflict/)

const closed = closeHandover(acknowledged, {
  eventId: "close-lunch-handover",
  idempotencyKey: "close-lunch-handover-once",
  actorId: "user-manager",
  occurredAt: "2026-07-14T12:11:00+01:00",
  expectedRevision: 4,
  actorCapabilities: capabilities,
  expectedSourceRevisions: sourceRevisions,
})
assert.equal(projectHandover(closed).status, "CLOSED")
assert.equal(closed.events.length, 5)
assert.equal(closed.obligations.find((item) => item.id === "reply-theo")?.state, "CARRIED")
assert.equal(closed.closedById, "user-manager")
assert.throws(() => resolveHandoverObligation(initial, {
  eventId: "resolve-without-capability",
  idempotencyKey: "resolve-without-capability",
  actorId: "staff-lina",
  occurredAt: "2026-07-14T12:12:00+01:00",
  expectedRevision: 0,
  actorCapabilities: [],
  obligationId: "attendance-alma",
  expectedSourceRevision: 3,
  acceptedSourceRevision: 4,
}), /Missing capability/)

const todaySource = readFileSync(resolve("src/app/(app)/today/today-client.tsx"), "utf8")
const labSource = readFileSync(resolve("src/app/design-lab/handover/_components/handover-lab.tsx"), "utf8")
const labStyles = readFileSync(resolve("src/app/design-lab/handover/handover.css"), "utf8")
const labHarness = readFileSync(resolve("src/app/design-lab/handover/_components/handover-axe-harness.tsx"), "utf8")
const contractDocument = readFileSync(resolve("docs/redesign/handover-contract.md"), "utf8")
assert.match(todaySource, /localStorage\.getItem\(`attendance-marked-/)
assert.match(todaySource, /reportStatus === "SUBMITTED"/)
assert.match(todaySource, /reportStatus === "DRAFT"/)
assert.match(labSource, /projectHandover\(session\)/)
assert.match(labSource, /carryHandoverObligation/)
assert.match(labSource, /acknowledgeHandover/)
assert.match(labSource, /closeHandover/)
assert.match(labSource, /aria-live="polite"/)
assert.doesNotMatch(labSource, /localStorage|recharts|<svg/)
assert.match(labStyles, /@media \(max-width: 480px\)/)
assert.match(labStyles, /min-height: 48px/)
assert.doesNotMatch(labStyles, /gradient\(/)
assert.match(labHarness, /auditNodeId="kiddz-handover-axe-audit"/)
assert.match(contractDocument, /## Additive Production Migration/)
assert.match(contractDocument, /zero axe violations/)

process.stdout.write(
  "Redesign handover verification passed (source blockers, allowed carry, incoming acknowledgment, stale close guard, append-only closure)\n",
)
