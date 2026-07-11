export type DailyCareCapability =
  | "care.view_room"
  | "care.record"
  | "care.save_draft"
  | "care.submit"
  | "care.deliver"
  | "care.correct"
  | "care.view_parent"
  | "care.audit"

export type DailyCareStatus =
  | "SOURCE_GAP"
  | "EMPTY_CAPTURE"
  | "SHARED_REVIEW"
  | "EXCEPTION_REVIEW"
  | "DRAFT_SAVED"
  | "SYNC_CONFLICT"
  | "SUBMISSION_BLOCKED"
  | "SUBMITTED"
  | "DELIVERY_FAILED"
  | "DELIVERED"
  | "CORRECTION_REVIEW"
  | "CORRECTED"

export type DailyCareFixtureStage =
  | "source-gap"
  | "empty-capture"
  | "shared-review"
  | "exception-review"
  | "draft-saved"
  | "sync-conflict"
  | "submission-blocked"
  | "submitted"
  | "delivery-failed"
  | "delivered"
  | "correction-review"
  | "corrected"

export interface DailyCareSourceRevision {
  sourceId: string
  revision: number
}

export interface CareFieldDefinition {
  id: string
  label: string
  requiredForSubmission: boolean
  offlineAllowed: boolean
  parentVisible: boolean
  sensitivity: "ROUTINE" | "HEALTH" | "INTERNAL"
  allowedValues?: string[]
}

export interface CareChild {
  id: string
  displayName: string
  roomId: string
  parentAccountId: string
  attendance: "PRESENT" | "ABSENT" | "UNKNOWN"
  attendanceEventId?: string
  attendanceSource?: DailyCareSourceRevision
}

export interface PendingSharedObservation {
  id: string
  selectedChildIds: string[]
  values: Record<string, string>
  preparedBy: string
  preparedAt: string
  sourceSessionRevision: number
}

export interface CareObservation {
  id: string
  childId: string
  fieldId: string
  value: string
  provenance: "SHARED" | "EXCEPTION" | "INDIVIDUAL" | "CORRECTION"
  sharedObservationId?: string
  observedBy: string
  observedAt: string
  sourceRevision: number
}

export interface CareReportRevision {
  revision: number
  kind: "DRAFT" | "SUBMISSION" | "CORRECTION"
  observations: CareObservation[]
  authoredBy: string
  authoredAt: string
  sourceSessionRevision: number
  correctsRevision?: number
  correctionReason?: string
}

export interface CareReport {
  id: string
  childId: string
  reportDate: string
  status: "DRAFT" | "SUBMITTED"
  currentRevision: number
  revisions: CareReportRevision[]
  attendanceEventId: string
  createdAt: string
  updatedAt: string
}

export interface DraftSyncConflict {
  id: string
  reportId: string
  childId: string
  status: "OPEN" | "RESOLVED"
  serverRevision: number
  localBaseRevision: number
  serverObservation: CareObservation
  localObservation: CareObservation
  detectedAt: string
  resolvedAt?: string
  resolution?: "SERVER" | "LOCAL" | "MERGED"
  changedSource?: DailyCareSourceRevision
}

export interface ParentDeliveryAttempt {
  id: string
  reportId: string
  reportRevision: number
  parentAccountId: string
  status: "PENDING" | "FAILED" | "DELIVERED"
  attemptedAt?: string
  deliveredAt?: string
  errorCode?: string
  idempotencyKey: string
}

export interface OfflineCareItem {
  id: string
  childId: string
  fieldId: string
  value: string
  baseSessionRevision: number
  queuedAt: string
  state: "QUEUED" | "SYNCED" | "CONFLICT"
}

export interface CareCorrectionDraft {
  id: string
  reportId: string
  childId: string
  baseRevision: number
  reason: string
  fieldId: string
  value: string
  status: "OPEN" | "PUBLISHED"
  createdBy: string
  createdAt: string
  publishedAt?: string
}

export interface DailyCareEvent {
  eventId: string
  idempotencyKey: string
  fingerprint: string
  kind:
    | "SOURCES_CONFIRMED"
    | "SHARED_PREPARED"
    | "SHARED_APPLIED"
    | "EXCEPTION_RECORDED"
    | "DRAFTS_SAVED"
    | "DRAFT_CONFLICT_DETECTED"
    | "DRAFT_CONFLICT_RESOLVED"
    | "SOURCES_REFRESHED"
    | "REPORTS_SUBMITTED"
    | "DELIVERY_ATTEMPTED"
    | "CORRECTION_STARTED"
    | "CORRECTION_PUBLISHED"
  actorId: string
  occurredAt: string
  detail: string
  resultingRevision: number
}

export interface DailyCareSession {
  id: string
  branch: { id: string; label: string }
  room: { id: string; label: string }
  reportDate: string
  revision: number
  sourcesTrusted: boolean
  sourceChanged: boolean
  sourceRequirements: string[]
  sourceSnapshot: DailyCareSourceRevision[]
  fieldDefinitions: CareFieldDefinition[]
  children: CareChild[]
  selectedChildIds: string[]
  pendingShared?: PendingSharedObservation
  observations: CareObservation[]
  reports: CareReport[]
  conflicts: DraftSyncConflict[]
  deliveries: ParentDeliveryAttempt[]
  offlineQueue: OfflineCareItem[]
  corrections: CareCorrectionDraft[]
  events: DailyCareEvent[]
}

export interface DailyCareCommand {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedRevision: number
  actorCapabilities: readonly DailyCareCapability[]
}

export interface CareChildProjection {
  childId: string
  displayName: string
  attendance: CareChild["attendance"]
  selected: boolean
  reportStatus: "NOT_STARTED" | "DRAFT" | "SUBMITTED"
  reportRevision?: number
  complete: boolean
  missingFields: string[]
  delivered: boolean
}

const managerCapabilities: DailyCareCapability[] = [
  "care.view_room",
  "care.record",
  "care.save_draft",
  "care.submit",
  "care.deliver",
  "care.correct",
  "care.view_parent",
  "care.audit",
]

function fingerprint(command: object) {
  return JSON.stringify(command)
}

function beginCommand(
  session: DailyCareSession,
  command: DailyCareCommand,
  capability: DailyCareCapability,
  options: { allowSourceChanged?: boolean } = {},
) {
  const commandFingerprint = fingerprint(command)
  const existing = session.events.find((event) => event.idempotencyKey === command.idempotencyKey)
  if (existing) {
    if (existing.fingerprint !== commandFingerprint) {
      throw new Error("Idempotency key reused with different input")
    }
    return { repeated: true, fingerprint: commandFingerprint }
  }
  if (!command.actorCapabilities.includes(capability)) {
    throw new Error(`Missing capability: ${capability}`)
  }
  if (session.revision !== command.expectedRevision) {
    throw new Error(
      `Daily care session revision conflict: expected ${command.expectedRevision}, found ${session.revision}`,
    )
  }
  if (session.sourceChanged && !options.allowSourceChanged) {
    throw new Error("Care sources changed; refresh before accepting work")
  }
  return { repeated: false, fingerprint: commandFingerprint }
}

function appendEvent(
  session: DailyCareSession,
  command: DailyCareCommand,
  event: Pick<DailyCareEvent, "kind" | "detail">,
  commandFingerprint: string,
  patch: Partial<DailyCareSession>,
) {
  const resultingRevision = session.revision + 1
  return {
    ...session,
    ...patch,
    revision: resultingRevision,
    events: [
      ...session.events,
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

function mergeSourceSnapshots(
  previous: DailyCareSourceRevision[],
  incoming: DailyCareSourceRevision[],
) {
  const sources = new Map(previous.map((source) => [source.sourceId, source]))
  for (const source of incoming) sources.set(source.sourceId, source)
  return [...sources.values()]
}

function sourceSnapshotTrusted(
  session: DailyCareSession,
  snapshot: DailyCareSourceRevision[],
) {
  return session.sourceRequirements.every((requirement) =>
    snapshot.some((source) => source.sourceId === requirement),
  )
}

function childForSession(session: DailyCareSession, childId: string) {
  const child = session.children.find((entry) => entry.id === childId)
  if (!child || child.roomId !== session.room.id) {
    throw new Error("Child is outside this room care session")
  }
  return child
}

function definitionForSession(session: DailyCareSession, fieldId: string) {
  const definition = session.fieldDefinitions.find((entry) => entry.id === fieldId)
  if (!definition) throw new Error(`Unknown care field: ${fieldId}`)
  return definition
}

function validateFieldValue(definition: CareFieldDefinition, value: string) {
  if (!value.trim()) throw new Error(`${definition.label} cannot be empty`)
  if (definition.allowedValues && !definition.allowedValues.includes(value)) {
    throw new Error(`${definition.label} value is outside policy`)
  }
}

function latestObservation(
  observations: CareObservation[],
  childId: string,
  fieldId: string,
) {
  return observations
    .filter((entry) => entry.childId === childId && entry.fieldId === fieldId)
    .sort((first, second) => second.sourceRevision - first.sourceRevision)[0]
}

function reportForChild(session: DailyCareSession, childId: string) {
  return session.reports.find((report) => report.childId === childId)
}

function currentReportObservations(report: CareReport | undefined) {
  if (!report) return []
  return report.revisions.find((revision) => revision.revision === report.currentRevision)?.observations ?? []
}

export function missingRequiredCareFields(
  session: DailyCareSession,
  childId: string,
  observations = currentReportObservations(reportForChild(session, childId)),
) {
  return session.fieldDefinitions
    .filter((definition) => definition.requiredForSubmission)
    .filter((definition) => !latestObservation(observations, childId, definition.id))
    .map((definition) => definition.id)
}

function currentDeliveryForReport(session: DailyCareSession, report: CareReport) {
  return session.deliveries
    .filter(
      (delivery) =>
        delivery.reportId === report.id && delivery.reportRevision === report.currentRevision,
    )
    .at(-1)
}

export function projectDailyCareChildren(session: DailyCareSession): CareChildProjection[] {
  return session.children.map((child) => {
    const report = reportForChild(session, child.id)
    const missingFields = report ? missingRequiredCareFields(session, child.id) : []
    return {
      childId: child.id,
      displayName: child.displayName,
      attendance: child.attendance,
      selected: session.selectedChildIds.includes(child.id),
      reportStatus: report?.status ?? "NOT_STARTED",
      reportRevision: report?.currentRevision,
      complete: Boolean(report && missingFields.length === 0),
      missingFields,
      delivered: Boolean(report && currentDeliveryForReport(session, report)?.status === "DELIVERED"),
    }
  })
}

export function deriveDailyCareStatus(session: DailyCareSession): DailyCareStatus {
  if (!session.sourcesTrusted) return "SOURCE_GAP"
  const openCorrection = session.corrections.find((entry) => entry.status === "OPEN")
  if (openCorrection) return "CORRECTION_REVIEW"
  if (session.events.at(-1)?.kind === "CORRECTION_PUBLISHED") return "CORRECTED"
  const submittedReports = session.reports.filter((report) => report.status === "SUBMITTED")
  if (submittedReports.length > 0) {
    const currentDeliveries = submittedReports.map((report) =>
      currentDeliveryForReport(session, report),
    )
    if (currentDeliveries.every((delivery) => delivery?.status === "DELIVERED")) {
      return "DELIVERED"
    }
    if (currentDeliveries.some((delivery) => delivery?.status === "FAILED")) {
      return "DELIVERY_FAILED"
    }
    return "SUBMITTED"
  }
  if (session.sourceChanged) return "SUBMISSION_BLOCKED"
  if (session.conflicts.some((conflict) => conflict.status === "OPEN")) {
    return "SYNC_CONFLICT"
  }
  if (session.reports.length > 0) return "DRAFT_SAVED"
  if (session.observations.length > 0) return "EXCEPTION_REVIEW"
  if (session.pendingShared) return "SHARED_REVIEW"
  return "EMPTY_CAPTURE"
}

export function confirmDailyCareSources(
  session: DailyCareSession,
  command: DailyCareCommand & { sources: DailyCareSourceRevision[] },
) {
  const start = beginCommand(session, command, "care.record")
  if (start.repeated) return session
  for (const source of command.sources) {
    const previous = session.sourceSnapshot.find((entry) => entry.sourceId === source.sourceId)
    if (previous && source.revision < previous.revision) {
      throw new Error(`Source revision cannot regress: ${source.sourceId}`)
    }
  }
  const sourceSnapshot = mergeSourceSnapshots(session.sourceSnapshot, command.sources)
  if (!sourceSnapshotTrusted(session, sourceSnapshot)) {
    throw new Error("Every required daily care source must be confirmed")
  }
  return appendEvent(
    session,
    command,
    { kind: "SOURCES_CONFIRMED", detail: `${sourceSnapshot.length} care sources confirmed` },
    start.fingerprint,
    { sourceSnapshot, sourcesTrusted: true },
  )
}

export function prepareSharedCareObservation(
  session: DailyCareSession,
  command: DailyCareCommand & {
    selectedChildIds: string[]
    values: Record<string, string>
  },
) {
  const start = beginCommand(session, command, "care.record")
  if (start.repeated) return session
  const selectedChildIds = [...new Set(command.selectedChildIds)]
  if (!selectedChildIds.length) throw new Error("Select at least one observed child")
  for (const childId of selectedChildIds) {
    const child = childForSession(session, childId)
    if (child.attendance !== "PRESENT" || !child.attendanceEventId || !child.attendanceSource) {
      throw new Error(`${child.displayName} has no confirmed present attendance event`)
    }
  }
  const values = Object.fromEntries(
    Object.entries(command.values).map(([fieldId, value]) => {
      const definition = definitionForSession(session, fieldId)
      validateFieldValue(definition, value)
      return [fieldId, value]
    }),
  )
  if (!Object.keys(values).length) throw new Error("Shared observation is empty")
  return appendEvent(
    session,
    command,
    { kind: "SHARED_PREPARED", detail: `${Object.keys(values).length} fields prepared for ${selectedChildIds.length} children` },
    start.fingerprint,
    {
      selectedChildIds,
      pendingShared: {
        id: `shared-${command.eventId}`,
        selectedChildIds,
        values,
        preparedBy: command.actorId,
        preparedAt: command.occurredAt,
        sourceSessionRevision: session.revision,
      },
    },
  )
}

export function applySharedCareObservation(
  session: DailyCareSession,
  command: DailyCareCommand & { sharedObservationId: string },
) {
  const start = beginCommand(session, command, "care.record")
  if (start.repeated) return session
  const pending = session.pendingShared
  if (!pending || pending.id !== command.sharedObservationId) {
    throw new Error("Prepared shared observation not found")
  }
  for (const childId of pending.selectedChildIds) {
    const child = childForSession(session, childId)
    if (child.attendance !== "PRESENT") {
      throw new Error(`${child.displayName} is no longer confirmed present`)
    }
  }
  const observations = [...session.observations]
  for (const childId of pending.selectedChildIds) {
    for (const [fieldId, value] of Object.entries(pending.values)) {
      observations.push({
        id: `observation-${command.eventId}-${childId}-${fieldId}`,
        childId,
        fieldId,
        value,
        provenance: "SHARED",
        sharedObservationId: pending.id,
        observedBy: command.actorId,
        observedAt: command.occurredAt,
        sourceRevision: session.revision + 1,
      })
    }
  }
  return appendEvent(
    session,
    command,
    { kind: "SHARED_APPLIED", detail: `Shared observation applied to ${pending.selectedChildIds.length} confirmed-present children` },
    start.fingerprint,
    { observations, pendingShared: undefined },
  )
}

export function recordCareException(
  session: DailyCareSession,
  command: DailyCareCommand & { childId: string; fieldId: string; value: string },
) {
  const start = beginCommand(session, command, "care.record")
  if (start.repeated) return session
  const child = childForSession(session, command.childId)
  if (!session.selectedChildIds.includes(child.id)) {
    throw new Error("Child is outside the selected observation group")
  }
  const definition = definitionForSession(session, command.fieldId)
  validateFieldValue(definition, command.value)
  const previous = latestObservation(session.observations, child.id, definition.id)
  if (!previous) throw new Error("Shared source observation is missing")
  const observation: CareObservation = {
    id: `exception-${command.eventId}`,
    childId: child.id,
    fieldId: definition.id,
    value: command.value,
    provenance: "EXCEPTION",
    sharedObservationId: previous.sharedObservationId,
    observedBy: command.actorId,
    observedAt: command.occurredAt,
    sourceRevision: previous.sourceRevision + 1,
  }
  return appendEvent(
    session,
    command,
    { kind: "EXCEPTION_RECORDED", detail: `${definition.label} exception recorded for ${child.displayName}` },
    start.fingerprint,
    { observations: [...session.observations, observation] },
  )
}

export function saveDailyCareDrafts(
  session: DailyCareSession,
  command: DailyCareCommand,
) {
  const start = beginCommand(session, command, "care.save_draft")
  if (start.repeated) return session
  if (!session.selectedChildIds.length) throw new Error("No observed children selected")
  const reports = [...session.reports]
  for (const childId of session.selectedChildIds) {
    const child = childForSession(session, childId)
    if (child.attendance !== "PRESENT" || !child.attendanceEventId) {
      throw new Error(`${child.displayName} is not confirmed present`)
    }
    const observations = session.observations.filter((entry) => entry.childId === childId)
    const existing = reports.find((report) => report.childId === childId)
    const revision = (existing?.currentRevision ?? 0) + 1
    const reportRevision: CareReportRevision = {
      revision,
      kind: "DRAFT",
      observations,
      authoredBy: command.actorId,
      authoredAt: command.occurredAt,
      sourceSessionRevision: session.revision,
    }
    if (existing) {
      existing.status = "DRAFT"
      existing.currentRevision = revision
      existing.revisions = [...existing.revisions, reportRevision]
      existing.updatedAt = command.occurredAt
    } else {
      reports.push({
        id: `report-${childId}`,
        childId,
        reportDate: session.reportDate,
        status: "DRAFT",
        currentRevision: revision,
        revisions: [reportRevision],
        attendanceEventId: child.attendanceEventId,
        createdAt: command.occurredAt,
        updatedAt: command.occurredAt,
      })
    }
  }
  return appendEvent(
    session,
    command,
    { kind: "DRAFTS_SAVED", detail: `${session.selectedChildIds.length} versioned drafts saved atomically` },
    start.fingerprint,
    { reports },
  )
}

export function queueOfflineCareObservation(
  session: DailyCareSession,
  command: DailyCareCommand & { childId: string; fieldId: string; value: string },
) {
  const start = beginCommand(session, command, "care.record")
  if (start.repeated) return session
  const child = childForSession(session, command.childId)
  const definition = definitionForSession(session, command.fieldId)
  if (!definition.offlineAllowed) {
    throw new Error(`${definition.label} is not approved for offline storage`)
  }
  validateFieldValue(definition, command.value)
  return appendEvent(
    session,
    command,
    { kind: "DRAFTS_SAVED", detail: `${definition.label} queued offline for ${child.displayName}` },
    start.fingerprint,
    {
      offlineQueue: [
        ...session.offlineQueue,
        {
          id: `offline-${command.eventId}`,
          childId: child.id,
          fieldId: definition.id,
          value: command.value,
          baseSessionRevision: session.revision,
          queuedAt: command.occurredAt,
          state: "QUEUED",
        },
      ],
    },
  )
}

export function recordDailyCareSyncConflict(
  session: DailyCareSession,
  command: DailyCareCommand & {
    reportId: string
    serverObservation: CareObservation
    localObservation: CareObservation
    changedSource?: DailyCareSourceRevision
  },
) {
  const start = beginCommand(session, command, "care.save_draft")
  if (start.repeated) return session
  const report = session.reports.find((entry) => entry.id === command.reportId)
  if (!report || report.status !== "DRAFT") throw new Error("Draft report not found")
  if (
    command.serverObservation.childId !== report.childId ||
    command.localObservation.childId !== report.childId ||
    command.serverObservation.fieldId !== command.localObservation.fieldId
  ) {
    throw new Error("Conflict observations do not describe the same child field")
  }
  return appendEvent(
    session,
    command,
    { kind: "DRAFT_CONFLICT_DETECTED", detail: `Cross-device conflict detected for ${report.childId}` },
    start.fingerprint,
    {
      conflicts: [
        ...session.conflicts,
        {
          id: `conflict-${command.eventId}`,
          reportId: report.id,
          childId: report.childId,
          status: "OPEN",
          serverRevision: report.currentRevision + 1,
          localBaseRevision: report.currentRevision,
          serverObservation: command.serverObservation,
          localObservation: command.localObservation,
          detectedAt: command.occurredAt,
          changedSource: command.changedSource,
        },
      ],
    },
  )
}

export function resolveDailyCareSyncConflict(
  session: DailyCareSession,
  command: DailyCareCommand & { conflictId: string; resolution: "SERVER" | "LOCAL" | "MERGED" },
) {
  const start = beginCommand(session, command, "care.save_draft")
  if (start.repeated) return session
  const conflict = session.conflicts.find((entry) => entry.id === command.conflictId)
  if (!conflict || conflict.status !== "OPEN") throw new Error("Open draft conflict not found")
  const report = session.reports.find((entry) => entry.id === conflict.reportId)
  if (!report) throw new Error("Conflict report not found")
  const selected =
    command.resolution === "SERVER" ? conflict.serverObservation : conflict.localObservation
  const current = currentReportObservations(report).filter(
    (entry) => !(entry.childId === selected.childId && entry.fieldId === selected.fieldId),
  )
  const mergedObservation = {
    ...selected,
    id: `resolved-${command.eventId}`,
    provenance: "EXCEPTION" as const,
    sourceRevision: Math.max(
      conflict.serverObservation.sourceRevision,
      conflict.localObservation.sourceRevision,
    ) + 1,
  }
  const revision = report.currentRevision + 1
  const reports = session.reports.map((entry) =>
    entry.id === report.id
      ? {
          ...entry,
          currentRevision: revision,
          updatedAt: command.occurredAt,
          revisions: [
            ...entry.revisions,
            {
              revision,
              kind: "DRAFT" as const,
              observations: [...current, mergedObservation],
              authoredBy: command.actorId,
              authoredAt: command.occurredAt,
              sourceSessionRevision: session.revision,
            },
          ],
        }
      : entry,
  )
  return appendEvent(
    session,
    command,
    { kind: "DRAFT_CONFLICT_RESOLVED", detail: `${command.resolution.toLowerCase()} draft resolution preserved as revision ${revision}` },
    start.fingerprint,
    {
      reports,
      conflicts: session.conflicts.map((entry) =>
        entry.id === conflict.id
          ? {
              ...entry,
              status: "RESOLVED" as const,
              resolvedAt: command.occurredAt,
              resolution: command.resolution,
            }
          : entry,
      ),
      sourceChanged: Boolean(conflict.changedSource),
    },
  )
}

export function refreshDailyCareSources(
  session: DailyCareSession,
  command: DailyCareCommand & { sources: DailyCareSourceRevision[] },
) {
  const start = beginCommand(session, command, "care.record", { allowSourceChanged: true })
  if (start.repeated) return session
  if (!session.sourceChanged) throw new Error("Daily care sources are already current")
  for (const requirement of session.sourceRequirements) {
    if (!command.sources.some((source) => source.sourceId === requirement)) {
      throw new Error(`Refresh omitted source: ${requirement}`)
    }
  }
  for (const source of command.sources) {
    const previous = session.sourceSnapshot.find((entry) => entry.sourceId === source.sourceId)
    if (previous && source.revision < previous.revision) {
      throw new Error(`Source revision cannot regress: ${source.sourceId}`)
    }
  }
  const sourceSnapshot = mergeSourceSnapshots(session.sourceSnapshot, command.sources)
  return appendEvent(
    session,
    command,
    { kind: "SOURCES_REFRESHED", detail: `${sourceSnapshot.length} care sources revalidated` },
    start.fingerprint,
    { sourceSnapshot, sourceChanged: false, sourcesTrusted: sourceSnapshotTrusted(session, sourceSnapshot) },
  )
}

export function submitDailyCareReports(
  session: DailyCareSession,
  command: DailyCareCommand & { reportIds: string[] },
) {
  const start = beginCommand(session, command, "care.submit")
  if (start.repeated) return session
  const reportIds = [...new Set(command.reportIds)]
  if (!reportIds.length) throw new Error("Select at least one draft report")
  const selectedReports = reportIds.map((reportId) => {
    const report = session.reports.find((entry) => entry.id === reportId)
    if (!report || report.status !== "DRAFT") throw new Error("Selected draft report not found")
    return report
  })
  const blockers: string[] = []
  for (const report of selectedReports) {
    const child = childForSession(session, report.childId)
    if (child.attendance !== "PRESENT" || child.attendanceEventId !== report.attendanceEventId) {
      blockers.push(`${child.displayName}: attendance source mismatch`)
    }
    const missing = missingRequiredCareFields(session, report.childId)
    if (missing.length) blockers.push(`${child.displayName}: ${missing.join(", ")}`)
  }
  if (blockers.length) throw new Error(`Submission blocked: ${blockers.join("; ")}`)
  const reports = session.reports.map((report) => {
    if (!reportIds.includes(report.id)) return report
    const observations = currentReportObservations(report)
    const revision = report.currentRevision + 1
    return {
      ...report,
      status: "SUBMITTED" as const,
      currentRevision: revision,
      updatedAt: command.occurredAt,
      revisions: [
        ...report.revisions,
        {
          revision,
          kind: "SUBMISSION" as const,
          observations,
          authoredBy: command.actorId,
          authoredAt: command.occurredAt,
          sourceSessionRevision: session.revision,
        },
      ],
    }
  })
  const deliveries: ParentDeliveryAttempt[] = [
    ...session.deliveries,
    ...reports
      .filter((report) => reportIds.includes(report.id))
      .map((report) => ({
        id: `delivery-${command.eventId}-${report.id}`,
        reportId: report.id,
        reportRevision: report.currentRevision,
        parentAccountId: childForSession(session, report.childId).parentAccountId,
        status: "PENDING" as const,
        idempotencyKey: `delivery-${report.id}-r${report.currentRevision}`,
      })),
  ]
  return appendEvent(
    session,
    command,
    { kind: "REPORTS_SUBMITTED", detail: `${reportIds.length} complete reports submitted atomically; ${reportIds.length} deliveries pending` },
    start.fingerprint,
    { reports, deliveries },
  )
}

export function attemptDailyCareDelivery(
  session: DailyCareSession,
  command: DailyCareCommand & { succeed: boolean; errorCode?: string },
) {
  const start = beginCommand(session, command, "care.deliver")
  if (start.repeated) return session
  const pendingReports = session.reports.filter((report) => report.status === "SUBMITTED")
  if (!pendingReports.length) throw new Error("No submitted reports are ready for delivery")
  const deliveries = session.deliveries.map((delivery) => {
    const currentReport = pendingReports.find(
      (report) =>
        report.id === delivery.reportId && report.currentRevision === delivery.reportRevision,
    )
    if (!currentReport || delivery.status === "DELIVERED") return delivery
    return command.succeed
      ? {
          ...delivery,
          status: "DELIVERED" as const,
          attemptedAt: command.occurredAt,
          deliveredAt: command.occurredAt,
          errorCode: undefined,
        }
      : {
          ...delivery,
          status: "FAILED" as const,
          attemptedAt: command.occurredAt,
          errorCode: command.errorCode ?? "PROVIDER_UNAVAILABLE",
        }
  })
  return appendEvent(
    session,
    command,
    { kind: "DELIVERY_ATTEMPTED", detail: command.succeed ? `${pendingReports.length} parent deliveries confirmed` : `${pendingReports.length} parent deliveries failed and remain retryable` },
    start.fingerprint,
    { deliveries },
  )
}

export function startDailyCareCorrection(
  session: DailyCareSession,
  command: DailyCareCommand & {
    reportId: string
    reason: string
    fieldId: string
    value: string
  },
) {
  const start = beginCommand(session, command, "care.correct")
  if (start.repeated) return session
  const report = session.reports.find((entry) => entry.id === command.reportId)
  if (!report || report.status !== "SUBMITTED") throw new Error("Submitted report not found")
  if (!command.reason.trim()) throw new Error("Correction reason is required")
  const definition = definitionForSession(session, command.fieldId)
  validateFieldValue(definition, command.value)
  return appendEvent(
    session,
    command,
    { kind: "CORRECTION_STARTED", detail: `Correction opened for ${report.childId} revision ${report.currentRevision}` },
    start.fingerprint,
    {
      corrections: [
        ...session.corrections,
        {
          id: `correction-${command.eventId}`,
          reportId: report.id,
          childId: report.childId,
          baseRevision: report.currentRevision,
          reason: command.reason,
          fieldId: definition.id,
          value: command.value,
          status: "OPEN",
          createdBy: command.actorId,
          createdAt: command.occurredAt,
        },
      ],
    },
  )
}

export function publishDailyCareCorrection(
  session: DailyCareSession,
  command: DailyCareCommand & { correctionId: string },
) {
  const start = beginCommand(session, command, "care.correct")
  if (start.repeated) return session
  const correction = session.corrections.find((entry) => entry.id === command.correctionId)
  if (!correction || correction.status !== "OPEN") throw new Error("Open correction not found")
  const report = session.reports.find((entry) => entry.id === correction.reportId)
  if (!report || report.currentRevision !== correction.baseRevision) {
    throw new Error("Report changed after correction review")
  }
  const current = currentReportObservations(report).filter(
    (entry) => !(entry.childId === report.childId && entry.fieldId === correction.fieldId),
  )
  const prior = latestObservation(currentReportObservations(report), report.childId, correction.fieldId)
  const correctedObservation: CareObservation = {
    id: `corrected-${command.eventId}`,
    childId: report.childId,
    fieldId: correction.fieldId,
    value: correction.value,
    provenance: "CORRECTION",
    sharedObservationId: prior?.sharedObservationId,
    observedBy: command.actorId,
    observedAt: command.occurredAt,
    sourceRevision: (prior?.sourceRevision ?? 0) + 1,
  }
  const revision = report.currentRevision + 1
  const reports = session.reports.map((entry) =>
    entry.id === report.id
      ? {
          ...entry,
          currentRevision: revision,
          updatedAt: command.occurredAt,
          revisions: [
            ...entry.revisions,
            {
              revision,
              kind: "CORRECTION" as const,
              observations: [...current, correctedObservation],
              authoredBy: command.actorId,
              authoredAt: command.occurredAt,
              sourceSessionRevision: session.revision,
              correctsRevision: correction.baseRevision,
              correctionReason: correction.reason,
            },
          ],
        }
      : entry,
  )
  return appendEvent(
    session,
    command,
    { kind: "CORRECTION_PUBLISHED", detail: `Revision ${revision} appended; previous parent-visible history retained` },
    start.fingerprint,
    {
      reports,
      corrections: session.corrections.map((entry) =>
        entry.id === correction.id
          ? { ...entry, status: "PUBLISHED" as const, publishedAt: command.occurredAt }
          : entry,
      ),
      deliveries: [
        ...session.deliveries,
        {
          id: `delivery-correction-${command.eventId}`,
          reportId: report.id,
          reportRevision: revision,
          parentAccountId: childForSession(session, report.childId).parentAccountId,
          status: "PENDING" as const,
          idempotencyKey: `delivery-${report.id}-r${revision}`,
        },
      ],
    },
  )
}

export type DailyCareRole = "manager" | "practitioner" | "parent"

export function capabilitiesForDailyCareRole(role: DailyCareRole): DailyCareCapability[] {
  if (role === "manager") return [...managerCapabilities]
  if (role === "practitioner") {
    return ["care.view_room", "care.record", "care.save_draft", "care.submit"]
  }
  return ["care.view_parent"]
}

export function projectDailyCareForRole(
  session: DailyCareSession,
  role: DailyCareRole,
  parentAccountId = "parent-amelie",
) {
  if (role === "parent") {
    const linkedChildren = session.children.filter(
      (child) => child.parentAccountId === parentAccountId,
    )
    const publications = linkedChildren.flatMap((child) => {
      const report = reportForChild(session, child.id)
      if (!report || report.status !== "SUBMITTED") return []
      const deliveredRevisions = session.deliveries
        .filter(
          (delivery) =>
            delivery.reportId === report.id &&
            delivery.parentAccountId === parentAccountId &&
            delivery.status === "DELIVERED",
        )
        .map((delivery) => delivery.reportRevision)
      if (!deliveredRevisions.length) return []
      const latestDeliveredRevision = Math.max(...deliveredRevisions)
      const revision = report.revisions.find(
        (entry) => entry.revision === latestDeliveredRevision,
      )
      if (!revision) return []
      return [{
        childId: child.id,
        childDisplayName: child.displayName,
        reportId: report.id,
        reportRevision: revision.revision,
        corrected: revision.kind === "CORRECTION",
        observations: revision.observations
          .filter((observation) =>
            session.fieldDefinitions.find(
              (definition) =>
                definition.id === observation.fieldId && definition.parentVisible,
            ),
          )
          .map((observation) => ({
            fieldId: observation.fieldId,
            label: definitionForSession(session, observation.fieldId).label,
            value: observation.value,
          })),
      }]
    })
    return {
      status: deriveDailyCareStatus(session),
      children: linkedChildren.map((child) => ({
        id: child.id,
        displayName: child.displayName,
        attendance: child.attendance,
      })),
      publications,
      events: [],
      deliveries: [],
      conflicts: [],
      roomChildren: [],
    }
  }
  return {
    status: deriveDailyCareStatus(session),
    children: session.children,
    publications: [],
    events: role === "manager" ? session.events : [],
    deliveries: role === "manager" ? session.deliveries : session.deliveries.map((delivery) => ({
      reportId: delivery.reportId,
      reportRevision: delivery.reportRevision,
      status: delivery.status,
    })),
    conflicts: session.conflicts,
    roomChildren: projectDailyCareChildren(session),
  }
}

function command(
  session: DailyCareSession,
  key: string,
  occurredAt: string,
  capabilities = managerCapabilities,
): DailyCareCommand {
  return {
    eventId: `event-${key}`,
    idempotencyKey: `care-${key}`,
    actorId: "practitioner-jules",
    occurredAt,
    expectedRevision: session.revision,
    actorCapabilities: capabilities,
  }
}

function source(sourceId: string, revision: number): DailyCareSourceRevision {
  return { sourceId, revision }
}

function makeConflictObservation(
  id: string,
  value: string,
  sourceRevision: number,
): CareObservation {
  return {
    id,
    childId: "child-noah",
    fieldId: "mood",
    value,
    provenance: "EXCEPTION",
    sharedObservationId: "shared-event-prepare-shared",
    observedBy: id.includes("server") ? "practitioner-aya" : "practitioner-jules",
    observedAt: "2026-08-05T14:20:00.000Z",
    sourceRevision,
  }
}

export function createDailyCareFixture(stage: DailyCareFixtureStage = "source-gap") {
  let session: DailyCareSession = {
    id: "care-session-meadow-2026-08-05",
    branch: { id: "branch-riverside", label: "Riverside Nursery" },
    room: { id: "room-meadow", label: "Meadow Room" },
    reportDate: "2026-08-05",
    revision: 1,
    sourcesTrusted: false,
    sourceChanged: false,
    sourceRequirements: ["room-roster", "attendance-stream", "care-policy", "approval-policy"],
    sourceSnapshot: [
      source("room-roster", 6),
      source("care-policy", 4),
      source("approval-policy", 3),
    ],
    fieldDefinitions: [
      { id: "breakfastPortion", label: "Breakfast portion", requiredForSubmission: true, offlineAllowed: true, parentVisible: true, sensitivity: "ROUTINE", allowedValues: ["NONE", "LITTLE", "HALF", "MOST", "ALL"] },
      { id: "lunchPortion", label: "Lunch portion", requiredForSubmission: true, offlineAllowed: true, parentVisible: true, sensitivity: "ROUTINE", allowedValues: ["NONE", "LITTLE", "HALF", "MOST", "ALL"] },
      { id: "mood", label: "Observed mood", requiredForSubmission: true, offlineAllowed: true, parentVisible: true, sensitivity: "ROUTINE", allowedValues: ["HAPPY", "CALM", "FUSSY", "CRYING", "SLEEPY"] },
      { id: "symptoms", label: "Observed symptoms", requiredForSubmission: true, offlineAllowed: false, parentVisible: true, sensitivity: "HEALTH", allowedValues: ["NONE_OBSERVED", "NEEDS_REVIEW"] },
      { id: "remarks", label: "Practitioner remarks", requiredForSubmission: false, offlineAllowed: true, parentVisible: true, sensitivity: "ROUTINE" },
      { id: "internalHandover", label: "Internal handover note", requiredForSubmission: false, offlineAllowed: false, parentVisible: false, sensitivity: "INTERNAL" },
    ],
    children: [
      { id: "child-amelie", displayName: "Amelie D.", roomId: "room-meadow", parentAccountId: "parent-amelie", attendance: "PRESENT", attendanceEventId: "attendance-amelie-present", attendanceSource: source("attendance-stream", 7) },
      { id: "child-noah", displayName: "Noah R.", roomId: "room-meadow", parentAccountId: "parent-noah", attendance: "PRESENT", attendanceEventId: "attendance-noah-present", attendanceSource: source("attendance-stream", 7) },
      { id: "child-lina", displayName: "Lina K.", roomId: "room-meadow", parentAccountId: "parent-lina", attendance: "PRESENT", attendanceEventId: "attendance-lina-present", attendanceSource: source("attendance-stream", 7) },
      { id: "child-sami", displayName: "Sami B.", roomId: "room-meadow", parentAccountId: "parent-sami", attendance: "ABSENT", attendanceEventId: "attendance-sami-absent", attendanceSource: source("attendance-stream", 7) },
      { id: "child-zoe", displayName: "Zoe M.", roomId: "room-meadow", parentAccountId: "parent-zoe", attendance: "UNKNOWN" },
    ],
    selectedChildIds: [],
    observations: [],
    reports: [],
    conflicts: [],
    deliveries: [],
    offlineQueue: [],
    corrections: [],
    events: [],
  }
  if (stage === "source-gap") return session
  session = confirmDailyCareSources(session, {
    ...command(session, "confirm-sources", "2026-08-05T13:50:00.000Z"),
    sources: [source("attendance-stream", 7)],
  })
  if (stage === "empty-capture") return session
  session = prepareSharedCareObservation(session, {
    ...command(session, "prepare-shared", "2026-08-05T13:55:00.000Z"),
    selectedChildIds: ["child-amelie", "child-noah", "child-lina"],
    values: {
      breakfastPortion: "HALF",
      lunchPortion: "MOST",
      mood: "CALM",
      symptoms: "NONE_OBSERVED",
    },
  })
  if (stage === "shared-review") return session
  session = applySharedCareObservation(session, {
    ...command(session, "apply-shared", "2026-08-05T14:00:00.000Z"),
    sharedObservationId: "shared-event-prepare-shared",
  })
  if (stage === "exception-review") return session
  session = recordCareException(session, {
    ...command(session, "noah-lunch-exception", "2026-08-05T14:05:00.000Z"),
    childId: "child-noah",
    fieldId: "lunchPortion",
    value: "LITTLE",
  })
  session = saveDailyCareDrafts(session, command(session, "save-drafts", "2026-08-05T14:06:00.000Z"))
  if (stage === "draft-saved") return session
  session = recordDailyCareSyncConflict(session, {
    ...command(session, "record-conflict", "2026-08-05T14:20:00.000Z"),
    reportId: "report-child-noah",
    serverObservation: makeConflictObservation("server-mood", "CALM", 9),
    localObservation: makeConflictObservation("local-mood", "FUSSY", 10),
    changedSource: source("attendance-stream", 8),
  })
  if (stage === "sync-conflict") return session
  session = resolveDailyCareSyncConflict(session, {
    ...command(session, "resolve-conflict", "2026-08-05T14:21:00.000Z"),
    conflictId: "conflict-event-record-conflict",
    resolution: "LOCAL",
  })
  if (stage === "submission-blocked") return session
  session = refreshDailyCareSources(session, {
    ...command(session, "refresh-sources", "2026-08-05T14:22:00.000Z"),
    sources: [
      source("room-roster", 6),
      source("attendance-stream", 8),
      source("care-policy", 4),
      source("approval-policy", 3),
    ],
  })
  session = submitDailyCareReports(session, {
    ...command(session, "submit-reports", "2026-08-05T14:23:00.000Z"),
    reportIds: ["report-child-amelie", "report-child-noah", "report-child-lina"],
  })
  if (stage === "submitted") return session
  session = attemptDailyCareDelivery(session, {
    ...command(session, "delivery-failed", "2026-08-05T14:24:00.000Z"),
    succeed: false,
    errorCode: "PROVIDER_UNAVAILABLE",
  })
  if (stage === "delivery-failed") return session
  session = attemptDailyCareDelivery(session, {
    ...command(session, "delivery-retry", "2026-08-05T14:25:00.000Z"),
    succeed: true,
  })
  if (stage === "delivered") return session
  session = startDailyCareCorrection(session, {
    ...command(session, "start-correction", "2026-08-05T15:10:00.000Z"),
    reportId: "report-child-noah",
    reason: "Lunch portion was confirmed as half after handover review",
    fieldId: "lunchPortion",
    value: "HALF",
  })
  if (stage === "correction-review") return session
  return publishDailyCareCorrection(session, {
    ...command(session, "publish-correction", "2026-08-05T15:11:00.000Z"),
    correctionId: "correction-event-start-correction",
  })
}
