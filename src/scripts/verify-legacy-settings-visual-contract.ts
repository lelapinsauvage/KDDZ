import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(`${legacyRoot}/Front/templates/admin/settings.php`, "utf8"),
  legacyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/settings.js`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/settings.php/page.tsx", "utf8"),
  profilePage: readFileSync("src/app/(app)/profile/page.tsx", "utf8"),
  profileClient: readFileSync("src/app/(app)/profile/profile-client.tsx", "utf8"),
  profileActions: readFileSync("src/lib/actions/profile.ts", "utf8"),
  matrixJson: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

function assertIncludes(source: string, tokens: string[], label: string) {
  for (const token of tokens) {
    assert.ok(source.includes(token), `${label}: ${token}`);
  }
}

assert.match(text.legacyPhp, /<title>Settings<\/title>/);
assert.match(text.legacyPhp, /Welcome , <\?= \$_SESSION\["jigowatt"\]\["username"\] \?>/);
assert.match(text.legacyPhp, /Change your password/);
assert.match(text.legacyPhp, /New Password/);
assert.match(text.legacyPhp, /class="fa fa-eye tooltips sh"/);
assert.match(text.legacyPhp, /class="form-control input-circle tp"/);
assert.match(text.legacyPhp, /class="btn btn-circle blue ch"/);
assert.match(text.legacyPhp, /Check::protectPageOrFunction\('EditSchoolFromTo','ACTION'\)/);
assert.match(text.legacyPhp, /Change Scholastic Year/);
assert.match(text.legacyPhp, /id="start_date"/);
assert.match(text.legacyPhp, /id="end_date"/);
assert.match(text.legacyPhp, /class="btn btn-circle green dsub"/);

assert.match(text.legacyJs, /\$\(document\)\.ready/);
assert.match(text.legacyJs, /\$\(\"\s*\.sh\"\s*\)\.on\(\"click\"/);
assert.match(text.legacyJs, /\$\(\"\s*\.tp\"\s*\)\.attr\(\"type\", \"text\"\)/);
assert.match(text.legacyJs, /\$\(\"\s*\.tp\"\s*\)\.attr\(\"type\", \"password\"\)/);
assert.match(text.legacyJs, /No Change !/);
assert.match(text.legacyJs, /password must be at least 5 characters/);
assert.match(text.legacyJs, /url: '..\/..\/..\/ajax\/v1\/changePass'/);
assert.match(text.legacyJs, /password updated successufly/);
assert.match(text.legacyJs, /Please Fill both start & end dates/);
assert.match(text.legacyJs, /url: '..\/..\/..\/ajax\/v1\/updateschoolyear'/);
assert.match(text.legacyJs, /Dates updated successufly/);

assert.match(text.bridge, /redirect\("\/profile\?legacy=settings\.php"\)/);
assert.match(text.profilePage, /const legacySettings = legacySource === "settings\.php"/);
assert.match(text.profilePage, /getLegacyAccessPermissionDecision\(ctx, "EditSchoolFromTo", "ACTION"\)/);
assert.match(text.profilePage, /canEditSchoolYear/);
assert.match(text.profilePage, /activeSchoolYear/);
assert.match(text.profilePage, /dateOnly\(year\.startDate\)/);
assert.match(text.profilePage, /dateOnly\(year\.endDate\)/);
assert.match(text.profilePage, /legacySettings=\{legacySettings\}/);

assertIncludes(
  text.profileClient,
  [
    'title={legacySettings ? "Settings" : "Profile"}',
    "Change your password",
    "New Password",
    "handlePasswordSave",
    'toast.error("No Change !")',
    'toast.error("Password must be at least 5 characters")',
    'toast.success("Password updated successfully")',
    "renderPasswordToggle",
    "Change Scholastic Year",
    "legacy-start-date",
    "legacy-end-date",
    "handleSchoolYearSave",
    'toast.error("Please Fill both start & end dates")',
    'toast.success("Dates updated successufly")',
    "updateActiveSchoolYearDates",
  ],
  "modern profile settings client",
);
assert.match(text.profileClient, /legacySettings && canEditSchoolYear/);
assert.match(text.profileClient, /type=\{showPassword \? "text" : "password"\}/);
assert.match(text.profileClient, /onKeyDown=\{\(event\) => \{[\s\S]*handlePasswordSave\(\)/);

assert.match(text.profileActions, /export async function updateActiveSchoolYearDates/);
assert.match(text.profileActions, /getLegacyAccessPermissionDecision\(\s*ctx,\s*"EditSchoolFromTo",\s*"ACTION"/);
assert.match(text.profileActions, /Please Fill both start & end dates/);
assert.match(text.profileActions, /End Date must be after Start Date/);
assert.match(text.profileActions, /Active scholastic year not found/);
assert.match(text.profileActions, /revalidatePath\("\/settings\.php"\)/);

const matrix = JSON.parse(text.matrixJson) as Array<{
  legacyPhp: string;
  modernRoute: string;
  status: string;
  verification: string;
}>;
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/settings.php",
);
assert.ok(row, "settings.php matrix row should exist");
assert.equal(row.modernRoute, "/settings.php, /profile?legacy=settings.php");
assert.equal(
  row.status,
  "restored - legacy account password, scholastic-year workflow, EditSchoolFromTo ACL, bridge, and browser visual audit restored",
);

for (const expected of [
  "/settings.php",
  "/profile?legacy=settings.php",
  "Settings",
  "Change your password",
  "New Password",
  "show/hide toggle",
  "No Change !",
  "Password must be at least 5 characters",
  "Change Scholastic Year",
  "Start Date",
  "End Date",
  "Update",
  "Please Fill both start & end dates",
  "Dates updated successufly",
  "EditSchoolFromTo",
  "Browser smoke confirmed",
  "src/scripts/verify-legacy-settings-visual-contract.ts",
]) {
  assert.ok(row.verification.includes(expected), `matrix verification: ${expected}`);
}

const markdownRow =
  text.matrixMd
    .split("\n")
    .find((line) => line.includes("| Front/templates/admin/settings.php |")) ?? "";

assert.match(markdownRow, /browser visual audit restored/);
assert.doesNotMatch(markdownRow, /Remaining work is broader PAGE\/ACTION/);

console.log("Legacy settings visual contract verified.");
