import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/message_portal_class.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/message_portal_class.js",
  bridge: "src/app/(app)/message_portal_class.php/page.tsx",
  page: "src/app/(app)/messages/compose/class/page.tsx",
  client: "src/app/(app)/messages/compose/class/class-message-client.tsx",
  actions: "src/lib/actions/messages.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('message_portal_class\.php'\)/);
assert.match(text.legacyPhp, /<input type="hidden" id="emp_id"/);
assert.match(text.legacyPhp, /<div class="caption">\s*Recipient\s*<\/div>/);
assert.match(text.legacyPhp, /Message Admin Only/);
assert.match(text.legacyPhp, /id\s*=\s*"btnsend"/);
assert.match(text.legacyJs, /getSelClasseswBranch/);
assert.match(text.legacyJs, /getclasssformessage/);
assert.match(text.legacyJs, /Select All Children/);
assert.match(text.legacyJs, /Select All Active Children/);
assert.match(text.legacyJs, /Unselect All/);
assert.match(text.legacyJs, /chkSelectAllInPage/);
assert.match(text.legacyJs, /output \+=' #'/);
assert.match(text.legacyJs, /output \+=' Name'/);
assert.match(text.legacyJs, /output \+=' Status'/);
assert.match(text.legacyJs, /sendmessageTeacher/);
assert.match(text.legacyJs, /Should at least select one Child Or Admin only/);
assert.match(text.legacyJs, /No parent users for selected children/);

assert.match(text.bridge, /resolveLegacyClassId\(id\)/);
assert.match(text.bridge, /redirect\(`\/messages\/compose\/class\?classId=\$\{encodeURIComponent\(classId\)\}`\)/);
assert.match(text.page, /getChildren\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getLegacyNotificationNatures\(\)/);
assert.match(text.client, /data-legacy-class-recipient-table/);
assert.match(text.client, /aria-label="Select all children in page"/);
assert.match(text.client, /toggleAllVisibleChildren/);
assert.match(text.client, /Select All Children/);
assert.match(text.client, /Select All Active/);
assert.match(text.client, /Unselect All/);
assert.match(text.client, /<th className="w-14 px-3 py-2 text-left font-medium">\s*#/);
assert.match(text.client, /<th className="px-3 py-2 text-left font-medium">\s*Name/);
assert.match(text.client, /<th className="w-28 px-3 py-2 text-left font-medium">\s*Status/);
assert.match(text.client, /showAdminOnly/);
assert.match(text.client, /Send to Class/);
assert.match(text.actions, /sendClassMessage/);
assert.match(text.actions, /adminRecipientCount/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/message_portal_class.php",
);
assert.ok(row);
assert.match(row.status ?? "", /visual audit restored/);
assert.match(row.verification ?? "", /DataTables-style child selector/);
assert.match(row.verification ?? "", /verify-legacy-class-message-visual-contract\.ts/);
assert.doesNotMatch(row.verification ?? "", /visual audit against the old Metronic table/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/message_portal_class.php |"),
  );
assert.match(markdownRow ?? "", /visual audit restored/);
assert.match(markdownRow ?? "", /DataTables-style child selector/);
assert.match(text.topGaps, /Class message visual contract now covers/);

console.log("legacy class message visual contract assertions passed");
