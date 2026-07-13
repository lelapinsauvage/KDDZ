"use client"

import { AnimatePresence, MotionConfig, motion } from "motion/react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileCheck2,
  Heart,
  Leaf,
  LockKeyhole,
  MessageCircle,
  Moon,
  ShieldCheck,
  UserCheck,
  UsersRound,
  Utensils,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"
import {
  finalistDefinitions,
  finalistIds,
  incidentFixture,
  operationsFixture,
  parentFixture,
  type FinalistId,
} from "../../_finalist-data"

type ReviewState = "idle" | "error" | "approved"

const spring = { type: "spring" as const, stiffness: 390, damping: 36, mass: 0.72 }
const recordTransition = { type: "spring" as const, stiffness: 250, damping: 32, mass: 0.88 }

export function FinalistProofRoom({
  axeAuditEnabled,
  initialFinalist,
}: {
  axeAuditEnabled: boolean
  initialFinalist: FinalistId
}) {
  const [activeId, setActiveId] = useState<FinalistId>(initialFinalist)
  const [coverOpen, setCoverOpen] = useState(false)
  const [reviewNote, setReviewNote] = useState("")
  const [reviewState, setReviewState] = useState<ReviewState>("idle")
  const [parentPreview, setParentPreview] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const active = finalistDefinitions[activeId]

  const selectFinalist = (id: FinalistId) => {
    setActiveId(id)
    setCoverOpen(false)
    setReviewNote("")
    setReviewState("idle")
    setParentPreview(false)
    setAnnouncement(`${finalistDefinitions[id].name} proof loaded.`)
    window.history.replaceState(null, "", `?direction=${id}`)
  }

  const toggleCover = () => {
    setCoverOpen((current) => !current)
    setAnnouncement(coverOpen ? "Cover plan collapsed." : "Qualified cover plan expanded.")
  }

  const reviewIncident = () => {
    if (reviewNote.trim().length < 10) {
      setReviewState("error")
      setAnnouncement("Manager review note is required before family delivery.")
      return
    }
    setReviewState("approved")
    setAnnouncement("Manager review recorded. Family delivery is prepared and acknowledgment remains pending.")
  }

  const toggleParentPreview = () => {
    setParentPreview((current) => !current)
    setAnnouncement(parentPreview ? "Family delivery preview closed." : "Family-safe delivery preview opened.")
  }

  return (
    <MotionConfig reducedMotion="user" transition={activeId === "kinetic-kindness" ? spring : recordTransition}>
      <main
        className="finalist-room"
        data-axe-audit={axeAuditEnabled ? "axe" : undefined}
        data-finalist={activeId}
      >
        <AxeAuditHarness
          activeRootSelector='.finalist-room[data-axe-audit="axe"]'
          auditNodeId="kiddz-finalist-proof-axe-audit"
          auditTriggerId="kiddz-run-finalist-proof-axe-audit"
          enabled={axeAuditEnabled}
          signature={`${activeId}:${coverOpen}:${reviewState}:${parentPreview}`}
          surfaceToken="--finalist-surface"
        />
        <div aria-live="polite" className="sr-only">{announcement}</div>

        <header className="finalist-masthead">
          <Link href="/design-lab/brand-directions/evaluation"><ArrowLeft aria-hidden="true" /> Research verdict</Link>
          <FinalistWordmark finalist={activeId} />
          <p><span aria-hidden="true" /> Final proof · no selection</p>
        </header>

        <section className="finalist-intro" aria-labelledby="finalist-title">
          <p>Controlled proof round · identical content and behavior</p>
          <h1 id="finalist-title">Same work. Two identities. No hiding place.</h1>
          <span>
            Each finalist must carry live consequence, a high-trust record, a real form,
            dense evidence, semantic states, and a family-safe projection without changing the facts.
          </span>
        </section>

        <nav className="finalist-switcher" aria-label="Brand finalists">
          {finalistIds.map((id, index) => {
            const definition = finalistDefinitions[id]
            return (
              <button
                aria-current={activeId === id ? "page" : undefined}
                className={activeId === id ? "is-active" : undefined}
                key={id}
                onClick={() => selectFinalist(id)}
                type="button"
              >
                <span>0{index + 1}</span>
                <strong>{definition.name}</strong>
                <small>{definition.short}</small>
              </button>
            )
          })}
          <div>
            <span>Question under test</span>
            <p>{active.proofQuestion}</p>
          </div>
        </nav>

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="finalist-proof-stack"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: 12 }}
            key={activeId}
          >
            <OperationsProof coverOpen={coverOpen} onToggleCover={toggleCover} />
            <IncidentProof
              note={reviewNote}
              onNoteChange={(value) => {
                setReviewNote(value)
                if (reviewState === "error") setReviewState("idle")
              }}
              onReview={reviewIncident}
              state={reviewState}
            />
            <ParentProof onTogglePreview={toggleParentPreview} previewOpen={parentPreview} />
          </motion.div>
        </AnimatePresence>

        <footer className="finalist-boundary">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>Final brand lock still open.</strong>
            <span>{active.motion} Production components, tokens, and page migration remain paused.</span>
          </div>
          <Link href="/design-lab/brand-directions/evaluation">Return to weighted verdict <ArrowRight aria-hidden="true" /></Link>
        </footer>
      </main>
    </MotionConfig>
  )
}

function FinalistWordmark({ finalist }: { finalist: FinalistId }) {
  if (finalist === "kinetic-kindness") {
    return (
      <div className="finalist-wordmark finalist-wordmark--kinetic" aria-label="Kiddz Online" role="img">
        <strong>Kiddz</strong><span><i aria-hidden="true" />nline</span>
      </div>
    )
  }
  return (
    <div className="finalist-wordmark finalist-wordmark--record" aria-label="Kiddz Online" role="img">
      <strong>Kiddz</strong><em>online</em>
    </div>
  )
}

function ProofHeader({ id, number, label, title, description }: { id: string; number: string; label: string; title: string; description: string }) {
  return (
    <header className="proof-header">
      <span>{number}</span>
      <div><p>{label}</p><h2 id={id}>{title}</h2><small>{description}</small></div>
    </header>
  )
}

function OperationsProof({ coverOpen, onToggleCover }: { coverOpen: boolean; onToggleCover: () => void }) {
  return (
    <section className="finalist-proof finalist-proof--operations" aria-labelledby="operations-proof-title">
      <ProofHeader
        description="A manager must understand current safety, the next consequence, and the owner in three seconds."
        id="operations-proof-title"
        label="Live operations · Riverside · 09:18"
        number="01"
        title={operationsFixture.headline}
      />
      <div className="operations-summary" aria-label="Current branch totals" role="group">
        {operationsFixture.totals.map((total) => <span key={total.label}><strong>{total.value}</strong>{total.label}</span>)}
      </div>
      <div className="operations-workspace">
        <div className="operations-table" role="table" aria-label="Riverside live room state">
          <div className="operations-table__head" role="row">
            <span role="columnheader">Room</span><span role="columnheader">Children</span><span role="columnheader">Team</span><span role="columnheader">State and next change</span>
          </div>
          {operationsFixture.rooms.map((room) => (
            <div className={`operations-table__row is-${room.state}`} key={room.name} role="row">
              <span role="cell"><i aria-hidden="true">{room.state === "safe" ? <Check /> : room.state === "warning" ? <Clock3 /> : <AlertTriangle />}</i><strong>{room.name}</strong></span>
              <span role="cell"><strong>{room.children}</strong></span>
              <span role="cell"><UsersRound aria-hidden="true" />{room.staff}</span>
              <span role="cell"><strong>{room.label}</strong><small>{room.detail}</small></span>
            </div>
          ))}
        </div>
        <aside className="cover-proof" aria-labelledby="cover-proof-title">
          <span>Needs you · due in 3h 12m</span>
          <h3 id="cover-proof-title">{operationsFixture.cover.title}</h3>
          <p>{operationsFixture.cover.consequence}</p>
          <button aria-expanded={coverOpen} onClick={onToggleCover} type="button">
            {coverOpen ? "Hide cover plan" : "Open cover plan"}
            {coverOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
          </button>
          <AnimatePresence initial={false}>
            {coverOpen ? (
              <motion.dl animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }}>
                <div><dt>Candidate</dt><dd>{operationsFixture.cover.candidate}</dd></div>
                <div><dt>Consequence</dt><dd>{operationsFixture.cover.impact}</dd></div>
                <div><dt>Owner</dt><dd>{operationsFixture.cover.owner}</dd></div>
                <div><dt>Source</dt><dd>{operationsFixture.cover.source}</dd></div>
              </motion.dl>
            ) : null}
          </AnimatePresence>
        </aside>
      </div>
    </section>
  )
}

function IncidentProof({
  note,
  onNoteChange,
  onReview,
  state,
}: {
  note: string
  onNoteChange: (value: string) => void
  onReview: () => void
  state: ReviewState
}) {
  return (
    <section className="finalist-proof finalist-proof--incident" aria-labelledby="incident-proof-title">
      <ProofHeader
        description="A manager must verify source, chronology, evidence, and family consequence before completion."
        id="incident-proof-title"
        label="High-trust record · accident revision 3"
        number="02"
        title={`Review ${incidentFixture.child}'s accident record`}
      />
      <div className="incident-workspace">
        <article className="incident-record">
          <header>
            <div><span>Occurred {incidentFixture.occurredAt}</span><h3>{incidentFixture.cause}</h3><p>{incidentFixture.room} · {incidentFixture.location}</p></div>
            <span className="incident-state"><Clock3 aria-hidden="true" />Manager review</span>
          </header>
          <dl className="incident-facts">
            <div><dt>First aid</dt><dd>{incidentFixture.firstAid}</dd></div>
            <div><dt>Witness</dt><dd>{incidentFixture.witness}</dd></div>
            <div><dt>Manager</dt><dd>{incidentFixture.manager}</dd></div>
            <div><dt>Source</dt><dd>{incidentFixture.revision}</dd></div>
          </dl>
          <div className="incident-evidence">
            <h4>Evidence readiness</h4>
            {incidentFixture.evidence.map((item) => (
              <div key={item.label}>
                <i aria-hidden="true">{item.status === "complete" ? <CheckCircle2 /> : <Clock3 />}</i>
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              </div>
            ))}
          </div>
          <ol className="incident-timeline">
            {incidentFixture.timeline.map((event) => <li key={event.time}><time>{event.time}</time><span><strong>{event.label}</strong><small>{event.source}</small></span></li>)}
          </ol>
        </article>

        <form className="review-form" onSubmit={(event) => { event.preventDefault(); onReview() }}>
          <header><FileCheck2 aria-hidden="true" /><div><span>Manager action</span><h3>Approve family delivery</h3></div></header>
          <p>Approval publishes the family-safe summary. Explicit parent acknowledgment remains a separate obligation.</p>
          <label htmlFor="manager-review-note">Manager review note</label>
          <textarea
            aria-describedby={state === "error" ? "manager-review-error" : "manager-review-help"}
            id="manager-review-note"
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Record what you checked and any follow-up..."
            value={note}
          />
          {state === "error" ? <span className="review-form__error" id="manager-review-error" role="alert">Add a review note of at least 10 characters.</span> : <small id="manager-review-help">Stored with the review event and source revision.</small>}
          <button disabled={state === "approved"} type="submit">
            {state === "approved" ? <><Check aria-hidden="true" /> Review recorded</> : <>Approve and prepare delivery <ArrowRight aria-hidden="true" /></>}
          </button>
          <AnimatePresence initial={false}>
            {state === "approved" ? (
              <motion.div animate={{ opacity: 1, y: 0 }} className="review-form__success" initial={{ opacity: 0, y: 8 }} role="status">
                <UserCheck aria-hidden="true" /><span><strong>Family delivery prepared</strong><small>Parent acknowledgment remains pending.</small></span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>
      </div>
    </section>
  )
}

function ParentProof({ onTogglePreview, previewOpen }: { onTogglePreview: () => void; previewOpen: boolean }) {
  return (
    <section className="finalist-proof finalist-proof--parent" aria-labelledby="parent-proof-title">
      <ProofHeader
        description="The family sees a warm, useful projection without internal notes, staff-only provenance, or false certainty."
        id="parent-proof-title"
        label={`Family projection · prepared ${parentFixture.preparedAt}`}
        number="03"
        title={`${parentFixture.child}'s day is ready to share`}
      />
      <div className="parent-workspace">
        <article className="daily-story">
          <header><div><span>{parentFixture.date}</span><h3>{parentFixture.room}</h3></div><span><LockKeyhole aria-hidden="true" />Family safe</span></header>
          <div className="daily-story__observations">
            {parentFixture.observations.map((observation, index) => {
              const Icon = index === 0 || index === 1 ? Utensils : index === 2 ? Moon : Heart
              return <div key={observation.label}><Icon aria-hidden="true" /><span>{observation.label}</span><strong>{observation.value}</strong></div>
            })}
          </div>
          <blockquote>{parentFixture.note}</blockquote>
          <div className="garden-note"><Leaf aria-hidden="true" /><span><strong>Coming up</strong>{parentFixture.upcoming}</span></div>
          <footer><span>{parentFixture.reportRevision}</span><small>{parentFixture.privacy}</small></footer>
        </article>
        <aside className="delivery-proof">
          <span>Parent delivery</span>
          <h3>Show the useful day, not the internal system.</h3>
          <p>The same source becomes shorter, warmer, and privacy-safe without changing recorded facts.</p>
          <button aria-expanded={previewOpen} onClick={onTogglePreview} type="button">
            {previewOpen ? "Close parent preview" : "Preview parent delivery"}
            <MessageCircle aria-hidden="true" />
          </button>
          <AnimatePresence initial={false}>
            {previewOpen ? (
              <motion.div animate={{ opacity: 1, scale: 1 }} className="family-message" exit={{ opacity: 0, scale: .98 }} initial={{ opacity: 0, scale: .98 }}>
                <span>Kiddz Online · Riverside</span>
                <strong>{parentFixture.child} had a full day in Meadow.</strong>
                <p>{parentFixture.note}</p>
                <small>Lunch: a little · No symptoms observed</small>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </aside>
      </div>
    </section>
  )
}
