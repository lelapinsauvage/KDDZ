import type { BrandDirectionId } from "./_data"

export type EvaluationCriterionId =
  | "operationalTruth"
  | "distinctiveAsset"
  | "emotionalResonance"
  | "productScalability"
  | "hierarchyAccessibility"
  | "motionCharacter"
  | "brandWorldBreadth"

export type EvaluationStatus = "advance" | "challenger" | "hold"

export type BrandDirectionEvaluation = {
  directionId: BrandDirectionId
  scores: Record<EvaluationCriterionId, number>
  status: EvaluationStatus
  evidence: string
  pressure: string
  mustProve: string
  assetPriority: string
}

export const evaluationCriteria: Array<{
  id: EvaluationCriterionId
  name: string
  short: string
  weight: number
  question: string
}> = [
  {
    id: "operationalTruth",
    name: "Operational truth",
    short: "Truth",
    weight: 20,
    question: "Does the system make safety, consequence, ownership, and evidence immediately credible?",
  },
  {
    id: "distinctiveAsset",
    name: "Distinctive-asset potential",
    short: "Ownability",
    weight: 18,
    question: "Could a small, repeatable set of assets become recognizably Kiddz rather than category decoration?",
  },
  {
    id: "emotionalResonance",
    name: "Emotional resonance",
    short: "Feeling",
    weight: 16,
    question: "Does it bring warmth and energy to serious work without infantilizing the manager?",
  },
  {
    id: "productScalability",
    name: "Product scalability",
    short: "Scale",
    weight: 16,
    question: "Can it carry dense desktop operations, long forms, records, and parent-facing moments?",
  },
  {
    id: "hierarchyAccessibility",
    name: "Hierarchy and accessibility",
    short: "Clarity",
    weight: 12,
    question: "Can color remain meaningful, contrast-safe, and secondary to content hierarchy?",
  },
  {
    id: "motionCharacter",
    name: "Motion character",
    short: "Motion",
    weight: 8,
    question: "Can purposeful transitions become recognizable while respecting reduced motion and speed?",
  },
  {
    id: "brandWorldBreadth",
    name: "Brand-world breadth",
    short: "World",
    weight: 10,
    question: "Can the identity stretch across product, parent trust, launch, guidance, and awards material?",
  },
]

export const brandDirectionEvaluations: BrandDirectionEvaluation[] = [
  {
    directionId: "kinetic-kindness",
    status: "advance",
    scores: {
      operationalTruth: 4,
      distinctiveAsset: 5,
      emotionalResonance: 5,
      productScalability: 4,
      hierarchyAccessibility: 4,
      motionCharacter: 5,
      brandWorldBreadth: 5,
    },
    evidence: "The approved O-ring, purposeful dot, sequential arrival, and color constellation already form a coherent asset family with emotional range.",
    pressure: "Its warmth can collapse into a children's app if every surface moves or every color appears at once.",
    mustProve: "A restrained desktop operating mode where color marks consequence and completion, never routine chrome.",
    assetPriority: "Build the O-ring first; use the dot and six-color constellation only to reinforce it.",
  },
  {
    directionId: "living-record",
    status: "advance",
    scores: {
      operationalTruth: 5,
      distinctiveAsset: 4,
      emotionalResonance: 5,
      productScalability: 4,
      hierarchyAccessibility: 5,
      motionCharacter: 3,
      brandWorldBreadth: 4,
    },
    evidence: "Editorial rhythm turns source, time, authorship, and care history into a human trust language instead of compliance chrome.",
    pressure: "The reading experience can slow live comparison and make urgent operations feel like a publication.",
    mustProve: "A fast operational density mode that keeps the record voice without adding ornamental editorial furniture.",
    assetPriority: "Own the dated care mark and source-caption grammar before adding expressive typography elsewhere.",
  },
  {
    directionId: "care-commons",
    status: "challenger",
    scores: {
      operationalTruth: 4,
      distinctiveAsset: 4,
      emotionalResonance: 5,
      productScalability: 4,
      hierarchyAccessibility: 4,
      motionCharacter: 4,
      brandWorldBreadth: 5,
    },
    evidence: "It expresses the real social system of nursery work and has the strongest route into family trust, handover, and multi-role storytelling.",
    pressure: "Portraits introduce privacy and availability problems, while inclusive language can blur exactly who owns the next action.",
    mustProve: "A people-centered identity that still works with no photography and names one accountable owner for every consequence.",
    assetPriority: "Develop the connection mark and paired-role grammar independently from portrait photography.",
  },
  {
    directionId: "open-studio",
    status: "hold",
    scores: {
      operationalTruth: 4,
      distinctiveAsset: 5,
      emotionalResonance: 3,
      productScalability: 4,
      hierarchyAccessibility: 4,
      motionCharacter: 4,
      brandWorldBreadth: 5,
    },
    evidence: "It is visually forceful, contemporary, and highly extensible across campaign, workspace customization, and launch expression.",
    pressure: "The graphic confidence can describe a design studio more clearly than a trusted nursery operating system.",
    mustProve: "A calm, high-stakes workflow where the modular grammar improves decisions instead of becoming layout theater.",
    assetPriority: "Test the K/O frame as a single repeatable asset; remove any color plane that does not carry meaning.",
  },
  {
    directionId: "bright-signal",
    status: "hold",
    scores: {
      operationalTruth: 5,
      distinctiveAsset: 3,
      emotionalResonance: 2,
      productScalability: 5,
      hierarchyAccessibility: 5,
      motionCharacter: 4,
      brandWorldBreadth: 3,
    },
    evidence: "It gives ratios, staffing, finance, medical state, and deadlines the clearest immediate operational grammar.",
    pressure: "Signal rings, electric blue, and tabular state are already heavily associated with fintech and developer tooling.",
    mustProve: "A proprietary emotional asset that makes the system unmistakably childcare without weakening its precision.",
    assetPriority: "Keep the now/next grammar as product logic; do not assume the signal ring is a brand asset.",
  },
  {
    directionId: "quiet-magic",
    status: "hold",
    scores: {
      operationalTruth: 4,
      distinctiveAsset: 2,
      emotionalResonance: 2,
      productScalability: 5,
      hierarchyAccessibility: 5,
      motionCharacter: 4,
      brandWorldBreadth: 3,
    },
    evidence: "It offers the most disciplined long-session product foundation and the lowest risk of visual fatigue.",
    pressure: "Monochrome minimalism, Geist, and a single dot are borrowed category signals rather than ownable Kiddz memory structures.",
    mustProve: "A signature beyond polish that remains recognizable with the wordmark removed.",
    assetPriority: "Treat restraint as a product mode, not as the brand identity itself.",
  },
]

export function weightedEvaluationScore(evaluation: BrandDirectionEvaluation) {
  const total = evaluationCriteria.reduce(
    (sum, criterion) => sum + (evaluation.scores[criterion.id] / 5) * criterion.weight,
    0,
  )

  return Math.round(total * 10) / 10
}

export const rankedBrandEvaluations = [...brandDirectionEvaluations]
  .map((evaluation) => ({ ...evaluation, total: weightedEvaluationScore(evaluation) }))
  .sort((left, right) => right.total - left.total)
