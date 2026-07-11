"use client"

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  CircleDashed,
  Clock3,
  History,
  LockKeyhole,
  MailCheck,
  MessageSquareReply,
  RefreshCw,
  Send,
  ShieldCheck,
  UsersRound,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  approveCommunication,
  capabilitiesForCommunicationRole,
  confirmCommunicationSources,
  createCommunicationFixture,
  deriveCommunicationStatus,
  publishCommunicationCorrection,
  recordCommunicationDeliveryResults,
  recordCommunicationReply,
  retryFailedCommunicationDelivery,
  reviewCommunicationAudience,
  saveCommunicationDraft,
  sendCommunication,
  startCommunicationCorrection,
  projectCommunicationForRole,
  type CommunicationCommand,
  type CommunicationFixtureStage,
  type CommunicationRole,
  type CommunicationSession,
  type CommunicationStatus,
} from "@/lib/redesign-communication-contracts"
import { CommunicationAxeHarness } from "./communication-axe-harness"

const stages: Array<{ value: CommunicationFixtureStage; label: string }> = [
  { value: "source-gap", label: "Source gap" },
  { value: "draft", label: "Draft" },
  { value: "audience-review", label: "Audience review" },
  { value: "approval-required", label: "Approval required" },
  { value: "ready-to-send", label: "Ready to send" },
  { value: "send-accepted", label: "Send accepted" },
  { value: "partial-delivery", label: "Partial delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "response-due", label: "Response due" },
  { value: "replied", label: "Replied" },
  { value: "correction-review", label: "Correction review" },
  { value: "corrected", label: "Corrected" },
]

const roleLabels: Record<CommunicationRole, string> = {
  manager: "Nursery manager",
  practitioner: "Room practitioner",
  parent: "Linked parent",
}

const statusContent: Record<
  CommunicationStatus,
  { eyebrow: string; title: string; detail: string; action: string }
> = {
  SOURCE_GAP: {
    eyebrow: "Audience withheld",
    title: "Recipient sources are incomplete",
    detail: "No audience can be inferred until relationship, directory, and channel-policy revisions are confirmed together.",
    action: "Confirm source set",
  },
  DRAFT: {
    eyebrow: "Nothing has been sent",
    title: "Start with a versioned message draft",
    detail: "Content, channel intent, response requirement, and deadline remain editable without creating recipient rows.",
    action: "Save policy draft",
  },
  AUDIENCE_REVIEW: {
    eyebrow: "Draft revision 1",
    title: "Review people, relationships, and channels",
    detail: "Inactive accounts and relationships are excluded explicitly. Each eligible parent keeps only consented, available channels.",
    action: "Freeze audience snapshot",
  },
  APPROVAL_REQUIRED: {
    eyebrow: "Policy communication",
    title: "Content and audience need approval",
    detail: "The approver sees the exact draft revision, recipient snapshot, exclusions, and channel consequence before send.",
    action: "Approve this revision",
  },
  READY_TO_SEND: {
    eyebrow: "Approved and source-current",
    title: "Create the publication and outbox atomically",
    detail: "One acceptance creates a frozen campaign record, a separate family conversation per recipient, and named channel jobs.",
    action: "Accept send",
  },
  SEND_ACCEPTED: {
    eyebrow: "Publication accepted",
    title: "Delivery is pending, not complete",
    detail: "The message is durable, while web, push, SMS, and WhatsApp remain independent provider attempts.",
    action: "Record channel results",
  },
  PARTIAL_DELIVERY: {
    eyebrow: "One channel failed",
    title: "Retry only the failed delivery",
    detail: "Successful receipts stay final. Retrying does not duplicate the publication, family conversation, or successful channels.",
    action: "Retry failed channel",
  },
  DELIVERED: {
    eyebrow: "All channel attempts settled",
    title: "Delivery is proven independently from reading",
    detail: "The original content and audience remain immutable. A changed fact now requires a reasoned correction.",
    action: "Prepare correction",
  },
  RESPONSE_DUE: {
    eyebrow: "Reply required by 15:00",
    title: "Delivery and reading do not close the request",
    detail: "The follow-up stays open until the linked parent replies in their isolated family conversation.",
    action: "Record parent reply",
  },
  REPLIED: {
    eyebrow: "Reply receipt recorded",
    title: "The response obligation is resolved",
    detail: "The parent reply remains attached to one family conversation and cannot expose another broadcast recipient.",
    action: "Prepare correction",
  },
  CORRECTION_REVIEW: {
    eyebrow: "Original message retained",
    title: "Review the correction and its reason",
    detail: "Publishing appends a new message revision to the frozen audience and creates fresh channel obligations.",
    action: "Publish correction",
  },
  CORRECTED: {
    eyebrow: "Correction revision 1",
    title: "History and new delivery work are preserved",
    detail: "The original publication, replies, receipts, and recipient snapshot remain auditable beside the correction.",
    action: "Correction delivery pending",
  },
}

const parentContent: Record<
  CommunicationStatus,
  { eyebrow: string; title: string; detail: string; action: string }
> = {
  SOURCE_GAP: {
    eyebrow: "Linked family view",
    title: "No message is available yet",
    detail: "Only delivered messages for your linked child appear here.",
    action: "No parent action",
  },
  DRAFT: {
    eyebrow: "Linked family view",
    title: "No message is available yet",
    detail: "Staff drafts are never visible in the parent conversation.",
    action: "No parent action",
  },
  AUDIENCE_REVIEW: {
    eyebrow: "Linked family view",
    title: "No message is available yet",
    detail: "Audience preparation is private nursery work.",
    action: "No parent action",
  },
  APPROVAL_REQUIRED: {
    eyebrow: "Linked family view",
    title: "No message is available yet",
    detail: "Only an accepted publication can reach this conversation.",
    action: "No parent action",
  },
  READY_TO_SEND: {
    eyebrow: "Linked family view",
    title: "No message is available yet",
    detail: "The nursery has not published a message to your account.",
    action: "No parent action",
  },
  SEND_ACCEPTED: {
    eyebrow: "Delivery in progress",
    title: "Your message is being delivered",
    detail: "The parent conversation waits for its own delivery result.",
    action: "No parent action",
  },
  PARTIAL_DELIVERY: {
    eyebrow: "Delivery in progress",
    title: "Your message is still being delivered",
    detail: "Internal provider detail is not exposed here.",
    action: "No parent action",
  },
  DELIVERED: {
    eyebrow: "Delivered message",
    title: "A nursery message is available",
    detail: "This conversation contains only communication linked to Amelie.",
    action: "No parent action",
  },
  RESPONSE_DUE: {
    eyebrow: "Reply requested",
    title: "The nursery requested your reply",
    detail: "Reply here before the stated deadline.",
    action: "Reply to nursery",
  },
  REPLIED: {
    eyebrow: "Reply recorded",
    title: "Your reply is recorded",
    detail: "The conversation keeps the nursery message and your response together.",
    action: "No parent action",
  },
  CORRECTION_REVIEW: {
    eyebrow: "Delivered message",
    title: "The delivered message remains available",
    detail: "Unpublished correction work is not shown to parents.",
    action: "No parent action",
  },
  CORRECTED: {
    eyebrow: "Correction delivery pending",
    title: "The delivered message remains available",
    detail: "The correction appears here only after its own delivery succeeds.",
    action: "No parent action",
  },
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getLocationSnapshot() {
  return window.location.search
}

function parseStage(search: string): CommunicationFixtureStage {
  const value = new URLSearchParams(search).get("state")
  return stages.some((stage) => stage.value === value)
    ? (value as CommunicationFixtureStage)
    : "audience-review"
}

function parseRole(search: string): CommunicationRole {
  const value = new URLSearchParams(search).get("role")
  return value && value in roleLabels ? (value as CommunicationRole) : "manager"
}

function commandBase(
  session: CommunicationSession,
  id: string,
  role: CommunicationRole,
  actorOverride?: string,
): CommunicationCommand {
  const actorId =
    actorOverride ??
    (role === "manager"
      ? "manager-ava"
      : role === "practitioner"
        ? "practitioner-meadow"
        : "parent-amira")
  return {
    eventId: `${id}-${session.revision}`,
    idempotencyKey: `${id}-${session.revision}-once`,
    actorId,
    occurredAt: "2026-08-05T15:00:00.000Z",
    expectedRevision: session.revision,
    actorCapabilities: capabilitiesForCommunicationRole(
      actorId.startsWith("parent-") ? "parent" : role,
    ),
  }
}

function statusIcon(status: CommunicationStatus) {
  if (status === "CORRECTED" || status === "REPLIED" || status === "DELIVERED") {
    return <CheckCircle2 />
  }
  if (status === "SOURCE_GAP" || status === "APPROVAL_REQUIRED") return <ShieldCheck />
  if (status === "PARTIAL_DELIVERY") return <AlertTriangle />
  if (status === "RESPONSE_DUE") return <Clock3 />
  if (status === "SEND_ACCEPTED") return <CircleDashed />
  return <MailCheck />
}

function formatTime(value: string | undefined) {
  if (!value) return "Not recorded"
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value))
}

function updateLocation(next: { state?: string; role?: string }) {
  const params = new URLSearchParams(window.location.search)
  if (next.state) params.set("state", next.state)
  if (next.role) params.set("role", next.role)
  window.history.pushState({}, "", `${window.location.pathname}?${params}`)
  window.dispatchEvent(new PopStateEvent("popstate"))
}

export function CommunicationLab() {
  const search = useSyncExternalStore(subscribeToLocation, getLocationSnapshot, () => "")
  const stage = parseStage(search)
  const role = parseRole(search)
  const axeAudit = new URLSearchParams(search).get("audit") === "axe"
  return (
    <CommunicationScenario
      key={`${stage}:${role}:${axeAudit}`}
      stage={stage}
      initialRole={role}
      axeAudit={axeAudit}
    />
  )
}

function CommunicationScenario({
  stage,
  initialRole,
  axeAudit,
}: {
  stage: CommunicationFixtureStage
  initialRole: CommunicationRole
  axeAudit: boolean
}) {
  const [session, setSession] = useState(() => createCommunicationFixture(stage))
  const [role, setRole] = useState(initialRole)
  const [announcement, setAnnouncement] = useState("")
  const [error, setError] = useState("")
  const decisionHeadingRef = useRef<HTMLHeadingElement>(null)
  const principalId = role === "parent" ? "parent-amira" : `${role}-viewer`
  const projection = useMemo(
    () => projectCommunicationForRole(session, role, principalId),
    [principalId, role, session],
  )
  const status = deriveCommunicationStatus(session)
  const content =
    role === "parent"
      ? { ...statusContent[status], ...parentContent[status] }
      : statusContent[status]
  const draft = session.draftRevisions.find(
    (item) => item.revision === session.activeDraftRevision,
  )
  const audience = session.audienceSnapshots.find(
    (item) => item.revision === session.activeAudienceRevision,
  )
  const publication = session.publications.find(
    (item) => item.id === session.activePublicationId,
  )
  const canRunAction =
    role === "manager" || (role === "parent" && status === "RESPONSE_DUE")

  function focusDecision() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => decisionHeadingRef.current?.focus())
    })
  }

  function accept(next: CommunicationSession, message: string) {
    setSession(next)
    setError("")
    setAnnouncement(message)
    focusDecision()
  }

  function runAction() {
    try {
      if (status === "SOURCE_GAP") {
        accept(
          confirmCommunicationSources(session, {
            ...commandBase(session, "confirm-sources", role),
            sources: session.requiredSources.map((source) => ({ ...source })),
          }),
          "All communication sources confirmed. A versioned draft can now begin.",
        )
        return
      }
      if (status === "DRAFT") {
        accept(
          saveCommunicationDraft(session, {
            ...commandBase(session, "save-draft", role),
            subject: "Updated collection procedure",
            body: "Please review the updated collection procedure before Friday.",
            category: "POLICY",
            channels: ["PUSH", "SMS", "WHATSAPP"],
            requiresReply: false,
          }),
          "Draft revision one saved. No recipient or delivery row was created.",
        )
        return
      }
      if (status === "AUDIENCE_REVIEW") {
        accept(
          reviewCommunicationAudience(session, {
            ...commandBase(session, "review-audience", role),
            memberIds: ["member-amira", "member-omar", "member-lina", "member-sami"],
          }),
          "Two eligible parents frozen in the audience; two exclusions retained with reasons.",
        )
        return
      }
      if (status === "APPROVAL_REQUIRED") {
        accept(
          approveCommunication(session, commandBase(session, "approve", role)),
          "The exact draft and audience revisions were approved.",
        )
        return
      }
      if (status === "READY_TO_SEND") {
        accept(
          sendCommunication(session, commandBase(session, "send", role)),
          "Publication, two isolated family conversations, and channel jobs created atomically.",
        )
        return
      }
      if (status === "SEND_ACCEPTED") {
        const failedId = session.deliveries.find(
          (item) => item.recipientId === "parent-amira" && item.channel === "PUSH",
        )?.id
        accept(
          recordCommunicationDeliveryResults(session, {
            ...commandBase(session, "delivery-results", role),
            results: session.deliveries
              .filter(
                (item) =>
                  item.publicationId === session.activePublicationId &&
                  item.status === "PENDING" &&
                  item.correctionRevision === undefined,
              )
              .map((item) => ({
                recipientId: item.recipientId,
                channel: item.channel,
                status: item.id === failedId ? ("FAILED" as const) : ("DELIVERED" as const),
                errorCode: item.id === failedId ? "PROVIDER_TIMEOUT" : undefined,
              })),
          }),
          "Five channel receipts succeeded. Amira's push attempt failed without changing the publication.",
        )
        return
      }
      if (status === "PARTIAL_DELIVERY") {
        const failed = session.deliveries.filter((item) => item.status === "FAILED")
        let next = retryFailedCommunicationDelivery(session, {
          ...commandBase(session, "retry-failed", role),
          deliveryIds: failed.map((item) => item.id),
        })
        next = recordCommunicationDeliveryResults(next, {
          ...commandBase(next, "retry-result", role),
          results: failed.map((item) => ({
            recipientId: item.recipientId,
            channel: item.channel,
            status: "DELIVERED" as const,
          })),
        })
        accept(next, "Only the failed push job retried and received a successful second-attempt receipt.")
        return
      }
      if (status === "RESPONSE_DUE") {
        const conversation = session.conversations.find(
          (item) => item.parentAccountId === "parent-amira",
        )
        if (!conversation) throw new Error("The linked parent conversation is unavailable")
        accept(
          recordCommunicationReply(session, {
            ...commandBase(session, "parent-reply", role, "parent-amira"),
            conversationId: conversation.id,
            body: "Read and understood, thank you.",
          }),
          "The linked parent reply resolved its response obligation without touching another family.",
        )
        return
      }
      if (status === "DELIVERED" || status === "REPLIED") {
        accept(
          startCommunicationCorrection(session, {
            ...commandBase(session, "correction-draft", role),
            reason: "The session start time changed after publication.",
            body: "Correction: the Meadow room garden session starts at 15:30 today.",
          }),
          "Correction reason and replacement content saved beside the immutable original.",
        )
        return
      }
      if (status === "CORRECTION_REVIEW") {
        accept(
          publishCommunicationCorrection(
            session,
            commandBase(session, "publish-correction", role),
          ),
          "Correction appended to the original recipient conversations with new delivery jobs.",
        )
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The transition was rejected")
    }
  }

  return (
    <div
      className="communication-lab"
      data-axe-audit={axeAudit ? "axe" : undefined}
      data-role={role}
      data-status={status.toLowerCase()}
    >
      <header className="communication-topbar">
        <strong>Kiddz Online</strong>
        <span>Territory-neutral communication lifecycle</span>
        <div className="communication-topbar__controls">
          <label>
            <span>State</span>
            <select
              aria-label="Communication state"
              value={stage}
              onChange={(event) => updateLocation({ state: event.target.value })}
            >
              {stages.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select
              aria-label="Communication role"
              value={role}
              onChange={(event) => {
                const nextRole = event.target.value as CommunicationRole
                setRole(nextRole)
                updateLocation({ role: nextRole })
              }}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            aria-label="Reset communication scenario"
            title="Reset scenario"
            type="button"
            onClick={() => setSession(createCommunicationFixture(stage))}
          >
            <RefreshCw aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="communication-main">
        <section className="communication-heading" aria-labelledby="communication-title">
          <div>
            <span>Wave 4 · Family communication</span>
            <h1 id="communication-title">Accountable family communication</h1>
          </div>
          <p>
            Content, audience, conversation, delivery, reading, reply, and correction stay
            separate so a nursery never mistakes a row or provider attempt for handled work.
          </p>
        </section>

        {role === "parent" ? (
          <dl className="communication-context">
            <div><dt>Nursery</dt><dd>Riverside</dd></div>
            <div><dt>Child</dt><dd>Amelie</dd></div>
            <div><dt>Scope</dt><dd>Linked family</dd></div>
            <div><dt>Messages available</dt><dd>{projection.conversations[0]?.messages.length ?? 0}</dd></div>
            <div><dt>Reply requested</dt><dd>{projection.openFollowUpCount ? "Yes" : "No"}</dd></div>
          </dl>
        ) : (
          <dl className="communication-context">
            <div><dt>Branch</dt><dd>Riverside</dd></div>
            <div><dt>Role projection</dt><dd>{roleLabels[role]}</dd></div>
            <div><dt>Draft revision</dt><dd>{draft?.revision ?? "None"}</dd></div>
            <div><dt>Audience revision</dt><dd>{audience?.revision ?? "None"}</dd></div>
            <div><dt>Publication</dt><dd>{publication ? "Accepted" : "Not sent"}</dd></div>
          </dl>
        )}

        <section className={`communication-decision communication-decision--${status.toLowerCase()}`}>
          <div className="communication-decision__icon" aria-hidden="true">
            {statusIcon(status)}
          </div>
          <div className="communication-decision__copy">
            <span>{content.eyebrow}</span>
            <h2 ref={decisionHeadingRef} tabIndex={-1}>{content.title}</h2>
            <p>{content.detail}</p>
          </div>
          <div className="communication-decision__action">
            <button
              type="button"
              onClick={runAction}
              disabled={!canRunAction || status === "CORRECTED"}
            >
              {status === "PARTIAL_DELIVERY" ? <RefreshCw aria-hidden="true" /> :
                status === "RESPONSE_DUE" ? <MessageSquareReply aria-hidden="true" /> :
                  status === "CORRECTION_REVIEW" ? <MailCheck aria-hidden="true" /> :
                    <Send aria-hidden="true" />}
              {content.action}
            </button>
            <small>
              {canRunAction
                ? "Accepted transitions announce the result and return focus here."
                : "This role receives only the actions and records inside its assigned scope."}
            </small>
          </div>
        </section>

        {error ? (
          <p className="communication-error" role="alert">
            <AlertTriangle aria-hidden="true" /> {error}
          </p>
        ) : null}
        <p className="communication-announcer" aria-live="polite">{announcement}</p>

        {role === "parent" ? (
          <ParentConversation projection={projection} status={status} />
        ) : (
          <StaffWorkspace
            session={session}
            projection={projection}
            role={role}
            draft={draft}
            audience={audience}
          />
        )}
      </main>
      <CommunicationAxeHarness enabled={axeAudit} signature={`${stage}:${role}:${status}`} />
    </div>
  )
}

function StaffWorkspace({
  session,
  projection,
  role,
  draft,
  audience,
}: {
  session: CommunicationSession
  projection: ReturnType<typeof projectCommunicationForRole>
  role: Exclude<CommunicationRole, "parent">
  draft: CommunicationSession["draftRevisions"][number] | undefined
  audience: CommunicationSession["audienceSnapshots"][number] | undefined
}) {
  return (
    <>
      <section className="communication-content">
        <header>
          <div><span>Content and consequence</span><h2>Versioned draft</h2></div>
          <strong>{draft ? `Revision ${draft.revision}` : "No draft"}</strong>
        </header>
        {draft ? (
          <div className="communication-content__body">
            <div>
              <small>Subject</small>
              <strong>{draft.subject}</strong>
              <p>{draft.body}</p>
            </div>
            <dl>
              <div><dt>Category</dt><dd>{draft.category.toLowerCase()}</dd></div>
              <div><dt>Channels requested</dt><dd>{draft.channels.join(", ")}</dd></div>
              <div><dt>Reply required</dt><dd>{draft.requiresReply ? "Yes" : "No"}</dd></div>
              <div><dt>Approval</dt><dd>{session.approval?.status.toLowerCase() ?? "Not required"}</dd></div>
            </dl>
          </div>
        ) : (
          <div className="communication-empty"><MailCheck aria-hidden="true" /><p>No subject, body, channel, or recipient has been assumed.</p></div>
        )}
      </section>

      <section className="communication-audience">
        <header>
          <div><span>Frozen audience</span><h2>Recipient conversations</h2></div>
          <strong>{projection.recipientCount} eligible · {projection.exclusionCount} excluded</strong>
        </header>
        {role === "manager" && projection.recipientDetails?.length ? (
          <div className="communication-audience__table">
            <div className="communication-audience__row communication-audience__row--head">
              <span>Parent</span><span>Child</span><span>Eligible channels</span><span>Conversation</span>
            </div>
            {projection.recipientDetails.map((recipient) => {
              const conversation = projection.conversations.find(
                (item) => item.parentName === recipient.parentName,
              )
              return (
                <div className="communication-audience__row" key={recipient.parentName}>
                  <div><small>Parent</small><strong>{recipient.parentName}</strong></div>
                  <div><small>Child</small><strong>{recipient.childName}</strong></div>
                  <div><small>Channels</small><strong>{recipient.channels.join(" · ")}</strong></div>
                  <div><small>Conversation</small><strong>{conversation ? "Isolated" : "Created on send"}</strong></div>
                </div>
              )
            })}
          </div>
        ) : role === "practitioner" ? (
          <div className="communication-assigned">
            <LockKeyhole aria-hidden="true" />
            <p>Only Amelie’s assigned conversation is projected. Broadcast audience, exclusions, provider detail, and other families remain hidden.</p>
          </div>
        ) : (
          <div className="communication-empty"><UsersRound aria-hidden="true" /><p>Reviewing the source-linked audience creates recipient rows without sending.</p></div>
        )}
      </section>

      <div className="communication-lower-grid">
        <section className="communication-delivery">
          <header><div><span>Channel evidence</span><h2>Delivery ledger</h2></div><MailCheck aria-hidden="true" /></header>
          {role === "manager" && projection.deliveryDetails?.length ? (
            <ol>
              {projection.deliveryDetails.map((delivery) => (
                <li key={delivery.id} className={`is-${delivery.status.toLowerCase()}`}>
                  <span><strong>{delivery.channel}</strong><small>{delivery.recipientId}</small></span>
                  <span><strong>{delivery.status.toLowerCase()}</strong><small>Attempt {delivery.attempt}{delivery.errorCode ? ` · ${delivery.errorCode}` : ""}</small></span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="communication-empty communication-empty--small"><LockKeyhole aria-hidden="true" /><p>{role === "manager" ? "Channel jobs appear only after send acceptance." : "Provider and recipient delivery evidence is manager-only."}</p></div>
          )}
        </section>

        <section className="communication-obligations">
          <header><div><span>Handled state</span><h2>Reply obligations</h2></div><Clock3 aria-hidden="true" /></header>
          <dl>
            <div><dt>Open follow-ups</dt><dd>{projection.openFollowUpCount}</dd></div>
            <div><dt>Pending channels</dt><dd>{projection.pendingDeliveryCount}</dd></div>
            <div><dt>Failed channels</dt><dd>{projection.failedDeliveryCount}</dd></div>
            <div><dt>Delivered receipts</dt><dd>{projection.deliveredCount}</dd></div>
          </dl>
          <p className="communication-rule"><MessageSquareReply aria-hidden="true" /> Reading never resolves a requested reply. Delivery never proves reading.</p>
        </section>

        <section className="communication-history">
          <header><div><span>Append-only proof</span><h2>Recent history</h2></div><History aria-hidden="true" /></header>
          {role === "manager" && projection.auditEvents?.length ? (
            <ol>
              {projection.auditEvents.slice(-6).reverse().map((event) => (
                <li key={event.id}><strong>{event.type.replaceAll("_", " ").toLowerCase()}</strong><small>{event.detail} · rev {event.revision}</small></li>
              ))}
            </ol>
          ) : (
            <div className="communication-empty communication-empty--small"><Archive aria-hidden="true" /><p>Archive hides one principal’s view; it never deletes the shared conversation record.</p></div>
          )}
        </section>
      </div>

      {audience?.exclusions.length && role === "manager" ? (
        <p className="communication-exclusions">
          <ShieldCheck aria-hidden="true" /> Exclusions retained: {audience.exclusions.map((item) => item.reason.replaceAll("_", " ").toLowerCase()).join(" · ")}
        </p>
      ) : null}
    </>
  )
}

function ParentConversation({
  projection,
  status,
}: {
  projection: ReturnType<typeof projectCommunicationForRole>
  status: CommunicationStatus
}) {
  const conversation = projection.conversations[0]
  const visible = ["DELIVERED", "RESPONSE_DUE", "REPLIED", "CORRECTION_REVIEW", "CORRECTED"].includes(status)
  return (
    <section className="communication-parent">
      <header>
        <div><span>Amelie · Family conversation</span><h2>Nursery messages</h2></div>
        <strong>{visible && conversation ? `${conversation.messages.length} message${conversation.messages.length === 1 ? "" : "s"}` : "No delivered message"}</strong>
      </header>
      {visible && conversation ? (
        <div className="communication-parent__thread">
          {conversation.messages.map((message) => (
            <article key={message.id} className={`is-${message.senderType.toLowerCase()}`}>
              <span>{message.senderType === "PARENT" ? "You" : "Riverside Nursery"}</span>
              <p>{message.body}</p>
              <small>{formatTime(message.createdAt)}{message.correctionRevision ? ` · Correction ${message.correctionRevision}` : ""}</small>
            </article>
          ))}
          {projection.openFollowUpCount ? (
            <p className="communication-parent__due"><Clock3 aria-hidden="true" /> Reply requested by 15:00 tomorrow</p>
          ) : null}
        </div>
      ) : (
        <div className="communication-empty communication-empty--parent"><LockKeyhole aria-hidden="true" /><p>Drafts, audience work, other families, internal identifiers, provider errors, and staff audit history are not part of this projection.</p></div>
      )}
    </section>
  )
}
