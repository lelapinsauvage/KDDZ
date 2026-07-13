export type FinalistId = "kinetic-kindness" | "living-record"

export const finalistIds: FinalistId[] = ["kinetic-kindness", "living-record"]

export const finalistDefinitions = {
  "kinetic-kindness": {
    name: "Kinetic Kindness",
    short: "Warmth makes completion memorable",
    proofQuestion: "Can expressive warmth remain disciplined during dense and high-trust work?",
    motion: "Spring into place; settle immediately after consequence is clear.",
  },
  "living-record": {
    name: "Living Record",
    short: "Evidence becomes humane and legible",
    proofQuestion: "Can editorial humanity remain fast enough for live operations?",
    motion: "Reveal source and chronology; never animate settled evidence.",
  },
} as const

export const operationsFixture = {
  branch: "Riverside Nursery",
  capturedAt: "09:18",
  headline: "Safe now. Meadow needs cover before 12:30.",
  totals: [
    { label: "children present", value: "41" },
    { label: "staff present", value: "11" },
    { label: "items need you", value: "2" },
  ],
  rooms: [
    { name: "Nest", children: "8 / 8", staff: "3 staff", state: "safe", label: "Safe now", detail: "Ella starts break at 11:45" },
    { name: "Meadow", children: "12 / 14", staff: "3 staff", state: "warning", label: "Cover by 12:30", detail: "One qualified practitioner needed" },
    { name: "Orchard", children: "10 / 13", staff: "3 staff", state: "unknown", label: "Arrival unknown", detail: "Confirm Alma's attendance" },
    { name: "Studio", children: "11 / 12", staff: "2 staff", state: "safe", label: "Safe now", detail: "Lunch handover at 12:10" },
  ],
  cover: {
    title: "Assign qualified cover",
    consequence: "Meadow projects to 1:6 from 12:30 to 13:00.",
    owner: "Noor H.",
    source: "Rota + live attendance · revision 13",
    candidate: "Maya R. · available 12:20-13:10",
    impact: "Meadow becomes safe. Nest and Studio remain unchanged.",
  },
} as const

export const incidentFixture = {
  child: "Alma Rahal",
  room: "Meadow",
  occurredAt: "10:24",
  location: "Water-play table",
  cause: "Slipped beside the water-play table",
  firstAid: "Cold pack applied for ten minutes",
  witness: "Lina R.",
  manager: "Noor H.",
  revision: "Accident revision 3",
  evidence: [
    { label: "Witness account", detail: "Saved 10:31 by Lina R.", status: "complete" },
    { label: "Area photograph", detail: "Upload recovered on retry · 10:34", status: "complete" },
    { label: "Manager review", detail: "Required before family delivery", status: "review" },
  ],
  timeline: [
    { time: "10:24", label: "Incident recorded", source: "Meadow room" },
    { time: "10:26", label: "First aid recorded", source: "Lina R." },
    { time: "10:34", label: "Evidence upload recovered", source: "water-play-area.jpg" },
  ],
} as const

export const parentFixture = {
  child: "Noah R.",
  date: "Wednesday, 5 August",
  room: "Meadow Room",
  reportRevision: "Care report revision 11",
  preparedAt: "14:24",
  observations: [
    { label: "Breakfast", value: "Half" },
    { label: "Lunch", value: "A little" },
    { label: "Mood", value: "Fussy after quiet time" },
    { label: "Health", value: "No symptoms observed" },
  ],
  note: "Noah settled with Jules after quiet time and chose the watering cans for the garden session.",
  upcoming: "Meadow garden session starts at 15:00.",
  privacy: "Internal handover notes and staff-only provenance are excluded.",
} as const
