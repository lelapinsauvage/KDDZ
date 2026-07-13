import { ArrowLeft, ArrowUpRight, CheckCircle2, CircleDot, FlaskConical } from "lucide-react"
import Link from "next/link"
import { AxeAuditHarness } from "@/components/design-lab/axe-audit-harness"
import { directionById } from "../_data"
import { evaluationCriteria, rankedBrandEvaluations } from "../_evaluation"

type EvaluationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const statusLabel = {
  advance: "Advance to final",
  challenger: "Keep as challenger",
  hold: "Hold",
} as const

export default async function BrandDirectionEvaluationPage({ searchParams }: EvaluationPageProps) {
  const params = await searchParams
  const axeAuditEnabled = params.audit === "axe"
  const finalists = rankedBrandEvaluations.filter((evaluation) => evaluation.status === "advance")
  const challenger = rankedBrandEvaluations.find((evaluation) => evaluation.status === "challenger")

  return (
    <main className="evaluation-room" data-axe-audit={axeAuditEnabled ? "axe" : undefined}>
      <AxeAuditHarness
        activeRootSelector='.evaluation-room[data-axe-audit="axe"]'
        auditNodeId="kiddz-brand-evaluation-axe-audit"
        auditTriggerId="kiddz-run-brand-evaluation-axe-audit"
        enabled={axeAuditEnabled}
        signature="brand-evaluation"
        surfaceToken="--evaluation-surface"
      />

      <header className="evaluation-masthead">
        <Link href="/design-lab/brand-directions"><ArrowLeft aria-hidden="true" /> Direction room</Link>
        <div>Kiddz <span>Online</span></div>
        <p><span aria-hidden="true" /> Decision open</p>
      </header>

      <section className="evaluation-intro" aria-labelledby="evaluation-title">
        <p>Research verdict · expert heuristic · 2026-07-13</p>
        <h1 id="evaluation-title">What survives the pressure test?</h1>
        <span>
          Seven weighted criteria test each system against nursery truth, ownability, emotional
          range, product scale, accessibility, motion, and brand-world breadth. This ranks the
          directions; it does not lock production.
        </span>
        <dl>
          <div><dt>Systems</dt><dd>6</dd></div>
          <div><dt>Criteria</dt><dd>7</dd></div>
          <div><dt>Weight</dt><dd>100</dd></div>
          <div><dt>Production</dt><dd>Paused</dd></div>
        </dl>
      </section>

      <section className="evaluation-shortlist" aria-labelledby="shortlist-title">
        <header>
          <span>Research shortlist</span>
          <h2 id="shortlist-title">Two finalists. One useful challenger.</h2>
          <p>The finalists win for different reasons, so neither should be diluted into a hybrid before the decision.</p>
        </header>
        <div>
          {finalists.map((evaluation, index) => {
            const direction = directionById[evaluation.directionId]
            return (
              <article key={direction.id}>
                <span>Finalist {index + 1} · {evaluation.total}/100</span>
                <h3>{direction.name}</h3>
                <p>{evaluation.evidence}</p>
                <Link href={`/design-lab/brand-directions?direction=${direction.id}`}>Open direction <ArrowUpRight aria-hidden="true" /></Link>
              </article>
            )
          })}
          {challenger ? (
            <article className="is-challenger">
              <span>Challenger · {challenger.total}/100</span>
              <h3>{directionById[challenger.directionId].name}</h3>
              <p>{challenger.evidence}</p>
              <Link href={`/design-lab/brand-directions?direction=${challenger.directionId}`}>Open direction <ArrowUpRight aria-hidden="true" /></Link>
            </article>
          ) : null}
        </div>
      </section>

      <section className="evaluation-ranking" aria-labelledby="ranking-title">
        <header>
          <span>Weighted ranking</span>
          <h2 id="ranking-title">Every point has a declared reason.</h2>
          <p>Scores are a transparent expert heuristic, not user-research or brand-recognition evidence.</p>
        </header>
        <div className="evaluation-table-wrap">
          <table>
            <caption className="sr-only">Weighted evaluation of six Kiddz Online brand directions</caption>
            <thead>
              <tr><th>Rank</th><th>Direction</th><th>Score</th><th>Verdict</th><th>What it must prove</th></tr>
            </thead>
            <tbody>
              {rankedBrandEvaluations.map((evaluation, index) => {
                const direction = directionById[evaluation.directionId]
                return (
                  <tr key={direction.id}>
                    <td>{String(index + 1).padStart(2, "0")}</td>
                    <th scope="row"><Link href={`/design-lab/brand-directions?direction=${direction.id}`}>{direction.name}</Link><span>{direction.short}</span></th>
                    <td><strong>{evaluation.total}</strong><span>/ 100</span></td>
                    <td data-status={evaluation.status}><span aria-hidden="true" />{statusLabel[evaluation.status]}</td>
                    <td>{evaluation.mustProve}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="evaluation-criteria" aria-labelledby="criteria-title">
        <header>
          <span>Scoring constitution</span>
          <h2 id="criteria-title">The criteria stay fixed while the work changes.</h2>
        </header>
        <div>
          {evaluationCriteria.map((criterion, index) => (
            <article key={criterion.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{criterion.name}</h3><p>{criterion.question}</p></div>
              <strong>{criterion.weight}%</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="evaluation-detail" aria-labelledby="detail-title">
        <header>
          <span>Direction-by-direction evidence</span>
          <h2 id="detail-title">Why it advances, challenges, or stops.</h2>
        </header>
        <div>
          {rankedBrandEvaluations.map((evaluation) => {
            const direction = directionById[evaluation.directionId]
            return (
              <article key={direction.id}>
                <header>
                  <span>{direction.number}</span>
                  <div><h3>{direction.name}</h3><p>{statusLabel[evaluation.status]} · {evaluation.total}/100</p></div>
                </header>
                <dl>
                  <div><dt><CheckCircle2 aria-hidden="true" /> Evidence</dt><dd>{evaluation.evidence}</dd></div>
                  <div><dt><FlaskConical aria-hidden="true" /> Pressure</dt><dd>{evaluation.pressure}</dd></div>
                  <div><dt><CircleDot aria-hidden="true" /> Asset priority</dt><dd>{evaluation.assetPriority}</dd></div>
                </dl>
              </article>
            )
          })}
        </div>
      </section>

      <footer className="evaluation-boundary">
        <strong>No production winner is selected.</strong>
        <span>The next irreversible act is the brand lock. Components and page migration remain paused.</span>
        <Link href="/design-lab/brand-directions">Review all six systems <ArrowUpRight aria-hidden="true" /></Link>
      </footer>
    </main>
  )
}
