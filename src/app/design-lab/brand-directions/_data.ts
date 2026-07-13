export type BrandDirectionId =
  | "kinetic-kindness"
  | "open-studio"
  | "living-record"
  | "bright-signal"
  | "care-commons"
  | "quiet-magic"

export type BrandDirection = {
  id: BrandDirectionId
  number: string
  name: string
  short: string
  thesis: string
  promise: string
  identity: string
  typeDisplay: string
  typeProduct: string
  typeNote: string
  motion: string
  voice: string
  bestAt: string
  risk: string
  colors: Array<{ name: string; value: string }>
}

export const brandDirections: BrandDirection[] = [
  {
    id: "kinetic-kindness",
    number: "01",
    name: "Kinetic Kindness",
    short: "Warmth with momentum",
    thesis: "Serious work feels lighter when the product responds with warmth and momentum.",
    promise: "Kiddz notices the day with you, helps it move, and makes completion feel real.",
    identity: "Smiling O-ring, one purposeful dot, sequential letter arrival, and a governed six-color constellation.",
    typeDisplay: "Fredoka",
    typeProduct: "Inter",
    typeNote: "Rounded expression at brand scale; exact, tabular utility in the product.",
    motion: "Leave and return",
    voice: "Warm, direct, and specific.",
    bestAt: "A broad emotional world across parent, guidance, onboarding, and daily completion.",
    risk: "Can become childish or distribute the rainbow across routine operations.",
    colors: [
      { name: "Ink", value: "#292521" },
      { name: "Orange", value: "#FF6B2C" },
      { name: "Pink", value: "#E94A8B" },
      { name: "Yellow", value: "#F7C928" },
      { name: "Teal", value: "#12AFA5" },
      { name: "Violet", value: "#8557D3" },
    ],
  },
  {
    id: "open-studio",
    number: "02",
    name: "Open Studio",
    short: "Graphic capability",
    thesis: "A nursery is a creative, highly skilled studio; its people should feel capable, not processed.",
    promise: "Kiddz turns complex work into a clear, expressive space teams can shape around the day.",
    identity: "Stacked type, modular K/O frames, disciplined color planes, and asymmetric compositions locked to a grid.",
    typeDisplay: "Bricolage Grotesque",
    typeProduct: "Instrument Sans",
    typeNote: "Characterful display and contemporary utility without oversized product headings.",
    motion: "Assemble the frame",
    voice: "Concise, confident, and culturally alive.",
    bestAt: "A launchable modern identity, strong campaigns, and customizable manager workspaces.",
    risk: "Can become theatrical or turn graphic devices into arbitrary decoration.",
    colors: [
      { name: "Ink", value: "#171717" },
      { name: "Ultra", value: "#3157FF" },
      { name: "Tangerine", value: "#FF6A32" },
      { name: "Citron", value: "#D6F13A" },
      { name: "Pool", value: "#55D6C6" },
      { name: "Orchid", value: "#D96AD9" },
    ],
  },
  {
    id: "living-record",
    number: "03",
    name: "Living Record",
    short: "Human evidence",
    thesis: "Trust grows when every act of care becomes a clear, humane, connected record.",
    promise: "Kiddz preserves what happened, who handled it, and what families or inspectors can trust.",
    identity: "Editorial contrast, dated care marks, source captions, and page rhythm built from rules and margins.",
    typeDisplay: "Newsreader",
    typeProduct: "Inter",
    typeNote: "Narrative warmth where reading matters; neutral speed for repeated operational work.",
    motion: "Enter the record",
    voice: "Observant, humane, and exact.",
    bestAt: "Profiles, handovers, incidents, parent communication, and evidence-heavy workflows.",
    risk: "Can feel like a journal and slow live comparison or high-volume action.",
    colors: [
      { name: "Ink", value: "#28231F" },
      { name: "Vermilion", value: "#E95735" },
      { name: "Ocean", value: "#147D86" },
      { name: "Raspberry", value: "#C94F77" },
      { name: "Mustard", value: "#D99A18" },
      { name: "Lilac", value: "#7758B3" },
    ],
  },
  {
    id: "bright-signal",
    number: "04",
    name: "Bright Signal",
    short: "Live confidence",
    thesis: "Anxiety falls when change appears early, consequence is clear, and ownership is unmistakable.",
    promise: "Kiddz shows what is true now, what changes next, and who is carrying it.",
    identity: "Notched signal ring, now/next time grammar, tabular state, and one electric action color.",
    typeDisplay: "Space Grotesk",
    typeProduct: "Source Sans 3",
    typeNote: "A live-instrument voice with highly readable multilingual utility.",
    motion: "Signal handoff",
    voice: "Brief, causal, and operational.",
    bestAt: "Ratios, staffing, attendance, finance, medical, audit, and dense desktop work.",
    risk: "Can resemble fintech, DevOps, or generic blue enterprise software.",
    colors: [
      { name: "Ink", value: "#16181C" },
      { name: "Electric", value: "#245BFF" },
      { name: "Amber", value: "#E59A00" },
      { name: "Safe", value: "#16805B" },
      { name: "Critical", value: "#C93445" },
      { name: "Review", value: "#7157C8" },
    ],
  },
  {
    id: "care-commons",
    number: "05",
    name: "Care Commons",
    short: "Shared responsibility",
    thesis: "A nursery works because people coordinate care; the product should make that responsibility visible.",
    promise: "Kiddz keeps every child, family, room, and colleague connected to the right next step.",
    identity: "Paired names and roles, room-family color relationships, portrait crops, and a shared connection mark.",
    typeDisplay: "Fraunces",
    typeProduct: "DM Sans",
    typeNote: "Human, recognizable identity paired with clear contemporary records.",
    motion: "Gather and hand over",
    voice: "Inclusive, relational, and accountable.",
    bestAt: "Communication, staffing, handovers, family trust, and multi-role collaboration.",
    risk: "Portrait dependence can create privacy risk and shared language can blur individual ownership.",
    colors: [
      { name: "Ink", value: "#252421" },
      { name: "Coral", value: "#F05F4F" },
      { name: "Clover", value: "#3D9B61" },
      { name: "Sky", value: "#3A86E8" },
      { name: "Sunflower", value: "#E9B72E" },
      { name: "Violet", value: "#8A62C7" },
    ],
  },
  {
    id: "quiet-magic",
    number: "06",
    name: "Quiet Magic",
    short: "Effortless focus",
    thesis: "Great nursery software disappears quickly and returns attention to children.",
    promise: "Kiddz makes important work feel immediate, tactile, and already under control.",
    identity: "Monochrome-first wordmark, living Online accent, O-ring negative space, and one-color reveals.",
    typeDisplay: "Geist",
    typeProduct: "Geist",
    typeNote: "One disciplined family; hierarchy comes from composition, weight, and spacing.",
    motion: "Direct morph",
    voice: "Short, exact, and quietly confident.",
    bestAt: "Long-session desktop use, command/search, focused forms, and premium interaction polish.",
    risk: "Can become borrowed minimalism with too little childcare warmth or ownership.",
    colors: [
      { name: "Ink", value: "#1C1C1B" },
      { name: "Cobalt", value: "#3157FF" },
      { name: "Coral", value: "#F25F4B" },
      { name: "Emerald", value: "#1C8A60" },
      { name: "Amber", value: "#D79200" },
      { name: "Mist", value: "#D8D8D2" },
    ],
  },
]

export const directionById = Object.fromEntries(
  brandDirections.map((direction) => [direction.id, direction]),
) as Record<BrandDirectionId, BrandDirection>
