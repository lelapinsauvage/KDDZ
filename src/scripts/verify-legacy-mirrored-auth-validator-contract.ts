import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyGenericUser:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/classes/generic_user_db.class.php",
  remoteValidation: "src/lib/legacy-auth-remote-validation.ts",
  addUserRoute: "src/app/(app)/users/admin/classes/add_user.class.php/route.ts",
  addLevelRoute: "src/app/(app)/users/admin/classes/add_level.class.php/route.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

const legacyValidatorNeedles = [
  /class Generic_User extends Connect_user/,
  /connect_user_db\.class\.php/,
  /public function checkExists\(\)/,
  /!\s*empty\(\$_POST\['email'\]\) && !empty\(\$_POST\['checkemail'\]\)/,
  /SELECT `email` FROM `login_users` WHERE `email` = :email/,
  /!\s*empty\(\$_POST\['username'\]\) && !empty\(\$_POST\['checkusername'\]\)/,
  /SELECT `username` FROM `login_users` WHERE `username` = :username/,
  /!\s*empty\(\$_POST\['level'\]\) && !empty\(\$_POST\['checklevel'\]\)/,
  /SELECT `level_name` FROM `login_levels` WHERE `level_name` = :level/,
  /echo \( \$stmt->rowCount\(\) > 0 \) \? "false" : "true"/,
];

for (const needle of legacyValidatorNeedles) {
  assert.match(text.legacyGenericUser, needle);
}

const modernValidatorNeedles = [
  /type LegacyRemoteUserRecordType = "login_user" \| "manager_login_user"/,
  /type LegacyRemoteLevelRecordType = "login_level" \| "manager_login_level"/,
  /normalized === "login_users_man"/,
  /return "manager_login_user"/,
  /normalized === "login_levels_man"/,
  /return "manager_login_level"/,
  /const recordType = normalizeUserRecordType\(input\.recordType\)/,
  /const recordType = normalizeLevelRecordType\(input\.levelRecordType\)/,
  /legacyBooleanResponse\(value: boolean/,
  /new Response\(value \? "true" : "false"/,
  /legacyUserSuggestionsResponse/,
  /users\.php\?uid=/,
  /legacyLevelSuggestionsResponse/,
  /levels\.php\?lid=/,
];

for (const needle of modernValidatorNeedles) {
  assert.match(text.remoteValidation, needle);
}

assert.match(text.addUserRoute, /recordType",\s*"record_type",\s*"table"/);
assert.match(text.addUserRoute, /isLegacyUsernameAvailable/);
assert.match(text.addUserRoute, /isLegacyEmailAvailable/);
assert.match(text.addLevelRoute, /levelRecordType",\s*"level_record_type",\s*"recordType",\s*"record_type",\s*"table"/);
assert.match(text.addLevelRoute, /isLegacyLevelNameAvailable/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/classes/generic_user_db.class.php",
);
assert.ok(row);
assert.match(
  row.status ?? "",
  /restored - mirrored user-db duplicate validators restored/,
);
assert.match(row.verification ?? "", /login_users_man/);
assert.match(row.verification ?? "", /login_levels_man/);
assert.match(row.verification ?? "", /verify-legacy-mirrored-auth-validator-contract\.ts/);
assert.doesNotMatch(row.verification ?? "", /Remaining work is any live mirrored-database export/);

const markdownRows = text.markdownMatrix
  .split("\n")
  .filter((line) =>
    line.includes("| Front/templates/admin/users/classes/generic_user_db.class.php |"),
  );
assert.equal(markdownRows.length, 1);
assert.match(
  markdownRows[0],
  /restored - mirrored user-db duplicate validators restored/,
);
assert.doesNotMatch(markdownRows[0], /Remaining work is any live mirrored-database export/);

console.log("legacy mirrored auth validator contract assertions passed");
