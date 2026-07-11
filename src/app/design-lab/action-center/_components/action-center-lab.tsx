"use client"

import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  FileClock,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  UserRoundCheck,
  WalletCards,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  claimActionItem,
  createActionCenterFixture,
  deferActionItem,
  managerActionCenterViewer,
  markActionViewed,
  practitionerActionCenterViewer,
  projectActionCenter,
  reconcileActionSource,
  type ActionCenterGroup,
  type ActionCenterItem,
  type ProjectedActionCenterItem,
} from "@/lib/redesign-action-center-contracts"
import { ActionCenterAxeHarness } from "./action-center-axe-harness"

const managerCapabilities = [
  ...managerActionCenterViewer.capabilities,
  "action_center.claim",
  "action_center.defer",
  "action_center.source_reconcile",
]

const groupLabels: Record<ActionCenterGroup, { eyebrow: string; title: string }> = {
  NEEDS_VERIFICATION: { eyebrow: "Unknown source", title: "Verify before deciding" },
  NOW: { eyebrow: "Time-sensitive", title: "Act now" },
  TODAY: { eyebrow: "Due today", title: "Keep the day moving" },
  WAITING: { eyebrow: "External dependency", title: "Waiting with an owner" },
  LATER: { eyebrow: "Review scheduled", title: "Still open, intentionally later" },
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getAxeAuditSnapshot() {
  return new URLSearchParams(window.location.search).get("audit") === "axe"
}

function sourceIcon(item: ActionCenterItem) {
  if (item.sourceKind === "RATIO") return <ShieldAlert aria-hidden="true" />
  if (item.sourceKind === "MESSAGE") return <MessageCircle aria-hidden="true" />
  if (item.sourceKind === "PAYMENT") return <WalletCards aria-hidden="true" />
  if (item.sourceKind === "DAILY_REPORT") return <FileClock aria-hidden="true" />
  return <CircleAlert aria-hidden="true" />
}

function sourceStateLabel(item: ActionCenterItem) {
  if (item.sourceState === "UNKNOWN") return "Needs verification"
  if (item.sourceState === "WAITING") return "Waiting"
  if (item.sourceState === "RESOLVED") return "Source resolved"
  if (item.deferredUntil) return "Review at 13:00"
  if (item.ownerId) return "Owned"
  return "Unassigned"
}

export function ActionCenterLab() {
  const axeAudit = useSyncExternalStore(subscribeToLocation, getAxeAuditSnapshot, () => false)
  const [state, setState] = useState(createActionCenterFixture)
  const [role, setRole] = useState<"manager" | "practitioner">("manager")
  const [selectedId, setSelectedId] = useState("ratio-meadow")
  const [deferReason, setDeferReason] = useState("")
  const [announcement, setAnnouncement] = useState("")
  const actionHeadingRef = useRef<HTMLHeadingElement>(null)
  const viewer = role === "manager" ? managerActionCenterViewer : practitionerActionCenterViewer
  const projection = useMemo(() => projectActionCenter(state, viewer), [state, viewer])
  const selected = projection.activeItems.find((item) => item.id === selectedId) ?? projection.activeItems[0] ?? null
  const phase = state.events.at(-1)?.kind.toLowerCase() ?? "initial"

  const focusActionHeading = () => window.requestAnimationFrame(() => actionHeadingRef.current?.focus())

  function resetFixture() {
    setState(createActionCenterFixture())
    setRole("manager")
    setSelectedId("ratio-meadow")
    setDeferReason("")
    setAnnouncement("Action Center fixture reset.")
    focusActionHeading()
  }

  function selectRole(nextRole: "manager" | "practitioner") {
    setRole(nextRole)
    setAnnouncement(nextRole === "manager" ? "Manager capability projection shown." : "Practitioner projection shown. Finance work is not exposed or counted.")
  }

  function viewSelected() {
    if (!selected || !selected.isUnread) return
    setState((current) => {
      const item = current.items.find((candidate) => candidate.id === selected.id)!
      return markActionViewed(current, {
        eventId: `view-${selected.id}`,
        idempotencyKey: `view-${selected.id}-once`,
        actorId: viewer.userId,
        occurredAt: "2026-07-14T10:01:00+01:00",
        expectedStateRevision: current.revision,
        expectedItemRevision: item.itemRevision,
        expectedSourceRevision: item.sourceRevision,
        actorCapabilities: [...viewer.capabilities, "action_center.claim", "action_center.defer", "action_center.source_reconcile"],
        itemId: item.id,
      })
    })
    setAnnouncement(`${selected.title} was viewed. It remains open from the same source revision.`)
    focusActionHeading()
  }

  function claimSelected() {
    if (!selected || selected.ownerId) return
    setState((current) => {
      const item = current.items.find((candidate) => candidate.id === selected.id)!
      return claimActionItem(current, {
        eventId: `claim-${selected.id}`,
        idempotencyKey: `claim-${selected.id}-once`,
        actorId: viewer.userId,
        occurredAt: "2026-07-14T10:02:00+01:00",
        expectedStateRevision: current.revision,
        expectedItemRevision: item.itemRevision,
        expectedSourceRevision: item.sourceRevision,
        actorCapabilities: [...viewer.capabilities, "action_center.claim"],
        itemId: item.id,
      })
    })
    setAnnouncement(`${selected.title} is now owned by ${role === "manager" ? "the manager" : "Lina"}. The source remains open.`)
    focusActionHeading()
  }

  function deferReply() {
    if (!selected || selected.id !== "reply-theo" || !deferReason.trim()) return
    setState((current) => {
      const item = current.items.find((candidate) => candidate.id === selected.id)!
      return deferActionItem(current, {
        eventId: "defer-reply",
        idempotencyKey: "defer-reply-once",
        actorId: viewer.userId,
        occurredAt: "2026-07-14T10:03:00+01:00",
        expectedStateRevision: current.revision,
        expectedItemRevision: item.itemRevision,
        expectedSourceRevision: item.sourceRevision,
        actorCapabilities: [...viewer.capabilities, "action_center.defer"],
        itemId: item.id,
        reviewAt: "2026-07-14T13:00:00+01:00",
        reason: deferReason,
      })
    })
    setAnnouncement("Theo's parent reply will return at 13:00. Its 15:00 source due time and open state did not change.")
    focusActionHeading()
  }

  function resolveRatioAtSource() {
    setState((current) => {
      const item = current.items.find((candidate) => candidate.id === "ratio-meadow")!
      return reconcileActionSource(current, {
        eventId: "resolve-ratio-from-source",
        idempotencyKey: "resolve-ratio-from-source-once",
        actorId: "system-live-operations",
        occurredAt: "2026-07-14T10:04:00+01:00",
        expectedStateRevision: current.revision,
        expectedItemRevision: item.itemRevision,
        expectedSourceRevision: item.sourceRevision,
        actorCapabilities: managerCapabilities,
        itemId: item.id,
        acceptedSourceRevision: item.sourceRevision + 1,
        acceptedSourceState: "RESOLVED",
        resolutionEvidencePath: "Today / Riverside / Meadow / Cover receipt 13",
      })
    })
    setAnnouncement("Meadow cover was accepted at the live source. The Action Center closed only after receiving revision 13 and its receipt.")
    focusActionHeading()
  }

  return (
    <div className="action-center-lab" data-axe-audit={axeAudit ? "axe" : "off"} data-phase={phase} data-role={role}>
      <ActionCenterAxeHarness
        enabled={axeAudit}
        signature={`action-center:${role}:${phase}:${state.revision}:${selected?.id ?? "none"}:${deferReason.trim() ? "reason" : "none"}`}
      />
      <header className="action-topbar">
        <strong>Kiddz Online</strong>
        <span>Riverside / Tuesday 14 July / 10:00</span>
        <button type="button" onClick={resetFixture} title="Reset Action Center fixture" aria-label="Reset Action Center fixture"><RefreshCw aria-hidden="true" /></button>
      </header>

      <main className="action-main">
        <header className="action-heading">
          <div><span>Today / Action Center</span><h1>Work means a source still needs something.</h1></div>
          <p>Reading, owning, or postponing an item never makes the underlying attendance, care, communication, finance, or ratio record complete.</p>
        </header>

        <section className="action-toolbar" aria-label="Action Center context">
          <div><span>Viewing as</span><div className="action-role-switch" role="group" aria-label="Preview role"><button type="button" aria-pressed={role === "manager"} onClick={() => selectRole("manager")}>Manager</button><button type="button" aria-pressed={role === "practitioner"} onClick={() => selectRole("practitioner")}>Practitioner</button></div></div>
          <dl>
            <div><dt>Active</dt><dd>{projection.activeCount}</dd></div>
            <div><dt>Unread</dt><dd>{projection.unreadCount}</dd></div>
            <div><dt>Mine</dt><dd>{projection.ownedByViewerCount}</dd></div>
            <div><dt>Unassigned</dt><dd>{projection.unassignedCount}</dd></div>
          </dl>
        </section>

        <div className="action-layout">
          <div className="action-list-plane">
            {Object.entries(projection.groups).map(([group, items]) => items.length > 0 && (
              <ActionGroup
                group={group as ActionCenterGroup}
                items={items}
                key={group}
                onSelect={setSelectedId}
                selectedId={selected?.id ?? null}
              />
            ))}

            <section className="action-resolved" aria-labelledby="recently-resolved-title">
              <header><div><span>Source-confirmed history</span><h2 id="recently-resolved-title">Recently resolved</h2></div><span>{projection.recentlyResolved.length}</span></header>
              <div>{projection.recentlyResolved.map((item) => <article key={item.id}><CheckCircle2 aria-hidden="true" /><div><strong>{item.title}</strong><p>{item.resolutionEvidencePath}</p></div><span>Revision {item.sourceRevision}</span></article>)}</div>
            </section>

            <section className="action-history" aria-labelledby="action-history-title">
              <header><span>Append-only interaction history</span><h2 id="action-history-title">{state.events.length} accepted events</h2></header>
              {state.events.length ? <ol>{state.events.map((event) => <li key={event.eventId}><span>{event.occurredAt.slice(11, 16)}</span><div><strong>{event.kind.toLowerCase().replace("_", " ")}</strong><p>{event.detail}</p></div></li>)}</ol> : <p>No interaction has been accepted yet.</p>}
            </section>
          </div>

          <aside className="action-decision" aria-labelledby="action-decision-title">
            <header><span>Selected source work</span><h2 id="action-decision-title" ref={actionHeadingRef} tabIndex={-1}>{selected?.title ?? "No visible work"}</h2></header>
            {selected ? <>
              <div className="action-source-detail">
                <div className="action-source-detail__icon" data-urgency={selected.urgency}>{sourceIcon(selected)}</div>
                <div><span>{selected.sourceKind.toLowerCase().replace("_", " ")} / {sourceStateLabel(selected)}</span><p>{selected.detail}</p><small>{selected.path}</small></div>
              </div>
              <dl className="action-source-facts">
                <div><dt>Source revision</dt><dd>{selected.sourceRevision}</dd></div>
                <div><dt>Canonical due</dt><dd>{selected.dueAt?.slice(11, 16) ?? "No deadline"}</dd></div>
                <div><dt>Owner</dt><dd>{selected.ownerId ? selected.ownerId === viewer.userId ? "You" : "Another teammate" : "Unassigned"}</dd></div>
                <div><dt>Attention</dt><dd>{selected.deferredUntil ? `Returns ${selected.deferredUntil.slice(11, 16)}` : "Visible now"}</dd></div>
              </dl>

              {selected.id === "reply-theo" && !selected.deferredUntil ? <label className="action-defer-reason"><span>Reason to review at 13:00</span><textarea value={deferReason} onChange={(event) => setDeferReason(event.target.value)} placeholder="Explain why this remains open until later" /></label> : null}

              <div className="action-controls">
                {selected.isUnread ? <button type="button" className="action-secondary" onClick={viewSelected}><Eye aria-hidden="true" />Review source</button> : <div className="action-confirmation"><Check aria-hidden="true" /><span>Viewed, still {selected.sourceState.toLowerCase()}</span></div>}
                {!selected.ownerId ? <button type="button" className="action-secondary" onClick={claimSelected}><UserRoundCheck aria-hidden="true" />Claim work</button> : null}
                {selected.id === "reply-theo" && !selected.deferredUntil ? <button type="button" className="action-primary" disabled={!deferReason.trim()} onClick={deferReply}>Review at 13:00<Clock3 aria-hidden="true" /></button> : null}
                {selected.id === "ratio-meadow" ? <button type="button" className="action-primary" onClick={resolveRatioAtSource}>Record cover at source<ArrowRight aria-hidden="true" /></button> : null}
              </div>
              <p className="action-boundary">There is no generic “mark done.” The source must accept a newer revision and return evidence before this item leaves active work.</p>
            </> : <div className="action-empty"><CheckCircle2 aria-hidden="true" /><strong>No capability-visible work remains</strong><p>Counts contain only records this role can open.</p></div>}
          </aside>
        </div>
      </main>
      <p className="action-announcement" aria-live="polite">{announcement}</p>
    </div>
  )
}

function ActionGroup({ group, items, selectedId, onSelect }: {
  group: ActionCenterGroup
  items: readonly ProjectedActionCenterItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const label = groupLabels[group]
  return (
    <section className="action-group" data-group={group} aria-labelledby={`action-group-${group}`}>
      <header><div><span>{label.eyebrow}</span><h2 id={`action-group-${group}`}>{label.title}</h2></div><span>{items.length}</span></header>
      <div>{items.map((item) => (
        <button type="button" aria-pressed={selectedId === item.id} key={item.id} onClick={() => onSelect(item.id)}>
          <span className="action-item-icon" data-urgency={item.urgency}>{sourceIcon(item)}</span>
          <span className="action-item-copy"><span>{item.sourceKind.toLowerCase().replace("_", " ")}{item.isUnread ? " / new" : ""}</span><strong>{item.title}</strong><small>{item.path}</small></span>
          <span className="action-item-state">{sourceStateLabel(item)}</span>
          <ArrowRight aria-hidden="true" />
        </button>
      ))}</div>
    </section>
  )
}
