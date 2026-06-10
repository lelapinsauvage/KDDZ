import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/parent_user.php`,
    "utf8",
  ),
  legacyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/parent_user.js`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/parent_user.php/page.tsx", "utf8"),
  resolver: readFileSync("src/lib/legacy-parent-user.ts", "utf8"),
  detailPage: readFileSync(
    "src/app/(app)/settings/parent-users/[id]/page.tsx",
    "utf8",
  ),
  detailClient: readFileSync(
    "src/app/(app)/settings/parent-users/[id]/parent-user-detail-client.tsx",
    "utf8",
  ),
  actions: readFileSync("src/lib/actions/parent-users.ts", "utf8"),
  matrixJson: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

function assertIncludes(source: string, tokens: string[], label: string) {
  for (const token of tokens) {
    assert.ok(source.includes(token), `${label}: ${token}`);
  }
}

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('parent_users\.php'\)/);
assert.match(text.legacyPhp, /<title>Parents Users<\/title>/);
assert.match(text.legacyPhp, /id="emp_id"/);
assert.match(text.legacyPhp, /id="form_id"/);
assert.match(text.legacyPhp, /id="send"/);
assert.match(text.legacyPhp, /<h2 id="title_emp_status">/);
assert.match(text.legacyPhp, /Info\./);
assert.match(text.legacyPhp, /id="username"/);
assert.match(text.legacyPhp, /id="password"/);
assert.match(text.legacyPhp, /id="status"/);
assert.match(text.legacyPhp, /<option value = 0 >Active<\/option>/);
assert.match(text.legacyPhp, /<option value = 1 >InActive<\/option>/);
assert.match(text.legacyPhp, /btnUpdate/);

assert.match(text.legacyJs, /function Create\(\)/);
assert.match(text.legacyJs, /function Update\(ac_no\)/);
assert.match(text.legacyJs, /isusernameExistParent/);
assert.match(text.legacyJs, /AddParentUser/);
assert.match(text.legacyJs, /UpdateParentUser/);
assert.match(text.legacyJs, /getparentuserdata/);
assert.match(
  text.legacyJs,
  /Username Already used by another Parent, please try another one!/,
);
assert.match(text.legacyJs, /\$\("\.btnUpdate"\)\.text\(" Save "\)/);
assert.match(text.legacyJs, /toast\('success', "User Has been Updated"\)/);

assert.match(text.bridge, /redirect\("\/settings\/parent-users"\)/);
assert.match(text.bridge, /resolveLegacyParentUserId\(fid, id\)/);
assert.match(
  text.bridge,
  /redirect\(`\/settings\/parent-users\/\$\{encodeURIComponent\(parentUserId\)\}`\)/,
);
assert.match(
  text.bridge,
  /redirect\(`\/settings\/parent-users\?createChildId=\$\{encodeURIComponent\(childId\)\}`\)/,
);
assert.match(text.resolver, /legacyId: \{ in: legacyIds \}/);
assert.match(text.resolver, /legacyKey: normalizedIdentifier/);
assert.match(text.resolver, /legacyChildId: \{ in: legacyChildIds \}/);
assert.match(text.resolver, /child: \{ legacyId: \{ in: legacyChildIds \} \}/);

assert.match(text.detailPage, /getParentUser\(id\)/);
assert.match(text.detailPage, /db\.child\.findMany/);
assert.match(text.detailPage, /where: \{ isActive: true, branch: \{ organizationId: orgId \} \}/);
assert.match(text.detailPage, /ParentUserDetailClient/);
assert.match(text.detailPage, /childName: user\.child/);
assert.match(text.detailPage, /const parentContacts = \(user\.child\?\.parents \?\? \[\]\)\.map/);
assert.match(text.detailPage, /const relativeContacts = \(user\.child\?\.relatives \?\? \[\]\)\.map/);
assert.match(text.detailPage, /parents: parentContacts/);
assert.match(text.detailPage, /relatives: relativeContacts/);

assertIncludes(
  text.detailClient,
  [
    "Parent User Detail",
    "Linked Child",
    "Contact Information",
    "Relatives & Emergency Contacts",
    "Account Information",
    "Username",
    "Linked Child",
    "Password",
    "Leave blank to keep current password",
    "Status",
    "Active",
    "InActive",
    "Reset Password",
    "Send SMS",
    "Send WhatsApp",
    "Save Changes",
    "Account Info",
    "Parent user has been updated.",
    "Dear Parent, you can now login to your KiddzOnline account username:",
    "https://kiddzonline.com/Garderie_parent",
    "WhatsApp Parent",
  ],
  "modern parent-user detail client",
);

assert.match(text.actions, /LEGACY_DUPLICATE_PARENT_USERNAME_MESSAGE/);
assert.match(
  text.actions,
  /Username Already used by another Parent, please try another one!/,
);
assert.match(text.actions, /export async function updateParentUser/);
assert.match(text.actions, /export async function resetParentPassword/);
assert.match(text.actions, /export async function sendParentUserCredentials/);
assert.match(text.actions, /parentCredentialMessage/);
assert.match(text.actions, /PARENT_CREDENTIALS/);
assert.match(text.actions, /credentialDelivery/);
assert.match(text.actions, /channelDeliveryAuditData/);

const matrix = JSON.parse(text.matrixJson) as Array<{
  legacyPhp: string;
  status: string;
  verification: string;
}>;
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/parent_user.php",
);
assert.ok(row, "parent_user.php matrix row should exist");
assert.equal(
  row.status,
  "partial - legacy parent-user detail workflow, credential channel delivery, and browser visual audit restored",
);
assert.match(row.verification, /Browser smoke confirmed `\/parent_user\.php\?fid=`/);
assert.match(row.verification, /Parent User Detail/);
assert.match(row.verification, /Linked Child/);
assert.match(row.verification, /Contact Information/);
assert.match(row.verification, /Account Information/);
assert.match(row.verification, /Username\/Password\/Status/);
assert.match(row.verification, /Reset Password/);
assert.match(row.verification, /Send SMS/);
assert.match(row.verification, /Send WhatsApp/);
assert.match(row.verification, /Save Changes/);
assert.match(row.verification, /no broken images or app errors/);
assert.match(
  row.verification,
  /src\/scripts\/verify-legacy-parent-user-detail-visual-contract\.ts/,
);

const markdownRow =
  text.matrixMd
    .split("\n")
    .find((line) => line.includes("| Front/templates/admin/parent_user.php |")) ??
  "";
assert.match(
  markdownRow,
  /partial - legacy parent-user detail workflow, credential channel delivery, and browser visual audit restored/,
);
assert.doesNotMatch(markdownRow, /visual audit remains/);
assert.match(markdownRow, /Browser smoke confirmed `\/parent_user\.php\?fid=`/);

console.log("Legacy parent-user detail visual contract verified.");
