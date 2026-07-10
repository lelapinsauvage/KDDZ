import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  defaultRedesignNavigationFixture,
  projectRedesignNavigation,
  redesignNavigationCapabilities,
  redesignNavigationFixtures,
  type RedesignNavigationSnapshot,
  type RedesignStaffRole,
} from "../lib/redesign-navigation-contracts";

assert.equal(new Set(redesignNavigationCapabilities).size, 9);
assert.equal(new Set(redesignNavigationFixtures.map((fixture) => fixture.id)).size, redesignNavigationFixtures.length);

for (const fixture of redesignNavigationFixtures) {
  const projection = projectRedesignNavigation(fixture.snapshot);
  assert.deepEqual(
    projection.destinations.map((destination) => destination.id),
    fixture.expected.domains,
    `${fixture.id} destinations drifted`,
  );
  assert.deepEqual(
    projection.branchContext.readOptions.map((option) => option.id),
    fixture.expected.readContextIds,
    `${fixture.id} read scope drifted`,
  );
  assert.deepEqual(
    projection.branchContext.writeBranchIds,
    fixture.expected.writeBranchIds,
    `${fixture.id} write scope drifted`,
  );
  assert.equal(projection.branchContext.status, fixture.expected.status);
  assert.equal(projection.issues.length, fixture.expected.issueCount);
  assert(projection.branchContext.readOptions.every(
    (option) => option.kind !== "all" || !option.writeAllowed,
  ));
  assert(!projection.destinations.some(
    (destination) => destination.currentLanding.startsWith("/design-lab"),
  ));
}

const staffRoles: RedesignStaffRole[] = ["ADMIN", "MANAGER", "TEACHER", "NURSE", "DOCTOR"];
for (const role of staffRoles) {
  assert.equal(defaultRedesignNavigationFixture(role).snapshot.role, role);
}

const administrator = projectRedesignNavigation(defaultRedesignNavigationFixture("ADMIN").snapshot);
assert.deepEqual(administrator.branchContext.readOptions[0], {
  id: "all",
  kind: "all",
  label: "All branches (read-only)",
  writeAllowed: false,
});
assert.equal(administrator.branchContext.defaultReadContextId, "all");
assert.equal(administrator.branchContext.defaultWriteBranchId, "branch-hamra");

const managerFixture = defaultRedesignNavigationFixture("MANAGER");
const manager = projectRedesignNavigation(managerFixture.snapshot);
assert(!manager.branchContext.readOptions.some((option) => option.kind === "all"));
assert.equal(manager.branchContext.defaultReadContextId, "branch-riverside");
assert.equal(manager.branchContext.defaultWriteBranchId, "branch-riverside");

const explicitDeny = projectRedesignNavigation(
  redesignNavigationFixtures.find((fixture) => fixture.id === "manager-finance-explicitly-denied")!.snapshot,
);
assert(!explicitDeny.destinations.some((destination) => destination.id === "finance"));
assert(explicitDeny.deniedDomains.includes("finance"));

const branchless = projectRedesignNavigation(
  redesignNavigationFixtures.find((fixture) => fixture.id === "teacher-pending-setup")!.snapshot,
);
assert.equal(branchless.branchContext.status, "pending-setup");
assert.equal(branchless.branchContext.defaultReadContextId, null);
assert.equal(branchless.branchContext.defaultWriteBranchId, null);

const withoutFinancePolicy: RedesignNavigationSnapshot = {
  ...managerFixture.snapshot,
  decisions: managerFixture.snapshot.decisions.filter(
    (decision) => decision.capability !== "finance.view",
  ),
};
const missingPolicy = projectRedesignNavigation(withoutFinancePolicy);
assert(!missingPolicy.destinations.some((destination) => destination.id === "finance"));
assert(missingPolicy.issues.includes("finance.view:missing-policy"));

const conflictingToday = projectRedesignNavigation({
  ...managerFixture.snapshot,
  decisions: [
    ...managerFixture.snapshot.decisions,
    {
      capability: "today.view",
      allowed: false,
      policySource: "direct-user-grant",
      reasonCode: "conflict-fixture",
    },
  ],
});
assert(!conflictingToday.destinations.some((destination) => destination.id === "today"));
assert(conflictingToday.issues.includes("today.view:conflicting-policy"));

const invalidReadAll = projectRedesignNavigation({
  ...managerFixture.snapshot,
  decisions: managerFixture.snapshot.decisions.map((decision) =>
    decision.capability === "context.branches.read-all"
      ? { ...decision, allowed: true }
      : decision,
  ),
});
assert(!invalidReadAll.branchContext.readOptions.some((option) => option.kind === "all"));
assert(invalidReadAll.issues.includes("read-all-without-organization-scope"));

const unknownBranch = projectRedesignNavigation({
  ...managerFixture.snapshot,
  scope: { kind: "assigned-branches", branchIds: ["private-unknown-branch"] },
});
assert.deepEqual(unknownBranch.branchContext.readOptions, []);
assert.deepEqual(unknownBranch.issues, ["unknown-branch"]);
assert(!JSON.stringify(unknownBranch).includes("private-unknown-branch"));

const sameDecisionsDifferentRole = projectRedesignNavigation({
  ...defaultRedesignNavigationFixture("TEACHER").snapshot,
  role: "ADMIN",
});
assert.deepEqual(
  sameDecisionsDifferentRole.destinations.map((destination) => destination.id),
  ["today", "children", "messages"],
  "Projection must consume capability decisions, not role labels",
);

const labSource = readFileSync(
  "src/app/design-lab/ia/_components/ia-prototype.tsx",
  "utf8",
);
assert.match(labSource, /projectRedesignNavigation/);
assert.match(labSource, /data-policy-role/);
assert.match(labSource, /data-scope-status/);
assert.doesNotMatch(labSource, /const roleNavigation/);
assert.doesNotMatch(labSource, /const roleBranches/);

process.stdout.write(
  `Redesign navigation verification passed (${redesignNavigationFixtures.length} fixtures, ${staffRoles.length} staff roles)\n`,
);
