export type TerritoryId = "daylight" | "signal" | "carebook"

export type TerritoryScoreCriterion = {
  id: string
  label: string
  weight: number
  scores: Record<TerritoryId, number>
}

export type TerritoryDecisionEvidence = {
  rank: number
  total: number
  scoreNote?: string
  recommended: boolean
  verdict: string
  bestAt: string
  watchout: string
}

export type PrototypeView = "today" | "children" | "care" | "review"

export type RoomState = "safe" | "forecast" | "unknown"

export type Room = {
  id: string
  name: string
  age: string
  state: RoomState
  stateLabel: string
  expected: number
  present: number
  absent: number
  late: number
  unknown: number
  staffPresent: number
  staffRequired: number
  ratio: string
  nextChange: string
  detail: string
}

export type WorkPriority = "critical" | "forecast" | "required" | "info"

export type WorkItem = {
  id: string
  priority: WorkPriority
  eyebrow: string
  title: string
  detail: string
  due: string
  owner: string
  action: string
}

export type ChildRow = {
  id: string
  name: string
  initials: string
  room: string
  attendance: "Present" | "Late" | "Unknown"
  arrival: string
  care: "Complete" | "Draft" | "Missing"
  note: string
}

export const territoryMeta: Record<
  TerritoryId,
  { name: string; short: string; concept: string }
> = {
  daylight: {
    name: "Daylight",
    short: "Expressive warmth",
    concept: "An open, optimistic day with concentrated color and bright settle motion.",
  },
  signal: {
    name: "Signal",
    short: "Live precision",
    concept: "A beautifully tuned operating instrument built from state, timing, and source.",
  },
  carebook: {
    name: "Carebook",
    short: "Editorial care",
    concept: "A living record of handovers, decisions, and evidence made humane and readable.",
  },
}

export const territoryScoreCriteria: readonly TerritoryScoreCriterion[] = [
  {
    id: "operational-clarity",
    label: "Operational clarity",
    weight: 25,
    scores: { daylight: 4.5, signal: 4.8, carebook: 4.2 },
  },
  {
    id: "brand-ownership",
    label: "Distinctive brand ownership",
    weight: 20,
    scores: { daylight: 4.7, signal: 3.8, carebook: 4.7 },
  },
  {
    id: "emotional-fit",
    label: "Emotional fit",
    weight: 15,
    scores: { daylight: 4.8, signal: 3.8, carebook: 4.7 },
  },
  {
    id: "dense-surfaces",
    label: "Dense-surface survival",
    weight: 15,
    scores: { daylight: 4.1, signal: 4.8, carebook: 4.3 },
  },
  {
    id: "motion-coherence",
    label: "Motion coherence",
    weight: 10,
    scores: { daylight: 4.4, signal: 4.1, carebook: 4.3 },
  },
  {
    id: "accessibility",
    label: "Accessibility",
    weight: 10,
    scores: { daylight: 4.3, signal: 4.5, carebook: 3.8 },
  },
  {
    id: "cross-device",
    label: "Cross-device continuity",
    weight: 5,
    scores: { daylight: 4.5, signal: 4.6, carebook: 4.0 },
  },
] as const

export const territoryDecisionEvidence: Record<TerritoryId, TerritoryDecisionEvidence> = {
  daylight: {
    rank: 1,
    total: 89.9,
    recommended: true,
    verdict: "The strongest balance of recognizable Kiddz warmth and operational authority.",
    bestAt: "Fast readiness comprehension, emotional fit, and a distinct market identity.",
    watchout: "Dense finance, audit, and medical views need Signal-level alignment discipline.",
  },
  signal: {
    rank: 3,
    total: 86.8,
    recommended: false,
    verdict: "The strongest operating instrument, but not yet a distinctive enough Kiddz world.",
    bestAt: "Room comparison, source and timing grammar, and information-dense workflows.",
    watchout: "The master language feels emotionally cool and too close to generic operations software.",
  },
  carebook: {
    rank: 2,
    total: 87,
    scoreNote: "Original score retained after accessibility remediation",
    recommended: false,
    verdict: "The most humane record system, with a meaningful speed and typography cost.",
    bestAt: "Handovers, incident history, acknowledgment, and parent-facing narrative evidence.",
    watchout: "Editorial scale and serif treatment slow repeated work and carry the highest localization risk.",
  },
}

export const rooms: Room[] = [
  {
    id: "nest",
    name: "Nest",
    age: "0-2 years",
    state: "safe",
    stateLabel: "Safe",
    expected: 8,
    present: 8,
    absent: 0,
    late: 0,
    unknown: 0,
    staffPresent: 3,
    staffRequired: 3,
    ratio: "1:3",
    nextChange: "Ella starts break at 11:45",
    detail: "All arrivals confirmed. Medication check completed at 09:06.",
  },
  {
    id: "meadow",
    name: "Meadow",
    age: "2-3 years",
    state: "forecast",
    stateLabel: "Cover needed by 12:30",
    expected: 14,
    present: 12,
    absent: 1,
    late: 1,
    unknown: 0,
    staffPresent: 3,
    staffRequired: 3,
    ratio: "1:4",
    nextChange: "Lina starts break at 12:30",
    detail: "Safe now. One qualified practitioner must cover Lina's 30-minute break.",
  },
  {
    id: "orchard",
    name: "Orchard",
    age: "3-4 years",
    state: "unknown",
    stateLabel: "1 attendance unknown",
    expected: 13,
    present: 10,
    absent: 1,
    late: 1,
    unknown: 1,
    staffPresent: 3,
    staffRequired: 3,
    ratio: "Pending",
    nextChange: "Confirm Alma's arrival",
    detail: "Ratio cannot be confirmed until the final expected child's state is observed.",
  },
  {
    id: "studio",
    name: "Studio",
    age: "4-5 years",
    state: "safe",
    stateLabel: "Safe",
    expected: 12,
    present: 11,
    absent: 1,
    late: 0,
    unknown: 0,
    staffPresent: 2,
    staffRequired: 2,
    ratio: "1:6",
    nextChange: "Lunch handover at 12:10",
    detail: "Room is safe. One care report is still missing from yesterday's handover.",
  },
]

export const workItems: WorkItem[] = [
  {
    id: "accident-review",
    priority: "critical",
    eyebrow: "Review by 10:00",
    title: "Accident report needs manager review",
    detail: "Evidence is complete. Parent acknowledgment is still pending.",
    due: "42 min",
    owner: "You",
    action: "Review report",
  },
  {
    id: "meadow-cover",
    priority: "forecast",
    eyebrow: "Forecast at 12:30",
    title: "Assign qualified cover to Meadow",
    detail: "Lina's break would leave the room one practitioner short.",
    due: "3 hr 12 min",
    owner: "Unassigned",
    action: "Assign cover",
  },
  {
    id: "care-reports",
    priority: "required",
    eyebrow: "Due before handover",
    title: "4 daily care reports remain incomplete",
    detail: "Two are drafts and two have not been started.",
    due: "Today",
    owner: "Room leaders",
    action: "Open reports",
  },
  {
    id: "unallocated-payment",
    priority: "info",
    eyebrow: "Finance follow-up",
    title: "EUR 240 payment is unallocated",
    detail: "Recorded yesterday for the Martin family; no invoice allocation yet.",
    due: "Friday",
    owner: "Finance",
    action: "Review payment",
  },
]

export const children: ChildRow[] = [
  {
    id: "alma-reyes",
    name: "Alma Reyes",
    initials: "AR",
    room: "Orchard",
    attendance: "Unknown",
    arrival: "Expected 09:00",
    care: "Missing",
    note: "Collection note updated yesterday",
  },
  {
    id: "theo-martin",
    name: "Theo Martin",
    initials: "TM",
    room: "Meadow",
    attendance: "Present",
    arrival: "08:17",
    care: "Draft",
    note: "Food preference on file",
  },
  {
    id: "aya-haddad",
    name: "Aya Haddad",
    initials: "AH",
    room: "Nest",
    attendance: "Present",
    arrival: "08:31",
    care: "Complete",
    note: "Medication check completed",
  },
  {
    id: "leo-dubois",
    name: "Leo Dubois",
    initials: "LD",
    room: "Studio",
    attendance: "Present",
    arrival: "08:46",
    care: "Complete",
    note: "Authorized collection at 16:30",
  },
  {
    id: "mila-costa",
    name: "Mila Costa",
    initials: "MC",
    room: "Meadow",
    attendance: "Late",
    arrival: "09:12",
    care: "Draft",
    note: "Parent message unread",
  },
  {
    id: "samir-nassar",
    name: "Samir Nassar",
    initials: "SN",
    room: "Orchard",
    attendance: "Present",
    arrival: "08:54",
    care: "Complete",
    note: "No current alerts",
  },
]

export const viewLabels: Record<PrototypeView, string> = {
  today: "Today",
  children: "Children",
  care: "Daily care",
  review: "Safety review",
}
