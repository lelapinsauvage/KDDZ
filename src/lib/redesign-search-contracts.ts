import type { RedesignDomainId } from "./redesign-route-compatibility"

export type RedesignSearchKind = "work" | "record" | "action" | "destination"
export type RedesignSearchMode = "read" | "write"

export type RedesignSearchScope =
  | { kind: "organization" }
  | { kind: "branch"; branchId: string }
  | { kind: "room"; branchId: string; roomId: string }
  | { kind: "record"; branchId: string; roomId?: string; recordId: string }

export type RedesignSearchCandidate = {
  id: string
  kind: RedesignSearchKind
  label: string
  detail: string
  path: string
  domain: RedesignDomainId
  href: `/${string}`
  organizationId: string
  requiredCapability: string
  mode: RedesignSearchMode
  scope: RedesignSearchScope
  keywords: readonly string[]
  suggested: boolean
  priority: number
}

export type RedesignSearchCapabilityDecision = {
  capability: string
  allowed: boolean
  policySource: string
  reasonCode: string
}

export type RedesignSearchEffectiveScope = {
  organizationId: string
  kind: "organization" | "assigned-branches" | "assigned-rooms" | "assigned-records" | "pending-setup"
  readableBranchIds: readonly string[]
  readableRoomIds: readonly string[]
  readableRecordIds: readonly string[]
  writeBranchIds: readonly string[]
  writeContextBranchId: string | null
  revision: number
}

export type RedesignSearchRequest = {
  requestId: string
  query: string
  limit: number
  candidates: readonly RedesignSearchCandidate[]
  decisions: readonly RedesignSearchCapabilityDecision[]
  scope: RedesignSearchEffectiveScope
}

export type RedesignSearchResult = RedesignSearchCandidate & {
  score: number
}

export type RedesignSearchProjection = {
  requestId: string
  scopeRevision: number
  normalizedQuery: string
  status: "READY" | "TOO_SHORT" | "NO_EFFECTIVE_SCOPE"
  resultCount: number
  moreAvailable: boolean
  results: RedesignSearchResult[]
  groups: Array<{ kind: RedesignSearchKind; results: RedesignSearchResult[] }>
  internalIssues: string[]
}

const kindWeight: Record<RedesignSearchKind, number> = {
  work: 40,
  action: 30,
  record: 20,
  destination: 10,
}

const groupOrder: RedesignSearchKind[] = ["work", "record", "action", "destination"]

export function normalizeRedesignSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/\s+/g, " ")
    .trim()
}

function uniqueValues(values: readonly string[]) {
  return [...new Set(values.filter((value) => value.trim()))]
}

function decisionFor(
  decisions: readonly RedesignSearchCapabilityDecision[],
  capability: string,
  issues: string[],
) {
  const matches = decisions.filter((decision) => decision.capability === capability)
  if (matches.length === 1) return matches[0]
  issues.push(`${capability}:${matches.length ? "conflicting-policy" : "missing-policy"}`)
  return null
}

function canReadCandidate(candidate: RedesignSearchCandidate, scope: RedesignSearchEffectiveScope) {
  if (candidate.organizationId !== scope.organizationId || scope.kind === "pending-setup") return false
  if (candidate.scope.kind === "organization") return true

  const branchReadable = scope.kind === "organization"
    || (scope.kind === "assigned-branches" && scope.readableBranchIds.includes(candidate.scope.branchId))
  if (candidate.scope.kind === "branch") return branchReadable
  if (candidate.scope.kind === "room") {
    return branchReadable
      || (scope.kind === "assigned-rooms" && scope.readableRoomIds.includes(candidate.scope.roomId))
  }
  return branchReadable
    || (scope.kind === "assigned-rooms" && Boolean(candidate.scope.roomId) && scope.readableRoomIds.includes(candidate.scope.roomId ?? ""))
    || (scope.kind === "assigned-records" && scope.readableRecordIds.includes(candidate.scope.recordId))
}

function canWriteCandidate(candidate: RedesignSearchCandidate, scope: RedesignSearchEffectiveScope) {
  if (candidate.mode === "read") return true
  if (candidate.scope.kind === "organization") return false
  return scope.writeContextBranchId === candidate.scope.branchId
    && scope.writeBranchIds.includes(candidate.scope.branchId)
}

function candidateScore(candidate: RedesignSearchCandidate, normalizedQuery: string) {
  if (!normalizedQuery) return candidate.suggested ? 100 + candidate.priority + kindWeight[candidate.kind] : -1

  const label = normalizeRedesignSearchText(candidate.label)
  const searchText = normalizeRedesignSearchText([
    candidate.label,
    candidate.detail,
    candidate.path,
    ...candidate.keywords,
  ].join(" "))
  const tokens = normalizedQuery.split(" ")
  let relevance = -1
  if (label === normalizedQuery) relevance = 1_000
  else if (label.startsWith(normalizedQuery)) relevance = 800
  else if (label.split(" ").some((word) => word.startsWith(normalizedQuery))) relevance = 600
  else if (tokens.every((token) => searchText.includes(token))) relevance = 400
  else if (searchText.includes(normalizedQuery)) relevance = 300
  if (relevance < 0) return -1
  return relevance + candidate.priority + kindWeight[candidate.kind]
}

function validateCandidates(candidates: readonly RedesignSearchCandidate[]) {
  const ids = new Set<string>()
  for (const candidate of candidates) {
    if (!candidate.id.trim() || ids.has(candidate.id)) throw new Error("Search candidates require unique ids")
    if (!candidate.label.trim() || !candidate.path.trim()) throw new Error("Search candidates require labels and paths")
    if (!candidate.href.startsWith("/")) throw new Error("Search candidate routes must be same-origin paths")
    if (!candidate.requiredCapability.trim()) throw new Error("Search candidates require a capability")
    if (!Number.isFinite(candidate.priority)) throw new Error("Search candidate priority is invalid")
    ids.add(candidate.id)
  }
}

export function projectRedesignSearch(request: RedesignSearchRequest): RedesignSearchProjection {
  if (!request.requestId.trim()) throw new Error("Search requests require an id")
  if (!Number.isInteger(request.scope.revision) || request.scope.revision < 0) {
    throw new Error("Search scope revision is invalid")
  }
  validateCandidates(request.candidates)

  const normalizedQuery = normalizeRedesignSearchText(request.query)
  const internalIssues: string[] = []
  const limit = Math.min(Math.max(Math.trunc(request.limit) || 1, 1), 20)
  if (request.scope.kind === "pending-setup") {
    return {
      requestId: request.requestId,
      scopeRevision: request.scope.revision,
      normalizedQuery,
      status: "NO_EFFECTIVE_SCOPE",
      resultCount: 0,
      moreAvailable: false,
      results: [],
      groups: [],
      internalIssues,
    }
  }
  if (normalizedQuery.length === 1) {
    return {
      requestId: request.requestId,
      scopeRevision: request.scope.revision,
      normalizedQuery,
      status: "TOO_SHORT",
      resultCount: 0,
      moreAvailable: false,
      results: [],
      groups: [],
      internalIssues,
    }
  }

  const allowed = request.candidates.flatMap((candidate) => {
    const decision = decisionFor(request.decisions, candidate.requiredCapability, internalIssues)
    if (!decision?.allowed || !canReadCandidate(candidate, request.scope) || !canWriteCandidate(candidate, request.scope)) return []
    const score = candidateScore(candidate, normalizedQuery)
    return score >= 0 ? [{ ...candidate, keywords: uniqueValues(candidate.keywords), score }] : []
  }).sort((left, right) =>
    right.score - left.score
    || left.label.localeCompare(right.label, "en", { sensitivity: "base" })
    || left.id.localeCompare(right.id),
  )
  const results = allowed.slice(0, limit)

  return {
    requestId: request.requestId,
    scopeRevision: request.scope.revision,
    normalizedQuery,
    status: "READY",
    resultCount: results.length,
    moreAvailable: allowed.length > results.length,
    results,
    groups: groupOrder.flatMap((kind) => {
      const groupResults = results.filter((result) => result.kind === kind)
      return groupResults.length ? [{ kind, results: groupResults }] : []
    }),
    internalIssues: [...new Set(internalIssues)].sort(),
  }
}

const organizationId = "org-kiddz-fixture"

export const redesignSearchFixtureCandidates: readonly RedesignSearchCandidate[] = [
  {
    id: "work-meadow-cover",
    kind: "work",
    label: "Assign qualified cover to Meadow",
    detail: "Meadow becomes under-covered at 12:30",
    path: "Rooms / Meadow / Coverage / 12:30-13:00",
    domain: "rooms",
    href: "/classes",
    organizationId,
    requiredCapability: "rooms.view",
    mode: "read",
    scope: { kind: "room", branchId: "branch-riverside", roomId: "room-meadow" },
    keywords: ["ratio", "staffing", "break"],
    suggested: true,
    priority: 90,
  },
  {
    id: "work-payment-allocation",
    kind: "work",
    label: "Allocate EUR 240 payment",
    detail: "Martin family payment is not allocated",
    path: "Finance / Needs allocation / Martin family",
    domain: "finance",
    href: "/accounting",
    organizationId,
    requiredCapability: "finance.view",
    mode: "read",
    scope: { kind: "branch", branchId: "branch-riverside" },
    keywords: ["invoice", "balance", "reconcile"],
    suggested: true,
    priority: 70,
  },
  {
    id: "record-alma-reyes",
    kind: "record",
    label: "Alma Reyes",
    detail: "Meadow / Riverside",
    path: "Children / Alma Reyes",
    domain: "children",
    href: "/children/child-alma",
    organizationId,
    requiredCapability: "children.view",
    mode: "read",
    scope: { kind: "record", branchId: "branch-riverside", roomId: "room-meadow", recordId: "child-alma" },
    keywords: ["child", "attendance"],
    suggested: false,
    priority: 50,
  },
  {
    id: "record-leo-hamra",
    kind: "record",
    label: "Leo Haddad",
    detail: "Cedars / Hamra",
    path: "Children / Leo Haddad",
    domain: "children",
    href: "/children/child-leo-hamra",
    organizationId,
    requiredCapability: "children.view",
    mode: "read",
    scope: { kind: "record", branchId: "branch-hamra", roomId: "room-cedars", recordId: "child-leo-hamra" },
    keywords: ["child", "attendance"],
    suggested: false,
    priority: 50,
  },
  {
    id: "action-observe-attendance",
    kind: "action",
    label: "Record observed attendance",
    detail: "Meadow / Riverside",
    path: "Today / Meadow / Attendance",
    domain: "today",
    href: "/today",
    organizationId,
    requiredCapability: "attendance.observe",
    mode: "write",
    scope: { kind: "room", branchId: "branch-riverside", roomId: "room-meadow" },
    keywords: ["check in", "arrival", "present"],
    suggested: true,
    priority: 81,
  },
  {
    id: "action-register-child",
    kind: "action",
    label: "Register a child",
    detail: "Create a Riverside enrollment draft",
    path: "Children / New child",
    domain: "children",
    href: "/children/new",
    organizationId,
    requiredCapability: "children.create",
    mode: "write",
    scope: { kind: "branch", branchId: "branch-riverside" },
    keywords: ["new", "enroll", "add"],
    suggested: false,
    priority: 40,
  },
  {
    id: "destination-children",
    kind: "destination",
    label: "Children",
    detail: "Directory, attendance, care, health, and development",
    path: "Children",
    domain: "children",
    href: "/children",
    organizationId,
    requiredCapability: "children.view",
    mode: "read",
    scope: { kind: "organization" },
    keywords: ["directory", "records"],
    suggested: false,
    priority: 10,
  },
  {
    id: "destination-finance",
    kind: "destination",
    label: "Finance",
    detail: "Invoices, payments, allocations, and balances",
    path: "Finance",
    domain: "finance",
    href: "/accounting",
    organizationId,
    requiredCapability: "finance.view",
    mode: "read",
    scope: { kind: "organization" },
    keywords: ["accounting", "invoice", "payment"],
    suggested: false,
    priority: 10,
  },
] as const

function fixtureDecisions(allowed: readonly string[]): RedesignSearchCapabilityDecision[] {
  const capabilities = ["rooms.view", "finance.view", "children.view", "attendance.observe", "children.create"]
  return capabilities.map((capability) => ({
    capability,
    allowed: allowed.includes(capability),
    policySource: "fixture-policy",
    reasonCode: allowed.includes(capability) ? "fixture-allow" : "fixture-deny",
  }))
}

export const redesignSearchFixtures = {
  managerRiverside: {
    decisions: fixtureDecisions(["rooms.view", "finance.view", "children.view", "attendance.observe", "children.create"]),
    scope: {
      organizationId,
      kind: "assigned-branches",
      readableBranchIds: ["branch-riverside"],
      readableRoomIds: [],
      readableRecordIds: [],
      writeBranchIds: ["branch-riverside"],
      writeContextBranchId: "branch-riverside",
      revision: 7,
    } satisfies RedesignSearchEffectiveScope,
  },
  teacherMeadow: {
    decisions: fixtureDecisions(["children.view", "attendance.observe"]),
    scope: {
      organizationId,
      kind: "assigned-rooms",
      readableBranchIds: [],
      readableRoomIds: ["room-meadow"],
      readableRecordIds: [],
      writeBranchIds: ["branch-riverside"],
      writeContextBranchId: "branch-riverside",
      revision: 4,
    } satisfies RedesignSearchEffectiveScope,
  },
  administratorAllReadOnly: {
    decisions: fixtureDecisions(["rooms.view", "finance.view", "children.view", "attendance.observe", "children.create"]),
    scope: {
      organizationId,
      kind: "organization",
      readableBranchIds: ["branch-riverside", "branch-hamra"],
      readableRoomIds: [],
      readableRecordIds: [],
      writeBranchIds: ["branch-riverside", "branch-hamra"],
      writeContextBranchId: null,
      revision: 9,
    } satisfies RedesignSearchEffectiveScope,
  },
} as const
