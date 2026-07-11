export type StaffingCapability =
  | "staffing.view"
  | "staffing.manage_rota"
  | "staffing.manage_absence"
  | "staffing.manage_cover"
  | "staffing.view_private_absence"
  | "staffing.audit"

export type StaffingPlanStatus =
  | "SOURCE_GAP"
  | "ROTA_CONFLICT"
  | "ABSENCE_REVIEW"
  | "COVER_REQUIRED"
  | "COVER_PREVIEW"
  | "COVER_CONFIRMED"
  | "BREAK_DUE"
  | "READY"
  | "SOURCE_CHANGED"

export type StaffingFixtureStage =
  | "source-gap"
  | "rota-conflict"
  | "absence-review"
  | "cover-required"
  | "cover-preview"
  | "cover-confirmed"
  | "break-due"
  | "ready"
  | "source-changed"

export interface StaffingSourceRevision {
  sourceId: string
  revision: number
}

export interface StaffingRoom {
  id: string
  label: string
}

export interface StaffingDemand {
  id: string
  roomId: string
  startsAt: string
  endsAt: string
  requiredQualifiedStaff: number
  policyLabel: string
  source: StaffingSourceRevision
}

export interface StaffingMember {
  id: string
  displayName: string
  roleLabel: string
  branchId: string
  active: boolean
}

export interface StaffingAvailability {
  id: string
  staffId: string
  startsAt: string
  endsAt: string
  kind: "AVAILABLE" | "UNAVAILABLE"
  source: StaffingSourceRevision
}

export interface StaffingQualification {
  id: string
  staffId: string
  label: string
  roomIds: string[]
  validFrom: string
  expiresAt?: string
  status: "ACTIVE" | "REVOKED"
  source: StaffingSourceRevision
}

export interface StaffingShift {
  id: string
  staffId: string
  roomId?: string
  startsAt: string
  endsAt: string
  kind: "HOME" | "FLOAT" | "COVER" | "BREAK_COVER"
  status: "SCHEDULED" | "CANCELLED"
  sourceRevision: number
  cancelledAt?: string
  cancellationReason?: string
}

export interface StaffPresenceObservation {
  id: string
  staffId: string
  state: "CHECKED_IN" | "CHECKED_OUT" | "UNKNOWN"
  observedAt?: string
  source?: StaffingSourceRevision
}

export interface StaffAbsence {
  id: string
  staffId: string
  startsAt: string
  endsAt: string
  status: "REPORTED" | "CONFIRMED" | "CANCELLED"
  category: "SICK" | "EMERGENCY" | "LEAVE" | "OTHER"
  privateReason?: string
  sourceRevision: number
  confirmedAt?: string
}

export interface StaffBreak {
  id: string
  staffId: string
  durationMinutes: number
  dueBy: string
  status: "DUE" | "SCHEDULED" | "TAKEN" | "WAIVED"
  startsAt?: string
  endsAt?: string
  coverStaffId?: string
  source: StaffingSourceRevision
}

export interface CoverSelection {
  id: string
  roomId: string
  candidateStaffId: string
  startsAt: string
  endsAt: string
  createdAt: string
  sourcePlanRevision: number
}

export interface CoverAssignment {
  id: string
  roomId: string
  staffId: string
  startsAt: string
  endsAt: string
  kind: "ABSENCE" | "BREAK"
  status: "ACTIVE" | "CANCELLED" | "EXPIRED"
  sourcePlanRevision: number
  createdAt: string
}

export interface StaffingPlanEvent {
  eventId: string
  idempotencyKey: string
  fingerprint: string
  kind:
    | "SOURCES_CONFIRMED"
    | "SHIFT_CANCELLED"
    | "ABSENCE_CONFIRMED"
    | "COVER_SELECTED"
    | "COVER_ASSIGNED"
    | "BREAK_SCHEDULED"
    | "SOURCE_CHANGED"
    | "PLAN_REFRESHED"
  actorId: string
  occurredAt: string
  detail: string
  resultingRevision: number
}

export interface StaffingPlan {
  id: string
  branch: { id: string; label: string }
  operationalDate: string
  operationalNow: string
  revision: number
  sourcesTrusted: boolean
  sourceChanged: boolean
  sourceRequirements: string[]
  sourceSnapshot: StaffingSourceRevision[]
  rooms: StaffingRoom[]
  demands: StaffingDemand[]
  staff: StaffingMember[]
  availability: StaffingAvailability[]
  qualifications: StaffingQualification[]
  shifts: StaffingShift[]
  presence: StaffPresenceObservation[]
  absences: StaffAbsence[]
  breaks: StaffBreak[]
  coverSelections: CoverSelection[]
  coverAssignments: CoverAssignment[]
  events: StaffingPlanEvent[]
}

export interface StaffingCommand {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedRevision: number
  actorCapabilities: readonly StaffingCapability[]
}

export interface StaffContribution {
  staffId: string
  displayName: string
  roleLabel: string
  included: boolean
  reasons: string[]
  shiftId?: string
}

export interface RoomStaffingProjection {
  roomId: string
  roomLabel: string
  configured: boolean
  requiredQualifiedStaff?: number
  scheduledStaff: number
  presentQualifiedStaff: number
  unresolvedPresence: number
  confirmedAbsent: number
  onBreak: number
  gap?: number
  nextChangeAt?: string
  source: StaffingSourceRevision[]
  contributions: StaffContribution[]
}

export interface CoverCandidateProjection {
  staffId: string
  displayName: string
  roleLabel: string
  eligible: boolean
  reasons: string[]
  sourceRoomId?: string
  targetGapAfterAssignment?: number
  sourceGapAfterAssignment?: number
}

const managerCapabilities: StaffingCapability[] = [
  "staffing.view",
  "staffing.manage_rota",
  "staffing.manage_absence",
  "staffing.manage_cover",
  "staffing.view_private_absence",
  "staffing.audit",
]

function fingerprint(command: object) {
  return JSON.stringify(command)
}

function beginCommand(
  plan: StaffingPlan,
  command: StaffingCommand,
  capability: StaffingCapability,
  options: { allowSourceChanged?: boolean } = {},
) {
  const commandFingerprint = fingerprint(command)
  const existing = plan.events.find((event) => event.idempotencyKey === command.idempotencyKey)
  if (existing) {
    if (existing.fingerprint !== commandFingerprint) {
      throw new Error("Idempotency key reused with different input")
    }
    return { repeated: true, fingerprint: commandFingerprint }
  }
  if (!command.actorCapabilities.includes(capability)) {
    throw new Error(`Missing capability: ${capability}`)
  }
  if (plan.revision !== command.expectedRevision) {
    throw new Error(
      `Staffing plan revision conflict: expected ${command.expectedRevision}, found ${plan.revision}`,
    )
  }
  if (plan.sourceChanged && !options.allowSourceChanged) {
    throw new Error("Staffing sources changed; refresh before accepting work")
  }
  return { repeated: false, fingerprint: commandFingerprint }
}

function appendEvent(
  plan: StaffingPlan,
  command: StaffingCommand,
  event: Pick<StaffingPlanEvent, "kind" | "detail">,
  commandFingerprint: string,
  patch: Partial<StaffingPlan>,
) {
  const resultingRevision = plan.revision + 1
  return {
    ...plan,
    ...patch,
    revision: resultingRevision,
    events: [
      ...plan.events,
      {
        eventId: command.eventId,
        idempotencyKey: command.idempotencyKey,
        fingerprint: commandFingerprint,
        kind: event.kind,
        actorId: command.actorId,
        occurredAt: command.occurredAt,
        detail: event.detail,
        resultingRevision,
      },
    ],
  }
}

function overlaps(
  first: { startsAt: string; endsAt: string },
  second: { startsAt: string; endsAt: string },
) {
  return (
    new Date(first.startsAt).getTime() < new Date(second.endsAt).getTime() &&
    new Date(second.startsAt).getTime() < new Date(first.endsAt).getTime()
  )
}

function activeAt(window: { startsAt: string; endsAt: string }, at: string) {
  const time = new Date(at).getTime()
  return new Date(window.startsAt).getTime() <= time && time < new Date(window.endsAt).getTime()
}

function validQualification(
  qualification: StaffingQualification,
  roomId: string,
  at: string,
) {
  const time = new Date(at).getTime()
  return (
    qualification.status === "ACTIVE" &&
    qualification.roomIds.includes(roomId) &&
    new Date(qualification.validFrom).getTime() <= time &&
    (qualification.expiresAt === undefined || new Date(qualification.expiresAt).getTime() > time)
  )
}

function mergeSourceSnapshots(
  previous: StaffingSourceRevision[],
  incoming: StaffingSourceRevision[],
) {
  const sources = new Map(previous.map((source) => [source.sourceId, source]))
  for (const source of incoming) sources.set(source.sourceId, source)
  return [...sources.values()]
}

function sourceSnapshotTrusted(plan: StaffingPlan, snapshot: StaffingSourceRevision[]) {
  return plan.sourceRequirements.every((required) =>
    snapshot.some((source) => source.sourceId === required),
  )
}

export function findRotaConflicts(plan: StaffingPlan) {
  const scheduled = plan.shifts.filter((shift) => shift.status === "SCHEDULED")
  const conflicts: Array<{ staffId: string; shiftIds: [string, string] }> = []
  for (let index = 0; index < scheduled.length; index += 1) {
    for (let other = index + 1; other < scheduled.length; other += 1) {
      const first = scheduled[index]
      const second = scheduled[other]
      if (
        first.staffId === second.staffId &&
        first.roomId !== second.roomId &&
        overlaps(first, second)
      ) {
        conflicts.push({ staffId: first.staffId, shiftIds: [first.id, second.id] })
      }
    }
  }
  return conflicts
}

function staffShiftForRoom(plan: StaffingPlan, staffId: string, roomId: string, at: string) {
  return plan.shifts.find(
    (shift) =>
      shift.staffId === staffId &&
      shift.roomId === roomId &&
      shift.status === "SCHEDULED" &&
      activeAt(shift, at),
  )
}

function activeCoverForRoom(plan: StaffingPlan, staffId: string, roomId: string, at: string) {
  return plan.coverAssignments.find(
    (assignment) =>
      assignment.staffId === staffId &&
      assignment.roomId === roomId &&
      assignment.status === "ACTIVE" &&
      activeAt(assignment, at),
  )
}

function staffHasConfirmedAbsence(plan: StaffingPlan, staffId: string, at: string) {
  return plan.absences.some(
    (absence) =>
      absence.staffId === staffId &&
      absence.status === "CONFIRMED" &&
      activeAt(absence, at),
  )
}

function staffOnScheduledBreak(plan: StaffingPlan, staffId: string, at: string) {
  return plan.breaks.some(
    (entry) =>
      entry.staffId === staffId &&
      (entry.status === "SCHEDULED" || entry.status === "TAKEN") &&
      entry.startsAt !== undefined &&
      entry.endsAt !== undefined &&
      activeAt({ startsAt: entry.startsAt, endsAt: entry.endsAt }, at),
  )
}

function staffPresence(plan: StaffingPlan, staffId: string) {
  return plan.presence.find((entry) => entry.staffId === staffId)
}

export function projectRoomStaffing(
  plan: StaffingPlan,
  roomId: string,
  at = plan.operationalNow,
): RoomStaffingProjection {
  const room = plan.rooms.find((item) => item.id === roomId)
  if (!room) throw new Error("Room is outside this staffing plan")
  const demand = plan.demands.find(
    (entry) => entry.roomId === roomId && activeAt(entry, at),
  )
  const configured = Boolean(plan.sourcesTrusted && demand)
  const assignedStaffIds = new Set<string>()
  for (const shift of plan.shifts) {
    if (
      shift.roomId === roomId &&
      shift.status === "SCHEDULED" &&
      activeAt(shift, at)
    ) {
      assignedStaffIds.add(shift.staffId)
    }
  }
  for (const assignment of plan.coverAssignments) {
    if (
      assignment.roomId === roomId &&
      assignment.status === "ACTIVE" &&
      activeAt(assignment, at)
    ) {
      assignedStaffIds.add(assignment.staffId)
    }
  }

  const contributions = [...assignedStaffIds].map((staffId): StaffContribution => {
    const staff = plan.staff.find((member) => member.id === staffId)
    if (!staff) throw new Error("Assigned staff record is missing")
    const reasons: string[] = []
    const observation = staffPresence(plan, staffId)
    const absent = staffHasConfirmedAbsence(plan, staffId, at)
    const onBreak = staffOnScheduledBreak(plan, staffId, at)
    const qualified = plan.qualifications.some(
      (qualification) =>
        qualification.staffId === staffId && validQualification(qualification, roomId, at),
    )
    if (!staff.active) reasons.push("Employment inactive")
    if (!observation || observation.state === "UNKNOWN") reasons.push("Presence unknown")
    if (observation?.state === "CHECKED_OUT") reasons.push("Not checked in")
    if (absent) reasons.push("Confirmed absent")
    if (onBreak) reasons.push("On scheduled break")
    if (!qualified) reasons.push("No valid room qualification")
    return {
      staffId,
      displayName: staff.displayName,
      roleLabel: staff.roleLabel,
      included:
        staff.active &&
        observation?.state === "CHECKED_IN" &&
        !absent &&
        !onBreak &&
        qualified,
      reasons,
      shiftId:
        staffShiftForRoom(plan, staffId, roomId, at)?.id ??
        activeCoverForRoom(plan, staffId, roomId, at)?.id,
    }
  })

  const scheduledStaff = assignedStaffIds.size
  const presentQualifiedStaff = contributions.filter((entry) => entry.included).length
  const unresolvedPresence = contributions.filter((entry) =>
    entry.reasons.includes("Presence unknown"),
  ).length
  const confirmedAbsent = contributions.filter((entry) =>
    entry.reasons.includes("Confirmed absent"),
  ).length
  const onBreak = contributions.filter((entry) =>
    entry.reasons.includes("On scheduled break"),
  ).length
  const gap = configured
    ? Math.max(0, demand!.requiredQualifiedStaff - presentQualifiedStaff)
    : undefined
  const nextChangeAt = [
    ...plan.shifts.flatMap((shift) => [shift.startsAt, shift.endsAt]),
    ...plan.absences.flatMap((absence) => [absence.startsAt, absence.endsAt]),
    ...plan.breaks.flatMap((entry) => [entry.startsAt, entry.endsAt]).filter(Boolean) as string[],
    ...plan.coverAssignments.flatMap((assignment) => [assignment.startsAt, assignment.endsAt]),
  ]
    .filter((value) => new Date(value).getTime() > new Date(at).getTime())
    .sort((first, second) => new Date(first).getTime() - new Date(second).getTime())[0]

  return {
    roomId,
    roomLabel: room.label,
    configured,
    requiredQualifiedStaff: demand?.requiredQualifiedStaff,
    scheduledStaff,
    presentQualifiedStaff,
    unresolvedPresence,
    confirmedAbsent,
    onBreak,
    gap,
    nextChangeAt,
    source: demand ? [demand.source] : [],
    contributions,
  }
}

function availableForWindow(
  plan: StaffingPlan,
  staffId: string,
  window: { startsAt: string; endsAt: string },
) {
  return plan.availability.some(
    (entry) =>
      entry.staffId === staffId &&
      entry.kind === "AVAILABLE" &&
      new Date(entry.startsAt).getTime() <= new Date(window.startsAt).getTime() &&
      new Date(entry.endsAt).getTime() >= new Date(window.endsAt).getTime(),
  )
}

function sourceRoomForCandidate(
  plan: StaffingPlan,
  staffId: string,
  window: { startsAt: string; endsAt: string },
) {
  return plan.shifts.find(
    (shift) =>
      shift.staffId === staffId &&
      shift.roomId !== undefined &&
      shift.status === "SCHEDULED" &&
      overlaps(shift, window),
  )?.roomId
}

export function projectCoverCandidates(
  plan: StaffingPlan,
  roomId: string,
  window: { startsAt: string; endsAt: string },
): CoverCandidateProjection[] {
  const targetBefore = projectRoomStaffing(plan, roomId, window.startsAt)
  return plan.staff.map((staff): CoverCandidateProjection => {
    const reasons: string[] = []
    const qualified = plan.qualifications.some(
      (qualification) =>
        qualification.staffId === staff.id &&
        validQualification(qualification, roomId, window.startsAt),
    )
    const present = staffPresence(plan, staff.id)?.state === "CHECKED_IN"
    const absent = plan.absences.some(
      (absence) =>
        absence.staffId === staff.id &&
        absence.status === "CONFIRMED" &&
        overlaps(absence, window),
    )
    const available = availableForWindow(plan, staff.id, window)
    const alreadyTarget = plan.shifts.some(
      (shift) =>
        shift.staffId === staff.id &&
        shift.roomId === roomId &&
        shift.status === "SCHEDULED" &&
        overlaps(shift, window),
    )
    const sourceRoomId = sourceRoomForCandidate(plan, staff.id, window)
    let sourceGapAfterAssignment: number | undefined
    if (sourceRoomId) {
      const sourceProjection = projectRoomStaffing(plan, sourceRoomId, window.startsAt)
      sourceGapAfterAssignment =
        sourceProjection.gap === undefined
          ? undefined
          : Math.max(0, sourceProjection.gap + (sourceProjection.contributions.some(
              (entry) => entry.staffId === staff.id && entry.included,
            ) ? 1 : 0))
    }
    if (!staff.active) reasons.push("Employment inactive")
    if (!present) reasons.push("Not confirmed present")
    if (absent) reasons.push("Confirmed absent")
    if (!available) reasons.push("Outside availability")
    if (!qualified) reasons.push("Qualification missing or expired")
    if (alreadyTarget) reasons.push("Already assigned to target room")
    if (sourceGapAfterAssignment !== undefined && sourceGapAfterAssignment > 0) {
      reasons.push("Would create a source-room gap")
    }
    const eligible = reasons.length === 0
    return {
      staffId: staff.id,
      displayName: staff.displayName,
      roleLabel: staff.roleLabel,
      eligible,
      reasons,
      sourceRoomId,
      targetGapAfterAssignment:
        targetBefore.gap === undefined ? undefined : Math.max(0, targetBefore.gap - 1),
      sourceGapAfterAssignment,
    }
  })
}

export function deriveStaffingPlanStatus(plan: StaffingPlan): StaffingPlanStatus {
  if (plan.sourceChanged) return "SOURCE_CHANGED"
  if (!plan.sourcesTrusted) return "SOURCE_GAP"
  if (findRotaConflicts(plan).length > 0) return "ROTA_CONFLICT"
  if (plan.absences.some((absence) => absence.status === "REPORTED")) {
    return "ABSENCE_REVIEW"
  }
  if (plan.coverSelections.length > plan.coverAssignments.filter((entry) => entry.kind === "ABSENCE").length) {
    return "COVER_PREVIEW"
  }
  const hasRoomGap = plan.rooms.some((room) => projectRoomStaffing(plan, room.id).gap! > 0)
  if (hasRoomGap) return "COVER_REQUIRED"
  const dueBreak = plan.breaks.some(
    (entry) =>
      entry.status === "DUE" &&
      new Date(entry.dueBy).getTime() <= new Date(plan.operationalNow).getTime(),
  )
  if (dueBreak) return "BREAK_DUE"
  if (plan.events.at(-1)?.kind === "COVER_ASSIGNED") return "COVER_CONFIRMED"
  return "READY"
}

export function confirmStaffingSources(
  plan: StaffingPlan,
  command: StaffingCommand & { sources: StaffingSourceRevision[] },
) {
  const start = beginCommand(plan, command, "staffing.manage_rota")
  if (start.repeated) return plan
  for (const incoming of command.sources) {
    const current = plan.sourceSnapshot.find((source) => source.sourceId === incoming.sourceId)
    if (current && incoming.revision < current.revision) {
      throw new Error(`Source revision cannot regress: ${incoming.sourceId}`)
    }
  }
  const sourceSnapshot = mergeSourceSnapshots(plan.sourceSnapshot, command.sources)
  const sourcesTrusted = sourceSnapshotTrusted(plan, sourceSnapshot)
  if (!sourcesTrusted) throw new Error("Every required staffing source must be confirmed")
  return appendEvent(
    plan,
    command,
    { kind: "SOURCES_CONFIRMED", detail: `${sourceSnapshot.length} source revisions confirmed` },
    start.fingerprint,
    { sourceSnapshot, sourcesTrusted, sourceChanged: false },
  )
}

export function cancelRotaShift(
  plan: StaffingPlan,
  command: StaffingCommand & { shiftId: string; reason: string },
) {
  const start = beginCommand(plan, command, "staffing.manage_rota")
  if (start.repeated) return plan
  const shift = plan.shifts.find((entry) => entry.id === command.shiftId)
  if (!shift || shift.status !== "SCHEDULED") throw new Error("Scheduled shift not found")
  return appendEvent(
    plan,
    command,
    { kind: "SHIFT_CANCELLED", detail: `${shift.id}: ${command.reason}` },
    start.fingerprint,
    {
      shifts: plan.shifts.map((entry) =>
        entry.id === command.shiftId
          ? {
              ...entry,
              status: "CANCELLED" as const,
              sourceRevision: entry.sourceRevision + 1,
              cancelledAt: command.occurredAt,
              cancellationReason: command.reason,
            }
          : entry,
      ),
    },
  )
}

export function confirmStaffAbsence(
  plan: StaffingPlan,
  command: StaffingCommand & { absenceId: string },
) {
  const start = beginCommand(plan, command, "staffing.manage_absence")
  if (start.repeated) return plan
  const absence = plan.absences.find((entry) => entry.id === command.absenceId)
  if (!absence || absence.status !== "REPORTED") throw new Error("Reported absence not found")
  return appendEvent(
    plan,
    command,
    { kind: "ABSENCE_CONFIRMED", detail: `Absence confirmed for ${absence.staffId}` },
    start.fingerprint,
    {
      absences: plan.absences.map((entry) =>
        entry.id === command.absenceId
          ? {
              ...entry,
              status: "CONFIRMED" as const,
              sourceRevision: entry.sourceRevision + 1,
              confirmedAt: command.occurredAt,
            }
          : entry,
      ),
    },
  )
}

export function selectCoverCandidate(
  plan: StaffingPlan,
  command: StaffingCommand & {
    roomId: string
    candidateStaffId: string
    startsAt: string
    endsAt: string
  },
) {
  const start = beginCommand(plan, command, "staffing.manage_cover")
  if (start.repeated) return plan
  const candidate = projectCoverCandidates(plan, command.roomId, command).find(
    (entry) => entry.staffId === command.candidateStaffId,
  )
  if (!candidate) throw new Error("Cover candidate not found")
  if (!candidate.eligible) throw new Error(`Candidate is not eligible: ${candidate.reasons.join(", ")}`)
  return appendEvent(
    plan,
    command,
    {
      kind: "COVER_SELECTED",
      detail: `${candidate.displayName} selected; target ${candidate.targetGapAfterAssignment ?? "unknown"}, source ${candidate.sourceGapAfterAssignment ?? 0}`,
    },
    start.fingerprint,
    {
      coverSelections: [
        ...plan.coverSelections,
        {
          id: `selection-${command.eventId}`,
          roomId: command.roomId,
          candidateStaffId: command.candidateStaffId,
          startsAt: command.startsAt,
          endsAt: command.endsAt,
          createdAt: command.occurredAt,
          sourcePlanRevision: plan.revision,
        },
      ],
    },
  )
}

export function assignSelectedCover(
  plan: StaffingPlan,
  command: StaffingCommand & { selectionId: string },
) {
  const start = beginCommand(plan, command, "staffing.manage_cover")
  if (start.repeated) return plan
  const selection = plan.coverSelections.find((entry) => entry.id === command.selectionId)
  if (!selection) throw new Error("Cover selection not found")
  const candidate = projectCoverCandidates(plan, selection.roomId, selection).find(
    (entry) => entry.staffId === selection.candidateStaffId,
  )
  if (!candidate?.eligible) {
    throw new Error(`Cover consequence changed: ${candidate?.reasons.join(", ") || "candidate unavailable"}`)
  }
  if ((candidate.targetGapAfterAssignment ?? 1) > 0) {
    throw new Error("Selected cover does not resolve the target gap")
  }
  if ((candidate.sourceGapAfterAssignment ?? 0) > 0) {
    throw new Error("Selected cover would create a source-room gap")
  }
  return appendEvent(
    plan,
    command,
    { kind: "COVER_ASSIGNED", detail: `${candidate.displayName} assigned to ${selection.roomId}` },
    start.fingerprint,
    {
      coverAssignments: [
        ...plan.coverAssignments,
        {
          id: `cover-${command.eventId}`,
          roomId: selection.roomId,
          staffId: selection.candidateStaffId,
          startsAt: selection.startsAt,
          endsAt: selection.endsAt,
          kind: "ABSENCE" as const,
          status: "ACTIVE" as const,
          sourcePlanRevision: plan.revision,
          createdAt: command.occurredAt,
        },
      ],
    },
  )
}

export function scheduleBreakCover(
  plan: StaffingPlan,
  command: StaffingCommand & {
    breakId: string
    candidateStaffId: string
    startsAt: string
  },
) {
  const start = beginCommand(plan, command, "staffing.manage_cover")
  if (start.repeated) return plan
  const entry = plan.breaks.find((item) => item.id === command.breakId)
  if (!entry || entry.status !== "DUE") throw new Error("Due break not found")
  const ownerShift = plan.shifts.find(
    (shift) =>
      shift.staffId === entry.staffId &&
      shift.roomId !== undefined &&
      shift.status === "SCHEDULED" &&
      activeAt(shift, command.startsAt),
  )
  if (!ownerShift?.roomId) throw new Error("Break owner has no active room assignment")
  const endsAt = new Date(
    new Date(command.startsAt).getTime() + entry.durationMinutes * 60_000,
  ).toISOString()
  const candidate = projectCoverCandidates(plan, ownerShift.roomId, {
    startsAt: command.startsAt,
    endsAt,
  }).find((item) => item.staffId === command.candidateStaffId)
  if (!candidate?.eligible) {
    throw new Error(`Break cover is not eligible: ${candidate?.reasons.join(", ") || "candidate unavailable"}`)
  }
  if ((candidate.sourceGapAfterAssignment ?? 0) > 0) {
    throw new Error("Break cover would create a source-room gap")
  }
  return appendEvent(
    plan,
    command,
    { kind: "BREAK_SCHEDULED", detail: `${entry.staffId} break covered by ${candidate.displayName}` },
    start.fingerprint,
    {
      breaks: plan.breaks.map((item) =>
        item.id === command.breakId
          ? {
              ...item,
              status: "SCHEDULED" as const,
              startsAt: command.startsAt,
              endsAt,
              coverStaffId: command.candidateStaffId,
            }
          : item,
      ),
      coverAssignments: [
        ...plan.coverAssignments,
        {
          id: `break-cover-${command.eventId}`,
          roomId: ownerShift.roomId,
          staffId: command.candidateStaffId,
          startsAt: command.startsAt,
          endsAt,
          kind: "BREAK" as const,
          status: "ACTIVE" as const,
          sourcePlanRevision: plan.revision,
          createdAt: command.occurredAt,
        },
      ],
    },
  )
}

export function markStaffingSourceChanged(
  plan: StaffingPlan,
  command: StaffingCommand & { source: StaffingSourceRevision },
) {
  const start = beginCommand(plan, command, "staffing.manage_rota")
  if (start.repeated) return plan
  const existing = plan.sourceSnapshot.find((source) => source.sourceId === command.source.sourceId)
  if (!existing) throw new Error("Changed source is outside the staffing plan")
  if (command.source.revision <= existing.revision) {
    throw new Error("Changed source must have a newer revision")
  }
  return appendEvent(
    plan,
    command,
    { kind: "SOURCE_CHANGED", detail: `${command.source.sourceId} advanced to ${command.source.revision}` },
    start.fingerprint,
    { sourceChanged: true },
  )
}

export function refreshStaffingSources(
  plan: StaffingPlan,
  command: StaffingCommand & { sources: StaffingSourceRevision[] },
) {
  const start = beginCommand(plan, command, "staffing.manage_rota", {
    allowSourceChanged: true,
  })
  if (start.repeated) return plan
  if (!plan.sourceChanged) throw new Error("Staffing sources are already current")
  for (const requirement of plan.sourceRequirements) {
    if (!command.sources.some((source) => source.sourceId === requirement)) {
      throw new Error(`Refresh omitted source: ${requirement}`)
    }
  }
  for (const source of command.sources) {
    const previous = plan.sourceSnapshot.find((entry) => entry.sourceId === source.sourceId)
    if (previous && source.revision < previous.revision) {
      throw new Error(`Source revision cannot regress: ${source.sourceId}`)
    }
  }
  const sourceSnapshot = mergeSourceSnapshots(plan.sourceSnapshot, command.sources)
  return appendEvent(
    plan,
    command,
    { kind: "PLAN_REFRESHED", detail: `${sourceSnapshot.length} source revisions revalidated` },
    start.fingerprint,
    {
      sourceSnapshot,
      sourcesTrusted: sourceSnapshotTrusted(plan, sourceSnapshot),
      sourceChanged: false,
    },
  )
}

function command(
  plan: StaffingPlan,
  key: string,
  occurredAt: string,
  capabilities = managerCapabilities,
): StaffingCommand {
  return {
    eventId: `event-${key}`,
    idempotencyKey: `staffing-${key}`,
    actorId: "manager-river",
    occurredAt,
    expectedRevision: plan.revision,
    actorCapabilities: capabilities,
  }
}

function source(sourceId: string, revision = 1): StaffingSourceRevision {
  return { sourceId, revision }
}

export function createStaffingRotaFixture(stage: StaffingFixtureStage = "source-gap") {
  let plan: StaffingPlan = {
    id: "staffing-plan-2026-08-04",
    branch: { id: "branch-riverside", label: "Riverside Nursery" },
    operationalDate: "2026-08-04",
    operationalNow: "2026-08-04T10:15:00.000Z",
    revision: 1,
    sourcesTrusted: false,
    sourceChanged: false,
    sourceRequirements: [
      "rota-week-32",
      "staff-qualifications",
      "gate-presence",
      "room-demand",
      "absence-calendar",
      "break-policy",
    ],
    sourceSnapshot: [
      source("rota-week-32", 4),
      source("staff-qualifications", 9),
      source("room-demand", 3),
      source("absence-calendar", 2),
      source("break-policy", 5),
    ],
    rooms: [
      { id: "room-meadow", label: "Meadow Room" },
      { id: "room-sun", label: "Sunroom" },
    ],
    demands: [
      {
        id: "demand-meadow",
        roomId: "room-meadow",
        startsAt: "2026-08-04T08:00:00.000Z",
        endsAt: "2026-08-04T16:00:00.000Z",
        requiredQualifiedStaff: 3,
        policyLabel: "Operator-supplied room demand",
        source: source("room-demand", 3),
      },
      {
        id: "demand-sun",
        roomId: "room-sun",
        startsAt: "2026-08-04T08:00:00.000Z",
        endsAt: "2026-08-04T16:00:00.000Z",
        requiredQualifiedStaff: 1,
        policyLabel: "Operator-supplied room demand",
        source: source("room-demand", 3),
      },
    ],
    staff: [
      { id: "staff-amina", displayName: "Amina N.", roleLabel: "Room lead", branchId: "branch-riverside", active: true },
      { id: "staff-sophie", displayName: "Sophie R.", roleLabel: "Practitioner", branchId: "branch-riverside", active: true },
      { id: "staff-theo", displayName: "Theo B.", roleLabel: "Practitioner", branchId: "branch-riverside", active: true },
      { id: "staff-omar", displayName: "Omar K.", roleLabel: "Room lead", branchId: "branch-riverside", active: true },
      { id: "staff-nina", displayName: "Nina A.", roleLabel: "Floating practitioner", branchId: "branch-riverside", active: true },
      { id: "staff-maya", displayName: "Maya D.", roleLabel: "Floating practitioner", branchId: "branch-riverside", active: true },
      { id: "staff-lea", displayName: "Lea P.", roleLabel: "Assistant", branchId: "branch-riverside", active: true },
    ],
    availability: [
      ...["staff-amina", "staff-sophie", "staff-theo", "staff-omar", "staff-nina", "staff-maya", "staff-lea"].map((staffId) => ({
        id: `availability-${staffId}`,
        staffId,
        startsAt: "2026-08-04T08:00:00.000Z",
        endsAt: "2026-08-04T16:00:00.000Z",
        kind: "AVAILABLE" as const,
        source: source("rota-week-32", 4),
      })),
    ],
    qualifications: [
      ["staff-amina", ["room-meadow"]],
      ["staff-sophie", ["room-meadow"]],
      ["staff-theo", ["room-meadow", "room-sun"]],
      ["staff-omar", ["room-sun"]],
      ["staff-nina", ["room-meadow", "room-sun"]],
      ["staff-maya", ["room-sun"]],
      ["staff-lea", ["room-meadow"]],
    ].map(([staffId, roomIds]) => ({
      id: `qualification-${staffId}`,
      staffId: staffId as string,
      label: "Operator-accepted room qualification",
      roomIds: roomIds as string[],
      validFrom: "2026-01-01T00:00:00.000Z",
      expiresAt: staffId === "staff-lea" ? "2026-07-31T23:59:59.000Z" : undefined,
      status: "ACTIVE" as const,
      source: source("staff-qualifications", 9),
    })),
    shifts: [
      { id: "shift-amina-meadow", staffId: "staff-amina", roomId: "room-meadow", startsAt: "2026-08-04T08:00:00.000Z", endsAt: "2026-08-04T16:00:00.000Z", kind: "HOME", status: "SCHEDULED", sourceRevision: 4 },
      { id: "shift-sophie-meadow", staffId: "staff-sophie", roomId: "room-meadow", startsAt: "2026-08-04T08:00:00.000Z", endsAt: "2026-08-04T16:00:00.000Z", kind: "HOME", status: "SCHEDULED", sourceRevision: 4 },
      { id: "shift-theo-meadow", staffId: "staff-theo", roomId: "room-meadow", startsAt: "2026-08-04T08:00:00.000Z", endsAt: "2026-08-04T16:00:00.000Z", kind: "HOME", status: "SCHEDULED", sourceRevision: 4 },
      { id: "shift-theo-sun", staffId: "staff-theo", roomId: "room-sun", startsAt: "2026-08-04T09:00:00.000Z", endsAt: "2026-08-04T12:00:00.000Z", kind: "HOME", status: "SCHEDULED", sourceRevision: 4 },
      { id: "shift-omar-sun", staffId: "staff-omar", roomId: "room-sun", startsAt: "2026-08-04T08:00:00.000Z", endsAt: "2026-08-04T16:00:00.000Z", kind: "HOME", status: "SCHEDULED", sourceRevision: 4 },
      { id: "shift-nina-float", staffId: "staff-nina", startsAt: "2026-08-04T08:00:00.000Z", endsAt: "2026-08-04T16:00:00.000Z", kind: "FLOAT", status: "SCHEDULED", sourceRevision: 4 },
      { id: "shift-maya-float", staffId: "staff-maya", startsAt: "2026-08-04T08:00:00.000Z", endsAt: "2026-08-04T16:00:00.000Z", kind: "FLOAT", status: "SCHEDULED", sourceRevision: 4 },
    ],
    presence: [
      ...["staff-amina", "staff-theo", "staff-omar", "staff-nina", "staff-maya", "staff-lea"].map((staffId) => ({
        id: `presence-${staffId}`,
        staffId,
        state: "CHECKED_IN" as const,
        observedAt: "2026-08-04T08:02:00.000Z",
        source: source("gate-presence", 11),
      })),
      { id: "presence-staff-sophie", staffId: "staff-sophie", state: "UNKNOWN", source: source("gate-presence", 11) },
    ],
    absences: [
      {
        id: "absence-sophie",
        staffId: "staff-sophie",
        startsAt: "2026-08-04T08:00:00.000Z",
        endsAt: "2026-08-04T16:00:00.000Z",
        status: "REPORTED",
        category: "SICK",
        privateReason: "Migraine reported by phone at 07:12",
        sourceRevision: 2,
      },
    ],
    breaks: [
      {
        id: "break-omar",
        staffId: "staff-omar",
        durationMinutes: 30,
        dueBy: "2026-08-04T11:30:00.000Z",
        status: "DUE",
        source: source("break-policy", 5),
      },
    ],
    coverSelections: [],
    coverAssignments: [],
    events: [],
  }

  if (stage === "source-gap") return plan
  plan = confirmStaffingSources(plan, {
    ...command(plan, "confirm-sources", "2026-08-04T10:16:00.000Z"),
    sources: [source("gate-presence", 11)],
  })
  if (stage === "rota-conflict") return plan
  plan = cancelRotaShift(plan, {
    ...command(plan, "cancel-overlap", "2026-08-04T10:17:00.000Z"),
    shiftId: "shift-theo-sun",
    reason: "Duplicate room assignment",
  })
  if (stage === "absence-review") return plan
  plan = confirmStaffAbsence(plan, {
    ...command(plan, "confirm-absence", "2026-08-04T10:18:00.000Z"),
    absenceId: "absence-sophie",
  })
  if (stage === "cover-required") return plan
  plan = selectCoverCandidate(plan, {
    ...command(plan, "select-nina", "2026-08-04T10:19:00.000Z"),
    roomId: "room-meadow",
    candidateStaffId: "staff-nina",
    startsAt: "2026-08-04T10:20:00.000Z",
    endsAt: "2026-08-04T16:00:00.000Z",
  })
  if (stage === "cover-preview") return plan
  plan = assignSelectedCover(plan, {
    ...command(plan, "assign-nina", "2026-08-04T10:20:00.000Z"),
    selectionId: "selection-event-select-nina",
  })
  plan = { ...plan, operationalNow: "2026-08-04T10:20:01.000Z" }
  if (stage === "cover-confirmed") return plan
  plan = { ...plan, operationalNow: "2026-08-04T11:45:00.000Z" }
  if (stage === "break-due") return plan
  plan = scheduleBreakCover(plan, {
    ...command(plan, "schedule-omar-break", "2026-08-04T11:46:00.000Z"),
    breakId: "break-omar",
    candidateStaffId: "staff-maya",
    startsAt: "2026-08-04T11:50:00.000Z",
  })
  if (stage === "ready") return plan
  return markStaffingSourceChanged(plan, {
    ...command(plan, "source-change", "2026-08-04T11:47:00.000Z"),
    source: source("gate-presence", 12),
  })
}

export type StaffingRole = "manager" | "scheduler" | "practitioner"

export function capabilitiesForStaffingRole(role: StaffingRole): StaffingCapability[] {
  if (role === "manager") return [...managerCapabilities]
  if (role === "scheduler") {
    return [
      "staffing.view",
      "staffing.manage_rota",
      "staffing.manage_absence",
      "staffing.manage_cover",
      "staffing.audit",
    ]
  }
  return ["staffing.view"]
}

export function projectStaffingForRole(
  plan: StaffingPlan,
  role: StaffingRole,
  viewerStaffId = "staff-amina",
) {
  const capabilities = capabilitiesForStaffingRole(role)
  const canSeePrivate = capabilities.includes("staffing.view_private_absence")
  const rooms = plan.rooms.map((room) => {
    const projection = projectRoomStaffing(plan, room.id)
    return role === "practitioner"
      ? {
          ...projection,
          contributions: projection.contributions.map((entry) => ({
            ...entry,
            displayName: entry.staffId === viewerStaffId ? "You" : entry.roleLabel,
          })),
        }
      : projection
  })
  const absences = plan.absences
    .filter((absence) => role !== "practitioner" || absence.staffId === viewerStaffId)
    .map((absence) => ({
      ...absence,
      privateReason: canSeePrivate ? absence.privateReason : undefined,
    }))
  const staff =
    role === "practitioner"
      ? plan.staff.filter((member) => member.id === viewerStaffId)
      : plan.staff
  const candidates =
    role === "practitioner"
      ? []
      : projectCoverCandidates(plan, "room-meadow", {
          startsAt: "2026-08-04T10:20:00.000Z",
          endsAt: "2026-08-04T16:00:00.000Z",
        })
  return {
    status: deriveStaffingPlanStatus(plan),
    revision: plan.revision,
    sourceChanged: plan.sourceChanged,
    rooms,
    staff,
    absences,
    candidates,
    breaks: role === "practitioner"
      ? plan.breaks.filter((entry) => entry.staffId === viewerStaffId)
      : plan.breaks,
    shifts: role === "practitioner"
      ? plan.shifts.filter((shift) => shift.staffId === viewerStaffId)
      : plan.shifts,
    events: capabilities.includes("staffing.audit") ? plan.events : [],
  }
}
