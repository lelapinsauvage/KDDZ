export type HandoverObligationState = "UNKNOWN" | "OPEN" | "RESOLVED" | "CARRIED"
export type HandoverConsequence = "BLOCKS_CLOSE" | "CARRY_ALLOWED" | "INFORMATION"

export type HandoverObligation = {
  id: string
  kind: "ATTENDANCE" | "CARE" | "SAFETY" | "COMMUNICATION" | "STAFFING" | "EVIDENCE"
  title: string
  detail: string
  path: string
  state: HandoverObligationState
  consequence: HandoverConsequence
  sourceId: string
  sourceRevision: number
  ownerId: string
  carriedToOwnerId: string | null
  carryReason: string | null
}

export type HandoverEvent = {
  eventId: string
  idempotencyKey: string
  kind: "RESOLVED" | "CARRIED" | "ACKNOWLEDGED" | "CLOSED"
  obligationId: string | null
  actorId: string
  occurredAt: string
  sourceRevision: number | null
  detail: string
  commandSignature: string
}

export type HandoverSession = {
  sessionId: string
  organizationId: string
  branchId: string
  roomId: string
  localDate: string
  timeZone: string
  period: "LUNCH" | "CLOSING"
  status: "OPEN" | "CLOSED"
  revision: number
  obligations: readonly HandoverObligation[]
  events: readonly HandoverEvent[]
  incomingAcknowledgedByIds: readonly string[]
  closedAt: string | null
  closedById: string | null
}

export type HandoverProjection = {
  status: "UNKNOWN" | "BLOCKED" | "READY_WITH_CARRY" | "AWAITING_ACKNOWLEDGMENT" | "READY_TO_CLOSE" | "CLOSED"
  openCount: number
  blockingCount: number
  carryCount: number
  carriedCount: number
  acknowledgedCarryCount: number
  primaryReason: string
  unresolved: HandoverObligation[]
}

type CommandBase = {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedRevision: number
  actorCapabilities: readonly string[]
}

export type ResolveHandoverCommand = CommandBase & {
  obligationId: string
  expectedSourceRevision: number
  acceptedSourceRevision: number
}

export type CarryHandoverCommand = CommandBase & {
  obligationId: string
  expectedSourceRevision: number
  incomingOwnerId: string
  reason: string
}

export type AcknowledgeHandoverCommand = CommandBase & {
  incomingOwnerId: string
}

export type CloseHandoverCommand = CommandBase & {
  expectedSourceRevisions: Readonly<Record<string, number>>
}

function requireText(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required`)
}

function requireTimestamp(value: string, label: string) {
  requireText(value, label)
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} must be a valid timestamp`)
}

function requireCapability(capabilities: readonly string[], capability: string) {
  if (!capabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`)
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableValue(item)]),
    )
  }
  return value
}

function commandSignature(command: CommandBase) {
  return JSON.stringify(stableValue(command))
}

function existingEvent(session: HandoverSession, command: CommandBase) {
  const duplicate = session.events.find((event) => event.idempotencyKey === command.idempotencyKey)
  if (!duplicate) return null
  if (duplicate.commandSignature !== commandSignature(command)) {
    throw new Error("Handover idempotency key was reused with different input")
  }
  return duplicate
}

function appendEvent(
  session: HandoverSession,
  command: CommandBase,
  event: Omit<HandoverEvent, "eventId" | "idempotencyKey" | "actorId" | "occurredAt" | "commandSignature">,
) {
  requireText(command.eventId, "Event id")
  requireText(command.idempotencyKey, "Idempotency key")
  requireText(command.actorId, "Actor id")
  requireTimestamp(command.occurredAt, "Occurred at")
  if (command.expectedRevision !== session.revision) throw new Error("Handover session revision conflict")
  if (session.events.some((item) => item.eventId === command.eventId)) throw new Error("Handover event id already exists")

  return {
    ...session,
    revision: session.revision + 1,
    events: [...session.events, {
      eventId: command.eventId,
      idempotencyKey: command.idempotencyKey,
      actorId: command.actorId,
      occurredAt: command.occurredAt,
      ...event,
      commandSignature: commandSignature(command),
    }],
  } as HandoverSession
}

export function projectHandover(session: HandoverSession): HandoverProjection {
  const unresolved = session.obligations.filter((obligation) => obligation.state !== "RESOLVED")
  const unknown = unresolved.filter((obligation) => obligation.state === "UNKNOWN")
  const blockers = unresolved.filter((obligation) => obligation.consequence === "BLOCKS_CLOSE")
  const carryOpen = unresolved.filter((obligation) => obligation.consequence === "CARRY_ALLOWED" && obligation.state === "OPEN")
  const carried = unresolved.filter((obligation) => obligation.state === "CARRIED")
  const acknowledged = carried.filter((obligation) =>
    Boolean(obligation.carriedToOwnerId) && session.incomingAcknowledgedByIds.includes(obligation.carriedToOwnerId ?? ""),
  )

  let status: HandoverProjection["status"] = "READY_TO_CLOSE"
  let primaryReason = "All close requirements are confirmed"
  if (session.status === "CLOSED") {
    status = "CLOSED"
    primaryReason = `Closed with ${carried.length} carried obligation${carried.length === 1 ? "" : "s"}`
  } else if (unknown.length) {
    status = "UNKNOWN"
    primaryReason = unknown[0].title
  } else if (blockers.length) {
    status = "BLOCKED"
    primaryReason = blockers[0].title
  } else if (carryOpen.length) {
    status = "READY_WITH_CARRY"
    primaryReason = `${carryOpen.length} obligation${carryOpen.length === 1 ? "" : "s"} need an incoming owner`
  } else if (carried.length > acknowledged.length) {
    status = "AWAITING_ACKNOWLEDGMENT"
    primaryReason = `${carried.length - acknowledged.length} carried obligation${carried.length - acknowledged.length === 1 ? "" : "s"} await acknowledgment`
  }

  return {
    status,
    openCount: unresolved.length,
    blockingCount: blockers.length,
    carryCount: carryOpen.length,
    carriedCount: carried.length,
    acknowledgedCarryCount: acknowledged.length,
    primaryReason,
    unresolved,
  }
}

export function resolveHandoverObligation(session: HandoverSession, command: ResolveHandoverCommand) {
  if (existingEvent(session, command)) return session
  requireCapability(command.actorCapabilities, "handover.resolve")
  if (session.status === "CLOSED") throw new Error("Closed handover cannot be changed")
  const obligation = session.obligations.find((item) => item.id === command.obligationId)
  if (!obligation) throw new Error("Handover obligation was not found")
  if (obligation.state === "RESOLVED") throw new Error("Handover obligation is already resolved")
  if (obligation.sourceRevision !== command.expectedSourceRevision) throw new Error("Handover source revision conflict")
  if (!Number.isInteger(command.acceptedSourceRevision) || command.acceptedSourceRevision < command.expectedSourceRevision) {
    throw new Error("Accepted handover source revision is invalid")
  }
  const updated = appendEvent(session, command, {
    kind: "RESOLVED",
    obligationId: obligation.id,
    sourceRevision: command.acceptedSourceRevision,
    detail: `${obligation.title} resolved from source revision ${command.acceptedSourceRevision}`,
  })
  return {
    ...updated,
    obligations: updated.obligations.map((item) => item.id === obligation.id
      ? { ...item, state: "RESOLVED" as const, sourceRevision: command.acceptedSourceRevision }
      : item),
  }
}

export function carryHandoverObligation(session: HandoverSession, command: CarryHandoverCommand) {
  if (existingEvent(session, command)) return session
  requireCapability(command.actorCapabilities, "handover.carry")
  requireText(command.incomingOwnerId, "Incoming owner")
  requireText(command.reason, "Carry reason")
  if (session.status === "CLOSED") throw new Error("Closed handover cannot be changed")
  const obligation = session.obligations.find((item) => item.id === command.obligationId)
  if (!obligation) throw new Error("Handover obligation was not found")
  if (obligation.consequence !== "CARRY_ALLOWED" || obligation.state !== "OPEN") {
    throw new Error("Handover obligation cannot be carried")
  }
  if (obligation.sourceRevision !== command.expectedSourceRevision) throw new Error("Handover source revision conflict")
  const updated = appendEvent(session, command, {
    kind: "CARRIED",
    obligationId: obligation.id,
    sourceRevision: obligation.sourceRevision,
    detail: `${obligation.title} carried to ${command.incomingOwnerId}: ${command.reason.trim()}`,
  })
  return {
    ...updated,
    obligations: updated.obligations.map((item) => item.id === obligation.id
      ? { ...item, state: "CARRIED" as const, carriedToOwnerId: command.incomingOwnerId, carryReason: command.reason.trim() }
      : item),
  }
}

export function acknowledgeHandover(session: HandoverSession, command: AcknowledgeHandoverCommand) {
  if (existingEvent(session, command)) return session
  requireCapability(command.actorCapabilities, "handover.acknowledge")
  requireText(command.incomingOwnerId, "Incoming owner")
  const assigned = session.obligations.some((obligation) =>
    obligation.state === "CARRIED" && obligation.carriedToOwnerId === command.incomingOwnerId,
  )
  if (!assigned) throw new Error("Incoming owner has no carried obligation")
  if (session.incomingAcknowledgedByIds.includes(command.incomingOwnerId)) {
    throw new Error("Incoming owner already acknowledged handover")
  }
  const updated = appendEvent(session, command, {
    kind: "ACKNOWLEDGED",
    obligationId: null,
    sourceRevision: null,
    detail: `${command.incomingOwnerId} acknowledged carried obligations`,
  })
  return {
    ...updated,
    incomingAcknowledgedByIds: [...updated.incomingAcknowledgedByIds, command.incomingOwnerId],
  }
}

export function closeHandover(session: HandoverSession, command: CloseHandoverCommand) {
  if (existingEvent(session, command)) return session
  requireCapability(command.actorCapabilities, "handover.close")
  if (projectHandover(session).status !== "READY_TO_CLOSE") throw new Error("Handover is not ready to close")
  for (const obligation of session.obligations) {
    if (command.expectedSourceRevisions[obligation.sourceId] !== obligation.sourceRevision) {
      throw new Error("Handover close source revision conflict")
    }
  }
  const updated = appendEvent(session, command, {
    kind: "CLOSED",
    obligationId: null,
    sourceRevision: null,
    detail: "Handover closed from confirmed source revisions",
  })
  return { ...updated, status: "CLOSED" as const, closedAt: command.occurredAt, closedById: command.actorId }
}

export function createHandoverFixture(): HandoverSession {
  return {
    sessionId: "handover-riverside-lunch",
    organizationId: "org-kiddz-fixture",
    branchId: "branch-riverside",
    roomId: "room-meadow",
    localDate: "2026-07-14",
    timeZone: "Europe/London",
    period: "LUNCH",
    status: "OPEN",
    revision: 0,
    obligations: [
      {
        id: "attendance-alma",
        kind: "ATTENDANCE",
        title: "Confirm Alma's attendance",
        detail: "Arrival remains unknown, so room evidence is provisional.",
        path: "Today / Meadow / Attendance / Alma Reyes",
        state: "UNKNOWN",
        consequence: "BLOCKS_CLOSE",
        sourceId: "attendance-session-meadow",
        sourceRevision: 3,
        ownerId: "staff-lina",
        carriedToOwnerId: null,
        carryReason: null,
      },
      {
        id: "care-meadow",
        kind: "CARE",
        title: "Submit two Meadow care reports",
        detail: "Two draft reports are saved but not submitted.",
        path: "Children / Care incomplete / Meadow",
        state: "OPEN",
        consequence: "BLOCKS_CLOSE",
        sourceId: "care-session-meadow",
        sourceRevision: 4,
        ownerId: "staff-lina",
        carriedToOwnerId: null,
        carryReason: null,
      },
      {
        id: "reply-theo",
        kind: "COMMUNICATION",
        title: "Reply to Theo's parent",
        detail: "The lunch preference question can continue with the incoming room lead.",
        path: "Messages / Needs reply / Martin family",
        state: "OPEN",
        consequence: "CARRY_ALLOWED",
        sourceId: "thread-martin-lunch",
        sourceRevision: 2,
        ownerId: "staff-lina",
        carriedToOwnerId: null,
        carryReason: null,
      },
    ],
    events: [],
    incomingAcknowledgedByIds: [],
    closedAt: null,
    closedById: null,
  }
}
