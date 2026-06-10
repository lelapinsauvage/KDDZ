import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyClass:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/classes/add_user.class.php",
  route: "src/app/(app)/users/admin/classes/add_user.class.php/route.ts",
  remoteValidation: "src/lib/legacy-auth-remote-validation.ts",
  actions: "src/lib/actions/legacy-users.ts",
  page: "src/app/(app)/settings/legacy-users/page.tsx",
  client: "src/app/(app)/settings/legacy-users/legacy-users-client.tsx",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(contents.legacyClass, /class Add_user extends Generic/);
assert.match(contents.legacyClass, /private function adduser\(\)/);
assert.match(contents.legacyClass, /searchUsers/);
assert.match(contents.legacyClass, /parent::checkExists\(\)/);
assert.match(contents.legacyClass, /SELECT \* FROM `login_users` WHERE `email` = :email/);
assert.match(contents.legacyClass, /SELECT \* FROM `login_users` WHERE `username` = :username/);
assert.match(contents.legacyClass, /parent::getOption\('default-level'\)/);
assert.match(contents.legacyClass, /parent::hashPassword\(\$this->password\)/);
assert.match(contents.legacyClass, /\$this->GenericUser->query/);
assert.match(contents.legacyClass, /email-add-user-subj/);
assert.match(contents.legacyClass, /email-add-user-msg/);
assert.match(contents.legacyClass, /Credentials sent to user/);

assert.match(contents.route, /requireLegacyAdminPanelAccess\(\)/);
assert.match(contents.route, /fieldValue\(fields, "searchUsers"\)/);
assert.match(contents.route, /getLegacyUserSuggestions/);
assert.match(contents.route, /hasLegacyFlag\(fields, "checkusername"\)/);
assert.match(contents.route, /isLegacyUsernameAvailable/);
assert.match(contents.route, /hasLegacyFlag\(fields, "checkemail"\)/);
assert.match(contents.route, /isLegacyEmailAvailable/);
assert.match(contents.route, /legacyBooleanResponse\(false, 400\)/);
assert.match(contents.route, /export async function GET/);
assert.match(contents.route, /export async function POST/);

assert.match(contents.remoteValidation, /readLegacyValidationFields/);
assert.match(contents.remoteValidation, /contentType\.includes\("application\/x-www-form-urlencoded"\)/);
assert.match(contents.remoteValidation, /contentType\.includes\("multipart\/form-data"\)/);
assert.match(contents.remoteValidation, /legacyBooleanResponse/);
assert.match(contents.remoteValidation, /content-type": "text\/plain; charset=utf-8"/);
assert.match(contents.remoteValidation, /suggestionsHtml/);
assert.match(contents.remoteValidation, /href: \(suggestion\) => `users\.php\?uid=\$\{suggestion\.id\}`/);
assert.match(contents.remoteValidation, /slice\(0, 5\)/);

assert.match(contents.page, /getLegacyAdminUsers\(\)/);
assert.match(contents.page, /new\?: string \| string\[\]/);
assert.match(contents.page, /initialCreateOpen=\{firstParam\(params\.new\) === "1"\}/);
assert.match(contents.page, /initialEditLegacyId=/);
assert.match(contents.page, /LegacyUsersClient/);

assert.match(contents.client, /Add Legacy User/);
assert.match(contents.client, /Edit Legacy User/);
assert.match(contents.client, /legacy-user-username/);
assert.match(contents.client, /legacy-user-email/);
assert.match(contents.client, /legacy-user-password/);
assert.match(contents.client, /legacy-user-password2/);
assert.match(contents.client, /Branch Access/);
assert.match(contents.client, /Class Access/);
assert.match(contents.client, /checked=\{form\.isRestricted\}/);
assert.match(contents.client, /updateForm\("isRestricted", checked === true\)/);
assert.match(contents.client, /<span className="font-medium">Restricted<\/span>/);
assert.match(contents.client, /createLegacyAdminUser/);
assert.match(contents.client, /updateLegacyAdminUser/);
assert.match(contents.client, /deleteLegacyAdminUser/);
assert.match(contents.client, /PAGE_SIZE_OPTIONS = \[10, 20, 50, 100, 150\]/);
assert.match(contents.client, /<ExportButton[\s\S]*filename="legacy-users"[\s\S]*columns=\{legacyUserExportColumns\}/);
assert.match(contents.client, /window\.print\(\)/);

assert.match(contents.actions, /export async function createLegacyAdminUser/);
assert.match(contents.actions, /requireLegacyAdminPanelAccess\(\)/);
assert.match(contents.actions, /validateLegacyUserInput\(input\)/);
assert.match(contents.actions, /default-level/);
assert.match(contents.actions, /OR: \[\{ username \}, \{ email \}\]/);
assert.match(contents.actions, /record\.username === username/);
assert.match(contents.actions, /That email address has already been taken\./);
assert.match(contents.actions, /serializePhpStringArray\(validated\.levelIds\)/);
assert.match(contents.actions, /await hash\(input\.password \?\? "", 12\)/);
assert.match(contents.actions, /legacyEmailTemplate\([\s\S]*"email-add-user-subj"[\s\S]*"email-add-user-msg"/);
assert.match(contents.actions, /deliverEmail\(\{[\s\S]*category: "ADD_USER"/);
assert.match(contents.actions, /source: "legacy_admin_add_user"/);
assert.match(contents.actions, /addUserEmail/);
assert.match(contents.actions, /revalidatePath\("\/settings\/legacy-users"\)/);

assert.match(
  contents.matrix,
  /add_user\.class\.php[\s\S]*partial - legacy admin user create\/search and remote validators restored; delivery\/profile audit remains/,
);
assert.match(
  contents.matrix,
  /add_user\.class\.php[\s\S]*literal `true`\/`false` responses plus `searchUsers` suggestions HTML/,
);
assert.match(
  contents.matrixMd,
  /add_user\.class\.php \|  \| \/settings\/legacy-users, \/users\/admin\/classes\/add_user\.class\.php \| partial - legacy admin user create\/search and remote validators restored; delivery\/profile audit remains/,
);
assert.match(
  contents.matrixMd,
  /add_user\.class\.php[\s\S]*provider-neutral email delivery/,
);
assert.match(
  contents.matrixMd,
  /add_user\.class\.php[\s\S]*literal `true`\/`false` responses plus `searchUsers` suggestions HTML/,
);

console.log("legacy admin add-user contract assertions passed");
