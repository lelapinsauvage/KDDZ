import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  LEGACY_PARENT_WS_ENDPOINTS,
  getLegacyParentWsAllowHeader,
  hasLegacyParentWsEndpoint,
} from "@/lib/legacy-parent-ws-dispatch";
import {
  buildLegacyGarderieBootstrapPayload,
  mapLegacyGarderieBootstrapItem,
} from "@/lib/parent-mobile-bootstrap-contract";

const legacyProjectRoot =
  process.env.LEGACY_GARDERIE_PROJECT_ROOT ??
  "/Users/karimsaab/Desktop/Garderie Project";

const legacyWsRoot = path.join(legacyProjectRoot, "Garderie-old-backup/ws");
const iosWebFunctions = path.join(
  legacyProjectRoot,
  "KiddzOnline/KiddzOnline/Classes/WebFunctions.swift"
);
const androidWebServiceFunctions = path.join(
  legacyProjectRoot,
  "kiddzonline-master/app/src/main/java/com/kiddzonline/android/net/WebServiceFunctions.java"
);
const modernWsRoot = path.join(process.cwd(), "src/app/ws");

assert.ok(fs.existsSync(legacyWsRoot), `Missing legacy ws root: ${legacyWsRoot}`);
assert.ok(
  fs.existsSync(iosWebFunctions),
  `Missing legacy iOS WebFunctions.swift: ${iosWebFunctions}`
);
assert.ok(
  fs.existsSync(androidWebServiceFunctions),
  `Missing legacy Android WebServiceFunctions.java: ${androidWebServiceFunctions}`
);

const legacyPhpEndpoints = fs
  .readdirSync(legacyWsRoot)
  .filter((name) => name.endsWith(".php"))
  .sort();

const modernWsEndpoints = fs
  .readdirSync(modernWsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.endsWith(".php"))
  .map((entry) => entry.name)
  .sort();

for (const endpoint of legacyPhpEndpoints) {
  assert.ok(
    modernWsEndpoints.includes(endpoint),
    `Legacy PHP ws endpoint ${endpoint} must have a restored root /ws endpoint`
  );
}
assert.deepEqual(
  LEGACY_PARENT_WS_ENDPOINTS,
  modernWsEndpoints,
  "Directory-prefixed legacy ws dispatcher must cover every root /ws endpoint"
);

const iosSource = fs.readFileSync(iosWebFunctions, "utf8");
const iosOperations = [
  ...new Set(
    [...iosSource.matchAll(/SendPOSTRequestWithOperation\("([^"]+)"/g)].map(
      (match) => match[1]
    )
  ),
].sort();

assert.deepEqual(
  iosOperations,
  [
    "absence",
    "finance",
    "foodcalendar",
    "holcalendar",
    "login",
    "master",
    "messages",
    "newdaily",
    "notifications",
    "notifications_master",
    "pnotifications",
  ],
  "Unexpected iOS parent mobile operation set"
);

for (const operation of iosOperations) {
  if (operation === "master") {
    assert.ok(
      fs.existsSync(path.join(process.cwd(), "src/app/master.php/route.ts")),
      "iOS master.php bootstrap route must exist"
    );
    continue;
  }

  const endpoint = `${operation}.php`;
  assert.ok(
    hasLegacyParentWsEndpoint(endpoint),
    `iOS operation ${operation} must have a restored ws dispatcher endpoint`
  );
}

const androidSource = fs.readFileSync(androidWebServiceFunctions, "utf8");
const androidEndpoints = [
  ...new Set(
    [...androidSource.matchAll(/@POST\("([^"]+\.php)"\)/g)].map(
      (match) => match[1]
    )
  ),
].sort();

assert.deepEqual(
  androidEndpoints,
  [
    "absence.php",
    "daily.php",
    "finance.php",
    "foodcalendar.php",
    "holcalendar.php",
    "login.php",
  ],
  "Unexpected Android parent mobile endpoint set"
);

for (const endpoint of androidEndpoints) {
  assert.ok(
    hasLegacyParentWsEndpoint(endpoint),
    `Android endpoint ${endpoint} must have a restored ws dispatcher endpoint`
  );
}

const mapped = mapLegacyGarderieBootstrapItem({
  legacyId: 4,
  name: "Demo",
  alias: "kidzonli_demo_gar_",
  userManageDatabase: "kidzonli_demo_users",
  currentDatabase: "kidzonli_demo_gar",
  path: "/demo_et_parent/",
});
assert.deepEqual(mapped, {
  gid: "4",
  garderie_name: "Demo",
  garderie_alias: "kidzonli_demo_gar_",
  user_manage_db: "kidzonli_demo_users",
  current_db: "kidzonli_demo_gar",
  path: "demo_et_parent",
});

assert.deepEqual(buildLegacyGarderieBootstrapPayload([], {
  ...process.env,
  LEGACY_MOBILE_GARDERIE_ID: "1",
  LEGACY_MOBILE_GARDERIE_NAME: "KiddzOnline Nursery",
  LEGACY_MOBILE_GARDERIE_ALIAS: "kidzonli_garderie_",
  LEGACY_MOBILE_USER_DB: "kiddzonl_users",
  LEGACY_MOBILE_CURRENT_DB: "kiddzonl_garderie",
  LEGACY_MOBILE_WS_PATH: "Garderie",
}), [
  {
    gid: "1",
    garderie_name: "KiddzOnline Nursery",
    garderie_alias: "kidzonli_garderie_",
    user_manage_db: "kiddzonl_users",
    current_db: "kiddzonl_garderie",
    path: "Garderie",
  },
]);

assert.equal(getLegacyParentWsAllowHeader("login.php"), "POST");
assert.equal(getLegacyParentWsAllowHeader("daily.php"), "GET, POST");

console.log("parent mobile bootstrap legacy contract assertions passed");
