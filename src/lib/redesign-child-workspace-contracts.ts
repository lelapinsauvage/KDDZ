export type ChildWorkspaceSectionId =
  | "OVERVIEW"
  | "CARE"
  | "ATTENDANCE"
  | "HEALTH"
  | "COMMUNICATION"
  | "FINANCE"
  | "DOCUMENTS"
  | "AUDIT"

export type ChildTimelineSourceKind =
  | "ATTENDANCE"
  | "CARE"
  | "MEDICAL"
  | "COMMUNICATION"
  | "FINANCE"
  | "DOCUMENT"
  | "PROFILE"

export type ChildTimelineState = "DRAFT" | "SUBMITTED" | "WAITING" | "RESOLVED" | "CORRECTED"
export type ChildTimelineProvenance = "OBSERVED" | "SUBMITTED" | "DERIVED" | "IMPORTED" | "CORRECTION"

export type ChildWorkspaceIdentity = {
  childId: string
  organizationId: string
  branchId: string
  roomId: string | null
  displayName: string
  initials: string
  childNumber: string
  enrollmentState: "ACTIVE" | "DRAFT" | "INACTIVE"
  sourceRevision: number
}

export type ChildTimelineEvent = {
  id: string
  childId: string
  organizationId: string
  branchId: string
  sourceKind: ChildTimelineSourceKind
  sourceId: string
  sourceRevision: number
  state: ChildTimelineState
  provenance: ChildTimelineProvenance
  occurredAt: string
  recordedAt: string
  requiredStaffCapability: string
  requiredParentCapability: string | null
  publication: "DRAFT" | "INTERNAL" | "PUBLISHED"
  sensitivity: "ROUTINE" | "SENSITIVE" | "RESTRICTED"
  staffTitle: string
  staffDetail: string
  staffPath: string
  parentTitle: string | null
  parentDetail: string | null
  parentPath: string | null
  correctsEventId: string | null
  correctionReason: string | null
}

export type ChildSafetyNotice = {
  id: string
  childId: string
  organizationId: string
  branchId: string
  title: string
  detail: string
  sourcePath: string
  sourceRevision: number
  requiredStaffCapability: string
  requiredParentCapability: string | null
  parentDetail: string | null
}

export type ChildWorkspaceAcceptedEvent = {
  eventId: string
  idempotencyKey: string
  kind: "TIMELINE_CORRECTED"
  actorId: string
  occurredAt: string
  sourceEventId: string
  sourceRevision: number
  detail: string
  commandSignature: string
}

export type ChildWorkspaceState = {
  workspaceId: string
  revision: number
  identity: ChildWorkspaceIdentity
  timeline: readonly ChildTimelineEvent[]
  safetyNotices: readonly ChildSafetyNotice[]
  acceptedEvents: readonly ChildWorkspaceAcceptedEvent[]
}

export type ChildWorkspaceViewer = {
  kind: "STAFF" | "PARENT"
  userId: string
  organizationId: string
  allowedBranchIds: readonly string[]
  relatedChildIds: readonly string[]
  capabilities: readonly string[]
}

export type ChildWorkspaceSection = {
  id: ChildWorkspaceSectionId
  label: string
  path: string
}

export type ProjectedChildTimelineEvent = {
  id: string
  sourceKind: ChildTimelineSourceKind
  sourceId: string
  sourceRevision: number
  state: ChildTimelineState
  provenance: ChildTimelineProvenance
  occurredAt: string
  recordedAt: string
  title: string
  detail: string
  path: string
  isSuperseded: boolean
  correctsEventId: string | null
  correctionReason: string | null
}

export type ProjectedChildSafetyNotice = {
  id: string
  title: string
  detail: string
  sourcePath: string
  sourceRevision: number
}

export type ChildWorkspaceProjection = {
  access: "READY" | "DENIED"
  identity: ChildWorkspaceIdentity | null
  sections: readonly ChildWorkspaceSection[]
  timeline: readonly ProjectedChildTimelineEvent[]
  safetyNotices: readonly ProjectedChildSafetyNotice[]
  visibleTimelineCount: number
  visibleNoticeCount: number
  latestEventId: string | null
}

export type CorrectChildTimelineCommand = {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedWorkspaceRevision: number
  sourceEventId: string
  expectedSourceRevision: number
  acceptedSourceRevision: number
  correctedOccurredAt: string
  reason: string
  correctedStaffDetail: string
  correctedParentDetail: string | null
  actorCapabilities: readonly string[]
}

const sectionDefinitions: ReadonlyArray<ChildWorkspaceSection & {
  staffCapability: string
  parentCapability: string | null
}> = [
  { id: "OVERVIEW", label: "Overview", path: "overview", staffCapability: "children.view", parentCapability: "parent.child.view" },
  { id: "CARE", label: "Care", path: "care", staffCapability: "care.read", parentCapability: "parent.daily.read" },
  { id: "ATTENDANCE", label: "Attendance", path: "attendance", staffCapability: "attendance.read", parentCapability: "parent.attendance.read" },
  { id: "HEALTH", label: "Health", path: "health", staffCapability: "medical.summary", parentCapability: "parent.medical.read" },
  { id: "COMMUNICATION", label: "Communication", path: "communication", staffCapability: "calls.read", parentCapability: "parent.messages.read" },
  { id: "FINANCE", label: "Finance", path: "finance", staffCapability: "finance.read", parentCapability: "parent.finance.read" },
  { id: "DOCUMENTS", label: "Documents", path: "documents", staffCapability: "documents.read", parentCapability: "parent.documents.read" },
  { id: "AUDIT", label: "Audit", path: "audit", staffCapability: "audit.read", parentCapability: null },
]

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
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    )
  }
  return value
}

function commandSignature(command: CorrectChildTimelineCommand) {
  return JSON.stringify(stableValue(command))
}

function canOpenWorkspace(state: ChildWorkspaceState, viewer: ChildWorkspaceViewer) {
  if (viewer.organizationId !== state.identity.organizationId) return false
  if (!viewer.allowedBranchIds.includes(state.identity.branchId)) return false
  if (viewer.kind === "STAFF") return viewer.capabilities.includes("children.view")
  return viewer.capabilities.includes("parent.child.view") && viewer.relatedChildIds.includes(state.identity.childId)
}

function canSeeSection(viewer: ChildWorkspaceViewer, definition: typeof sectionDefinitions[number]) {
  const capability = viewer.kind === "STAFF" ? definition.staffCapability : definition.parentCapability
  return Boolean(capability && viewer.capabilities.includes(capability))
}

function canSeeTimelineEvent(event: ChildTimelineEvent, viewer: ChildWorkspaceViewer) {
  if (viewer.kind === "STAFF") return viewer.capabilities.includes(event.requiredStaffCapability)
  return event.publication === "PUBLISHED"
    && Boolean(event.requiredParentCapability)
    && viewer.capabilities.includes(event.requiredParentCapability ?? "")
    && Boolean(event.parentTitle && event.parentDetail && event.parentPath)
}

function canSeeNotice(notice: ChildSafetyNotice, viewer: ChildWorkspaceViewer) {
  if (viewer.kind === "STAFF") return viewer.capabilities.includes(notice.requiredStaffCapability)
  return Boolean(
    notice.requiredParentCapability
    && viewer.capabilities.includes(notice.requiredParentCapability)
    && notice.parentDetail,
  )
}

function deniedProjection(): ChildWorkspaceProjection {
  return {
    access: "DENIED",
    identity: null,
    sections: [],
    timeline: [],
    safetyNotices: [],
    visibleTimelineCount: 0,
    visibleNoticeCount: 0,
    latestEventId: null,
  }
}

export function projectChildWorkspace(state: ChildWorkspaceState, viewer: ChildWorkspaceViewer): ChildWorkspaceProjection {
  if (!canOpenWorkspace(state, viewer)) return deniedProjection()

  const correctedIds = new Set(state.timeline.map((event) => event.correctsEventId).filter((id): id is string => Boolean(id)))
  const canReadAudit = viewer.kind === "STAFF" && viewer.capabilities.includes("audit.read")
  const timeline = state.timeline
    .filter((event) => canSeeTimelineEvent(event, viewer))
    .filter((event) => canReadAudit || !correctedIds.has(event.id))
    .map((event): ProjectedChildTimelineEvent => ({
      id: event.id,
      sourceKind: event.sourceKind,
      sourceId: event.sourceId,
      sourceRevision: event.sourceRevision,
      state: event.state,
      provenance: event.provenance,
      occurredAt: event.occurredAt,
      recordedAt: event.recordedAt,
      title: viewer.kind === "STAFF" ? event.staffTitle : event.parentTitle!,
      detail: viewer.kind === "STAFF" ? event.staffDetail : event.parentDetail!,
      path: viewer.kind === "STAFF" ? event.staffPath : event.parentPath!,
      isSuperseded: correctedIds.has(event.id),
      correctsEventId: event.correctsEventId,
      correctionReason: canReadAudit ? event.correctionReason : null,
    }))
    .sort((left, right) =>
      Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
      || Date.parse(right.recordedAt) - Date.parse(left.recordedAt)
      || left.id.localeCompare(right.id),
    )

  const safetyNotices = state.safetyNotices
    .filter((notice) => canSeeNotice(notice, viewer))
    .map((notice): ProjectedChildSafetyNotice => ({
      id: notice.id,
      title: notice.title,
      detail: viewer.kind === "STAFF" ? notice.detail : notice.parentDetail!,
      sourcePath: notice.sourcePath,
      sourceRevision: notice.sourceRevision,
    }))

  return {
    access: "READY",
    identity: state.identity,
    sections: sectionDefinitions.filter((definition) => canSeeSection(viewer, definition)).map(({ id, label, path }) => ({ id, label, path })),
    timeline,
    safetyNotices,
    visibleTimelineCount: timeline.length,
    visibleNoticeCount: safetyNotices.length,
    latestEventId: timeline[0]?.id ?? null,
  }
}

export function correctChildTimelineEvent(state: ChildWorkspaceState, command: CorrectChildTimelineCommand) {
  const duplicate = state.acceptedEvents.find((event) => event.idempotencyKey === command.idempotencyKey)
  if (duplicate) {
    if (duplicate.commandSignature !== commandSignature(command)) {
      throw new Error("Child workspace idempotency key was reused with different input")
    }
    return state
  }

  requireText(command.eventId, "Event id")
  requireText(command.idempotencyKey, "Idempotency key")
  requireText(command.actorId, "Actor id")
  requireText(command.reason, "Correction reason")
  requireText(command.correctedStaffDetail, "Corrected staff detail")
  requireTimestamp(command.occurredAt, "Occurred at")
  requireTimestamp(command.correctedOccurredAt, "Corrected occurred at")
  requireCapability(command.actorCapabilities, "child_timeline.correct")
  requireCapability(command.actorCapabilities, "audit.read")
  if (command.expectedWorkspaceRevision !== state.revision) throw new Error("Child workspace revision conflict")
  if (state.acceptedEvents.some((event) => event.eventId === command.eventId)) throw new Error("Child workspace event id already exists")

  const source = state.timeline.find((event) => event.id === command.sourceEventId)
  if (!source) throw new Error("Child timeline source event was not found")
  requireCapability(command.actorCapabilities, source.requiredStaffCapability)
  if (source.sourceRevision !== command.expectedSourceRevision) throw new Error("Child timeline source revision conflict")
  if (state.timeline.some((event) => event.correctsEventId === source.id)) throw new Error("Child timeline source event already has a correction")
  if (!Number.isInteger(command.acceptedSourceRevision) || command.acceptedSourceRevision <= source.sourceRevision) {
    throw new Error("Accepted child timeline source revision must be newer")
  }
  if (source.publication === "PUBLISHED" && source.requiredParentCapability && !command.correctedParentDetail?.trim()) {
    throw new Error("Published child timeline correction requires parent-safe detail")
  }

  const correctedEvent: ChildTimelineEvent = {
    ...source,
    id: command.eventId,
    sourceRevision: command.acceptedSourceRevision,
    state: "CORRECTED",
    provenance: "CORRECTION",
    occurredAt: command.correctedOccurredAt,
    recordedAt: command.occurredAt,
    staffTitle: `${source.staffTitle} corrected`,
    staffDetail: command.correctedStaffDetail.trim(),
    parentTitle: source.parentTitle ? `${source.parentTitle} corrected` : null,
    parentDetail: command.correctedParentDetail?.trim() || null,
    correctsEventId: source.id,
    correctionReason: command.reason.trim(),
  }

  return {
    ...state,
    revision: state.revision + 1,
    timeline: [...state.timeline, correctedEvent],
    acceptedEvents: [...state.acceptedEvents, {
      eventId: command.eventId,
      idempotencyKey: command.idempotencyKey,
      kind: "TIMELINE_CORRECTED" as const,
      actorId: command.actorId,
      occurredAt: command.occurredAt,
      sourceEventId: source.id,
      sourceRevision: command.acceptedSourceRevision,
      detail: `${source.staffTitle} corrected from source revision ${source.sourceRevision} to ${command.acceptedSourceRevision}: ${command.reason.trim()}`,
      commandSignature: commandSignature(command),
    }],
  }
}

export const managerChildWorkspaceViewer: ChildWorkspaceViewer = {
  kind: "STAFF",
  userId: "user-manager",
  organizationId: "org-kiddz-fixture",
  allowedBranchIds: ["branch-riverside"],
  relatedChildIds: [],
  capabilities: [
    "children.view",
    "care.read",
    "attendance.read",
    "medical.summary",
    "calls.read",
    "finance.read",
    "documents.read",
    "audit.read",
    "child_timeline.correct",
  ],
}

export const practitionerChildWorkspaceViewer: ChildWorkspaceViewer = {
  kind: "STAFF",
  userId: "staff-lina",
  organizationId: "org-kiddz-fixture",
  allowedBranchIds: ["branch-riverside"],
  relatedChildIds: [],
  capabilities: ["children.view", "care.read", "attendance.read", "medical.summary", "calls.read"],
}

export const nurseChildWorkspaceViewer: ChildWorkspaceViewer = {
  kind: "STAFF",
  userId: "staff-nurse-amira",
  organizationId: "org-kiddz-fixture",
  allowedBranchIds: ["branch-riverside"],
  relatedChildIds: [],
  capabilities: [
    "children.view",
    "attendance.read",
    "medical.summary",
    "medical.detail",
    "safeguarding.read",
    "documents.read",
    "audit.read",
  ],
}

export const parentChildWorkspaceViewer: ChildWorkspaceViewer = {
  kind: "PARENT",
  userId: "parent-alma",
  organizationId: "org-kiddz-fixture",
  allowedBranchIds: ["branch-riverside"],
  relatedChildIds: ["child-alma"],
  capabilities: [
    "parent.child.view",
    "parent.daily.read",
    "parent.attendance.read",
    "parent.medical.read",
    "parent.messages.read",
    "parent.finance.read",
    "parent.documents.read",
  ],
}

export function createChildWorkspaceFixture(): ChildWorkspaceState {
  const base = {
    childId: "child-alma",
    organizationId: "org-kiddz-fixture",
    branchId: "branch-riverside",
    correctsEventId: null,
    correctionReason: null,
  }
  return {
    workspaceId: "child-workspace-alma-2026-07-14",
    revision: 0,
    identity: {
      childId: "child-alma",
      organizationId: "org-kiddz-fixture",
      branchId: "branch-riverside",
      roomId: "room-meadow",
      displayName: "Alma Reyes",
      initials: "AR",
      childNumber: "RIV-1042",
      enrollmentState: "ACTIVE",
      sourceRevision: 18,
    },
    safetyNotices: [
      {
        ...base,
        id: "notice-allergy",
        title: "Peanut allergy",
        detail: "Confirmed allergy; follow the current care plan before food or medication decisions.",
        parentDetail: "Peanut allergy care plan is active.",
        sourcePath: "Health / Conditions / Allergy plan revision 6",
        sourceRevision: 6,
        requiredStaffCapability: "medical.summary",
        requiredParentCapability: "parent.medical.read",
      },
      {
        ...base,
        id: "notice-safeguarding",
        title: "Restricted collection note",
        detail: "Named safeguarding restriction; verify collection authority at the protected source.",
        parentDetail: null,
        sourcePath: "Health / Safeguarding / Restricted collection revision 3",
        sourceRevision: 3,
        requiredStaffCapability: "safeguarding.read",
        requiredParentCapability: null,
      },
    ],
    timeline: [
      {
        ...base,
        id: "attendance-arrival-4",
        sourceKind: "ATTENDANCE",
        sourceId: "attendance-alma-2026-07-14",
        sourceRevision: 4,
        state: "SUBMITTED",
        provenance: "OBSERVED",
        occurredAt: "2026-07-14T09:14:00+01:00",
        recordedAt: "2026-07-14T09:14:08+01:00",
        requiredStaffCapability: "attendance.read",
        requiredParentCapability: "parent.attendance.read",
        publication: "PUBLISHED",
        sensitivity: "ROUTINE",
        staffTitle: "Arrival observed",
        staffDetail: "Alma arrived at Meadow at 09:14; recorded by Lina.",
        staffPath: "Attendance / 14 July / Arrival revision 4",
        parentTitle: "Arrival recorded",
        parentDetail: "Alma arrived at 09:14.",
        parentPath: "Today / Attendance",
      },
      {
        ...base,
        id: "care-draft-7",
        sourceKind: "CARE",
        sourceId: "daily-report-alma-2026-07-14",
        sourceRevision: 7,
        state: "DRAFT",
        provenance: "OBSERVED",
        occurredAt: "2026-07-14T10:20:00+01:00",
        recordedAt: "2026-07-14T10:20:10+01:00",
        requiredStaffCapability: "care.read",
        requiredParentCapability: null,
        publication: "DRAFT",
        sensitivity: "ROUTINE",
        staffTitle: "Care report draft saved",
        staffDetail: "Lunch and mood observations are saved but not submitted.",
        staffPath: "Care / 14 July / Draft revision 7",
        parentTitle: null,
        parentDetail: null,
        parentPath: null,
      },
      {
        ...base,
        id: "care-submitted-6",
        sourceKind: "CARE",
        sourceId: "daily-report-alma-2026-07-13",
        sourceRevision: 6,
        state: "SUBMITTED",
        provenance: "SUBMITTED",
        occurredAt: "2026-07-13T16:12:00+01:00",
        recordedAt: "2026-07-13T16:12:03+01:00",
        requiredStaffCapability: "care.read",
        requiredParentCapability: "parent.daily.read",
        publication: "PUBLISHED",
        sensitivity: "ROUTINE",
        staffTitle: "Daily care report submitted",
        staffDetail: "Monday care record accepted from source revision 6.",
        staffPath: "Care / 13 July / Submitted revision 6",
        parentTitle: "Monday care report",
        parentDetail: "Alma's Monday care report is ready.",
        parentPath: "Daily care / 13 July",
      },
      {
        ...base,
        id: "medical-summary-3",
        sourceKind: "MEDICAL",
        sourceId: "accident-alma-2026-07-11",
        sourceRevision: 3,
        state: "WAITING",
        provenance: "SUBMITTED",
        occurredAt: "2026-07-11T11:06:00+01:00",
        recordedAt: "2026-07-11T11:18:00+01:00",
        requiredStaffCapability: "medical.summary",
        requiredParentCapability: "parent.medical.read",
        publication: "PUBLISHED",
        sensitivity: "SENSITIVE",
        staffTitle: "Accident review awaiting acknowledgment",
        staffDetail: "Submitted incident remains open until parent acknowledgment is recorded.",
        staffPath: "Health / Accidents / Review revision 3",
        parentTitle: "Accident report follow-up",
        parentDetail: "The submitted accident report is awaiting your acknowledgment.",
        parentPath: "Health / Accident report",
      },
      {
        ...base,
        id: "medical-clinical-2",
        sourceKind: "MEDICAL",
        sourceId: "clinical-note-alma-2026-07-11",
        sourceRevision: 2,
        state: "SUBMITTED",
        provenance: "OBSERVED",
        occurredAt: "2026-07-11T11:12:00+01:00",
        recordedAt: "2026-07-11T11:20:00+01:00",
        requiredStaffCapability: "medical.detail",
        requiredParentCapability: null,
        publication: "INTERNAL",
        sensitivity: "RESTRICTED",
        staffTitle: "Clinical assessment recorded",
        staffDetail: "Restricted clinical detail is available to assigned health staff only.",
        staffPath: "Health / Clinical notes / Revision 2",
        parentTitle: null,
        parentDetail: null,
        parentPath: null,
      },
      {
        ...base,
        id: "call-family-5",
        sourceKind: "COMMUNICATION",
        sourceId: "call-alma-family-2026-07-10",
        sourceRevision: 5,
        state: "RESOLVED",
        provenance: "SUBMITTED",
        occurredAt: "2026-07-10T15:44:00+01:00",
        recordedAt: "2026-07-10T15:46:00+01:00",
        requiredStaffCapability: "calls.read",
        requiredParentCapability: null,
        publication: "INTERNAL",
        sensitivity: "SENSITIVE",
        staffTitle: "Family call logged",
        staffDetail: "Pickup arrangement call completed and recorded.",
        staffPath: "Communication / Calls / Revision 5",
        parentTitle: null,
        parentDetail: null,
        parentPath: null,
      },
      {
        ...base,
        id: "payment-july-7",
        sourceKind: "FINANCE",
        sourceId: "payment-alma-july",
        sourceRevision: 7,
        state: "WAITING",
        provenance: "DERIVED",
        occurredAt: "2026-07-09T09:00:00+01:00",
        recordedAt: "2026-07-09T09:00:05+01:00",
        requiredStaffCapability: "finance.read",
        requiredParentCapability: "parent.finance.read",
        publication: "PUBLISHED",
        sensitivity: "SENSITIVE",
        staffTitle: "July payment needs allocation",
        staffDetail: "The recorded payment is not connected to an accountable ledger allocation.",
        staffPath: "Finance / July / Payment revision 7",
        parentTitle: "July account update",
        parentDetail: "A July account item needs review.",
        parentPath: "Finance / July",
      },
      {
        ...base,
        id: "document-consent-4",
        sourceKind: "DOCUMENT",
        sourceId: "consent-alma-photo",
        sourceRevision: 4,
        state: "SUBMITTED",
        provenance: "IMPORTED",
        occurredAt: "2026-07-04T12:00:00+01:00",
        recordedAt: "2026-07-04T12:00:00+01:00",
        requiredStaffCapability: "documents.read",
        requiredParentCapability: "parent.documents.read",
        publication: "PUBLISHED",
        sensitivity: "SENSITIVE",
        staffTitle: "Photo consent imported",
        staffDetail: "Imported consent remains provenance-labeled at revision 4.",
        staffPath: "Documents / Consent / Imported revision 4",
        parentTitle: "Photo consent",
        parentDetail: "Your current photo consent record is available.",
        parentPath: "Documents / Photo consent",
      },
      {
        ...base,
        id: "safeguarding-internal-3",
        sourceKind: "PROFILE",
        sourceId: "safeguarding-alma-collection",
        sourceRevision: 3,
        state: "SUBMITTED",
        provenance: "IMPORTED",
        occurredAt: "2026-07-02T08:00:00+01:00",
        recordedAt: "2026-07-02T08:00:00+01:00",
        requiredStaffCapability: "safeguarding.read",
        requiredParentCapability: null,
        publication: "INTERNAL",
        sensitivity: "RESTRICTED",
        staffTitle: "Restricted collection record",
        staffDetail: "Open the protected source before any collection decision.",
        staffPath: "Safeguarding / Collection restriction revision 3",
        parentTitle: null,
        parentDetail: null,
        parentPath: null,
      },
    ],
    acceptedEvents: [],
  }
}
