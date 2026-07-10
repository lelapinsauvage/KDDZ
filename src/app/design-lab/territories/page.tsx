import Link from "next/link"
import { ArrowRight, BookOpenText, RadioTower, Sun } from "lucide-react"
import { territoryMeta, type TerritoryId } from "./_data"

const territoryIcons = {
  daylight: Sun,
  signal: RadioTower,
  carebook: BookOpenText,
} satisfies Record<TerritoryId, typeof Sun>

export default function TerritoryIndexPage() {
  return (
    <main className="territory-index">
      <header className="territory-index__header">
        <p className="territory-index__eyebrow">Kiddz Online design lab</p>
        <h1>Three ways to make care visible.</h1>
        <p>
          One nursery state, one operational anatomy, and three deliberately different
          creative systems.
        </p>
      </header>

      <section className="territory-index__grid" aria-label="Creative territories">
        {(Object.keys(territoryMeta) as TerritoryId[]).map((id) => {
          const Icon = territoryIcons[id]
          const territory = territoryMeta[id]

          return (
            <Link className={`territory-index__item territory-index__item--${id}`} href={`/design-lab/territories/${id}`} key={id}>
              <span className="territory-index__icon" aria-hidden="true"><Icon /></span>
              <span className="territory-index__short">{territory.short}</span>
              <strong>{territory.name}</strong>
              <span className="territory-index__concept">{territory.concept}</span>
              <span className="territory-index__open">Open territory <ArrowRight aria-hidden="true" /></span>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
