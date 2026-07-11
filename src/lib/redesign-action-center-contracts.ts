export type ActionCenterSourceKind =
  | "ATTENDANCE"
  | "RATIO"
  | "DAILY_REPORT"
  | "MEDICAL"
  | "MESSAGE"
  | "PAYMENT"
  | "DOCUMENT"
  | "HANDOVER"

export type ActionCenterSourceState = "UNKNOWN" | "OPEN" | "WAITING" | "RESOLVED"
export type ActionCenterUrgency = "CRITICAL" | "HIGH" | "NORMAL"
export type ActionCenterGroup = "NEEDS_VERIFICATION" | "NOW" | "TODAY" | "WAITING" | "LATER"

export type ActionCenterItem = {
  id: string
  title: string
  detail: string
  path: string
  organizationId: string
  branchId: string
  roomId: string | null
  recordId: string | null
  sourceKind: ActionCenterSourceKind
  sourceId: string
  sourceRevision: number
  sourceState: ActionCenterSourceState
  sourceUpdatedAt: string
  requiredCapability: string
  urgency: ActionCenterUrgency
  dueAt: string | null
  ownerId: string | null
  readByIds: readonly string[]
  deferralPolicy: "NEVER" | "ALLOWED"
  maxDeferralMinutes: number | null
  deferredUntil: string | null
  deferredReason: string | null
  resolutionEvidencePath: string | null
  itemRevision: number
}

export type ActionCenterEvent = {
  eventId: string
  idempotencyKey: string
  itemId: string
  kind: "VIEWED" | "CLAIMED" | "DEFERRED" | "SOURCE_RECONCILED"
  actorId: string
  occurredAt: string
  sourceRevision: number
  detail: string
  commandSignature: string
}

export type ActionCenterState = {
  stateId: string
  organizationId: string
  asOf: string
  revision: number
  items: readonly ActionCenterItem[]
  events: readonly ActionCenterEvent[]
}

export type ActionCenterViewer = {
  userId: string
  organizationId: string
  branchId: string | null
  allowedBranchIds: readonly string[]
  capabilities: readonly string[]
}

export type ProjectedActionCenterItem = ActionCenterItem & {
  group: ActionCenterGroup
  isUnread: boolean
  isOwnedByViewer: boolean
}

export type ActionCenterProjection = {
  activeItems: readonly ProjectedActionCenterItem[]
  groups: Readonly<Record<ActionCenterGroup, readonly ProjectedActionCenterItem[]>>
  recentlyResolved: readonly ActionCenterItem[]
  activeCount: number
  unreadCount: number
  ownedByViewerCount: number
  unassignedCount: number
  primaryItemId: string | null
}

type ActionCommandBase = {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedStateRevision: number
  expectedItemRevision: number
  expectedSourceRevision: number
  actorCapabilities: readonly string[]
  itemId: string
}

export type ViewActionCommand = ActionCommandBase
export type ClaimActionCommand = ActionCommandBase
export type DeferActionCommand = ActionCommandBase & { reviewAt: string; reason: string }
export type ReconcileActionSourceCommand = ActionCommandBase & {
  acceptedSourceRevision: number
  acceptedSourceState: ActionCenterSourceState
  resolutionEvidencePath?: string
}

const groupOrder: readonly ActionCenterGroup[] = ["NEEDS_VERIFICATION", "NOW", "TODAY", "WAITING", "LATER"]
const urgencyWeight: Record<ActionCenterUrgency, number> = { CRITICAL: 0, HIGH: 1, NORMAL: 2 }

function requireText(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required`)
}

function timestamp(value: string, label: string) {
  requireText(value, label)
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp`)
  return parsed
}

function requireCapability(capabilities: readonly string[], capability: string) {
  if (!capabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`)
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    )
  }
  return value
}

function commandSignature(command: ActionCommandBase) {
  return JSON.stringify(stableValue(command))
}

function existingEvent(state: ActionCenterState, command: ActionCommandBase) {
  const duplicate = state.events.find((event) => event.idempotencyKey === command.idempotencyKey)
  if (!duplicate) return null
  if (duplicate.commandSignature !== commandSignature(command)) {
    throw new Error("Action Center idempotency key was reused with different input")
  }
  return duplicate
}

function commandItem(state: ActionCenterState, command: ActionCommandBase) {
  requireText(command.eventId, "Event id")
  requireText(command.idempotencyKey, "Idempotency key")
  requireText(command.actorId, "Actor id")
  timestamp(command.occurredAt, "Occurred at")
  if (command.expectedStateRevision !== state.revision) throw new Error("Action Center state revision conflict")
  const item = state.items.find((candidate) => candidate.id === command.itemId)
  if (!item) throw new Error("Action Center item was not found")
  if (item.itemRevision !== command.expectedItemRevision) throw new Error("Action Center item revision conflict")
  if (item.sourceRevision !== command.expectedSourceRevision) throw new Error("Action Center source revision conflict")
  requireCapability(command.actorCapabilities, item.requiredCapability)
  if (state.events.some((event) => event.eventId === command.eventId)) throw new Error("Action Center event id already exists")
  return item
}

function appendEvent(
  state: ActionCenterState,
  command: ActionCommandBase,
  event: Omit<ActionCenterEvent, "eventId" | "idempotencyKey" | "itemId" | "actorId" | "occurredAt" | "commandSignature">,
) {
  return {
    ...state,
    revision: state.revision + 1,
    events: [...state.events, {
      eventId: command.eventId,
      idempotencyKey: command.idempotencyKey,
      itemId: command.itemId,
      actorId: command.actorId,
      occurredAt: command.occurredAt,
      ...event,
      commandSignature: commandSignature(command),
    }],
  } satisfies ActionCenterState
}

function replaceItem(state: ActionCenterState, item: ActionCenterItem) {
  return { ...state, items: state.items.map((candidate) => candidate.id === item.id ? item : candidate) }
}

function visibleToViewer(item: ActionCenterItem, viewer: ActionCenterViewer) {
  if (item.organizationId !== viewer.organizationId) return false
  if (!viewer.capabilities.includes(item.requiredCapability)) return false
  if (!viewer.allowedBranchIds.includes(item.branchId)) return false
  if (viewer.branchId && item.branchId !== viewer.branchId) return false
  return true
}

function itemGroup(item: ActionCenterItem, asOf: number): ActionCenterGroup {
  if (item.sourceState === "UNKNOWN") return "NEEDS_VERIFICATION"
  if (item.sourceState === "WAITING") return "WAITING"
  if (item.deferredUntil && timestamp(item.deferredUntil, "Deferred until") > asOf) return "LATER"
  const due = item.dueAt ? timestamp(item.dueAt, "Due at") : null
  if (item.urgency === "CRITICAL" || (due !== null && due <= asOf)) return "NOW"
  if (due !== null && due > asOf + 24 * 60 * 60 * 1000) return "LATER"
  return "TODAY"
}

function sortProjected(left: ProjectedActionCenterItem, right: ProjectedActionCenterItem) {
  const groupDifference = groupOrder.indexOf(left.group) - groupOrder.indexOf(right.group)
  if (groupDifference) return groupDifference
  const urgencyDifference = urgencyWeight[left.urgency] - urgencyWeight[right.urgency]
  if (urgencyDifference) return urgencyDifference
  const leftDue = left.dueAt ? Date.parse(left.dueAt) : Number.POSITIVE_INFINITY
  const rightDue = right.dueAt ? Date.parse(right.dueAt) : Number.POSITIVE_INFINITY
  return leftDue - rightDue || left.id.localeCompare(right.id)
}

export function projectActionCenter(state: ActionCenterState, viewer: ActionCenterViewer): ActionCenterProjection {
  if (viewer.organizationId !== state.organizationId) {
    return {
      activeItems: [],
      groups: { NEEDS_VERIFICATION: [], NOW: [], TODAY: [], WAITING: [], LATER: [] },
      recentlyResolved: [],
      activeCount: 0,
      unreadCount: 0,
      ownedByViewerCount: 0,
      unassignedCount: 0,
      primaryItemId: null,
    }
  }
  const asOf = timestamp(state.asOf, "Action Center as-of time")
  const visible = state.items.filter((item) => visibleToViewer(item, viewer))
  const activeItems = visible
    .filter((item) => item.sourceState !== "RESOLVED")
    .map((item): ProjectedActionCenterItem => ({
      ...item,
      group: itemGroup(item, asOf),
      isUnread: !item.readByIds.includes(viewer.userId),
      isOwnedByViewer: item.ownerId === viewer.userId,
    }))
    .sort(sortProjected)
  const groups: ActionCenterProjection["groups"] = {
    NEEDS_VERIFICATION: activeItems.filter((item) => item.group === "NEEDS_VERIFICATION"),
    NOW: activeItems.filter((item) => item.group === "NOW"),
    TODAY: activeItems.filter((item) => item.group === "TODAY"),
    WAITING: activeItems.filter((item) => item.group === "WAITING"),
    LATER: activeItems.filter((item) => item.group === "LATER"),
  }
  const recentlyResolved = visible
    .filter((item) => item.sourceState === "RESOLVED")
    .sort((left, right) => Date.parse(right.sourceUpdatedAt) - Date.parse(left.sourceUpdatedAt) || left.id.localeCompare(right.id))

  return {
    activeItems,
    groups,
    recentlyResolved,
    activeCount: activeItems.length,
    unreadCount: activeItems.filter((item) => item.isUnread).length,
    ownedByViewerCount: activeItems.filter((item) => item.isOwnedByViewer).length,
    unassignedCount: activeItems.filter((item) => item.ownerId === null).length,
    primaryItemId: activeItems[0]?.id ?? null,
  }
}

export function markActionViewed(state: ActionCenterState, command: ViewActionCommand) {
  if (existingEvent(state, command)) return state
  const item = commandItem(state, command)
  if (item.sourceState === "RESOLVED") throw new Error("Resolved Action Center item cannot be viewed as active work")
  const updated = appendEvent(state, command, {
    kind: "VIEWED",
    sourceRevision: item.sourceRevision,
    detail: `${item.title} viewed; source state remains ${item.sourceState.toLowerCase()}`,
  })
  return replaceItem(updated, {
    ...item,
    readByIds: item.readByIds.includes(command.actorId) ? item.readByIds : [...item.readByIds, command.actorId],
    itemRevision: item.itemRevision + 1,
  })
}

export function claimActionItem(state: ActionCenterState, command: ClaimActionCommand) {
  if (existingEvent(state, command)) return state
  requireCapability(command.actorCapabilities, "action_center.claim")
  const item = commandItem(state, command)
  if (item.sourceState === "RESOLVED") throw new Error("Resolved Action Center item cannot be claimed")
  if (item.ownerId && item.ownerId !== command.actorId) throw new Error("Action Center item is already owned")
  const updated = appendEvent(state, command, {
    kind: "CLAIMED",
    sourceRevision: item.sourceRevision,
    detail: `${item.title} claimed by ${command.actorId}`,
  })
  return replaceItem(updated, { ...item, ownerId: command.actorId, itemRevision: item.itemRevision + 1 })
}

export function deferActionItem(state: ActionCenterState, command: DeferActionCommand) {
  if (existingEvent(state, command)) return state
  requireCapability(command.actorCapabilities, "action_center.defer")
  const item = commandItem(state, command)
  requireText(command.reason, "Deferral reason")
  if (item.sourceState === "RESOLVED") throw new Error("Resolved Action Center item cannot be deferred")
  if (item.deferralPolicy !== "ALLOWED" || item.urgency === "CRITICAL" || item.sourceState === "UNKNOWN") {
    throw new Error("Action Center item cannot be deferred")
  }
  const occurredAt = timestamp(command.occurredAt, "Occurred at")
  const reviewAt = timestamp(command.reviewAt, "Review at")
  if (reviewAt <= occurredAt) throw new Error("Action Center review time must be in the future")
  if (item.maxDeferralMinutes === null || reviewAt > occurredAt + item.maxDeferralMinutes * 60 * 1000) {
    throw new Error("Action Center review time exceeds policy")
  }
  const updated = appendEvent(state, command, {
    kind: "DEFERRED",
    sourceRevision: item.sourceRevision,
    detail: `${item.title} will be reviewed at ${command.reviewAt}: ${command.reason.trim()}`,
  })
  return replaceItem(updated, {
    ...item,
    deferredUntil: command.reviewAt,
    deferredReason: command.reason.trim(),
    itemRevision: item.itemRevision + 1,
  })
}

export function reconcileActionSource(state: ActionCenterState, command: ReconcileActionSourceCommand) {
  if (existingEvent(state, command)) return state
  requireCapability(command.actorCapabilities, "action_center.source_reconcile")
  const item = commandItem(state, command)
  if (!Number.isInteger(command.acceptedSourceRevision) || command.acceptedSourceRevision <= item.sourceRevision) {
    throw new Error("Accepted Action Center source revision must be newer")
  }
  const evidence = command.resolutionEvidencePath?.trim() ?? ""
  if (command.acceptedSourceState === "RESOLVED" && !evidence) {
    throw new Error("Resolution evidence path is required")
  }
  const updated = appendEvent(state, command, {
    kind: "SOURCE_RECONCILED",
    sourceRevision: command.acceptedSourceRevision,
    detail: `${item.title} reconciled to ${command.acceptedSourceState.toLowerCase()} from source revision ${command.acceptedSourceRevision}`,
  })
  return replaceItem(updated, {
    ...item,
    sourceRevision: command.acceptedSourceRevision,
    sourceState: command.acceptedSourceState,
    sourceUpdatedAt: command.occurredAt,
    resolutionEvidencePath: command.acceptedSourceState === "RESOLVED" ? evidence : null,
    deferredUntil: command.acceptedSourceState === "RESOLVED" ? null : item.deferredUntil,
    deferredReason: command.acceptedSourceState === "RESOLVED" ? null : item.deferredReason,
    itemRevision: item.itemRevision + 1,
  })
}

export const managerActionCenterViewer: ActionCenterViewer = {
  userId: "user-manager",
  organizationId: "org-kiddz-fixture",
  branchId: "branch-riverside",
  allowedBranchIds: ["branch-riverside"],
  capabilities: ["attendance.view", "ratios.view", "daily_reports.view", "messages.view", "finance.view"],
}

export const practitionerActionCenterViewer: ActionCenterViewer = {
  userId: "staff-lina",
  organizationId: "org-kiddz-fixture",
  branchId: "branch-riverside",
  allowedBranchIds: ["branch-riverside"],
  capabilities: ["attendance.view", "ratios.view", "daily_reports.view", "messages.view"],
}

export function createActionCenterFixture(): ActionCenterState {
  const base = {
    organizationId: "org-kiddz-fixture",
    branchId: "branch-riverside",
    roomId: "room-meadow",
    recordId: null,
    ownerId: null,
    readByIds: [] as readonly string[],
    deferredUntil: null,
    deferredReason: null,
    resolutionEvidencePath: null,
    itemRevision: 0,
  }
  return {
    stateId: "action-center-riverside-2026-07-14",
    organizationId: "org-kiddz-fixture",
    asOf: "2026-07-14T10:00:00+01:00",
    revision: 0,
    events: [],
    items: [
      {
        ...base,
        id: "attendance-alma",
        title: "Confirm Alma's arrival",
        detail: "The expected child has no observed arrival or accepted absence source.",
        path: "Today / Meadow / Attendance / Alma Reyes",
        sourceKind: "ATTENDANCE",
        sourceId: "attendance-session-meadow",
        sourceRevision: 3,
        sourceState: "UNKNOWN",
        sourceUpdatedAt: "2026-07-14T09:42:00+01:00",
        requiredCapability: "attendance.view",
        urgency: "HIGH",
        dueAt: "2026-07-14T10:05:00+01:00",
        deferralPolicy: "NEVER",
        maxDeferralMinutes: null,
      },
      {
        ...base,
        id: "ratio-meadow",
        title: "Restore Meadow cover",
        detail: "One counted adult is missing from the supplied room policy decision.",
        path: "Today / Riverside / Meadow / Live ratio",
        sourceKind: "RATIO",
        sourceId: "ratio-snapshot-meadow",
        sourceRevision: 12,
        sourceState: "OPEN",
        sourceUpdatedAt: "2026-07-14T09:58:00+01:00",
        requiredCapability: "ratios.view",
        urgency: "CRITICAL",
        dueAt: "2026-07-14T10:00:00+01:00",
        deferralPolicy: "NEVER",
        maxDeferralMinutes: null,
      },
      {
        ...base,
        id: "care-meadow",
        title: "Submit two Meadow care reports",
        detail: "Two reports are saved as drafts and remain incomplete for handover.",
        path: "Children / Care incomplete / Meadow",
        sourceKind: "DAILY_REPORT",
        sourceId: "care-session-meadow",
        sourceRevision: 4,
        sourceState: "OPEN",
        sourceUpdatedAt: "2026-07-14T09:51:00+01:00",
        requiredCapability: "daily_reports.view",
        urgency: "HIGH",
        dueAt: "2026-07-14T12:00:00+01:00",
        deferralPolicy: "NEVER",
        maxDeferralMinutes: null,
      },
      {
        ...base,
        id: "reply-theo",
        title: "Reply to Theo's parent",
        detail: "A lunch preference question needs a staff response before afternoon pickup.",
        path: "Messages / Needs reply / Martin family",
        sourceKind: "MESSAGE",
        sourceId: "thread-martin-lunch",
        sourceRevision: 2,
        sourceState: "OPEN",
        sourceUpdatedAt: "2026-07-14T09:34:00+01:00",
        requiredCapability: "messages.view",
        urgency: "NORMAL",
        dueAt: "2026-07-14T15:00:00+01:00",
        deferralPolicy: "ALLOWED",
        maxDeferralMinutes: 240,
      },
      {
        ...base,
        roomId: null,
        recordId: "payment-luca-july",
        id: "payment-luca",
        title: "Review Luca's overdue payment",
        detail: "The July balance is overdue and has no recorded allocation or follow-up owner.",
        path: "Finance / Needs attention / Saab family",
        sourceKind: "PAYMENT",
        sourceId: "payment-luca-july",
        sourceRevision: 7,
        sourceState: "OPEN",
        sourceUpdatedAt: "2026-07-14T08:15:00+01:00",
        requiredCapability: "finance.view",
        urgency: "HIGH",
        dueAt: "2026-07-14T09:00:00+01:00",
        deferralPolicy: "ALLOWED",
        maxDeferralMinutes: 1440,
      },
      {
        ...base,
        id: "vaccination-maya",
        title: "Vaccination evidence accepted",
        detail: "The source record is resolved and must not remain active because an alarm row still exists.",
        path: "Children / Maya / Medical / Vaccinations",
        sourceKind: "MEDICAL",
        sourceId: "vaccination-maya-mmrv",
        sourceRevision: 9,
        sourceState: "RESOLVED",
        sourceUpdatedAt: "2026-07-14T09:20:00+01:00",
        requiredCapability: "attendance.view",
        urgency: "NORMAL",
        dueAt: null,
        deferralPolicy: "NEVER",
        maxDeferralMinutes: null,
        resolutionEvidencePath: "Children / Maya / Medical / Vaccinations / MMRV receipt",
      },
    ],
  }
}
