"use client"

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileWarning,
  HeartPulse,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  UserCheck,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  acknowledgeIncidentAsParent,
  closeMedicalIncident,
  completeIncidentDraft,
  completeIncidentFollowUp,
  completeIncidentReview,
  correctMedicalIncident,
  createMedicalIncidentScenario,
  labelForObligation,
  projectMedicalIncident,
  recordParentDelivery,
  retryIncidentEvidence,
  submitMedicalIncident,
  type IncidentCapability,
  type IncidentFixtureStage,
  type IncidentObligation,
  type IncidentProjectionStatus,
  type MedicalIncident,
} from "@/lib/redesign-medical-incident-contracts"
import { IncidentAxeHarness } from "./incident-axe-harness"

type IncidentRole = "practitioner" | "manager" | "nurse" | "parent"

const stages: Array<{ value: IncidentFixtureStage; label: string }> = [
  { value: "draft-incomplete", label: "Draft / upload failed" },
  { value: "draft-ready", label: "Draft ready" },
  { value: "review-required", label: "Review required" },
  { value: "parent-delivery", label: "Ready to notify" },
  { value: "delivery-failed", label: "Delivery failed" },
  { value: "acknowledgment", label: "Awaiting acknowledgment" },
  { value: "follow-up", label: "Follow-up required" },
  { value: "ready-to-close", label: "Ready to close" },
  { value: "closed", label: "Closed" },
  { value: "correction-reopened", label: "Correction reopened" },
]

const roleCapabilities: Record<IncidentRole, IncidentCapability[]> = {
  practitioner: ["incident.draft", "incident.submit"],
  manager: ["incident.manager_review", "incident.notify_parent", "incident.close", "incident.correct"],
  nurse: ["incident.clinical_review", "incident.follow_up"],
  parent: ["incident.acknowledge_parent"],
}

const roleLabels: Record<IncidentRole, string> = {
  practitioner: "Room practitioner",
  manager: "Nursery manager",
  nurse: "Nurse",
  parent: "Alma's parent",
}

const statusContent: Record<IncidentProjectionStatus, { label: string; title: string; detail: string }> = {
  DRAFT_INCOMPLETE: {
    label: "Draft retained",
    title: "Evidence needs attention",
    detail: "The upload failed, but the incident facts are still saved and editable.",
  },
  DRAFT_READY: {
    label: "Draft complete",
    title: "Ready to submit",
    detail: "Required facts and evidence are available. Submission creates accountable review work.",
  },
  REVIEW_REQUIRED: {
    label: "Submitted",
    title: "Reviews are required",
    detail: "Manager and clinical review remain separate, named obligations.",
  },
  PARENT_DELIVERY_PENDING: {
    label: "Reviews complete",
    title: "Parent update is ready",
    detail: "Sending will create a delivery receipt; it will not count as acknowledgment.",
  },
  DELIVERY_FAILED: {
    label: "Retry required",
    title: "Parent delivery failed",
    detail: "The source record remains submitted and owned retry work stays open.",
  },
  ACKNOWLEDGMENT_PENDING: {
    label: "Delivered",
    title: "Awaiting parent acknowledgment",
    detail: "The delivery receipt exists. The family has not yet confirmed receipt.",
  },
  FOLLOW_UP_REQUIRED: {
    label: "Parent acknowledged",
    title: "Clinical follow-up remains",
    detail: "A named clinical owner must complete the final observation.",
  },
  READY_TO_CLOSE: {
    label: "All obligations complete",
    title: "Ready to close",
    detail: "Closure will revalidate the source revision and every obligation receipt.",
  },
  CLOSED: {
    label: "Closed with evidence",
    title: "Incident handled",
    detail: "The complete record, receipts, actors, and correction path remain available.",
  },
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getLocationSnapshot() {
  return window.location.search
}

function parseStage(search: string): IncidentFixtureStage {
  const requested = new URLSearchParams(search).get("state")
  return stages.some((stage) => stage.value === requested)
    ? (requested as IncidentFixtureStage)
    : "draft-incomplete"
}

function parseRole(search: string): IncidentRole {
  const requested = new URLSearchParams(search).get("role")
  return requested && requested in roleCapabilities ? (requested as IncidentRole) : "manager"
}

function stateLabel(obligation: IncidentObligation) {
  if (obligation.state === "SATISFIED") return "Complete"
  if (obligation.state === "FAILED") return "Retry needed"
  if (obligation.state === "BLOCKED") return "Waiting"
  return "Open"
}

function roleCanAct(role: IncidentRole, obligation: IncidentObligation) {
  const capability: Record<IncidentObligation["kind"], IncidentCapability> = {
    MANAGER_REVIEW: "incident.manager_review",
    CLINICAL_REVIEW: "incident.clinical_review",
    PARENT_DELIVERY: "incident.notify_parent",
    PARENT_ACKNOWLEDGMENT: "incident.acknowledge_parent",
    FOLLOW_UP: "incident.follow_up",
  }
  return roleCapabilities[role].includes(capability[obligation.kind])
}

function commandBase(incident: MedicalIncident, id: string, role: IncidentRole) {
  const actorId: Record<IncidentRole, string> = {
    practitioner: "staff-lina",
    manager: "manager-maya",
    nurse: "nurse-ines",
    parent: "parent-alma",
  }
  return {
    eventId: `${id}-${incident.revision}`,
    idempotencyKey: `${id}-${incident.revision}-once`,
    actorId: actorId[role],
    occurredAt: "2026-07-14T10:42:00+01:00",
    expectedRevision: incident.revision,
    actorCapabilities: roleCapabilities[role],
  }
}

export function IncidentLab() {
  const locationSearch = useSyncExternalStore(subscribeToLocation, getLocationSnapshot, () => "")
  const queryStage = parseStage(locationSearch)
  const queryRole = parseRole(locationSearch)
  const axeAudit = new URLSearchParams(locationSearch).get("audit") === "axe"

  return (
    <IncidentScenario
      key={`${queryStage}:${queryRole}:${axeAudit ? "axe" : "off"}`}
      axeAudit={axeAudit}
      queryRole={queryRole}
      queryStage={queryStage}
    />
  )
}

function IncidentScenario({
  axeAudit,
  queryRole,
  queryStage,
}: {
  axeAudit: boolean
  queryRole: IncidentRole
  queryStage: IncidentFixtureStage
}) {
  const [incident, setIncident] = useState(() => createMedicalIncidentScenario(queryStage))
  const [role, setRole] = useState<IncidentRole>(queryRole)
  const [announcement, setAnnouncement] = useState("")
  const [error, setError] = useState("")
  const actionHeadingRef = useRef<HTMLHeadingElement>(null)

  const projection = useMemo(() => projectMedicalIncident(incident), [incident])
  const status = statusContent[projection.status]
  const isParent = role === "parent"
  const parentPublished = incident.obligations.some(
    (item) => item.kind === "PARENT_DELIVERY" && item.state === "SATISFIED",
  )
  const actionableObligation = projection.openObligations.find(
    (item) => item.state !== "BLOCKED" && roleCanAct(role, item),
  )

  function focusAction() {
    window.requestAnimationFrame(() => actionHeadingRef.current?.focus())
  }

  function accept(next: MedicalIncident, message: string) {
    setIncident(next)
    setAnnouncement(message)
    setError("")
    focusAction()
  }

  function runAction() {
    try {
      if (projection.status === "DRAFT_INCOMPLETE" && role === "practitioner") {
        let next = completeIncidentDraft(incident, {
          ...commandBase(incident, "complete-witness", role),
          witnessNotes: "Observed Alma step backward onto water beside the table.",
        })
        next = retryIncidentEvidence(next, {
          ...commandBase(next, "retry-evidence", role),
          evidenceId: "evidence-photo-1",
        })
        accept(next, "Witness account and evidence are available. The draft is ready to submit.")
        return
      }
      if (projection.status === "DRAFT_READY" && role === "practitioner") {
        accept(
          submitMedicalIncident(incident, commandBase(incident, "submit", role)),
          "Incident submitted. Manager and clinical reviews are now independently owned.",
        )
        return
      }
      if (projection.status === "REVIEW_REQUIRED" && actionableObligation) {
        accept(
          completeIncidentReview(incident, {
            ...commandBase(incident, `review-${actionableObligation.kind.toLowerCase()}`, role),
            obligationId: actionableObligation.id,
            expectedObligationRevision: actionableObligation.sourceRevision,
          }),
          `${labelForObligation(actionableObligation.kind)} completed.`,
        )
        return
      }
      if (
        (projection.status === "PARENT_DELIVERY_PENDING" || projection.status === "DELIVERY_FAILED") &&
        actionableObligation
      ) {
        accept(
          recordParentDelivery(incident, {
            ...commandBase(incident, "deliver-parent-update", role),
            obligationId: actionableObligation.id,
            expectedObligationRevision: actionableObligation.sourceRevision,
            outcome: "DELIVERED",
            providerReceiptId: `push-receipt-${incident.revision + 1}`,
          }),
          "Parent update delivered with a provider receipt. Acknowledgment remains open.",
        )
        return
      }
      if (projection.status === "ACKNOWLEDGMENT_PENDING" && actionableObligation) {
        accept(
          acknowledgeIncidentAsParent(incident, {
            ...commandBase(incident, "parent-acknowledgment", role),
            obligationId: actionableObligation.id,
            expectedObligationRevision: actionableObligation.sourceRevision,
          }),
          "Parent acknowledgment recorded separately from delivery.",
        )
        return
      }
      if (projection.status === "FOLLOW_UP_REQUIRED" && actionableObligation) {
        accept(
          completeIncidentFollowUp(incident, {
            ...commandBase(incident, "clinical-follow-up", role),
            obligationId: actionableObligation.id,
            expectedObligationRevision: actionableObligation.sourceRevision,
          }),
          "Clinical follow-up completed. The incident is ready for closure preflight.",
        )
        return
      }
      if (projection.status === "READY_TO_CLOSE" && role === "manager") {
        accept(
          closeMedicalIncident(incident, {
            ...commandBase(incident, "close", role),
            expectedObligationRevisions: Object.fromEntries(
              incident.obligations.map((item) => [item.id, item.sourceRevision]),
            ),
          }),
          "Incident closed from fresh source and obligation revisions.",
        )
        return
      }
      if (projection.status === "CLOSED" && role === "manager") {
        accept(
          correctMedicalIncident(incident, {
            ...commandBase(incident, "correct", role),
            reason: "Witness clarified the source of the spill.",
            correctedCause: "Slipped on water from a tipped jug beside the water-play table",
            reopen: [
              "MANAGER_REVIEW",
              "PARENT_DELIVERY",
              "PARENT_ACKNOWLEDGMENT",
              "FOLLOW_UP",
            ],
          }),
          "Correction appended. Required review, parent update, acknowledgment, and follow-up reopened.",
        )
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The transition could not be accepted.")
    }
  }

  function simulateDeliveryFailure() {
    const delivery = projection.openObligations.find(
      (item) => item.kind === "PARENT_DELIVERY" && item.state === "OPEN",
    )
    if (!delivery || role !== "manager") return
    try {
      accept(
        recordParentDelivery(incident, {
          ...commandBase(incident, "fail-parent-delivery", role),
          obligationId: delivery.id,
          expectedObligationRevision: delivery.sourceRevision,
          outcome: "FAILED",
          failureReason: "Push provider timed out",
        }),
        "Delivery failed. Retry work is open and the submitted incident remains intact.",
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The failure could not be recorded.")
    }
  }

  function resetScenario() {
    setIncident(createMedicalIncidentScenario(queryStage))
    setError("")
    setAnnouncement("Scenario reset to its source fixture.")
    focusAction()
  }

  const primaryLabel = (() => {
    if (projection.status === "DRAFT_INCOMPLETE") return "Restore evidence and finish draft"
    if (projection.status === "DRAFT_READY") return "Submit incident"
    if (projection.status === "REVIEW_REQUIRED" && actionableObligation) {
      return `Complete ${labelForObligation(actionableObligation.kind).toLowerCase()}`
    }
    if (projection.status === "PARENT_DELIVERY_PENDING") return "Deliver parent update"
    if (projection.status === "DELIVERY_FAILED") return "Retry parent delivery"
    if (projection.status === "ACKNOWLEDGMENT_PENDING") return "Acknowledge receipt"
    if (projection.status === "FOLLOW_UP_REQUIRED") return "Complete follow-up"
    if (projection.status === "READY_TO_CLOSE") return "Close incident"
    if (projection.status === "CLOSED") return "Record a correction"
    return "No action for this role"
  })()

  const canRun =
    (projection.status === "DRAFT_INCOMPLETE" && role === "practitioner") ||
    (projection.status === "DRAFT_READY" && role === "practitioner") ||
    Boolean(actionableObligation) ||
    (projection.status === "READY_TO_CLOSE" && role === "manager") ||
    (projection.status === "CLOSED" && role === "manager")

  return (
    <div className="incident-lab" data-axe-audit={axeAudit ? "axe" : "off"} data-status={projection.status}>
      <IncidentAxeHarness
        enabled={axeAudit}
        signature={`incident:${queryStage}:${role}:${projection.status}:${incident.revision}`}
      />
      <header className="incident-topbar">
        <strong>Kiddz Online</strong>
        <span>Safety record / Riverside / Meadow</span>
        <div className="incident-topbar__controls">
          <label>
            <span>Scenario</span>
            <select
              aria-label="Incident test scenario"
              value={queryStage}
              onChange={(event) => {
                const url = new URL(window.location.href)
                url.searchParams.set("state", event.target.value)
                window.history.pushState({}, "", url)
                window.dispatchEvent(new PopStateEvent("popstate"))
              }}
            >
              {stages.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
            </select>
          </label>
          <label>
            <span>Role</span>
            <select
              aria-label="Incident viewer role"
              value={role}
              onChange={(event) => setRole(event.target.value as IncidentRole)}
            >
              {(Object.keys(roleLabels) as IncidentRole[]).map((item) => (
                <option key={item} value={item}>{roleLabels[item]}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={resetScenario} title="Reset incident scenario" aria-label="Reset incident scenario">
            <RefreshCw aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="incident-main">
        <header className="incident-heading">
          <div><span>Accountable safety lifecycle</span><h1>One incident. Every obligation visible.</h1></div>
          <p>Keep the source record, reviews, family delivery, acknowledgment, follow-up, closure, and correction causally connected without pretending they are the same event.</p>
        </header>

        <dl className="incident-context" aria-label="Incident context">
          <div><dt>Child</dt><dd>Alma Rahal</dd></div>
          <div><dt>Room</dt><dd>Meadow</dd></div>
          <div><dt>Occurred</dt><dd>14 Jul / 10:24</dd></div>
          <div><dt>Source revision</dt><dd>{incident.revision}</dd></div>
        </dl>

        {isParent ? (
          <section className="incident-parent" aria-labelledby="incident-parent-title">
            {parentPublished ? (
              <>
                <div className="incident-parent__mark" aria-hidden="true"><HeartPulse /></div>
                <span>Family update</span>
                <h2 id="incident-parent-title" ref={actionHeadingRef} tabIndex={-1}>Alma received care after a minor slip.</h2>
                <p>A cold pack was applied for ten minutes. Alma returned to calm activity and the nursery will continue to observe her this afternoon.</p>
                <dl><div><dt>Sent</dt><dd>Today, 10:42</dd></div><div><dt>Nursery</dt><dd>Riverside</dd></div></dl>
                {projection.status === "ACKNOWLEDGMENT_PENDING" ? (
                  <button type="button" onClick={runAction}>Acknowledge receipt<Check aria-hidden="true" /></button>
                ) : (
                  <div className="incident-parent__receipt"><CheckCircle2 aria-hidden="true" /><span><strong>Receipt acknowledged</strong><small>The nursery can see that you received this update.</small></span></div>
                )}
              </>
            ) : (
              <>
                <div className="incident-parent__mark" aria-hidden="true"><Clock3 /></div>
                <span>Family update</span>
                <h2 id="incident-parent-title" ref={actionHeadingRef} tabIndex={-1}>No update has been published.</h2>
                <p>Internal drafts, evidence, review notes, provider errors, and staff work remain hidden until the nursery delivers a parent-safe record.</p>
              </>
            )}
          </section>
        ) : (
          <>
            <section className="incident-summary" aria-labelledby="incident-summary-title">
              <div className="incident-summary__icon" aria-hidden="true">
                {projection.status === "CLOSED" ? <ShieldCheck /> : projection.status === "DELIVERY_FAILED" || projection.status === "DRAFT_INCOMPLETE" ? <AlertTriangle /> : <HeartPulse />}
              </div>
              <div><span>{status.label}</span><h2 id="incident-summary-title">{status.title}</h2><p>{status.detail}</p></div>
              <dl>
                <div><dt>Complete</dt><dd>{projection.satisfiedCount}</dd></div>
                <div><dt>Open</dt><dd>{projection.openObligations.length}</dd></div>
                <div><dt>Events</dt><dd>{incident.events.length}</dd></div>
              </dl>
            </section>

            <div className="incident-grid">
              <div className="incident-source-plane">
                <section className="incident-record" aria-labelledby="incident-record-title">
                  <header><div><span>Submitted facts</span><h2 id="incident-record-title">What happened and what care was given</h2></div><span>Policy v{incident.policy.version}</span></header>
                  <dl>
                    <div><dt>Cause</dt><dd>{incident.facts.cause}</dd></div>
                    <div><dt>Location</dt><dd>{incident.facts.location}</dd></div>
                    <div><dt>First aid</dt><dd>{incident.facts.firstAid}</dd></div>
                    <div><dt>Witness account</dt><dd>{incident.facts.witnessNotes || "Required before submission"}</dd></div>
                  </dl>
                  <div className="incident-evidence">
                    {incident.evidence.map((item) => (
                      <div data-state={item.state} key={item.id}>
                        {item.state === "AVAILABLE" ? <FileCheck2 aria-hidden="true" /> : <FileWarning aria-hidden="true" />}
                        <span><strong>{item.filename}</strong><small>{item.state === "AVAILABLE" ? `Available / ${item.attemptCount} attempts` : item.failureReason}</small></span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="incident-obligations" aria-labelledby="incident-obligations-title">
                  <header><div><span>Current obligation cycle</span><h2 id="incident-obligations-title">What still has to happen</h2></div><span>{projection.openObligations.length} open</span></header>
                  {projection.currentObligations.length ? (
                    <div>
                      {projection.currentObligations.map((obligation) => (
                        <article data-state={obligation.state} key={obligation.id}>
                          <div className="incident-obligation__mark" aria-hidden="true">
                            {obligation.state === "SATISFIED" ? <Check /> : obligation.kind === "PARENT_DELIVERY" ? <Send /> : obligation.kind === "FOLLOW_UP" ? <HeartPulse /> : <UserCheck />}
                          </div>
                          <div><span>{obligation.kind.toLowerCase().replaceAll("_", " ")}</span><h3>{labelForObligation(obligation.kind)}</h3><p>Owned by {obligation.ownerId.replaceAll("-", " ")} / due {obligation.dueAt.slice(11, 16)}</p><small>Source revision {obligation.sourceRevision}{obligation.receipt?.providerReceiptId ? " / provider receipt retained" : ""}{obligation.failure ? ` / ${obligation.failure.retryWorkItemId}` : ""}</small></div>
                          <span className="incident-obligation__state">{stateLabel(obligation)}</span>
                        </article>
                      ))}
                    </div>
                  ) : <p className="incident-empty">Submission will create policy-required obligations.</p>}
                </section>

                <section className="incident-history" aria-labelledby="incident-history-title">
                  <header><span>Append-only history</span><h2 id="incident-history-title">{incident.events.length} accepted events</h2></header>
                  {incident.events.length ? (
                    <ol>{incident.events.map((event) => <li key={event.eventId}><span>{event.occurredAt.slice(11, 16)}</span><div><strong>{event.kind.toLowerCase().replaceAll("_", " ")}</strong><p>{event.detail}</p><small>Revision {event.resultingRevision} / {event.actorId}</small></div></li>)}</ol>
                  ) : <p>No transition has been accepted yet. Draft facts are retained separately.</p>}
                </section>
              </div>

              <aside className="incident-action" aria-labelledby="incident-action-title">
                <header><span>Next action for {roleLabels[role]}</span><h2 id="incident-action-title" ref={actionHeadingRef} tabIndex={-1}>{canRun ? primaryLabel : "No permitted action in this state"}</h2></header>
                <div className="incident-action__source">
                  <span>{projection.status.toLowerCase().replaceAll("_", " ")}</span>
                  <strong>{actionableObligation ? labelForObligation(actionableObligation.kind) : status.title}</strong>
                  <p>{canRun ? status.detail : `This work belongs to another role. ${roleLabels[role]} can inspect the permitted record without inheriting its authority.`}</p>
                  <small>Expected incident revision {incident.revision}</small>
                </div>
                {error ? <p className="incident-error" role="alert">{error}</p> : null}
                <button className="incident-primary" type="button" disabled={!canRun} onClick={runAction}>{primaryLabel}<ArrowRight aria-hidden="true" /></button>
                {projection.status === "PARENT_DELIVERY_PENDING" && role === "manager" ? (
                  <button className="incident-secondary" type="button" onClick={simulateDeliveryFailure}><RotateCcw aria-hidden="true" />Simulate provider failure</button>
                ) : null}
                <div className="incident-action__rules">
                  <strong>Transition guard</strong>
                  <ul><li>Capability and concrete source scope</li><li>Expected incident and obligation revisions</li><li>Idempotency key, actor, and timestamp</li></ul>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <p className="incident-announcement" aria-live="polite">{announcement}</p>
    </div>
  )
}
