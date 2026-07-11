export type AcademicRolloverCapability =
  | "rollover.view"
  | "rollover.plan"
  | "rollover.preflight"
  | "rollover.capture_backup"
  | "rollover.verify_backup"
  | "rollover.approve"
  | "rollover.execute"
  | "rollover.validate"
  | "rollover.rollback"
  | "rollover.audit"

export type AcademicRolloverRole = "administrator" | "coordinator" | "auditor"

export type AcademicRolloverStatus =
  | "SOURCE_GAP"
  | "PLAN_DRAFT"
  | "PREFLIGHT_BLOCKED"
  | "IMPACT_REVIEW"
  | "BACKUP_PENDING"
  | "BACKUP_UNVERIFIED"
  | "APPROVAL_REQUIRED"
  | "READY_TO_EXECUTE"
  | "EXECUTION_ACCEPTED"
  | "VALIDATION_FAILED"
  | "ROLLBACK_CONFIRMED"
  | "COMPLETED"

export type AcademicRolloverFixtureStage =
  | "source-gap"
  | "plan-draft"
  | "preflight-blocked"
  | "impact-review"
  | "backup-pending"
  | "backup-unverified"
  | "approval-required"
  | "ready-to-execute"
  | "execution-accepted"
  | "validation-failed"
  | "rollback-confirmed"
  | "completed"

export interface RolloverSourceRevision {
  sourceId: string
  revision: number
}

export interface RolloverChildAssignment {
  childId: string
  childName: string
  sourceBranchId: string
  targetBranchId: string
  targetClassId: string
  childNumber: string
  allowBranchTransfer: boolean
}

export interface RolloverTeacherAssignment {
  teacherId: string
  teacherName: string
  sourceBranchId: string
  targetBranchId: string
  targetClassId: string
  allowBranchTransfer: boolean
}

export interface AcademicRolloverPlan {
  revision: number
  fromYearId: string
  fromYearLabel: string
  toYearLabel: string
  startDate: string
  endDate: string
  children: RolloverChildAssignment[]
  teachers: RolloverTeacherAssignment[]
  optionalDomains: Array<"GENERAL_FORMS" | "VACCINATIONS" | "SUFFERING" | "HOLIDAYS">
  unselectedChildPolicy: "UNDECIDED" | "RETAIN_OLD_YEAR" | "DEACTIVATE"
  authoredBy: string
  authoredAt: string
}

export interface RolloverPreflightBlocker {
  id: string
  type:
    | "DUPLICATE_CHILD_NUMBER"
    | "CROSS_BRANCH_CHILD"
    | "CROSS_BRANCH_TEACHER"
    | "CLASS_CAPACITY"
    | "UNSELECTED_POLICY"
  message: string
  recordIds: string[]
}

export interface RolloverPreflight {
  planRevision: number
  sourceRevisions: RolloverSourceRevision[]
  blockers: RolloverPreflightBlocker[]
  impact: {
    childrenSelected: number
    teachersSelected: number
    classesAffected: number
    branchesAffected: number
    optionalDomains: number
    unselectedChildren: number
  }
  checkedBy: string
  checkedAt: string
}

export interface RolloverImpactConfirmation {
  planRevision: number
  preflightRevision: number
  confirmedBy: string
  confirmedAt: string
}

export interface RolloverRestoreProof {
  isolatedTargetId: string
  checksumMatch: boolean
  schemaVersionMatch: boolean
  rowCountMatch: boolean
  foreignKeysValid: boolean
  sampledInvariantsValid: boolean
  restoredAt: string
}

export interface RolloverBackupArtifact {
  id: string
  planRevision: number
  engine: "pg_dump" | "fallback"
  databaseIdentity: string
  storageKey: string
  bytes: number
  sha256: string
  immutable: boolean
  schemaVersion: string
  capturedAt: string
  status: "CAPTURED" | "VERIFIED"
  restoreProof?: RolloverRestoreProof
}

export interface RolloverApproval {
  type: "OPERATOR" | "DATA_CUSTODIAN"
  planRevision: number
  backupId: string
  approvedBy: string
  approvedAt: string
}

export interface RolloverExecutionReceipt {
  id: string
  planRevision: number
  backupId: string
  lockId: string
  sourceRevisions: RolloverSourceRevision[]
  status: "ACCEPTED"
  previousActiveYearId: string
  createdYearId: string
  childrenUpdated: number
  teachersUpdated: number
  acceptedBy: string
  acceptedAt: string
}

export interface RolloverValidationReceipt {
  executionId: string
  status: "PASSED" | "FAILED"
  checks: {
    exactlyOneActiveYear: boolean
    selectedChildrenAssigned: boolean
    selectedTeachersAssigned: boolean
    childHistoryComplete: boolean
    legacyYearAdapterUpdated: boolean
    unrelatedRowsUnchanged: boolean
  }
  validatedBy: string
  validatedAt: string
}

export interface RolloverRollbackReceipt {
  executionId: string
  backupId: string
  checksumMatch: boolean
  previousYearRestored: boolean
  rowCountsMatch: boolean
  rolledBackBy: string
  rolledBackAt: string
}

export interface RolloverAuditEvent {
  id: string
  type: string
  actorId: string
  occurredAt: string
  revision: number
  detail: string
}

interface RolloverIdempotencyReceipt {
  key: string
  eventId: string
  signature: string
  resultingRevision: number
}

export interface AcademicRolloverSession {
  id: string
  organizationId: string
  revision: number
  requiredSources: RolloverSourceRevision[]
  confirmedSources: RolloverSourceRevision[]
  approvedBackupEngines: Array<RolloverBackupArtifact["engine"]>
  classCapacity: Record<string, number>
  currentClassEnrollment: Record<string, number>
  totalActiveChildren: number
  plans: AcademicRolloverPlan[]
  activePlanRevision?: number
  preflight?: RolloverPreflight
  impactConfirmation?: RolloverImpactConfirmation
  backup?: RolloverBackupArtifact
  approvals: RolloverApproval[]
  execution?: RolloverExecutionReceipt
  validation?: RolloverValidationReceipt
  rollback?: RolloverRollbackReceipt
  events: RolloverAuditEvent[]
  idempotencyReceipts: RolloverIdempotencyReceipt[]
}

export interface AcademicRolloverCommand {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedRevision: number
  actorCapabilities: AcademicRolloverCapability[]
}

export interface AcademicRolloverProjection {
  status: AcademicRolloverStatus
  fromYear: string | null
  toYear: string | null
  planRevision: number | null
  blockerCount: number
  impact: RolloverPreflight["impact"] | null
  backupStatus: "NOT_CAPTURED" | "CAPTURED" | "VERIFIED"
  approvalCount: number
  executionStatus: string | null
  validationStatus: string | null
  rollbackStatus: string | null
  childAssignments?: RolloverChildAssignment[]
  teacherAssignments?: RolloverTeacherAssignment[]
  blockers?: RolloverPreflightBlocker[]
  backup?: RolloverBackupArtifact
  approvals?: RolloverApproval[]
  execution?: RolloverExecutionReceipt
  validation?: RolloverValidationReceipt
  rollback?: RolloverRollbackReceipt
  events?: RolloverAuditEvent[]
}

const administratorCapabilities: AcademicRolloverCapability[] = [
  "rollover.view",
  "rollover.plan",
  "rollover.preflight",
  "rollover.capture_backup",
  "rollover.verify_backup",
  "rollover.approve",
  "rollover.execute",
  "rollover.validate",
  "rollover.rollback",
  "rollover.audit",
]

export function capabilitiesForAcademicRolloverRole(
  role: AcademicRolloverRole,
): AcademicRolloverCapability[] {
  if (role === "administrator") return [...administratorCapabilities]
  if (role === "coordinator") {
    return ["rollover.view", "rollover.plan", "rollover.preflight"]
  }
  return [
    "rollover.view",
    "rollover.verify_backup",
    "rollover.approve",
    "rollover.validate",
    "rollover.audit",
  ]
}

function cloneSession(session: AcademicRolloverSession): AcademicRolloverSession {
  return structuredClone(session)
}

function sourceMap(sources: RolloverSourceRevision[]) {
  return new Map(sources.map((source) => [source.sourceId, source.revision]))
}

function sourcesComplete(session: AcademicRolloverSession) {
  const confirmed = sourceMap(session.confirmedSources)
  return session.requiredSources.every(
    (source) => (confirmed.get(source.sourceId) ?? -1) >= source.revision,
  )
}

function activePlan(session: AcademicRolloverSession) {
  return session.plans.find((plan) => plan.revision === session.activePlanRevision)
}

function signature(type: string, payload: unknown) {
  return `${type}:${JSON.stringify(payload)}`
}

function beginCommand(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand,
  capability: AcademicRolloverCapability,
  commandSignature: string,
) {
  if (!command.actorCapabilities.includes(capability)) {
    throw new Error(`Missing capability: ${capability}`)
  }
  const prior = session.idempotencyReceipts.find(
    (receipt) => receipt.key === command.idempotencyKey,
  )
  if (prior) {
    if (prior.eventId !== command.eventId || prior.signature !== commandSignature) {
      throw new Error("Idempotency key was reused with changed input")
    }
    return { replay: true as const, next: session }
  }
  if (command.expectedRevision !== session.revision) {
    throw new Error("Academic rollover revision is stale")
  }
  return { replay: false as const, next: cloneSession(session) }
}

function finishCommand(
  next: AcademicRolloverSession,
  command: AcademicRolloverCommand,
  commandSignature: string,
  type: string,
  detail: string,
) {
  next.revision += 1
  next.idempotencyReceipts.push({
    key: command.idempotencyKey,
    eventId: command.eventId,
    signature: commandSignature,
    resultingRevision: next.revision,
  })
  next.events.push({
    id: command.eventId,
    type,
    actorId: command.actorId,
    occurredAt: command.occurredAt,
    revision: next.revision,
    detail,
  })
  return next
}

export function confirmAcademicRolloverSources(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand & { sources: RolloverSourceRevision[] },
) {
  const commandSignature = signature("confirm-sources", command.sources)
  const started = beginCommand(
    session,
    command,
    "rollover.preflight",
    commandSignature,
  )
  if (started.replay) return started.next
  const supplied = sourceMap(command.sources)
  const previous = sourceMap(session.confirmedSources)
  for (const required of session.requiredSources) {
    const revision = supplied.get(required.sourceId)
    if (revision === undefined || revision < required.revision) {
      throw new Error("Every rollover source must be confirmed")
    }
    if (revision < (previous.get(required.sourceId) ?? -1)) {
      throw new Error("Rollover source revisions cannot regress")
    }
  }
  started.next.confirmedSources = command.sources.map((source) => ({ ...source }))
  return finishCommand(
    started.next,
    command,
    commandSignature,
    "SOURCES_CONFIRMED",
    `${command.sources.length} rollover sources confirmed`,
  )
}

export function saveAcademicRolloverPlan(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand & {
    fromYearId: string
    fromYearLabel: string
    toYearLabel: string
    startDate: string
    endDate: string
    children: RolloverChildAssignment[]
    teachers: RolloverTeacherAssignment[]
    optionalDomains: AcademicRolloverPlan["optionalDomains"]
    unselectedChildPolicy: AcademicRolloverPlan["unselectedChildPolicy"]
  },
) {
  const payload = {
    fromYearId: command.fromYearId,
    fromYearLabel: command.fromYearLabel,
    toYearLabel: command.toYearLabel,
    startDate: command.startDate,
    endDate: command.endDate,
    children: command.children,
    teachers: command.teachers,
    optionalDomains: command.optionalDomains,
    unselectedChildPolicy: command.unselectedChildPolicy,
  }
  const commandSignature = signature("save-plan", payload)
  const started = beginCommand(
    session,
    command,
    "rollover.plan",
    commandSignature,
  )
  if (started.replay) return started.next
  if (!sourcesComplete(session)) throw new Error("Rollover sources are incomplete")
  if (!/^\d{4}-\d{4}$/.test(command.toYearLabel)) {
    throw new Error("Academic year label must use YYYY-YYYY")
  }
  if (command.endDate <= command.startDate) {
    throw new Error("Academic year end must follow its start")
  }
  if (command.children.length === 0) {
    throw new Error("At least one child assignment is required")
  }
  const revision = Math.max(0, ...session.plans.map((plan) => plan.revision)) + 1
  started.next.plans.push({
    revision,
    ...payload,
    optionalDomains: [...new Set(payload.optionalDomains)],
    authoredBy: command.actorId,
    authoredAt: command.occurredAt,
  })
  started.next.activePlanRevision = revision
  started.next.preflight = undefined
  started.next.impactConfirmation = undefined
  started.next.backup = undefined
  started.next.approvals = []
  started.next.execution = undefined
  started.next.validation = undefined
  started.next.rollback = undefined
  return finishCommand(
    started.next,
    command,
    commandSignature,
    "PLAN_SAVED",
    `Rollover plan revision ${revision} saved without changing production records`,
  )
}

function duplicateValues(values: string[]) {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value)
}

export function runAcademicRolloverPreflight(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand,
) {
  const plan = activePlan(session)
  const commandSignature = signature("run-preflight", {
    planRevision: plan?.revision,
    sources: session.confirmedSources,
  })
  const started = beginCommand(
    session,
    command,
    "rollover.preflight",
    commandSignature,
  )
  if (started.replay) return started.next
  if (!plan) throw new Error("Save a rollover plan first")
  if (!sourcesComplete(session)) throw new Error("Rollover sources are incomplete")

  const blockers: RolloverPreflightBlocker[] = []
  for (const childNumber of duplicateValues(plan.children.map((child) => child.childNumber))) {
    blockers.push({
      id: `duplicate-child-number-${childNumber}`,
      type: "DUPLICATE_CHILD_NUMBER",
      message: `Child number ${childNumber} appears more than once`,
      recordIds: plan.children
        .filter((child) => child.childNumber === childNumber)
        .map((child) => child.childId),
    })
  }
  for (const child of plan.children) {
    if (child.sourceBranchId !== child.targetBranchId && !child.allowBranchTransfer) {
      blockers.push({
        id: `cross-branch-child-${child.childId}`,
        type: "CROSS_BRANCH_CHILD",
        message: `${child.childName} changes branch without an approved transfer`,
        recordIds: [child.childId, child.targetClassId],
      })
    }
  }
  for (const teacher of plan.teachers) {
    if (teacher.sourceBranchId !== teacher.targetBranchId && !teacher.allowBranchTransfer) {
      blockers.push({
        id: `cross-branch-teacher-${teacher.teacherId}`,
        type: "CROSS_BRANCH_TEACHER",
        message: `${teacher.teacherName} changes branch without an approved transfer`,
        recordIds: [teacher.teacherId, teacher.targetClassId],
      })
    }
  }
  const targetCounts = new Map<string, number>()
  for (const child of plan.children) {
    targetCounts.set(child.targetClassId, (targetCounts.get(child.targetClassId) ?? 0) + 1)
  }
  for (const [classId, selectedCount] of targetCounts) {
    const retainedCount = session.currentClassEnrollment[classId] ?? 0
    const capacity = session.classCapacity[classId]
    if (capacity !== undefined && selectedCount + retainedCount > capacity) {
      blockers.push({
        id: `capacity-${classId}`,
        type: "CLASS_CAPACITY",
        message: `${classId} would contain ${selectedCount + retainedCount} children against capacity ${capacity}`,
        recordIds: [classId],
      })
    }
  }
  if (plan.unselectedChildPolicy === "UNDECIDED") {
    blockers.push({
      id: "unselected-child-policy",
      type: "UNSELECTED_POLICY",
      message: "Unselected active children need an explicit carry-forward policy",
      recordIds: [],
    })
  }

  started.next.preflight = {
    planRevision: plan.revision,
    sourceRevisions: session.confirmedSources.map((source) => ({ ...source })),
    blockers,
    impact: {
      childrenSelected: plan.children.length,
      teachersSelected: plan.teachers.length,
      classesAffected: new Set([
        ...plan.children.map((child) => child.targetClassId),
        ...plan.teachers.map((teacher) => teacher.targetClassId),
      ]).size,
      branchesAffected: new Set([
        ...plan.children.map((child) => child.targetBranchId),
        ...plan.teachers.map((teacher) => teacher.targetBranchId),
      ]).size,
      optionalDomains: plan.optionalDomains.length,
      unselectedChildren: Math.max(0, session.totalActiveChildren - plan.children.length),
    },
    checkedBy: command.actorId,
    checkedAt: command.occurredAt,
  }
  return finishCommand(
    started.next,
    command,
    commandSignature,
    "PREFLIGHT_COMPLETED",
    blockers.length
      ? `${blockers.length} blocking rollover conflicts found`
      : "Rollover plan passed deterministic preflight",
  )
}

export function confirmAcademicRolloverImpact(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand,
) {
  const commandSignature = signature("confirm-impact", session.preflight)
  const started = beginCommand(
    session,
    command,
    "rollover.plan",
    commandSignature,
  )
  if (started.replay) return started.next
  const plan = activePlan(session)
  if (!plan || !session.preflight || session.preflight.planRevision !== plan.revision) {
    throw new Error("A current preflight is required")
  }
  if (session.preflight.blockers.length > 0) {
    throw new Error("Resolve every preflight blocker before impact confirmation")
  }
  started.next.impactConfirmation = {
    planRevision: plan.revision,
    preflightRevision: session.revision,
    confirmedBy: command.actorId,
    confirmedAt: command.occurredAt,
  }
  return finishCommand(
    started.next,
    command,
    commandSignature,
    "IMPACT_CONFIRMED",
    `${session.preflight.impact.childrenSelected} children and ${session.preflight.impact.teachersSelected} teachers confirmed for rollover`,
  )
}

export function captureAcademicRolloverBackup(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand & {
    engine: RolloverBackupArtifact["engine"]
    databaseIdentity: string
    storageKey: string
    bytes: number
    sha256: string
    immutable: boolean
    schemaVersion: string
  },
) {
  const payload = {
    engine: command.engine,
    databaseIdentity: command.databaseIdentity,
    storageKey: command.storageKey,
    bytes: command.bytes,
    sha256: command.sha256,
    immutable: command.immutable,
    schemaVersion: command.schemaVersion,
  }
  const commandSignature = signature("capture-backup", payload)
  const started = beginCommand(
    session,
    command,
    "rollover.capture_backup",
    commandSignature,
  )
  if (started.replay) return started.next
  const plan = activePlan(session)
  if (!plan || session.impactConfirmation?.planRevision !== plan.revision) {
    throw new Error("Confirm the current rollover impact first")
  }
  if (!command.storageKey || command.bytes <= 0 || !/^[a-f0-9]{64}$/i.test(command.sha256)) {
    throw new Error("Backup metadata is incomplete")
  }
  if (!command.immutable) throw new Error("Rollover backup storage must be immutable")
  started.next.backup = {
    id: `backup-${command.eventId}`,
    planRevision: plan.revision,
    ...payload,
    capturedAt: command.occurredAt,
    status: "CAPTURED",
  }
  return finishCommand(
    started.next,
    command,
    commandSignature,
    "BACKUP_CAPTURED",
    `${command.engine} backup captured with checksum; restore is still unverified`,
  )
}

export function verifyAcademicRolloverBackup(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand & { restoreProof: RolloverRestoreProof },
) {
  const commandSignature = signature("verify-backup", command.restoreProof)
  const started = beginCommand(
    session,
    command,
    "rollover.verify_backup",
    commandSignature,
  )
  if (started.replay) return started.next
  const backup = session.backup
  if (!backup) throw new Error("Capture a rollover backup first")
  if (!session.approvedBackupEngines.includes(backup.engine)) {
    throw new Error("Backup engine is not approved for rollover recovery")
  }
  const proof = command.restoreProof
  if (
    !proof.isolatedTargetId ||
    !proof.checksumMatch ||
    !proof.schemaVersionMatch ||
    !proof.rowCountMatch ||
    !proof.foreignKeysValid ||
    !proof.sampledInvariantsValid
  ) {
    throw new Error("Backup restore verification failed")
  }
  started.next.backup = {
    ...backup,
    status: "VERIFIED",
    restoreProof: { ...proof },
  }
  return finishCommand(
    started.next,
    command,
    commandSignature,
    "BACKUP_VERIFIED",
    "Checksum and isolated restore proof accepted",
  )
}

export function approveAcademicRollover(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand & { approvalType: RolloverApproval["type"] },
) {
  const commandSignature = signature("approve-rollover", {
    approvalType: command.approvalType,
    planRevision: session.activePlanRevision,
    backupId: session.backup?.id,
  })
  const started = beginCommand(
    session,
    command,
    "rollover.approve",
    commandSignature,
  )
  if (started.replay) return started.next
  const plan = activePlan(session)
  const backup = session.backup
  if (!plan || !backup || backup.status !== "VERIFIED") {
    throw new Error("A verified backup and current plan are required")
  }
  if (session.approvals.some((approval) => approval.type === command.approvalType)) {
    throw new Error("This rollover approval type is already recorded")
  }
  if (session.approvals.some((approval) => approval.approvedBy === command.actorId)) {
    throw new Error("Rollover approvals require distinct people")
  }
  started.next.approvals.push({
    type: command.approvalType,
    planRevision: plan.revision,
    backupId: backup.id,
    approvedBy: command.actorId,
    approvedAt: command.occurredAt,
  })
  return finishCommand(
    started.next,
    command,
    commandSignature,
    "ROLLOVER_APPROVED",
    `${command.approvalType.toLowerCase().replace("_", " ")} approval recorded`,
  )
}

function assertSourcesFresh(session: AcademicRolloverSession) {
  if (!session.preflight) throw new Error("Rollover preflight is missing")
  const current = sourceMap(session.confirmedSources)
  for (const source of session.preflight.sourceRevisions) {
    if (current.get(source.sourceId) !== source.revision) {
      throw new Error("Rollover sources changed after preflight")
    }
  }
}

export function executeAcademicRollover(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand & { lockId: string },
) {
  const commandSignature = signature("execute-rollover", {
    planRevision: session.activePlanRevision,
    backupId: session.backup?.id,
    approvals: session.approvals,
    lockId: command.lockId,
  })
  const started = beginCommand(
    session,
    command,
    "rollover.execute",
    commandSignature,
  )
  if (started.replay) return started.next
  const plan = activePlan(session)
  const backup = session.backup
  if (!plan || !backup || backup.status !== "VERIFIED") {
    throw new Error("Verified recovery evidence is required")
  }
  if (!command.lockId) throw new Error("An organization rollover lock is required")
  if (
    !["OPERATOR", "DATA_CUSTODIAN"].every((type) =>
      session.approvals.some(
        (approval) =>
          approval.type === type &&
          approval.planRevision === plan.revision &&
          approval.backupId === backup.id,
      ),
    )
  ) {
    throw new Error("Both bound rollover approvals are required")
  }
  assertSourcesFresh(session)
  started.next.execution = {
    id: `execution-${command.eventId}`,
    planRevision: plan.revision,
    backupId: backup.id,
    lockId: command.lockId,
    sourceRevisions: session.confirmedSources.map((source) => ({ ...source })),
    status: "ACCEPTED",
    previousActiveYearId: plan.fromYearId,
    createdYearId: `school-year-${plan.toYearLabel}`,
    childrenUpdated: plan.children.length,
    teachersUpdated: plan.teachers.length,
    acceptedBy: command.actorId,
    acceptedAt: command.occurredAt,
  }
  return finishCommand(
    started.next,
    command,
    commandSignature,
    "EXECUTION_ACCEPTED",
    "Atomic rollover transaction accepted under organization lock; validation remains open",
  )
}

export function validateAcademicRollover(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand & {
    checks: RolloverValidationReceipt["checks"]
  },
) {
  const commandSignature = signature("validate-rollover", command.checks)
  const started = beginCommand(
    session,
    command,
    "rollover.validate",
    commandSignature,
  )
  if (started.replay) return started.next
  if (!session.execution) throw new Error("No rollover execution can be validated")
  const passed = Object.values(command.checks).every(Boolean)
  started.next.validation = {
    executionId: session.execution.id,
    status: passed ? "PASSED" : "FAILED",
    checks: { ...command.checks },
    validatedBy: command.actorId,
    validatedAt: command.occurredAt,
  }
  return finishCommand(
    started.next,
    command,
    commandSignature,
    passed ? "ROLLOVER_COMPLETED" : "VALIDATION_FAILED",
    passed
      ? "Post-cutover invariants passed; rollover is complete"
      : "Post-cutover validation failed; recovery is required",
  )
}

export function rollbackAcademicRollover(
  session: AcademicRolloverSession,
  command: AcademicRolloverCommand & {
    checksumMatch: boolean
    previousYearRestored: boolean
    rowCountsMatch: boolean
  },
) {
  const payload = {
    checksumMatch: command.checksumMatch,
    previousYearRestored: command.previousYearRestored,
    rowCountsMatch: command.rowCountsMatch,
  }
  const commandSignature = signature("rollback-rollover", payload)
  const started = beginCommand(
    session,
    command,
    "rollover.rollback",
    commandSignature,
  )
  if (started.replay) return started.next
  if (!session.execution || session.validation?.status !== "FAILED" || !session.backup) {
    throw new Error("Rollback is available only after failed validation")
  }
  if (!Object.values(payload).every(Boolean)) {
    throw new Error("Rollback recovery proof is incomplete")
  }
  started.next.rollback = {
    executionId: session.execution.id,
    backupId: session.backup.id,
    ...payload,
    rolledBackBy: command.actorId,
    rolledBackAt: command.occurredAt,
  }
  return finishCommand(
    started.next,
    command,
    commandSignature,
    "ROLLBACK_CONFIRMED",
    "Verified backup restored the previous active year and row counts",
  )
}

export function deriveAcademicRolloverStatus(
  session: AcademicRolloverSession,
): AcademicRolloverStatus {
  if (!sourcesComplete(session)) return "SOURCE_GAP"
  const plan = activePlan(session)
  if (!plan) return "PLAN_DRAFT"
  if (session.preflight?.planRevision === plan.revision && session.preflight.blockers.length) {
    return "PREFLIGHT_BLOCKED"
  }
  if (!session.preflight || session.preflight.planRevision !== plan.revision || !session.impactConfirmation) {
    return "IMPACT_REVIEW"
  }
  if (!session.backup) return "BACKUP_PENDING"
  if (session.backup.status !== "VERIFIED") return "BACKUP_UNVERIFIED"
  if (session.approvals.length < 2) return "APPROVAL_REQUIRED"
  if (!session.execution) return "READY_TO_EXECUTE"
  if (!session.validation) return "EXECUTION_ACCEPTED"
  if (session.validation.status === "FAILED" && !session.rollback) return "VALIDATION_FAILED"
  if (session.rollback) return "ROLLBACK_CONFIRMED"
  return "COMPLETED"
}

export function projectAcademicRolloverForRole(
  session: AcademicRolloverSession,
  role: AcademicRolloverRole,
): AcademicRolloverProjection {
  const plan = activePlan(session)
  const base: AcademicRolloverProjection = {
    status: deriveAcademicRolloverStatus(session),
    fromYear: plan?.fromYearLabel ?? null,
    toYear: plan?.toYearLabel ?? null,
    planRevision: plan?.revision ?? null,
    blockerCount: session.preflight?.blockers.length ?? 0,
    impact: session.preflight?.impact ? { ...session.preflight.impact } : null,
    backupStatus: session.backup?.status ?? "NOT_CAPTURED",
    approvalCount: session.approvals.length,
    executionStatus: session.execution?.status ?? null,
    validationStatus: session.validation?.status ?? null,
    rollbackStatus: session.rollback ? "CONFIRMED" : null,
  }
  if (role === "administrator") {
    base.childAssignments = plan?.children.map((child) => ({ ...child })) ?? []
    base.teacherAssignments = plan?.teachers.map((teacher) => ({ ...teacher })) ?? []
    base.blockers = session.preflight?.blockers.map((blocker) => ({ ...blocker })) ?? []
    base.backup = session.backup ? structuredClone(session.backup) : undefined
    base.approvals = session.approvals.map((approval) => ({ ...approval }))
    base.execution = session.execution ? structuredClone(session.execution) : undefined
    base.validation = session.validation ? structuredClone(session.validation) : undefined
    base.rollback = session.rollback ? structuredClone(session.rollback) : undefined
    base.events = session.events.map((event) => ({ ...event }))
  } else if (role === "coordinator") {
    base.childAssignments = plan?.children.map((child) => ({ ...child })) ?? []
    base.teacherAssignments = plan?.teachers.map((teacher) => ({ ...teacher })) ?? []
    base.blockers = session.preflight?.blockers.map((blocker) => ({ ...blocker })) ?? []
  } else {
    base.backup = session.backup ? structuredClone(session.backup) : undefined
    base.approvals = session.approvals.map((approval) => ({ ...approval }))
    base.execution = session.execution ? structuredClone(session.execution) : undefined
    base.validation = session.validation ? structuredClone(session.validation) : undefined
    base.rollback = session.rollback ? structuredClone(session.rollback) : undefined
    base.events = session.events.map((event) => ({ ...event }))
  }
  return base
}

export function createEmptyAcademicRolloverSession(): AcademicRolloverSession {
  return {
    id: "rollover-riverside-2027-2028",
    organizationId: "organization-riverside",
    revision: 0,
    requiredSources: [
      { sourceId: "active-school-year", revision: 9 },
      { sourceId: "active-child-roster", revision: 42 },
      { sourceId: "active-staff-roster", revision: 18 },
      { sourceId: "class-capacity", revision: 7 },
      { sourceId: "legacy-year-adapter", revision: 5 },
      { sourceId: "database-schema", revision: 31 },
      { sourceId: "rollover-policy", revision: 3 },
    ],
    confirmedSources: [],
    approvedBackupEngines: ["pg_dump"],
    classCapacity: {
      "class-meadow": 24,
      "class-seedlings": 16,
      "class-sunroom": 18,
    },
    currentClassEnrollment: {
      "class-meadow": 1,
      "class-seedlings": 0,
      "class-sunroom": 0,
    },
    totalActiveChildren: 4,
    plans: [],
    approvals: [],
    events: [],
    idempotencyReceipts: [],
  }
}

function fixtureCommand(
  session: AcademicRolloverSession,
  key: string,
  actorId = "admin-ava",
): AcademicRolloverCommand {
  const role: AcademicRolloverRole = actorId.startsWith("auditor-")
    ? "auditor"
    : actorId.startsWith("coordinator-")
      ? "coordinator"
      : "administrator"
  return {
    eventId: `fixture-${key}`,
    idempotencyKey: `fixture-rollover-${key}`,
    actorId,
    occurredAt: `2027-07-${String(10 + session.revision).padStart(2, "0")}T09:00:00.000Z`,
    expectedRevision: session.revision,
    actorCapabilities: capabilitiesForAcademicRolloverRole(role),
  }
}

function validChildren(): RolloverChildAssignment[] {
  return [
    {
      childId: "child-amelie",
      childName: "Amelie Haddad",
      sourceBranchId: "branch-riverside",
      targetBranchId: "branch-riverside",
      targetClassId: "class-meadow",
      childNumber: "RV272801",
      allowBranchTransfer: false,
    },
    {
      childId: "child-noah",
      childName: "Noah Mansour",
      sourceBranchId: "branch-riverside",
      targetBranchId: "branch-riverside",
      targetClassId: "class-seedlings",
      childNumber: "RV272802",
      allowBranchTransfer: false,
    },
    {
      childId: "child-lina",
      childName: "Lina Farah",
      sourceBranchId: "branch-riverside",
      targetBranchId: "branch-riverside",
      targetClassId: "class-sunroom",
      childNumber: "RV272803",
      allowBranchTransfer: false,
    },
  ]
}

function validTeachers(): RolloverTeacherAssignment[] {
  return [
    {
      teacherId: "teacher-sophie",
      teacherName: "Sophie Martin",
      sourceBranchId: "branch-riverside",
      targetBranchId: "branch-riverside",
      targetClassId: "class-meadow",
      allowBranchTransfer: false,
    },
    {
      teacherId: "teacher-nina",
      teacherName: "Nina Saleh",
      sourceBranchId: "branch-riverside",
      targetBranchId: "branch-riverside",
      targetClassId: "class-seedlings",
      allowBranchTransfer: false,
    },
  ]
}

function confirmFixtureSources(session: AcademicRolloverSession) {
  return confirmAcademicRolloverSources(session, {
    ...fixtureCommand(session, "sources"),
    sources: session.requiredSources.map((source) => ({ ...source })),
  })
}

function saveFixturePlan(session: AcademicRolloverSession, blocked = false) {
  const children = validChildren()
  if (blocked) {
    children[1] = {
      ...children[1],
      targetBranchId: "branch-harbour",
      targetClassId: "class-harbour",
      childNumber: children[0].childNumber,
    }
  }
  return saveAcademicRolloverPlan(session, {
    ...fixtureCommand(session, blocked ? "blocked-plan" : "plan"),
    fromYearId: "school-year-2026-2027",
    fromYearLabel: "2026-2027",
    toYearLabel: "2027-2028",
    startDate: "2027-09-01",
    endDate: "2028-06-30",
    children,
    teachers: validTeachers(),
    optionalDomains: ["HOLIDAYS", "VACCINATIONS"],
    unselectedChildPolicy: blocked ? "UNDECIDED" : "RETAIN_OLD_YEAR",
  })
}

function preflightFixture(session: AcademicRolloverSession) {
  return runAcademicRolloverPreflight(session, fixtureCommand(session, "preflight"))
}

function impactFixture(session: AcademicRolloverSession) {
  return confirmAcademicRolloverImpact(session, fixtureCommand(session, "impact"))
}

function backupFixture(session: AcademicRolloverSession) {
  return captureAcademicRolloverBackup(session, {
    ...fixtureCommand(session, "backup"),
    engine: "pg_dump",
    databaseIdentity: "garderie-production",
    storageKey: "legacy-archives/newyear/2027-2028/backup.sql",
    bytes: 18_240_000,
    sha256: "a".repeat(64),
    immutable: true,
    schemaVersion: "2026071101",
  })
}

function verifyBackupFixture(session: AcademicRolloverSession) {
  return verifyAcademicRolloverBackup(session, {
    ...fixtureCommand(session, "verify-backup", "auditor-ines"),
    restoreProof: {
      isolatedTargetId: "restore-drill-2027-07-18",
      checksumMatch: true,
      schemaVersionMatch: true,
      rowCountMatch: true,
      foreignKeysValid: true,
      sampledInvariantsValid: true,
      restoredAt: "2027-07-18T10:00:00.000Z",
    },
  })
}

function approveFixture(session: AcademicRolloverSession) {
  let next = approveAcademicRollover(session, {
    ...fixtureCommand(session, "operator-approval", "admin-ava"),
    approvalType: "OPERATOR",
  })
  next = approveAcademicRollover(next, {
    ...fixtureCommand(next, "custodian-approval", "auditor-ines"),
    approvalType: "DATA_CUSTODIAN",
  })
  return next
}

function executeFixture(session: AcademicRolloverSession) {
  return executeAcademicRollover(session, {
    ...fixtureCommand(session, "execute"),
    lockId: "organization-riverside-rollover-lock",
  })
}

const passingValidationChecks: RolloverValidationReceipt["checks"] = {
  exactlyOneActiveYear: true,
  selectedChildrenAssigned: true,
  selectedTeachersAssigned: true,
  childHistoryComplete: true,
  legacyYearAdapterUpdated: true,
  unrelatedRowsUnchanged: true,
}

export function createAcademicRolloverFixture(
  stage: AcademicRolloverFixtureStage,
): AcademicRolloverSession {
  let session = createEmptyAcademicRolloverSession()
  if (stage === "source-gap") return session
  session = confirmFixtureSources(session)
  if (stage === "plan-draft") return session
  session = saveFixturePlan(session, stage === "preflight-blocked")
  session = preflightFixture(session)
  if (stage === "preflight-blocked" || stage === "impact-review") return session
  session = impactFixture(session)
  if (stage === "backup-pending") return session
  session = backupFixture(session)
  if (stage === "backup-unverified") return session
  session = verifyBackupFixture(session)
  if (stage === "approval-required") return session
  session = approveFixture(session)
  if (stage === "ready-to-execute") return session
  session = executeFixture(session)
  if (stage === "execution-accepted") return session
  session = validateAcademicRollover(session, {
    ...fixtureCommand(session, stage === "completed" ? "validation-pass" : "validation-fail", "auditor-ines"),
    checks:
      stage === "completed"
        ? passingValidationChecks
        : { ...passingValidationChecks, legacyYearAdapterUpdated: false },
  })
  if (stage === "validation-failed" || stage === "completed") return session
  return rollbackAcademicRollover(session, {
    ...fixtureCommand(session, "rollback"),
    checksumMatch: true,
    previousYearRestored: true,
    rowCountsMatch: true,
  })
}
