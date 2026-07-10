export type CallSurfaceId = "global-calls" | "branch-calls" | "child-call-history";
export type CallWorkStateId = "draft-report" | "submitted-record" | "missed-direction";
export type CallCapabilityId =
  | "calls.read"
  | "calls.create"
  | "calls.update"
  | "calls.submit"
  | "calls.void"
  | "calls.export";

export type CallSurfaceContract = {
  id: CallSurfaceId;
  targetDomain: "messages";
  targetPath: string;
  currentRoute: `/${string}`;
  purpose: string;
};

export type CallWorkStateContract = {
  id: CallWorkStateId;
  sourcePredicate: string;
  actionable: boolean;
  todayEligible: boolean;
  reason: string;
};

export type CallCapabilityContract = {
  id: CallCapabilityId;
  currentBoundary: string;
  targetScopeRule: string;
};

export const callSurfaceContracts = [
  {
    id: "global-calls",
    targetDomain: "messages",
    targetPath: "Messages / Calls",
    currentRoute: "/calls",
    purpose: "Cross-child call records, drafts, filtering, creation, export, and review.",
  },
  {
    id: "branch-calls",
    targetDomain: "messages",
    targetPath: "Messages / Calls / Branch filter",
    currentRoute: "/bcalls.php",
    purpose: "The global call workspace with a server-resolved branch filter, not a separate product.",
  },
  {
    id: "child-call-history",
    targetDomain: "messages",
    targetPath: "Children / Child / Communication / Calls",
    currentRoute: "/children/[id]/calls",
    purpose: "The same call records viewed in child context without forking their ownership or state.",
  },
] as const satisfies readonly CallSurfaceContract[];

export const callWorkStateContracts = [
  {
    id: "draft-report",
    sourcePredicate: "CallLog.isDraft = true",
    actionable: true,
    todayEligible: true,
    reason: "A saved report is incomplete server-owned work and can route back to its canonical record.",
  },
  {
    id: "submitted-record",
    sourcePredicate: "CallLog.isDraft = false",
    actionable: false,
    todayEligible: false,
    reason: "A submitted report is communication history unless another explicit workflow state exists.",
  },
  {
    id: "missed-direction",
    sourcePredicate: "CallLog.direction = MISSED",
    actionable: false,
    todayEligible: false,
    reason: "MISSED describes call direction; it does not prove an owner, callback request, due time, or resolution state.",
  },
] as const satisfies readonly CallWorkStateContract[];

const organizationOnlyBoundary =
  "Current actions require organization membership and organization-owned child records, but no explicit call capability.";

export const callCapabilityContracts = [
  {
    id: "calls.read",
    currentBoundary: organizationOnlyBoundary,
    targetScopeRule: "Require calls.read plus organization, assigned branch, room, or child scope before list/detail data is returned.",
  },
  {
    id: "calls.create",
    currentBoundary: organizationOnlyBoundary,
    targetScopeRule: "Require calls.create in a concrete child branch; never create in an all-branches context.",
  },
  {
    id: "calls.update",
    currentBoundary: organizationOnlyBoundary,
    targetScopeRule: "Require calls.update and record scope; distinguish own-draft and elevated any-record policies explicitly.",
  },
  {
    id: "calls.submit",
    currentBoundary: organizationOnlyBoundary,
    targetScopeRule: "Require calls.submit, a concrete branch, and complete server validation before draft transition.",
  },
  {
    id: "calls.void",
    currentBoundary: "Current delete is organization-bounded but hard-deletes the record without an explicit call capability.",
    targetScopeRule: "Require calls.void and preserve a reasoned audit event; do not silently hard-delete submitted communication history.",
  },
  {
    id: "calls.export",
    currentBoundary: organizationOnlyBoundary,
    targetScopeRule: "Require calls.export and apply the same record scope and filters as the visible collection.",
  },
] as const satisfies readonly CallCapabilityContract[];
