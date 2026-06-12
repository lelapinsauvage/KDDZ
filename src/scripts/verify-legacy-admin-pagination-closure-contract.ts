import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyFunctions:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/classes/functions.php",
  accessClient: "src/app/(app)/settings/access-control/access-control-client.tsx",
  legacyUsersClient: "src/app/(app)/settings/legacy-users/legacy-users-client.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyFunctions, /\$_POST\['showUsers'\]/);
assert.match(text.legacyFunctions, /\$_SESSION\['jigowatt'\]\['users_page_limit'\]/);
assert.match(text.legacyFunctions, /\$_POST\['showLevels'\]/);
assert.match(text.legacyFunctions, /\$_SESSION\['jigowatt'\]\['levels_page_limit'\]/);
assert.match(text.legacyFunctions, /\$_GET\['page'\]/);
assert.match(text.legacyFunctions, /function pagination\(\$table, \$args = '',\$total_pages = ''\)/);
assert.match(text.legacyFunctions, /Previous/);
assert.match(text.legacyFunctions, /Next/);
assert.match(text.legacyFunctions, /\$stages = 3/);
assert.match(text.legacyFunctions, /<ul class="pagination">/);
assert.match(text.legacyFunctions, /Registered Date/);
assert.match(text.legacyFunctions, /Last Login/);

assert.match(text.legacyUsersClient, /PAGE_SIZE_OPTIONS = \[10, 20, 50, 100, 150\]/);
assert.match(text.legacyUsersClient, /PAGE_SIZE_ALL = "all"/);
assert.match(text.legacyUsersClient, /id="legacy-users-page-size"/);
assert.match(text.legacyUsersClient, /SelectItem value=\{PAGE_SIZE_ALL\}>All/);
assert.match(text.legacyUsersClient, /function paginationItems\(currentPage: number, totalPages: number\)/);
assert.match(text.legacyUsersClient, /const stages = 3/);
assert.match(text.legacyUsersClient, /Showing \{pageRange\.start\}-\{pageRange\.end\} of \{filteredUsers\.length\}/);
assert.match(text.legacyUsersClient, /Previous/);
assert.match(text.legacyUsersClient, /Next/);
assert.match(text.legacyUsersClient, /variant=\{item === currentPageForView \? "default" : "outline"\}/);
assert.match(text.legacyUsersClient, /key=\{item\}[\s\S]*\.\.\./);
assert.match(text.legacyUsersClient, /filename="legacy-users"/);
assert.match(text.legacyUsersClient, /window\.print\(\)/);

assert.match(text.accessClient, /function paginationItems\(currentPage: number, totalPages: number\)/);
assert.match(text.accessClient, /const stages = 3/);
assert.match(text.accessClient, /Registered Date/);
assert.match(text.accessClient, /Last Login/);
assert.match(text.accessClient, /href=\{`\/settings\/legacy-users\?uid=\$\{user\.legacyId\}`\}/);
assert.match(text.accessClient, /Showing \{levelUsersRange\.start\}-\{levelUsersRange\.end\} of/);
assert.match(text.accessClient, /Previous/);
assert.match(text.accessClient, /Next/);

type MatrixRow = {
  legacyPhp?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/classes/functions.php",
);

assert.ok(row, "functions.php matrix row exists");
assert.match(row.verification ?? "", /legacy pagination window/);
assert.match(row.verification ?? "", /verify-legacy-admin-pagination-closure-contract\.ts/);
assert.doesNotMatch(row.verification ?? "", /Remaining work is exact old pagination visual styling/);

assert.match(text.markdownMatrix, /legacy pagination window/);
assert.match(text.markdownMatrix, /verify-legacy-admin-pagination-closure-contract\.ts/);
assert.doesNotMatch(
  text.markdownMatrix,
  /Remaining work is exact old pagination visual styling if required/,
);

console.log("legacy admin pagination closure contract assertions passed");
