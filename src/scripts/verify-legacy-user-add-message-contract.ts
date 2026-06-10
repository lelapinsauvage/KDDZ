import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyUserAdd:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/user-add.php",
  legacyAddUser:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/classes/add_user.class.php",
  legacyUsersClient:
    "src/app/(app)/settings/legacy-users/legacy-users-client.tsx",
  addUserRoute:
    "src/app/(app)/users/admin/classes/add_user.class.php/route.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyUserAdd, /id="user-add-form"/);
assert.match(text.legacyUserAdd, /<div id="message"><\/div>/);
assert.match(text.legacyUserAdd, /\$\("#message"\)\.slideUp\(350/);
assert.match(text.legacyUserAdd, /\$\('#message'\)\.html\(data\)/);
assert.match(text.legacyUserAdd, /\$\('#message'\)\.slideDown\('slow'\)/);
assert.match(text.legacyUserAdd, /data\.match\('success'\)/);
assert.match(text.legacyUserAdd, /\$\('#user-add-form input'\)\.val\(''\)/);
assert.match(text.legacyUserAdd, /checkusername/);
assert.match(text.legacyUserAdd, /checkemail/);

assert.match(text.legacyAddUser, /You must enter a name\./);
assert.match(text.legacyAddUser, /You must enter a username\./);
assert.match(text.legacyAddUser, /You have entered an invalid e-mail address, try again\./);
assert.match(text.legacyAddUser, /You must enter a password\./);
assert.match(text.legacyAddUser, /Your password must be at least 5 characters\./);
assert.match(text.legacyAddUser, /That email address has already been taken\./);
assert.match(text.legacyAddUser, /Sorry, username already taken\./);
assert.match(text.legacyAddUser, /Successfully added user <b>%s<\/b> to the database\. Credentials sent to user\./);

assert.match(text.addUserRoute, /isLegacyUsernameAvailable/);
assert.match(text.addUserRoute, /isLegacyEmailAvailable/);
assert.match(text.addUserRoute, /legacyBooleanResponse/);
assert.match(text.addUserRoute, /checkusername/);
assert.match(text.addUserRoute, /checkemail/);

assert.match(text.legacyUsersClient, /const \[dialogMessage, setDialogMessage\]/);
assert.match(text.legacyUsersClient, /id="message"/);
assert.match(text.legacyUsersClient, /aria-live="polite"/);
assert.match(text.legacyUsersClient, /marginBottom: dialogMessage \? 4 : 0/);
assert.match(text.legacyUsersClient, /maxHeight: dialogMessage \? 96 : 0/);
assert.match(text.legacyUsersClient, /opacity: dialogMessage \? 1 : 0/);
assert.match(text.legacyUsersClient, /if \(!form\.name\.trim\(\)\) return "You must enter a name\."/);
assert.match(text.legacyUsersClient, /showDialogMessage\(\{ type: "error", text: clientError \}\)/);
assert.match(text.legacyUsersClient, /setForm\(createEmptyForm\(group\)\)/);
assert.match(text.legacyUsersClient, /Successfully added user \$\{savedUser\.username\} to the database\. Credentials sent to user\./);
assert.match(
  text.legacyUsersClient,
  /if \(dialogMode === "create"\) \{[\s\S]*showDialogMessage\(/,
);
assert.doesNotMatch(
  text.legacyUsersClient,
  /if \(dialogMode === "create"\) \{[\s\S]{0,260}setDialogOpen\(false\)/,
);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (item) => item.legacyPhp === "Front/templates/admin/users/admin/page/user-add.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy add-user form, validators, and in-dialog AJAX message lifecycle restored",
);
assert.match(row.verification ?? "", /legacy `#message` lifecycle/);
assert.match(row.verification ?? "", /clear the fields only after success/);
assert.match(row.verification ?? "", /Browser smoke used temporary migrated login-level metadata/);
assert.match(row.verification ?? "", /mismatched-password validation alert renders in `#message`/);
assert.match(row.verification ?? "", /verify-legacy-user-add-message-contract\.ts/);
assert.doesNotMatch(row.verification ?? "", /Remaining work is exact slide-down old page animation/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/page/user-add.php |"),
  );
assert.match(
  markdownRow ?? "",
  /restored - legacy add-user form, validators, and in-dialog AJAX message lifecycle restored/,
);
assert.match(markdownRow ?? "", /legacy `#message` lifecycle/);
assert.doesNotMatch(
  markdownRow ?? "",
  /Remaining work is exact slide-down old page animation/,
);

console.log("legacy user-add message contract assertions passed");
