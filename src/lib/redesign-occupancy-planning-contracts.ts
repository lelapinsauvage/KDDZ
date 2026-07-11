export type OccupancyCapability =
  | "occupancy.view"
  | "occupancy.configure"
  | "occupancy.manage_requests"
  | "occupancy.manage_bookings"
  | "occupancy.manage_blocks"
  | "occupancy.view_funding"
  | "occupancy.audit"

export type OccupancyPlanStatus =
  | "SOURCE_GAP"
  | "CAPACITY_CONFLICT"
  | "BLOCK_REVIEW"
  | "AVAILABLE"
  | "REQUEST_REVIEW"
  | "HOLD_ACTIVE"
  | "HOLD_EXPIRED"
  | "BOOKING_CONFIRMED"
  | "SOURCE_CHANGED"

export type OccupancyFixtureStage =
  | "source-gap"
  | "capacity-conflict"
  | "block-review"
  | "available"
  | "request-review"
  | "hold-active"
  | "hold-expired"
  | "booking-confirmed"
  | "source-changed"

export interface PlanningSourceRevision {
  sourceId: string
  revision: number
}

export interface RoomCapacityInput {
  roomId: string
  roomLabel: string
  physicalCapacity?: number
  policyCapacity?: number
  staffingCapacity?: number
  physicalSource?: PlanningSourceRevision
  policySource?: PlanningSourceRevision
  staffingSource?: PlanningSourceRevision
}

export interface PlaceBooking {
  id: string
  childId: string
  childDisplayName: string
  roomId: string
  sessionId: string
  status: "CONFIRMED" | "CANCELLED"
  sourceRevision: number
  provenance: "IMPORTED_ROSTER" | "CONFIRMED_BOOKING"
  createdAt: string
  cancelledAt?: string
  cancellationReason?: string
}

export interface CapacityBlock {
  id: string
  roomId: string
  sessionId: string
  places: number
  reason: string
  sourceKind: "STAFFING" | "FACILITY" | "SAFEGUARDING" | "OPERATOR"
  ownerId: string
  startsAt: string
  expiresAt: string
  status: "ACTIVE" | "RELEASED"
  sourceRevision: number
  releasedAt?: string
  releaseReason?: string
}

export interface PlaceRequest {
  id: string
  familyDisplayName: string
  childDisplayName: string
  roomId: string
  sessionId: string
  requestedAt: string
  requestedStartDate: string
  status: "NEW" | "HELD" | "CONFIRMED" | "DECLINED"
  sourceRevision: number
}

export interface BookingHold {
  id: string
  requestId: string
  roomId: string
  sessionId: string
  places: number
  status: "ACTIVE" | "EXPIRED" | "CONSUMED"
  sourceRevision: number
  createdAt: string
  expiresAt: string
  consumedAt?: string
}

export interface OccupancyHourLedger {
  childId: string
  period: string
  bookedMinutes: number
  attendedMinutes?: number
  fundedClaimMinutes?: number
  invoicedMinutes?: number
  bookedSource: PlanningSourceRevision
  attendedSource?: PlanningSourceRevision
  fundedSource?: PlanningSourceRevision
  invoicedSource?: PlanningSourceRevision
}

export interface LiveRoomObservation {
  roomId: string
  sessionId: string
  presentChildren?: number
  observedAt?: string
  source?: PlanningSourceRevision
}

export interface OccupancyPlanEvent {
  eventId: string
  idempotencyKey: string
  fingerprint: string
  kind:
    | "SOURCES_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "BLOCK_RELEASED"
    | "REQUEST_CREATED"
    | "PLACE_HELD"
    | "HOLD_EXPIRED"
    | "BOOKING_CONFIRMED"
    | "SOURCE_CHANGED"
    | "PLAN_REFRESHED"
  actorId: string
  occurredAt: string
  detail: string
  resultingRevision: number
}

export interface OccupancyPlan {
  id: string
  branch: { id: string; label: string }
  planningDate: string
  session: { id: string; label: string; startsAt: string; endsAt: string }
  revision: number
  sourcesTrusted: boolean
  sourceSnapshot: PlanningSourceRevision[]
  sourceChanged: boolean
  rooms: RoomCapacityInput[]
  bookings: PlaceBooking[]
  blocks: CapacityBlock[]
  requests: PlaceRequest[]
  holds: BookingHold[]
  hourLedgers: OccupancyHourLedger[]
  liveObservations: LiveRoomObservation[]
  downstreamProjections: Array<{
    bookingId: string
    expectedAttendanceId: string
    billingInputId: string
    createdAt: string
  }>
  events: OccupancyPlanEvent[]
}

export interface OccupancyCommand {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedRevision: number
  actorCapabilities: readonly OccupancyCapability[]
}

export interface RoomOccupancyProjection {
  roomId: string
  roomLabel: string
  configured: boolean
  physicalCapacity?: number
  policyCapacity?: number
  staffingCapacity?: number
  blockedPlaces: number
  effectiveCapacity?: number
  confirmedBookings: number
  activeHolds: number
  sellablePlaces?: number
  conflictPlaces: number
  livePresent?: number
  liveState: "OBSERVED" | "UNKNOWN"
  bookedUtilizationPercent?: number
  sources: PlanningSourceRevision[]
}

const managerCapabilities: OccupancyCapability[] = [
  "occupancy.view",
  "occupancy.configure",
  "occupancy.manage_requests",
  "occupancy.manage_bookings",
  "occupancy.manage_blocks",
  "occupancy.view_funding",
  "occupancy.audit",
]

function fingerprint(command: object) {
  return JSON.stringify(command)
}

function beginCommand(
  plan: OccupancyPlan,
  command: OccupancyCommand,
  capability: OccupancyCapability,
) {
  const commandFingerprint = fingerprint(command)
  const existing = plan.events.find((event) => event.idempotencyKey === command.idempotencyKey)
  if (existing) {
    if (existing.fingerprint !== commandFingerprint) throw new Error("Idempotency key reused with different input")
    return { repeated: true, fingerprint: commandFingerprint }
  }
  if (!command.actorCapabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`)
  if (plan.revision !== command.expectedRevision) {
    throw new Error(`Occupancy plan revision conflict: expected ${command.expectedRevision}, found ${plan.revision}`)
  }
  return { repeated: false, fingerprint: commandFingerprint }
}

function appendEvent(
  plan: OccupancyPlan,
  command: OccupancyCommand,
  event: Pick<OccupancyPlanEvent, "kind" | "detail">,
  commandFingerprint: string,
  patch: Partial<OccupancyPlan>,
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

function activeHold(hold: BookingHold, now: string) {
  return hold.status === "ACTIVE" && new Date(hold.expiresAt).getTime() > new Date(now).getTime()
}

function activeBlock(block: CapacityBlock, plan: OccupancyPlan, now: string) {
  return (
    block.status === "ACTIVE" &&
    block.sessionId === plan.session.id &&
    new Date(block.startsAt).getTime() <= new Date(now).getTime() &&
    new Date(block.expiresAt).getTime() > new Date(now).getTime()
  )
}

function roomSources(room: RoomCapacityInput) {
  return [room.physicalSource, room.policySource, room.staffingSource].filter(
    (source): source is PlanningSourceRevision => Boolean(source),
  )
}

function mergeSourceSnapshots(
  previous: PlanningSourceRevision[],
  incoming: PlanningSourceRevision[],
) {
  const sources = new Map(previous.map((source) => [source.sourceId, source]))
  for (const source of incoming) sources.set(source.sourceId, source)
  return [...sources.values()]
}

export function projectRoomOccupancy(
  plan: OccupancyPlan,
  roomId: string,
  now = "2026-08-01T08:00:00+01:00",
): RoomOccupancyProjection {
  const room = plan.rooms.find((item) => item.roomId === roomId)
  if (!room) throw new Error("Room is outside this occupancy plan")
  const configured =
    plan.sourcesTrusted &&
    room.physicalCapacity !== undefined &&
    room.policyCapacity !== undefined &&
    room.staffingCapacity !== undefined &&
    roomSources(room).length === 3
  const confirmedBookings = plan.bookings.filter(
    (booking) =>
      booking.roomId === roomId && booking.sessionId === plan.session.id && booking.status === "CONFIRMED",
  ).length
  const activeHolds = plan.holds
    .filter((hold) => hold.roomId === roomId && hold.sessionId === plan.session.id && activeHold(hold, now))
    .reduce((sum, hold) => sum + hold.places, 0)
  const blockedPlaces = plan.blocks
    .filter((block) => block.roomId === roomId && activeBlock(block, plan, now))
    .reduce((sum, block) => sum + block.places, 0)
  const baseCapacity = configured
    ? Math.min(room.physicalCapacity!, room.policyCapacity!, room.staffingCapacity!)
    : undefined
  const effectiveCapacity = baseCapacity === undefined ? undefined : Math.max(0, baseCapacity - blockedPlaces)
  const conflictPlaces = effectiveCapacity === undefined ? 0 : Math.max(0, confirmedBookings - effectiveCapacity)
  const sellablePlaces =
    effectiveCapacity === undefined
      ? undefined
      : Math.max(0, effectiveCapacity - confirmedBookings - activeHolds)
  const live = plan.liveObservations.find(
    (observation) => observation.roomId === roomId && observation.sessionId === plan.session.id,
  )
  return {
    roomId,
    roomLabel: room.roomLabel,
    configured,
    physicalCapacity: room.physicalCapacity,
    policyCapacity: room.policyCapacity,
    staffingCapacity: room.staffingCapacity,
    blockedPlaces,
    effectiveCapacity,
    confirmedBookings,
    activeHolds,
    sellablePlaces,
    conflictPlaces,
    livePresent: live?.presentChildren,
    liveState: live?.presentChildren === undefined || !live.source ? "UNKNOWN" : "OBSERVED",
    bookedUtilizationPercent:
      effectiveCapacity && effectiveCapacity > 0
        ? Math.round((confirmedBookings / effectiveCapacity) * 100)
        : undefined,
    sources: roomSources(room),
  }
}

function activeRequest(plan: OccupancyPlan) {
  return [...plan.requests].reverse().find((request) => request.status !== "DECLINED")
}

export function occupancyPlanStatus(
  plan: OccupancyPlan,
  now = "2026-08-01T08:00:00+01:00",
): OccupancyPlanStatus {
  if (plan.sourceChanged) return "SOURCE_CHANGED"
  const projections = plan.rooms.map((room) => projectRoomOccupancy(plan, room.roomId, now))
  if (projections.some((projection) => !projection.configured)) return "SOURCE_GAP"
  if (projections.some((projection) => projection.conflictPlaces > 0)) return "CAPACITY_CONFLICT"
  if (plan.blocks.some((block) => activeBlock(block, plan, now))) return "BLOCK_REVIEW"
  const request = activeRequest(plan)
  if (!request) return "AVAILABLE"
  if (request.status === "CONFIRMED") return "BOOKING_CONFIRMED"
  if (request.status === "HELD") {
    const hold = [...plan.holds].reverse().find((item) => item.requestId === request.id)
    return hold && activeHold(hold, now) ? "HOLD_ACTIVE" : "HOLD_EXPIRED"
  }
  return "REQUEST_REVIEW"
}

export function confirmOccupancySources(
  plan: OccupancyPlan,
  command: OccupancyCommand & {
    roomId: string
    physicalCapacity: number
    policyCapacity: number
    staffingCapacity: number
    sourceSnapshot: PlanningSourceRevision[]
  },
) {
  const started = beginCommand(plan, command, "occupancy.configure")
  if (started.repeated) return plan
  if ([command.physicalCapacity, command.policyCapacity, command.staffingCapacity].some((value) => value <= 0)) {
    throw new Error("All capacity inputs must be positive")
  }
  if (command.sourceSnapshot.length < 3) throw new Error("Physical, policy, and staffing sources are required")
  const [physicalSource, policySource, staffingSource] = command.sourceSnapshot
  const rooms = plan.rooms.map((room) =>
    room.roomId === command.roomId
      ? {
          ...room,
          physicalCapacity: command.physicalCapacity,
          policyCapacity: command.policyCapacity,
          staffingCapacity: command.staffingCapacity,
          physicalSource,
          policySource,
          staffingSource,
        }
      : room,
  )
  if (!rooms.some((room) => room.roomId === command.roomId)) throw new Error("Room is outside this occupancy plan")
  const sourcesTrusted = rooms.every(
    (room) =>
      room.physicalCapacity !== undefined &&
      room.policyCapacity !== undefined &&
      room.staffingCapacity !== undefined &&
      roomSources(room).length === 3,
  )
  const sourceSnapshot = mergeSourceSnapshots(plan.sourceSnapshot, command.sourceSnapshot)
  return appendEvent(
    plan,
    command,
    { kind: "SOURCES_CONFIRMED", detail: `Planning inputs confirmed for ${command.roomId}` },
    started.fingerprint,
    { rooms, sourcesTrusted, sourceSnapshot, sourceChanged: false },
  )
}

export function cancelConflictingBooking(
  plan: OccupancyPlan,
  command: OccupancyCommand & { bookingId: string; expectedSourceRevision: number; reason: string },
) {
  const started = beginCommand(plan, command, "occupancy.manage_bookings")
  if (started.repeated) return plan
  const booking = plan.bookings.find((item) => item.id === command.bookingId)
  if (!booking || booking.status !== "CONFIRMED") throw new Error("Confirmed booking not found")
  if (booking.sourceRevision !== command.expectedSourceRevision) throw new Error("Booking source revision changed")
  if (!command.reason.trim()) throw new Error("Cancellation reason is required")
  const bookings = plan.bookings.map((item) =>
    item.id === booking.id
      ? {
          ...item,
          status: "CANCELLED" as const,
          sourceRevision: item.sourceRevision + 1,
          cancelledAt: command.occurredAt,
          cancellationReason: command.reason,
        }
      : item,
  )
  return appendEvent(
    plan,
    command,
    { kind: "BOOKING_CANCELLED", detail: `${booking.id}: ${command.reason}` },
    started.fingerprint,
    { bookings },
  )
}

export function releaseCapacityBlock(
  plan: OccupancyPlan,
  command: OccupancyCommand & { blockId: string; expectedSourceRevision: number; reason: string },
) {
  const started = beginCommand(plan, command, "occupancy.manage_blocks")
  if (started.repeated) return plan
  const block = plan.blocks.find((item) => item.id === command.blockId)
  if (!block || block.status !== "ACTIVE") throw new Error("Active capacity block not found")
  if (block.sourceRevision !== command.expectedSourceRevision) throw new Error("Capacity block source revision changed")
  if (!command.reason.trim()) throw new Error("Block release reason is required")
  const blocks = plan.blocks.map((item) =>
    item.id === block.id
      ? {
          ...item,
          status: "RELEASED" as const,
          sourceRevision: item.sourceRevision + 1,
          releasedAt: command.occurredAt,
          releaseReason: command.reason,
        }
      : item,
  )
  return appendEvent(
    plan,
    command,
    { kind: "BLOCK_RELEASED", detail: `${block.id}: ${command.reason}` },
    started.fingerprint,
    { blocks },
  )
}

export function createPlaceRequest(
  plan: OccupancyPlan,
  command: OccupancyCommand & {
    requestId: string
    familyDisplayName: string
    childDisplayName: string
    roomId: string
    requestedStartDate: string
  },
) {
  const started = beginCommand(plan, command, "occupancy.manage_requests")
  if (started.repeated) return plan
  if (occupancyPlanStatus(plan, command.occurredAt) !== "AVAILABLE") {
    throw new Error("Place requests require a current available plan")
  }
  const room = projectRoomOccupancy(plan, command.roomId, command.occurredAt)
  if (!room.sellablePlaces) throw new Error("No sellable place is available for this room and session")
  if (!command.familyDisplayName.trim() || !command.childDisplayName.trim()) {
    throw new Error("Family and child identity are required")
  }
  const request: PlaceRequest = {
    id: command.requestId,
    familyDisplayName: command.familyDisplayName,
    childDisplayName: command.childDisplayName,
    roomId: command.roomId,
    sessionId: plan.session.id,
    requestedAt: command.occurredAt,
    requestedStartDate: command.requestedStartDate,
    status: "NEW",
    sourceRevision: 1,
  }
  return appendEvent(
    plan,
    command,
    { kind: "REQUEST_CREATED", detail: `${command.requestId} requests ${command.roomId}` },
    started.fingerprint,
    { requests: [...plan.requests, request] },
  )
}

export function holdRequestedPlace(
  plan: OccupancyPlan,
  command: OccupancyCommand & {
    requestId: string
    expectedRequestRevision: number
    expectedRoomSources: PlanningSourceRevision[]
    holdId: string
    expiresAt: string
  },
) {
  const started = beginCommand(plan, command, "occupancy.manage_bookings")
  if (started.repeated) return plan
  if (plan.sourceChanged) throw new Error("Planning sources changed; refresh before holding a place")
  const request = plan.requests.find((item) => item.id === command.requestId)
  if (!request || request.status !== "NEW") throw new Error("New place request not found")
  if (request.sourceRevision !== command.expectedRequestRevision) throw new Error("Place request revision changed")
  const room = projectRoomOccupancy(plan, request.roomId, command.occurredAt)
  if (!room.sellablePlaces) throw new Error("No sellable place remains")
  if (fingerprint(room.sources) !== fingerprint(command.expectedRoomSources)) throw new Error("Room capacity sources changed")
  if (new Date(command.expiresAt).getTime() <= new Date(command.occurredAt).getTime()) {
    throw new Error("Place hold must expire in the future")
  }
  const requests = plan.requests.map((item) =>
    item.id === request.id ? { ...item, status: "HELD" as const, sourceRevision: item.sourceRevision + 1 } : item,
  )
  const hold: BookingHold = {
    id: command.holdId,
    requestId: request.id,
    roomId: request.roomId,
    sessionId: request.sessionId,
    places: 1,
    status: "ACTIVE",
    sourceRevision: 1,
    createdAt: command.occurredAt,
    expiresAt: command.expiresAt,
  }
  return appendEvent(
    plan,
    command,
    { kind: "PLACE_HELD", detail: `${hold.id} reserves one place until ${hold.expiresAt}` },
    started.fingerprint,
    { requests, holds: [...plan.holds, hold] },
  )
}

export function expirePlaceHold(
  plan: OccupancyPlan,
  command: OccupancyCommand & { holdId: string; expectedHoldRevision: number },
) {
  const started = beginCommand(plan, command, "occupancy.audit")
  if (started.repeated) return plan
  const hold = plan.holds.find((item) => item.id === command.holdId)
  if (!hold || hold.status !== "ACTIVE") throw new Error("Active place hold not found")
  if (hold.sourceRevision !== command.expectedHoldRevision) throw new Error("Place hold revision changed")
  if (new Date(hold.expiresAt).getTime() > new Date(command.occurredAt).getTime()) {
    throw new Error("Place hold has not expired")
  }
  const holds = plan.holds.map((item) =>
    item.id === hold.id ? { ...item, status: "EXPIRED" as const, sourceRevision: item.sourceRevision + 1 } : item,
  )
  return appendEvent(
    plan,
    command,
    { kind: "HOLD_EXPIRED", detail: `${hold.id} expired without creating a booking` },
    started.fingerprint,
    { holds },
  )
}

export function renewExpiredPlaceHold(
  plan: OccupancyPlan,
  command: OccupancyCommand & {
    requestId: string
    expiredHoldId: string
    expectedHoldRevision: number
    holdId: string
    expiresAt: string
    expectedRoomSources: PlanningSourceRevision[]
  },
) {
  const started = beginCommand(plan, command, "occupancy.manage_bookings")
  if (started.repeated) return plan
  if (plan.sourceChanged) throw new Error("Planning sources changed; refresh before renewing a place hold")
  const request = plan.requests.find((item) => item.id === command.requestId)
  const expired = plan.holds.find((item) => item.id === command.expiredHoldId)
  if (!request || request.status !== "HELD" || !expired || expired.status !== "EXPIRED") {
    throw new Error("Expired request hold not found")
  }
  if (expired.sourceRevision !== command.expectedHoldRevision) throw new Error("Place hold revision changed")
  const room = projectRoomOccupancy(plan, request.roomId, command.occurredAt)
  if (!room.sellablePlaces) throw new Error("No sellable place remains")
  if (fingerprint(room.sources) !== fingerprint(command.expectedRoomSources)) throw new Error("Room capacity sources changed")
  if (new Date(command.expiresAt).getTime() <= new Date(command.occurredAt).getTime()) {
    throw new Error("Place hold must expire in the future")
  }
  const requests = plan.requests.map((item) =>
    item.id === request.id ? { ...item, sourceRevision: item.sourceRevision + 1 } : item,
  )
  const hold: BookingHold = {
    id: command.holdId,
    requestId: request.id,
    roomId: request.roomId,
    sessionId: request.sessionId,
    places: 1,
    status: "ACTIVE",
    sourceRevision: 1,
    createdAt: command.occurredAt,
    expiresAt: command.expiresAt,
  }
  return appendEvent(
    plan,
    command,
    { kind: "PLACE_HELD", detail: `${hold.id} renews one place until ${hold.expiresAt}` },
    started.fingerprint,
    { requests, holds: [...plan.holds, hold] },
  )
}

export function confirmPlaceBooking(
  plan: OccupancyPlan,
  command: OccupancyCommand & {
    requestId: string
    expectedRequestRevision: number
    holdId: string
    expectedHoldRevision: number
    expectedRoomSources: PlanningSourceRevision[]
    bookingId: string
    childId: string
    expectedAttendanceId: string
    billingInputId: string
  },
) {
  const started = beginCommand(plan, command, "occupancy.manage_bookings")
  if (started.repeated) return plan
  if (plan.sourceChanged) throw new Error("Planning sources changed; refresh before confirming a booking")
  const request = plan.requests.find((item) => item.id === command.requestId)
  const hold = plan.holds.find((item) => item.id === command.holdId)
  if (!request || request.status !== "HELD") throw new Error("Held place request not found")
  if (!hold || hold.status !== "ACTIVE" || !activeHold(hold, command.occurredAt)) {
    throw new Error("An active unexpired place hold is required")
  }
  if (request.sourceRevision !== command.expectedRequestRevision) throw new Error("Place request revision changed")
  if (hold.sourceRevision !== command.expectedHoldRevision) throw new Error("Place hold revision changed")
  const room = projectRoomOccupancy(plan, request.roomId, command.occurredAt)
  if (fingerprint(room.sources) !== fingerprint(command.expectedRoomSources)) throw new Error("Room capacity sources changed")
  const requests = plan.requests.map((item) =>
    item.id === request.id ? { ...item, status: "CONFIRMED" as const, sourceRevision: item.sourceRevision + 1 } : item,
  )
  const holds = plan.holds.map((item) =>
    item.id === hold.id
      ? { ...item, status: "CONSUMED" as const, sourceRevision: item.sourceRevision + 1, consumedAt: command.occurredAt }
      : item,
  )
  const booking: PlaceBooking = {
    id: command.bookingId,
    childId: command.childId,
    childDisplayName: request.childDisplayName,
    roomId: request.roomId,
    sessionId: request.sessionId,
    status: "CONFIRMED",
    sourceRevision: 1,
    provenance: "CONFIRMED_BOOKING",
    createdAt: command.occurredAt,
  }
  return appendEvent(
    plan,
    command,
    { kind: "BOOKING_CONFIRMED", detail: `${booking.id} created from ${request.id} and ${hold.id}` },
    started.fingerprint,
    {
      requests,
      holds,
      bookings: [...plan.bookings, booking],
      downstreamProjections: [
        ...plan.downstreamProjections,
        {
          bookingId: booking.id,
          expectedAttendanceId: command.expectedAttendanceId,
          billingInputId: command.billingInputId,
          createdAt: command.occurredAt,
        },
      ],
    },
  )
}

export function markOccupancySourceChanged(
  plan: OccupancyPlan,
  command: OccupancyCommand & { sourceId: string; nextRevision: number },
) {
  const started = beginCommand(plan, command, "occupancy.audit")
  if (started.repeated) return plan
  const source = plan.sourceSnapshot.find((item) => item.sourceId === command.sourceId)
  if (!source || command.nextRevision <= source.revision) throw new Error("Source change must advance a tracked revision")
  return appendEvent(
    plan,
    command,
    { kind: "SOURCE_CHANGED", detail: `${command.sourceId} advanced to revision ${command.nextRevision}` },
    started.fingerprint,
    { sourceChanged: true },
  )
}

export function refreshOccupancyPlan(
  plan: OccupancyPlan,
  command: OccupancyCommand & { sourceSnapshot: PlanningSourceRevision[] },
) {
  const started = beginCommand(plan, command, "occupancy.configure")
  if (started.repeated) return plan
  if (!plan.sourceChanged) throw new Error("Occupancy plan sources are already current")
  if (!command.sourceSnapshot.length) throw new Error("A fresh source snapshot is required")
  const sourceMap = new Map(command.sourceSnapshot.map((source) => [source.sourceId, source]))
  for (const previous of plan.sourceSnapshot) {
    const current = sourceMap.get(previous.sourceId)
    if (!current || current.revision < previous.revision) {
      throw new Error("Fresh source snapshot must preserve every tracked source without revision rollback")
    }
  }
  const advanced = plan.sourceSnapshot.some(
    (previous) => (sourceMap.get(previous.sourceId)?.revision ?? previous.revision) > previous.revision,
  )
  if (!advanced) throw new Error("Fresh source snapshot must advance the changed source")
  const replaceSource = (source: PlanningSourceRevision | undefined) =>
    source ? sourceMap.get(source.sourceId) ?? source : undefined
  const rooms = plan.rooms.map((room) => ({
    ...room,
    physicalSource: replaceSource(room.physicalSource),
    policySource: replaceSource(room.policySource),
    staffingSource: replaceSource(room.staffingSource),
  }))
  return appendEvent(
    plan,
    command,
    { kind: "PLAN_REFRESHED", detail: "Planning projection refreshed from current sources" },
    started.fingerprint,
    { sourceChanged: false, sourceSnapshot: command.sourceSnapshot, rooms },
  )
}

export function projectOccupancyPlan(
  plan: OccupancyPlan,
  actorCapabilities: readonly OccupancyCapability[],
  now = "2026-08-01T08:00:00+01:00",
) {
  if (!actorCapabilities.includes("occupancy.view")) throw new Error("Missing capability: occupancy.view")
  const canManageRequests = actorCapabilities.includes("occupancy.manage_requests")
  const canViewFunding = actorCapabilities.includes("occupancy.view_funding")
  return {
    status: occupancyPlanStatus(plan, now),
    rooms: plan.rooms.map((room) => projectRoomOccupancy(plan, room.roomId, now)),
    requests: plan.requests.map((request) =>
      canManageRequests
        ? request
        : { ...request, familyDisplayName: "Restricted family", childDisplayName: "Restricted child" },
    ),
    hourLedgers: canViewFunding
      ? plan.hourLedgers
      : plan.hourLedgers.map((ledger) => ({
          childId: ledger.childId,
          period: ledger.period,
          bookedMinutes: undefined,
          attendedMinutes: undefined,
          fundedClaimMinutes: undefined,
          invoicedMinutes: undefined,
          access: "RESTRICTED" as const,
        })),
    canConfigure: actorCapabilities.includes("occupancy.configure"),
    canManageRequests,
    canManageBookings: actorCapabilities.includes("occupancy.manage_bookings"),
    canManageBlocks: actorCapabilities.includes("occupancy.manage_blocks"),
    canAudit: actorCapabilities.includes("occupancy.audit"),
  }
}

export function classifyCurrentClassCount() {
  return {
    classification: "CURRENT_ROSTER_ONLY" as const,
    canProveLiveOccupancy: false,
    canProveBookedUtilization: false,
    canProveFutureAvailability: false,
    canProveFundedHours: false,
  }
}

export function createOccupancyPlanFixture(): OccupancyPlan {
  const existingBookings: PlaceBooking[] = Array.from({ length: 10 }, (_, index) => ({
    id: `booking-meadow-${index + 1}`,
    childId: `child-${index + 1}`,
    childDisplayName: `Child ${index + 1}`,
    roomId: "room-meadow",
    sessionId: "session-morning",
    status: "CONFIRMED",
    sourceRevision: 1,
    provenance: index < 2 ? "IMPORTED_ROSTER" : "CONFIRMED_BOOKING",
    createdAt: "2026-07-20T09:00:00+01:00",
  }))
  return {
    id: "occupancy-riverside-2026-08-01-am",
    branch: { id: "branch-riverside", label: "Riverside" },
    planningDate: "2026-08-01",
    session: {
      id: "session-morning",
      label: "Morning session",
      startsAt: "2026-08-01T08:00:00+01:00",
      endsAt: "2026-08-01T13:00:00+01:00",
    },
    revision: 0,
    sourcesTrusted: false,
    sourceSnapshot: [
      { sourceId: "class-sunroom-capacity", revision: 2 },
      { sourceId: "policy-sunroom", revision: 3 },
      { sourceId: "staff-plan-sunroom", revision: 5 },
    ],
    sourceChanged: false,
    rooms: [
      {
        roomId: "room-meadow",
        roomLabel: "Meadow",
        physicalCapacity: 14,
        physicalSource: { sourceId: "class-meadow-capacity", revision: 4 },
      },
      {
        roomId: "room-sunroom",
        roomLabel: "Sunroom",
        physicalCapacity: 12,
        policyCapacity: 10,
        staffingCapacity: 10,
        physicalSource: { sourceId: "class-sunroom-capacity", revision: 2 },
        policySource: { sourceId: "policy-sunroom", revision: 3 },
        staffingSource: { sourceId: "staff-plan-sunroom", revision: 5 },
      },
    ],
    bookings: existingBookings,
    blocks: [
      {
        id: "block-meadow-staffing",
        roomId: "room-meadow",
        sessionId: "session-morning",
        places: 1,
        reason: "Named staffing absence reduces sellable capacity",
        sourceKind: "STAFFING",
        ownerId: "manager-maya",
        startsAt: "2026-08-01T08:00:00+01:00",
        expiresAt: "2026-08-01T13:00:00+01:00",
        status: "ACTIVE",
        sourceRevision: 2,
      },
    ],
    requests: [],
    holds: [],
    hourLedgers: [
      {
        childId: "child-1",
        period: "2026-08",
        bookedMinutes: 1200,
        attendedMinutes: 900,
        fundedClaimMinutes: 600,
        invoicedMinutes: 600,
        bookedSource: { sourceId: "booking-child-1", revision: 2 },
        attendedSource: { sourceId: "attendance-child-1", revision: 8 },
        fundedSource: { sourceId: "funding-child-1", revision: 3 },
        invoicedSource: { sourceId: "invoice-child-1", revision: 4 },
      },
    ],
    liveObservations: [
      { roomId: "room-meadow", sessionId: "session-morning" },
      {
        roomId: "room-sunroom",
        sessionId: "session-morning",
        presentChildren: 7,
        observedAt: "2026-08-01T08:02:00+01:00",
        source: { sourceId: "attendance-sunroom", revision: 11 },
      },
    ],
    downstreamProjections: [],
    events: [],
  }
}

function fixtureCommand(plan: OccupancyPlan, id: string, occurredAt: string): OccupancyCommand {
  return {
    eventId: `${id}-${plan.revision}`,
    idempotencyKey: `${id}-${plan.revision}-once`,
    actorId: "manager-maya",
    occurredAt,
    expectedRevision: plan.revision,
    actorCapabilities: managerCapabilities,
  }
}

function confirmedSources(plan: OccupancyPlan) {
  return confirmOccupancySources(plan, {
    ...fixtureCommand(plan, "confirm-sources", "2026-08-01T07:40:00+01:00"),
    roomId: "room-meadow",
    physicalCapacity: 14,
    policyCapacity: 10,
    staffingCapacity: 10,
    sourceSnapshot: [
      { sourceId: "class-meadow-capacity", revision: 4 },
      { sourceId: "policy-meadow", revision: 6 },
      { sourceId: "staff-plan-meadow", revision: 9 },
    ],
  })
}

function conflictResolved(plan: OccupancyPlan) {
  return cancelConflictingBooking(plan, {
    ...fixtureCommand(plan, "cancel-duplicate", "2026-08-01T07:42:00+01:00"),
    bookingId: "booking-meadow-10",
    expectedSourceRevision: 1,
    reason: "Duplicate imported roster row confirmed against source enrollment",
  })
}

function blockReleased(plan: OccupancyPlan) {
  return releaseCapacityBlock(plan, {
    ...fixtureCommand(plan, "release-block", "2026-08-01T07:45:00+01:00"),
    blockId: "block-meadow-staffing",
    expectedSourceRevision: 2,
    reason: "Qualified cover assignment accepted for the complete session",
  })
}

function requestCreated(plan: OccupancyPlan) {
  return createPlaceRequest(plan, {
    ...fixtureCommand(plan, "create-request", "2026-08-01T07:50:00+01:00"),
    requestId: "request-haddad",
    familyDisplayName: "Haddad family",
    childDisplayName: "Lea Haddad",
    roomId: "room-meadow",
    requestedStartDate: "2026-08-15",
  })
}

function requestHeld(plan: OccupancyPlan) {
  const room = projectRoomOccupancy(plan, "room-meadow", "2026-08-01T07:55:00+01:00")
  return holdRequestedPlace(plan, {
    ...fixtureCommand(plan, "hold-place", "2026-08-01T07:55:00+01:00"),
    requestId: "request-haddad",
    expectedRequestRevision: 1,
    expectedRoomSources: room.sources,
    holdId: "hold-haddad",
    expiresAt: "2026-08-01T12:00:00+01:00",
  })
}

function bookingConfirmed(plan: OccupancyPlan) {
  const room = projectRoomOccupancy(plan, "room-meadow", "2026-08-01T08:05:00+01:00")
  return confirmPlaceBooking(plan, {
    ...fixtureCommand(plan, "confirm-booking", "2026-08-01T08:05:00+01:00"),
    requestId: "request-haddad",
    expectedRequestRevision: 2,
    holdId: "hold-haddad",
    expectedHoldRevision: 1,
    expectedRoomSources: room.sources,
    bookingId: "booking-haddad",
    childId: "child-lea-haddad",
    expectedAttendanceId: "expected-attendance-haddad",
    billingInputId: "billing-input-haddad",
  })
}

export function createOccupancyScenario(stage: OccupancyFixtureStage): OccupancyPlan {
  let plan = createOccupancyPlanFixture()
  if (stage === "source-gap") return plan
  plan = confirmedSources(plan)
  if (stage === "capacity-conflict") return plan
  plan = conflictResolved(plan)
  if (stage === "block-review") return plan
  plan = blockReleased(plan)
  if (stage === "available") return plan
  plan = requestCreated(plan)
  if (stage === "request-review") return plan
  plan = requestHeld(plan)
  if (stage === "hold-active") return plan
  if (stage === "hold-expired") {
    return expirePlaceHold(plan, {
      ...fixtureCommand(plan, "expire-hold", "2026-08-01T12:01:00+01:00"),
      holdId: "hold-haddad",
      expectedHoldRevision: 1,
    })
  }
  if (stage === "source-changed") {
    return markOccupancySourceChanged(plan, {
      ...fixtureCommand(plan, "source-changed", "2026-08-01T08:01:00+01:00"),
      sourceId: "staff-plan-meadow",
      nextRevision: 10,
    })
  }
  return bookingConfirmed(plan)
}

export { managerCapabilities }
