export type InspectionCapability =
  | "inspection.preflight"
  | "inspection.view_sensitive"
  | "inspection.contribute"
  | "inspection.accept_exception"
  | "inspection.generate"
  | "inspection.download"
  | "inspection.audit"

export type InspectionPackageStatus =
  | "PROFILE_REQUIRED"
  | "BLOCKED"
  | "EXCEPTION_REVIEW"
  | "REDACTION_REVIEW"
  | "READY"
  | "GENERATING"
  | "GENERATION_FAILED"
  | "READY_TO_DOWNLOAD"
  | "LINK_EXPIRED"
  | "HISTORICAL"

export type InspectionFixtureStage =
  | "profile-required"
  | "blocked"
  | "exception-review"
  | "redaction-review"
  | "ready"
  | "generating"
  | "generation-failed"
  | "retrying"
  | "ready-download"
  | "link-expired"
  | "historical"

export type EvidenceDomain =
  | "BRANCH"
  | "CHILD"
  | "STAFF"
  | "POLICY"
  | "MEDICAL"
  | "ATTENDANCE"
  | "FINANCE"
  | "FACILITY"

export type EvidenceState = "AVAILABLE" | "MISSING" | "EXPIRED" | "INCONSISTENT"
export type EvidenceConsequence = "BLOCKS_GENERATION" | "EXCEPTION_ALLOWED" | "WARNING"
export type EvidenceSensitivity = "STANDARD" | "RESTRICTED"

export interface InspectionRequirement {
  id: string
  domain: EvidenceDomain
  label: string
  consequence: EvidenceConsequence
  sensitivity: EvidenceSensitivity
}

export interface InspectionProfile {
  id: string
  version: number
  label: string
  policySource: string
  effectiveAt: string
  requirements: InspectionRequirement[]
}

export interface InspectionEvidence {
  id: string
  requirementId: string
  domain: EvidenceDomain
  title: string
  sourceRef: string
  sourceRevision: number
  state: EvidenceState
  owner: string
  sensitivity: EvidenceSensitivity
  updatedAt: string
}

export interface InspectionManifestEntry {
  requirementId: string
  evidenceId?: string
  sourceRevision?: number
  state: EvidenceState
  consequence: EvidenceConsequence
  sensitivity: EvidenceSensitivity
}

export interface InspectionException {
  requirementId: string
  evidenceId: string
  sourceRevision: number
  authority: string
  reason: string
  acceptedById: string
  acceptedAt: string
}

export interface InspectionRedaction {
  evidenceId: string
  sourceRevision: number
  recipient: string
  fields: string[]
  reason: string
  approvedById: string
  approvedAt: string
}

export interface InspectionGenerationJob {
  id: string
  manifestRevision: number
  status: "RUNNING" | "FAILED" | "COMPLETE"
  progress: number
  attempt: number
  startedAt: string
  failureCode?: string
  completedAt?: string
}

export interface InspectionArtifact {
  id: string
  kind: "INSPECTION_PACKAGE" | "DATABASE_BACKUP"
  manifestRevision: number
  manifestChecksum: string
  artifactChecksum: string
  generatedAt: string
  generatedById: string
  sourceRevisionSnapshot: Record<string, number>
}

export interface InspectionDownloadGrant {
  id: string
  artifactId: string
  recipient: string
  issuedAt: string
  expiresAt: string
}

export interface InspectionEvent {
  eventId: string
  idempotencyKey: string
  fingerprint: string
  kind:
    | "PROFILE_SELECTED"
    | "EVIDENCE_REPLACED"
    | "EXCEPTION_ACCEPTED"
    | "REDACTION_APPROVED"
    | "GENERATION_STARTED"
    | "GENERATION_FAILED"
    | "GENERATION_RETRIED"
    | "GENERATION_COMPLETED"
    | "ACCESS_REGENERATED"
    | "PACKAGE_DOWNLOADED"
    | "SOURCE_CHANGED"
  actorId: string
  occurredAt: string
  detail: string
  resultingRevision: number
}

export interface InspectionPackage {
  id: string
  branch: { id: string; label: string }
  dateRange: { from: string; to: string }
  recipient: string
  purpose: string
  revision: number
  profile?: InspectionProfile
  evidence: InspectionEvidence[]
  manifest: InspectionManifestEntry[]
  exceptions: InspectionException[]
  redactions: InspectionRedaction[]
  job?: InspectionGenerationJob
  artifact?: InspectionArtifact
  grants: InspectionDownloadGrant[]
  sourceChangedAfterGeneration: boolean
  events: InspectionEvent[]
}

export interface InspectionCommand {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedRevision: number
  actorCapabilities: readonly InspectionCapability[]
}

const managerCapabilities: InspectionCapability[] = [
  "inspection.preflight",
  "inspection.view_sensitive",
  "inspection.contribute",
  "inspection.accept_exception",
  "inspection.generate",
  "inspection.download",
  "inspection.audit",
]

function fingerprint(command: object) {
  return JSON.stringify(command)
}

function beginCommand(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand,
  capability: InspectionCapability,
) {
  const commandFingerprint = fingerprint(command)
  const existing = inspectionPackage.events.find((event) => event.idempotencyKey === command.idempotencyKey)
  if (existing) {
    if (existing.fingerprint !== commandFingerprint) throw new Error("Idempotency key reused with different input")
    return { repeated: true, fingerprint: commandFingerprint }
  }
  if (!command.actorCapabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`)
  if (inspectionPackage.revision !== command.expectedRevision) {
    throw new Error(
      `Inspection package revision conflict: expected ${command.expectedRevision}, found ${inspectionPackage.revision}`,
    )
  }
  return { repeated: false, fingerprint: commandFingerprint }
}

function appendEvent(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand,
  event: Pick<InspectionEvent, "kind" | "detail">,
  commandFingerprint: string,
  patch: Partial<InspectionPackage>,
) {
  const resultingRevision = inspectionPackage.revision + 1
  return {
    ...inspectionPackage,
    ...patch,
    revision: resultingRevision,
    events: [
      ...inspectionPackage.events,
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

function requirementFor(inspectionPackage: InspectionPackage, requirementId: string) {
  const requirement = inspectionPackage.profile?.requirements.find((item) => item.id === requirementId)
  if (!requirement) throw new Error("Requirement is not part of the selected profile")
  return requirement
}

function refreshManifest(inspectionPackage: InspectionPackage, evidence: InspectionEvidence[]) {
  if (!inspectionPackage.profile) return []
  return inspectionPackage.profile.requirements.map((requirement) => {
    const source = evidence.find((item) => item.requirementId === requirement.id)
    return {
      requirementId: requirement.id,
      evidenceId: source?.id,
      sourceRevision: source?.sourceRevision,
      state: source?.state ?? ("MISSING" as const),
      consequence: requirement.consequence,
      sensitivity: requirement.sensitivity,
    }
  })
}

function hasCurrentException(inspectionPackage: InspectionPackage, entry: InspectionManifestEntry) {
  return inspectionPackage.exceptions.some(
    (exception) =>
      exception.requirementId === entry.requirementId &&
      exception.evidenceId === entry.evidenceId &&
      exception.sourceRevision === entry.sourceRevision,
  )
}

function hasCurrentRedaction(inspectionPackage: InspectionPackage, entry: InspectionManifestEntry) {
  return inspectionPackage.redactions.some(
    (redaction) =>
      redaction.evidenceId === entry.evidenceId &&
      redaction.sourceRevision === entry.sourceRevision &&
      redaction.recipient === inspectionPackage.recipient,
  )
}

export function inspectionPackageStatus(
  inspectionPackage: InspectionPackage,
  now = "2026-07-15T10:00:00+01:00",
): InspectionPackageStatus {
  if (!inspectionPackage.profile) return "PROFILE_REQUIRED"
  if (inspectionPackage.artifact) {
    if (inspectionPackage.sourceChangedAfterGeneration) return "HISTORICAL"
    const grant = inspectionPackage.grants.find((item) => item.artifactId === inspectionPackage.artifact?.id)
    if (!grant || new Date(grant.expiresAt).getTime() <= new Date(now).getTime()) return "LINK_EXPIRED"
    return "READY_TO_DOWNLOAD"
  }
  if (inspectionPackage.job?.status === "RUNNING") return "GENERATING"
  if (inspectionPackage.job?.status === "FAILED") return "GENERATION_FAILED"

  const blockers = inspectionPackage.manifest.filter(
    (entry) =>
      entry.consequence === "BLOCKS_GENERATION" &&
      (entry.state === "MISSING" || entry.state === "EXPIRED" || entry.state === "INCONSISTENT"),
  )
  if (blockers.length) return "BLOCKED"

  const exceptions = inspectionPackage.manifest.filter(
    (entry) => entry.state === "INCONSISTENT" && entry.consequence === "EXCEPTION_ALLOWED" && !hasCurrentException(inspectionPackage, entry),
  )
  if (exceptions.length) return "EXCEPTION_REVIEW"

  const redactions = inspectionPackage.manifest.filter(
    (entry) => entry.sensitivity === "RESTRICTED" && entry.state === "AVAILABLE" && !hasCurrentRedaction(inspectionPackage, entry),
  )
  if (redactions.length) return "REDACTION_REVIEW"
  return "READY"
}

export function selectInspectionProfile(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & { profile: InspectionProfile },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.preflight")
  if (started.repeated) return inspectionPackage
  if (!command.profile.requirements.length) throw new Error("Inspection profile must declare evidence requirements")
  const next = { ...inspectionPackage, profile: command.profile }
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "PROFILE_SELECTED", detail: `${command.profile.label} v${command.profile.version}` },
    started.fingerprint,
    { profile: command.profile, manifest: refreshManifest(next, inspectionPackage.evidence) },
  )
}

export function replaceInspectionEvidence(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & { evidenceId: string; expectedSourceRevision: number },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.contribute")
  if (started.repeated) return inspectionPackage
  const current = inspectionPackage.evidence.find((item) => item.id === command.evidenceId)
  if (!current) throw new Error("Evidence source not found")
  if (current.sourceRevision !== command.expectedSourceRevision) throw new Error("Evidence source revision changed")
  const evidence = inspectionPackage.evidence.map((item) =>
    item.id === current.id
      ? { ...item, state: "AVAILABLE" as const, sourceRevision: item.sourceRevision + 1, updatedAt: command.occurredAt }
      : item,
  )
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "EVIDENCE_REPLACED", detail: `${current.domain} evidence replaced without rewriting history` },
    started.fingerprint,
    { evidence, manifest: refreshManifest(inspectionPackage, evidence) },
  )
}

export function acceptInspectionException(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & {
    requirementId: string
    evidenceId: string
    expectedSourceRevision: number
    authority: string
    reason: string
  },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.accept_exception")
  if (started.repeated) return inspectionPackage
  const requirement = requirementFor(inspectionPackage, command.requirementId)
  const evidence = inspectionPackage.evidence.find((item) => item.id === command.evidenceId)
  if (requirement.consequence !== "EXCEPTION_ALLOWED" || evidence?.state !== "INCONSISTENT") {
    throw new Error("This evidence does not permit an exception")
  }
  if (evidence.sourceRevision !== command.expectedSourceRevision) throw new Error("Evidence source revision changed")
  if (!command.authority.trim() || !command.reason.trim()) throw new Error("Exception authority and reason are required")
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "EXCEPTION_ACCEPTED", detail: `${requirement.label}: ${command.authority}` },
    started.fingerprint,
    {
      exceptions: [
        ...inspectionPackage.exceptions,
        {
          requirementId: requirement.id,
          evidenceId: evidence.id,
          sourceRevision: evidence.sourceRevision,
          authority: command.authority,
          reason: command.reason,
          acceptedById: command.actorId,
          acceptedAt: command.occurredAt,
        },
      ],
    },
  )
}

export function approveInspectionRedaction(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & {
    evidenceId: string
    expectedSourceRevision: number
    fields: string[]
    reason: string
  },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.view_sensitive")
  if (started.repeated) return inspectionPackage
  const evidence = inspectionPackage.evidence.find((item) => item.id === command.evidenceId)
  if (!evidence || evidence.sensitivity !== "RESTRICTED") throw new Error("Restricted evidence source not found")
  if (evidence.sourceRevision !== command.expectedSourceRevision) throw new Error("Evidence source revision changed")
  if (!command.fields.length || !command.reason.trim()) throw new Error("Redaction fields and reason are required")
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "REDACTION_APPROVED", detail: `${command.fields.length} fields redacted for ${inspectionPackage.recipient}` },
    started.fingerprint,
    {
      redactions: [
        ...inspectionPackage.redactions,
        {
          evidenceId: evidence.id,
          sourceRevision: evidence.sourceRevision,
          recipient: inspectionPackage.recipient,
          fields: command.fields,
          reason: command.reason,
          approvedById: command.actorId,
          approvedAt: command.occurredAt,
        },
      ],
    },
  )
}

export function startInspectionGeneration(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & { jobId: string; expectedManifestRevision: number },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.generate")
  if (started.repeated) return inspectionPackage
  if (inspectionPackageStatus(inspectionPackage) !== "READY") throw new Error("Inspection preflight is not ready")
  if (inspectionPackage.revision !== command.expectedManifestRevision) throw new Error("Manifest revision changed")
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "GENERATION_STARTED", detail: `Server job ${command.jobId} started from revision ${inspectionPackage.revision}` },
    started.fingerprint,
    {
      job: {
        id: command.jobId,
        manifestRevision: inspectionPackage.revision,
        status: "RUNNING",
        progress: 8,
        attempt: 1,
        startedAt: command.occurredAt,
      },
    },
  )
}

export function failInspectionGeneration(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & { jobId: string; failureCode: string },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.generate")
  if (started.repeated) return inspectionPackage
  if (inspectionPackage.job?.id !== command.jobId || inspectionPackage.job.status !== "RUNNING") {
    throw new Error("Running generation job not found")
  }
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "GENERATION_FAILED", detail: command.failureCode },
    started.fingerprint,
    { job: { ...inspectionPackage.job, status: "FAILED", failureCode: command.failureCode } },
  )
}

export function retryInspectionGeneration(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & { jobId: string; expectedManifestRevision: number },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.generate")
  if (started.repeated) return inspectionPackage
  if (inspectionPackage.job?.status !== "FAILED") throw new Error("Failed generation job not found")
  if (inspectionPackage.job.manifestRevision !== command.expectedManifestRevision) {
    throw new Error("Retry must use the failed job manifest revision")
  }
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "GENERATION_RETRIED", detail: `Retry ${inspectionPackage.job.attempt + 1} keeps manifest revision ${command.expectedManifestRevision}` },
    started.fingerprint,
    {
      job: {
        ...inspectionPackage.job,
        id: command.jobId,
        status: "RUNNING",
        progress: 8,
        attempt: inspectionPackage.job.attempt + 1,
        startedAt: command.occurredAt,
        failureCode: undefined,
      },
    },
  )
}

function validChecksum(value: string) {
  return /^sha256:[a-f0-9]{64}$/.test(value)
}

export function completeInspectionGeneration(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & {
    jobId: string
    artifactId: string
    manifestChecksum: string
    artifactChecksum: string
    grantId: string
    expiresAt: string
  },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.generate")
  if (started.repeated) return inspectionPackage
  const job = inspectionPackage.job
  if (!job || job.id !== command.jobId || job.status !== "RUNNING") throw new Error("Running generation job not found")
  if (!validChecksum(command.manifestChecksum) || !validChecksum(command.artifactChecksum)) {
    throw new Error("SHA-256 manifest and artifact checksums are required")
  }
  if (new Date(command.expiresAt).getTime() <= new Date(command.occurredAt).getTime()) {
    throw new Error("Download access must expire after generation")
  }
  const sourceRevisionSnapshot = Object.fromEntries(
    inspectionPackage.manifest
      .filter((entry) => entry.evidenceId && entry.sourceRevision !== undefined)
      .map((entry) => [entry.evidenceId!, entry.sourceRevision!]),
  )
  const artifact: InspectionArtifact = {
    id: command.artifactId,
    kind: "INSPECTION_PACKAGE",
    manifestRevision: job.manifestRevision,
    manifestChecksum: command.manifestChecksum,
    artifactChecksum: command.artifactChecksum,
    generatedAt: command.occurredAt,
    generatedById: command.actorId,
    sourceRevisionSnapshot,
  }
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "GENERATION_COMPLETED", detail: `${command.artifactId} completed with checksummed provenance` },
    started.fingerprint,
    {
      job: { ...job, status: "COMPLETE", progress: 100, completedAt: command.occurredAt },
      artifact,
      grants: [
        ...inspectionPackage.grants,
        {
          id: command.grantId,
          artifactId: artifact.id,
          recipient: inspectionPackage.recipient,
          issuedAt: command.occurredAt,
          expiresAt: command.expiresAt,
        },
      ],
    },
  )
}

export function regenerateInspectionAccess(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & { grantId: string; expiresAt: string },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.download")
  if (started.repeated) return inspectionPackage
  if (!inspectionPackage.artifact) throw new Error("Generated inspection package not found")
  if (new Date(command.expiresAt).getTime() <= new Date(command.occurredAt).getTime()) {
    throw new Error("Regenerated access must have a future expiry")
  }
  const grants = inspectionPackage.grants.filter((item) => item.artifactId !== inspectionPackage.artifact?.id)
  grants.push({
    id: command.grantId,
    artifactId: inspectionPackage.artifact.id,
    recipient: inspectionPackage.recipient,
    issuedAt: command.occurredAt,
    expiresAt: command.expiresAt,
  })
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "ACCESS_REGENERATED", detail: `Access regenerated for ${inspectionPackage.recipient}` },
    started.fingerprint,
    { grants },
  )
}

export function recordInspectionDownload(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & { artifactId: string; grantId: string },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.download")
  if (started.repeated) return inspectionPackage
  const grant = inspectionPackage.grants.find((item) => item.id === command.grantId)
  if (!inspectionPackage.artifact || inspectionPackage.artifact.id !== command.artifactId || !grant) {
    throw new Error("Download grant not found")
  }
  if (new Date(grant.expiresAt).getTime() <= new Date(command.occurredAt).getTime()) {
    throw new Error("Download grant expired")
  }
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "PACKAGE_DOWNLOADED", detail: `${command.artifactId} downloaded by ${command.actorId}` },
    started.fingerprint,
    {},
  )
}

export function markInspectionSourceChanged(
  inspectionPackage: InspectionPackage,
  command: InspectionCommand & { evidenceId: string; nextSourceRevision: number },
) {
  const started = beginCommand(inspectionPackage, command, "inspection.audit")
  if (started.repeated) return inspectionPackage
  const generatedRevision = inspectionPackage.artifact?.sourceRevisionSnapshot[command.evidenceId]
  if (generatedRevision === undefined || command.nextSourceRevision <= generatedRevision) {
    throw new Error("Source change must advance a generated evidence revision")
  }
  return appendEvent(
    inspectionPackage,
    command,
    { kind: "SOURCE_CHANGED", detail: `${command.evidenceId} advanced to revision ${command.nextSourceRevision}` },
    started.fingerprint,
    { sourceChangedAfterGeneration: true },
  )
}

export function projectInspectionPackage(
  inspectionPackage: InspectionPackage,
  actorCapabilities: readonly InspectionCapability[],
  now?: string,
) {
  if (!actorCapabilities.includes("inspection.preflight")) throw new Error("Missing capability: inspection.preflight")
  const canViewSensitive = actorCapabilities.includes("inspection.view_sensitive")
  const evidence = inspectionPackage.evidence.map((item) =>
    item.sensitivity === "RESTRICTED" && !canViewSensitive
      ? {
          ...item,
          title: "Restricted evidence",
          sourceRef: undefined,
          owner: "Restricted owner",
        }
      : item,
  )
  return {
    status: inspectionPackageStatus(inspectionPackage, now),
    evidence,
    canGenerate: actorCapabilities.includes("inspection.generate"),
    canAcceptException: actorCapabilities.includes("inspection.accept_exception"),
    canDownload: actorCapabilities.includes("inspection.download"),
    canAudit: actorCapabilities.includes("inspection.audit"),
  }
}

export function isInspectionPackageArtifact(artifact: InspectionArtifact) {
  return artifact.kind === "INSPECTION_PACKAGE"
}

export function createDatabaseBackupFixture(): InspectionArtifact {
  return {
    id: "backup-2026-07-15",
    kind: "DATABASE_BACKUP",
    manifestRevision: 0,
    manifestChecksum: `sha256:${"0".repeat(64)}`,
    artifactChecksum: `sha256:${"1".repeat(64)}`,
    generatedAt: "2026-07-15T08:00:00+01:00",
    generatedById: "admin-maya",
    sourceRevisionSnapshot: {},
  }
}

export function createInspectionPackageFixture(): InspectionPackage {
  return {
    id: "inspection-riverside-2026-q3",
    branch: { id: "branch-riverside", label: "Riverside" },
    dateRange: { from: "2026-04-01", to: "2026-06-30" },
    recipient: "External inspector",
    purpose: "Scheduled operational inspection",
    revision: 0,
    evidence: [
      {
        id: "evidence-branch-registration",
        requirementId: "branch-registration",
        domain: "BRANCH",
        title: "Branch registration record",
        sourceRef: "/branches/riverside/compliance",
        sourceRevision: 5,
        state: "AVAILABLE",
        owner: "Maya Haddad",
        sensitivity: "STANDARD",
        updatedAt: "2026-07-10T09:00:00+01:00",
      },
      {
        id: "evidence-staff-training",
        requirementId: "staff-training",
        domain: "STAFF",
        title: "Staff training register",
        sourceRef: "/employees/training",
        sourceRevision: 3,
        state: "EXPIRED",
        owner: "Nadia Saleh",
        sensitivity: "STANDARD",
        updatedAt: "2026-06-01T11:00:00+01:00",
      },
      {
        id: "evidence-attendance",
        requirementId: "attendance-register",
        domain: "ATTENDANCE",
        title: "Attendance register",
        sourceRef: "/reports/monthly-branch",
        sourceRevision: 12,
        state: "AVAILABLE",
        owner: "Maya Haddad",
        sensitivity: "STANDARD",
        updatedAt: "2026-07-14T18:05:00+01:00",
      },
      {
        id: "evidence-medical",
        requirementId: "medical-summary",
        domain: "MEDICAL",
        title: "Named medical incident summary",
        sourceRef: "/medical/reports",
        sourceRevision: 9,
        state: "AVAILABLE",
        owner: "Clinical lead",
        sensitivity: "RESTRICTED",
        updatedAt: "2026-07-14T16:30:00+01:00",
      },
      {
        id: "evidence-finance",
        requirementId: "finance-summary",
        domain: "FINANCE",
        title: "Fee reconciliation summary",
        sourceRef: "/accounting",
        sourceRevision: 7,
        state: "INCONSISTENT",
        owner: "Finance coordinator",
        sensitivity: "STANDARD",
        updatedAt: "2026-07-14T14:20:00+01:00",
      },
      {
        id: "evidence-facility",
        requirementId: "facility-safety",
        domain: "FACILITY",
        title: "Facility safety review",
        sourceRef: "/branches/riverside/documents",
        sourceRevision: 4,
        state: "AVAILABLE",
        owner: "Operations lead",
        sensitivity: "STANDARD",
        updatedAt: "2026-07-12T10:45:00+01:00",
      },
    ],
    manifest: [],
    exceptions: [],
    redactions: [],
    grants: [],
    sourceChangedAfterGeneration: false,
    events: [],
  }
}

export function createInspectionProfileFixture(): InspectionProfile {
  return {
    id: "profile-operator-pilot",
    version: 3,
    label: "Operator-configured pilot profile",
    policySource: "Approved organization policy registry",
    effectiveAt: "2026-04-01T00:00:00+01:00",
    requirements: [
      { id: "branch-registration", domain: "BRANCH", label: "Branch registration", consequence: "BLOCKS_GENERATION", sensitivity: "STANDARD" },
      { id: "staff-training", domain: "STAFF", label: "Current staff training", consequence: "BLOCKS_GENERATION", sensitivity: "STANDARD" },
      { id: "attendance-register", domain: "ATTENDANCE", label: "Attendance register", consequence: "BLOCKS_GENERATION", sensitivity: "STANDARD" },
      { id: "medical-summary", domain: "MEDICAL", label: "Medical incident summary", consequence: "BLOCKS_GENERATION", sensitivity: "RESTRICTED" },
      { id: "finance-summary", domain: "FINANCE", label: "Fee reconciliation", consequence: "EXCEPTION_ALLOWED", sensitivity: "STANDARD" },
      { id: "facility-safety", domain: "FACILITY", label: "Facility safety review", consequence: "BLOCKS_GENERATION", sensitivity: "STANDARD" },
    ],
  }
}

function fixtureCommand(inspectionPackage: InspectionPackage, id: string, occurredAt: string): InspectionCommand {
  return {
    eventId: `${id}-${inspectionPackage.revision}`,
    idempotencyKey: `${id}-${inspectionPackage.revision}-once`,
    actorId: "manager-maya",
    occurredAt,
    expectedRevision: inspectionPackage.revision,
    actorCapabilities: managerCapabilities,
  }
}

function startFixtureJob(inspectionPackage: InspectionPackage) {
  return startInspectionGeneration(inspectionPackage, {
    ...fixtureCommand(inspectionPackage, "start-generation", "2026-07-15T08:50:00+01:00"),
    jobId: "job-inspection-riverside",
    expectedManifestRevision: inspectionPackage.revision,
  })
}

function completeFixtureJob(inspectionPackage: InspectionPackage, expiresAt = "2026-07-16T09:00:00+01:00") {
  return completeInspectionGeneration(inspectionPackage, {
    ...fixtureCommand(inspectionPackage, "complete-generation", "2026-07-15T09:00:00+01:00"),
    jobId: inspectionPackage.job!.id,
    artifactId: "artifact-inspection-riverside-v1",
    manifestChecksum: `sha256:${"a".repeat(64)}`,
    artifactChecksum: `sha256:${"b".repeat(64)}`,
    grantId: "grant-inspector-v1",
    expiresAt,
  })
}

export function createInspectionScenario(stage: InspectionFixtureStage): InspectionPackage {
  if (stage === "profile-required") return createInspectionPackageFixture()
  let inspectionPackage = createInspectionPackageFixture()
  inspectionPackage = selectInspectionProfile(inspectionPackage, {
    ...fixtureCommand(inspectionPackage, "select-profile", "2026-07-15T08:30:00+01:00"),
    profile: createInspectionProfileFixture(),
  })
  if (stage === "blocked") return inspectionPackage
  inspectionPackage = replaceInspectionEvidence(inspectionPackage, {
    ...fixtureCommand(inspectionPackage, "replace-training", "2026-07-15T08:35:00+01:00"),
    evidenceId: "evidence-staff-training",
    expectedSourceRevision: 3,
  })
  if (stage === "exception-review") return inspectionPackage
  inspectionPackage = acceptInspectionException(inspectionPackage, {
    ...fixtureCommand(inspectionPackage, "accept-finance", "2026-07-15T08:40:00+01:00"),
    requirementId: "finance-summary",
    evidenceId: "evidence-finance",
    expectedSourceRevision: 7,
    authority: "Operations director under approved exception policy",
    reason: "The disputed imported opening balance is disclosed and excluded from the period total",
  })
  if (stage === "redaction-review") return inspectionPackage
  inspectionPackage = approveInspectionRedaction(inspectionPackage, {
    ...fixtureCommand(inspectionPackage, "redact-medical", "2026-07-15T08:45:00+01:00"),
    evidenceId: "evidence-medical",
    expectedSourceRevision: 9,
    fields: ["childName", "parentContact"],
    reason: "Recipient needs incident evidence without direct family identifiers",
  })
  if (stage === "ready") return inspectionPackage
  inspectionPackage = startFixtureJob(inspectionPackage)
  if (stage === "generating") return inspectionPackage
  if (stage === "generation-failed" || stage === "retrying") {
    inspectionPackage = failInspectionGeneration(inspectionPackage, {
      ...fixtureCommand(inspectionPackage, "fail-generation", "2026-07-15T08:55:00+01:00"),
      jobId: inspectionPackage.job!.id,
      failureCode: "OBJECT_STORAGE_TEMPORARILY_UNAVAILABLE",
    })
    if (stage === "generation-failed") return inspectionPackage
    return retryInspectionGeneration(inspectionPackage, {
      ...fixtureCommand(inspectionPackage, "retry-generation", "2026-07-15T08:57:00+01:00"),
      jobId: "job-inspection-riverside-retry-2",
      expectedManifestRevision: inspectionPackage.job!.manifestRevision,
    })
  }
  inspectionPackage = completeFixtureJob(
    inspectionPackage,
    stage === "link-expired" ? "2026-07-15T09:30:00+01:00" : "2026-07-16T09:00:00+01:00",
  )
  if (stage === "historical") {
    inspectionPackage = markInspectionSourceChanged(inspectionPackage, {
      ...fixtureCommand(inspectionPackage, "source-changed", "2026-07-15T09:10:00+01:00"),
      evidenceId: "evidence-attendance",
      nextSourceRevision: 13,
    })
  }
  return inspectionPackage
}

export { managerCapabilities }
