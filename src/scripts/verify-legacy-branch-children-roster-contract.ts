import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/childrenperbranch.php`,
    "utf8",
  ),
  legacyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/childrenperbranch.js`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/childrenperbranch.php/route.ts", "utf8"),
  page: readFileSync("src/app/(app)/branches/[id]/children/page.tsx", "utf8"),
  client: readFileSync(
    "src/components/children/children-page-client.tsx",
    "utf8",
  ),
  columns: readFileSync("src/components/children/children-columns.tsx", "utf8"),
  actions: readFileSync("src/lib/actions/children.ts", "utf8"),
  resolver: readFileSync("src/lib/legacy-branch.ts", "utf8"),
  actionPermissions: readFileSync(
    "src/lib/legacy-child-action-permissions.ts",
    "utf8",
  ),
  guards: readFileSync("src/lib/legacy-page-guards.ts", "utf8"),
  exportButton: readFileSync("src/components/shared/export-button.tsx", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('classes\.php'\)/);
assert.match(text.legacyPhp, /protect\("\*"\)/);
assert.match(text.legacyPhp, /if\(isset\(\$_GET\['brid'\]\)\)/);
assert.match(text.legacyPhp, /encrypt_decrypt\('decrypt', \$encrid\)/);
assert.match(text.legacyPhp, /window\.location = 'children\.php'/);
assert.match(text.legacyPhp, /getClassesPerBranch\(\$brid\)/);
assert.match(text.legacyPhp, /getChildrenPerBranch\(\$brid\)/);
assert.match(text.legacyPhp, /fetchBranchName\(\$brid\)/);
assert.match(text.legacyPhp, /<title>Active Children For <\?php echo \$branchname; \?> Branch <\/title>/);
assert.match(text.legacyPhp, /Active Children For <\?php echo \$branchname; \?> Branch/);
assert.match(text.legacyPhp, /Active Children Listing/);
assert.match(text.legacyPhp, /Check::protectPageOrFunction\('addChild','ACTION'\)/);
assert.match(text.legacyPhp, /onclick="CreateEmployee\(\)"/);
assert.match(text.legacyPhp, /New Child/);
assert.match(text.legacyPhp, /id="childrenperbranch"/);
assert.match(text.legacyPhp, /id="chkSelectAllInPage"/);
assert.match(
  text.legacyPhp,
  /Image[\s\S]*F Name[\s\S]*L Name[\s\S]*DOB[\s\S]*Branch[\s\S]*Class[\s\S]*Status[\s\S]*Gender[\s\S]*Date[\s\S]*Action/,
);
assert.match(text.legacyPhp, /name="ids"/);
assert.match(text.legacyPhp, /name="name"/);
assert.match(text.legacyPhp, /name="lname"/);
assert.match(text.legacyPhp, /name="dob"/);
assert.match(text.legacyPhp, /name="content" id="content"/);
assert.match(text.legacyPhp, /if\(isset\(\$brid\)\)\{ echo "disabled"; \}/);
assert.match(text.legacyPhp, /name="class"/);
assert.match(text.legacyPhp, /name="nat"/);
assert.match(text.legacyPhp, /name="gender"/);
assert.match(text.legacyPhp, /id="mind1"/);
assert.match(text.legacyPhp, /id="maxd1"/);
assert.match(text.legacyPhp, /id="ClearInputs"/);
assert.match(text.legacyPhp, /images\/EmpPhoto\/<\?php echo \$childb\['image'\]; \?>/);
assert.match(text.legacyPhp, /data-lightbox="image-1"/);
assert.match(text.legacyPhp, /class="changeclass form-control"/);
assert.match(text.legacyPhp, /child_dashboard\.php\?id=<\?php echo \$db->encrypt_decrypt\('encrypt',\$childb\['cid'\]\); \?>/);
assert.match(text.legacyPhp, /view\.php\?p=child&amp;id=<\?php echo \$db->encrypt_decrypt\('encrypt',\$childb\['cid'\]\); \?>/);
assert.match(text.legacyPhp, /Child_Details\.php\?id=<\?php echo \$db->encrypt_decrypt\('encrypt',\$childb\['cid'\]\); \?>/);
assert.match(text.legacyPhp, /delemp\(<\?php echo \$childb\['cid'\]; \?>\)/);

assert.match(
  text.legacyJs,
  /function CreateEmployee\(\) \{[\s\S]*window\.open\("Child_Details\.php", '_blank'\)/,
);
assert.match(text.legacyJs, /format:\s*"yyyy-mm-dd"/);
assert.match(text.legacyJs, /\$\('#childrenperbranch'\)\.DataTable\(\{/);
assert.match(text.legacyJs, /"bSortCellsTop":\s*true/);
assert.match(text.legacyJs, /\.form-filter[\s\S]*table\.columns\(colindx\)\.search/);
assert.match(text.legacyJs, /\$\.fn\.dataTable\.ext\.search\.push/);
assert.match(text.legacyJs, /var date = data\[10\]/);
assert.match(text.legacyJs, /#chkSelectAllInPage/);
assert.match(text.legacyJs, /toggleChildstate/);
assert.match(text.legacyJs, /toggleChildclass/);
assert.match(text.legacyJs, /deleteChild/);
assert.match(text.legacyJs, /#ClearInputs/);
assert.match(text.legacyJs, /fnFilter\(''\)/);
assert.doesNotMatch(text.legacyJs, /ab\.Session/);
assert.doesNotMatch(text.legacyJs, /conn\.subscribe/);

assert.match(text.bridge, /export const runtime = "nodejs"/);
assert.match(text.bridge, /new URL\("\/children", request\.url\)/);
assert.match(text.bridge, /resolveLegacyBranchId\(brid\)/);
assert.match(text.bridge, /new URL\(`\/branches\/\$\{encodeURIComponent\(branchId\)\}\/children`, request\.url\)/);
assert.match(text.bridge, /NextResponse\.redirect\(target\)/);
assert.match(text.bridge, /export async function POST\(request: NextRequest\)/);

assert.match(text.resolver, /UUID_PATTERN\.test\(normalizedIdentifier\)/);
assert.match(text.resolver, /legacyNumericCandidates\(identifier\)/);
assert.match(text.resolver, /legacyId: \{ in: legacyIds \}/);

assert.match(text.guards, /legacyPage: "classes\.php"[\s\S]*"\/childrenperbranch\.php"/);

assert.match(text.page, /query\.pageSize === "all" \? "all" : Number\(query\.pageSize\) \|\| 10/);
assert.match(text.page, /getBranch\(id\)/);
assert.match(text.page, /getChildren\(\{[\s\S]*branchId: id/);
assert.match(text.page, /status: query\.status/);
assert.match(text.page, /childNumber: query\.childNumber/);
assert.match(text.page, /createdFrom: query\.createdFrom/);
assert.match(text.page, /createdTo: query\.createdTo/);
assert.match(text.page, /contextTitle=\{title\}/);
assert.match(text.page, /title="Active Children Listing"/);
assert.match(text.page, /<h2 className="text-lg font-semibold">Active Children Listing<\/h2>/);
assert.match(text.page, /lockedBranchId=\{id\}/);
assert.match(text.page, /lockedBranchName=\{branch\.name\}/);
assert.match(text.page, /addChildHref=\{`\/children\/new\?branch=\$\{id\}`\}/);
assert.match(text.page, /getLegacyChildActionPermissions\(ctx\)/);

assert.match(text.client, /contextTitle\?: string/);
assert.match(text.client, /const legacyBranchTitle =/);
assert.match(text.client, /title\.startsWith\("Active Children For "\)/);
assert.match(text.client, /const displayContextTitle = contextTitle \?\? legacyBranchTitle/);
assert.match(text.client, /const displayTitle = legacyBranchTitle \? "Active Children Listing" : title/);
assert.match(text.client, /\{displayContextTitle \? \(/);
assert.match(text.client, /addChildLabel = "New Child"/);
assert.match(text.client, /pageSize: number \| "all"/);
assert.match(text.client, /pageCount: filters\.pageSize === "all" \? 1 : Math\.ceil\(total \/ filters\.pageSize\)/);
assert.match(text.client, /\[10, 20, 50, 100, 150, "all"\]\.map/);
assert.match(text.client, /size === "all" \? "All" : size/);
assert.match(text.client, /lockedBranchId \? lockedBranchId : filters\.branch/);
assert.match(text.client, /disabled=\{!!lockedBranchId\}/);
assert.match(text.client, /const bulkBranchOptions = lockedBranchId[\s\S]*branches\.filter/);
assert.match(text.client, /disabled=\{!!lockedBranchId \|\| isPending\}/);
assert.match(text.client, /Change Branch & Class/);
assert.match(text.client, /Select all children in page/);
assert.match(text.client, /bulkUpdateChildrenBranchClass/);
assert.match(text.client, /toggleChildActive/);
assert.match(text.client, /updateChildClass/);
assert.match(text.client, /deleteChild/);
assert.match(text.client, /filename="children"/);
assert.match(text.client, /sheetName="Children"/);
assert.match(text.client, /placeholder="S\.N\."/);
assert.match(text.client, /placeholder="F Name"/);
assert.match(text.client, /placeholder="L Name"/);
assert.match(text.client, /aria-label="Date of birth"/);
assert.match(text.client, /placeholder="Nationality"/);
assert.match(text.client, /aria-label="Created from"/);
assert.match(text.client, /aria-label="Created to"/);

assert.match(text.columns, /header: "Image"/);
assert.match(text.columns, /SortableHeader column=\{column\}>S\.N\./);
assert.match(text.columns, /SortableHeader column=\{column\}>F Name/);
assert.match(text.columns, /SortableHeader column=\{column\}>L Name/);
assert.match(text.columns, /SortableHeader column=\{column\}>DOB/);
assert.match(text.columns, /SortableHeader column=\{column\}>Branch/);
assert.match(text.columns, /SortableHeader column=\{column\}>Class/);
assert.match(text.columns, /SortableHeader column=\{column\}>Status/);
assert.match(text.columns, /SortableHeader column=\{column\}>Gender/);
assert.match(text.columns, /SortableHeader column=\{column\}>Date/);
assert.match(text.columns, /header: "Action"/);
assert.match(text.columns, /\/images\/EmpPhoto\/\$\{photo\}/);
assert.match(text.columns, /LayoutDashboard/);
assert.match(text.columns, /Printer/);
assert.match(text.columns, /Pencil/);
assert.match(text.columns, /Trash2/);

assert.match(text.actions, /pageSize\?: number \| "all"/);
assert.match(text.actions, /const paginated = pageSize !== "all"/);
assert.match(text.actions, /bulkUpdateChildrenBranchClass/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "addChild"\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "updateChild"\)/);
assert.match(text.actions, /requireLegacyActionAllowed\(ctx, "deleteChild"\)/);
assert.match(text.actionPermissions, /"addChild"/);
assert.match(text.actionPermissions, /"updateChild"/);
assert.match(text.actionPermissions, /"deleteChild"/);

assert.match(text.exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(text.exportButton, /Copy table/);
assert.match(text.exportButton, /Export as Excel \(\.xlsx\)/);
assert.match(text.exportButton, /Export as CSV \(\.csv\)/);
assert.match(text.exportButton, /Export as PDF \(\.pdf\)/);

const matrix = JSON.parse(text.matrix) as Array<{
  legacyPhp: string;
  status: string;
  verification: string;
}>;
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/childrenperbranch.php",
);
assert.ok(row, "page parity row for childrenperbranch.php");
assert.equal(
  row.status,
  "restored - branch-scoped children listing, locked branch/class controls, filters, exports, ACL, and legacy branch bridge restored",
);
assert.doesNotMatch(row.verification, /Remaining work/);
assert.match(row.verification, /no `ab\.Session` or `conn\.subscribe`/);
assert.match(row.verification, /Browser smoke confirmed/);
assert.match(row.verification, /accepts the restored All rows mode/);
assert.match(row.verification, /verify-legacy-branch-children-roster-contract\.ts/);
assert.match(
  text.matrixMd,
  /childrenperbranch\.php \| Front\/templates\/admin\/js\/childrenperbranch\.js \| \/childrenperbranch\.php, \/branches\/\[id\]\/children \| restored - branch-scoped children listing, locked branch\/class controls, filters, exports, ACL, and legacy branch bridge restored/,
);
assert.doesNotMatch(text.matrixMd, /childrenperbranch\.php[^\n]*live refresh audit remains/);

console.log("legacy branch-scoped children roster contract verified.");
