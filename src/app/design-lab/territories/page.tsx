import Image from "next/image"
import Link from "next/link"
import {
  ArrowUpRight,
  BookOpenText,
  CheckCircle2,
  CircleAlert,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react"
import daylightPreview from "../../../../docs/redesign/territories/daylight-today-desktop.png"
import signalPreview from "../../../../docs/redesign/territories/signal-today-desktop.png"
import carebookPreview from "../../../../docs/redesign/territories/carebook-today-desktop.png"
import {
  territoryDecisionEvidence,
  territoryMeta,
  territoryScoreCriteria,
  type TerritoryId,
} from "./_data"

const territoryIcons = {
  daylight: Sun,
  signal: RadioTower,
  carebook: BookOpenText,
} satisfies Record<TerritoryId, typeof Sun>

const territoryPreviews = {
  daylight: daylightPreview,
  signal: signalPreview,
  carebook: carebookPreview,
} satisfies Record<TerritoryId, typeof daylightPreview>

const territoryIds = (Object.keys(territoryMeta) as TerritoryId[]).sort(
  (left, right) => territoryDecisionEvidence[left].rank - territoryDecisionEvidence[right].rank,
)

export default function TerritoryIndexPage() {
  return (
    <main className="territory-index">
      <header className="territory-selection-bar">
        <span className="territory-selection-brand">Kiddz <strong>Online</strong></span>
        <span>Creative direction</span>
        <span className="territory-selection-status"><span aria-hidden="true" />Decision required</span>
      </header>

      <div className="territory-selection-body">
        <section className="territory-selection-intro" aria-labelledby="territory-selection-title">
          <p className="territory-index__eyebrow">Production constitution gate</p>
          <h1 id="territory-selection-title">Choose the system we will build.</h1>
          <p>
            The three directions contain the same nursery truth and workflows. This decision
            chooses hierarchy, typography, color, motion, and brand expression, not features.
          </p>
        </section>

        <section className="territory-recommendation" aria-labelledby="territory-recommendation-title">
          <span className="territory-recommendation__mark" aria-hidden="true"><Sparkles /></span>
          <div>
            <p>Research recommendation · 89.9 / 100</p>
            <h2 id="territory-recommendation-title">Advance Daylight.</h2>
            <span>
              It is the only direction that leads both on distinctive Kiddz ownership and emotional
              fit while remaining above the operational and accessibility gate.
            </span>
          </div>
          <Link href="/design-lab/territories/daylight">
            Open Daylight <ArrowUpRight aria-hidden="true" />
          </Link>
        </section>

        <section className="territory-comparison" aria-labelledby="territory-comparison-title">
          <div className="territory-section-heading">
            <div>
              <p className="territory-index__eyebrow">Same state, different system</p>
              <h2 id="territory-comparison-title">Compare the actual product directions.</h2>
            </div>
            <p>Riverside · Tuesday 09:18 · identical data and work queue</p>
          </div>

          <div className="territory-index__grid">
            {territoryIds.map((id) => {
              const Icon = territoryIcons[id]
              const territory = territoryMeta[id]
              const evidence = territoryDecisionEvidence[id]

              return (
                <article className={`territory-index__item territory-index__item--${id}`} key={id}>
                  <header>
                    <span className="territory-index__rank">0{evidence.rank}</span>
                    <span className="territory-index__icon" aria-hidden="true"><Icon /></span>
                    <div>
                      <span className="territory-index__short">{territory.short}</span>
                      <h3>{territory.name}</h3>
                    </div>
                    <span className="territory-index__score"><strong>{evidence.total.toFixed(1)}</strong>/100</span>
                  </header>

                  <div className="territory-index__preview">
                    <Image
                      alt={`${territory.name} Today prototype showing the Riverside nursery state`}
                      loading="eager"
                      sizes="(max-width: 900px) 100vw, 33vw"
                      src={territoryPreviews[id]}
                    />
                  </div>

                  <p className="territory-index__verdict">{evidence.verdict}</p>
                  <dl className="territory-index__evidence">
                    <div>
                      <dt><CheckCircle2 aria-hidden="true" />Best at</dt>
                      <dd>{evidence.bestAt}</dd>
                    </div>
                    <div>
                      <dt><CircleAlert aria-hidden="true" />Watch</dt>
                      <dd>{evidence.watchout}</dd>
                    </div>
                  </dl>
                  {evidence.scoreNote && <p className="territory-index__score-note">{evidence.scoreNote}</p>}
                  <Link className="territory-index__open" href={`/design-lab/territories/${id}`}>
                    Open interactive prototype <ArrowUpRight aria-hidden="true" />
                  </Link>
                </article>
              )
            })}
          </div>
        </section>

        <section className="territory-scorecard" aria-labelledby="territory-scorecard-title">
          <div className="territory-section-heading">
            <div>
              <p className="territory-index__eyebrow">Weighted evidence</p>
              <h2 id="territory-scorecard-title">Why Daylight leads.</h2>
            </div>
            <p>Scores out of 5 · totals out of 100</p>
          </div>
          <div className="territory-scorecard__scroll" tabIndex={0} aria-label="Scrollable territory scorecard">
            <table>
              <caption>Creative territory weighted scorecard</caption>
              <thead>
                <tr>
                  <th scope="col">Criterion</th>
                  <th scope="col">Weight</th>
                  {territoryIds.map((id) => <th scope="col" key={id}>{territoryMeta[id].name}</th>)}
                </tr>
              </thead>
              <tbody>
                {territoryScoreCriteria.map((criterion) => (
                  <tr key={criterion.id}>
                    <th scope="row">{criterion.label}</th>
                    <td>{criterion.weight}%</td>
                    {territoryIds.map((id) => (
                      <td key={id}>
                        {criterion.scores[id].toFixed(1)}
                        {id === "carebook" && criterion.id === "accessibility" ? <sup>1</sup> : null}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="territory-scorecard__total">
                  <th scope="row">Weighted total</th>
                  <td>100%</td>
                  {territoryIds.map((id) => <td key={id}>{territoryDecisionEvidence[id].total.toFixed(1)}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="territory-scorecard__note">
            <sup>1</sup> Carebook&apos;s original 3.8 accessibility score is retained. Its prototype was
            remediated and now passes the same computed floor, but the implementation cost remains evidence.
          </p>
        </section>

        <section className="territory-decision-boundary" aria-labelledby="territory-boundary-title">
          <div className="territory-decision-boundary__heading">
            <ShieldCheck aria-hidden="true" />
            <div>
              <p className="territory-index__eyebrow">Decision boundary</p>
              <h2 id="territory-boundary-title">One language, not a visual blend.</h2>
            </div>
          </div>
          <div className="territory-decision-boundary__columns">
            <div>
              <h3>Choosing locks</h3>
              <p>Brand hierarchy, type roles, palette behavior, geometry, motion character, and the production component language.</p>
            </div>
            <div>
              <h3>Choosing does not change</h3>
              <p>Features, permissions, database truth, legacy routes, native contracts, accessibility gates, or parity obligations.</p>
            </div>
          </div>
          <p className="territory-decision-boundary__status">
            No production direction is selected. The evidence recommends Daylight; final selection remains an explicit product decision.
          </p>
        </section>
      </div>
    </main>
  )
}
