import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(
    `${legacyRoot}/Front/templates/admin/children.php`,
    "utf8",
  ),
  legacyJs: readFileSync(
    `${legacyRoot}/Front/templates/admin/js/children.js`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/children.php/page.tsx", "utf8"),
  page: readFileSync("src/app/(app)/children/page.tsx", "utf8"),
  client: readFileSync(
    "src/components/children/children-page-client.tsx",
    "utf8",
  ),
  columns: readFileSync("src/components/children/children-columns.tsx", "utf8"),
  actions: readFileSync("src/lib/actions/children.ts", "utf8"),
  actionPermissions: readFileSync(
    "src/lib/legacy-child-action-permissions.ts",
    "utf8",
  ),
  guards: readFileSync("src/lib/legacy-page-guards.ts", "utf8"),
  exportButton: readFileSync("src/components/shared/export-button.tsx", "utf8"),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
};

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('children\.php'\)/);
assert.match(text.legacyPhp, /protect\("\*"\)/);
assert.match(text.legacyPhp, /<title>Children Management<\/title>/);
assert.match(text.legacyPhp, /\$branch = \$db->getBranches\(\)/);
assert.match(text.legacyPhp, /dataTables\.tableTools\.min\.css/);
assert.match(text.legacyPhp, /Children Listing/);
assert.match(text.legacyPhp, /Check::protectPageOrFunction\('addChild','ACTION'\)/);
assert.match(text.legacyPhp, /onclick="CreateEmployee\(\)"/);
assert.match(text.legacyPhp, /New Child/);
assert.match(text.legacyPhp, /id="datatable_ajax"/);
assert.match(text.legacyPhp, /id="chkSelectAllInPage"/);
assert.match(
  text.legacyPhp,
  /Image[\s\S]*F Name[\s\S]*L Name[\s\S]*DOB[\s\S]*Branch[\s\S]*Class[\s\S]*Status[\s\S]*Gender[\s\S]*Date[\s\S]*Action/,
);
assert.match(text.legacyPhp, /name="ids"/);
assert.match(text.legacyPhp, /name="name"/);
assert.match(text.legacyPhp, /name="lname"/);
assert.match(text.legacyPhp, /name="dob"/);
assert.match(text.legacyPhp, /id="content"/);
assert.match(text.legacyPhp, /name="class"/);
assert.match(text.legacyPhp, /name="nat"/);
assert.match(text.legacyPhp, /name="gender"/);
assert.match(text.legacyPhp, /id="mind1"/);
assert.match(text.legacyPhp, /id="maxd1"/);
assert.match(text.legacyPhp, /id="ClearInputs"/);
assert.match(text.legacyPhp, /Update Selected Employees/);

assert.match(
  text.legacyJs,
  /function CreateEmployee\(\) \{[\s\S]*window\.open\("Child_Details\.php", '_blank'\)/,
);
assert.match(text.legacyJs, /conn\.subscribe\("new_child"\+cat_master/);
assert.match(text.legacyJs, /\/\/ var conn = new ab\.Session/);
assert.match(text.legacyJs, /"lengthMenu":\s*\[\s*\[\s*10,\s*20,\s*50,\s*100,\s*150,\s*-1\]/);
assert.match(text.legacyJs, /\[10,\s*20,\s*50,\s*100,\s*150,\s*"All"\]/);
assert.match(text.legacyJs, /"pageLength":\s*10/);
assert.match(text.legacyJs, /"oTableTools"/);
assert.match(text.legacyJs, /"copy"/);
assert.match(text.legacyJs, /"print"/);
assert.match(text.legacyJs, /'sExtends':\s*'pdf'/);
assert.match(text.legacyJs, /'sExtends':\s*'xls'/);
assert.match(text.legacyJs, /"processing":\s*true/);
assert.match(text.legacyJs, /"serverSide":\s*true/);
assert.match(text.legacyJs, /getChildrenHashed/);
assert.match(text.legacyJs, /toggleChildclass/);
assert.match(text.legacyJs, /toggleChildstate/);
assert.match(text.legacyJs, /deleteChild/);
assert.match(text.legacyJs, /Selected_Employees/);
assert.match(text.legacyJs, /\$\('#chkSelectAllInPage'\)\.click/);
assert.match(text.legacyJs, /name=ids[\s\S]*\.column\(1\)/);
assert.match(text.legacyJs, /name=name[\s\S]*\.column\(3\)/);
assert.match(text.legacyJs, /name=lname[\s\S]*\.column\(4\)/);
assert.match(text.legacyJs, /name=dob[\s\S]*\.column\(5\)/);
assert.match(text.legacyJs, /#content[\s\S]*table\.column\(6\)/);
assert.match(text.legacyJs, /name=class[\s\S]*\.column\(7\)/);
assert.match(text.legacyJs, /name=nat[\s\S]*\.column\(8\)/);
assert.match(text.legacyJs, /name=gender[\s\S]*\.column\(9\)/);
assert.match(text.legacyJs, /d\.columns\[10\]\.Min_Range/);
assert.match(text.legacyJs, /d\.columns\[10\]\.Max_Range/);

assert.match(text.bridge, /redirect\("\/children"\)/);
assert.match(text.guards, /legacyPage: "children\.php"/);
assert.match(text.guards, /"\/children\.php"/);

assert.match(text.page, /params\.pageSize === "all" \? "all" : Number\(params\.pageSize\) \|\| 10/);
assert.match(text.page, /getChildren\(\{/);
assert.match(text.page, /status: params\.status/);
assert.match(text.page, /childNumber: params\.childNumber/);
assert.match(text.page, /createdFrom: params\.createdFrom/);
assert.match(text.page, /createdTo: params\.createdTo/);
assert.match(text.page, /getLegacyChildActionPermissions\(ctx\)/);

assert.match(text.client, /title = "Children Listing"/);
assert.match(text.client, /addChildLabel = "New Child"/);
assert.match(text.client, /pageSize: number \| "all"/);
assert.match(text.client, /pageCount: filters\.pageSize === "all" \? 1 : Math\.ceil\(total \/ filters\.pageSize\)/);
assert.match(text.client, /const showingFrom = filters\.pageSize === "all"/);
assert.match(text.client, /const showingTo = filters\.pageSize === "all"/);
assert.match(text.client, /\[10, 20, 50, 100, 150, "all"\]\.map/);
assert.match(text.client, /size === "all" \? "All" : size/);
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
  (entry) => entry.legacyPhp === "Front/templates/admin/children.php",
);
assert.ok(row, "page parity row for children.php");
assert.equal(
  row.status,
  "restored - legacy child roster, bulk branch/class modal, filters, exports, actions, ACL, and bridge restored",
);
assert.doesNotMatch(row.verification, /Remaining work/);
assert.match(row.verification, /commented-out `ab\.Session` block/);
assert.match(row.verification, /Browser smoke confirmed/);
assert.match(row.verification, /verify-legacy-children-roster-contract\.ts/);
assert.match(
  text.matrixMd,
  /children\.php \| Front\/templates\/admin\/js\/children\.js \| \/children\.php, \/children \| restored - legacy child roster, bulk branch\/class modal, filters, exports, actions, ACL, and bridge restored/,
);
assert.doesNotMatch(text.matrixMd, /children\.php[^\n]*live refresh audit remains/);

console.log("legacy children roster contract verified.");
