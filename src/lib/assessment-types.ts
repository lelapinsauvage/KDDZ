// ─────────────────────────────────────────────
// Assessment Type Definitions (7 types)
// Mirrors the old PHP assessment_1.php–assessment_7.php
// ─────────────────────────────────────────────

export interface AssessmentCriterion {
  key: string;
  label: string;
}

export interface AssessmentCategory {
  name: string;
  key: string; // m, c, l, s, d
  criteria: AssessmentCriterion[];
  isRedFlags?: boolean; // d-category = checkboxes instead of yes/no
}

export interface AssessmentTypeConfig {
  type: number;
  name: string;
  ageRange: string;
  categories: AssessmentCategory[];
}

// ── Response types stored in JSON data field ──
// Criteria: 1 = Yes, -1 = No, 0 = Not evaluated
// Red flags (d): true = flagged, false = not flagged
// comments: string

export const VALID_ASSESSMENT_TYPES = [1, 2, 3, 4, 5, 6, 7] as const;

export const ASSESSMENT_TYPE_NAMES: Record<number, string> = {
  1: "1-3 Months",
  2: "4-7 Months",
  3: "8-12 Months",
  4: "12-24 Months",
  5: "24-36 Months",
  6: "36-48 Months",
  7: "48-60 Months",
};

// ─────────────────────────────────────────────
// ASSESSMENT 1: 1-3 Months
// ─────────────────────────────────────────────

const assessment1: AssessmentTypeConfig = {
  type: 1,
  name: "Development Report (1-3 months)",
  ageRange: "1-3 months",
  categories: [
    {
      name: "Motor Skills",
      key: "m",
      criteria: [
        { key: "m1", label: "Retains hold of object/rattle (1-2 mos.)" },
        { key: "m2", label: "Brings hands towards center of body when lying on back (1-2 mos.)" },
        { key: "m3", label: "Raises head and cheek when lying on stomach (3 mos.)" },
        { key: "m4", label: "Stretches legs out when lying on stomach or back (2-3 mos.)" },
        { key: "m5", label: "Opens and shuts hands (2-3 mos.)" },
        { key: "m6", label: "Pushes down on his legs when his feet are placed on firm surface (3 mos.)" },
        { key: "m7", label: "Occasionally rolls from stomach to back (3 mos.)" },
      ],
    },
    {
      name: "Cognitive Skills",
      key: "c",
      criteria: [
        { key: "c1", label: "Responds to voice i.e. turn to, wiggle, reacts (0-1 mos.)" },
        { key: "c2", label: "Watches face intently (2-3 mos.)" },
        { key: "c3", label: "Follows moving objects (2 mos.)" },
        { key: "c4", label: "Recognizes familiar objects and people at a distance (3 mos.)" },
        { key: "c5", label: "Starts using hands and eyes in coordination (3 mos.)" },
      ],
    },
    {
      name: "Language Skills",
      key: "l",
      criteria: [
        { key: "l1", label: "Makes sucking sounds (1-2 mos.)" },
        { key: "l2", label: "Smiles at the sound of voice (2-3 mos.)" },
        { key: "l3", label: "Cooing noises; vocal play (begins at 3 mos.)" },
        { key: "l4", label: "Attends to sound (1-3 mos.)" },
        { key: "l5", label: "Startles to loud noise (1-3 mos.)" },
      ],
    },
    {
      name: "Social / Emotional Skills",
      key: "s",
      criteria: [
        { key: "s1", label: "Makes eye contact (0-1 mos.)" },
        { key: "s2", label: "Begins to develop a social smile (1-3 mos.)" },
        { key: "s3", label: "Enjoys playing with other people and may cry when playing stops (2-3 mos.)" },
        { key: "s4", label: "Becomes more communicative and expressive with face and body (2-3 mos.)" },
      ],
    },
    {
      name: "Developmental Red Flags",
      key: "d",
      isRedFlags: true,
      criteria: [
        { key: "d1", label: "Doesn't seem to respond to loud noises" },
        { key: "d2", label: "Doesn't follow moving objects with eyes by 2 to 3 months" },
        { key: "d3", label: "Doesn't smile at the sound of your voice by 2 months" },
        { key: "d4", label: "Doesn't grasp and hold objects by 3 months" },
        { key: "d5", label: "Doesn't smile at people by 3 months" },
        { key: "d6", label: "Cannot support head well at 3 months" },
        { key: "d7", label: "Doesn't bring objects to mouth by 4 months" },
        { key: "d8", label: "Doesn't push down with legs when feet are placed on a firm surface by 4 months" },
        { key: "d9", label: "Has trouble moving one or both eyes in all directions" },
        { key: "d10", label: "Crosses eyes most of the time" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// ASSESSMENT 2: 4-7 Months
// ─────────────────────────────────────────────

const assessment2: AssessmentTypeConfig = {
  type: 2,
  name: "Development Report (4-7 months)",
  ageRange: "4-7 months",
  categories: [
    {
      name: "Motor Skills",
      key: "m",
      criteria: [
        { key: "m1", label: "Pushes up on extended arms (5 mos.)" },
        { key: "m2", label: "Pulls to sitting with no head lag (5 mos.)" },
        { key: "m3", label: "Sits with support of his hands (5-6 mos.)" },
        { key: "m4", label: "Sits unsupported for short periods (6-8 mos.)" },
        { key: "m5", label: "Supports whole weight on legs (6-7 mos.)" },
        { key: "m6", label: "Grasps feet (6 mos.)" },
        { key: "m7", label: "Transfers objects from hand to hand (6-7 mos.)" },
        { key: "m8", label: "Uses raking grasp (not pincer) (6 mos.)" },
        { key: "m9", label: "Routinely rolls from stomach to back and back to stomach (6 mos.)" },
      ],
    },
    {
      name: "Cognitive Skills",
      key: "c",
      criteria: [
        { key: "c1", label: "Plays peek-a-boo (4-7 mos.)" },
        { key: "c2", label: "Looks for a family member or pet when named (4-7 mos.)" },
        { key: "c3", label: "Explores with hands and mouth (4-7 mos.)" },
        { key: "c4", label: "Tracks moving objects with ease (4-7 mos.)" },
        { key: "c5", label: "Finds partially hidden objects (6-7 mos.)" },
        { key: "c6", label: "Grasps objects dangling in front of him (5-6 mos.)" },
        { key: "c7", label: "Looks for fallen toys (5-7 mos.)" },
      ],
    },
    {
      name: "Language Skills",
      key: "l",
      criteria: [
        { key: "l1", label: "Laughs and squeals out loud (4-7 mos.)" },
        { key: "l2", label: "Distinguishes emotions by tone of voice (4-7 mos.)" },
        { key: "l3", label: "Responds to sound by making sounds (4-6 mos.)" },
        { key: "l4", label: "Responds to spoken \"bye-bye\" by waving (4-7 mos.)" },
        { key: "l5", label: "Uses voice to express joy and displeasure (4-6 mos.)" },
        { key: "l6", label: "Localizes or turns toward sounds (5-6 mos.)" },
        { key: "l7", label: "Syllable repetition begins (5-7 mos.)" },
      ],
    },
    {
      name: "Social / Emotional Skills",
      key: "s",
      criteria: [
        { key: "s1", label: "Enjoys social play (4-7 mos.)" },
        { key: "s2", label: "Interested in mirror images (5-7 mos.)" },
        { key: "s3", label: "Can calm down within hour when upset (6 mos.)" },
        { key: "s4", label: "Responds to other people's expression of emotion (4-7 mos.)" },
      ],
    },
    {
      name: "Developmental Red Flags",
      key: "d",
      isRedFlags: true,
      criteria: [
        { key: "d1", label: "Seems very stiff, tight muscles" },
        { key: "d2", label: "Seems very floppy, like a rag doll" },
        { key: "d3", label: "Head still flops back when body is pulled to sitting position (by 5 months still exhibits head lag)" },
        { key: "d4", label: "Shows no affection for the person who cares for them" },
        { key: "d5", label: "Doesn't seem to enjoy being around people" },
        { key: "d6", label: "One or both eyes consistently turn in or out" },
        { key: "d7", label: "Persistent tearing, eye drainage, or sensitivity to light" },
        { key: "d8", label: "Does not respond to sounds around them" },
        { key: "d9", label: "Has difficulty getting objects to mouth" },
        { key: "d10", label: "Does not turn head to locate sounds by 4 months" },
        { key: "d11", label: "Doesn't roll over (stomach to back) by 6 months" },
        { key: "d12", label: "Cannot sit with help by 6 months (not by themselves)" },
        { key: "d13", label: "Does not laugh or make squealing sounds by 5 months" },
        { key: "d14", label: "Does not actively reach for objects by 6 months" },
        { key: "d15", label: "Does not follow objects with both eyes" },
        { key: "d16", label: "Does not bear some weight on legs by 5 months" },
        { key: "d17", label: "Has difficulty calming self, cries for long periods of time" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// ASSESSMENT 3: 8-12 Months
// ─────────────────────────────────────────────

const assessment3: AssessmentTypeConfig = {
  type: 3,
  name: "Development Report (8-12 months)",
  ageRange: "8-12 months",
  categories: [
    {
      name: "Gross Motor Skills",
      key: "m",
      criteria: [
        { key: "m1", label: "Crawls forward on belly (8-9 mos.)" },
        { key: "m2", label: "Assumes hand and knee position (8-9 mos.)" },
        { key: "m3", label: "Gets to sitting position without assistance (8-10 mos.)" },
        { key: "m4", label: "Pulls self up to standing position at furniture (8-10 mos.)" },
        { key: "m5", label: "Creeps on hands and knees (9 mos.)" },
        { key: "m6", label: "Gets from sitting to crawling or prone (lying on stomach) position (9-10 mos.)" },
        { key: "m7", label: "Walks holding on to furniture (10-13 mos.)" },
        { key: "m8", label: "Stands momentarily without support (11-13 mos.)" },
        { key: "m9", label: "May walk two or three steps without support (11-13 mos.)" },
      ],
    },
    {
      name: "Fine Motor Skills",
      key: "fm",
      criteria: [
        { key: "m10", label: "Uses pincer grasp (grasp using thumb and index finger) (7-10 mos.)" },
        { key: "m11", label: "Bangs two one-inch cubes together (8-12 mos.)" },
        { key: "m12", label: "Pokes with index finger (9-12 mos.)" },
        { key: "m13", label: "Puts objects into container (10-12 mos.)" },
        { key: "m14", label: "Takes objects out of container (10-12 mos.)" },
        { key: "m15", label: "Tries to imitate scribbling (10-12 mos.)" },
      ],
    },
    {
      name: "Cognitive Skills",
      key: "c",
      criteria: [
        { key: "c1", label: "Looks at correct picture when image is named (8-9 mos.)" },
        { key: "c2", label: "Explores objects in many different ways (shaking, banging, throwing, dropping) (8-10 mos.)" },
        { key: "c3", label: "Enjoys looking at pictures in books (9-12 mos.)" },
        { key: "c4", label: "Imitates gestures (9-12 mos.)" },
        { key: "c5", label: "Engages in simple games (Peek-a-Boo, Pat-a-Cake, or rolling ball to another) (9-12 mos.)" },
        { key: "c6", label: "Finds hidden objects easily (10-12 mos.)" },
      ],
    },
    {
      name: "Language Skills",
      key: "l",
      criteria: [
        { key: "l1", label: "Babbles \"dada\" and \"mama\" (7-8 mos.)" },
        { key: "l2", label: "Babbles with inflection (7-9 mos.)" },
        { key: "l3", label: "Says \"dada\" and \"mama\" for specific person (8-10 mos.)" },
        { key: "l4", label: "Responds to \"no\" by briefly stopping activity and noticing adult (9-12 mos.)" },
        { key: "l5", label: "Responds to simple verbal requests, such as \"Give me\" (9-14 mos.)" },
        { key: "l6", label: "Makes simple gestures such as shaking head for \"no\" (12 mos.)" },
        { key: "l7", label: "Uses exclamations such as \"oh-oh\" (12 mos.)" },
      ],
    },
    {
      name: "Social / Emotional Skills",
      key: "s",
      criteria: [
        { key: "s1", label: "Finger-feeds himself (8-12 mos.)" },
        { key: "s2", label: "Extends arm or leg to help when being dressed (9-12 mos.)" },
        { key: "s3", label: "May hold spoon when feeding (9-12 mos.)" },
        { key: "s4", label: "Shy or anxious with strangers (8-12 mos.)" },
        { key: "s5", label: "Cries when mother or father leaves (8-12 mos.)" },
        { key: "s6", label: "Enjoys imitating people in his play (10-12 mos.)" },
        { key: "s7", label: "Shows specific preferences for certain people and toys (8-12 mos.)" },
        { key: "s8", label: "Prefers mother and/or regular care provider over all others (8-12 mos.)" },
        { key: "s9", label: "Repeats sounds or gestures for attention (10-12 mos.)" },
        { key: "s10", label: "May test parents at bed time (9-12 mos.)" },
      ],
    },
    {
      name: "Developmental Red Flags",
      key: "d",
      isRedFlags: true,
      criteria: [
        { key: "d1", label: "Does not crawl" },
        { key: "d2", label: "Drags one side of body while crawling (for over one month)" },
        { key: "d3", label: "Cannot stand when supported" },
        { key: "d4", label: "Does not search for objects that are hidden (10-12 mos.)" },
        { key: "d5", label: "Says no single words (\"mama\" or \"dada\")" },
        { key: "d6", label: "Does not learn to use gestures such as waving or shaking head" },
        { key: "d7", label: "Does not sit steadily by 10 months" },
        { key: "d8", label: "Does not react to new environments and people" },
        { key: "d9", label: "Does not seek out caregiver when stressed" },
        { key: "d10", label: "Does not show interest in \"peek-a-boo\" or \"patty cake\" by 8 mos." },
        { key: "d11", label: "Does not babble by 8 mos. (\"dada\", \"baba\", \"mama\")" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// ASSESSMENT 4: 12-24 Months
// ─────────────────────────────────────────────

const assessment4: AssessmentTypeConfig = {
  type: 4,
  name: "Development Report (12-24 months)",
  ageRange: "12-24 months",
  categories: [
    {
      name: "Gross Motor Skills",
      key: "m",
      criteria: [
        { key: "m1", label: "Walks alone (12-16 mos.)" },
        { key: "m2", label: "Pulls toys behind him while walking (13-16 mos.)" },
        { key: "m3", label: "Carries large toy or several toys while walking (12-15 mos.)" },
        { key: "m4", label: "Begins to run stiffly (16-18 mos.)" },
        { key: "m5", label: "Walks into ball (18-24 mos.)" },
        { key: "m6", label: "Climbs onto and down from furniture unsupported (16-24 mos.)" },
        { key: "m7", label: "Walks up and down stairs holding on to support (18-24 mos.)" },
      ],
    },
    {
      name: "Fine Motor Skills",
      key: "fm",
      criteria: [
        { key: "m8", label: "Scribbles spontaneously (14-16 mos.)" },
        { key: "m9", label: "Turns over container to pour out contents (12-18 mos.)" },
        { key: "m10", label: "Builds tower of four blocks or more (20-24 mos.)" },
        { key: "m11", label: "Completes simple knobbed wooden puzzles of 3 to 4 pieces (21-24 mos.)" },
      ],
    },
    {
      name: "Language Skills",
      key: "l",
      criteria: [
        { key: "l1", label: "Says \"no\" with meaning (13-15 mos.)" },
        { key: "l2", label: "Follows simple, one-step instructions (14-18 mos.)" },
        { key: "l3", label: "Says several single words (15-18 mos.)" },
        { key: "l4", label: "Recognizes names of familiar people, objects, and body parts (18-24 mos.)" },
        { key: "l5", label: "Points to object or picture when it's named for them (18-24 mos.)" },
        { key: "l6", label: "Repeats words overheard in conversations (16-18 mos.)" },
        { key: "l7", label: "Uses two-word sentences (18-24 mos.)" },
      ],
    },
    {
      name: "Cognitive Skills",
      key: "c",
      criteria: [
        { key: "c1", label: "Finds objects even when hidden under 2 or 3 covers (13-15 mos.)" },
        { key: "c2", label: "Will listen to short story book with pictures (15-20 mos.)" },
        { key: "c3", label: "Identifies one body part (15-24 mos.)" },
        { key: "c4", label: "Begins to sort shapes and colors (20-24 mos.)" },
        { key: "c5", label: "Begins make-believe play (20-24 mos.)" },
      ],
    },
    {
      name: "Social / Emotional Skills",
      key: "s",
      criteria: [
        { key: "s1", label: "Starts to feed self with spoon, with some spilling (13-18 mos.)" },
        { key: "s2", label: "Likes to play with food when eating (18-24 mos.)" },
        { key: "s3", label: "Can put shoes on with help (20-24 mos.)" },
        { key: "s4", label: "Can open doors by turning knobs (18-24 mos.)" },
        { key: "s5", label: "Can drink from open cup, with some spilling (18-24 mos.)" },
        { key: "s6", label: "Imitates behavior of others, especially adults and older children (18-24 mos.)" },
        { key: "s7", label: "Increasingly enthusiastic about company or other children (20-24 mos.)" },
        { key: "s8", label: "Demonstrates increasing independence (18-24 mos.)" },
        { key: "s9", label: "Begins to show defiant behavior (18-24 mos.)" },
        { key: "s10", label: "Episodes of separation anxiety increase toward midyear, then fade" },
      ],
    },
    {
      name: "Developmental Red Flags",
      key: "d",
      isRedFlags: true,
      criteria: [
        { key: "d1", label: "Cannot walk by 18 months" },
        { key: "d2", label: "Fails to develop a mature heel-toe walking pattern after several months of walking, or walks exclusively on toes" },
        { key: "d3", label: "Does not speak at least 15 words by 18 months" },
        { key: "d4", label: "Does not use unique two-word phrases by age 2" },
        { key: "d5", label: "Does not follow simple one-step instructions by 24 mos." },
        { key: "d6", label: "By 15 months does not seem to know the function of common household objects" },
        { key: "d7", label: "Does not follow simple one-step instructions by 24 mos." },
        { key: "d8", label: "Cannot identify self" },
        { key: "d9", label: "Cannot form a two-word phrase" },
        { key: "d10", label: "Cannot hold and use a spoon or cup for eating and drinking" },
        { key: "d11", label: "Does not display a wide array of emotions" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// ASSESSMENT 5: 24-36 Months
// ─────────────────────────────────────────────

const assessment5: AssessmentTypeConfig = {
  type: 5,
  name: "Development Report (24-36 months)",
  ageRange: "24-36 months",
  categories: [
    {
      name: "Gross Motor Skills",
      key: "m",
      criteria: [
        { key: "m1", label: "Climbs well (24-30 mos.)" },
        { key: "m2", label: "Walks down stairs alone, placing both feet on each step (26-28 mos.)" },
        { key: "m3", label: "Walks up stairs alternating feet with support (24-30 mos.)" },
        { key: "m4", label: "Swings leg to kick ball (24-30 mos.)" },
        { key: "m5", label: "Runs easily (24-26 mos.)" },
        { key: "m6", label: "Pedals tricycle (30-36 mos.)" },
        { key: "m7", label: "Bends over easily without falling (24-30 mos.)" },
      ],
    },
    {
      name: "Fine Motor Skills",
      key: "fm",
      criteria: [
        { key: "m8", label: "Makes vertical, horizontal, circular strokes with pencil or crayon (30-36 mos.)" },
        { key: "m9", label: "Turns book pages one at a time (24-30 mos.)" },
        { key: "m10", label: "Builds a tower of more than 6 blocks (24-30 mos.)" },
        { key: "m11", label: "Holds a pencil in writing position (30-36 mos.)" },
        { key: "m12", label: "Screws and unscrews jar lids, nuts, and bolts (24-30 mos.)" },
        { key: "m13", label: "Turns rotating handles (door knob) (24-30 mos.)" },
      ],
    },
    {
      name: "Language Skills",
      key: "l",
      criteria: [
        { key: "l1", label: "Uses pronouns (I, you, me, we, they) (24-30 mos.)" },
        { key: "l2", label: "Understands most sentences (24-40 mos.)" },
        { key: "l3", label: "Recognizes and identifies almost all common objects and pictures (26-32 mos.)" },
        { key: "l4", label: "Shows frustration when not understood by others (28-36 mos.)" },
        { key: "l5", label: "Understands physical relationships (on, in, under) (30-36 mos.)" },
        { key: "l6", label: "Can say name, age, and sex (30-36 mos.)" },
        { key: "l7", label: "Uses words to communicate wants and needs (30-36 mos.)" },
        { key: "l8", label: "Knows simple rhymes and songs (30-36 mos.)" },
        { key: "l9", label: "Strangers can understand most of words (30-36 mos.)" },
      ],
    },
    {
      name: "Cognitive Skills",
      key: "c",
      criteria: [
        { key: "c1", label: "Makes mechanical toys work (30-36 mos.)" },
        { key: "c2", label: "Matches an object in hand or room to a picture in a book (24-30 mos.)" },
        { key: "c3", label: "Plays make-believe with dolls, animals, and people (24-36 mos.)" },
        { key: "c4", label: "Sorts objects by color (30-36 mos.)" },
        { key: "c5", label: "Completes puzzles with 3 or 4 pieces (24-36 mos.)" },
        { key: "c6", label: "Understands concept of \"two\" (26-32 mos.)" },
        { key: "c7", label: "Listens to stories (24-36 mos.)" },
        { key: "c8", label: "Knows several body parts (24-36 mos.)" },
      ],
    },
    {
      name: "Social / Emotional Skills",
      key: "s",
      criteria: [
        { key: "s1", label: "Can pull pants down with help (24-36 mos.)" },
        { key: "s2", label: "Helps put things away (24-36 mos.)" },
        { key: "s3", label: "Serves self at table with some spilling (30-36 mos.)" },
        { key: "s4", label: "Uses the word \"mine\" often (24-36 mos.)" },
        { key: "s5", label: "Says \"no\" but will still do what is asked (24-36 mos.)" },
        { key: "s6", label: "Expresses a wide range of emotions (24-36 mos.)" },
        { key: "s7", label: "Objects to major changes in routine, but is becoming more compliant (24-36 mos.)" },
        { key: "s8", label: "Begins to follow simple rules (30-36 mos.)" },
        { key: "s9", label: "Begins to separate more easily from parents (by 36 mo.)" },
      ],
    },
    {
      name: "Developmental Red Flags",
      key: "d",
      isRedFlags: true,
      criteria: [
        { key: "d1", label: "Frequent falling and difficulty with stairs" },
        { key: "d2", label: "Persistent drooling or very unclear speech" },
        { key: "d3", label: "Inability to build a tower of more than 4 blocks" },
        { key: "d4", label: "Difficulty manipulating small objects" },
        { key: "d5", label: "Inability to copy a circle by 3 years old" },
        { key: "d6", label: "Inability to communicate in short phrases" },
        { key: "d7", label: "No involvement in pretend play" },
        { key: "d8", label: "Cannot feed self with spoon or drink from cup independently" },
        { key: "d9", label: "Failure to understand simple instructions" },
        { key: "d10", label: "Little interest in other children" },
        { key: "d11", label: "Extreme difficulty separating from primary caregiver" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// ASSESSMENT 6: 36-48 Months
// ─────────────────────────────────────────────

const assessment6: AssessmentTypeConfig = {
  type: 6,
  name: "Development Report (36-48 months)",
  ageRange: "36-48 months",
  categories: [
    {
      name: "Gross Motor Skills",
      key: "m",
      criteria: [
        { key: "m1", label: "Hops and stands on one foot up to 5 seconds" },
        { key: "m2", label: "Goes upstairs and downstairs without support" },
        { key: "m3", label: "Kicks ball forward" },
        { key: "m4", label: "Throws ball overhand" },
        { key: "m5", label: "Catches bounced ball most of the time" },
        { key: "m6", label: "Moves forward and backward" },
        { key: "m7", label: "Uses riding toys" },
      ],
    },
    {
      name: "Fine Motor Skills",
      key: "fm",
      criteria: [
        { key: "m8", label: "Copies square shapes" },
        { key: "m9", label: "Draws a person with 2-4 body parts" },
        { key: "m10", label: "Uses scissors" },
        { key: "m11", label: "Draws circles and squares" },
        { key: "m12", label: "Begins to copy some capital letters" },
      ],
    },
    {
      name: "Language Skills",
      key: "l",
      criteria: [
        { key: "l1", label: "Understands the concepts of \"same\" and \"different\"" },
        { key: "l2", label: "Has mastered some basic rules of grammar" },
        { key: "l3", label: "Speaks in sentences of 5-6 words" },
        { key: "l4", label: "Asks questions" },
        { key: "l5", label: "Speaks clearly enough for strangers to understand" },
        { key: "l6", label: "Tells stories" },
      ],
    },
    {
      name: "Cognitive Skills",
      key: "c",
      criteria: [
        { key: "c1", label: "Correctly names some colors" },
        { key: "c2", label: "Understands the concept of counting and may know a few numbers" },
        { key: "c3", label: "Begins to have a clearer sense of time" },
        { key: "c4", label: "Follows three-part commands" },
        { key: "c5", label: "Recalls parts of a story" },
        { key: "c6", label: "Understands the concept of same/different" },
        { key: "c7", label: "Engages in fantasy play" },
        { key: "c8", label: "Understands causality (\"I can make things happen\")" },
      ],
    },
    {
      name: "Social / Emotional Skills",
      key: "s",
      criteria: [
        { key: "s1", label: "Can feed self with spoon without spilling" },
        { key: "s2", label: "Washes and dries hands and face" },
        { key: "s3", label: "Can do simple household tasks (help set the table)" },
        { key: "s4", label: "Can put on simple clothing items, with help for button, zipper, shoelace" },
        { key: "s5", label: "Can run a brush or comb through own hair" },
        { key: "s6", label: "Interested in new experiences" },
        { key: "s7", label: "Cooperates/plays with other children" },
        { key: "s8", label: "Plays \"mom\" or \"dad\"" },
        { key: "s9", label: "More inventive in fantasy play" },
        { key: "s10", label: "Can stay on topic during conversations" },
        { key: "s11", label: "More independent" },
        { key: "s12", label: "Plays simple games with simple rules" },
        { key: "s13", label: "Begins to share toys with other children" },
        { key: "s14", label: "Often cannot distinguish between fantasy and reality" },
        { key: "s15", label: "May have imaginary friends or see monsters" },
      ],
    },
    {
      name: "Developmental Red Flags",
      key: "d",
      isRedFlags: true,
      criteria: [
        { key: "d1", label: "Cannot jump in place" },
        { key: "d2", label: "Cannot ride a trike" },
        { key: "d3", label: "Cannot grasp a crayon between thumb and fingers" },
        { key: "d4", label: "Has difficulty scribbling" },
        { key: "d5", label: "Cannot copy a circle" },
        { key: "d6", label: "Cannot stack 4 blocks" },
        { key: "d7", label: "Still clings or cries when parents leave him" },
        { key: "d8", label: "Shows no interest in interactive games" },
        { key: "d9", label: "Ignores other children" },
        { key: "d10", label: "Doesn't respond to people outside the family" },
        { key: "d11", label: "Doesn't engage in fantasy play" },
        { key: "d12", label: "Resists dressing, sleeping, using the toilet" },
        { key: "d13", label: "Lashes out without any self-control when angry or upset" },
        { key: "d14", label: "Doesn't use sentences of more than three words" },
        { key: "d15", label: "Doesn't use \"me\" or \"you\" appropriately" },
      ],
    },
  ],
};

// ─────────────────────────────────────────────
// ASSESSMENT 7: 48-60 Months
// ─────────────────────────────────────────────

const assessment7: AssessmentTypeConfig = {
  type: 7,
  name: "Development Report (48-60 months)",
  ageRange: "48-60 months",
  categories: [
    {
      name: "Gross Motor Skills",
      key: "m",
      criteria: [
        { key: "m1", label: "Stands on one foot for 10 seconds or longer" },
        { key: "m2", label: "Hops, somersaults" },
        { key: "m3", label: "Swings, climbs" },
        { key: "m4", label: "May be able to skip" },
      ],
    },
    {
      name: "Fine Motor Skills",
      key: "fm",
      criteria: [
        { key: "m5", label: "Copies triangle and other geometric patterns" },
        { key: "m6", label: "Draws person with body" },
        { key: "m7", label: "Prints some letters" },
        { key: "m8", label: "Dresses and undresses without assistance" },
      ],
    },
    {
      name: "Language Skills",
      key: "l",
      criteria: [
        { key: "l1", label: "Recalls parts of a story" },
        { key: "l2", label: "Speaks sentences of more than 5 words" },
        { key: "l3", label: "Uses future tense" },
        { key: "l4", label: "Tells longer stories" },
        { key: "l5", label: "Says name and address" },
      ],
    },
    {
      name: "Cognitive Skills",
      key: "c",
      criteria: [
        { key: "c1", label: "Can count 10 or more objects" },
        { key: "c2", label: "Correctly names at least 4 colors" },
        { key: "c3", label: "Works in small groups for 5-10 minutes" },
        { key: "c4", label: "Better understands the concept of time" },
        { key: "c5", label: "Knows about things used every day in the home (money, food, etc.)" },
      ],
    },
    {
      name: "Social / Emotional Skills",
      key: "s",
      criteria: [
        { key: "s1", label: "Uses fork, spoon independently" },
        { key: "s2", label: "Can chew with lips closed" },
        { key: "s3", label: "Goes to the bathroom independently, with reminders" },
        { key: "s4", label: "Undresses independently, may be able to unbutton and unzip" },
        { key: "s5", label: "Wants to please" },
        { key: "s6", label: "Prefers to be with friends" },
        { key: "s7", label: "More likely to agree to rules" },
        { key: "s8", label: "Likes to sing, dance, and act" },
        { key: "s9", label: "Shows more independence" },
      ],
    },
    {
      name: "Developmental Red Flags",
      key: "d",
      isRedFlags: true,
      criteria: [
        { key: "d1", label: "Exhibits extremely aggressive, fearful or timid behavior" },
        { key: "d2", label: "Is unable to separate from parents" },
        { key: "d3", label: "Is easily distracted and unable to concentrate on any single activity for more than 5 minutes" },
        { key: "d4", label: "Shows little interest in playing with other children" },
        { key: "d5", label: "Refuses to respond to people in general" },
        { key: "d6", label: "Rarely uses fantasy or imitation in play" },
        { key: "d7", label: "Seems unhappy or sad much of the time" },
        { key: "d8", label: "Avoids or seems aloof with other children and adults" },
        { key: "d9", label: "Does not express a wide range of emotions" },
        { key: "d10", label: "Has trouble eating, sleeping or using the toilet" },
        { key: "d11", label: "Cannot differentiate between fantasy and reality" },
        { key: "d12", label: "Seems unusually passive" },
        { key: "d13", label: "Cannot understand prepositions (\"put the cup on the table\"; \"get the ball under the couch\")" },
        { key: "d14", label: "Cannot follow 2-part commands (\"pick up the toy and put it on the shelf\")" },
        { key: "d15", label: "Cannot give his first and last name" },
        { key: "d16", label: "Does not use plurals or past tense" },
        { key: "d17", label: "Cannot build a tower of 6 to 8 blocks" },
        { key: "d18", label: "Holds crayon with fisted grasp" },
        { key: "d19", label: "Has trouble taking off clothing" },
        { key: "d20", label: "Unable to brush teeth or wash and dry hands" },
      ],
    },
  ],
};

// ── Lookup map ────────────────────────────────

export const ASSESSMENT_CONFIGS: Record<number, AssessmentTypeConfig> = {
  1: assessment1,
  2: assessment2,
  3: assessment3,
  4: assessment4,
  5: assessment5,
  6: assessment6,
  7: assessment7,
};

export function getAssessmentConfig(type: number): AssessmentTypeConfig | undefined {
  return ASSESSMENT_CONFIGS[type];
}
