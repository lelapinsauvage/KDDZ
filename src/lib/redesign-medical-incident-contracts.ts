export type IncidentCapability =
  | "incident.draft"
  | "incident.submit"
  | "incident.manager_review"
  | "incident.clinical_review"
  | "incident.notify_parent"
  | "incident.acknowledge_parent"
  | "incident.follow_up"
  | "incident.close"
  | "incident.correct"

export type IncidentObligationKind =
  | "MANAGER_REVIEW"
  | "CLINICAL_REVIEW"
  | "PARENT_DELIVERY"
  | "PARENT_ACKNOWLEDGMENT"
  | "FOLLOW_UP"

export type IncidentProjectionStatus =
  | "DRAFT_INCOMPLETE"
  | "DRAFT_READY"
  | "REVIEW_REQUIRED"
  | "PARENT_DELIVERY_PENDING"
  | "DELIVERY_FAILED"
  | "ACKNOWLEDGMENT_PENDING"
  | "FOLLOW_UP_REQUIRED"
  | "READY_TO_CLOSE"
  | "CLOSED"

export type IncidentFixtureStage =
  | "draft-incomplete"
  | "draft-ready"
  | "review-required"
  | "parent-delivery"
  | "delivery-failed"
  | "acknowledgment"
  | "follow-up"
  | "ready-to-close"
  | "closed"
  | "correction-reopened"

type IncidentSourceState = "DRAFT" | "SUBMITTED" | "CLOSED"
type IncidentObligationState = "BLOCKED" | "OPEN" | "FAILED" | "SATISFIED"
type IncidentEvidenceState = "FAILED" | "AVAILABLE"

export interface IncidentPolicy {
  id: string
  version: number
  requiresManagerReview: boolean
  requiresClinicalReview: boolean
  requiresParentDelivery: boolean
  requiresParentAcknowledgment: boolean
  requiresFollowUp: boolean
}

export interface IncidentObligation {
  id: string
  kind: IncidentObligationKind
  state: IncidentObligationState
  ownerId: string
  dueAt: string
  sourceRevision: number
  attemptCount: number
  receipt?: {
    actorId: string
    occurredAt: string
    channel?: "PUSH" | "EMAIL" | "IN_APP"
    providerReceiptId?: string
  }
  failure?: {
    occurredAt: string
    reason: string
    retryWorkItemId: string
  }
}

export interface MedicalIncident {
  id: string
  child: { id: string; name: string; room: string }
  state: IncidentSourceState
  revision: number
  policy: IncidentPolicy
  facts: {
    cause: string
    occurredAt: string
    location: string
    firstAid: string
    witnessNotes: string
  }
  evidence: Array<{
    id: string
    filename: string
    state: IncidentEvidenceState
    attemptCount: number
    failureReason?: string
  }>
  obligations: IncidentObligation[]
  events: IncidentEvent[]
  closedAt?: string
  closedById?: string
}

export interface IncidentEvent {
  eventId: string
  idempotencyKey: string
  fingerprint: string
  kind:
    | "DRAFT_COMPLETED"
    | "EVIDENCE_RETRIED"
    | "SUBMITTED"
    | "REVIEW_COMPLETED"
    | "DELIVERY_FAILED"
    | "PARENT_DELIVERED"
    | "PARENT_ACKNOWLEDGED"
    | "FOLLOW_UP_COMPLETED"
    | "CLOSED"
    | "CORRECTED"
  actorId: string
  occurredAt: string
  detail: string
  resultingRevision: number
}

interface IncidentCommand {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedRevision: number
  actorCapabilities: readonly IncidentCapability[]
}

const fixturePolicy: IncidentPolicy = {
  id: "policy-synthetic-safety",
  version: 3,
  requiresManagerReview: true,
  requiresClinicalReview: true,
  requiresParentDelivery: true,
  requiresParentAcknowledgment: true,
  requiresFollowUp: true,
}

const capabilityByObligation: Record<IncidentObligationKind, IncidentCapability> = {
  MANAGER_REVIEW: "incident.manager_review",
  CLINICAL_REVIEW: "incident.clinical_review",
  PARENT_DELIVERY: "incident.notify_parent",
  PARENT_ACKNOWLEDGMENT: "incident.acknowledge_parent",
  FOLLOW_UP: "incident.follow_up",
}

const obligationLabels: Record<IncidentObligationKind, string> = {
  MANAGER_REVIEW: "Manager safeguarding review",
  CLINICAL_REVIEW: "Clinical review",
  PARENT_DELIVERY: "Parent delivery",
  PARENT_ACKNOWLEDGMENT: "Parent acknowledgment",
  FOLLOW_UP: "Room follow-up",
}

function fingerprint(command: object) {
  return JSON.stringify(command)
}

function beginCommand(
  incident: MedicalIncident,
  command: IncidentCommand,
  capability: IncidentCapability,
) {
  const prior = incident.events.find((event) => event.idempotencyKey === command.idempotencyKey)
  const nextFingerprint = fingerprint(command)
  if (prior) {
    if (prior.fingerprint !== nextFingerprint) {
      throw new Error("Idempotency key reused with different input")
    }
    return { repeated: true, fingerprint: nextFingerprint }
  }
  if (!command.actorCapabilities.includes(capability)) {
    throw new Error(`Missing capability: ${capability}`)
  }
  if (incident.revision !== command.expectedRevision) {
    throw new Error(`Incident revision conflict: expected ${command.expectedRevision}, found ${incident.revision}`)
  }
  return { repeated: false, fingerprint: nextFingerprint }
}

function appendEvent(
  incident: MedicalIncident,
  command: IncidentCommand,
  event: Pick<IncidentEvent, "kind" | "detail">,
  commandFingerprint: string,
  patch: Partial<MedicalIncident>,
) {
  const resultingRevision = incident.revision + 1
  return {
    ...incident,
    ...patch,
    revision: resultingRevision,
    events: [
      ...incident.events,
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

function requiredFactGaps(incident: MedicalIncident) {
  return Object.entries(incident.facts)
    .filter(([, value]) => !value.trim())
    .map(([field]) => field)
}

function currentCycleObligations(incident: MedicalIncident) {
  const cycleRevision = Math.max(0, ...incident.obligations.map((item) => item.sourceRevision))
  return incident.obligations.filter((item) => item.sourceRevision === cycleRevision)
}

function unblockDependencies(obligations: IncidentObligation[]) {
  const pendingReview = obligations.some(
    (item) =>
      (item.kind === "MANAGER_REVIEW" || item.kind === "CLINICAL_REVIEW") &&
      item.state !== "SATISFIED",
  )
  const delivery = obligations.find((item) => item.kind === "PARENT_DELIVERY")
  const acknowledgment = obligations.find((item) => item.kind === "PARENT_ACKNOWLEDGMENT")
  return obligations.map((item) => {
    if (item.kind === "PARENT_DELIVERY" && item.state === "BLOCKED" && !pendingReview) {
      return { ...item, state: "OPEN" as const }
    }
    if (
      item.kind === "PARENT_ACKNOWLEDGMENT" &&
      item.state === "BLOCKED" &&
      delivery?.state === "SATISFIED"
    ) {
      return { ...item, state: "OPEN" as const }
    }
    if (
      item.kind === "FOLLOW_UP" &&
      item.state === "BLOCKED" &&
      (!acknowledgment || acknowledgment.state === "SATISFIED")
    ) {
      return { ...item, state: "OPEN" as const }
    }
    return item
  })
}

function createObligations(policy: IncidentPolicy, sourceRevision: number, suffix = "initial") {
  const definitions: Array<{
    enabled: boolean
    kind: IncidentObligationKind
    ownerId: string
    dueAt: string
    state: IncidentObligationState
  }> = [
    {
      enabled: policy.requiresManagerReview,
      kind: "MANAGER_REVIEW",
      ownerId: "manager-maya",
      dueAt: "2026-07-14T11:00:00+01:00",
      state: "OPEN",
    },
    {
      enabled: policy.requiresClinicalReview,
      kind: "CLINICAL_REVIEW",
      ownerId: "nurse-ines",
      dueAt: "2026-07-14T11:00:00+01:00",
      state: "OPEN",
    },
    {
      enabled: policy.requiresParentDelivery,
      kind: "PARENT_DELIVERY",
      ownerId: "manager-maya",
      dueAt: "2026-07-14T11:15:00+01:00",
      state: "BLOCKED",
    },
    {
      enabled: policy.requiresParentAcknowledgment,
      kind: "PARENT_ACKNOWLEDGMENT",
      ownerId: "parent-alma",
      dueAt: "2026-07-14T13:00:00+01:00",
      state: "BLOCKED",
    },
    {
      enabled: policy.requiresFollowUp,
      kind: "FOLLOW_UP",
      ownerId: "nurse-ines",
      dueAt: "2026-07-14T15:00:00+01:00",
      state: "BLOCKED",
    },
  ]

  return definitions
    .filter((item) => item.enabled)
    .map(({ enabled: _enabled, ...item }) => ({
      ...item,
      id: `${item.kind.toLowerCase()}-${suffix}`,
      sourceRevision,
      attemptCount: 0,
    }))
}

export function createMedicalIncidentFixture(): MedicalIncident {
  return {
    id: "incident-alma-20260714-01",
    child: { id: "child-alma", name: "Alma Rahal", room: "Meadow" },
    state: "DRAFT",
    revision: 0,
    policy: fixturePolicy,
    facts: {
      cause: "Slipped beside the water-play table",
      occurredAt: "2026-07-14T10:24:00+01:00",
      location: "Meadow room / water-play table",
      firstAid: "Cold pack applied for ten minutes",
      witnessNotes: "",
    },
    evidence: [
      {
        id: "evidence-photo-1",
        filename: "water-play-area.jpg",
        state: "FAILED",
        attemptCount: 1,
        failureReason: "Upload interrupted. Entered facts remain saved.",
      },
    ],
    obligations: [],
    events: [],
  }
}

export function completeIncidentDraft(
  incident: MedicalIncident,
  command: IncidentCommand & { witnessNotes: string },
) {
  const started = beginCommand(incident, command, "incident.draft")
  if (started.repeated) return incident
  if (incident.state !== "DRAFT") throw new Error("Only a draft can be completed")
  if (!command.witnessNotes.trim()) throw new Error("Witness notes are required")
  return appendEvent(
    incident,
    command,
    { kind: "DRAFT_COMPLETED", detail: "Witness account saved without discarding existing facts." },
    started.fingerprint,
    { facts: { ...incident.facts, witnessNotes: command.witnessNotes.trim() } },
  )
}

export function retryIncidentEvidence(incident: MedicalIncident, command: IncidentCommand & { evidenceId: string }) {
  const started = beginCommand(incident, command, "incident.draft")
  if (started.repeated) return incident
  if (incident.state !== "DRAFT") throw new Error("Draft evidence cannot be replaced after submission")
  const evidence = incident.evidence.find((item) => item.id === command.evidenceId)
  if (!evidence) throw new Error("Evidence not found")
  return appendEvent(
    incident,
    command,
    { kind: "EVIDENCE_RETRIED", detail: `${evidence.filename} became available on retry.` },
    started.fingerprint,
    {
      evidence: incident.evidence.map((item) =>
        item.id === command.evidenceId
          ? { ...item, state: "AVAILABLE", attemptCount: item.attemptCount + 1, failureReason: undefined }
          : item,
      ),
    },
  )
}

export function submitMedicalIncident(incident: MedicalIncident, command: IncidentCommand) {
  const started = beginCommand(incident, command, "incident.submit")
  if (started.repeated) return incident
  if (incident.state !== "DRAFT") throw new Error("Only a draft can be submitted")
  const gaps = requiredFactGaps(incident)
  if (gaps.length) throw new Error(`Incident facts incomplete: ${gaps.join(", ")}`)
  if (incident.evidence.some((item) => item.state !== "AVAILABLE")) {
    throw new Error("Evidence upload is unresolved")
  }
  const sourceRevision = incident.revision + 1
  return appendEvent(
    incident,
    command,
    { kind: "SUBMITTED", detail: `Submitted under policy ${incident.policy.id} v${incident.policy.version}.` },
    started.fingerprint,
    {
      state: "SUBMITTED",
      obligations: createObligations(incident.policy, sourceRevision),
    },
  )
}

export function completeIncidentReview(
  incident: MedicalIncident,
  command: IncidentCommand & { obligationId: string; expectedObligationRevision: number },
) {
  const obligation = incident.obligations.find((item) => item.id === command.obligationId)
  if (!obligation || !["MANAGER_REVIEW", "CLINICAL_REVIEW"].includes(obligation.kind)) {
    throw new Error("Review obligation not found")
  }
  const started = beginCommand(incident, command, capabilityByObligation[obligation.kind])
  if (started.repeated) return incident
  if (obligation.sourceRevision !== command.expectedObligationRevision) {
    throw new Error("Review source revision conflict")
  }
  if (obligation.state !== "OPEN") throw new Error("Review obligation is not open")
  const obligations = unblockDependencies(
    incident.obligations.map((item) =>
      item.id === obligation.id
        ? {
            ...item,
            state: "SATISFIED" as const,
            receipt: { actorId: command.actorId, occurredAt: command.occurredAt },
          }
        : item,
    ),
  )
  return appendEvent(
    incident,
    command,
    { kind: "REVIEW_COMPLETED", detail: `${obligationLabels[obligation.kind]} completed.` },
    started.fingerprint,
    { obligations },
  )
}

export function recordParentDelivery(
  incident: MedicalIncident,
  command: IncidentCommand & {
    obligationId: string
    expectedObligationRevision: number
    outcome: "FAILED" | "DELIVERED"
    failureReason?: string
    providerReceiptId?: string
  },
) {
  const started = beginCommand(incident, command, "incident.notify_parent")
  if (started.repeated) return incident
  const obligation = incident.obligations.find(
    (item) => item.id === command.obligationId && item.kind === "PARENT_DELIVERY",
  )
  if (!obligation) throw new Error("Parent delivery obligation not found")
  if (obligation.sourceRevision !== command.expectedObligationRevision) {
    throw new Error("Delivery source revision conflict")
  }
  if (obligation.state !== "OPEN" && obligation.state !== "FAILED") {
    throw new Error("Parent delivery is not ready")
  }
  if (command.outcome === "FAILED" && !command.failureReason?.trim()) {
    throw new Error("Delivery failure reason is required")
  }
  if (command.outcome === "DELIVERED" && !command.providerReceiptId?.trim()) {
    throw new Error("Provider receipt is required")
  }
  const obligations = unblockDependencies(
    incident.obligations.map((item) => {
      if (item.id !== obligation.id) return item
      if (command.outcome === "FAILED") {
        return {
          ...item,
          state: "FAILED" as const,
          attemptCount: item.attemptCount + 1,
          failure: {
            occurredAt: command.occurredAt,
            reason: command.failureReason!.trim(),
            retryWorkItemId: `retry-${incident.id}-${item.attemptCount + 1}`,
          },
        }
      }
      return {
        ...item,
        state: "SATISFIED" as const,
        attemptCount: item.attemptCount + 1,
        failure: undefined,
        receipt: {
          actorId: command.actorId,
          occurredAt: command.occurredAt,
          channel: "PUSH" as const,
          providerReceiptId: command.providerReceiptId!.trim(),
        },
      }
    }),
  )
  return appendEvent(
    incident,
    command,
    {
      kind: command.outcome === "FAILED" ? "DELIVERY_FAILED" : "PARENT_DELIVERED",
      detail:
        command.outcome === "FAILED"
          ? "Parent delivery failed; retry work remains open."
          : "Parent delivery recorded with provider receipt.",
    },
    started.fingerprint,
    { obligations },
  )
}

export function acknowledgeIncidentAsParent(
  incident: MedicalIncident,
  command: IncidentCommand & { obligationId: string; expectedObligationRevision: number },
) {
  return satisfyObligation(
    incident,
    command,
    "PARENT_ACKNOWLEDGMENT",
    "incident.acknowledge_parent",
    "PARENT_ACKNOWLEDGED",
    "Parent acknowledgment recorded separately from delivery.",
  )
}

export function completeIncidentFollowUp(
  incident: MedicalIncident,
  command: IncidentCommand & { obligationId: string; expectedObligationRevision: number },
) {
  return satisfyObligation(
    incident,
    command,
    "FOLLOW_UP",
    "incident.follow_up",
    "FOLLOW_UP_COMPLETED",
    "Room follow-up completed with a named clinical owner.",
  )
}

function satisfyObligation(
  incident: MedicalIncident,
  command: IncidentCommand & { obligationId: string; expectedObligationRevision: number },
  kind: IncidentObligationKind,
  capability: IncidentCapability,
  eventKind: "PARENT_ACKNOWLEDGED" | "FOLLOW_UP_COMPLETED",
  detail: string,
) {
  const started = beginCommand(incident, command, capability)
  if (started.repeated) return incident
  const obligation = incident.obligations.find(
    (item) => item.id === command.obligationId && item.kind === kind,
  )
  if (!obligation) throw new Error(`${obligationLabels[kind]} obligation not found`)
  if (obligation.sourceRevision !== command.expectedObligationRevision) {
    throw new Error(`${obligationLabels[kind]} source revision conflict`)
  }
  if (obligation.state !== "OPEN") throw new Error(`${obligationLabels[kind]} is not ready`)
  const obligations = unblockDependencies(
    incident.obligations.map((item) =>
      item.id === obligation.id
        ? {
            ...item,
            state: "SATISFIED" as const,
            receipt: { actorId: command.actorId, occurredAt: command.occurredAt },
          }
        : item,
    ),
  )
  return appendEvent(incident, command, { kind: eventKind, detail }, started.fingerprint, { obligations })
}

export function closeMedicalIncident(
  incident: MedicalIncident,
  command: IncidentCommand & { expectedObligationRevisions: Record<string, number> },
) {
  const started = beginCommand(incident, command, "incident.close")
  if (started.repeated) return incident
  if (incident.state !== "SUBMITTED") throw new Error("Only a submitted incident can close")
  const unresolved = incident.obligations.filter((item) => item.state !== "SATISFIED")
  if (unresolved.length) throw new Error("Incident obligations are not complete")
  for (const obligation of incident.obligations) {
    if (command.expectedObligationRevisions[obligation.id] !== obligation.sourceRevision) {
      throw new Error(`Obligation source revision conflict: ${obligation.id}`)
    }
  }
  return appendEvent(
    incident,
    command,
    { kind: "CLOSED", detail: "Incident closed from fresh source and obligation revisions." },
    started.fingerprint,
    { state: "CLOSED", closedAt: command.occurredAt, closedById: command.actorId },
  )
}

export function correctMedicalIncident(
  incident: MedicalIncident,
  command: IncidentCommand & {
    reason: string
    correctedCause: string
    reopen: readonly IncidentObligationKind[]
  },
) {
  const started = beginCommand(incident, command, "incident.correct")
  if (started.repeated) return incident
  if (incident.state === "DRAFT") throw new Error("Draft facts can be edited without a correction event")
  if (!command.reason.trim() || !command.correctedCause.trim()) {
    throw new Error("Correction reason and corrected fact are required")
  }
  const sourceRevision = incident.revision + 1
  const correctionPolicy: IncidentPolicy = {
    ...incident.policy,
    requiresManagerReview: command.reopen.includes("MANAGER_REVIEW"),
    requiresClinicalReview: command.reopen.includes("CLINICAL_REVIEW"),
    requiresParentDelivery: command.reopen.includes("PARENT_DELIVERY"),
    requiresParentAcknowledgment: command.reopen.includes("PARENT_ACKNOWLEDGMENT"),
    requiresFollowUp: command.reopen.includes("FOLLOW_UP"),
  }
  const correctionObligations = createObligations(correctionPolicy, sourceRevision, `correction-${sourceRevision}`)
  return appendEvent(
    incident,
    command,
    { kind: "CORRECTED", detail: `Correction recorded: ${command.reason.trim()}` },
    started.fingerprint,
    {
      state: "SUBMITTED",
      closedAt: undefined,
      closedById: undefined,
      facts: { ...incident.facts, cause: command.correctedCause.trim() },
      obligations: [...incident.obligations, ...correctionObligations],
    },
  )
}

export function projectMedicalIncident(incident: MedicalIncident) {
  const gaps = requiredFactGaps(incident)
  const evidenceFailures = incident.evidence.filter((item) => item.state === "FAILED")
  const current = currentCycleObligations(incident)
  const open = current.filter((item) => item.state !== "SATISFIED")
  let status: IncidentProjectionStatus

  if (incident.state === "DRAFT") {
    status = gaps.length || evidenceFailures.length ? "DRAFT_INCOMPLETE" : "DRAFT_READY"
  } else if (incident.state === "CLOSED") {
    status = "CLOSED"
  } else if (current.some((item) => item.kind === "PARENT_DELIVERY" && item.state === "FAILED")) {
    status = "DELIVERY_FAILED"
  } else if (
    current.some(
      (item) =>
        (item.kind === "MANAGER_REVIEW" || item.kind === "CLINICAL_REVIEW") &&
        item.state !== "SATISFIED",
    )
  ) {
    status = "REVIEW_REQUIRED"
  } else if (current.some((item) => item.kind === "PARENT_DELIVERY" && item.state !== "SATISFIED")) {
    status = "PARENT_DELIVERY_PENDING"
  } else if (
    current.some((item) => item.kind === "PARENT_ACKNOWLEDGMENT" && item.state !== "SATISFIED")
  ) {
    status = "ACKNOWLEDGMENT_PENDING"
  } else if (current.some((item) => item.kind === "FOLLOW_UP" && item.state !== "SATISFIED")) {
    status = "FOLLOW_UP_REQUIRED"
  } else {
    status = "READY_TO_CLOSE"
  }

  return {
    status,
    gaps,
    evidenceFailures,
    currentObligations: current,
    openObligations: open,
    satisfiedCount: current.length - open.length,
    totalCount: current.length,
    latestEvent: incident.events.at(-1),
  }
}

const allCapabilities: IncidentCapability[] = [
  "incident.draft",
  "incident.submit",
  "incident.manager_review",
  "incident.clinical_review",
  "incident.notify_parent",
  "incident.acknowledge_parent",
  "incident.follow_up",
  "incident.close",
  "incident.correct",
]

function commandBase(incident: MedicalIncident, id: string, actorId = "manager-maya") {
  return {
    eventId: id,
    idempotencyKey: `${id}-once`,
    actorId,
    occurredAt: "2026-07-14T10:30:00+01:00",
    expectedRevision: incident.revision,
    actorCapabilities: allCapabilities,
  }
}

export function createMedicalIncidentScenario(stage: IncidentFixtureStage) {
  let incident = createMedicalIncidentFixture()
  if (stage === "draft-incomplete") return incident
  incident = completeIncidentDraft(incident, {
    ...commandBase(incident, "complete-witness", "staff-lina"),
    witnessNotes: "Observed Alma step backward onto water beside the table.",
  })
  incident = retryIncidentEvidence(incident, {
    ...commandBase(incident, "retry-evidence", "staff-lina"),
    evidenceId: "evidence-photo-1",
  })
  if (stage === "draft-ready") return incident
  incident = submitMedicalIncident(incident, commandBase(incident, "submit-incident", "staff-lina"))
  if (stage === "review-required") return incident
  for (const kind of ["MANAGER_REVIEW", "CLINICAL_REVIEW"] as const) {
    const obligation = currentCycleObligations(incident).find((item) => item.kind === kind)!
    incident = completeIncidentReview(incident, {
      ...commandBase(incident, `complete-${kind.toLowerCase()}`, kind === "MANAGER_REVIEW" ? "manager-maya" : "nurse-ines"),
      obligationId: obligation.id,
      expectedObligationRevision: obligation.sourceRevision,
    })
  }
  if (stage === "parent-delivery") return incident
  const delivery = currentCycleObligations(incident).find((item) => item.kind === "PARENT_DELIVERY")!
  incident = recordParentDelivery(incident, {
    ...commandBase(incident, "delivery-failed"),
    obligationId: delivery.id,
    expectedObligationRevision: delivery.sourceRevision,
    outcome: "FAILED",
    failureReason: "Push provider timed out",
  })
  if (stage === "delivery-failed") return incident
  incident = recordParentDelivery(incident, {
    ...commandBase(incident, "delivery-retry"),
    obligationId: delivery.id,
    expectedObligationRevision: delivery.sourceRevision,
    outcome: "DELIVERED",
    providerReceiptId: "push-receipt-synthetic-42",
  })
  if (stage === "acknowledgment") return incident
  const acknowledgment = currentCycleObligations(incident).find(
    (item) => item.kind === "PARENT_ACKNOWLEDGMENT",
  )!
  incident = acknowledgeIncidentAsParent(incident, {
    ...commandBase(incident, "parent-acknowledged", "parent-alma"),
    obligationId: acknowledgment.id,
    expectedObligationRevision: acknowledgment.sourceRevision,
  })
  if (stage === "follow-up") return incident
  const followUp = currentCycleObligations(incident).find((item) => item.kind === "FOLLOW_UP")!
  incident = completeIncidentFollowUp(incident, {
    ...commandBase(incident, "follow-up-complete", "nurse-ines"),
    obligationId: followUp.id,
    expectedObligationRevision: followUp.sourceRevision,
  })
  if (stage === "ready-to-close") return incident
  incident = closeMedicalIncident(incident, {
    ...commandBase(incident, "close-incident"),
    expectedObligationRevisions: Object.fromEntries(
      incident.obligations.map((item) => [item.id, item.sourceRevision]),
    ),
  })
  if (stage === "closed") return incident
  return correctMedicalIncident(incident, {
    ...commandBase(incident, "correct-incident"),
    reason: "Witness confirmed the water came from a tipped jug, not the play table.",
    correctedCause: "Slipped on water from a tipped jug beside the water-play table",
    reopen: [
      "MANAGER_REVIEW",
      "PARENT_DELIVERY",
      "PARENT_ACKNOWLEDGMENT",
      "FOLLOW_UP",
    ],
  })
}

export function capabilityForObligation(kind: IncidentObligationKind) {
  return capabilityByObligation[kind]
}

export function labelForObligation(kind: IncidentObligationKind) {
  return obligationLabels[kind]
}
