"use client"

import {
  ArrowRight,
  Banknote,
  CalendarCheck,
  Check,
  ClipboardList,
  Clock3,
  FileCheck2,
  HeartPulse,
  History,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  Stethoscope,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  correctChildTimelineEvent,
  createChildWorkspaceFixture,
  managerChildWorkspaceViewer,
  nurseChildWorkspaceViewer,
  parentChildWorkspaceViewer,
  practitionerChildWorkspaceViewer,
  projectChildWorkspace,
  type ChildTimelineSourceKind,
  type ChildWorkspaceSectionId,
  type ChildWorkspaceViewer,
  type ProjectedChildTimelineEvent,
} from "@/lib/redesign-child-workspace-contracts"
import { ChildWorkspaceAxeHarness } from "./child-workspace-axe-harness"

type PreviewRole = "manager" | "practitioner" | "nurse" | "parent"

const viewers: Record<PreviewRole, ChildWorkspaceViewer> = {
  manager: managerChildWorkspaceViewer,
  practitioner: practitionerChildWorkspaceViewer,
  nurse: nurseChildWorkspaceViewer,
  parent: parentChildWorkspaceViewer,
}

const sectionKinds: Partial<Record<ChildWorkspaceSectionId, readonly ChildTimelineSourceKind[]>> = {
  CARE: ["CARE"],
  ATTENDANCE: ["ATTENDANCE"],
  HEALTH: ["MEDICAL", "PROFILE"],
  COMMUNICATION: ["COMMUNICATION"],
  FINANCE: ["FINANCE"],
  DOCUMENTS: ["DOCUMENT"],
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getAxeAuditSnapshot() {
  return new URLSearchParams(window.location.search).get("audit") === "axe"
}

function sourceIcon(sourceKind: ChildTimelineSourceKind) {
  if (sourceKind === "ATTENDANCE") return <CalendarCheck aria-hidden="true" />
  if (sourceKind === "CARE") return <ClipboardList aria-hidden="true" />
  if (sourceKind === "MEDICAL") return <Stethoscope aria-hidden="true" />
  if (sourceKind === "COMMUNICATION") return <MessageCircle aria-hidden="true" />
  if (sourceKind === "FINANCE") return <Banknote aria-hidden="true" />
  if (sourceKind === "DOCUMENT") return <FileCheck2 aria-hidden="true" />
  return <ShieldAlert aria-hidden="true" />
}

function roleLabel(role: PreviewRole) {
  if (role === "practitioner") return "Practitioner"
  if (role === "nurse") return "Nurse"
  if (role === "parent") return "Parent"
  return "Manager"
}

export function ChildWorkspaceLab() {
  const axeAudit = useSyncExternalStore(subscribeToLocation, getAxeAuditSnapshot, () => false)
  const [workspace, setWorkspace] = useState(createChildWorkspaceFixture)
  const [role, setRole] = useState<PreviewRole>("manager")
  const [activeSection, setActiveSection] = useState<ChildWorkspaceSectionId>("OVERVIEW")
  const [selectedId, setSelectedId] = useState("attendance-arrival-4")
  const [correctionReason, setCorrectionReason] = useState("")
  const [announcement, setAnnouncement] = useState("")
  const detailHeadingRef = useRef<HTMLHeadingElement>(null)
  const viewer = viewers[role]
  const projection = useMemo(() => projectChildWorkspace(workspace, viewer), [viewer, workspace])
  const filteredTimeline = useMemo(() => {
    const kinds = sectionKinds[activeSection]
    return kinds ? projection.timeline.filter((event) => kinds.includes(event.sourceKind)) : projection.timeline
  }, [activeSection, projection.timeline])
  const selected = filteredTimeline.find((event) => event.id === selectedId) ?? filteredTimeline[0] ?? null
  const corrected = workspace.timeline.some((event) => event.correctsEventId === "attendance-arrival-4")
  const phase = workspace.acceptedEvents.length ? "corrected" : correctionReason.trim() ? "correction-ready" : "initial"

  const focusDetail = () => window.requestAnimationFrame(() => detailHeadingRef.current?.focus())

  function resetFixture() {
    setWorkspace(createChildWorkspaceFixture())
    setRole("manager")
    setActiveSection("OVERVIEW")
    setSelectedId("attendance-arrival-4")
    setCorrectionReason("")
    setAnnouncement("Child workspace fixture reset.")
    focusDetail()
  }

  function selectRole(nextRole: PreviewRole) {
    setRole(nextRole)
    setActiveSection("OVERVIEW")
    setSelectedId(nextRole === "nurse" ? "medical-clinical-2" : nextRole === "parent" ? "attendance-arrival-5" : "attendance-arrival-4")
    setAnnouncement(`${roleLabel(nextRole)} capability projection shown. Counts include only visible sources.`)
  }

  function selectSection(sectionId: ChildWorkspaceSectionId) {
    setActiveSection(sectionId)
    setSelectedId("")
    setAnnouncement(`${sectionId.toLowerCase()} child workspace section shown.`)
  }

  function correctArrival() {
    if (!correctionReason.trim()) return
    setWorkspace((current) => correctChildTimelineEvent(current, {
      eventId: "attendance-arrival-5",
      idempotencyKey: "correct-attendance-alma-once",
      actorId: "user-manager",
      occurredAt: "2026-07-14T10:05:00+01:00",
      expectedWorkspaceRevision: current.revision,
      sourceEventId: "attendance-arrival-4",
      expectedSourceRevision: 4,
      acceptedSourceRevision: 5,
      correctedOccurredAt: "2026-07-14T09:12:00+01:00",
      reason: correctionReason,
      correctedStaffDetail: "Alma arrived at Meadow at 09:12; corrected against the signed room register.",
      correctedParentDetail: "Alma arrived at 09:12.",
      actorCapabilities: managerChildWorkspaceViewer.capabilities,
    }))
    setSelectedId("attendance-arrival-5")
    setAnnouncement("Arrival revision 5 appended. Revision 4 remains available to audit-capable staff.")
    focusDetail()
  }

  return (
    <div className="child-workspace-lab" data-axe-audit={axeAudit ? "axe" : "off"} data-phase={phase} data-role={role}>
      <ChildWorkspaceAxeHarness
        enabled={axeAudit}
        signature={`child-workspace:${role}:${activeSection}:${phase}:${workspace.revision}:${selected?.id ?? "none"}`}
      />
      <header className="child-topbar">
        <strong>Kiddz Online</strong>
        <span>Children / Alma Reyes / Riverside / Meadow</span>
        <button type="button" onClick={resetFixture} title="Reset child workspace fixture" aria-label="Reset child workspace fixture"><RefreshCw aria-hidden="true" /></button>
      </header>

      <main className="child-main">
        <section className="child-profile-header" aria-labelledby="child-profile-name">
          <div className="child-avatar" aria-hidden="true">{projection.identity?.initials}</div>
          <div className="child-profile-copy"><span>Active child / {projection.identity?.childNumber}</span><h1 id="child-profile-name">{projection.identity?.displayName}</h1><p>Riverside / Meadow room / identity revision {projection.identity?.sourceRevision}</p></div>
          <dl>
            <div><dt>Visible events</dt><dd>{projection.visibleTimelineCount}</dd></div>
            <div><dt>Sections</dt><dd>{projection.sections.length}</dd></div>
            <div><dt>Safety notices</dt><dd>{projection.visibleNoticeCount}</dd></div>
          </dl>
        </section>

        <section className="child-role-bar" aria-label="Child workspace role preview">
          <span>Viewing as</span>
          <div role="group" aria-label="Preview role">
            {(["manager", "practitioner", "nurse", "parent"] as const).map((item) => <button type="button" aria-pressed={role === item} key={item} onClick={() => selectRole(item)}>{roleLabel(item)}</button>)}
          </div>
        </section>

        <nav className="child-sections" aria-label="Visible child sections">
          {projection.sections.map((section) => <button type="button" aria-current={activeSection === section.id ? "page" : undefined} key={section.id} onClick={() => selectSection(section.id)}>{section.label}</button>)}
        </nav>

        {projection.safetyNotices.length > 0 ? <section className="child-safety" aria-labelledby="child-safety-title"><header><HeartPulse aria-hidden="true" /><div><span>Role-appropriate safety context</span><h2 id="child-safety-title">Check before care or collection</h2></div></header><div>{projection.safetyNotices.map((notice) => <article key={notice.id}><ShieldAlert aria-hidden="true" /><div><strong>{notice.title}</strong><p>{notice.detail}</p><small>{notice.sourcePath} / source revision {notice.sourceRevision}</small></div></article>)}</div></section> : null}

        <div className="child-workspace-grid">
          <section className="child-timeline" aria-labelledby="child-timeline-title">
            <header><div><span>Source-backed chronology</span><h2 id="child-timeline-title">{activeSection === "OVERVIEW" || activeSection === "AUDIT" ? "Recent child activity" : `${projection.sections.find((section) => section.id === activeSection)?.label ?? "Visible"} activity`}</h2></div><span>{filteredTimeline.length}</span></header>
            {filteredTimeline.length ? <ol>{filteredTimeline.map((event) => <TimelineRow event={event} key={event.id} selected={selected?.id === event.id} onSelect={setSelectedId} />)}</ol> : <div className="child-empty"><History aria-hidden="true" /><strong>No capability-visible activity</strong><p>This section does not expose a hidden count.</p></div>}
          </section>

          <aside className="child-detail" aria-labelledby="child-detail-title">
            <header><span>Selected source event</span><h2 id="child-detail-title" ref={detailHeadingRef} tabIndex={-1}>{selected?.title ?? "No visible source"}</h2></header>
            {selected ? <>
              <div className="child-detail-source"><span className="child-event-icon" data-kind={selected.sourceKind}>{sourceIcon(selected.sourceKind)}</span><div><span>{selected.sourceKind.toLowerCase()} / {selected.state.toLowerCase()}</span><p>{selected.detail}</p><small>{selected.path}</small></div></div>
              <dl className="child-detail-facts">
                <div><dt>Effective time</dt><dd>{selected.occurredAt.slice(11, 16)}</dd></div>
                <div><dt>Recorded time</dt><dd>{selected.recordedAt.slice(11, 16)}</dd></div>
                <div><dt>Source revision</dt><dd>{selected.sourceRevision}</dd></div>
                <div><dt>Provenance</dt><dd>{selected.provenance.toLowerCase()}</dd></div>
              </dl>
              {selected.isSuperseded ? <div className="child-superseded"><History aria-hidden="true" /><span>Superseded by a reasoned correction; retained for audit.</span></div> : null}
              {selected.correctionReason ? <div className="child-correction-receipt"><Check aria-hidden="true" /><div><strong>Correction accepted</strong><p>{selected.correctionReason}</p></div></div> : null}
              {role === "manager" && selected.id === "attendance-arrival-4" && !corrected ? <>
                <div className="child-correction-preview"><Clock3 aria-hidden="true" /><div><strong>Correct effective time to 09:12</strong><p>The signed room register conflicts with the scanner clock. Revision 4 will remain in audit history.</p></div></div>
                <label className="child-correction-reason"><span>Correction reason</span><textarea value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} placeholder="Explain the source conflict and evidence" /></label>
                <button type="button" className="child-primary" disabled={!correctionReason.trim()} onClick={correctArrival}>Append correction revision 5<ArrowRight aria-hidden="true" /></button>
              </> : null}
              <p className="child-boundary">The workspace links to the canonical source. It does not rewrite drafts as submitted, medical summaries as clinical detail, or imported history as observed fact.</p>
            </> : <div className="child-empty"><History aria-hidden="true" /><strong>No source selected</strong><p>Choose a capability-visible event.</p></div>}
          </aside>
        </div>

        <section className="child-audit-events" aria-labelledby="child-audit-events-title">
          <header><span>Accepted workspace mutations</span><h2 id="child-audit-events-title">{workspace.acceptedEvents.length} append-only events</h2></header>
          {workspace.acceptedEvents.length ? <ol>{workspace.acceptedEvents.map((event) => <li key={event.eventId}><span>{event.occurredAt.slice(11, 16)}</span><div><strong>Timeline corrected</strong><p>{event.detail}</p></div></li>)}</ol> : <p>No workspace mutation has been accepted.</p>}
        </section>
      </main>
      <p className="child-announcement" aria-live="polite">{announcement}</p>
    </div>
  )
}

function TimelineRow({ event, selected, onSelect }: {
  event: ProjectedChildTimelineEvent
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <li data-superseded={event.isSuperseded ? "true" : "false"}>
      <button type="button" aria-pressed={selected} onClick={() => onSelect(event.id)}>
        <span className="child-event-time"><strong>{event.occurredAt.slice(11, 16)}</strong><small>{event.occurredAt.slice(5, 10)}</small></span>
        <span className="child-event-icon" data-kind={event.sourceKind}>{sourceIcon(event.sourceKind)}</span>
        <span className="child-event-copy"><span>{event.sourceKind.toLowerCase()} / {event.provenance.toLowerCase()}</span><strong>{event.title}</strong><small>{event.detail}</small></span>
        <span className="child-event-state">{event.isSuperseded ? "Superseded" : event.state.toLowerCase()}</span>
        <ArrowRight aria-hidden="true" />
      </button>
    </li>
  )
}
