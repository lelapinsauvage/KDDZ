"use client"

import { AnimatePresence, MotionConfig, motion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Check,
  CircleDot,
  FileText,
  HeartHandshake,
  ImageIcon,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"
import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"
import { identityDecisionCriteria, identityWorldDefinitions } from "../../_identity-world-data"
import { finalistIds, type FinalistId } from "../../_finalist-data"

const kineticSpring = { type: "spring" as const, stiffness: 360, damping: 31, mass: 0.72 }
const recordSpring = { type: "spring" as const, stiffness: 230, damping: 30, mass: 0.88 }

export function IdentityWorldRoom({
  axeAuditEnabled,
  initialFinalist,
}: {
  axeAuditEnabled: boolean
  initialFinalist: FinalistId
}) {
  const [activeId, setActiveId] = useState<FinalistId>(initialFinalist)
  const [motionRun, setMotionRun] = useState(0)
  const [announcement, setAnnouncement] = useState("")
  const seedVideo = useRef<HTMLVideoElement>(null)
  const active = identityWorldDefinitions[activeId]

  const selectFinalist = (id: FinalistId) => {
    setActiveId(id)
    setMotionRun(0)
    setAnnouncement(`${identityWorldDefinitions[id].name} identity world loaded.`)
    const params = new URLSearchParams(window.location.search)
    params.set("direction", id)
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
  }

  const replaySignature = () => {
    setMotionRun((current) => current + 1)
    setAnnouncement(`${active.motion.name} motion signature replayed.`)
  }

  const replaySeed = () => {
    if (!seedVideo.current) return
    seedVideo.current.currentTime = 0
    void seedVideo.current.play()
    setAnnouncement("Approved Kiddz Online logo seed replayed.")
  }

  return (
    <MotionConfig reducedMotion="user" transition={activeId === "kinetic-kindness" ? kineticSpring : recordSpring}>
      <main
        className="identity-world-room"
        data-axe-audit={axeAuditEnabled ? "axe" : undefined}
        data-finalist={activeId}
      >
        <AxeAuditHarness
          activeRootSelector='.identity-world-room[data-axe-audit="axe"]'
          auditNodeId="kiddz-identity-world-axe-audit"
          auditTriggerId="kiddz-run-identity-world-axe-audit"
          enabled={axeAuditEnabled}
          signature={activeId}
          surfaceToken="--identity-surface"
        />
        <div aria-live="polite" className="sr-only">{announcement}</div>

        <header className="identity-world-masthead">
          <Link href="/design-lab/brand-directions/finalists"><ArrowLeft aria-hidden="true" /> Product proof</Link>
          <IdentityWordmark finalist={activeId} />
          <span><i aria-hidden="true" /> Identity proof · no selection</span>
        </header>

        <section className="identity-world-hero" aria-labelledby="identity-world-title">
          <div>
            <p>Finalist identity worlds · controlled meaning</p>
            <h1 id="identity-world-title">A brand people can feel before they read the name.</h1>
          </div>
          <p>
            The same care truth is tested through mark, memory asset, voice, image construction,
            motion, and real applications. This is identity evidence, not production UI.
          </p>
        </section>

        <nav className="identity-world-switcher" aria-label="Identity world finalists">
          {finalistIds.map((id, index) => {
            const direction = identityWorldDefinitions[id]
            return (
              <button
                aria-current={activeId === id ? "page" : undefined}
                className={activeId === id ? "is-active" : undefined}
                key={id}
                onClick={() => selectFinalist(id)}
                type="button"
              >
                <span>0{index + 1}</span>
                <strong>{direction.name}</strong>
                <small>{direction.memoryAsset}</small>
              </button>
            )
          })}
          <div>
            <span>Decision rule</span>
            <strong>Choose the world we can own for years, not the prettiest isolated screen.</strong>
          </div>
        </nav>

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="identity-world-stack"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: 12 }}
            key={activeId}
          >
            <IdentityCore activeId={activeId} onReplaySeed={replaySeed} seedVideo={seedVideo} />
            <VoiceProof activeId={activeId} />
            <ImageLanguageProof activeId={activeId} />
            <MotionProof activeId={activeId} motionRun={motionRun} onReplay={replaySignature} />
            <ApplicationProof activeId={activeId} />
            <DecisionProof activeId={activeId} />
          </motion.div>
        </AnimatePresence>

        <footer className="identity-world-boundary">
          <ShieldCheck aria-hidden="true" />
          <div>
            <strong>Production brand lock remains open.</strong>
            <span>Identity concepts, not final trademark, illustration, photography, sound, or production assets.</span>
          </div>
          <Link href="/design-lab/brand-directions/evaluation">Weighted verdict <ArrowRight aria-hidden="true" /></Link>
        </footer>
      </main>
    </MotionConfig>
  )
}

function IdentityWordmark({ finalist }: { finalist: FinalistId }) {
  return (
    <div className={`identity-wordmark identity-wordmark--${finalist}`} aria-label="Kiddz Online" role="img">
      <strong>Kiddz</strong><span><i aria-hidden="true" />nline</span>
    </div>
  )
}

function SectionHeader({ number, label, title, detail, id }: { number: string; label: string; title: string; detail: string; id: string }) {
  return (
    <header className="identity-section-header">
      <span>{number}</span>
      <div><p>{label}</p><h2 id={id}>{title}</h2><small>{detail}</small></div>
    </header>
  )
}

function IdentityCore({ activeId, onReplaySeed, seedVideo }: { activeId: FinalistId; onReplaySeed: () => void; seedVideo: React.RefObject<HTMLVideoElement | null> }) {
  const active = identityWorldDefinitions[activeId]
  return (
    <section className="identity-world-section identity-core" aria-labelledby="identity-core-title">
      <SectionHeader
        detail="The approved animated wordmark stays the common seed. Each world must extend it into a memory system without inventing a disconnected logo."
        id="identity-core-title"
        label="Strategy, mark, and memory"
        number="01"
        title={active.thesis}
      />
      <div className="identity-core-grid">
        <article className="identity-seed-card">
          <header><span>Locked seed</span><strong>Approved Kiddz Online intro</strong></header>
          <video
            aria-label="Approved Kiddz Online animated logo"
            muted
            playsInline
            poster="/brand/kiddz-online-logo-intro-poster.png"
            preload="metadata"
            ref={seedVideo}
            src="/brand/kiddz-online-logo-intro.mp4"
          >
            <track
              kind="captions"
              label="English"
              src="/brand/kiddz-online-logo-intro.en.vtt"
              srcLang="en"
            />
          </video>
          <button onClick={onReplaySeed} type="button"><Play aria-hidden="true" /> Replay approved seed</button>
        </article>
        <article className="identity-memory-card">
          <span>Distinctive asset hypothesis</span>
          <IdentityMark finalist={activeId} />
          <h3>{active.memoryAsset}</h3>
          <p>{active.markDescription}</p>
          <small>{active.memoryRule}</small>
          <div className="identity-mark-scales" aria-label="Mark at small sizes" role="group">
            {[64, 32, 16].map((size) => <IdentityMark finalist={activeId} key={size} size={size} />)}
          </div>
        </article>
      </div>
      <div className="identity-palette" aria-label={`${active.name} color roles`} role="list">
        {active.palette.map((color) => (
          <div key={color.name} role="listitem">
            <i aria-hidden="true" style={{ background: color.value }} />
            <span><strong>{color.name}</strong><small>{color.job}</small></span>
            <code>{color.value}</code>
          </div>
        ))}
      </div>
    </section>
  )
}

function IdentityMark({ finalist, size = 112 }: { finalist: FinalistId; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`identity-mark identity-mark--${finalist}`}
      style={{ "--identity-mark-size": `${size}px` } as React.CSSProperties}
    >
      <i /><b />
    </span>
  )
}

function VoiceProof({ activeId }: { activeId: FinalistId }) {
  const active = identityWorldDefinitions[activeId]
  return (
    <section className="identity-world-section identity-voice" aria-labelledby="identity-voice-title">
      <SectionHeader
        detail="Meaning stays fixed. Tone may change rhythm and warmth, but never source truth, consequence, or unfinished work."
        id="identity-voice-title"
        label="Voice under consequence"
        number="02"
        title="Sound unmistakable without becoming cute or vague."
      />
      <div className="identity-voice-grid">
        {active.voice.map((example) => (
          <article key={example.moment}>
            <span>{example.moment}</span>
            <blockquote>{example.expression}</blockquote>
            <dl><dt>Source meaning</dt><dd>{example.source}</dd><dt>Rule</dt><dd>{example.rule}</dd></dl>
          </article>
        ))}
      </div>
    </section>
  )
}

function ImageLanguageProof({ activeId }: { activeId: FinalistId }) {
  const active = identityWorldDefinitions[activeId]
  return (
    <section className="identity-world-section identity-image" aria-labelledby="identity-image-title">
      <SectionHeader
        detail="This is the construction grammar for commissioned assets. It does not pass placeholder art off as a finished illustration library."
        id="identity-image-title"
        label="Image and illustration language"
        number="03"
        title={active.imageSystem.name}
      />
      <div className="identity-image-grid">
        <BrandConstruction finalist={activeId} />
        <article className="identity-image-rules">
          <span>Governing principle</span>
          <h3>{active.imageSystem.principle}</h3>
          <ul>{active.imageSystem.construction.map((rule) => <li key={rule}><Check aria-hidden="true" />{rule}</li>)}</ul>
          <div><strong>Reject</strong>{active.imageSystem.reject.map((rule) => <span key={rule}>{rule}</span>)}</div>
        </article>
      </div>
    </section>
  )
}

function BrandConstruction({ finalist }: { finalist: FinalistId }) {
  if (finalist === "kinetic-kindness") {
    return (
      <figure className="brand-construction brand-construction--kinetic">
        <figcaption><span>Observe</span><span>Handle</span><span>Share</span></figcaption>
        <div>
          <span><CircleDot aria-hidden="true" /><small>Alma arrives</small></span>
          <i aria-hidden="true" />
          <span><ShieldCheck aria-hidden="true" /><small>Cover assigned</small></span>
          <i aria-hidden="true" />
          <span><HeartHandshake aria-hidden="true" /><small>Family informed</small></span>
        </div>
        <blockquote>One care story. Every handoff stays connected.</blockquote>
      </figure>
    )
  }
  return (
    <figure className="brand-construction brand-construction--record">
      <figcaption><span>Meadow room</span><span>5 August · revision 11</span></figcaption>
      <blockquote>“Noah chose the watering cans and settled with Jules.”</blockquote>
      <div>
        <span><BookOpenText aria-hidden="true" /><small>Observed 14:06</small></span>
        <span><FileText aria-hidden="true" /><small>Recorded 14:18</small></span>
        <span><BadgeCheck aria-hidden="true" /><small>Shared 14:24</small></span>
      </div>
      <p>Care note by Jules M. · family-safe projection</p>
    </figure>
  )
}

function MotionProof({ activeId, motionRun, onReplay }: { activeId: FinalistId; motionRun: number; onReplay: () => void }) {
  const active = identityWorldDefinitions[activeId]
  return (
    <section className="identity-world-section identity-motion" aria-labelledby="identity-motion-title">
      <SectionHeader
        detail="A signature must explain change and remain optional. It cannot delay frequent work or become decorative background activity."
        id="identity-motion-title"
        label="Recognizable behavior"
        number="04"
        title={active.motion.name}
      />
      <div className="identity-motion-grid">
        <div className="motion-stage" aria-label={`${active.motion.name} motion demonstration`} role="group">
          <MotionSignature finalist={activeId} run={motionRun} />
          <button onClick={onReplay} type="button"><Play aria-hidden="true" /> Replay signature</button>
        </div>
        <article>
          <Sparkles aria-hidden="true" />
          <h3>{active.motion.promise}</h3>
          <ol>{active.motion.sequence.map((step, index) => <li key={step}><span>0{index + 1}</span>{step}</li>)}</ol>
          <p><strong>Reduced motion</strong>{active.motion.reduced}</p>
        </article>
      </div>
    </section>
  )
}

function MotionSignature({ finalist, run }: { finalist: FinalistId; run: number }) {
  if (finalist === "kinetic-kindness") {
    return (
      <div className="motion-signature motion-signature--kinetic" key={`kinetic-${run}`}>
        <span aria-hidden="true" />
        <motion.i
          animate={{ x: [0, 70, 118, 70, 0], y: [0, -28, 2, -11, 0], scale: [1, .84, 1.08, .94, 1] }}
          aria-hidden="true"
          transition={{ duration: 1.5, times: [0, .28, .52, .76, 1] }}
        />
        <strong>Handled</strong>
      </div>
    )
  }
  return (
    <div className="motion-signature motion-signature--record" key={`record-${run}`}>
      {["Observed · 14:06", "Recorded · 14:18", "Shared · 14:24"].map((label, index) => (
        <motion.span
          animate={{ opacity: 1, x: 0 }}
          initial={{ opacity: 0, x: -18 }}
          key={label}
          transition={{ delay: index * .18, duration: .32 }}
        >
          <i aria-hidden="true" />{label}
        </motion.span>
      ))}
    </div>
  )
}

function ApplicationProof({ activeId }: { activeId: FinalistId }) {
  const active = identityWorldDefinitions[activeId]
  return (
    <section className="identity-world-section identity-applications" aria-labelledby="identity-applications-title">
      <SectionHeader
        detail="The world must remain recognizable when expression is constrained by a real staff, family, or brand communication job."
        id="identity-applications-title"
        label="Cross-surface identity"
        number="05"
        title="One system, three levels of expression."
      />
      <div className="identity-application-grid">
        {active.applications.map((application, index) => (
          <article className={`identity-application identity-application--${index + 1}`} key={application.surface}>
            <header>
              {index === 0 ? <BadgeCheck aria-hidden="true" /> : index === 1 ? <MessageCircle aria-hidden="true" /> : <ImageIcon aria-hidden="true" />}
              <span>{application.surface}</span>
            </header>
            <IdentityMark finalist={activeId} size={index === 2 ? 56 : 28} />
            <h3>{application.headline}</h3>
            <p>{application.detail}</p>
            {index === 0 ? <button type="button">View cover record <ArrowRight aria-hidden="true" /></button> : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function DecisionProof({ activeId }: { activeId: FinalistId }) {
  const active = identityWorldDefinitions[activeId]
  return (
    <section className="identity-world-section identity-decision" aria-labelledby="identity-decision-title">
      <SectionHeader
        detail="A final choice still requires product-owner judgment, operator evidence, trademark review, and commissioned-asset testing."
        id="identity-decision-title"
        label="Selection lens"
        number="06"
        title={`What choosing ${active.name} means`}
      />
      <div className="identity-decision-grid">
        <article><span>Strongest when</span><p>{active.strongestWhen}</p></article>
        <article><span>Kill the direction when</span><p>{active.failsWhen}</p></article>
        <ul>{identityDecisionCriteria.map((criterion) => <li key={criterion}><Check aria-hidden="true" />{criterion}</li>)}</ul>
      </div>
    </section>
  )
}
