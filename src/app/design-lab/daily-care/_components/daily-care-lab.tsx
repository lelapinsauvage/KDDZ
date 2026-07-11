"use client"

import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  FileCheck2,
  FileClock,
  History,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  applySharedCareObservation,
  attemptDailyCareDelivery,
  capabilitiesForDailyCareRole,
  confirmDailyCareSources,
  createDailyCareFixture,
  deriveDailyCareStatus,
  prepareSharedCareObservation,
  projectDailyCareForRole,
  publishDailyCareCorrection,
  recordCareException,
  recordDailyCareSyncConflict,
  refreshDailyCareSources,
  resolveDailyCareSyncConflict,
  saveDailyCareDrafts,
  startDailyCareCorrection,
  submitDailyCareReports,
  type CareObservation,
  type DailyCareFixtureStage,
  type DailyCareRole,
  type DailyCareSession,
  type DailyCareStatus,
} from "@/lib/redesign-daily-care-contracts"
import { DailyCareAxeHarness } from "./daily-care-axe-harness"

const stages: Array<{ value: DailyCareFixtureStage; label: string }> = [
  { value: "source-gap", label: "Source gap" },
  { value: "empty-capture", label: "Empty capture" },
  { value: "shared-review", label: "Shared review" },
  { value: "exception-review", label: "Exception review" },
  { value: "draft-saved", label: "Draft saved" },
  { value: "sync-conflict", label: "Sync conflict" },
  { value: "submission-blocked", label: "Submission blocked" },
  { value: "submitted", label: "Submitted" },
  { value: "delivery-failed", label: "Delivery failed" },
  { value: "delivered", label: "Delivered" },
  { value: "correction-review", label: "Correction review" },
  { value: "corrected", label: "Corrected" },
]

const roleLabels: Record<DailyCareRole, string> = {
  manager: "Nursery manager",
  practitioner: "Room practitioner",
  parent: "Linked parent",
}

const statusContent: Record<
  DailyCareStatus,
  { eyebrow: string; title: string; detail: string; action: string }
> = {
  SOURCE_GAP: {
    eyebrow: "Capture withheld",
    title: "Attendance source is missing",
    detail: "A room roster cannot prove who was present. Care capture waits for the canonical attendance revision.",
    action: "Confirm source set",
  },
  EMPTY_CAPTURE: {
    eyebrow: "Nothing has been assumed",
    title: "Begin from observed facts",
    detail: "Meal, mood, sleep, symptom, and health values remain unset until a practitioner records them.",
    action: "Prepare shared observation",
  },
  SHARED_REVIEW: {
    eyebrow: "Three present children selected",
    title: "Review who will inherit each value",
    detail: "Absent and unknown children are excluded. Shared values keep their group source after application.",
    action: "Apply to selected children",
  },
  EXCEPTION_REVIEW: {
    eyebrow: "Shared facts applied",
    title: "Record the child exception",
    detail: "One lunch observation differs. Changing it will preserve every unrelated shared fact.",
    action: "Save exception as drafts",
  },
  DRAFT_SAVED: {
    eyebrow: "Versioned server drafts",
    title: "Three drafts are complete",
    detail: "Drafts are resumable but are not submitted, delivered, or counted as completed parent communication.",
    action: "Check cross-device edit",
  },
  SYNC_CONFLICT: {
    eyebrow: "Server revision 2 · local base 1",
    title: "Two mood observations conflict",
    detail: "The server and local facts remain visible. Merge one field without overwriting meals or provenance.",
    action: "Keep local fact and revalidate",
  },
  SUBMISSION_BLOCKED: {
    eyebrow: "Attendance advanced to revision 8",
    title: "Submission needs fresh sources",
    detail: "The draft merge is retained, but no report can submit until the complete source set is refreshed.",
    action: "Refresh source set",
  },
  SUBMITTED: {
    eyebrow: "Three reports accepted atomically",
    title: "Parent delivery is still pending",
    detail: "Submission and communication are separate. Each report now has a named retryable delivery job.",
    action: "Attempt parent delivery",
  },
  DELIVERY_FAILED: {
    eyebrow: "Provider unavailable",
    title: "Reports are safe; delivery failed",
    detail: "Submitted revisions remain immutable and visible to staff. Parent publication stays withheld until retry succeeds.",
    action: "Retry delivery",
  },
  DELIVERED: {
    eyebrow: "Three delivery receipts",
    title: "Parents received the submitted reports",
    detail: "The delivered revision and timestamp are durable. A factual mistake now requires an append-only correction.",
    action: "Start correction review",
  },
  CORRECTION_REVIEW: {
    eyebrow: "Original revision retained",
    title: "Review the corrected lunch observation",
    detail: "The reason and changed field are explicit. Publishing creates a new revision and a separate delivery job.",
    action: "Publish correction",
  },
  CORRECTED: {
    eyebrow: "New revision accepted",
    title: "Correction history is preserved",
    detail: "The previous delivered report remains auditable. The corrected revision has its own pending delivery receipt.",
    action: "Correction delivery pending",
  },
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getLocationSnapshot() {
  return window.location.search
}

function parseStage(search: string): DailyCareFixtureStage {
  const value = new URLSearchParams(search).get("state")
  return stages.some((stage) => stage.value === value)
    ? (value as DailyCareFixtureStage)
    : "exception-review"
}

function parseRole(search: string): DailyCareRole {
  const value = new URLSearchParams(search).get("role")
  return value && value in roleLabels ? (value as DailyCareRole) : "manager"
}

function commandBase(session: DailyCareSession, id: string, role: DailyCareRole) {
  return {
    eventId: `${id}-${session.revision}`,
    idempotencyKey: `${id}-${session.revision}-once`,
    actorId:
      role === "manager"
        ? "manager-river"
        : role === "practitioner"
          ? "practitioner-jules"
          : "parent-amelie",
    occurredAt: "2026-08-05T16:00:00.000Z",
    expectedRevision: session.revision,
    actorCapabilities: capabilitiesForDailyCareRole(role),
  }
}

function conflictObservation(id: string, value: string, sourceRevision: number): CareObservation {
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

function statusIcon(status: DailyCareStatus) {
  if (status === "DELIVERED" || status === "CORRECTED") return <CheckCircle2 />
  if (status === "SOURCE_GAP" || status === "SUBMISSION_BLOCKED") return <ShieldCheck />
  if (status === "DELIVERY_FAILED" || status === "SYNC_CONFLICT") return <CloudOff />
  if (status === "DRAFT_SAVED" || status === "SUBMITTED") return <FileCheck2 />
  if (status === "SHARED_REVIEW" || status === "EXCEPTION_REVIEW") return <UsersRound />
  return <Sparkles />
}

function latestObservation(session: DailyCareSession, childId: string, fieldId: string) {
  const report = session.reports.find((entry) => entry.childId === childId)
  const reportObservations = report?.revisions.find(
    (revision) => revision.revision === report.currentRevision,
  )?.observations
  return (reportObservations ?? session.observations)
    .filter((entry) => entry.childId === childId && entry.fieldId === fieldId)
    .sort((first, second) => second.sourceRevision - first.sourceRevision)[0]
}

export function DailyCareLab() {
  const search = useSyncExternalStore(subscribeToLocation, getLocationSnapshot, () => "")
  const stage = parseStage(search)
  const role = parseRole(search)
  const axeAudit = new URLSearchParams(search).get("audit") === "axe"
  return (
    <DailyCareScenario
      key={`${stage}:${role}:${axeAudit}`}
      stage={stage}
      initialRole={role}
      axeAudit={axeAudit}
    />
  )
}

function DailyCareScenario({
  stage,
  initialRole,
  axeAudit,
}: {
  stage: DailyCareFixtureStage
  initialRole: DailyCareRole
  axeAudit: boolean
}) {
  const [session, setSession] = useState(() => createDailyCareFixture(stage))
  const [role, setRole] = useState(initialRole)
  const [announcement, setAnnouncement] = useState("")
  const [error, setError] = useState("")
  const decisionHeadingRef = useRef<HTMLHeadingElement>(null)
  const projection = useMemo(() => projectDailyCareForRole(session, role), [session, role])
  const status = deriveDailyCareStatus(session)
  const baseContent = statusContent[status]
  const conflictResolved = session.events.some((event) => event.kind === "DRAFT_CONFLICT_RESOLVED")
  const parentHasPublication = projection.publications.length > 0
  const content = role === "parent"
    ? {
        eyebrow: "Linked child view",
        title: parentHasPublication ? "A delivered daily report is available" : "No delivered report yet",
        detail: parentHasPublication
          ? "Only the latest successfully delivered revision is shown here. Staff drafts and delivery operations stay private."
          : "Draft, submission, source, conflict, and failed-delivery work remains private until a report is successfully delivered.",
        action: "Read-only parent view",
      }
    : status === "DRAFT_SAVED" && conflictResolved
      ? { ...baseContent, eyebrow: "Sources revalidated", title: "Three drafts are ready to submit", action: "Submit selected reports" }
      : baseContent
  const canAct = role !== "parent" && status !== "CORRECTED"

  function focusDecision() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => decisionHeadingRef.current?.focus())
    })
  }

  function accept(next: DailyCareSession, message: string) {
    setSession(next)
    setError("")
    setAnnouncement(message)
    focusDecision()
  }

  function runAction() {
    try {
      if (status === "SOURCE_GAP") {
        accept(
          confirmDailyCareSources(session, {
            ...commandBase(session, "confirm-sources", role),
            sources: [{ sourceId: "attendance-stream", revision: 7 }],
          }),
          "All four care sources confirmed. Capture remains empty until observation begins.",
        )
        return
      }
      if (status === "EMPTY_CAPTURE") {
        accept(
          prepareSharedCareObservation(session, {
            ...commandBase(session, "prepare-shared", role),
            selectedChildIds: ["child-amelie", "child-noah", "child-lina"],
            values: {
              breakfastPortion: "HALF",
              lunchPortion: "MOST",
              mood: "CALM",
              symptoms: "NONE_OBSERVED",
            },
          }),
          "Shared facts prepared for three confirmed-present children. Nothing has been applied yet.",
        )
        return
      }
      if (status === "SHARED_REVIEW") {
        accept(
          applySharedCareObservation(session, {
            ...commandBase(session, "apply-shared", role),
            sharedObservationId: session.pendingShared!.id,
          }),
          "Shared observations applied with provenance. Absent and unknown children remain untouched.",
        )
        return
      }
      if (status === "EXCEPTION_REVIEW") {
        const withException = recordCareException(session, {
          ...commandBase(session, "record-exception", role),
          childId: "child-noah",
          fieldId: "lunchPortion",
          value: "LITTLE",
        })
        accept(
          saveDailyCareDrafts(withException, commandBase(withException, "save-drafts", role)),
          "Lunch exception recorded. Three versioned drafts saved atomically.",
        )
        return
      }
      if (status === "DRAFT_SAVED" && !conflictResolved) {
        accept(
          recordDailyCareSyncConflict(session, {
            ...commandBase(session, "record-conflict", role),
            reportId: "report-child-noah",
            serverObservation: conflictObservation("server-mood", "CALM", 9),
            localObservation: conflictObservation("local-mood", "FUSSY", 10),
            changedSource: { sourceId: "attendance-stream", revision: 8 },
          }),
          "A cross-device mood conflict was detected. Both versions remain available.",
        )
        return
      }
      if (status === "SYNC_CONFLICT") {
        accept(
          resolveDailyCareSyncConflict(session, {
            ...commandBase(session, "resolve-conflict", role),
            conflictId: session.conflicts.find((entry) => entry.status === "OPEN")!.id,
            resolution: "LOCAL",
          }),
          "Local mood retained as a new draft revision. Attendance changed, so submission is paused.",
        )
        return
      }
      if (status === "SUBMISSION_BLOCKED") {
        accept(
          refreshDailyCareSources(session, {
            ...commandBase(session, "refresh-sources", role),
            sources: [
              { sourceId: "room-roster", revision: 6 },
              { sourceId: "attendance-stream", revision: 8 },
              { sourceId: "care-policy", revision: 4 },
              { sourceId: "approval-policy", revision: 3 },
            ],
          }),
          "All sources refreshed without omission or regression. Three drafts are ready to submit.",
        )
        return
      }
      if (status === "DRAFT_SAVED" && conflictResolved) {
        accept(
          submitDailyCareReports(session, {
            ...commandBase(session, "submit-reports", role),
            reportIds: session.reports.map((report) => report.id),
          }),
          "Three complete reports submitted atomically. Three parent deliveries are pending.",
        )
        return
      }
      if (status === "SUBMITTED") {
        accept(
          attemptDailyCareDelivery(session, {
            ...commandBase(session, "delivery-failed", role),
            succeed: false,
            errorCode: "PROVIDER_UNAVAILABLE",
          }),
          "Parent delivery failed. Submitted reports remain safe and retryable.",
        )
        return
      }
      if (status === "DELIVERY_FAILED") {
        accept(
          attemptDailyCareDelivery(session, {
            ...commandBase(session, "delivery-retry", role),
            succeed: true,
          }),
          "Three delivery receipts confirmed. Linked parents can now read their report revision.",
        )
        return
      }
      if (status === "DELIVERED") {
        accept(
          startDailyCareCorrection(session, {
            ...commandBase(session, "start-correction", role),
            reportId: "report-child-noah",
            reason: "Lunch portion was confirmed as half after handover review",
            fieldId: "lunchPortion",
            value: "HALF",
          }),
          "Correction opened against the delivered revision. The original remains unchanged.",
        )
        return
      }
      if (status === "CORRECTION_REVIEW") {
        accept(
          publishDailyCareCorrection(session, {
            ...commandBase(session, "publish-correction", role),
            correctionId: session.corrections.find((entry) => entry.status === "OPEN")!.id,
          }),
          "Correction appended as a new revision. Its parent delivery remains independently pending.",
        )
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Daily care action failed"
      setError(message)
      setAnnouncement(message)
    }
  }

  function reset() {
    setSession(createDailyCareFixture(stage))
    setError("")
    setAnnouncement("Scenario reset")
  }

  return (
    <div className="daily-care-lab" data-axe-audit={axeAudit ? "axe" : "off"}>
      <DailyCareAxeHarness
        enabled={axeAudit}
        signature={`${stage}:${role}:${status}:${session.revision}`}
      />
      <header className="care-topbar">
        <strong>Kiddz Online · daily care contract</strong>
        <span>Territory-neutral operational prototype</span>
        <div className="care-topbar__controls">
          <label>
            <span>Role</span>
            <select aria-label="Daily care role" value={role} onChange={(event) => setRole(event.target.value as DailyCareRole)}>
              {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>
            <span>Start from</span>
            <select
              aria-label="Starting daily care scenario state"
              value={stage}
              onChange={(event) => {
                const next = new URL(window.location.href)
                next.searchParams.set("state", event.target.value)
                next.searchParams.set("role", role)
                window.history.pushState({}, "", next)
                window.dispatchEvent(new PopStateEvent("popstate"))
              }}
            >
              {stages.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={reset} aria-label="Reset daily care scenario" title="Reset scenario"><RefreshCw aria-hidden="true" /></button>
        </div>
      </header>

      <main className="care-main">
        <div className="care-heading">
          <div><span>Room care session</span><h1>Observed once, attributable everywhere</h1></div>
          <p>Shared entry stays fast without turning defaults into facts. Draft, submission, delivery, and correction remain independently accountable.</p>
        </div>

        <dl className="care-context">
          <div><dt>Branch</dt><dd>{session.branch.label}</dd></div>
          <div><dt>Room</dt><dd>{session.room.label}</dd></div>
          <div><dt>Care date</dt><dd>Wednesday, 5 August</dd></div>
          {role === "parent" ? <><div><dt>Access</dt><dd>Relation scoped</dd></div><div><dt>Publication</dt><dd>Delivered revisions only</dd></div></> : <><div><dt>Source set</dt><dd>{session.sourceSnapshot.length} of {session.sourceRequirements.length} confirmed</dd></div><div><dt>Session revision</dt><dd>{session.revision}</dd></div></>}
        </dl>

        <section className={`care-decision care-decision--${status.toLowerCase()}`}>
          <div className="care-decision__icon" aria-hidden="true">{statusIcon(status)}</div>
          <div className="care-decision__copy">
            <span>{content.eyebrow}</span>
            <h2 ref={decisionHeadingRef} tabIndex={-1}>{content.title}</h2>
            <p>{content.detail}</p>
          </div>
          <div className="care-decision__action">
            <button type="button" onClick={runAction} disabled={!canAct}>
              {status === "DELIVERY_FAILED" ? <RotateCcw aria-hidden="true" /> : status === "SUBMITTED" ? <Send aria-hidden="true" /> : <FileCheck2 aria-hidden="true" />}
              {content.action}
            </button>
            {role === "parent" ? <small>Parent access is read-only and relation-scoped.</small> : status === "CORRECTED" ? <small>Delivery remains a separate retryable obligation.</small> : <small>Accepted work is revision-checked and idempotent.</small>}
          </div>
        </section>

        {role === "parent" ? (
          <ParentPublication projection={projection} />
        ) : (
          <>
            <section className="care-roster" aria-labelledby="care-roster-title">
              <header><div><span>Room roster</span><h2 id="care-roster-title">Attendance and report truth</h2></div><strong>Draft is never done</strong></header>
              <div className="care-roster-grid care-roster-grid--head" aria-hidden="true"><span>Child</span><span>Attendance</span><span>Selected</span><span>Report</span><span>Required facts</span><span>Parent delivery</span></div>
              {projection.roomChildren.map((child) => (
                <article className="care-roster-grid" key={child.childId}>
                  <div><small>Child</small><strong>{child.displayName}</strong></div>
                  <Metric label="Attendance" value={child.attendance.toLowerCase()} critical={child.attendance === "UNKNOWN"} />
                  <Metric label="Selected" value={child.selected ? "Yes" : "No"} />
                  <Metric label="Report" value={child.reportStatus.toLowerCase().replace("_", " ")} safe={child.reportStatus === "SUBMITTED"} />
                  <Metric label="Required facts" value={child.reportStatus === "NOT_STARTED" ? "Not started" : child.complete ? "Complete" : `${child.missingFields.length} missing`} critical={child.reportStatus !== "NOT_STARTED" && !child.complete} />
                  <Metric label="Parent delivery" value={child.delivered ? "Delivered" : child.reportStatus === "SUBMITTED" ? "Pending" : "Not published"} safe={child.delivered} />
                </article>
              ))}
            </section>

            <section className="care-observations" aria-labelledby="care-observations-title">
              <header><div><span>Observation matrix</span><h2 id="care-observations-title">Shared values and exact exceptions</h2></div><strong>{session.observations.length || session.pendingShared ? "Explicit input" : "All facts unset"}</strong></header>
              <div className="care-observation-grid care-observation-grid--head" aria-hidden="true"><span>Field</span>{session.selectedChildIds.map((childId) => <span key={childId}>{session.children.find((child) => child.id === childId)?.displayName}</span>)}</div>
              {session.fieldDefinitions.filter((field) => field.requiredForSubmission).map((field) => (
                <div className="care-observation-grid" key={field.id}>
                  <div><strong>{field.label}</strong><small>{field.requiredForSubmission ? "Required" : "Optional"}</small></div>
                  {session.selectedChildIds.length ? session.selectedChildIds.map((childId) => {
                    const observation = latestObservation(session, childId, field.id)
                    const pending = session.pendingShared?.values[field.id]
                    return <div key={childId} className={observation?.provenance === "EXCEPTION" || observation?.provenance === "CORRECTION" ? "is-exception" : observation ? "is-shared" : ""}><strong>{observation?.value.replaceAll("_", " ").toLowerCase() ?? pending?.replaceAll("_", " ").toLowerCase() ?? "Unset"}</strong><small>{observation?.provenance.toLowerCase() ?? (pending ? "pending shared" : "not observed")}</small></div>
                  }) : <div className="care-observation-empty">No children selected</div>}
                </div>
              ))}
            </section>
          </>
        )}

        {role !== "parent" ? <div className="care-lower-grid">
          <section className="care-sync" aria-labelledby="care-sync-title">
            <header><div><span>Draft and sync</span><h2 id="care-sync-title">Interruption state</h2></div><FileClock aria-hidden="true" /></header>
            <dl>
              <div><dt>Server drafts</dt><dd>{session.reports.filter((report) => report.status === "DRAFT").length}</dd></div>
              <div><dt>Queued offline</dt><dd>{session.offlineQueue.filter((item) => item.state === "QUEUED").length}</dd></div>
              <div><dt>Open conflicts</dt><dd>{session.conflicts.filter((conflict) => conflict.status === "OPEN").length}</dd></div>
              <div><dt>Source freshness</dt><dd>{session.sourceChanged ? "Refresh required" : session.sourcesTrusted ? "Current" : "Incomplete"}</dd></div>
            </dl>
          </section>

          <section className="care-delivery" aria-labelledby="care-delivery-title">
            <header><div><span>Communication</span><h2 id="care-delivery-title">Parent delivery</h2></div><Send aria-hidden="true" /></header>
            {projection.deliveries.length ? <ol>{projection.deliveries.slice(-4).map((delivery, index) => <li key={`${delivery.reportId}-${delivery.reportRevision}-${index}`}><span><strong>Report revision {delivery.reportRevision}</strong><small>{"parentAccountId" in delivery && role === "manager" ? String(delivery.parentAccountId) : "Recipient identity restricted"}</small></span><strong>{delivery.status.toLowerCase()}</strong></li>)}</ol> : <div className="care-empty"><Send aria-hidden="true" /><p>No delivery exists until complete reports are submitted.</p></div>}
          </section>

          <section className="care-history" aria-labelledby="care-history-title">
            <header><div><span>Accepted history</span><h2 id="care-history-title">{projection.events.length} events</h2></div><History aria-hidden="true" /></header>
            {projection.events.length ? <ol>{projection.events.slice(-5).reverse().map((event) => <li key={event.eventId}><strong>{event.kind.replaceAll("_", " ").toLowerCase()}</strong><small>{event.detail}</small></li>)}</ol> : <div className="care-empty"><LockKeyhole aria-hidden="true" /><p>{role === "manager" ? "No care decision has been accepted in this scenario." : "Audit history is restricted for this role."}</p></div>}
          </section>
        </div> : null}

        <div className="care-announcer" aria-live="polite" aria-atomic="true">{error || announcement}</div>
        {error ? <div className="care-error" role="alert"><AlertTriangle aria-hidden="true" />{error}</div> : null}
      </main>
    </div>
  )
}

function ParentPublication({ projection }: { projection: ReturnType<typeof projectDailyCareForRole> }) {
  const publication = projection.publications[0]
  return (
    <section className="care-parent" aria-labelledby="care-parent-title">
      <header><div><span>Parent-safe projection</span><h2 id="care-parent-title">{projection.children[0]?.displayName ?? "Linked child"}</h2></div><strong>Delivered revisions only</strong></header>
      {publication ? <div className="care-parent__content"><div className="care-parent__summary"><CheckCircle2 aria-hidden="true" /><span><strong>Report revision {publication.reportRevision}</strong><small>{publication.corrected ? "Corrected report" : "Daily report delivered"}</small></span></div><dl>{publication.observations.map((observation) => <div key={observation.fieldId}><dt>{observation.label}</dt><dd>{observation.value.replaceAll("_", " ").toLowerCase()}</dd></div>)}</dl></div> : <div className="care-empty care-empty--parent"><FileClock aria-hidden="true" /><p>No delivered daily report is available yet. Draft, submitted, and failed-delivery states remain private to staff.</p></div>}
    </section>
  )
}

function Metric({ label, value, critical, safe }: { label: string; value: string; critical?: boolean; safe?: boolean }) {
  return <div className={`care-metric ${critical ? "is-critical" : safe ? "is-safe" : ""}`}><small>{label}</small><strong>{value}</strong></div>
}
