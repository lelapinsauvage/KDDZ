import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import {
  nativeParentDestinationContracts,
  nativeParentEntryContracts,
  nativeParentSurfaceContracts,
  nativeParentTargetDomains,
  type NativeParentSurfaceId,
} from "../lib/redesign-native-parent-navigation";
import {
  nativeCompatibilityRoutePatterns,
  observeRedesignRoute,
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

function destinationsFor(surface: NativeParentSurfaceId) {
  return nativeParentDestinationContracts.filter((destination) => destination.surface === surface);
}

function orderedVisibleDestinations(surface: NativeParentSurfaceId) {
  return destinationsFor(surface)
    .filter((destination) => destination.navigationPosition !== null)
    .sort((left, right) => left.navigationPosition! - right.navigationPosition!);
}

function read(root: string, relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assertContains(source: string, value: string, message: string) {
  assert(source.includes(value), message);
}

const routeFiles = walk(resolve("src/app")).filter((path) => /\/(page\.tsx|route\.ts)$/.test(path));
const appRoutes = new Set(routeFiles.map(appRouteFromFile));

assert.equal(nativeParentSurfaceContracts.length, 3);
assert.equal(nativeParentEntryContracts.length, 3);
assert.equal(new Set(nativeParentSurfaceContracts.map((surface) => surface.id)).size, 3);
assert.equal(new Set(nativeParentEntryContracts.map((entry) => entry.surface)).size, 3);
assert.equal(
  new Set(nativeParentDestinationContracts.map((destination) => destination.id)).size,
  nativeParentDestinationContracts.length,
  "Native/parent destination IDs must be unique",
);
assert.equal(
  new Set(nativeParentDestinationContracts.map((destination) => destination.evidenceCode)).size,
  nativeParentDestinationContracts.length,
  "Every native/parent destination needs distinct evidence",
);
assert.equal(new Set(nativeParentTargetDomains).size, nativeParentTargetDomains.length);

for (const entry of nativeParentEntryContracts) {
  assert(appRoutes.has(entry.loginRoute), `${entry.surface} login route is not live`);
  assert(appRoutes.has(entry.modernLoginRoute), `${entry.surface} modern login route is not live`);
  if (entry.discoveryRoute) assert(appRoutes.has(entry.discoveryRoute));
  if (entry.acceptsLegacyDirectoryPrefix) {
    assert(appRoutes.has("/[legacyPath]/ws/[endpoint]"));
  }
  assert(entry.sourceRisks.length > 0, `${entry.surface} source risks must stay explicit`);
}

for (const destination of nativeParentDestinationContracts) {
  assert(!destination.legacyRoutes.some((route) => route.startsWith("/design-lab")));
  assert(!destination.modernRoutes.some((route) => route.startsWith("/design-lab")));
  assert(nativeParentTargetDomains.includes(destination.targetDomain));

  for (const route of [...destination.legacyRoutes, ...destination.modernRoutes]) {
    assert(appRoutes.has(route), `${destination.id} route ${route} is not live`);
    assert.equal(
      observeRedesignRoute(route).analyticsKey,
      "native-parent",
      `${route} must stay outside staff analytics identity`,
    );
  }

  if (destination.sourceState === "hidden-stub" || destination.sourceState === "visible-placeholder") {
    assert.equal(destination.targetTreatment, "repair-and-redesign");
  }
  if (destination.sourceState === "background-operational") {
    assert.equal(destination.targetTreatment, "preserve-background-contract");
  }
  if (destination.sourceState === "external-operational") {
    assert.equal(destination.targetTreatment, "preserve-external-handoff");
  }
}

assert.deepEqual(nativeCompatibilityRoutePatterns, [
  "/ws/*.php",
  "/[legacyPath]/ws/[endpoint]",
  "/api/parent/**",
  "/parent/**",
]);

const iosVisible = orderedVisibleDestinations("ios-parent");
assert.deepEqual(iosVisible.map((destination) => destination.label), [
  "Daily Report",
  "Absence Report",
  "Food Calendar",
  "Holiday Calendar",
  "Notifications",
  "Payments",
]);
assert(iosVisible.every((destination) => destination.sourceState === "visible-operational"));
assert.equal(destinationsFor("ios-parent").filter((destination) => destination.sourceState === "hidden-stub").length, 1);

const androidVisible = orderedVisibleDestinations("android-parent");
assert.deepEqual(androidVisible.map((destination) => destination.label), [
  "Daily Report",
  "Absence Report",
  "Food Calendar",
  "Holiday Calendar",
  "Notifications",
  "Messages",
  "Payments",
]);
assert.deepEqual(
  androidVisible
    .filter((destination) => destination.sourceState === "visible-placeholder")
    .map((destination) => destination.journey),
  ["notifications", "messages"],
);

assert.deepEqual(
  orderedVisibleDestinations("parent-web").map((destination) => destination.label),
  ["Today summary", "Daily", "Payments", "Absence", "Messages", "Calendar", "Notifications"],
);

const requireLegacySource = process.argv.includes("--require-legacy-source");
const legacyRoot = process.env.LEGACY_NATIVE_PROJECT_ROOT ?? join(homedir(), "Desktop", "Garderie Project");
const legacySourcePresent = existsSync(join(legacyRoot, "KiddzOnline")) && existsSync(join(legacyRoot, "kiddzonline-master"));
if (requireLegacySource) assert(legacySourcePresent, `Legacy native source missing at ${legacyRoot}`);

if (legacySourcePresent) {
  const iosRoot = join(legacyRoot, "KiddzOnline", "KiddzOnline");
  const storyboard = read(iosRoot, "Base.lproj/Main.storyboard");
  const iosWeb = read(iosRoot, "Classes/WebFunctions.swift");
  const iosHome = read(iosRoot, "ViewControllers/HomeViewController.swift");
  const iosMessages = read(iosRoot, "ViewControllers/MessagesViewController.swift");
  const iosNotifications = read(iosRoot, "ViewControllers/NotificationsViewController.swift");
  const iosLogin = read(iosRoot, "ViewControllers/LoginViewController.swift");

  for (const label of iosVisible.map((destination) => destination.label)) {
    assertContains(storyboard, `title="${label}"`, `iOS home lost ${label}`);
  }
  assert(
    /<button hidden="YES"[^>]*>[\s\S]{0,800}?title="Messages"/.test(storyboard),
    "iOS Messages must remain recorded as a hidden source stub",
  );
  for (const operation of [
    "login",
    "newdaily",
    "master",
    "absence",
    "foodcalendar",
    "holcalendar",
    "notifications",
    "messages",
    "finance",
    "notifications_master",
    "pnotifications",
  ]) {
    assertContains(iosWeb, `SendPOSTRequestWithOperation("${operation}"`, `iOS operation ${operation} drifted`);
  }
  assertContains(iosHome, "launchFullReportsURL", "iOS external full-report handoff disappeared");
  assertContains(iosMessages, "WebFunctions.GetMessages()", "iOS Messages source intent disappeared");
  assertContains(iosMessages, "actionCompletedGetDailyReport", "iOS Messages callback defect must remain explicit until repaired");
  assertContains(iosNotifications, "return 8", "iOS notification section-count defect changed; re-audit required");
  for (const hiddenCategory of ["PaymentsNotifications", "OtherNotifications", "RequestsNotifications"]) {
    assertContains(iosNotifications, hiddenCategory, `iOS hidden notification category ${hiddenCategory} drifted`);
  }
  assertContains(iosLogin, "WebFunctions.GetGarderies()", "iOS nursery discovery disappeared");
  assertContains(iosLogin, '"/ws/"', "iOS runtime tenant path disappeared");

  const androidRoot = join(legacyRoot, "kiddzonline-master", "app", "src", "main");
  const androidHome = read(androidRoot, "res/layout/main_fragment.xml");
  const androidNavigation = read(androidRoot, "res/navigation/nav_graph.xml");
  const androidWeb = read(androidRoot, "java/com/kiddzonline/android/net/WebServiceFunctions.java");
  const androidLogin = read(androidRoot, "java/com/kiddzonline/android/LoginActivity.java");
  const androidMessageModel = read(androidRoot, "java/com/kiddzonline/android/ui/messages/MessagesViewModel.java");
  const androidNotificationModel = read(androidRoot, "java/com/kiddzonline/android/ui/notifications/NotificationsViewModel.java");

  for (const destination of androidVisible) {
    assertContains(androidHome, `android:text="${destination.label}"`, `Android home lost ${destination.label}`);
    const fragmentId = destination.journey === "daily-care"
      ? "dailyReportFragment"
      : destination.journey === "absence"
        ? "absenceReportFragment"
        : destination.journey === "food-calendar"
          ? "foodCalendarFragment"
          : destination.journey === "holiday-calendar"
            ? "holidayCalendarFragment"
            : `${destination.journey}Fragment`;
    assertContains(androidNavigation, `@id/${fragmentId}`, `Android navigation lost ${fragmentId}`);
  }
  const androidPostEndpoints = [...androidWeb.matchAll(/@POST\("([^"]+)"\)/g)]
    .map((match) => match[1])
    .sort();
  assert.deepEqual(androidPostEndpoints, [
    "absence.php",
    "daily.php",
    "finance.php",
    "foodcalendar.php",
    "holcalendar.php",
    "login.php",
  ]);
  assertContains(androidMessageModel, "TODO: Implement the ViewModel", "Android Messages placeholder changed; re-audit required");
  assertContains(androidNotificationModel, "TODO: Implement the ViewModel", "Android Notifications placeholder changed; re-audit required");
  assert.equal((androidLogin.match(/new ObservableField<>\("[^"]+"\)/g) ?? []).length, 2, "Android credential-literal risk changed; re-audit without logging values");
}

const parentPortal = readFileSync(resolve("src/app/(parent)/parent/parent-portal-client.tsx"), "utf8");
for (const tab of ["Daily", "Payments", "Absence", "Messages", "Calendar", "Notifications"]) {
  assertContains(parentPortal, `>${tab}</TabsTrigger>`, `Parent web tab ${tab} drifted`);
}
for (const endpoint of [
  "/api/parent/daily/",
  "/api/parent/finance/",
  "/api/parent/absence/",
  "/api/parent/messages/",
  "/api/parent/notifications/",
  "/api/parent/calendar/food",
  "/api/parent/calendar/holidays",
  "/api/parent/push-token",
]) {
  assertContains(parentPortal, endpoint, `Parent web endpoint ${endpoint} drifted`);
}

process.stdout.write(
  `Redesign native/parent navigation verification passed (${nativeParentDestinationContracts.length} destination contracts; legacy source ${legacySourcePresent ? "verified" : "not present"})\n`,
);
