export type RedesignStateId =
  | "initial"
  | "loading"
  | "empty"
  | "partial"
  | "unknown"
  | "draft"
  | "validation"
  | "denied"
  | "failure"
  | "offline"
  | "conflict"
  | "waiting"
  | "success"
  | "corrected"
  | "closed";

export type RedesignStateGroup = "Data" | "Input" | "System" | "Result";

export type RedesignStateContract = {
  id: RedesignStateId;
  label: string;
  group: RedesignStateGroup;
  summary: string;
  sourceStatus: string;
  completion: string;
  revision: string;
  rules: readonly [string, string];
};

export const redesignStateGroups = ["Data", "Input", "System", "Result"] as const;

export const redesignStateOrder = [
  "initial",
  "loading",
  "empty",
  "partial",
  "unknown",
  "draft",
  "validation",
  "denied",
  "failure",
  "offline",
  "conflict",
  "waiting",
  "success",
  "corrected",
  "closed",
] as const satisfies readonly RedesignStateId[];

export const redesignStateContracts: Record<RedesignStateId, RedesignStateContract> = {
  initial: {
    id: "initial",
    label: "Initial",
    group: "Data",
    summary: "Stable page identity appears before secondary data or action.",
    sourceStatus: "Not submitted",
    completion: "0 of 2 submitted",
    revision: "No revision",
    rules: ["Factual fields remain unset until observed.", "One primary action explains the next step."],
  },
  loading: {
    id: "loading",
    label: "Loading",
    group: "Data",
    summary: "Structural placeholders preserve the final geometry and page identity.",
    sourceStatus: "Loading",
    completion: "0 of 2 submitted",
    revision: "No revision",
    rules: ["Placeholder geometry matches final content.", "Loading status is announced without moving focus."],
  },
  empty: {
    id: "empty",
    label: "Empty",
    group: "Data",
    summary: "Accurate scope and date explain why there is no work.",
    sourceStatus: "Not submitted",
    completion: "No roster records",
    revision: "No revision",
    rules: ["Scope and date make the empty meaning accurate.", "The action repairs the source, not a generic dead end."],
  },
  partial: {
    id: "partial",
    label: "Partial",
    group: "Data",
    summary: "Available facts remain useful while missing source data is explicit.",
    sourceStatus: "Not submitted",
    completion: "1 available · 1 blocked",
    revision: "No revision",
    rules: ["Available records remain usable.", "Missing source and freshness prevent false completion."],
  },
  unknown: {
    id: "unknown",
    label: "Unknown",
    group: "Input",
    summary: "An unobserved factual value stays unset with a clear owner and action.",
    sourceStatus: "Not submitted",
    completion: "0 of 2 submitted",
    revision: "No revision",
    rules: ["Unknown is visibly different from zero or none.", "The missing fact has an owner and valid action."],
  },
  draft: {
    id: "draft",
    label: "Draft",
    group: "Input",
    summary: "Persisted but incomplete input exposes scope, revision, and resume state.",
    sourceStatus: "Draft",
    completion: "0 of 2 submitted",
    revision: "3 · local draft",
    rules: ["Saved time, device, scope, and revision are visible.", "Draft is never counted as submitted completion."],
  },
  validation: {
    id: "validation",
    label: "Validation",
    group: "Input",
    summary: "Errors stay beside their source and preserve every entered value.",
    sourceStatus: "Not submitted",
    completion: "0 of 2 submitted",
    revision: "No revision",
    rules: ["Errors sit beside the affected field.", "Input is preserved and the first error can receive focus."],
  },
  denied: {
    id: "denied",
    label: "Permission denied",
    group: "System",
    summary: "The user receives a safe reason and return path without record leakage.",
    sourceStatus: "Not submitted",
    completion: "0 of 2 submitted",
    revision: "No revision",
    rules: ["The reason category and safe return path are visible.", "Out-of-scope record existence is not revealed."],
  },
  failure: {
    id: "failure",
    label: "Server failure",
    group: "System",
    summary: "Input and context survive while retry and escalation remain adjacent.",
    sourceStatus: "Save failed",
    completion: "0 of 2 submitted",
    revision: "3 · local draft",
    rules: ["Entered values survive the failure.", "Retry is idempotent and escalation remains adjacent."],
  },
  offline: {
    id: "offline",
    label: "Offline",
    group: "System",
    summary: "The UI names what is cached, queued, blocked, and not yet authoritative.",
    sourceStatus: "Draft",
    completion: "0 of 2 submitted",
    revision: "3 · local draft",
    rules: ["Queued work is not presented as server-confirmed.", "Unsynced scope and conflict policy are visible."],
  },
  conflict: {
    id: "conflict",
    label: "Conflict",
    group: "System",
    summary: "Server and local revisions are compared before an authorized resolution.",
    sourceStatus: "Draft",
    completion: "0 of 2 submitted",
    revision: "4 local · 5 server",
    rules: ["Server and local revisions are compared.", "Resolution preserves the discarded revision and reason."],
  },
  waiting: {
    id: "waiting",
    label: "Waiting",
    group: "Result",
    summary: "A dependency, owner, elapsed time, and next rule keep work accountable.",
    sourceStatus: "Submitted · waiting",
    completion: "2 of 2 submitted",
    revision: "5 · server confirmed",
    rules: ["Dependency, owner, elapsed time, and next rule are named.", "The source record remains submitted while work stays open."],
  },
  success: {
    id: "success",
    label: "Success",
    group: "Result",
    summary: "Server confirmation updates the source object and linked work immediately.",
    sourceStatus: "Submitted",
    completion: "2 of 2 submitted",
    revision: "5 · server confirmed",
    rules: ["The server result updates source and linked work.", "Counts and history derive from the accepted response."],
  },
  corrected: {
    id: "corrected",
    label: "Corrected",
    group: "Result",
    summary: "The original record, reason, actor, and new revision remain visible.",
    sourceStatus: "Corrected",
    completion: "2 of 2 submitted",
    revision: "6 · original preserved",
    rules: ["Original values and revisions remain visible.", "Reason, actor, and corrected result are explicit."],
  },
  closed: {
    id: "closed",
    label: "Closed",
    group: "Result",
    summary: "Active treatment ends while result and evidence stay discoverable.",
    sourceStatus: "Closed",
    completion: "2 of 2 submitted",
    revision: "6 · original preserved",
    rules: ["Active-work treatment ends.", "Result, evidence, and audit history remain discoverable."],
  },
};

const commonStateRules = [
  "Page identity and source scope remain visible.",
  "No toast or animation is the only proof of state.",
] as const;

export function redesignStateAcceptanceRules(state: RedesignStateId) {
  return [...commonStateRules, ...redesignStateContracts[state].rules] as const;
}

export function isRedesignStateId(value: unknown): value is RedesignStateId {
  return typeof value === "string" && value in redesignStateContracts;
}
