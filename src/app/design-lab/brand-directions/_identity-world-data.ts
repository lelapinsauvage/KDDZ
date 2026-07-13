import type { FinalistId } from "./_finalist-data"

export type IdentityWorldDefinition = {
  name: string
  thesis: string
  memoryAsset: string
  memoryRule: string
  markDescription: string
  palette: Array<{ name: string; value: string; job: string }>
  voice: Array<{ moment: string; source: string; expression: string; rule: string }>
  imageSystem: {
    name: string
    principle: string
    construction: string[]
    reject: string[]
  }
  motion: {
    name: string
    promise: string
    sequence: string[]
    reduced: string
  }
  applications: Array<{ surface: string; headline: string; detail: string }>
  strongestWhen: string
  failsWhen: string
}

export const identityWorldDefinitions: Record<FinalistId, IdentityWorldDefinition> = {
  "kinetic-kindness": {
    name: "Kinetic Kindness",
    thesis: "Care has energy. Kiddz turns that energy into visible, satisfying resolution.",
    memoryAsset: "The living O-ring and purposeful dot",
    memoryRule: "The dot may leave only to identify a real change, then returns to a stable whole.",
    markDescription: "A warm ring carries continuity; the dot carries attention, ownership, and completion.",
    palette: [
      { name: "Care orange", value: "#F36B32", job: "Primary identity and decisive completion" },
      { name: "Sun yellow", value: "#F2BF3D", job: "Forecast and time-bound attention" },
      { name: "Garden teal", value: "#17857D", job: "Safe, healthy, and confirmed" },
      { name: "Story pink", value: "#D84F7F", job: "Family warmth and human moments" },
      { name: "Play violet", value: "#7657B7", job: "Guidance and secondary expression" },
      { name: "Warm ink", value: "#29241F", job: "Operational text and high-trust contrast" },
    ],
    voice: [
      {
        moment: "Glanceable safety",
        source: "All rooms are safely staffed at 09:18.",
        expression: "All rooms safe. You’re covered.",
        rule: "Warmth can shorten reassurance, never the source time.",
      },
      {
        moment: "Action required",
        source: "Meadow needs one qualified practitioner by 12:30.",
        expression: "Meadow needs qualified cover by 12:30.",
        rule: "Name the place, qualification, and deadline in one breath.",
      },
      {
        moment: "Blocked delivery",
        source: "A manager review note is required before family delivery.",
        expression: "Add the manager note before this goes to Alma’s family.",
        rule: "Make recovery human and specific; never soften the control.",
      },
      {
        moment: "Handled, not finished",
        source: "Report delivered; parent acknowledgment remains pending.",
        expression: "Shared with Noah’s family. Acknowledgment is still pending.",
        rule: "Celebrate the completed step without claiming the whole job is done.",
      },
    ],
    imageSystem: {
      name: "Care constellations",
      principle: "One warm visual story connects the person, the action, and the proof.",
      construction: [
        "Build from rounded fields, the O-ring, and domain objects with clear jobs.",
        "Use one dominant action color and no more than two supporting colors per scene.",
        "Crop close to the meaningful interaction; expressions and hands carry the story.",
        "Let illustration reassure or celebrate, never replace evidence or severity.",
      ],
      reject: [
        "Unrelated blobs, confetti, or nursery wallpaper",
        "Generic smiling-child stock photography",
        "Rainbow equality where every color shouts",
      ],
    },
    motion: {
      name: "Leave, carry, return",
      promise: "The changed object carries context through the action and settles where the result now lives.",
      sequence: ["Notice", "Carry consequence", "Resolve", "Return to rest"],
      reduced: "Immediate state replacement plus a brief color confirmation; no travel or bounce.",
    },
    applications: [
      { surface: "Staff completion", headline: "Meadow is covered", detail: "Maya starts at 12:20 · safe through Ella’s break" },
      { surface: "Family message", headline: "Noah found his way back", detail: "After quiet time, the garden watering cans helped him settle." },
      { surface: "Brand statement", headline: "Care, visibly handled.", detail: "Every action, owner, and next step stays in view." },
    ],
    strongestWhen: "Kiddz needs recognition, emotional energy, parent warmth, and memorable completion without losing operational truth.",
    failsWhen: "The ring becomes decoration, motion repeats after settlement, or friendliness hides severity and provenance.",
  },
  "living-record": {
    name: "Living Record",
    thesis: "Care deserves a record that feels human, authored, and ready when trust is tested.",
    memoryAsset: "The dated care mark and authored margin",
    memoryRule: "Every expressive element must reveal who, when, or where the care was recorded.",
    markDescription: "A quiet care mark anchors the record; a precise margin carries source, revision, and chronology.",
    palette: [
      { name: "Record red", value: "#B54732", job: "Primary identity and authored emphasis" },
      { name: "Archive gold", value: "#D8A62E", job: "Forecast and dated attention" },
      { name: "Evidence teal", value: "#136F73", job: "Verified and safely complete" },
      { name: "Family plum", value: "#8F3F5E", job: "Human narrative and family context" },
      { name: "Index blue", value: "#456B9A", job: "References, navigation, and source links" },
      { name: "Record ink", value: "#28231F", job: "Documents, operations, and high-trust contrast" },
    ],
    voice: [
      {
        moment: "Glanceable safety",
        source: "All rooms are safely staffed at 09:18.",
        expression: "All rooms safely staffed · recorded 09:18",
        rule: "Reassurance gains trust from a visible timestamp.",
      },
      {
        moment: "Action required",
        source: "Meadow needs one qualified practitioner by 12:30.",
        expression: "Meadow cover required · qualified practitioner · by 12:30",
        rule: "Use structured clauses when consequence must scan quickly.",
      },
      {
        moment: "Blocked delivery",
        source: "A manager review note is required before family delivery.",
        expression: "Family delivery held until the manager review is recorded.",
        rule: "Name the held state, control, and release condition.",
      },
      {
        moment: "Handled, not finished",
        source: "Report delivered; parent acknowledgment remains pending.",
        expression: "Delivered 14:24 · parent acknowledgment pending",
        rule: "Chronology carries completion; pending work remains explicit.",
      },
    ],
    imageSystem: {
      name: "Observed care",
      principle: "Real artifacts and documentary moments show what happened, who handled it, and why it matters.",
      construction: [
        "Use consented documentary crops of hands, materials, rooms, and authored records.",
        "Pair every image with a useful caption, source, or moment in the care story.",
        "Use quiet editorial illustration only when photography cannot protect privacy.",
        "Let rules, margins, dates, and captions organize the composition before containers do.",
      ],
      reject: [
        "Uncaptioned lifestyle photography",
        "Vintage styling that makes the product feel slow",
        "Decorative editorial rules with no source meaning",
      ],
    },
    motion: {
      name: "Reveal, date, preserve",
      promise: "New information appears in chronology, receives authorship, then becomes stable evidence.",
      sequence: ["Reveal source", "Place in sequence", "Confirm authorship", "Preserve the record"],
      reduced: "Immediate reveal with persistent source and revision labels; no sliding chronology.",
    },
    applications: [
      { surface: "Staff completion", headline: "Meadow cover confirmed", detail: "Maya R. · 12:20-13:10 · rota revision 14" },
      { surface: "Family message", headline: "After quiet time", detail: "Noah chose the garden watering cans and settled with Jules." },
      { surface: "Brand statement", headline: "Care, visibly handled.", detail: "A living record of action, authorship, and trust." },
    ],
    strongestWhen: "Kiddz must feel premium, trustworthy, calm under scrutiny, and emotionally intelligent through authorship rather than exuberance.",
    failsWhen: "Editorial pacing slows the floor, provenance becomes visual furniture, or warmth depends entirely on photography.",
  },
}

export const identityDecisionCriteria = [
  "Recognizable without the full wordmark",
  "Warm without infantilizing nursery managers",
  "Credible in safeguarding, medical, and finance",
  "Distinct across product, parent, and launch surfaces",
  "Purposeful in motion and complete without motion",
] as const
