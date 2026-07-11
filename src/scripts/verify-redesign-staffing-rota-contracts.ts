import assert from "node:assert/strict"

import {
  assignSelectedCover,
  cancelRotaShift,
  capabilitiesForStaffingRole,
  confirmStaffAbsence,
  confirmStaffingSources,
  createStaffingRotaFixture,
  deriveStaffingPlanStatus,
  findRotaConflicts,
  markStaffingSourceChanged,
  projectCoverCandidates,
  projectRoomStaffing,
  projectStaffingForRole,
  refreshStaffingSources,
  scheduleBreakCover,
  selectCoverCandidate,
  type StaffingCommand,
  type StaffingPlan,
} from "../lib/redesign-staffing-rota-contracts"

function command(
  plan: StaffingPlan,
  key: string,
  occurredAt = "2026-08-04T12:00:00.000Z",
): StaffingCommand {
  return {
    eventId: `verify-event-${key}`,
    idempotencyKey: `verify-staffing-${key}`,
    actorId: "verify-manager",
    occurredAt,
    expectedRevision: plan.revision,
    actorCapabilities: capabilitiesForStaffingRole("manager"),
  }
}

const expectedStages = [
  ["source-gap", "SOURCE_GAP"],
  ["rota-conflict", "ROTA_CONFLICT"],
  ["absence-review", "ABSENCE_REVIEW"],
  ["cover-required", "COVER_REQUIRED"],
  ["cover-preview", "COVER_PREVIEW"],
  ["cover-confirmed", "COVER_CONFIRMED"],
  ["break-due", "BREAK_DUE"],
  ["ready", "READY"],
  ["source-changed", "SOURCE_CHANGED"],
] as const

for (const [stage, expected] of expectedStages) {
  assert.equal(
    deriveStaffingPlanStatus(createStaffingRotaFixture(stage)),
    expected,
    `${stage} must derive ${expected}`,
  )
}

const sourceGap = createStaffingRotaFixture("source-gap")
assert.equal(sourceGap.sourcesTrusted, false)
assert.throws(
  () =>
    confirmStaffingSources(sourceGap, {
      ...command(sourceGap, "partial-source"),
      sources: [{ sourceId: "unrelated-source", revision: 1 }],
    }),
  /Every required staffing source must be confirmed/,
)
assert.throws(
  () =>
    confirmStaffingSources(sourceGap, {
      ...command(sourceGap, "source-regression"),
      sources: [{ sourceId: "rota-week-32", revision: 3 }],
    }),
  /cannot regress/,
)

const rotaConflict = createStaffingRotaFixture("rota-conflict")
assert.equal(rotaConflict.sourceSnapshot.length, 6)
assert.equal(rotaConflict.sourcesTrusted, true)
assert.deepEqual(findRotaConflicts(rotaConflict), [
  {
    staffId: "staff-theo",
    shiftIds: ["shift-theo-meadow", "shift-theo-sun"],
  },
])

const cancelCommand = {
  ...command(rotaConflict, "cancel-overlap"),
  shiftId: "shift-theo-sun",
  reason: "Duplicate room assignment",
}
const conflictResolved = cancelRotaShift(rotaConflict, cancelCommand)
assert.equal(findRotaConflicts(conflictResolved).length, 0)
assert.equal(conflictResolved.shifts.find((shift) => shift.id === "shift-theo-sun")?.status, "CANCELLED")
assert.deepEqual(cancelRotaShift(conflictResolved, cancelCommand), conflictResolved)
assert.throws(
  () =>
    cancelRotaShift(conflictResolved, {
      ...cancelCommand,
      reason: "Reused with changed reason",
    }),
  /Idempotency key reused/,
)

const absenceReview = createStaffingRotaFixture("absence-review")
const absenceCommand = {
  ...command(absenceReview, "confirm-absence"),
  absenceId: "absence-sophie",
}
const absenceConfirmed = confirmStaffAbsence(absenceReview, absenceCommand)
assert.equal(absenceConfirmed.absences[0].status, "CONFIRMED")
assert.equal(absenceConfirmed.absences[0].sourceRevision, 3)
assert.deepEqual(confirmStaffAbsence(absenceConfirmed, absenceCommand), absenceConfirmed)

const coverRequired = createStaffingRotaFixture("cover-required")
const meadowBefore = projectRoomStaffing(coverRequired, "room-meadow")
assert.equal(meadowBefore.requiredQualifiedStaff, 3)
assert.equal(meadowBefore.scheduledStaff, 3)
assert.equal(meadowBefore.presentQualifiedStaff, 2)
assert.equal(meadowBefore.confirmedAbsent, 1)
assert.equal(meadowBefore.gap, 1)
const candidates = projectCoverCandidates(coverRequired, "room-meadow", {
  startsAt: "2026-08-04T10:20:00.000Z",
  endsAt: "2026-08-04T16:00:00.000Z",
})
assert.equal(candidates.find((candidate) => candidate.staffId === "staff-nina")?.eligible, true)
assert.deepEqual(
  candidates.find((candidate) => candidate.staffId === "staff-nina")?.reasons,
  [],
)
assert.equal(
  candidates.find((candidate) => candidate.staffId === "staff-nina")?.targetGapAfterAssignment,
  0,
)
assert.equal(candidates.find((candidate) => candidate.staffId === "staff-lea")?.eligible, false)
assert.ok(
  candidates
    .find((candidate) => candidate.staffId === "staff-lea")
    ?.reasons.includes("Qualification missing or expired"),
)
assert.ok(
  candidates
    .find((candidate) => candidate.staffId === "staff-theo")
    ?.reasons.includes("Already assigned to target room"),
)

assert.throws(
  () =>
    selectCoverCandidate(coverRequired, {
      ...command(coverRequired, "select-expired"),
      roomId: "room-meadow",
      candidateStaffId: "staff-lea",
      startsAt: "2026-08-04T10:20:00.000Z",
      endsAt: "2026-08-04T16:00:00.000Z",
    }),
  /Candidate is not eligible/,
)

const coverPreview = createStaffingRotaFixture("cover-preview")
assert.equal(coverPreview.coverSelections.length, 1)
assert.equal(coverPreview.coverAssignments.length, 0)
const selection = coverPreview.coverSelections[0]
const assignCommand = {
  ...command(coverPreview, "assign-nina"),
  selectionId: selection.id,
}
const coverConfirmed = assignSelectedCover(coverPreview, assignCommand)
assert.equal(coverConfirmed.coverAssignments.length, 1)
assert.equal(
  projectRoomStaffing(coverConfirmed, "room-meadow", "2026-08-04T10:20:01.000Z").gap,
  0,
)
assert.deepEqual(assignSelectedCover(coverConfirmed, assignCommand), coverConfirmed)

const sourceRiskPlan: StaffingPlan = {
  ...coverRequired,
  qualifications: coverRequired.qualifications.map((qualification) =>
    qualification.staffId === "staff-omar"
      ? { ...qualification, roomIds: ["room-sun", "room-meadow"] }
      : qualification,
  ),
}
const sourceRiskCandidate = projectCoverCandidates(sourceRiskPlan, "room-meadow", {
  startsAt: "2026-08-04T10:20:00.000Z",
  endsAt: "2026-08-04T12:00:00.000Z",
}).find((candidate) => candidate.staffId === "staff-omar")
assert.equal(sourceRiskCandidate?.sourceRoomId, "room-sun")
assert.equal(sourceRiskCandidate?.sourceGapAfterAssignment, 1)
assert.ok(sourceRiskCandidate?.reasons.includes("Would create a source-room gap"))

const breakDue = createStaffingRotaFixture("break-due")
const breakCommand = {
  ...command(breakDue, "schedule-break", "2026-08-04T11:46:00.000Z"),
  breakId: "break-omar",
  candidateStaffId: "staff-maya",
  startsAt: "2026-08-04T11:50:00.000Z",
}
const breakScheduled = scheduleBreakCover(breakDue, breakCommand)
assert.equal(breakScheduled.breaks[0].status, "SCHEDULED")
assert.equal(breakScheduled.breaks[0].coverStaffId, "staff-maya")
assert.equal(projectRoomStaffing(breakScheduled, "room-sun", "2026-08-04T11:55:00.000Z").gap, 0)
assert.equal(
  projectRoomStaffing(breakScheduled, "room-sun", "2026-08-04T11:55:00.000Z").onBreak,
  1,
)
assert.deepEqual(scheduleBreakCover(breakScheduled, breakCommand), breakScheduled)

const managerProjection = projectStaffingForRole(coverRequired, "manager")
const schedulerProjection = projectStaffingForRole(coverRequired, "scheduler")
const practitionerProjection = projectStaffingForRole(coverRequired, "practitioner")
assert.equal(managerProjection.absences[0].privateReason, "Migraine reported by phone at 07:12")
assert.equal(schedulerProjection.absences[0].privateReason, undefined)
assert.equal(practitionerProjection.absences.length, 0)
assert.equal(practitionerProjection.candidates.length, 0)
assert.equal(practitionerProjection.events.length, 0)
assert.deepEqual(practitionerProjection.staff.map((member) => member.id), ["staff-amina"])
assert.ok(
  practitionerProjection.rooms
    .flatMap((room) => room.contributions)
    .every((entry) => entry.displayName === "You" || entry.displayName === entry.roleLabel),
)

const ready = createStaffingRotaFixture("ready")
const sourceChangeCommand = {
  ...command(ready, "source-change", "2026-08-04T12:05:00.000Z"),
  source: { sourceId: "gate-presence", revision: 12 },
}
const changed = markStaffingSourceChanged(ready, sourceChangeCommand)
assert.equal(changed.sourceChanged, true)
assert.equal(deriveStaffingPlanStatus(changed), "SOURCE_CHANGED")
assert.throws(
  () =>
    confirmStaffAbsence(changed, {
      ...command(changed, "stale-write"),
      absenceId: "absence-sophie",
    }),
  /refresh before accepting work/,
)
assert.throws(
  () =>
    cancelRotaShift(changed, {
      ...command(changed, "stale-rota-write"),
      shiftId: "shift-omar-sun",
      reason: "Should not be accepted from stale sources",
    }),
  /refresh before accepting work/,
)
assert.throws(
  () =>
    refreshStaffingSources(changed, {
      ...command(changed, "partial-refresh"),
      sources: changed.sourceSnapshot.filter((source) => source.sourceId !== "break-policy"),
    }),
  /Refresh omitted source/,
)
assert.throws(
  () =>
    refreshStaffingSources(changed, {
      ...command(changed, "regressing-refresh"),
      sources: changed.sourceSnapshot.map((source) =>
        source.sourceId === "rota-week-32" ? { ...source, revision: 3 } : source,
      ),
    }),
  /cannot regress/,
)
const refreshCommand = {
  ...command(changed, "full-refresh"),
  sources: changed.sourceSnapshot.map((entry) =>
    entry.sourceId === "gate-presence" ? { ...entry, revision: 12 } : entry,
  ),
}
const refreshed = refreshStaffingSources(changed, refreshCommand)
assert.equal(refreshed.sourceSnapshot.length, 6)
assert.equal(refreshed.sourceChanged, false)
assert.equal(refreshed.sourcesTrusted, true)
assert.equal(deriveStaffingPlanStatus(refreshed), "READY")
assert.deepEqual(refreshStaffingSources(refreshed, refreshCommand), refreshed)

const unauthorized = {
  ...command(coverRequired, "unauthorized"),
  actorCapabilities: capabilitiesForStaffingRole("practitioner"),
  roomId: "room-meadow",
  candidateStaffId: "staff-nina",
  startsAt: "2026-08-04T10:20:00.000Z",
  endsAt: "2026-08-04T16:00:00.000Z",
}
assert.throws(
  () => selectCoverCandidate(coverRequired, unauthorized),
  /Missing capability: staffing.manage_cover/,
)

console.log("Staffing and rota redesign contracts verified")
