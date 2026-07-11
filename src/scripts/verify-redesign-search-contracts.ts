import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  normalizeRedesignSearchText,
  projectRedesignSearch,
  redesignSearchFixtureCandidates,
  redesignSearchFixtures,
} from "../lib/redesign-search-contracts"

function project(
  fixture: (typeof redesignSearchFixtures)[keyof typeof redesignSearchFixtures],
  query: string,
  limit = 20,
) {
  return projectRedesignSearch({
    requestId: `request-${fixture.scope.revision}-${query || "suggested"}`,
    query,
    limit,
    candidates: redesignSearchFixtureCandidates,
    decisions: fixture.decisions,
    scope: fixture.scope,
  })
}

assert.equal(normalizeRedesignSearchText("  LÉO   Haddad  "), "leo haddad")

const managerSuggestions = project(redesignSearchFixtures.managerRiverside, "")
assert.equal(managerSuggestions.status, "READY")
assert.deepEqual(managerSuggestions.results.map((result) => result.id), [
  "work-meadow-cover",
  "action-observe-attendance",
  "work-payment-allocation",
])
assert(!("hiddenCount" in managerSuggestions))

const managerPayment = project(redesignSearchFixtures.managerRiverside, "payment")
assert.deepEqual(managerPayment.results.map((result) => result.id), [
  "work-payment-allocation",
  "destination-finance",
])
assert.deepEqual(managerPayment.groups.map((group) => group.kind), ["work", "destination"])

const managerAlma = project(redesignSearchFixtures.managerRiverside, "alma")
assert.deepEqual(managerAlma.results.map((result) => result.id), ["record-alma-reyes"])
assert.equal(project(redesignSearchFixtures.managerRiverside, "leo").resultCount, 0)

const teacherAttendance = project(redesignSearchFixtures.teacherMeadow, "attendance")
assert.deepEqual(teacherAttendance.results.map((result) => result.id), [
  "action-observe-attendance",
  "record-alma-reyes",
  "destination-children",
])
assert.equal(project(redesignSearchFixtures.teacherMeadow, "payment").resultCount, 0)
assert.equal(project(redesignSearchFixtures.teacherMeadow, "leo").resultCount, 0)

const allReadOnly = project(redesignSearchFixtures.administratorAllReadOnly, "")
assert(allReadOnly.results.every((result) => result.mode === "read"))
assert.equal(project(redesignSearchFixtures.administratorAllReadOnly, "register").resultCount, 0)
assert.deepEqual(project(redesignSearchFixtures.administratorAllReadOnly, "leo").results.map((result) => result.id), [
  "record-leo-hamra",
])

const shortQuery = project(redesignSearchFixtures.managerRiverside, "a")
assert.equal(shortQuery.status, "TOO_SHORT")
assert.equal(shortQuery.resultCount, 0)

const limited = project(redesignSearchFixtures.managerRiverside, "payment", 1)
assert.equal(limited.resultCount, 1)
assert.equal(limited.moreAvailable, true)

const stalePolicy = projectRedesignSearch({
  requestId: "request-missing-policy",
  query: "payment",
  limit: 10,
  candidates: redesignSearchFixtureCandidates,
  decisions: redesignSearchFixtures.managerRiverside.decisions.filter((decision) => decision.capability !== "finance.view"),
  scope: redesignSearchFixtures.managerRiverside.scope,
})
assert.equal(stalePolicy.resultCount, 0)
assert.deepEqual(stalePolicy.internalIssues, ["finance.view:missing-policy"])

const noScope = projectRedesignSearch({
  requestId: "request-no-scope",
  query: "alma",
  limit: 10,
  candidates: redesignSearchFixtureCandidates,
  decisions: redesignSearchFixtures.managerRiverside.decisions,
  scope: { ...redesignSearchFixtures.managerRiverside.scope, kind: "pending-setup" },
})
assert.equal(noScope.status, "NO_EFFECTIVE_SCOPE")
assert.equal(noScope.resultCount, 0)

assert.throws(() => projectRedesignSearch({
  requestId: "request-duplicate",
  query: "alma",
  limit: 10,
  candidates: [...redesignSearchFixtureCandidates, redesignSearchFixtureCandidates[0]],
  decisions: redesignSearchFixtures.managerRiverside.decisions,
  scope: redesignSearchFixtures.managerRiverside.scope,
}), /unique ids/)

const productionAction = readFileSync(resolve("src/lib/actions/search.ts"), "utf8")
const productionDialog = readFileSync(resolve("src/components/layout/global-search.tsx"), "utf8")
const iaPrototype = readFileSync(resolve("src/app/design-lab/ia/_components/ia-prototype.tsx"), "utf8")
const iaHarness = readFileSync(resolve("src/app/design-lab/ia/_components/ia-axe-harness.tsx"), "utf8")
const contractDocument = readFileSync(resolve("docs/redesign/global-search-contract.md"), "utf8")

assert.match(productionAction, /const \{ organizationId: orgId \} = await requireOrg\(\)/)
assert.match(productionAction, /branch: \{ organizationId: orgId \}/)
assert.doesNotMatch(productionAction, /assignedRoom|assignedBranch|scopeRevision|requestId/)
assert.match(productionDialog, /garderie-recent-pages/)
assert.match(productionDialog, /garderie-recent-searches/)
assert.match(productionDialog, /localStorage\.setItem/)
assert.match(productionDialog, /const quickActions =/)
assert.match(productionDialog, /const pages =/)
assert.match(iaPrototype, /projectRedesignSearch/)
assert.match(iaPrototype, /searchProjection\.groups\.map/)
assert.match(iaPrototype, /event\.metaKey \|\| event\.ctrlKey/)
assert.match(iaPrototype, /id="ia-path-heading" ref=\{pathHeadingRef\} tabIndex=\{-1\}/)
assert.doesNotMatch(iaPrototype, /localStorage/)
assert.match(iaHarness, /auditNodeId="kiddz-ia-axe-audit"/)
assert.match(contractDocument, /## Additive Production Migration/)
assert.match(contractDocument, /zero axe violations or unresolved findings/)

process.stdout.write(
  "Redesign search verification passed (capability filtering, effective scope, concrete writes, stable ranking, privacy-safe counts)\n",
)
