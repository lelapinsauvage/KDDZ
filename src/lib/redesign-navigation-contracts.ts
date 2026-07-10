import {
  redesignDomainRouteContracts,
  type RedesignDomainId,
} from "./redesign-route-compatibility";

export type RedesignStaffRole = "ADMIN" | "MANAGER" | "TEACHER" | "NURSE" | "DOCTOR";
export type RedesignNavigationCapability =
  | "today.view"
  | "children.view"
  | "rooms.view"
  | "team.view"
  | "messages.view"
  | "finance.view"
  | "reports.run"
  | "settings.view"
  | "context.branches.read-all";
export type RedesignPolicySource =
  | "modern-role-default"
  | "imported-legacy-grant"
  | "direct-user-grant"
  | "contract-default";
export type RedesignScopeKind =
  | "organization"
  | "assigned-branches"
  | "assigned-rooms"
  | "assigned-reviews"
  | "pending-setup";

export type RedesignCapabilityDecision = {
  capability: RedesignNavigationCapability;
  allowed: boolean;
  policySource: RedesignPolicySource;
  reasonCode: string;
};

export type RedesignNavigationSnapshot = {
  role: RedesignStaffRole;
  decisions: readonly RedesignCapabilityDecision[];
  scope: { kind: RedesignScopeKind; branchIds: readonly string[] };
  availableBranches: readonly { id: string; name: string }[];
  preferredReadContextId?: string;
};

export type RedesignNavigationProjection = {
  role: RedesignStaffRole;
  destinations: Array<
    (typeof redesignDomainRouteContracts)[number] & {
      capability: RedesignNavigationCapability;
      policySource: RedesignPolicySource;
    }
  >;
  deniedDomains: RedesignDomainId[];
  branchContext: {
    status: "ready" | "pending-setup" | "no-effective-branch";
    readOptions: Array<{
      id: string;
      kind: "all" | "branch";
      label: string;
      writeAllowed: boolean;
    }>;
    writeBranchIds: string[];
    defaultReadContextId: string | null;
    defaultWriteBranchId: string | null;
  };
  issues: string[];
};

const domainCapability: Record<RedesignDomainId, RedesignNavigationCapability> = {
  today: "today.view",
  children: "children.view",
  rooms: "rooms.view",
  team: "team.view",
  messages: "messages.view",
  finance: "finance.view",
  reports: "reports.run",
  settings: "settings.view",
};

export const redesignNavigationCapabilities = [
  ...Object.values(domainCapability),
  "context.branches.read-all",
] as const;

function resolveDecision(
  decisions: readonly RedesignCapabilityDecision[],
  capability: RedesignNavigationCapability,
  issues: string[],
) {
  const matches = decisions.filter((decision) => decision.capability === capability);
  if (matches.length === 1) return matches[0];

  const reasonCode = matches.length ? "conflicting-policy" : "missing-policy";
  issues.push(`${capability}:${reasonCode}`);
  return {
    capability,
    allowed: false,
    policySource: "contract-default",
    reasonCode,
  } as const;
}

export function projectRedesignNavigation(
  snapshot: RedesignNavigationSnapshot,
): RedesignNavigationProjection {
  const issues: string[] = [];
  const availableBranches = [...new Map(
    snapshot.availableBranches
      .filter((branch) => branch.id.trim() && branch.name.trim())
      .map((branch) => [branch.id, { id: branch.id, name: branch.name.trim() }]),
  ).values()].sort((left, right) => left.name.localeCompare(right.name));
  const availableIds = new Set(availableBranches.map((branch) => branch.id));
  const assignedIds = [...new Set(snapshot.scope.branchIds)].filter((id) => {
    if (availableIds.has(id)) return true;
    issues.push("unknown-branch");
    return false;
  });
  const concreteBranches = snapshot.scope.kind === "organization"
    ? availableBranches
    : availableBranches.filter((branch) => assignedIds.includes(branch.id));
  const readAll = resolveDecision(
    snapshot.decisions,
    "context.branches.read-all",
    issues,
  );
  const canReadAll = readAll.allowed && snapshot.scope.kind === "organization";
  if (readAll.allowed && !canReadAll) issues.push("read-all-without-organization-scope");

  const readOptions = [
    ...(canReadAll && concreteBranches.length > 1
      ? [{ id: "all", kind: "all" as const, label: "All branches (read-only)", writeAllowed: false }]
      : []),
    ...concreteBranches.map((branch) => ({
      id: branch.id,
      kind: "branch" as const,
      label: branch.name,
      writeAllowed: true,
    })),
  ];
  const writeBranchIds = concreteBranches.map((branch) => branch.id);
  const preferredReadContextId = snapshot.preferredReadContextId;
  const defaultReadContextId = readOptions.some((option) => option.id === preferredReadContextId)
    ? preferredReadContextId ?? null
    : readOptions[0]?.id ?? null;
  const defaultWriteBranchId = preferredReadContextId && writeBranchIds.includes(preferredReadContextId)
    ? preferredReadContextId
    : writeBranchIds[0] ?? null;
  const branchStatus = snapshot.scope.kind === "pending-setup"
    ? "pending-setup"
    : concreteBranches.length
      ? "ready"
      : "no-effective-branch";

  const destinations = redesignDomainRouteContracts.flatMap((contract) => {
    const capability = domainCapability[contract.id];
    const decision = resolveDecision(snapshot.decisions, capability, issues);
    return decision.allowed
      ? [{ ...contract, capability, policySource: decision.policySource }]
      : [];
  });
  const destinationIds = new Set(destinations.map((destination) => destination.id));

  return {
    role: snapshot.role,
    destinations,
    deniedDomains: redesignDomainRouteContracts
      .map((contract) => contract.id)
      .filter((id) => !destinationIds.has(id)),
    branchContext: {
      status: branchStatus,
      readOptions,
      writeBranchIds,
      defaultReadContextId,
      defaultWriteBranchId,
    },
    issues,
  };
}

const fixtureBranches = [
  { id: "branch-hamra", name: "Hamra" },
  { id: "branch-riverside", name: "Riverside" },
] as const;

const roleDomains: Record<RedesignStaffRole, readonly RedesignDomainId[]> = {
  ADMIN: ["today", "children", "rooms", "team", "messages", "finance", "reports", "settings"],
  MANAGER: ["today", "children", "rooms", "team", "messages", "finance", "reports", "settings"],
  TEACHER: ["today", "children", "messages"],
  NURSE: ["today", "children", "messages"],
  DOCTOR: ["today", "children", "messages"],
};

function fixtureDecisions(
  role: RedesignStaffRole,
  readAllBranches = false,
): RedesignCapabilityDecision[] {
  const allowedDomains = new Set(roleDomains[role]);
  return redesignNavigationCapabilities.map((capability) => ({
    capability,
    allowed: capability === "context.branches.read-all"
      ? readAllBranches
      : allowedDomains.has(
          (Object.entries(domainCapability).find(([, value]) => value === capability)?.[0] ?? "") as RedesignDomainId,
        ),
    policySource: "modern-role-default",
    reasonCode: "provisional-role-baseline",
  }));
}

export type RedesignNavigationFixture = {
  id: string;
  snapshot: RedesignNavigationSnapshot;
  expected: {
    domains: readonly RedesignDomainId[];
    readContextIds: readonly string[];
    writeBranchIds: readonly string[];
    status: RedesignNavigationProjection["branchContext"]["status"];
    issueCount: number;
  };
};

export const redesignNavigationFixtures: readonly RedesignNavigationFixture[] = [
  {
    id: "administrator-organization",
    snapshot: {
      role: "ADMIN",
      decisions: fixtureDecisions("ADMIN", true),
      scope: { kind: "organization", branchIds: [] },
      availableBranches: fixtureBranches,
      preferredReadContextId: "all",
    },
    expected: {
      domains: roleDomains.ADMIN,
      readContextIds: ["all", "branch-hamra", "branch-riverside"],
      writeBranchIds: ["branch-hamra", "branch-riverside"],
      status: "ready",
      issueCount: 0,
    },
  },
  {
    id: "manager-two-branches",
    snapshot: {
      role: "MANAGER",
      decisions: fixtureDecisions("MANAGER"),
      scope: { kind: "assigned-branches", branchIds: ["branch-riverside", "branch-hamra"] },
      availableBranches: fixtureBranches,
      preferredReadContextId: "branch-riverside",
    },
    expected: {
      domains: roleDomains.MANAGER,
      readContextIds: ["branch-hamra", "branch-riverside"],
      writeBranchIds: ["branch-hamra", "branch-riverside"],
      status: "ready",
      issueCount: 0,
    },
  },
  {
    id: "manager-finance-explicitly-denied",
    snapshot: {
      role: "MANAGER",
      decisions: fixtureDecisions("MANAGER").map((decision) => decision.capability === "finance.view"
        ? {
            ...decision,
            allowed: false,
            policySource: "imported-legacy-grant" as const,
            reasonCode: "explicit-deny",
          }
        : decision),
      scope: { kind: "assigned-branches", branchIds: ["branch-riverside"] },
      availableBranches: fixtureBranches,
      preferredReadContextId: "branch-riverside",
    },
    expected: {
      domains: roleDomains.MANAGER.filter((domain) => domain !== "finance"),
      readContextIds: ["branch-riverside"],
      writeBranchIds: ["branch-riverside"],
      status: "ready",
      issueCount: 0,
    },
  },
  ...([
    ["teacher-assigned-room", "TEACHER", "assigned-rooms"],
    ["nurse-assigned-branch", "NURSE", "assigned-branches"],
    ["doctor-assigned-review", "DOCTOR", "assigned-reviews"],
  ] as const).map(([id, role, kind]) => ({
    id,
    snapshot: {
      role,
      decisions: fixtureDecisions(role),
      scope: { kind, branchIds: ["branch-riverside"] },
      availableBranches: fixtureBranches,
      preferredReadContextId: "branch-riverside",
    },
    expected: {
      domains: roleDomains[role],
      readContextIds: ["branch-riverside"],
      writeBranchIds: ["branch-riverside"],
      status: "ready" as const,
      issueCount: 0,
    },
  })),
  {
    id: "teacher-pending-setup",
    snapshot: {
      role: "TEACHER",
      decisions: fixtureDecisions("TEACHER"),
      scope: { kind: "pending-setup", branchIds: [] },
      availableBranches: fixtureBranches,
    },
    expected: {
      domains: roleDomains.TEACHER,
      readContextIds: [],
      writeBranchIds: [],
      status: "pending-setup",
      issueCount: 0,
    },
  },
] as const;

export function defaultRedesignNavigationFixture(role: RedesignStaffRole) {
  const defaultFixtureId: Record<RedesignStaffRole, string> = {
    ADMIN: "administrator-organization",
    MANAGER: "manager-two-branches",
    TEACHER: "teacher-assigned-room",
    NURSE: "nurse-assigned-branch",
    DOCTOR: "doctor-assigned-review",
  };
  const fixture = redesignNavigationFixtures.find(
    (candidate) => candidate.id === defaultFixtureId[role],
  );
  if (!fixture) throw new Error(`Missing default navigation fixture for ${role}`);
  return fixture;
}
