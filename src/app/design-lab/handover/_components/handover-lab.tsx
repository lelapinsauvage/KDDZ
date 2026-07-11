"use client"

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  UserCheck,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  acknowledgeHandover,
  carryHandoverObligation,
  closeHandover,
  createHandoverFixture,
  projectHandover,
  resolveHandoverObligation,
  type HandoverObligation,
  type HandoverProjection,
} from "@/lib/redesign-handover-contracts"
import { HandoverAxeHarness } from "./handover-axe-harness"

const capabilities = ["handover.resolve", "handover.carry", "handover.acknowledge", "handover.close"]

const statusLabels: Record<HandoverProjection["status"], string> = {
  UNKNOWN: "Source unknown",
  BLOCKED: "Blocked",
  READY_WITH_CARRY: "Carry decision needed",
  AWAITING_ACKNOWLEDGMENT: "Awaiting acknowledgment",
  READY_TO_CLOSE: "Ready to close",
  CLOSED: "Closed",
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getAxeAuditSnapshot() {
  return new URLSearchParams(window.location.search).get("audit") === "axe"
}

function obligationStateLabel(obligation: HandoverObligation) {
  if (obligation.state === "RESOLVED") return "Resolved"
  if (obligation.state === "CARRIED") return "Carried"
  if (obligation.state === "UNKNOWN") return "Unknown"
  return obligation.consequence === "CARRY_ALLOWED" ? "Can carry" : "Open blocker"
}

export function HandoverLab() {
  const axeAudit = useSyncExternalStore(subscribeToLocation, getAxeAuditSnapshot, () => false)
  const [session, setSession] = useState(createHandoverFixture)
  const [incomingOwner, setIncomingOwner] = useState<string | null>(null)
  const [carryReason, setCarryReason] = useState("")
  const [announcement, setAnnouncement] = useState("")
  const actionHeadingRef = useRef<HTMLHeadingElement>(null)
  const projection = useMemo(() => projectHandover(session), [session])
  const activeObligation = session.obligations.find((obligation) => obligation.state !== "RESOLVED")

  const focusActionHeading = () => window.requestAnimationFrame(() => actionHeadingRef.current?.focus())

  function resolveAttendance() {
    setSession((current) => resolveHandoverObligation(current, {
      eventId: "resolve-attendance",
      idempotencyKey: "resolve-attendance-once",
      actorId: "staff-lina",
      occurredAt: "2026-07-14T12:05:00+01:00",
      expectedRevision: current.revision,
      actorCapabilities: capabilities,
      obligationId: "attendance-alma",
      expectedSourceRevision: 3,
      acceptedSourceRevision: 4,
    }))
    setAnnouncement("Alma's attendance source is confirmed. Two handover obligations remain.")
    focusActionHeading()
  }

  function resolveCare() {
    setSession((current) => resolveHandoverObligation(current, {
      eventId: "resolve-care",
      idempotencyKey: "resolve-care-once",
      actorId: "staff-lina",
      occurredAt: "2026-07-14T12:07:00+01:00",
      expectedRevision: current.revision,
      actorCapabilities: capabilities,
      obligationId: "care-meadow",
      expectedSourceRevision: 4,
      acceptedSourceRevision: 5,
    }))
    setAnnouncement("Two Meadow care reports are submitted. One carry decision remains.")
    focusActionHeading()
  }

  function carryCommunication() {
    if (!incomingOwner || !carryReason.trim()) return
    setSession((current) => carryHandoverObligation(current, {
      eventId: "carry-parent-reply",
      idempotencyKey: "carry-parent-reply-once",
      actorId: "user-manager",
      occurredAt: "2026-07-14T12:09:00+01:00",
      expectedRevision: current.revision,
      actorCapabilities: capabilities,
      obligationId: "reply-theo",
      expectedSourceRevision: 2,
      incomingOwnerId: incomingOwner,
      reason: carryReason,
    }))
    setAnnouncement("Theo's parent reply is assigned to Sam and now awaits his acknowledgment.")
    focusActionHeading()
  }

  function acknowledgeIncoming() {
    setSession((current) => acknowledgeHandover(current, {
      eventId: "ack-sam",
      idempotencyKey: "ack-sam-once",
      actorId: "staff-sam",
      occurredAt: "2026-07-14T12:10:00+01:00",
      expectedRevision: current.revision,
      actorCapabilities: capabilities,
      incomingOwnerId: "staff-sam",
    }))
    setAnnouncement("Sam acknowledged the carried parent reply. Lunch handover can close.")
    focusActionHeading()
  }

  function closeLunchHandover() {
    setSession((current) => closeHandover(current, {
      eventId: "close-lunch-handover",
      idempotencyKey: "close-lunch-handover-once",
      actorId: "user-manager",
      occurredAt: "2026-07-14T12:11:00+01:00",
      expectedRevision: current.revision,
      actorCapabilities: capabilities,
      expectedSourceRevisions: Object.fromEntries(current.obligations.map((item) => [item.sourceId, item.sourceRevision])),
    }))
    setAnnouncement("Lunch handover closed from confirmed source revisions.")
    focusActionHeading()
  }

  function resetFixture() {
    setSession(createHandoverFixture())
    setIncomingOwner(null)
    setCarryReason("")
    setAnnouncement("Lunch handover fixture reset.")
    focusActionHeading()
  }

  return (
    <div className="handover-lab" data-axe-audit={axeAudit ? "axe" : "off"} data-status={projection.status}>
      <HandoverAxeHarness
        enabled={axeAudit}
        signature={`handover:${projection.status}:${session.revision}:${incomingOwner ?? "none"}:${carryReason.trim() ? "reason" : "none"}`}
      />
      <header className="handover-topbar">
        <strong>Kiddz Online</strong>
        <span>Lunch handover / Riverside / Meadow</span>
        <button type="button" onClick={resetFixture} title="Reset handover fixture" aria-label="Reset handover fixture"><RefreshCw aria-hidden="true" /></button>
      </header>

      <main className="handover-main">
        <header className="handover-heading">
          <div><span>Behavior before visual territory</span><h1>Close the shift without losing the work.</h1></div>
          <p>Resolve source-backed blockers, name what can continue, and require the incoming owner to acknowledge it before closure.</p>
        </header>

        <dl className="handover-context" aria-label="Handover context">
          <div><dt>Branch</dt><dd>Riverside</dd></div>
          <div><dt>Room</dt><dd>Meadow</dd></div>
          <div><dt>Period</dt><dd>Lunch / 12:00-12:15</dd></div>
          <div><dt>Source revision</dt><dd>{session.revision}</dd></div>
        </dl>

        <section className="handover-summary" aria-labelledby="handover-summary-title">
          <div className="handover-summary__icon" aria-hidden="true">{projection.status === "CLOSED" ? <CheckCircle2 /> : <ShieldAlert />}</div>
          <div><span>Handover readiness</span><h2 id="handover-summary-title">{statusLabels[projection.status]}</h2><p>{projection.primaryReason}</p></div>
          <dl>
            <div><dt>Open</dt><dd>{projection.openCount}</dd></div>
            <div><dt>Blocking</dt><dd>{projection.blockingCount}</dd></div>
            <div><dt>Carried</dt><dd>{projection.carriedCount}</dd></div>
          </dl>
        </section>

        <div className="handover-grid">
          <div className="handover-source-plane">
            <section className="handover-obligations" aria-labelledby="handover-obligations-title">
              <header><div><span>Source-backed obligations</span><h2 id="handover-obligations-title">What must happen before lunch handover</h2></div><span>{projection.openCount} open</span></header>
              <div>
                {session.obligations.map((obligation) => (
                  <article data-state={obligation.state} key={obligation.id}>
                    <div className="handover-obligation__mark" aria-hidden="true">{obligation.state === "RESOLVED" ? <Check /> : obligation.kind === "COMMUNICATION" ? <MessageCircle /> : <Clock3 />}</div>
                    <div><span>{obligation.kind.toLowerCase()}</span><h3>{obligation.title}</h3><p>{obligation.detail}</p><small>{obligation.path}</small></div>
                    <span className="handover-obligation__state">{obligationStateLabel(obligation)}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="handover-history" aria-labelledby="handover-history-title">
              <header><span>Append-only handover history</span><h2 id="handover-history-title">{session.events.length} accepted events</h2></header>
              {session.events.length ? (
                <ol>{session.events.map((event) => <li key={event.eventId}><span>{event.occurredAt.slice(11, 16)}</span><div><strong>{event.kind.toLowerCase()}</strong><p>{event.detail}</p></div></li>)}</ol>
              ) : <p>No transition has been accepted yet.</p>}
            </section>
          </div>

          <aside className="handover-action" aria-labelledby="handover-action-title">
            <header><span>Next required decision</span><h2 id="handover-action-title" ref={actionHeadingRef} tabIndex={-1}>{projection.status === "UNKNOWN" ? "Confirm the unknown source" : projection.status === "BLOCKED" ? "Resolve the remaining blocker" : projection.status === "READY_WITH_CARRY" ? "Name the incoming owner" : projection.status === "AWAITING_ACKNOWLEDGMENT" ? "Incoming owner acknowledges" : projection.status === "READY_TO_CLOSE" ? "Confirm closure" : "Lunch handover is closed"}</h2></header>

            {projection.status === "UNKNOWN" && activeObligation && <><div className="handover-action__source"><span>Unknown attendance</span><strong>{activeObligation.title}</strong><p>{activeObligation.detail}</p><small>Source revision 3 / no default presence</small></div><button className="handover-primary" type="button" onClick={resolveAttendance}>Confirm observed arrival<ArrowRight aria-hidden="true" /></button></>}

            {projection.status === "BLOCKED" && activeObligation && <><div className="handover-action__source"><span>Submitted is not draft</span><strong>{activeObligation.title}</strong><p>{activeObligation.detail}</p><small>Draft revision 4 / two submissions required</small></div><button className="handover-primary" type="button" onClick={resolveCare}>Submit two confirmed reports<ArrowRight aria-hidden="true" /></button></>}

            {projection.status === "READY_WITH_CARRY" && <><div className="handover-action__source"><span>Allowed carry-forward</span><strong>Reply to Theo&apos;s parent</strong><p>This communication can continue, but only with a named incoming owner and reason.</p></div><fieldset className="handover-owner"><legend>Incoming owner</legend><label><input type="radio" name="incoming-owner" checked={incomingOwner === "staff-sam"} onChange={() => setIncomingOwner("staff-sam")} /><span aria-hidden="true"><Check /></span><span><strong>Sam Okafor</strong><small>Incoming Meadow room lead / present</small></span><UserCheck aria-hidden="true" /></label></fieldset><label className="handover-reason"><span>Carry reason</span><textarea value={carryReason} onChange={(event) => setCarryReason(event.target.value)} placeholder="Explain what continues and why" /></label><button className="handover-primary" type="button" disabled={!incomingOwner || !carryReason.trim()} onClick={carryCommunication}>Assign and request acknowledgment<ArrowRight aria-hidden="true" /></button></>}

            {projection.status === "AWAITING_ACKNOWLEDGMENT" && <><div className="handover-action__source"><span>Incoming ownership</span><strong>Sam has one carried obligation</strong><p>{session.obligations.find((item) => item.state === "CARRIED")?.carryReason}</p><small>Carried at 12:09 / source revision 2</small></div><button className="handover-primary" type="button" onClick={acknowledgeIncoming}>Acknowledge as Sam<ArrowRight aria-hidden="true" /></button></>}

            {projection.status === "READY_TO_CLOSE" && <><div className="handover-action__source"><span>Closure preflight</span><strong>Every blocker is resolved or acknowledged</strong><p>Closure will retain the carried parent reply, all source revisions, actors, and accepted events.</p><small>{session.events.length} accepted events / 1 acknowledged carry</small></div><button className="handover-primary" type="button" onClick={closeLunchHandover}>Close lunch handover<ArrowRight aria-hidden="true" /></button></>}

            {projection.status === "CLOSED" && <div className="handover-closed"><CheckCircle2 aria-hidden="true" /><strong>Closed at 12:11</strong><p>Two obligations resolved. One parent reply carried to Sam and acknowledged.</p><dl><div><dt>Final revision</dt><dd>{session.revision}</dd></div><div><dt>Closed by</dt><dd>Manager</dd></div><div><dt>Evidence</dt><dd>{session.events.length} events</dd></div></dl></div>}
          </aside>
        </div>
      </main>
      <p className="handover-announcement" aria-live="polite">{announcement}</p>
    </div>
  )
}
