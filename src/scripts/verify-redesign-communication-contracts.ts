import assert from "node:assert/strict"

import {
  approveCommunication,
  archiveCommunicationConversation,
  capabilitiesForCommunicationRole,
  confirmCommunicationSources,
  createCommunicationFixture,
  createEmptyCommunicationSession,
  deriveCommunicationStatus,
  markCommunicationRead,
  projectCommunicationForRole,
  publishCommunicationCorrection,
  recordCommunicationDeliveryResults,
  recordCommunicationReply,
  retryFailedCommunicationDelivery,
  reviewCommunicationAudience,
  saveCommunicationDraft,
  sendCommunication,
  startCommunicationCorrection,
  type CommunicationCommand,
  type CommunicationSession,
} from "../lib/redesign-communication-contracts"

function command(
  session: CommunicationSession,
  key: string,
  actorId = "verify-manager",
): CommunicationCommand {
  return {
    eventId: `verify-event-${key}`,
    idempotencyKey: `verify-communication-${key}`,
    actorId,
    occurredAt: "2026-08-05T14:00:00.000Z",
    expectedRevision: session.revision,
    actorCapabilities:
      actorId.startsWith("parent-")
        ? capabilitiesForCommunicationRole("parent")
        : capabilitiesForCommunicationRole("manager"),
  }
}

function withSources(session: CommunicationSession, key = "sources") {
  return confirmCommunicationSources(session, {
    ...command(session, key),
    sources: session.requiredSources.map((source) => ({ ...source })),
  })
}

function withDraft(
  session: CommunicationSession,
  options: { policy?: boolean; requiresReply?: boolean } = {},
) {
  return saveCommunicationDraft(session, {
    ...command(session, `draft-${options.policy ? "policy" : "routine"}`),
    subject: options.policy ? "Collection policy" : "Meadow update",
    body: options.policy
      ? "Please review the collection policy."
      : "The garden session starts at 15:00.",
    category: options.policy ? "POLICY" : "ROUTINE",
    channels: ["PUSH", "SMS", "WHATSAPP"],
    requiresReply: Boolean(options.requiresReply),
    replyDueAt: options.requiresReply ? "2026-08-06T15:00:00.000Z" : undefined,
  })
}

function withAudience(
  session: CommunicationSession,
  memberIds = ["member-amira", "member-omar", "member-lina", "member-sami"],
) {
  return reviewCommunicationAudience(session, {
    ...command(session, `audience-${memberIds.join("-")}`),
    memberIds,
  })
}

function withPublication(session: CommunicationSession) {
  return sendCommunication(session, command(session, "send"))
}

function settleAllDeliveries(session: CommunicationSession) {
  return recordCommunicationDeliveryResults(session, {
    ...command(session, "settle-all"),
    results: session.deliveries
      .filter(
        (delivery) =>
          delivery.publicationId === session.activePublicationId &&
          delivery.status === "PENDING" &&
          delivery.correctionRevision === undefined,
      )
      .map((delivery) => ({
        recipientId: delivery.recipientId,
        channel: delivery.channel,
        status: "DELIVERED" as const,
      })),
  })
}

const stages = [
  ["source-gap", "SOURCE_GAP"],
  ["draft", "DRAFT"],
  ["audience-review", "AUDIENCE_REVIEW"],
  ["approval-required", "APPROVAL_REQUIRED"],
  ["ready-to-send", "READY_TO_SEND"],
  ["send-accepted", "SEND_ACCEPTED"],
  ["partial-delivery", "PARTIAL_DELIVERY"],
  ["delivered", "DELIVERED"],
  ["response-due", "RESPONSE_DUE"],
  ["replied", "REPLIED"],
  ["correction-review", "CORRECTION_REVIEW"],
  ["corrected", "CORRECTED"],
] as const

for (const [stage, expected] of stages) {
  assert.equal(
    deriveCommunicationStatus(createCommunicationFixture(stage)),
    expected,
    `${stage} must derive ${expected}`,
  )
}

const sourceGap = createEmptyCommunicationSession()
assert.equal(sourceGap.draftRevisions.length, 0)
assert.equal(sourceGap.publications.length, 0)
assert.equal(sourceGap.deliveries.length, 0)
assert.throws(
  () =>
    confirmCommunicationSources(sourceGap, {
      ...command(sourceGap, "partial-source"),
      sources: [sourceGap.requiredSources[0]],
    }),
  /Every required communication source must be confirmed/,
)

const confirmed = withSources(sourceGap)
assert.throws(
  () =>
    confirmCommunicationSources(confirmed, {
      ...command(confirmed, "regressed-source"),
      sources: confirmed.requiredSources.map((source) => ({
        ...source,
        revision: source.sourceId === "parent-directory" ? source.revision - 1 : source.revision,
      })),
    }),
  /cannot regress|must be confirmed/,
)
assert.throws(
  () =>
    saveCommunicationDraft(confirmed, {
      ...command(confirmed, "missing-body"),
      subject: "A subject",
      body: " ",
      category: "ROUTINE",
      channels: ["PUSH"],
      requiresReply: false,
    }),
  /Subject and message are required/,
)
assert.throws(
  () =>
    saveCommunicationDraft(confirmed, {
      ...command(confirmed, "missing-deadline"),
      subject: "Response needed",
      body: "Please reply.",
      category: "ROUTINE",
      channels: ["PUSH"],
      requiresReply: true,
    }),
  /response deadline/,
)

const drafted = withDraft(confirmed)
const activeDraft = drafted.draftRevisions.at(-1)
assert(activeDraft)
assert.deepEqual(activeDraft.channels, ["WEB", "PUSH", "SMS", "WHATSAPP"])
assert.equal(drafted.publications.length, 0, "a draft must not count as sent")

const reviewed = withAudience(drafted)
const audience = reviewed.audienceSnapshots.at(-1)
assert(audience)
assert.equal(audience.recipients.length, 2)
assert.deepEqual(
  audience.exclusions.map((item) => item.reason).sort(),
  ["INACTIVE_ACCOUNT", "INACTIVE_RELATION"],
)
assert.deepEqual(
  audience.recipients.find((item) => item.parentAccountId === "parent-amira")?.channels,
  ["WEB", "PUSH", "SMS"],
)
assert.deepEqual(
  audience.recipients.find((item) => item.parentAccountId === "parent-omar")?.channels,
  ["WEB", "PUSH", "WHATSAPP"],
)
assert.throws(
  () =>
    reviewCommunicationAudience(drafted, {
      ...command(drafted, "unknown-member"),
      memberIds: ["member-outside-scope"],
    }),
  /outside the confirmed directory/,
)

let policy = withSources(createEmptyCommunicationSession(), "policy-sources")
policy = withDraft(policy, { policy: true })
policy = withAudience(policy, ["member-amira"])
assert.equal(deriveCommunicationStatus(policy), "APPROVAL_REQUIRED")
assert.throws(
  () => sendCommunication(policy, command(policy, "premature-send")),
  /approval is required/,
)
policy = approveCommunication(policy, command(policy, "approve"))
assert.equal(deriveCommunicationStatus(policy), "READY_TO_SEND")

const changedSources = confirmCommunicationSources(reviewed, {
  ...command(reviewed, "source-change"),
  sources: reviewed.requiredSources.map((source) => ({
    ...source,
    revision: source.sourceId === "parent-directory" ? source.revision + 1 : source.revision,
  })),
})
assert.throws(
  () => sendCommunication(changedSources, command(changedSources, "stale-audience-send")),
  /Audience sources changed after review/,
)
const refreshedAudience = withAudience(changedSources, ["member-amira", "member-omar"])
assert.equal(deriveCommunicationStatus(refreshedAudience), "READY_TO_SEND")

const published = withPublication(reviewed)
assert.equal(published.publications.length, 1)
assert.equal(published.conversations.length, 2)
assert.equal(
  new Set(published.conversations.map((conversation) => conversation.id)).size,
  2,
  "each parent must receive an isolated conversation",
)
assert.equal(published.deliveries.length, 6)
assert.equal(published.deliveries.every((delivery) => delivery.status === "PENDING"), true)
assert.equal(
  published.conversations.every((conversation) => conversation.messages.length === 1),
  true,
)

const replayCommand = command(reviewed, "idempotent-send")
const once = sendCommunication(reviewed, replayCommand)
const replay = sendCommunication(once, replayCommand)
assert.deepEqual(replay, once)
assert.throws(
  () =>
    sendCommunication(once, {
      ...replayCommand,
      eventId: "changed-event-for-same-key",
    }),
  /Idempotency key was reused with changed input/,
)

const failedDelivery = published.deliveries.find(
  (delivery) => delivery.recipientId === "parent-amira" && delivery.channel === "PUSH",
)
assert(failedDelivery)
const partial = recordCommunicationDeliveryResults(published, {
  ...command(published, "partial-results"),
  results: published.deliveries.map((delivery) => ({
    recipientId: delivery.recipientId,
    channel: delivery.channel,
    status: delivery.id === failedDelivery.id ? ("FAILED" as const) : ("DELIVERED" as const),
    errorCode: delivery.id === failedDelivery.id ? "PROVIDER_TIMEOUT" : undefined,
  })),
})
assert.equal(deriveCommunicationStatus(partial), "PARTIAL_DELIVERY")
const deliveredBeforeRetry = partial.deliveries.filter(
  (delivery) => delivery.status === "DELIVERED",
)
const retried = retryFailedCommunicationDelivery(partial, {
  ...command(partial, "retry-failed"),
  deliveryIds: [failedDelivery.id],
})
assert.equal(
  retried.deliveries.find((delivery) => delivery.id === failedDelivery.id)?.attempt,
  2,
)
assert.equal(
  retried.deliveries.find((delivery) => delivery.id === failedDelivery.id)?.status,
  "PENDING",
)
assert.deepEqual(
  retried.deliveries.filter((delivery) => delivery.status === "DELIVERED"),
  deliveredBeforeRetry,
  "retry must not reset successful channels",
)

let response = withSources(createEmptyCommunicationSession(), "response-sources")
response = withDraft(response, { requiresReply: true })
response = withAudience(response, ["member-amira"])
response = withPublication(response)
response = settleAllDeliveries(response)
const amiraConversation = response.conversations[0]
const staffMessage = amiraConversation.messages[0]
assert.equal(deriveCommunicationStatus(response), "RESPONSE_DUE")
const read = markCommunicationRead(response, {
  ...command(response, "read", "parent-amira"),
  conversationId: amiraConversation.id,
  messageId: staffMessage.id,
})
assert.equal(read.readReceipts.length, 1)
assert.equal(deriveCommunicationStatus(read), "RESPONSE_DUE", "read is not a reply")
assert.equal(read.followUps[0].status, "OPEN")
assert.throws(
  () =>
    recordCommunicationReply(read, {
      ...command(read, "wrong-parent-reply", "parent-omar"),
      conversationId: amiraConversation.id,
      body: "This must be denied.",
    }),
  /outside the parent relationship/,
)
const replied = recordCommunicationReply(read, {
  ...command(read, "valid-reply", "parent-amira"),
  conversationId: amiraConversation.id,
  body: "Read and understood.",
})
assert.equal(deriveCommunicationStatus(replied), "REPLIED")
assert.equal(replied.followUps[0].status, "RESOLVED")
assert.equal(replied.conversations[0].messages.length, 2)

const archived = archiveCommunicationConversation(replied, {
  ...command(replied, "archive", "parent-amira"),
  conversationId: amiraConversation.id,
})
assert.equal(archived.archiveEvents.length, 1)
assert.equal(archived.conversations.length, 1)
assert.equal(archived.conversations[0].messages.length, 2)

const delivered = settleAllDeliveries(published)
const correctionDraft = startCommunicationCorrection(delivered, {
  ...command(delivered, "correction-draft"),
  reason: "The start time changed.",
  body: "Correction: the garden session starts at 15:30.",
})
assert.equal(deriveCommunicationStatus(correctionDraft), "CORRECTION_REVIEW")
const corrected = publishCommunicationCorrection(
  correctionDraft,
  command(correctionDraft, "correction-publish"),
)
assert.equal(deriveCommunicationStatus(corrected), "CORRECTED")
assert.deepEqual(
  corrected.publications[0].recipientIds,
  delivered.publications[0].recipientIds,
  "correction must preserve the frozen original audience",
)
assert.equal(corrected.conversations.every((item) => item.messages.length === 2), true)
assert.equal(
  corrected.deliveries.filter((item) => item.correctionRevision === 1).length,
  delivered.deliveries.length,
)

const managerProjection = projectCommunicationForRole(corrected, "manager", "manager-ava")
const practitionerProjection = projectCommunicationForRole(
  corrected,
  "practitioner",
  "practitioner-meadow",
)
const parentProjection = projectCommunicationForRole(corrected, "parent", "parent-amira")
assert.equal(managerProjection.conversations.length, 2)
assert.equal(practitionerProjection.conversations.length, 1)
assert.equal(practitionerProjection.conversations[0].childName, "Amelie Haddad")
assert.equal(parentProjection.conversations.length, 1)
assert.equal(parentProjection.conversations[0].parentName, "You")
assert.equal(parentProjection.sourceRevisions, undefined)
assert.equal(parentProjection.recipientDetails, undefined)
assert.equal(parentProjection.deliveryDetails, undefined)
assert.equal(parentProjection.auditEvents, undefined)
assert.equal(
  parentProjection.conversations[0].messages.length,
  1,
  "a pending correction must not enter the parent projection",
)
assert.equal(JSON.stringify(parentProjection).includes("Omar"), false)
assert.equal(JSON.stringify(parentProjection).includes("Noah"), false)
assert.equal(JSON.stringify(parentProjection).includes("parent-omar"), false)
assert.equal(JSON.stringify(parentProjection).includes("PROVIDER"), false)

assert.throws(
  () =>
    sendCommunication(reviewed, {
      ...command(reviewed, "capability-denied"),
      actorCapabilities: capabilitiesForCommunicationRole("practitioner"),
    }),
  /Missing capability: communication.send/,
)

console.log("Communication redesign contracts verified")
