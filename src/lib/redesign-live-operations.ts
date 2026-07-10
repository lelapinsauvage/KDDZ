export const childPresenceStates = [
  "UNKNOWN",
  "PRESENT",
  "ABSENT",
  "LATE_EXPECTED",
  "NOT_EXPECTED",
  "DEPARTED",
] as const

export type ChildPresenceState = (typeof childPresenceStates)[number]
export type AttendanceSessionStatus = "OPEN" | "SUBMITTED" | "CORRECTED" | "CLOSED"
export type LiveReadinessStatus = "UNKNOWN" | "NEEDS_ATTENTION" | "SAFE_WITH_EXCEPTIONS" | "SAFE"

export type OperationalContext = {
  organizationId: string
  branchId: string
  operationalDate: string
  timeZone: string
  mode: "LIVE" | "PLANNING" | "HISTORY"
  asOf: string
}

export type ExpectedRosterChild = {
  childId: string
  displayName: string
  expectedRoomId: string
}

export type AttendanceCorrectionReplacement = {
  state: Exclude<ChildPresenceState, "UNKNOWN">
  roomId: string | null
}

type AttendanceCommandBase = {
  eventId: string
  idempotencyKey: string
  expectedRevision: number
  childId: string
  occurredAt: string
  recordedAt: string
  actorId: string
  source: "STAFF_OBSERVATION" | "PARENT_REPORT" | "IMPORT" | "LEGACY_ADAPTER"
}

export type AttendanceCommand =
  | (AttendanceCommandBase & { kind: "MARK_PRESENT"; roomId: string })
  | (AttendanceCommandBase & { kind: "MARK_ABSENT"; reason?: string })
  | (AttendanceCommandBase & { kind: "MARK_LATE_EXPECTED"; expectedAt?: string; reason?: string })
  | (AttendanceCommandBase & { kind: "MARK_NOT_EXPECTED"; reason?: string })
  | (AttendanceCommandBase & { kind: "CHECK_OUT"; roomId: string })
  | (AttendanceCommandBase & { kind: "MOVE_ROOM"; fromRoomId: string; roomId: string })
  | (AttendanceCommandBase & {
      kind: "CORRECT"
      correctsEventId: string
      reason: string
      replacement: AttendanceCorrectionReplacement
    })

export type AttendanceEvent = AttendanceCommand & {
  revision: number
}

export type AttendanceSubmission = {
  submissionId: string
  idempotencyKey: string
  submittedAt: string
  submittedById: string
  sourceRevision: number
}

export type AttendanceSession = {
  sessionId: string
  context: OperationalContext
  expectedRosterRevision: string
  expectedChildren: readonly ExpectedRosterChild[]
  status: AttendanceSessionStatus
  revision: number
  events: readonly AttendanceEvent[]
  submissions: readonly AttendanceSubmission[]
}

export type ChildPresenceProjection = ExpectedRosterChild & {
  state: ChildPresenceState
  currentRoomId: string | null
  lastRoomId: string | null
  lastEventId: string | null
  revision: number
  eventIds: string[]
}

export type AttendanceCommandResult = {
  session: AttendanceSession
  event: AttendanceEvent
  duplicate: boolean
}

function requireValue(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required`)
}

function requireTimestamp(value: string, label: string) {
  requireValue(value, label)
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an ISO timestamp`)
}

function attendanceCommandSignature(command: AttendanceCommand | AttendanceEvent) {
  if (command.kind === "CORRECT") {
    return JSON.stringify({
      actorId: command.actorId,
      childId: command.childId,
      correctsEventId: command.correctsEventId,
      kind: command.kind,
      occurredAt: command.occurredAt,
      reason: command.reason,
      replacement: command.replacement,
      source: command.source,
    })
  }

  return JSON.stringify({
    actorId: command.actorId,
    childId: command.childId,
    expectedAt: command.kind === "MARK_LATE_EXPECTED" ? command.expectedAt : undefined,
    fromRoomId: command.kind === "MOVE_ROOM" ? command.fromRoomId : undefined,
    kind: command.kind,
    occurredAt: command.occurredAt,
    reason: "reason" in command ? command.reason : undefined,
    roomId: "roomId" in command ? command.roomId : undefined,
    source: command.source,
  })
}

export function projectChildPresence(session: AttendanceSession, childId: string): ChildPresenceProjection {
  const expected = session.expectedChildren.find((child) => child.childId === childId)
  if (!expected) throw new Error("Child is not part of the expected roster")

  let state: ChildPresenceState = "UNKNOWN"
  let currentRoomId: string | null = null
  let lastRoomId: string | null = expected.expectedRoomId
  let lastEventId: string | null = null
  let revision = 0
  const eventIds: string[] = []

  for (const event of [...session.events].sort((left, right) => left.revision - right.revision)) {
    if (event.childId !== childId) continue

    eventIds.push(event.eventId)
    lastEventId = event.eventId
    revision = event.revision

    if (event.kind === "MARK_PRESENT") {
      state = "PRESENT"
      currentRoomId = event.roomId
      lastRoomId = event.roomId
    } else if (event.kind === "MARK_ABSENT") {
      state = "ABSENT"
      currentRoomId = null
    } else if (event.kind === "MARK_LATE_EXPECTED") {
      state = "LATE_EXPECTED"
      currentRoomId = null
    } else if (event.kind === "MARK_NOT_EXPECTED") {
      state = "NOT_EXPECTED"
      currentRoomId = null
    } else if (event.kind === "CHECK_OUT") {
      state = "DEPARTED"
      currentRoomId = null
      lastRoomId = event.roomId
    } else if (event.kind === "MOVE_ROOM") {
      state = "PRESENT"
      currentRoomId = event.roomId
      lastRoomId = event.roomId
    } else {
      state = event.replacement.state
      currentRoomId = event.replacement.state === "PRESENT" ? event.replacement.roomId : null
      if (event.replacement.roomId) lastRoomId = event.replacement.roomId
    }
  }

  return { ...expected, state, currentRoomId, lastRoomId, lastEventId, revision, eventIds }
}

export function projectAttendanceSession(session: AttendanceSession) {
  const children = session.expectedChildren.map((child) => projectChildPresence(session, child.childId))
  const counts = childPresenceStates.reduce<Record<ChildPresenceState, number>>((result, state) => {
    result[state] = children.filter((child) => child.state === state).length
    return result
  }, { UNKNOWN: 0, PRESENT: 0, ABSENT: 0, LATE_EXPECTED: 0, NOT_EXPECTED: 0, DEPARTED: 0 })

  return {
    sessionId: session.sessionId,
    status: session.status,
    revision: session.revision,
    children,
    counts,
    isComplete: counts.UNKNOWN === 0,
  }
}

function validateAttendanceCommand(session: AttendanceSession, command: AttendanceCommand) {
  requireValue(command.eventId, "Event id")
  requireValue(command.idempotencyKey, "Idempotency key")
  requireValue(command.actorId, "Actor id")
  requireTimestamp(command.occurredAt, "Occurred at")
  requireTimestamp(command.recordedAt, "Recorded at")

  if (session.status === "CLOSED") throw new Error("Closed attendance sessions cannot be changed")
  if (command.expectedRevision !== session.revision) throw new Error("Attendance session revision conflict")
  if (session.events.some((event) => event.eventId === command.eventId)) throw new Error("Event id already exists")

  const current = projectChildPresence(session, command.childId)

  if (command.kind === "MARK_PRESENT") {
    if (!["UNKNOWN", "LATE_EXPECTED", "DEPARTED"].includes(current.state)) {
      throw new Error("Present requires an unknown, late, or departed child state")
    }
    requireValue(command.roomId, "Room id")
  } else if (command.kind === "MARK_ABSENT") {
    if (!["UNKNOWN", "LATE_EXPECTED"].includes(current.state)) {
      throw new Error("A contradictory absence requires a correction")
    }
  } else if (command.kind === "MARK_LATE_EXPECTED" || command.kind === "MARK_NOT_EXPECTED") {
    if (current.state !== "UNKNOWN") throw new Error("Expected-state updates require an unknown child state")
  } else if (command.kind === "CHECK_OUT") {
    if (current.state !== "PRESENT" || current.currentRoomId !== command.roomId) {
      throw new Error("Check-out requires the child's current room")
    }
  } else if (command.kind === "MOVE_ROOM") {
    if (current.state !== "PRESENT" || current.currentRoomId !== command.fromRoomId) {
      throw new Error("Room move source must match the child's current room")
    }
    if (command.fromRoomId === command.roomId) throw new Error("Room move target must be different")
  } else {
    const corrected = session.events.find((event) => event.eventId === command.correctsEventId)
    if (!corrected || corrected.childId !== command.childId) throw new Error("Correction target was not found")
    if (command.reason.trim().length < 3) throw new Error("Correction reason is required")
    if (command.replacement.state === "PRESENT" && !command.replacement.roomId) {
      throw new Error("Corrected present state requires a room")
    }
    if (command.replacement.state !== "PRESENT" && command.replacement.roomId) {
      throw new Error("Only a present replacement can have a current room")
    }
  }
}

export function applyAttendanceCommand(session: AttendanceSession, command: AttendanceCommand): AttendanceCommandResult {
  const duplicate = session.events.find((event) => event.idempotencyKey === command.idempotencyKey)
  if (duplicate) {
    if (attendanceCommandSignature(duplicate) !== attendanceCommandSignature(command)) {
      throw new Error("Idempotency key was reused with different attendance input")
    }
    return { session, event: duplicate, duplicate: true }
  }

  validateAttendanceCommand(session, command)
  const event = { ...command, revision: session.revision + 1 } as AttendanceEvent
  const wasSubmitted = session.status === "SUBMITTED" || session.status === "CORRECTED"
  const status = command.kind === "CORRECT"
    ? wasSubmitted ? "CORRECTED" : session.status
    : wasSubmitted ? "OPEN" : session.status

  return {
    session: {
      ...session,
      status,
      revision: event.revision,
      events: [...session.events, event],
    },
    event,
    duplicate: false,
  }
}

export function submitAttendanceSession(
  session: AttendanceSession,
  submission: Omit<AttendanceSubmission, "sourceRevision"> & { expectedRevision: number },
) {
  const duplicate = session.submissions.find((item) => item.idempotencyKey === submission.idempotencyKey)
  if (duplicate) {
    if (
      duplicate.submissionId !== submission.submissionId ||
      duplicate.submittedAt !== submission.submittedAt ||
      duplicate.submittedById !== submission.submittedById ||
      duplicate.sourceRevision !== submission.expectedRevision
    ) {
      throw new Error("Idempotency key was reused with different submission input")
    }
    return session
  }
  if (session.status !== "OPEN") throw new Error("Only an open attendance session can be submitted")
  if (submission.expectedRevision !== session.revision) throw new Error("Attendance submission revision conflict")
  if (!projectAttendanceSession(session).isComplete) throw new Error("Unknown attendance must remain visible before submission")
  requireValue(submission.submissionId, "Submission id")
  requireValue(submission.idempotencyKey, "Submission idempotency key")
  requireValue(submission.submittedById, "Submitting actor")
  requireTimestamp(submission.submittedAt, "Submitted at")
  if (session.submissions.some((item) => item.submissionId === submission.submissionId)) {
    throw new Error("Submission id already exists")
  }

  return {
    ...session,
    status: "SUBMITTED" as const,
    submissions: [...session.submissions, {
      submissionId: submission.submissionId,
      idempotencyKey: submission.idempotencyKey,
      submittedAt: submission.submittedAt,
      submittedById: submission.submittedById,
      sourceRevision: session.revision,
    }],
  }
}

export type StaffRatioFact = {
  staffId: string
  displayName: string
  state: "UNKNOWN" | "PRESENT" | "ABSENT" | "ON_BREAK" | "DEPARTED"
  assignedRoomId: string | null
  workingDirectly: boolean
  eligibility: "COUNTED" | "EXCLUDED" | "UNKNOWN"
  exclusionReason: string | null
  sourceEventIds: readonly string[]
  asOf: string
}

export type RatioPolicyDecision = {
  status: "APPROVED" | "MISSING" | "STALE" | "UNRESOLVED"
  policyPackId: string | null
  ruleId: string | null
  label: string
  requiredAdults: number | null
  conditions: readonly {
    id: string
    label: string
    status: "PASS" | "FAIL" | "UNKNOWN"
  }[]
}

export type RatioSnapshotInput = {
  snapshotId: string
  context: OperationalContext
  roomId: string
  roomName: string
  attendance: AttendanceSession
  staff: readonly StaffRatioFact[]
  policy: RatioPolicyDecision
  sourceFreshness: "FRESH" | "STALE"
}

export type RatioSnapshot = {
  snapshotId: string
  roomId: string
  roomName: string
  status: Exclude<LiveReadinessStatus, "SAFE_WITH_EXCEPTIONS">
  asOf: string
  presentChildren: number
  unknownChildren: number
  requiredAdults: number | null
  countedAdults: number
  countedStaffIds: string[]
  excludedStaff: { staffId: string; displayName: string; reason: string }[]
  unknownFacts: string[]
  reasons: string[]
  sourceEventIds: string[]
  policyPackId: string | null
  ruleId: string | null
}

export function projectRatioSnapshot(input: RatioSnapshotInput): RatioSnapshot {
  const attendance = projectAttendanceSession(input.attendance)
  const roomChildren = attendance.children.filter((child) =>
    child.expectedRoomId === input.roomId || child.currentRoomId === input.roomId || child.lastRoomId === input.roomId,
  )
  const presentChildren = roomChildren.filter(
    (child) => child.state === "PRESENT" && child.currentRoomId === input.roomId,
  )
  const unknownChildren = roomChildren.filter((child) => child.state === "UNKNOWN")
  const roomStaff = input.staff.filter((staff) => staff.assignedRoomId === input.roomId)
  const countedStaff = roomStaff.filter(
    (staff) => staff.state === "PRESENT" && staff.workingDirectly && staff.eligibility === "COUNTED",
  )
  const unknownFacts: string[] = []
  const reasons: string[] = []

  if (input.sourceFreshness === "STALE") unknownFacts.push("Presence sources are stale")
  if (unknownChildren.length > 0) unknownFacts.push(`${unknownChildren.length} child attendance state unknown`)
  for (const staff of roomStaff) {
    if (staff.state === "UNKNOWN") unknownFacts.push(`${staff.displayName} presence is unknown`)
    if (staff.eligibility === "UNKNOWN") unknownFacts.push(`${staff.displayName} eligibility is unknown`)
  }
  if (input.policy.status !== "APPROVED" || input.policy.requiredAdults === null) {
    unknownFacts.push("An approved ratio policy decision is unavailable")
  }
  for (const condition of input.policy.conditions) {
    if (condition.status === "UNKNOWN") unknownFacts.push(condition.label)
    if (condition.status === "FAIL") reasons.push(condition.label)
  }

  const excludedStaff = roomStaff
    .filter((staff) => !countedStaff.includes(staff))
    .map((staff) => ({
      staffId: staff.staffId,
      displayName: staff.displayName,
      reason: staff.exclusionReason ?? (
        staff.state === "ON_BREAK" ? "On break" :
        staff.state !== "PRESENT" ? `Presence: ${staff.state.toLowerCase()}` :
        !staff.workingDirectly ? "Not working directly with children" :
        staff.eligibility === "UNKNOWN" ? "Eligibility unknown" : "Excluded by policy"
      ),
    }))

  let status: RatioSnapshot["status"] = "SAFE"
  if (unknownFacts.length > 0) {
    status = "UNKNOWN"
  } else if (reasons.length > 0 || countedStaff.length < (input.policy.requiredAdults ?? 0)) {
    status = "NEEDS_ATTENTION"
    if (countedStaff.length < (input.policy.requiredAdults ?? 0)) {
      reasons.push(`${input.policy.requiredAdults} counted adult required; ${countedStaff.length} available`)
    }
  } else {
    reasons.push(`${countedStaff.length} counted adult covers ${presentChildren.length} observed children`)
  }

  return {
    snapshotId: input.snapshotId,
    roomId: input.roomId,
    roomName: input.roomName,
    status,
    asOf: input.context.asOf,
    presentChildren: presentChildren.length,
    unknownChildren: unknownChildren.length,
    requiredAdults: input.policy.requiredAdults,
    countedAdults: countedStaff.length,
    countedStaffIds: countedStaff.map((staff) => staff.staffId),
    excludedStaff,
    unknownFacts,
    reasons,
    sourceEventIds: [
      ...presentChildren.flatMap((child) => child.eventIds),
      ...roomStaff.flatMap((staff) => staff.sourceEventIds),
    ],
    policyPackId: input.policy.policyPackId,
    ruleId: input.policy.ruleId,
  }
}

export type RoomOperationProjection = {
  roomId: string
  roomName: string
  status: LiveReadinessStatus
  current: RatioSnapshot
  forecast: RatioSnapshot | null
  nextChangeAt: string | null
  primaryReason: string
}

export function projectRoomOperation(
  current: RatioSnapshot,
  forecast: RatioSnapshot | null,
  nextChangeAt: string | null,
): RoomOperationProjection {
  if (current.status === "NEEDS_ATTENTION") {
    return { roomId: current.roomId, roomName: current.roomName, status: "NEEDS_ATTENTION", current, forecast, nextChangeAt, primaryReason: current.reasons[0] ?? "Current ratio needs attention" }
  }
  if (current.status === "UNKNOWN") {
    return { roomId: current.roomId, roomName: current.roomName, status: "UNKNOWN", current, forecast, nextChangeAt, primaryReason: current.unknownFacts[0] ?? "Current room state is unknown" }
  }
  if (forecast && forecast.status !== "SAFE") {
    return {
      roomId: current.roomId,
      roomName: current.roomName,
      status: "SAFE_WITH_EXCEPTIONS",
      current,
      forecast,
      nextChangeAt,
      primaryReason: forecast.status === "UNKNOWN"
        ? forecast.unknownFacts[0] ?? "Forecast inputs are incomplete"
        : forecast.reasons[0] ?? "Forecast ratio needs attention",
    }
  }
  return { roomId: current.roomId, roomName: current.roomName, status: "SAFE", current, forecast, nextChangeAt, primaryReason: current.reasons[0] ?? "Current sources are confirmed" }
}

export function projectBranchReadiness(rooms: readonly RoomOperationProjection[]) {
  const precedence: LiveReadinessStatus[] = ["NEEDS_ATTENTION", "UNKNOWN", "SAFE_WITH_EXCEPTIONS", "SAFE"]
  const status = precedence.find((candidate) => rooms.some((room) => room.status === candidate)) ?? "UNKNOWN"
  const lead = rooms.find((room) => room.status === status)
  return {
    status,
    roomCount: rooms.length,
    reason: lead?.primaryReason ?? "No room source is available",
    asOf: rooms[0]?.current.asOf ?? null,
  }
}

export type OperationalWorkItem = {
  id: string
  kind: "ATTENDANCE_UNKNOWN" | "CURRENT_UNKNOWN" | "RATIO_CURRENT" | "RATIO_FORECAST" | "FORECAST_UNKNOWN"
  priority: "CRITICAL" | "TIME_SENSITIVE" | "REQUIRED"
  roomId: string
  title: string
  consequence: string
  sourceIds: string[]
}

export function deriveRoomWorkItems(room: RoomOperationProjection): OperationalWorkItem[] {
  const items: OperationalWorkItem[] = []

  if (room.current.unknownChildren > 0) {
    items.push({
      id: `${room.roomId}:attendance`,
      kind: "ATTENDANCE_UNKNOWN",
      priority: "REQUIRED",
      roomId: room.roomId,
      title: `${room.current.unknownChildren} attendance state unknown`,
      consequence: "Current room ratio cannot be confirmed until the observation is recorded.",
      sourceIds: room.current.sourceEventIds,
    })
  } else if (room.current.status === "UNKNOWN") {
    items.push({
      id: `${room.roomId}:current-unknown`,
      kind: "CURRENT_UNKNOWN",
      priority: "REQUIRED",
      roomId: room.roomId,
      title: `${room.roomName} current state is unknown`,
      consequence: room.current.unknownFacts[0] ?? "Current room sources must be confirmed.",
      sourceIds: room.current.sourceEventIds,
    })
  } else if (room.current.status === "NEEDS_ATTENTION") {
    items.push({
      id: `${room.roomId}:ratio-now`,
      kind: "RATIO_CURRENT",
      priority: "CRITICAL",
      roomId: room.roomId,
      title: `${room.roomName} needs immediate ratio action`,
      consequence: room.current.reasons[0] ?? "Current counted staffing is below the policy decision.",
      sourceIds: room.current.sourceEventIds,
    })
  }

  if (room.current.status === "SAFE" && room.forecast?.status === "NEEDS_ATTENTION") {
    items.push({
      id: `${room.roomId}:ratio-forecast`,
      kind: "RATIO_FORECAST",
      priority: "TIME_SENSITIVE",
      roomId: room.roomId,
      title: `${room.roomName} cover needed at ${room.nextChangeAt ?? "the next change"}`,
      consequence: room.forecast.reasons[0] ?? "Forecast counted staffing is below the policy decision.",
      sourceIds: room.forecast.sourceEventIds,
    })
  } else if (room.current.status === "SAFE" && room.forecast?.status === "UNKNOWN") {
    items.push({
      id: `${room.roomId}:forecast-unknown`,
      kind: "FORECAST_UNKNOWN",
      priority: "REQUIRED",
      roomId: room.roomId,
      title: `${room.roomName} forecast is unknown`,
      consequence: room.forecast.unknownFacts[0] ?? "Forecast sources must be confirmed.",
      sourceIds: room.forecast.sourceEventIds,
    })
  }

  return items
}

export type CoverAssignment = {
  assignmentId: string
  staffId: string
  roomId: string
  startsAt: string
  endsAt: string
  assignedById: string
  sourceRevision: number
}

export function applyCoverAssignment(
  staff: readonly StaffRatioFact[],
  assignment: CoverAssignment,
) {
  requireValue(assignment.assignmentId, "Assignment id")
  requireValue(assignment.assignedById, "Assigning actor")
  requireTimestamp(assignment.startsAt, "Cover start")
  requireTimestamp(assignment.endsAt, "Cover end")
  if (Date.parse(assignment.endsAt) <= Date.parse(assignment.startsAt)) {
    throw new Error("Cover assignment must end after it starts")
  }

  const candidate = staff.find((item) => item.staffId === assignment.staffId)
  if (!candidate) throw new Error("Cover candidate was not found")
  if (candidate.assignedRoomId) throw new Error("Cover candidate already has a room assignment")
  if (candidate.state !== "PRESENT") throw new Error("Cover candidate is not present")
  if (!candidate.workingDirectly || candidate.eligibility !== "COUNTED") {
    throw new Error("Cover candidate is not eligible to count")
  }

  return staff.map((item) => item.staffId === assignment.staffId
    ? { ...item, assignedRoomId: assignment.roomId, sourceEventIds: [...item.sourceEventIds, assignment.assignmentId] }
    : item)
}
