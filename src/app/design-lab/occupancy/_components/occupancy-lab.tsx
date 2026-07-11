"use client"

import {
  AlertTriangle,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  DoorOpen,
  EyeOff,
  History,
  Link2,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  TimerReset,
  Users,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  cancelConflictingBooking,
  confirmOccupancySources,
  confirmPlaceBooking,
  createOccupancyScenario,
  createPlaceRequest,
  holdRequestedPlace,
  projectOccupancyPlan,
  projectRoomOccupancy,
  refreshOccupancyPlan,
  releaseCapacityBlock,
  renewExpiredPlaceHold,
  type OccupancyCapability,
  type OccupancyFixtureStage,
  type OccupancyPlan,
  type OccupancyPlanStatus,
} from "@/lib/redesign-occupancy-planning-contracts"
import { OccupancyAxeHarness } from "./occupancy-axe-harness"

type OccupancyRole = "manager" | "admissions" | "practitioner"

const stages: Array<{ value: OccupancyFixtureStage; label: string }> = [
  { value: "source-gap", label: "Source gap" },
  { value: "capacity-conflict", label: "Capacity conflict" },
  { value: "block-review", label: "Block review" },
  { value: "available", label: "Place available" },
  { value: "request-review", label: "Request review" },
  { value: "hold-active", label: "Hold active" },
  { value: "hold-expired", label: "Hold expired" },
  { value: "booking-confirmed", label: "Booking confirmed" },
  { value: "source-changed", label: "Source changed" },
]

const roleLabels: Record<OccupancyRole, string> = {
  manager: "Nursery manager",
  admissions: "Admissions coordinator",
  practitioner: "Room practitioner",
}

const roleCapabilities: Record<OccupancyRole, OccupancyCapability[]> = {
  manager: [
    "occupancy.view",
    "occupancy.configure",
    "occupancy.manage_requests",
    "occupancy.manage_bookings",
    "occupancy.manage_blocks",
    "occupancy.view_funding",
    "occupancy.audit",
  ],
  admissions: [
    "occupancy.view",
    "occupancy.manage_requests",
    "occupancy.manage_bookings",
    "occupancy.view_funding",
  ],
  practitioner: ["occupancy.view"],
}

const statusContent: Record<OccupancyPlanStatus, { eyebrow: string; title: string; detail: string }> = {
  SOURCE_GAP: {
    eyebrow: "Forecast withheld",
    title: "Planning sources are incomplete",
    detail: "A class limit alone cannot prove policy capacity, staffing capacity, bookings, or availability.",
  },
  CAPACITY_CONFLICT: {
    eyebrow: "One place over capacity",
    title: "Resolve the duplicate booking",
    detail: "Nine effective places currently have ten confirmed bookings. The conflict stays visible until history is corrected.",
  },
  BLOCK_REVIEW: {
    eyebrow: "Capacity intentionally reduced",
    title: "Review the staffing block",
    detail: "The duplicate is resolved. A named staffing absence still reserves one place until qualified cover is accepted.",
  },
  AVAILABLE: {
    eyebrow: "One sellable place",
    title: "Meadow can accept one request",
    detail: "Physical, policy, staffing, block, booking, and hold sources agree for this session.",
  },
  REQUEST_REVIEW: {
    eyebrow: "Admissions decision",
    title: "Review the requested place",
    detail: "The request does not consume capacity until an explicit time-bounded hold is accepted.",
  },
  HOLD_ACTIVE: {
    eyebrow: "Place reserved until 12:00",
    title: "Confirm the booking or release the hold",
    detail: "The hold consumes the last sellable place but has not created attendance or billing inputs.",
  },
  HOLD_EXPIRED: {
    eyebrow: "No booking created",
    title: "The place hold expired",
    detail: "Availability returned automatically. Renew only after checking the current room-source revisions.",
  },
  BOOKING_CONFIRMED: {
    eyebrow: "Source chain complete",
    title: "Booking confirmed from the held place",
    detail: "The hold is consumed and named attendance expectation and billing input projections now exist.",
  },
  SOURCE_CHANGED: {
    eyebrow: "Projection is stale",
    title: "Staffing capacity changed after the hold",
    detail: "Confirmation is blocked until the new source revision is accepted and availability is recalculated.",
  },
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getLocationSnapshot() {
  return window.location.search
}

function parseStage(search: string): OccupancyFixtureStage {
  const value = new URLSearchParams(search).get("state")
  return stages.some((stage) => stage.value === value) ? (value as OccupancyFixtureStage) : "available"
}

function parseRole(search: string): OccupancyRole {
  const value = new URLSearchParams(search).get("role")
  return value && value in roleLabels ? (value as OccupancyRole) : "manager"
}

function commandBase(plan: OccupancyPlan, id: string, role: OccupancyRole) {
  const actorIds: Record<OccupancyRole, string> = {
    manager: "manager-maya",
    admissions: "admissions-nadia",
    practitioner: "practitioner-salma",
  }
  return {
    eventId: `${id}-${plan.revision}`,
    idempotencyKey: `${id}-${plan.revision}-once`,
    actorId: actorIds[role],
    occurredAt: "2026-08-01T08:05:00+01:00",
    expectedRevision: plan.revision,
    actorCapabilities: roleCapabilities[role],
  }
}

function statusIcon(status: OccupancyPlanStatus) {
  if (status === "BOOKING_CONFIRMED") return <CheckCircle2 />
  if (status === "AVAILABLE") return <DoorOpen />
  if (status === "HOLD_ACTIVE") return <Clock3 />
  if (status === "HOLD_EXPIRED") return <TimerReset />
  if (status === "SOURCE_CHANGED") return <History />
  if (status === "SOURCE_GAP") return <ShieldAlert />
  return <AlertTriangle />
}

export function OccupancyLab() {
  const search = useSyncExternalStore(subscribeToLocation, getLocationSnapshot, () => "")
  const stage = parseStage(search)
  const role = parseRole(search)
  const axeAudit = new URLSearchParams(search).get("audit") === "axe"
  return <OccupancyScenario key={`${stage}:${role}:${axeAudit}`} stage={stage} initialRole={role} axeAudit={axeAudit} />
}

function OccupancyScenario({
  stage,
  initialRole,
  axeAudit,
}: {
  stage: OccupancyFixtureStage
  initialRole: OccupancyRole
  axeAudit: boolean
}) {
  const [plan, setPlan] = useState(() => createOccupancyScenario(stage))
  const [role, setRole] = useState(initialRole)
  const [announcement, setAnnouncement] = useState("")
  const [error, setError] = useState("")
  const decisionHeadingRef = useRef<HTMLHeadingElement>(null)
  const projection = useMemo(
    () => projectOccupancyPlan(plan, roleCapabilities[role]),
    [plan, role],
  )
  const content = statusContent[projection.status]
  const meadow = projection.rooms.find((room) => room.roomId === "room-meadow")!
  const latestRequest = projection.requests.at(-1)

  function focusDecision() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => decisionHeadingRef.current?.focus())
    })
  }

  function accept(next: OccupancyPlan, message: string) {
    setPlan(next)
    setError("")
    setAnnouncement(message)
    focusDecision()
  }

  function runAction() {
    try {
      if (projection.status === "SOURCE_GAP") {
        accept(
          confirmOccupancySources(plan, {
            ...commandBase(plan, "confirm-sources", role),
            roomId: "room-meadow",
            physicalCapacity: 14,
            policyCapacity: 10,
            staffingCapacity: 10,
            sourceSnapshot: [
              { sourceId: "class-meadow-capacity", revision: 4 },
              { sourceId: "policy-meadow", revision: 6 },
              { sourceId: "staff-plan-meadow", revision: 9 },
            ],
          }),
          "Planning sources confirmed. One capacity conflict now requires resolution.",
        )
        return
      }
      if (projection.status === "CAPACITY_CONFLICT") {
        const booking = plan.bookings.find((item) => item.id === "booking-meadow-10")!
        accept(
          cancelConflictingBooking(plan, {
            ...commandBase(plan, "cancel-duplicate", role),
            bookingId: booking.id,
            expectedSourceRevision: booking.sourceRevision,
            reason: "Duplicate imported roster row confirmed against source enrollment",
          }),
          "Duplicate booking cancelled with reason. The staffing capacity block remains open.",
        )
        return
      }
      if (projection.status === "BLOCK_REVIEW") {
        const block = plan.blocks.find((item) => item.id === "block-meadow-staffing")!
        accept(
          releaseCapacityBlock(plan, {
            ...commandBase(plan, "release-block", role),
            blockId: block.id,
            expectedSourceRevision: block.sourceRevision,
            reason: "Qualified cover assignment accepted for the complete session",
          }),
          "Staffing block released with evidence. One place is now sellable.",
        )
        return
      }
      if (projection.status === "AVAILABLE") {
        accept(
          createPlaceRequest(plan, {
            ...commandBase(plan, "create-request", role),
            requestId: "request-haddad",
            familyDisplayName: "Haddad family",
            childDisplayName: "Lea Haddad",
            roomId: "room-meadow",
            requestedStartDate: "2026-08-15",
          }),
          "Place request created. Capacity remains available until a hold is accepted.",
        )
        return
      }
      if (projection.status === "REQUEST_REVIEW") {
        const request = plan.requests.at(-1)!
        accept(
          holdRequestedPlace(plan, {
            ...commandBase(plan, "hold-place", role),
            requestId: request.id,
            expectedRequestRevision: request.sourceRevision,
            expectedRoomSources: projectRoomOccupancy(plan, request.roomId, "2026-08-01T08:05:00+01:00").sources,
            holdId: "hold-haddad",
            expiresAt: "2026-08-01T12:00:00+01:00",
          }),
          "One place held until 12:00. No booking or downstream charge has been created.",
        )
        return
      }
      if (projection.status === "HOLD_ACTIVE") {
        const request = plan.requests.at(-1)!
        const hold = plan.holds.at(-1)!
        accept(
          confirmPlaceBooking(plan, {
            ...commandBase(plan, "confirm-booking", role),
            requestId: request.id,
            expectedRequestRevision: request.sourceRevision,
            holdId: hold.id,
            expectedHoldRevision: hold.sourceRevision,
            expectedRoomSources: projectRoomOccupancy(plan, request.roomId, "2026-08-01T08:05:00+01:00").sources,
            bookingId: "booking-haddad",
            childId: "child-lea-haddad",
            expectedAttendanceId: "expected-attendance-haddad",
            billingInputId: "billing-input-haddad",
          }),
          "Booking confirmed atomically. Attendance expectation and billing input identities are ready.",
        )
        return
      }
      if (projection.status === "HOLD_EXPIRED") {
        const request = plan.requests.at(-1)!
        const hold = plan.holds.at(-1)!
        accept(
          renewExpiredPlaceHold(plan, {
            ...commandBase(plan, "renew-hold", role),
            requestId: request.id,
            expiredHoldId: hold.id,
            expectedHoldRevision: hold.sourceRevision,
            holdId: "hold-haddad-renewed",
            expiresAt: "2026-08-01T16:00:00+01:00",
            expectedRoomSources: projectRoomOccupancy(plan, request.roomId, "2026-08-01T12:05:00+01:00").sources,
          }),
          "Expired hold retained in history. A fresh hold now reserves the place until 16:00.",
        )
        return
      }
      if (projection.status === "SOURCE_CHANGED") {
        accept(
          refreshOccupancyPlan(plan, {
            ...commandBase(plan, "refresh-plan", role),
            sourceSnapshot: [
              { sourceId: "class-meadow-capacity", revision: 4 },
              { sourceId: "policy-meadow", revision: 6 },
              { sourceId: "staff-plan-meadow", revision: 10 },
              { sourceId: "class-sunroom-capacity", revision: 2 },
              { sourceId: "policy-sunroom", revision: 3 },
              { sourceId: "staff-plan-sunroom", revision: 5 },
            ],
          }),
          "Current source revisions accepted. The held-place decision is available again.",
        )
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The occupancy transition could not be accepted.")
    }
  }

  function resetScenario() {
    setPlan(createOccupancyScenario(stage))
    setError("")
    setAnnouncement("Occupancy scenario reset to its deterministic source fixture.")
    focusDecision()
  }

  const primaryLabel = (() => {
    if (projection.status === "SOURCE_GAP") return "Confirm planning inputs"
    if (projection.status === "CAPACITY_CONFLICT") return "Cancel duplicate booking"
    if (projection.status === "BLOCK_REVIEW") return "Release staffing block"
    if (projection.status === "AVAILABLE") return "Create place request"
    if (projection.status === "REQUEST_REVIEW") return "Hold one place"
    if (projection.status === "HOLD_ACTIVE") return "Confirm booking"
    if (projection.status === "HOLD_EXPIRED") return "Renew place hold"
    if (projection.status === "SOURCE_CHANGED") return "Refresh source projection"
    return "Booking confirmed"
  })()

  const canRun = (() => {
    if (["SOURCE_GAP", "SOURCE_CHANGED"].includes(projection.status)) return projection.canConfigure
    if (projection.status === "BLOCK_REVIEW") return projection.canManageBlocks
    if (["CAPACITY_CONFLICT", "REQUEST_REVIEW", "HOLD_ACTIVE", "HOLD_EXPIRED"].includes(projection.status)) return projection.canManageBookings
    if (projection.status === "AVAILABLE") return projection.canManageRequests
    return false
  })()

  return (
    <div className="occupancy-lab" data-axe-audit={axeAudit ? "axe" : "off"} data-status={projection.status}>
      <OccupancyAxeHarness enabled={axeAudit} signature={`occupancy:${stage}:${role}:${projection.status}:${plan.revision}`} />
      <header className="occupancy-topbar">
        <strong>Kiddz Online</strong>
        <span>Places / Occupancy / Riverside</span>
        <div className="occupancy-topbar__controls">
          <label><span>Scenario</span><select aria-label="Occupancy test scenario" value={stage} onChange={(event) => { const url = new URL(window.location.href); url.searchParams.set("state", event.target.value); window.history.pushState({}, "", url); window.dispatchEvent(new PopStateEvent("popstate")) }}>{stages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label><span>Role</span><select aria-label="Occupancy viewer role" value={role} onChange={(event) => setRole(event.target.value as OccupancyRole)}>{(Object.keys(roleLabels) as OccupancyRole[]).map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select></label>
          <button type="button" onClick={resetScenario} title="Reset occupancy scenario" aria-label="Reset occupancy scenario"><RefreshCw aria-hidden="true" /></button>
        </div>
      </header>

      <main className="occupancy-main">
        <header className="occupancy-heading">
          <div><span>Occupancy and future places</span><h1>Promise only the places you can prove.</h1></div>
          <p>Keep roster, bookings, live attendance, capacity, holds, funding, and invoices connected without collapsing them into one misleading percentage.</p>
        </header>

        <dl className="occupancy-context" aria-label="Occupancy planning context">
          <div><dt>Branch</dt><dd>{plan.branch.label}</dd></div>
          <div><dt>Planning date</dt><dd>{plan.planningDate}</dd></div>
          <div><dt>Session</dt><dd>{plan.session.label} · 08:00-13:00</dd></div>
          <div><dt>Plan revision</dt><dd>{plan.revision}</dd></div>
        </dl>

        <section className={`occupancy-decision occupancy-decision--${projection.status.toLowerCase()}`} aria-labelledby="occupancy-decision-title">
          <div className="occupancy-decision__icon" aria-hidden="true">{statusIcon(projection.status)}</div>
          <div className="occupancy-decision__copy"><span>{content.eyebrow}</span><h2 id="occupancy-decision-title" ref={decisionHeadingRef} tabIndex={-1}>{content.title}</h2><p>{content.detail}</p></div>
          <div className="occupancy-decision__action"><button type="button" onClick={runAction} disabled={!canRun}><Check aria-hidden="true" />{primaryLabel}</button>{!canRun && projection.status !== "BOOKING_CONFIRMED" ? <small>{roleLabels[role]} does not hold the required capability.</small> : null}</div>
        </section>

        <section className="occupancy-rooms" aria-labelledby="occupancy-rooms-title">
          <header><div><span>Room capacity chain</span><h2 id="occupancy-rooms-title">Morning session</h2></div><strong>Current source projection</strong></header>
          <div className="occupancy-room-grid occupancy-room-grid--head" aria-hidden="true"><span>Room</span><span>Physical</span><span>Policy</span><span>Staffing</span><span>Blocked</span><span>Effective</span><span>Booked</span><span>Held</span><span>Sellable</span><span>Live</span></div>
          {projection.rooms.map((room) => (
            <article key={room.roomId} className={`occupancy-room-grid ${room.conflictPlaces ? "occupancy-room-grid--conflict" : ""}`}>
              <div className="occupancy-room__name"><strong>{room.roomLabel}</strong><small>{room.sources.length} source revisions</small></div>
              <Metric label="Physical" value={room.physicalCapacity} />
              <Metric label="Policy" value={room.policyCapacity} />
              <Metric label="Staffing" value={room.staffingCapacity} />
              <Metric label="Blocked" value={room.blockedPlaces} />
              <Metric label="Effective" value={room.effectiveCapacity} />
              <Metric label="Booked" value={room.confirmedBookings} critical={room.conflictPlaces > 0} />
              <Metric label="Held" value={room.activeHolds} />
              <Metric label="Sellable" value={room.sellablePlaces} safe={room.sellablePlaces !== undefined && room.sellablePlaces > 0} />
              <div className="occupancy-room__metric"><small>Live</small><strong>{room.liveState === "OBSERVED" ? room.livePresent : "Unknown"}</strong></div>
            </article>
          ))}
        </section>

        <div className="occupancy-lower-grid">
          <section className="occupancy-request" aria-labelledby="occupancy-request-title">
            <header><div><span>Place request</span><h2 id="occupancy-request-title">{latestRequest ? latestRequest.childDisplayName : "No active request"}</h2></div>{latestRequest ? <strong>{latestRequest.status.toLowerCase()}</strong> : null}</header>
            {latestRequest ? (
              <dl>
                <div><dt>Family</dt><dd>{latestRequest.familyDisplayName}</dd></div>
                <div><dt>Requested start</dt><dd>{latestRequest.requestedStartDate}</dd></div>
                <div><dt>Room and session</dt><dd>{meadow.roomLabel} · Morning</dd></div>
                <div><dt>Source revision</dt><dd>{latestRequest.sourceRevision}</dd></div>
              </dl>
            ) : <div className="occupancy-empty"><Users aria-hidden="true" /><p>Availability is not a waitlist. A named request becomes a separate reviewed record.</p></div>}
            {role === "practitioner" && latestRequest ? <div className="occupancy-privacy"><EyeOff aria-hidden="true" />Admissions identity is restricted for this role.</div> : null}
          </section>

          <section className="occupancy-hours" aria-labelledby="occupancy-hours-title">
            <header><div><span>Hour ledgers</span><h2 id="occupancy-hours-title">Never interchangeable</h2></div><CalendarCheck2 aria-hidden="true" /></header>
            {projection.hourLedgers.map((ledger) => (
              <div className="occupancy-hours__row" key={ledger.childId}>
                {"access" in ledger ? <div className="occupancy-hours__restricted"><LockKeyhole aria-hidden="true" />Funding and billing hours restricted</div> : <><Hour label="Booked" minutes={ledger.bookedMinutes} /><Hour label="Attended" minutes={ledger.attendedMinutes} /><Hour label="Claimed" minutes={ledger.fundedClaimMinutes} /><Hour label="Invoiced" minutes={ledger.invoicedMinutes} /></>}
              </div>
            ))}
          </section>

          <section className="occupancy-history" aria-labelledby="occupancy-history-title">
            <header><div><span>Accepted history</span><h2 id="occupancy-history-title">{plan.events.length} events</h2></div><History aria-hidden="true" /></header>
            <ol>{plan.events.slice(-5).reverse().map((event) => <li key={event.eventId}><span>{event.kind.replaceAll("_", " ").toLowerCase()}</span><small>{event.detail}</small></li>)}</ol>
            {!plan.events.length ? <p>No planning decision has been accepted.</p> : null}
            {plan.downstreamProjections.length ? <div className="occupancy-downstream"><Link2 aria-hidden="true" /><span><strong>Downstream identities created</strong><small>Expected attendance and billing input remain separate records.</small></span></div> : null}
          </section>
        </div>

        <div className="occupancy-announcer" aria-live="polite" aria-atomic="true">{error || announcement}</div>
        {error ? <div className="occupancy-error" role="alert"><AlertTriangle aria-hidden="true" />{error}</div> : null}
      </main>
    </div>
  )
}

function Metric({ label, value, critical, safe }: { label: string; value: number | undefined; critical?: boolean; safe?: boolean }) {
  return <div className={`occupancy-room__metric ${critical ? "occupancy-room__metric--critical" : safe ? "occupancy-room__metric--safe" : ""}`}><small>{label}</small><strong>{value ?? "-"}</strong></div>
}

function Hour({ label, minutes }: { label: string; minutes: number | undefined }) {
  return <div><small>{label}</small><strong>{minutes === undefined ? "Unknown" : `${minutes / 60}h`}</strong></div>
}
