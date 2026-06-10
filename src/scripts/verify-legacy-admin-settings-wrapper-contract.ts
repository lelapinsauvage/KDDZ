import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { legacyAdminSettingsRedirect } from "@/lib/legacy-admin-settings-redirect";

const files = {
  legacySettings:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/settings.php",
  legacyPageSettings:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/settings.php",
  redirect: "src/lib/legacy-admin-settings-redirect.ts",
  rootBridge: "src/app/(app)/users/admin/settings.php/page.tsx",
  pageBridge: "src/app/(app)/users/admin/page/settings.php/page.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

const legacyShellTabs = [
  "general-options",
  "denied",
  "emails-welcome",
  "emails-activate",
  "emails-forgot",
  "emails-add-user",
  "emails-acct-update",
  "user-profiles",
  "integration",
  "emails-birthday",
  "emails-missingReports",
  "emails-medication",
  "emails-insurance",
  "emails-assessment",
  "emails-vaccinations",
  "emails-Expiring",
  "emails-Accounting",
  "emails-control",
  "update",
];

assert.match(text.legacySettings, /protect\("Admin"\)/);
assert.match(text.legacySettings, /<div id="message"><\/div>/);
assert.match(text.legacySettings, /tabbable tabs-left/);
assert.match(text.legacySettings, /id="settings-form"/);
assert.match(text.legacySettings, /id="save-settings"/);
for (const tab of legacyShellTabs) {
  assert.match(text.legacySettings, new RegExp(`#${tab}`));
}
assert.match(text.legacySettings, /include_once\('page\/general-options\.php'\)/);
assert.match(text.legacyPageSettings, /protect\("Admin"\)/);
assert.match(text.legacyPageSettings, /settings\.class\.php/);

assert.match(text.rootBridge, /legacyAdminSettingsRedirect/);
assert.match(text.pageBridge, /legacyAdminSettingsRedirect/);
assert.match(text.rootBridge, /redirect\(legacyAdminSettingsRedirect\(await searchParams\)\)/);
assert.match(text.pageBridge, /redirect\(legacyAdminSettingsRedirect\(await searchParams\)\)/);

const cases: Array<[string, Record<string, string>, string]> = [
  ["default root", {}, "/settings/legacy-auth"],
  ["general", { tab: "general-options" }, "/settings/legacy-auth?tab=general"],
  ["denied", { hash: "#denied" }, "/settings/legacy-auth?tab=denied"],
  ["integration", { p: "page/integration.php" }, "/settings/legacy-auth?tab=integration"],
  ["update", { target: "update.php" }, "/settings/legacy-auth?tab=update"],
  ["welcome template", { section: "emails-welcome" }, "/settings/notifications?tab=templates&template=WELCOME"],
  ["activate template", { tab: "emails-activate" }, "/settings/notifications?tab=templates&template=ACTIVATION_RESEND"],
  ["forgot template", { tab: "emails-forgot" }, "/settings/notifications?tab=templates&template=FORGOT_REQUEST"],
  ["add user template", { tab: "emails-add-user" }, "/settings/notifications?tab=templates&template=ADD_USER"],
  ["account update template", { tab: "emails-acct-update" }, "/settings/notifications?tab=templates&template=ACCOUNT_UPDATE_VERIFY"],
  ["birthday template", { tab: "emails-birthday" }, "/settings/notifications?tab=templates&template=BIRTHDAY"],
  ["missing reports template", { tab: "emails-missingReports" }, "/settings/notifications?tab=templates&template=MISSING_REPORTS"],
  ["medicine template", { tab: "emails-medication" }, "/settings/notifications?tab=templates&template=MEDICINE"],
  ["insurance template", { tab: "emails-insurance" }, "/settings/notifications?tab=templates&template=INSURANCE"],
  ["assessment template", { tab: "emails-assessment" }, "/settings/notifications?tab=templates&template=ASSESSMENT"],
  ["vaccinations template", { tab: "emails-vaccinations" }, "/settings/notifications?tab=templates&template=VACCINATIONS"],
  ["expiring template", { tab: "emails-Expiring" }, "/settings/notifications?tab=templates&template=CONTRACT"],
  ["accounting template", { tab: "emails-Accounting" }, "/settings/notifications?tab=templates&template=PAYMENT"],
  ["notification control", { tab: "emails-control" }, "/settings/notifications?tab=legacy"],
  ["bulk send", { tab: "send-email" }, "/settings/notifications?tab=bulk"],
  ["profiles", { tab: "user-profiles" }, "/settings/legacy-users/profile-fields"],
  ["reports", { tab: "reports" }, "/settings/legacy-users/reports"],
  ["user control", { tab: "user-control" }, "/settings/legacy-users"],
  ["add user", { tab: "user-add" }, "/settings/legacy-users?new=1"],
];

for (const [label, params, expected] of cases) {
  assert.equal(legacyAdminSettingsRedirect(params), expected, label);
}

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const rows = [
  matrix.find(
    (row) => row.legacyPhp === "Front/templates/admin/users/admin/settings.php",
  ),
  matrix.find(
    (row) => row.legacyPhp === "Front/templates/admin/users/admin/page/settings.php",
  ),
];
for (const row of rows) {
  assert.ok(row);
  assert.match(
    row.status ?? "",
    /restored - legacy admin settings wrapper tab composition and bridge aliases restored/,
  );
  assert.match(row.verification ?? "", /legacy tabs-left shell/);
  assert.match(row.verification ?? "", /all legacy tab aliases/);
  assert.match(row.verification ?? "", /verify-legacy-admin-settings-wrapper-contract\.ts/);
  assert.doesNotMatch(row.verification ?? "", /Remaining work is exact old admin settings shell composition/);
}

const markdownRows = text.markdownMatrix
  .split("\n")
  .filter(
    (line) =>
      line.includes("| Front/templates/admin/users/admin/settings.php |") ||
      line.includes("| Front/templates/admin/users/admin/page/settings.php |"),
  );
assert.equal(markdownRows.length, 2);
for (const row of markdownRows) {
  assert.match(
    row,
    /restored - legacy admin settings wrapper tab composition and bridge aliases restored/,
  );
  assert.doesNotMatch(row, /Remaining work is exact old admin settings shell composition/);
}

console.log("legacy admin settings wrapper contract assertions passed");
