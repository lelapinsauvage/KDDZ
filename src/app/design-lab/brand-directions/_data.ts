export type BrandDirectionId =
  | "kinetic-kindness"
  | "open-studio"
  | "living-record"
  | "bright-signal"
  | "care-commons"
  | "quiet-magic"

export type PinterestReferenceId =
  | "duolingo-motion"
  | "messaging-brand"
  | "klarna-system"
  | "headspace-anxiety"
  | "headspace-symbols"
  | "ding-motion"
  | "buddy-product"
  | "british-kids"
  | "kindrove-poster"
  | "kindrove-system"

export type PinterestReference = {
  id: PinterestReferenceId
  title: string
  href: string
  cluster: "Living marks" | "Brand to product" | "Emotional clarity" | "Expressive child world"
  signal: string
}

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
  pinterestRoots: PinterestReferenceId[]
  pinterestTake: string
  pinterestReject: string
  colors: Array<{ name: string; value: string }>
}

export const pinterestReferences: PinterestReference[] = [
  {
    id: "duolingo-motion",
    title: "Duolingo logo motion",
    href: "https://fr.pinterest.com/pin/1025483777684516340/",
    cluster: "Living marks",
    signal: "A simple mark can gain character through anticipation, squash, and return-to-form.",
  },
  {
    id: "messaging-brand",
    title: "Messaging app identity",
    href: "https://fr.pinterest.com/pin/1025483777684516337/",
    cluster: "Brand to product",
    signal: "Editorial type, one color field, product proof, and small characters can share one composition.",
  },
  {
    id: "klarna-system",
    title: "Klarna brand system",
    href: "https://fr.pinterest.com/pin/1025483777684515586/",
    cluster: "Brand to product",
    signal: "Confident type and unapologetic color can coexist with real interface evidence.",
  },
  {
    id: "headspace-anxiety",
    title: "Headspace anxiety story",
    href: "https://fr.pinterest.com/pin/1025483777684478819/",
    cluster: "Emotional clarity",
    signal: "Short language and a humane character can make an anxious moment approachable.",
  },
  {
    id: "headspace-symbols",
    title: "Headspace challenge symbols",
    href: "https://fr.pinterest.com/pin/1025483777684478815/",
    cluster: "Emotional clarity",
    signal: "Simple illustrated symbols can explain difficult topics without stock photography.",
  },
  {
    id: "ding-motion",
    title: "Ding motion identity",
    href: "https://fr.pinterest.com/pin/1025483777684478812/",
    cluster: "Living marks",
    signal: "A tiny geometric mark and black word can create a memorable identity through movement.",
  },
  {
    id: "buddy-product",
    title: "Buddy product world",
    href: "https://fr.pinterest.com/pin/1025483777684319824/",
    cluster: "Brand to product",
    signal: "A colorful brand can remain legible when product modules, annotations, and collaboration stay structured.",
  },
  {
    id: "british-kids",
    title: "British Kids character family",
    href: "https://fr.pinterest.com/pin/1025483777684319820/",
    cluster: "Expressive child world",
    signal: "A small family of bold characters can carry many moods around authoritative black typography.",
  },
  {
    id: "kindrove-poster",
    title: "Kindrove educational poster",
    href: "https://fr.pinterest.com/pin/1025483777684319811/",
    cluster: "Expressive child world",
    signal: "High-energy shape and color can communicate joy when composition stays disciplined.",
  },
  {
    id: "kindrove-system",
    title: "Kindrove identity system",
    href: "https://fr.pinterest.com/pin/1025483777684319809/",
    cluster: "Expressive child world",
    signal: "Consistent geometry lets a compact palette stretch across identity and campaign applications.",
  },
]

export const pinterestReferenceById = Object.fromEntries(
  pinterestReferences.map((reference) => [reference.id, reference]),
) as Record<PinterestReferenceId, PinterestReference>

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
    pinterestRoots: ["duolingo-motion", "headspace-anxiety", "ding-motion"],
    pinterestTake: "A living mark, humane emotional timing, and a bright moment that always returns to order.",
    pinterestReject: "Mascot theatre, constant bounce, and equal rainbow color across operational work.",
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
    pinterestRoots: ["messaging-brand", "klarna-system", "kindrove-poster"],
    pinterestTake: "Editorial confidence, graphic color planes, and a product shown as proof inside the brand world.",
    pinterestReject: "Marketing-page scale inside daily tools and shapes added only to fill white space.",
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
    pinterestRoots: ["headspace-symbols", "buddy-product", "klarna-system"],
    pinterestTake: "Humane explanation, authored context, and a clear bridge between narrative and product evidence.",
    pinterestReject: "Lifestyle editorialism, uncaptioned imagery, and visual pacing that slows floor work.",
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
    pinterestRoots: ["buddy-product", "messaging-brand", "headspace-symbols"],
    pinterestTake: "Structured colorful modules, immediate hierarchy, and symbols that make changing state legible.",
    pinterestReject: "Fintech mimicry, decorative data graphics, and color without an operational consequence.",
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
    pinterestRoots: ["british-kids", "headspace-anxiety", "buddy-product"],
    pinterestTake: "A recognizable cast, relational language, and product structures that make collaboration visible.",
    pinterestReject: "Decorative avatars, forced cheerfulness, and collective language that hides the accountable owner.",
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
    pinterestRoots: ["ding-motion", "klarna-system", "kindrove-system"],
    pinterestTake: "Monochrome authority, one memorable mark, and concentrated color that earns attention.",
    pinterestReject: "Generic SaaS restraint, washed-out neutrality, and minimalism with no Kiddz memory asset.",
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
