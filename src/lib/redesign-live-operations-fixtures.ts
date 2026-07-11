import {
  acceptCoverAssignmentPreview,
  applyAttendanceCommand,
  deriveRoomWorkItems,
  previewCoverAssignment,
  projectBranchReadiness,
  projectRatioSnapshot,
  projectRoomOperation,
  type AttendanceCommand,
  type AttendanceSession,
  type ChildPresenceState,
  type CoverAssignment,
  type OperationalContext,
  type RatioPolicyDecision,
  type RatioRoomDefinition,
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
  { childId: "child-ivy", displayName: "Ivy Chen", expectedRoomId: "room-seedlings" },
  { childId: "child-omar", displayName: "Omar Nasser", expectedRoomId: "room-seedlings" },
  { childId: "child-maya", displayName: "Maya Brown", expectedRoomId: "room-seedlings" },
  { childId: "child-noah", displayName: "Noah Silva", expectedRoomId: "room-seedlings" },
  { childId: "child-sara", displayName: "Sara Mansour", expectedRoomId: "room-seedlings" },
] as const

function presentCommand(
  session: AttendanceSession,
  childId: string,
  eventId: string,
  occurredAt: string,
  roomId: string,
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
    roomId,
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

  const arrivals = [
    ["child-theo", "event-theo-arrival", "2026-07-14T08:52:00+01:00", "room-meadow"],
    ["child-mila", "event-mila-arrival", "2026-07-14T08:57:00+01:00", "room-meadow"],
    ["child-leo", "event-leo-arrival", "2026-07-14T09:03:00+01:00", "room-meadow"],
    ["child-ivy", "event-ivy-arrival", "2026-07-14T08:41:00+01:00", "room-seedlings"],
    ["child-omar", "event-omar-arrival", "2026-07-14T08:43:00+01:00", "room-seedlings"],
    ["child-maya", "event-maya-arrival", "2026-07-14T08:46:00+01:00", "room-seedlings"],
    ["child-noah", "event-noah-arrival", "2026-07-14T08:49:00+01:00", "room-seedlings"],
    ["child-sara", "event-sara-arrival", "2026-07-14T08:51:00+01:00", "room-seedlings"],
  ] as const

  for (const [childId, eventId, occurredAt, roomId] of arrivals) {
    session = applyAttendanceCommand(
      session,
      presentCommand(session, childId, eventId, occurredAt, roomId),
    ).session
  }

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
  label: "Synthetic Meadow decision - one counted adult required",
  requiredAdults: 1,
  conditions: [
    { id: "condition-meadow", label: "Synthetic Meadow composition check", status: "PASS" },
  ],
}

export const fixtureSeedlingsPolicy: RatioPolicyDecision = {
  status: "APPROVED",
  policyPackId: "policy-synthetic-ratio",
  ruleId: "rule-synthetic-seedlings",
  label: "Synthetic Seedlings decision - two counted adults required",
  requiredAdults: 2,
  conditions: [
    { id: "condition-seedlings", label: "Synthetic Seedlings composition check", status: "PASS" },
  ],
}

export const fixtureRoomMeta = {
  "room-meadow": { name: "Meadow", ageBand: "2-3 years", nextChangeAt: "12:30" },
  "room-seedlings": { name: "Seedlings", ageBand: "3-4 years", nextChangeAt: null },
} as const

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
      staffId: "staff-priya",
      displayName: "Priya Shah",
      state: "PRESENT",
      assignedRoomId: "room-seedlings",
      workingDirectly: true,
      eligibility: "COUNTED",
      exclusionReason: null,
      sourceEventIds: ["staff-priya-arrival", "assignment-priya-seedlings"],
      asOf: fixtureContext.asOf,
    },
    {
      staffId: "staff-noor",
      displayName: "Noor Haddad",
      state: "PRESENT",
      assignedRoomId: "room-seedlings",
      workingDirectly: true,
      eligibility: "COUNTED",
      exclusionReason: null,
      sourceEventIds: ["staff-noor-arrival", "assignment-noor-seedlings"],
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

const forecastContext = {
  ...fixtureContext,
  mode: "PLANNING" as const,
  asOf: "2026-07-14T12:30:00+01:00",
}

function createRoomDefinitions(
  attendance: AttendanceSession,
  context: OperationalContext,
  phase: "current" | "forecast",
): RatioRoomDefinition[] {
  return [
    {
      snapshotId: `meadow-${phase}-${attendance.revision}`,
      context,
      roomId: "room-meadow",
      roomName: "Meadow",
      attendance,
      policy: fixturePolicy,
      sourceFreshness: "FRESH",
    },
    {
      snapshotId: `seedlings-${phase}-${attendance.revision}`,
      context,
      roomId: "room-seedlings",
      roomName: "Seedlings",
      attendance,
      policy: fixtureSeedlingsPolicy,
      sourceFreshness: "FRESH",
    },
  ]
}

export type FixtureCoverCandidateId = "staff-sam" | "staff-noor"

export const fixtureCoverCandidates: Array<{
  staffId: FixtureCoverCandidateId
  name: string
  detail: string
}> = [
  { staffId: "staff-sam", name: "Sam Okafor", detail: "Present, approved, floating, no room conflict" },
  { staffId: "staff-noor", name: "Noor Haddad", detail: "Present, approved, currently counted in Seedlings" },
]

function createFixtureCoverAssignment(
  forecastStaff: readonly StaffRatioFact[],
  staffId: FixtureCoverCandidateId,
): CoverAssignment {
  const candidate = forecastStaff.find((staff) => staff.staffId === staffId)
  if (!candidate) throw new Error("Fixture cover candidate was not found")
  return {
    assignmentId: `cover-${staffId}-meadow-1230`,
    staffId,
    fromRoomId: candidate.assignedRoomId,
    roomId: "room-meadow",
    startsAt: "2026-07-14T12:30:00+01:00",
    endsAt: "2026-07-14T13:00:00+01:00",
    assignedById: "user-karim",
    sourceRevision: 1,
  }
}

export function previewFixtureCover(
  attendance: AttendanceSession,
  forecastStaff: readonly StaffRatioFact[],
  staffId: FixtureCoverCandidateId,
) {
  return previewCoverAssignment(
    createRoomDefinitions(attendance, forecastContext, "forecast"),
    forecastStaff,
    createFixtureCoverAssignment(forecastStaff, staffId),
  )
}

export function assignFixtureCover(
  attendance: AttendanceSession,
  staff: readonly StaffRatioFact[],
  staffId: FixtureCoverCandidateId = "staff-sam",
) {
  return acceptCoverAssignmentPreview(previewFixtureCover(attendance, staff, staffId))
}

export function buildFixtureOperations(
  attendance: AttendanceSession,
  forecastStaff: readonly StaffRatioFact[],
) {
  const currentDefinitions = createRoomDefinitions(attendance, fixtureContext, "current")
  const forecastDefinitions = createRoomDefinitions(attendance, forecastContext, "forecast")
  const currentStaff = createCurrentFixtureStaff()
  const rooms = currentDefinitions.map((currentDefinition) => {
    const forecastDefinition = forecastDefinitions.find((room) => room.roomId === currentDefinition.roomId)
    if (!forecastDefinition) throw new Error("Fixture forecast room definition is missing")
    const current = projectRatioSnapshot({ ...currentDefinition, staff: currentStaff })
    const forecast = projectRatioSnapshot({ ...forecastDefinition, staff: forecastStaff })
    return projectRoomOperation(
      current,
      forecast,
      fixtureRoomMeta[currentDefinition.roomId as keyof typeof fixtureRoomMeta].nextChangeAt,
    )
  })
  const room = rooms.find((item) => item.roomId === "room-meadow")
  if (!room) throw new Error("Meadow fixture projection is missing")

  return {
    branch: projectBranchReadiness(rooms),
    room,
    rooms,
    workItems: rooms.flatMap(deriveRoomWorkItems),
  }
}
