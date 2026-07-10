import {
  applyAttendanceCommand,
  applyCoverAssignment,
  deriveRoomWorkItems,
  projectBranchReadiness,
  projectRatioSnapshot,
  projectRoomOperation,
  type AttendanceCommand,
  type AttendanceSession,
  type ChildPresenceState,
  type OperationalContext,
  type RatioPolicyDecision,
  type StaffRatioFact,
} from "./redesign-live-operations"

export const fixtureContext: OperationalContext = {
  organizationId: "org-riverside",
  branchId: "branch-riverside",
  operationalDate: "2026-07-14",
  timeZone: "Europe/London",
  mode: "LIVE",
  asOf: "2026-07-14T09:18:00+01:00",
}

const expectedChildren = [
  { childId: "child-alma", displayName: "Alma Reyes", expectedRoomId: "room-meadow" },
  { childId: "child-theo", displayName: "Theo Martin", expectedRoomId: "room-meadow" },
  { childId: "child-mila", displayName: "Mila Costa", expectedRoomId: "room-meadow" },
  { childId: "child-leo", displayName: "Leo Haddad", expectedRoomId: "room-meadow" },
] as const

function presentCommand(
  session: AttendanceSession,
  childId: string,
  eventId: string,
  occurredAt: string,
): AttendanceCommand {
  return {
    eventId,
    idempotencyKey: `${eventId}:once`,
    expectedRevision: session.revision,
    childId,
    occurredAt,
    recordedAt: occurredAt,
    actorId: "user-lina",
    source: "STAFF_OBSERVATION",
    kind: "MARK_PRESENT",
    roomId: "room-meadow",
  }
}

export function createFixtureAttendanceSession() {
  let session: AttendanceSession = {
    sessionId: "attendance-riverside-2026-07-14",
    context: fixtureContext,
    expectedRosterRevision: "roster-14",
    expectedChildren,
    status: "OPEN",
    revision: 0,
    events: [],
    submissions: [],
  }

  session = applyAttendanceCommand(
    session,
    presentCommand(session, "child-theo", "event-theo-arrival", "2026-07-14T08:52:00+01:00"),
  ).session
  session = applyAttendanceCommand(
    session,
    presentCommand(session, "child-mila", "event-mila-arrival", "2026-07-14T08:57:00+01:00"),
  ).session
  session = applyAttendanceCommand(
    session,
    presentCommand(session, "child-leo", "event-leo-arrival", "2026-07-14T09:03:00+01:00"),
  ).session

  return session
}

export type FixtureAttendanceChoice = Extract<
  ChildPresenceState,
  "PRESENT" | "ABSENT" | "LATE_EXPECTED" | "NOT_EXPECTED"
>

export function recordFixtureAttendance(session: AttendanceSession, choice: FixtureAttendanceChoice) {
  const base = {
    eventId: `event-alma-${choice.toLowerCase()}`,
    idempotencyKey: `attendance-alma-${choice.toLowerCase()}`,
    expectedRevision: session.revision,
    childId: "child-alma",
    occurredAt: "2026-07-14T09:18:00+01:00",
    recordedAt: "2026-07-14T09:18:03+01:00",
    actorId: "user-karim",
    source: "STAFF_OBSERVATION" as const,
  }

  const command: AttendanceCommand = choice === "PRESENT"
    ? { ...base, kind: "MARK_PRESENT", roomId: "room-meadow" }
    : choice === "ABSENT"
      ? { ...base, kind: "MARK_ABSENT", reason: "Observed absent at room check" }
      : choice === "LATE_EXPECTED"
        ? { ...base, kind: "MARK_LATE_EXPECTED", expectedAt: "2026-07-14T09:45:00+01:00" }
        : { ...base, kind: "MARK_NOT_EXPECTED", reason: "Not scheduled for this session" }

  return applyAttendanceCommand(session, command).session
}

export const fixturePolicy: RatioPolicyDecision = {
  status: "APPROVED",
  policyPackId: "policy-synthetic-ratio",
  ruleId: "rule-synthetic-meadow",
  label: "Synthetic approved fixture - one counted adult required",
  requiredAdults: 1,
  conditions: [
    { id: "condition-fixture", label: "Synthetic qualification composition check", status: "PASS" },
  ],
}

export function createCurrentFixtureStaff(): StaffRatioFact[] {
  return [
    {
      staffId: "staff-lina",
      displayName: "Lina Rahal",
      state: "PRESENT",
      assignedRoomId: "room-meadow",
      workingDirectly: true,
      eligibility: "COUNTED",
      exclusionReason: null,
      sourceEventIds: ["staff-lina-arrival", "assignment-lina-meadow"],
      asOf: fixtureContext.asOf,
    },
    {
      staffId: "staff-sam",
      displayName: "Sam Okafor",
      state: "PRESENT",
      assignedRoomId: null,
      workingDirectly: true,
      eligibility: "COUNTED",
      exclusionReason: null,
      sourceEventIds: ["staff-sam-arrival", "availability-sam-floating"],
      asOf: fixtureContext.asOf,
    },
  ]
}

export function createForecastFixtureStaff(): StaffRatioFact[] {
  return createCurrentFixtureStaff().map((staff) => staff.staffId === "staff-lina"
    ? {
        ...staff,
        state: "ON_BREAK" as const,
        exclusionReason: "Scheduled break from 12:30 to 13:00",
        sourceEventIds: [...staff.sourceEventIds, "break-lina-1230"],
      }
    : staff)
}

export function assignFixtureCover(staff: readonly StaffRatioFact[]) {
  return applyCoverAssignment(staff, {
    assignmentId: "cover-sam-meadow-1230",
    staffId: "staff-sam",
    roomId: "room-meadow",
    startsAt: "2026-07-14T12:30:00+01:00",
    endsAt: "2026-07-14T13:00:00+01:00",
    assignedById: "user-karim",
    sourceRevision: 1,
  })
}

export function buildFixtureOperations(
  attendance: AttendanceSession,
  forecastStaff: readonly StaffRatioFact[],
) {
  const current = projectRatioSnapshot({
    snapshotId: `meadow-current-${attendance.revision}`,
    context: fixtureContext,
    roomId: "room-meadow",
    roomName: "Meadow",
    attendance,
    staff: createCurrentFixtureStaff(),
    policy: fixturePolicy,
    sourceFreshness: "FRESH",
  })
  const forecastContext = { ...fixtureContext, mode: "PLANNING" as const, asOf: "2026-07-14T12:30:00+01:00" }
  const forecast = projectRatioSnapshot({
    snapshotId: `meadow-forecast-${attendance.revision}-${forecastStaff.some((staff) => staff.assignedRoomId === "room-meadow" && staff.staffId === "staff-sam") ? "covered" : "open"}`,
    context: forecastContext,
    roomId: "room-meadow",
    roomName: "Meadow",
    attendance,
    staff: forecastStaff,
    policy: fixturePolicy,
    sourceFreshness: "FRESH",
  })
  const room = projectRoomOperation(current, forecast, "12:30")
  return {
    branch: projectBranchReadiness([room]),
    room,
    workItems: deriveRoomWorkItems(room),
  }
}
