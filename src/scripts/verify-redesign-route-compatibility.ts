import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  legacyAliasContracts,
  nativeCompatibilityRoutePatterns,
  observeRedesignRoute,
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

const routeFiles = walk(resolve("src/app")).filter((path) => /\/(page\.tsx|route\.ts)$/.test(path));
const appRoutes = new Set(routeFiles.map(appRouteFromFile));

assert.equal(redesignDomainRouteContracts.length, 8, "Staff IA must keep exactly eight domains");
assert.equal(
  new Set(redesignDomainRouteContracts.map((contract) => contract.id)).size,
  redesignDomainRouteContracts.length,
  "Domain IDs must be unique",
);
assert.equal(
  new Set(redesignDomainRouteContracts.map((contract) => contract.targetRoot)).size,
  redesignDomainRouteContracts.length,
  "Target roots must be unique",
);

for (const contract of redesignDomainRouteContracts) {
  assert(!contract.targetRoot.startsWith("/design-lab"), `${contract.id} cannot target design-lab`);
  assert(!contract.currentLanding.startsWith("/design-lab"), `${contract.id} cannot land in design-lab`);
  assert(appRoutes.has(contract.currentLanding), `${contract.id} current landing is not a live route`);

  for (const root of contract.currentRoots) {
    assert(
      [...appRoutes].some((route) => route === root || route.startsWith(`${root}/`)),
      `${contract.id} current root ${root} is not represented in the app route tree`,
    );
  }

  if (contract.targetAvailability === "live") {
    assert(appRoutes.has(contract.targetRoot), `${contract.id} target is marked live but does not exist`);
  } else {
    assert(!appRoutes.has(contract.targetRoot), `${contract.id} target exists and must be reviewed before activation`);
  }

  assert(contract.contextKeys.includes("branch"), `${contract.id} must define branch context behavior`);
}

assert.deepEqual(
  redesignDomainRouteContracts
    .filter((contract) => contract.targetAvailability === "planned")
    .map((contract) => contract.id),
  ["rooms", "team", "finance", "reports"],
  "Only the currently unbuilt IA roots may remain planned",
);

assert.equal(
  new Set(legacyAliasContracts.map((contract) => contract.sourceRoute.toLowerCase())).size,
  legacyAliasContracts.length,
  "Legacy alias sources must be unique case-insensitively",
);

for (const alias of legacyAliasContracts) {
  assert(appRoutes.has(alias.sourceRoute), `Legacy source ${alias.sourceRoute} is not a live app route`);
  assert(appRoutes.has(alias.destinationTemplate), `Alias destination ${alias.destinationTemplate} is not live`);
  assert(!alias.destinationTemplate.startsWith("/design-lab"), `${alias.sourceRoute} cannot enter design-lab`);
  const alternateDestinations =
    "alternateDestinationTemplates" in alias ? alias.alternateDestinationTemplates : [];
  for (const alternate of alternateDestinations) {
    assert(appRoutes.has(alternate), `Alternate alias destination ${alternate} is not live`);
    assert(!alternate.startsWith("/design-lab"), `${alias.sourceRoute} cannot enter design-lab`);
  }
  assert.equal(
    observeRedesignRoute(`${alias.sourceRoute}?id=private-record-id&token=private`).domain,
    alias.domain,
    `${alias.sourceRoute} analytics domain drifted`,
  );
  assert.equal(
    new Set(alias.acceptedQueryKeys).size,
    alias.acceptedQueryKeys.length,
    `${alias.sourceRoute} repeats accepted query keys`,
  );
  if (alias.identityRule !== "none") {
    assert(alias.acceptedQueryKeys.length > 0, `${alias.sourceRoute} identity conversion needs an input key`);
  }
}

assert.deepEqual(observeRedesignRoute("/children/private-child-id?token=secret"), {
  domain: "children",
  routeClass: "target",
  analyticsKey: "children",
});
assert.deepEqual(observeRedesignRoute("/classes/private-room-id"), {
  domain: "rooms",
  routeClass: "current",
  analyticsKey: "rooms",
});
assert.deepEqual(observeRedesignRoute("/employees/teachers/private-staff-id"), {
  domain: "team",
  routeClass: "current",
  analyticsKey: "team",
});
assert.deepEqual(observeRedesignRoute("/finance/private-invoice-id"), {
  domain: "finance",
  routeClass: "target",
  analyticsKey: "finance",
});
assert.deepEqual(observeRedesignRoute("/ws/messages.php?childId=private"), {
  domain: null,
  routeClass: "native-delegate",
  analyticsKey: "native-parent",
});
assert.deepEqual(observeRedesignRoute("/legacy-install/ws/login.php"), {
  domain: null,
  routeClass: "native-delegate",
  analyticsKey: "native-parent",
});
assert.deepEqual(observeRedesignRoute("/api/parent/finance/private-child-id"), {
  domain: null,
  routeClass: "native-delegate",
  analyticsKey: "native-parent",
});
assert.deepEqual(observeRedesignRoute("/unknown/private-record-id?token=secret"), {
  domain: null,
  routeClass: "outside-staff-ia",
  analyticsKey: "other",
});

assert(
  [...appRoutes].some((route) => /^\/ws\/[^/]+\.php$/.test(route)),
  "Native root compatibility routes are missing",
);
assert(appRoutes.has("/[legacyPath]/ws/[endpoint]"), "Legacy native bridge route is missing");
assert(
  [...appRoutes].some((route) => route.startsWith("/api/parent/")),
  "Parent API compatibility routes are missing",
);
assert(appRoutes.has("/parent"), "Parent web projection route is missing");
assert.deepEqual(nativeCompatibilityRoutePatterns, [
  "/ws/*.php",
  "/[legacyPath]/ws/[endpoint]",
  "/api/parent/**",
  "/parent/**",
]);

process.stdout.write(
  `Redesign route compatibility verification passed (${appRoutes.size} app routes, ${legacyAliasContracts.length} critical aliases)\n`,
);
