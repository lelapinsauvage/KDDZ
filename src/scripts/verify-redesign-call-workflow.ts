import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  callCapabilityContracts,
  callSurfaceContracts,
  callWorkStateContracts,
} from "../lib/redesign-call-workflow-contracts";
import {
  legacyAliasContracts,
  redesignDomainRouteContracts,
} from "../lib/redesign-route-compatibility";

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function appRouteFromFile(path: string) {
  const relative = path
    .slice(resolve("src/app").length)
    .replaceAll("\\", "/")
    .replace(/\/(page\.tsx|route\.ts)$/, "")
    .replace(/\/\([^/]+\)/g, "");
  return relative || "/";
}

const read = (path: string) => readFileSync(resolve(path), "utf8");
const routeFiles = walk(resolve("src/app")).filter((path) => /\/(page\.tsx|route\.ts)$/.test(path));
const appRoutes = new Set(routeFiles.map(appRouteFromFile));
const schema = read("prisma/schema.prisma");
const actions = read("src/lib/actions/calls.ts");
const iaPrototype = read("src/app/design-lab/ia/_components/ia-prototype.tsx");
const callModel = schema.match(/model CallLog \{[\s\S]*?\n\}/)?.[0];
const draftCallTask = iaPrototype.match(/\{\n\s+id: "draft-call-report",[\s\S]*?\n\s+\},/)?.[0];

assert(callModel, "CallLog model is missing");
assert.match(callModel, /direction\s+CallDirection/);
assert.match(callModel, /isDraft\s+Boolean/);
assert.doesNotMatch(
  callModel,
  /callback|followUp|follow_up|resolvedAt|acknowledgedAt|dueAt|workOwnerId/i,
  "CallLog gained follow-up state; the workflow contract needs a deliberate re-audit",
);

assert.equal(callSurfaceContracts.length, 3);
assert.equal(new Set(callSurfaceContracts.map((surface) => surface.id)).size, 3);
assert(callSurfaceContracts.every((surface) => surface.targetDomain === "messages"));
for (const surface of callSurfaceContracts) {
  assert(appRoutes.has(surface.currentRoute), `${surface.id} current route is not live`);
}

const messagesDomain = redesignDomainRouteContracts.find((domain) => domain.id === "messages");
assert(messagesDomain?.currentRoots.includes("/calls"), "Calls must remain mapped to the Messages domain");

const legacyCallAliases = legacyAliasContracts.filter((alias) =>
  ["/calls.php", "/bcalls.php", "/call.php", "/child_calls.php"].includes(alias.sourceRoute),
);
assert.equal(legacyCallAliases.length, 4);
assert(legacyCallAliases.every((alias) => alias.domain === "messages"));
assert.deepEqual(
  legacyCallAliases.find((alias) => alias.sourceRoute === "/bcalls.php")?.acceptedQueryKeys,
  ["brid", "search", "class", "direction", "dateFrom", "dateTo", "page", "pageSize"],
);
assert.deepEqual(
  legacyCallAliases.find((alias) => alias.sourceRoute === "/call.php")?.acceptedQueryKeys,
  ["fid", "id"],
);

assert.equal(callWorkStateContracts.length, 3);
assert.equal(callWorkStateContracts.filter((state) => state.todayEligible).length, 1);
assert.deepEqual(
  callWorkStateContracts.find((state) => state.todayEligible)?.id,
  "draft-report",
);
assert.equal(
  callWorkStateContracts.find((state) => state.id === "missed-direction")?.actionable,
  false,
);
assert.match(actions, /if \(data\.isDraft\) return null/);
assert.match(actions, /where\.isDraft = isDraft/);
assert.match(actions, /direction === "MISSED"/);
assert.match(actions, /requireOrgSafe\(\)/);
assert.doesNotMatch(actions, /require(?:Call)?Capability|calls\.(?:read|create|update|submit|void|export)/);

assert.equal(callCapabilityContracts.length, 6);
assert.equal(new Set(callCapabilityContracts.map((capability) => capability.id)).size, 6);
assert(callCapabilityContracts.every((capability) => capability.targetScopeRule.length > 40));

assert(draftCallTask, "The IA call task fixture is missing");
assert.match(draftCallTask, /domain: "messages"/);
assert.match(draftCallTask, /path: "Messages \/ Calls \/ Drafts \/ Alma Reyes"/);
assert.match(draftCallTask, /roles: \["admin", "manager", "teacher"\]/);
assert.doesNotMatch(iaPrototype, /return (?:a )?missed call/i);

assert(existsSync(resolve("src/scripts/verify-legacy-calls-contract.ts")));
assert.match(read("src/app/(app)/call.php/page.tsx"), /params=\{Promise\.resolve\(\{ id: fid\.trim\(\) \}\)\}/);
assert.match(read("src/app/(app)/bcalls.php/page.tsx"), /resolveLegacyBranchId\(brid\)/);

process.stdout.write(
  `Redesign call workflow verification passed (${callSurfaceContracts.length} surfaces, ${callWorkStateContracts.length} states, ${callCapabilityContracts.length} capabilities, ${legacyCallAliases.length} legacy aliases)\n`,
);
