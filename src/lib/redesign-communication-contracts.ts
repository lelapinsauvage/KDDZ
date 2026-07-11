export type CommunicationChannel = "WEB" | "PUSH" | "SMS" | "WHATSAPP"

export type CommunicationCapability =
  | "communication.view"
  | "communication.compose"
  | "communication.review_audience"
  | "communication.approve"
  | "communication.send"
  | "communication.manage_delivery"
  | "communication.read"
  | "communication.reply"
  | "communication.correct"
  | "communication.archive"
  | "communication.audit"

export type CommunicationRole = "manager" | "practitioner" | "parent"

export type CommunicationStatus =
  | "SOURCE_GAP"
  | "DRAFT"
  | "AUDIENCE_REVIEW"
  | "APPROVAL_REQUIRED"
  | "READY_TO_SEND"
  | "SEND_ACCEPTED"
  | "PARTIAL_DELIVERY"
  | "DELIVERED"
  | "RESPONSE_DUE"
  | "REPLIED"
  | "CORRECTION_REVIEW"
  | "CORRECTED"

export type CommunicationFixtureStage =
  | "source-gap"
  | "draft"
  | "audience-review"
  | "approval-required"
  | "ready-to-send"
  | "send-accepted"
  | "partial-delivery"
  | "delivered"
  | "response-due"
  | "replied"
  | "correction-review"
  | "corrected"

export interface CommunicationSourceRevision {
  sourceId: string
  revision: number
}

export interface CommunicationAudienceMember {
  id: string
  displayName: string
  childId: string
  childName: string
  parentAccountId: string
  branchId: string
  active: boolean
  relationActive: boolean
  channelEndpoints: Record<CommunicationChannel, boolean>
  channelConsent: Record<CommunicationChannel, boolean>
}

export interface CommunicationDraftRevision {
  revision: number
  subject: string
  body: string
  category: "ROUTINE" | "POLICY" | "URGENT"
  channels: CommunicationChannel[]
  requiresReply: boolean
  replyDueAt?: string
  authoredBy: string
  authoredAt: string
}

export interface CommunicationAudienceRecipient {
  memberId: string
  parentAccountId: string
  childId: string
  channels: CommunicationChannel[]
}

export interface CommunicationAudienceExclusion {
  memberId: string
  reason: "INACTIVE_ACCOUNT" | "INACTIVE_RELATION" | "NO_ELIGIBLE_CHANNEL"
}

export interface CommunicationAudienceSnapshot {
  revision: number
  draftRevision: number
  sourceRevisions: CommunicationSourceRevision[]
  recipients: CommunicationAudienceRecipient[]
  exclusions: CommunicationAudienceExclusion[]
  reviewedBy: string
  reviewedAt: string
}

export interface CommunicationApproval {
  draftRevision: number
  audienceRevision: number
  status: "PENDING" | "APPROVED"
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
}

export interface CommunicationPublication {
  id: string
  draftRevision: number
  audienceRevision: number
  recipientIds: string[]
  acceptedBy: string
  acceptedAt: string
}

export interface CommunicationMessage {
  id: string
  publicationId: string
  correctionRevision?: number
  senderId: string
  senderType: "STAFF" | "PARENT"
  body: string
  createdAt: string
}

export interface CommunicationConversation {
  id: string
  publicationId: string
  parentAccountId: string
  childId: string
  messages: CommunicationMessage[]
}

export interface CommunicationDeliveryAttempt {
  id: string
  publicationId: string
  recipientId: string
  channel: CommunicationChannel
  correctionRevision?: number
  attempt: number
  status: "PENDING" | "DELIVERED" | "FAILED"
  attemptedAt?: string
  deliveredAt?: string
  errorCode?: string
}

export interface CommunicationReadReceipt {
  messageId: string
  recipientId: string
  readAt: string
}

export interface CommunicationFollowUp {
  id: string
  publicationId: string
  recipientId: string
  ownerId: string
  dueAt: string
  status: "OPEN" | "RESOLVED"
  resolvedAt?: string
  resolutionMessageId?: string
}

export interface CommunicationCorrectionDraft {
  revision: number
  publicationId: string
  reason: string
  body: string
  authoredBy: string
  authoredAt: string
}

export interface CommunicationArchiveEvent {
  id: string
  conversationId: string
  principalId: string
  archivedAt: string
}

export interface CommunicationAuditEvent {
  id: string
  type: string
  actorId: string
  occurredAt: string
  detail: string
  revision: number
}

interface CommunicationIdempotencyReceipt {
  key: string
  eventId: string
  signature: string
  resultingRevision: number
}

export interface CommunicationSession {
  id: string
  organizationId: string
  branchId: string
  revision: number
  requiredSources: CommunicationSourceRevision[]
  confirmedSources: CommunicationSourceRevision[]
  audienceDirectory: CommunicationAudienceMember[]
  draftRevisions: CommunicationDraftRevision[]
  activeDraftRevision?: number
  audienceSnapshots: CommunicationAudienceSnapshot[]
  activeAudienceRevision?: number
  approval?: CommunicationApproval
  publications: CommunicationPublication[]
  activePublicationId?: string
  conversations: CommunicationConversation[]
  deliveries: CommunicationDeliveryAttempt[]
  readReceipts: CommunicationReadReceipt[]
  followUps: CommunicationFollowUp[]
  correctionDrafts: CommunicationCorrectionDraft[]
  publishedCorrectionRevision?: number
  archiveEvents: CommunicationArchiveEvent[]
  events: CommunicationAuditEvent[]
  idempotencyReceipts: CommunicationIdempotencyReceipt[]
}

export interface CommunicationCommand {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedRevision: number
  actorCapabilities: CommunicationCapability[]
}

export interface CommunicationProjection {
  status: CommunicationStatus
  subject: string | null
  body: string | null
  recipientCount: number
  exclusionCount: number
  pendingDeliveryCount: number
  failedDeliveryCount: number
  deliveredCount: number
  openFollowUpCount: number
  conversations: Array<{
    id: string
    childName: string
    parentName: string
    messages: CommunicationMessage[]
    archived: boolean
  }>
  sourceRevisions?: CommunicationSourceRevision[]
  recipientDetails?: Array<{
    parentName: string
    childName: string
    channels: CommunicationChannel[]
  }>
  deliveryDetails?: CommunicationDeliveryAttempt[]
  auditEvents?: CommunicationAuditEvent[]
}

const managerCapabilities: CommunicationCapability[] = [
  "communication.view",
  "communication.compose",
  "communication.review_audience",
  "communication.approve",
  "communication.send",
  "communication.manage_delivery",
  "communication.read",
  "communication.reply",
  "communication.correct",
  "communication.archive",
  "communication.audit",
]

export function capabilitiesForCommunicationRole(
  role: CommunicationRole,
): CommunicationCapability[] {
  if (role === "manager") return [...managerCapabilities]
  if (role === "practitioner") {
    return [
      "communication.view",
      "communication.compose",
      "communication.read",
      "communication.reply",
      "communication.archive",
    ]
  }
  return [
    "communication.view",
    "communication.read",
    "communication.reply",
    "communication.archive",
  ]
}

function cloneSession(session: CommunicationSession): CommunicationSession {
  return structuredClone(session)
}

function sourceMap(sources: CommunicationSourceRevision[]) {
  return new Map(sources.map((source) => [source.sourceId, source.revision]))
}

function sourcesAreComplete(session: CommunicationSession) {
  const confirmed = sourceMap(session.confirmedSources)
  return session.requiredSources.every(
    (source) => (confirmed.get(source.sourceId) ?? -1) >= source.revision,
  )
}

function activeDraft(session: CommunicationSession) {
  return session.draftRevisions.find(
    (draft) => draft.revision === session.activeDraftRevision,
  )
}

function activeAudience(session: CommunicationSession) {
  return session.audienceSnapshots.find(
    (snapshot) => snapshot.revision === session.activeAudienceRevision,
  )
}

function activePublication(session: CommunicationSession) {
  return session.publications.find(
    (publication) => publication.id === session.activePublicationId,
  )
}

function commandSignature(type: string, payload: unknown) {
  return `${type}:${JSON.stringify(payload)}`
}

function beginCommand(
  session: CommunicationSession,
  command: CommunicationCommand,
  capability: CommunicationCapability,
  signature: string,
) {
  if (!command.actorCapabilities.includes(capability)) {
    throw new Error(`Missing capability: ${capability}`)
  }

  const prior = session.idempotencyReceipts.find(
    (receipt) => receipt.key === command.idempotencyKey,
  )
  if (prior) {
    if (prior.eventId !== command.eventId || prior.signature !== signature) {
      throw new Error("Idempotency key was reused with changed input")
    }
    return { replay: true as const, next: session }
  }

  if (command.expectedRevision !== session.revision) {
    throw new Error("Communication source revision is stale")
  }

  return { replay: false as const, next: cloneSession(session) }
}

function finishCommand(
  next: CommunicationSession,
  command: CommunicationCommand,
  signature: string,
  type: string,
  detail: string,
) {
  next.revision += 1
  next.idempotencyReceipts.push({
    key: command.idempotencyKey,
    eventId: command.eventId,
    signature,
    resultingRevision: next.revision,
  })
  next.events.push({
    id: command.eventId,
    type,
    actorId: command.actorId,
    occurredAt: command.occurredAt,
    detail,
    revision: next.revision,
  })
  return next
}

export function confirmCommunicationSources(
  session: CommunicationSession,
  command: CommunicationCommand & { sources: CommunicationSourceRevision[] },
) {
  const signature = commandSignature("confirm-sources", command.sources)
  const started = beginCommand(
    session,
    command,
    "communication.review_audience",
    signature,
  )
  if (started.replay) return started.next

  const supplied = sourceMap(command.sources)
  const previous = sourceMap(session.confirmedSources)
  for (const required of session.requiredSources) {
    const revision = supplied.get(required.sourceId)
    if (revision === undefined || revision < required.revision) {
      throw new Error("Every required communication source must be confirmed")
    }
    if (revision < (previous.get(required.sourceId) ?? -1)) {
      throw new Error("Communication source revisions cannot regress")
    }
  }

  started.next.confirmedSources = command.sources.map((source) => ({ ...source }))
  return finishCommand(
    started.next,
    command,
    signature,
    "SOURCES_CONFIRMED",
    `${command.sources.length} communication sources confirmed`,
  )
}

export function saveCommunicationDraft(
  session: CommunicationSession,
  command: CommunicationCommand & {
    subject: string
    body: string
    category: CommunicationDraftRevision["category"]
    channels: CommunicationChannel[]
    requiresReply: boolean
    replyDueAt?: string
  },
) {
  const payload = {
    subject: command.subject,
    body: command.body,
    category: command.category,
    channels: command.channels,
    requiresReply: command.requiresReply,
    replyDueAt: command.replyDueAt,
  }
  const signature = commandSignature("save-draft", payload)
  const started = beginCommand(
    session,
    command,
    "communication.compose",
    signature,
  )
  if (started.replay) return started.next

  const subject = command.subject.trim()
  const body = command.body.trim()
  if (!subject || !body) throw new Error("Subject and message are required")
  if (command.requiresReply && !command.replyDueAt) {
    throw new Error("A response deadline is required")
  }

  const channels = [...new Set<CommunicationChannel>(["WEB", ...command.channels])]
  const revision = Math.max(0, ...session.draftRevisions.map((item) => item.revision)) + 1
  started.next.draftRevisions.push({
    revision,
    subject,
    body,
    category: command.category,
    channels,
    requiresReply: command.requiresReply,
    replyDueAt: command.replyDueAt,
    authoredBy: command.actorId,
    authoredAt: command.occurredAt,
  })
  started.next.activeDraftRevision = revision
  started.next.activeAudienceRevision = undefined
  started.next.approval = undefined

  return finishCommand(
    started.next,
    command,
    signature,
    "DRAFT_SAVED",
    `Draft revision ${revision} saved`,
  )
}

function eligibleChannels(
  member: CommunicationAudienceMember,
  draft: CommunicationDraftRevision,
) {
  return draft.channels.filter(
    (channel) =>
      member.channelEndpoints[channel] &&
      (channel === "WEB" || member.channelConsent[channel]),
  )
}

export function reviewCommunicationAudience(
  session: CommunicationSession,
  command: CommunicationCommand & { memberIds: string[] },
) {
  const selectedIds = [...new Set(command.memberIds)]
  const signature = commandSignature("review-audience", selectedIds)
  const started = beginCommand(
    session,
    command,
    "communication.review_audience",
    signature,
  )
  if (started.replay) return started.next
  if (!sourcesAreComplete(session)) {
    throw new Error("Communication sources are incomplete")
  }

  const draft = activeDraft(session)
  if (!draft) throw new Error("Save the communication draft first")
  if (selectedIds.length === 0) throw new Error("Select at least one audience member")

  const directory = new Map(session.audienceDirectory.map((member) => [member.id, member]))
  const recipients: CommunicationAudienceRecipient[] = []
  const exclusions: CommunicationAudienceExclusion[] = []

  for (const memberId of selectedIds) {
    const member = directory.get(memberId)
    if (!member) throw new Error("Audience member is outside the confirmed directory")
    if (!member.active) {
      exclusions.push({ memberId, reason: "INACTIVE_ACCOUNT" })
      continue
    }
    if (!member.relationActive) {
      exclusions.push({ memberId, reason: "INACTIVE_RELATION" })
      continue
    }
    const channels = eligibleChannels(member, draft)
    if (channels.length === 0) {
      exclusions.push({ memberId, reason: "NO_ELIGIBLE_CHANNEL" })
      continue
    }
    recipients.push({
      memberId,
      parentAccountId: member.parentAccountId,
      childId: member.childId,
      channels,
    })
  }

  if (recipients.length === 0) {
    throw new Error("No eligible recipients remain after channel and relation policy")
  }

  const revision = Math.max(0, ...session.audienceSnapshots.map((item) => item.revision)) + 1
  started.next.audienceSnapshots.push({
    revision,
    draftRevision: draft.revision,
    sourceRevisions: session.confirmedSources.map((source) => ({ ...source })),
    recipients,
    exclusions,
    reviewedBy: command.actorId,
    reviewedAt: command.occurredAt,
  })
  started.next.activeAudienceRevision = revision
  started.next.approval =
    draft.category === "POLICY" || draft.category === "URGENT"
      ? {
          draftRevision: draft.revision,
          audienceRevision: revision,
          status: "PENDING",
          requestedBy: command.actorId,
          requestedAt: command.occurredAt,
        }
      : undefined

  return finishCommand(
    started.next,
    command,
    signature,
    "AUDIENCE_REVIEWED",
    `${recipients.length} recipients confirmed; ${exclusions.length} excluded`,
  )
}

export function approveCommunication(
  session: CommunicationSession,
  command: CommunicationCommand,
) {
  const signature = commandSignature("approve", {
    approval: session.approval,
  })
  const started = beginCommand(
    session,
    command,
    "communication.approve",
    signature,
  )
  if (started.replay) return started.next
  if (!session.approval || session.approval.status !== "PENDING") {
    throw new Error("No communication approval is pending")
  }

  started.next.approval = {
    ...session.approval,
    status: "APPROVED",
    approvedBy: command.actorId,
    approvedAt: command.occurredAt,
  }
  return finishCommand(
    started.next,
    command,
    signature,
    "COMMUNICATION_APPROVED",
    "Audience and content approved",
  )
}

function assertAudienceSourcesFresh(
  session: CommunicationSession,
  audience: CommunicationAudienceSnapshot,
) {
  const current = sourceMap(session.confirmedSources)
  for (const source of audience.sourceRevisions) {
    if (current.get(source.sourceId) !== source.revision) {
      throw new Error("Audience sources changed after review")
    }
  }
}

export function sendCommunication(
  session: CommunicationSession,
  command: CommunicationCommand,
) {
  const signature = commandSignature("send", {
    draftRevision: session.activeDraftRevision,
    audienceRevision: session.activeAudienceRevision,
  })
  const started = beginCommand(
    session,
    command,
    "communication.send",
    signature,
  )
  if (started.replay) return started.next
  if (!sourcesAreComplete(session)) throw new Error("Communication sources are incomplete")

  const draft = activeDraft(session)
  const audience = activeAudience(session)
  if (!draft || !audience || audience.draftRevision !== draft.revision) {
    throw new Error("Content and audience must be reviewed together")
  }
  assertAudienceSourcesFresh(session, audience)
  if (
    (draft.category === "POLICY" || draft.category === "URGENT") &&
    session.approval?.status !== "APPROVED"
  ) {
    throw new Error("Communication approval is required")
  }

  const publicationId = `publication-${command.eventId}`
  started.next.publications.push({
    id: publicationId,
    draftRevision: draft.revision,
    audienceRevision: audience.revision,
    recipientIds: audience.recipients.map((recipient) => recipient.parentAccountId),
    acceptedBy: command.actorId,
    acceptedAt: command.occurredAt,
  })
  started.next.activePublicationId = publicationId

  for (const recipient of audience.recipients) {
    const conversationId = `conversation-${publicationId}-${recipient.parentAccountId}`
    const messageId = `message-${publicationId}-${recipient.parentAccountId}`
    started.next.conversations.push({
      id: conversationId,
      publicationId,
      parentAccountId: recipient.parentAccountId,
      childId: recipient.childId,
      messages: [
        {
          id: messageId,
          publicationId,
          senderId: command.actorId,
          senderType: "STAFF",
          body: draft.body,
          createdAt: command.occurredAt,
        },
      ],
    })
    for (const channel of recipient.channels) {
      started.next.deliveries.push({
        id: `delivery-${publicationId}-${recipient.parentAccountId}-${channel}`,
        publicationId,
        recipientId: recipient.parentAccountId,
        channel,
        attempt: 1,
        status: "PENDING",
      })
    }
    if (draft.requiresReply && draft.replyDueAt) {
      started.next.followUps.push({
        id: `followup-${publicationId}-${recipient.parentAccountId}`,
        publicationId,
        recipientId: recipient.parentAccountId,
        ownerId: command.actorId,
        dueAt: draft.replyDueAt,
        status: "OPEN",
      })
    }
  }

  return finishCommand(
    started.next,
    command,
    signature,
    "SEND_ACCEPTED",
    `${audience.recipients.length} recipient conversations and outbox jobs created atomically`,
  )
}

export function recordCommunicationDeliveryResults(
  session: CommunicationSession,
  command: CommunicationCommand & {
    results: Array<{
      recipientId: string
      channel: CommunicationChannel
      status: "DELIVERED" | "FAILED"
      errorCode?: string
    }>
  },
) {
  const signature = commandSignature("delivery-results", command.results)
  const started = beginCommand(
    session,
    command,
    "communication.manage_delivery",
    signature,
  )
  if (started.replay) return started.next
  const publication = activePublication(session)
  if (!publication) throw new Error("No accepted communication exists")

  for (const result of command.results) {
    const delivery = started.next.deliveries.find(
      (item) =>
        item.publicationId === publication.id &&
        item.recipientId === result.recipientId &&
        item.channel === result.channel &&
        item.correctionRevision === undefined,
    )
    if (!delivery) throw new Error("Delivery result is outside the accepted outbox")
    if (delivery.status !== "PENDING") throw new Error("Delivery attempt is already final")
    delivery.status = result.status
    delivery.attemptedAt = command.occurredAt
    if (result.status === "DELIVERED") {
      delivery.deliveredAt = command.occurredAt
      delivery.errorCode = undefined
    } else {
      delivery.errorCode = result.errorCode ?? "PROVIDER_FAILED"
    }
  }

  return finishCommand(
    started.next,
    command,
    signature,
    "DELIVERY_RESULTS_RECORDED",
    `${command.results.length} channel results recorded`,
  )
}

export function retryFailedCommunicationDelivery(
  session: CommunicationSession,
  command: CommunicationCommand & { deliveryIds: string[] },
) {
  const deliveryIds = [...new Set(command.deliveryIds)]
  const signature = commandSignature("retry-delivery", deliveryIds)
  const started = beginCommand(
    session,
    command,
    "communication.manage_delivery",
    signature,
  )
  if (started.replay) return started.next
  if (deliveryIds.length === 0) throw new Error("Select failed deliveries to retry")

  for (const deliveryId of deliveryIds) {
    const delivery = started.next.deliveries.find((item) => item.id === deliveryId)
    if (!delivery || delivery.status !== "FAILED") {
      throw new Error("Only failed delivery attempts can be retried")
    }
    delivery.status = "PENDING"
    delivery.attempt += 1
    delivery.attemptedAt = undefined
    delivery.deliveredAt = undefined
    delivery.errorCode = undefined
  }

  return finishCommand(
    started.next,
    command,
    signature,
    "DELIVERY_RETRIED",
    `${deliveryIds.length} failed channel attempts returned to pending`,
  )
}

export function markCommunicationRead(
  session: CommunicationSession,
  command: CommunicationCommand & { conversationId: string; messageId: string },
) {
  const signature = commandSignature("mark-read", {
    conversationId: command.conversationId,
    messageId: command.messageId,
  })
  const started = beginCommand(
    session,
    command,
    "communication.read",
    signature,
  )
  if (started.replay) return started.next
  const conversation = session.conversations.find(
    (item) => item.id === command.conversationId,
  )
  if (
    !conversation ||
    conversation.parentAccountId !== command.actorId ||
    !conversation.messages.some((message) => message.id === command.messageId)
  ) {
    throw new Error("Conversation is outside the parent relationship")
  }
  started.next.readReceipts.push({
    messageId: command.messageId,
    recipientId: command.actorId,
    readAt: command.occurredAt,
  })
  return finishCommand(
    started.next,
    command,
    signature,
    "MESSAGE_READ",
    "Read receipt recorded without resolving reply work",
  )
}

export function recordCommunicationReply(
  session: CommunicationSession,
  command: CommunicationCommand & { conversationId: string; body: string },
) {
  const signature = commandSignature("reply", {
    conversationId: command.conversationId,
    body: command.body,
  })
  const started = beginCommand(
    session,
    command,
    "communication.reply",
    signature,
  )
  if (started.replay) return started.next
  const conversation = started.next.conversations.find(
    (item) => item.id === command.conversationId,
  )
  if (!conversation || conversation.parentAccountId !== command.actorId) {
    throw new Error("Conversation is outside the parent relationship")
  }
  const body = command.body.trim()
  if (!body) throw new Error("Reply body is required")

  const messageId = `reply-${command.eventId}`
  conversation.messages.push({
    id: messageId,
    publicationId: conversation.publicationId,
    senderId: command.actorId,
    senderType: "PARENT",
    body,
    createdAt: command.occurredAt,
  })
  const followUp = started.next.followUps.find(
    (item) =>
      item.publicationId === conversation.publicationId &&
      item.recipientId === command.actorId &&
      item.status === "OPEN",
  )
  if (followUp) {
    followUp.status = "RESOLVED"
    followUp.resolvedAt = command.occurredAt
    followUp.resolutionMessageId = messageId
  }

  return finishCommand(
    started.next,
    command,
    signature,
    "PARENT_REPLIED",
    "Parent reply appended to its isolated conversation",
  )
}

export function startCommunicationCorrection(
  session: CommunicationSession,
  command: CommunicationCommand & { reason: string; body: string },
) {
  const signature = commandSignature("start-correction", {
    reason: command.reason,
    body: command.body,
  })
  const started = beginCommand(
    session,
    command,
    "communication.correct",
    signature,
  )
  if (started.replay) return started.next
  const publication = activePublication(session)
  if (!publication) throw new Error("No published communication can be corrected")
  const reason = command.reason.trim()
  const body = command.body.trim()
  if (!reason || !body) throw new Error("Correction reason and body are required")

  const revision = Math.max(0, ...session.correctionDrafts.map((item) => item.revision)) + 1
  started.next.correctionDrafts.push({
    revision,
    publicationId: publication.id,
    reason,
    body,
    authoredBy: command.actorId,
    authoredAt: command.occurredAt,
  })
  return finishCommand(
    started.next,
    command,
    signature,
    "CORRECTION_DRAFTED",
    `Correction revision ${revision} prepared`,
  )
}

export function publishCommunicationCorrection(
  session: CommunicationSession,
  command: CommunicationCommand,
) {
  const correction = session.correctionDrafts.at(-1)
  const signature = commandSignature("publish-correction", correction)
  const started = beginCommand(
    session,
    command,
    "communication.correct",
    signature,
  )
  if (started.replay) return started.next
  const publication = activePublication(session)
  if (!publication || !correction || correction.publicationId !== publication.id) {
    throw new Error("No correction is ready to publish")
  }

  const audience = activeAudience(session)
  if (!audience) throw new Error("The original audience snapshot is unavailable")
  for (const conversation of started.next.conversations.filter(
    (item) => item.publicationId === publication.id,
  )) {
    conversation.messages.push({
      id: `correction-${correction.revision}-${conversation.parentAccountId}`,
      publicationId: publication.id,
      correctionRevision: correction.revision,
      senderId: command.actorId,
      senderType: "STAFF",
      body: correction.body,
      createdAt: command.occurredAt,
    })
    const recipient = audience.recipients.find(
      (item) => item.parentAccountId === conversation.parentAccountId,
    )
    for (const channel of recipient?.channels ?? ["WEB" as const]) {
      started.next.deliveries.push({
        id: `delivery-correction-${correction.revision}-${conversation.parentAccountId}-${channel}`,
        publicationId: publication.id,
        recipientId: conversation.parentAccountId,
        channel,
        correctionRevision: correction.revision,
        attempt: 1,
        status: "PENDING",
      })
    }
  }
  started.next.publishedCorrectionRevision = correction.revision

  return finishCommand(
    started.next,
    command,
    signature,
    "CORRECTION_PUBLISHED",
    `Correction revision ${correction.revision} appended for the original audience`,
  )
}

export function archiveCommunicationConversation(
  session: CommunicationSession,
  command: CommunicationCommand & { conversationId: string },
) {
  const signature = commandSignature("archive", command.conversationId)
  const started = beginCommand(
    session,
    command,
    "communication.archive",
    signature,
  )
  if (started.replay) return started.next
  const conversation = session.conversations.find(
    (item) => item.id === command.conversationId,
  )
  if (
    !conversation ||
    (conversation.parentAccountId !== command.actorId &&
      !command.actorCapabilities.includes("communication.audit"))
  ) {
    throw new Error("Conversation cannot be archived by this principal")
  }
  started.next.archiveEvents.push({
    id: command.eventId,
    conversationId: command.conversationId,
    principalId: command.actorId,
    archivedAt: command.occurredAt,
  })
  return finishCommand(
    started.next,
    command,
    signature,
    "CONVERSATION_ARCHIVED",
    "Conversation hidden for one principal without deleting shared history",
  )
}

export function deriveCommunicationStatus(
  session: CommunicationSession,
): CommunicationStatus {
  if (!sourcesAreComplete(session)) return "SOURCE_GAP"
  const draft = activeDraft(session)
  if (!draft) return "DRAFT"
  const audience = activeAudience(session)
  if (!audience) return "AUDIENCE_REVIEW"
  if (
    (draft.category === "POLICY" || draft.category === "URGENT") &&
    session.approval?.status !== "APPROVED"
  ) {
    return "APPROVAL_REQUIRED"
  }
  const publication = activePublication(session)
  if (!publication) return "READY_TO_SEND"
  if (session.publishedCorrectionRevision !== undefined) return "CORRECTED"
  if (session.correctionDrafts.some((item) => item.publicationId === publication.id)) {
    return "CORRECTION_REVIEW"
  }

  const deliveries = session.deliveries.filter(
    (item) =>
      item.publicationId === publication.id && item.correctionRevision === undefined,
  )
  if (deliveries.some((item) => item.status === "FAILED")) return "PARTIAL_DELIVERY"
  if (deliveries.some((item) => item.status === "PENDING")) return "SEND_ACCEPTED"
  if (session.followUps.some((item) => item.status === "OPEN")) return "RESPONSE_DUE"
  if (
    session.conversations.some((conversation) =>
      conversation.messages.some((message) => message.senderType === "PARENT"),
    )
  ) {
    return "REPLIED"
  }
  return "DELIVERED"
}

function directoryMemberForConversation(
  session: CommunicationSession,
  conversation: CommunicationConversation,
) {
  return session.audienceDirectory.find(
    (member) =>
      member.parentAccountId === conversation.parentAccountId &&
      member.childId === conversation.childId,
  )
}

export function projectCommunicationForRole(
  session: CommunicationSession,
  role: CommunicationRole,
  principalId: string,
): CommunicationProjection {
  const draft = activeDraft(session)
  const audience = activeAudience(session)
  const status = deriveCommunicationStatus(session)
  const parentCanSeeMessage = (
    conversation: CommunicationConversation,
    message: CommunicationMessage,
  ) =>
    session.deliveries.some(
      (delivery) =>
        delivery.publicationId === conversation.publicationId &&
        delivery.recipientId === conversation.parentAccountId &&
        delivery.correctionRevision === message.correctionRevision &&
        delivery.status === "DELIVERED",
    )
  const visibleConversations = session.conversations.filter((conversation) => {
    if (role === "manager") return true
    if (role === "parent") {
      return (
        conversation.parentAccountId === principalId &&
        conversation.messages.some((message) =>
          parentCanSeeMessage(conversation, message),
        )
      )
    }
    return conversation.childId === "child-amelie"
  })
  const archivedIds = new Set(
    session.archiveEvents
      .filter((event) => event.principalId === principalId)
      .map((event) => event.conversationId),
  )
  const deliveries = session.deliveries.filter((delivery) =>
    visibleConversations.some(
      (conversation) => conversation.parentAccountId === delivery.recipientId,
    ),
  )

  const projection: CommunicationProjection = {
    status,
    subject: role === "parent" && visibleConversations.length === 0 ? null : draft?.subject ?? null,
    body: role === "parent" && visibleConversations.length === 0 ? null : draft?.body ?? null,
    recipientCount: visibleConversations.length || (role === "manager" ? audience?.recipients.length ?? 0 : 0),
    exclusionCount: role === "manager" ? audience?.exclusions.length ?? 0 : 0,
    pendingDeliveryCount:
      role === "parent" ? 0 : deliveries.filter((item) => item.status === "PENDING").length,
    failedDeliveryCount:
      role === "parent" ? 0 : deliveries.filter((item) => item.status === "FAILED").length,
    deliveredCount:
      role === "parent" ? 0 : deliveries.filter((item) => item.status === "DELIVERED").length,
    openFollowUpCount:
      role === "parent"
        ? visibleConversations.length === 0
          ? 0
          : session.followUps.filter(
              (item) => item.recipientId === principalId && item.status === "OPEN",
            ).length
        : session.followUps.filter(
            (item) =>
              item.status === "OPEN" &&
              visibleConversations.some(
                (conversation) => conversation.parentAccountId === item.recipientId,
              ),
          ).length,
    conversations: visibleConversations.map((conversation) => {
      const member = directoryMemberForConversation(session, conversation)
      return {
        id: conversation.id,
        childName: member?.childName ?? "Child",
        parentName: role === "parent" ? "You" : member?.displayName ?? "Parent",
        messages: conversation.messages
          .filter(
            (message) =>
              role !== "parent" || parentCanSeeMessage(conversation, message),
          )
          .map((message) => ({ ...message })),
        archived: archivedIds.has(conversation.id),
      }
    }),
  }

  if (role === "manager") {
    projection.sourceRevisions = session.confirmedSources.map((source) => ({ ...source }))
    projection.recipientDetails =
      audience?.recipients.map((recipient) => {
        const member = session.audienceDirectory.find(
          (item) => item.id === recipient.memberId,
        )
        return {
          parentName: member?.displayName ?? "Parent",
          childName: member?.childName ?? "Child",
          channels: [...recipient.channels],
        }
      }) ?? []
    projection.deliveryDetails = session.deliveries.map((delivery) => ({ ...delivery }))
    projection.auditEvents = session.events.map((event) => ({ ...event }))
  }

  return projection
}

function emptyChannelFlags(
  enabled: CommunicationChannel[],
): Record<CommunicationChannel, boolean> {
  return {
    WEB: enabled.includes("WEB"),
    PUSH: enabled.includes("PUSH"),
    SMS: enabled.includes("SMS"),
    WHATSAPP: enabled.includes("WHATSAPP"),
  }
}

export function createEmptyCommunicationSession(): CommunicationSession {
  return {
    id: "communication-session-meadow-2026-08-05",
    organizationId: "organization-riverside",
    branchId: "branch-riverside",
    revision: 0,
    requiredSources: [
      { sourceId: "parent-directory", revision: 4 },
      { sourceId: "relationship-scope", revision: 7 },
      { sourceId: "channel-policy", revision: 3 },
    ],
    confirmedSources: [],
    audienceDirectory: [
      {
        id: "member-amira",
        displayName: "Amira Haddad",
        childId: "child-amelie",
        childName: "Amelie Haddad",
        parentAccountId: "parent-amira",
        branchId: "branch-riverside",
        active: true,
        relationActive: true,
        channelEndpoints: emptyChannelFlags(["WEB", "PUSH", "SMS"]),
        channelConsent: emptyChannelFlags(["WEB", "PUSH", "SMS"]),
      },
      {
        id: "member-omar",
        displayName: "Omar Mansour",
        childId: "child-noah",
        childName: "Noah Mansour",
        parentAccountId: "parent-omar",
        branchId: "branch-riverside",
        active: true,
        relationActive: true,
        channelEndpoints: emptyChannelFlags(["WEB", "PUSH", "WHATSAPP"]),
        channelConsent: emptyChannelFlags(["WEB", "PUSH", "WHATSAPP"]),
      },
      {
        id: "member-lina",
        displayName: "Lina Farah",
        childId: "child-lina",
        childName: "Lina Farah",
        parentAccountId: "parent-lina",
        branchId: "branch-riverside",
        active: false,
        relationActive: true,
        channelEndpoints: emptyChannelFlags(["WEB", "PUSH"]),
        channelConsent: emptyChannelFlags(["WEB", "PUSH"]),
      },
      {
        id: "member-sami",
        displayName: "Sami Nasser",
        childId: "child-sami",
        childName: "Sami Nasser",
        parentAccountId: "parent-sami",
        branchId: "branch-riverside",
        active: true,
        relationActive: false,
        channelEndpoints: emptyChannelFlags(["WEB"]),
        channelConsent: emptyChannelFlags(["WEB"]),
      },
    ],
    draftRevisions: [],
    audienceSnapshots: [],
    publications: [],
    conversations: [],
    deliveries: [],
    readReceipts: [],
    followUps: [],
    correctionDrafts: [],
    archiveEvents: [],
    events: [],
    idempotencyReceipts: [],
  }
}

function fixtureCommand(
  session: CommunicationSession,
  key: string,
  actorId = "manager-ava",
): CommunicationCommand {
  return {
    eventId: `fixture-${key}`,
    idempotencyKey: `fixture-communication-${key}`,
    actorId,
    occurredAt: `2026-08-05T${String(8 + session.revision).padStart(2, "0")}:00:00.000Z`,
    expectedRevision: session.revision,
    actorCapabilities:
      actorId.startsWith("parent-")
        ? capabilitiesForCommunicationRole("parent")
        : capabilitiesForCommunicationRole("manager"),
  }
}

function confirmFixtureSources(session: CommunicationSession) {
  return confirmCommunicationSources(session, {
    ...fixtureCommand(session, "sources"),
    sources: session.requiredSources.map((source) => ({ ...source })),
  })
}

function saveFixtureDraft(
  session: CommunicationSession,
  options: { policy?: boolean; requiresReply?: boolean } = {},
) {
  return saveCommunicationDraft(session, {
    ...fixtureCommand(session, `draft-${options.policy ? "policy" : "routine"}-${options.requiresReply ? "reply" : "info"}`),
    subject: options.policy ? "Updated collection procedure" : "Meadow room update",
    body: options.policy
      ? "Please review the updated collection procedure before Friday."
      : "The Meadow room garden session starts at 15:00 today.",
    category: options.policy ? "POLICY" : "ROUTINE",
    channels: ["PUSH", "SMS", "WHATSAPP"],
    requiresReply: Boolean(options.requiresReply),
    replyDueAt: options.requiresReply ? "2026-08-06T15:00:00.000Z" : undefined,
  })
}

function reviewFixtureAudience(
  session: CommunicationSession,
  memberIds = ["member-amira", "member-omar", "member-lina", "member-sami"],
) {
  return reviewCommunicationAudience(session, {
    ...fixtureCommand(session, `audience-${memberIds.join("-")}`),
    memberIds,
  })
}

function approveFixture(session: CommunicationSession) {
  return approveCommunication(session, fixtureCommand(session, "approval"))
}

function sendFixture(session: CommunicationSession) {
  return sendCommunication(session, fixtureCommand(session, "send"))
}

function settleFixtureDeliveries(
  session: CommunicationSession,
  failedDeliveryId?: string,
) {
  const publication = activePublication(session)
  if (!publication) return session
  return recordCommunicationDeliveryResults(session, {
    ...fixtureCommand(session, failedDeliveryId ? "partial-delivery" : "delivery"),
    results: session.deliveries
      .filter(
        (delivery) =>
          delivery.publicationId === publication.id &&
          delivery.status === "PENDING" &&
          delivery.correctionRevision === undefined,
      )
      .map((delivery) => ({
        recipientId: delivery.recipientId,
        channel: delivery.channel,
        status: delivery.id === failedDeliveryId ? ("FAILED" as const) : ("DELIVERED" as const),
        errorCode: delivery.id === failedDeliveryId ? "PROVIDER_TIMEOUT" : undefined,
      })),
  })
}

export function createCommunicationFixture(
  stage: CommunicationFixtureStage,
): CommunicationSession {
  let session = createEmptyCommunicationSession()
  if (stage === "source-gap") return session

  session = confirmFixtureSources(session)
  if (stage === "draft") return session

  const policyStage = stage === "approval-required" || stage === "ready-to-send"
  const replyStage = stage === "response-due" || stage === "replied"
  session = saveFixtureDraft(session, {
    policy: policyStage,
    requiresReply: replyStage,
  })
  if (stage === "audience-review") return session

  session = reviewFixtureAudience(
    session,
    replyStage ? ["member-amira"] : undefined,
  )
  if (stage === "approval-required") return session
  if (policyStage) session = approveFixture(session)
  if (stage === "ready-to-send") return session

  session = sendFixture(session)
  if (stage === "send-accepted") return session
  if (stage === "partial-delivery") {
    const failed = session.deliveries.find(
      (delivery) => delivery.recipientId === "parent-amira" && delivery.channel === "PUSH",
    )
    return settleFixtureDeliveries(session, failed?.id)
  }

  session = settleFixtureDeliveries(session)
  if (stage === "delivered" || stage === "response-due") return session
  if (stage === "replied") {
    const conversation = session.conversations.find(
      (item) => item.parentAccountId === "parent-amira",
    )
    if (!conversation) return session
    return recordCommunicationReply(session, {
      ...fixtureCommand(session, "reply", "parent-amira"),
      conversationId: conversation.id,
      body: "Read and understood, thank you.",
    })
  }

  session = startCommunicationCorrection(session, {
    ...fixtureCommand(session, "correction-draft"),
    reason: "The garden start time changed after the original message.",
    body: "Correction: the Meadow room garden session starts at 15:30 today.",
  })
  if (stage === "correction-review") return session
  return publishCommunicationCorrection(
    session,
    fixtureCommand(session, "correction-publish"),
  )
}
