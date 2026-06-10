import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyLevelCreate:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/level-create.php",
  legacyAddLevel:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/classes/add_level.class.php",
  accessControlClient:
    "src/app/(app)/settings/access-control/access-control-client.tsx",
  accessControlActions: "src/lib/actions/legacy-access-control.ts",
  addLevelRoute:
    "src/app/(app)/users/admin/classes/add_level.class.php/route.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyLevelCreate, /id="level-add-form"/);
assert.match(text.legacyLevelCreate, /id="level-message"/);
assert.match(text.legacyLevelCreate, /\$\("#level-message"\)\.slideUp\(350/);
assert.match(text.legacyLevelCreate, /\$\('#level-message'\)\.html\(data\)/);
assert.match(text.legacyLevelCreate, /\$\('#level-message'\)\.slideDown\('slow'\)/);
assert.match(text.legacyLevelCreate, /data\.match\('success'\)/);
assert.match(text.legacyLevelCreate, /\$\('#level-add-form input'\)\.val\(''\)/);
assert.match(text.legacyLevelCreate, /remote: \{[\s\S]*classes\/add_level\.class\.php/);

assert.match(text.legacyAddLevel, /You must enter a level name\./);
assert.match(text.legacyAddLevel, /Level name[\s\S]*already exists/);
assert.match(text.legacyAddLevel, /Successfully added level <b>%s<\/b> to the database\./);
assert.match(text.legacyAddLevel, /searchLevels/);
assert.match(text.legacyAddLevel, /checkExists\(\)/);

assert.match(text.addLevelRoute, /isLegacyLevelNameAvailable/);
assert.match(text.addLevelRoute, /legacyBooleanResponse/);
assert.match(text.addLevelRoute, /legacyLevelSuggestionsResponse/);
assert.match(text.addLevelRoute, /searchLevels/);
assert.match(text.addLevelRoute, /checklevel/);

assert.match(text.accessControlActions, /createLegacyAccessLevel/);
assert.match(text.accessControlActions, /const legacyId = \(maxLevel\?\.legacyId \?\? 0\) \+ 1/);
assert.match(text.accessControlActions, /const legacyKey = `\$\{sourceDatabase\}:\$\{config\.levelTable\}:\$\{legacyId\}`/);
assert.match(text.accessControlActions, /db\.legacyAuthRecord\.create/);
assert.match(text.accessControlActions, /legacyTable: config\.levelTable/);
assert.match(text.accessControlActions, /recordType: config\.levelRecordType/);
assert.match(text.accessControlActions, /recordKey: levelName/);
assert.match(text.accessControlActions, /redirect,/);
assert.match(text.accessControlActions, /isDisabled: false/);
assert.match(text.accessControlActions, /welcomeEmail: false/);
assert.match(text.accessControlActions, /levelLegacyData\(\{/);
assert.doesNotMatch(text.accessControlActions, /INSERT INTO `login_levels`/);
assert.doesNotMatch(text.accessControlActions, /INSERT INTO `login_levels_man`/);

assert.match(text.accessControlClient, /id="level-message"/);
assert.match(text.accessControlClient, /aria-live="polite"/);
assert.match(text.accessControlClient, /max-height 300ms ease-out/);
assert.match(text.accessControlClient, /opacity 300ms ease-out/);
assert.match(text.accessControlClient, /margin-bottom 300ms ease-out/);
assert.match(text.accessControlClient, /marginBottom: levelDialogMessage \? 4 : 0/);
assert.match(text.accessControlClient, /maxHeight: levelDialogMessage \? 96 : 0/);
assert.match(text.accessControlClient, /opacity: levelDialogMessage \? 1 : 0/);
assert.match(text.accessControlClient, /Successfully added level \$\{trimmedName\} to the database\./);
assert.match(text.accessControlClient, /setLevelName\(""\)/);
assert.match(text.accessControlClient, /setLevelRedirect\(""\)/);
assert.match(
  text.accessControlClient,
  /if \(levelDialogMode === "create"\) \{[\s\S]*showLevelDialogMessage\(/,
);
assert.doesNotMatch(
  text.accessControlClient,
  /if \(levelDialogMode === "create"\) \{[\s\S]{0,120}setLevelDialogOpen\(false\)/,
);

type MatrixRow = {
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (item) =>
    item.legacyPhp === "Front/templates/admin/users/admin/page/level-create.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy create-level form, validator, and in-dialog AJAX message lifecycle restored",
);
assert.match(row.verification ?? "", /legacy `#level-message`/);
assert.match(row.verification ?? "", /Browser smoke used temporary migrated access-control metadata/);
assert.match(row.verification ?? "", /clear the fields only after success/);
assert.match(row.verification ?? "", /verify-legacy-level-create-message-contract\.ts/);
assert.doesNotMatch(row.verification ?? "", /Remaining work is exact old slide-down AJAX message behavior/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/page/level-create.php |"),
  );
assert.match(
  markdownRow ?? "",
  /restored - legacy create-level form, validator, and in-dialog AJAX message lifecycle restored/,
);
assert.match(markdownRow ?? "", /legacy `#level-message`/);
assert.doesNotMatch(
  markdownRow ?? "",
  /Remaining work is exact old slide-down AJAX message behavior/,
);

const addLevelRow = matrix.find(
  (item) =>
    item.legacyPhp === "Front/templates/admin/users/admin/classes/add_level.class.php",
);
assert.ok(addLevelRow);
assert.match(
  addLevelRow.status ?? "",
  /restored - legacy level create, validator, search, and provenance restored/,
);
assert.match(addLevelRow.verification ?? "", /canonical `sourceDatabase`/);
assert.match(addLevelRow.verification ?? "", /`legacyKey`/);
assert.match(addLevelRow.verification ?? "", /LegacyAuthRecord/);
assert.match(addLevelRow.verification ?? "", /modern runtime source of truth/);
assert.match(addLevelRow.verification ?? "", /verify-legacy-level-create-message-contract\.ts/);
assert.doesNotMatch(addLevelRow.verification ?? "", /Remaining work is deciding/);

console.log("legacy level-create message contract assertions passed");
