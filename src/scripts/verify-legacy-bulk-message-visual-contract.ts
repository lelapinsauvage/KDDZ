import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/message_portal.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/message_portal.js",
  bridge: "src/app/(app)/message_portal.php/page.tsx",
  page: "src/app/(app)/messages/compose/page.tsx",
  client: "src/app/(app)/messages/compose/compose-client.tsx",
  sideEffects: "src/lib/legacy-message-side-effects.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /<title>Message Portal<\/title>/);
assert.match(text.legacyPhp, /Check::protectPageOrFunction\('message_portal\.php'\)/);
assert.match(text.legacyPhp, /<div class="caption">\s*Classes\s*<\/div>/);
assert.match(text.legacyPhp, /Sending Via: Web/);
assert.match(text.legacyPhp, /Mobile Notifications/);
assert.match(text.legacyPhp, /Characters Count/);
assert.match(text.legacyJs, /getClasseswBranch/);
assert.match(text.legacyJs, /getAllTeachersForClasses/);
assert.match(text.legacyJs, /getclasssformessage/);
assert.match(text.legacyJs, /teachersArray/);
assert.match(text.legacyJs, /Select All Children/);
assert.match(text.legacyJs, /Select All Active Children/);
assert.match(text.legacyJs, /Unselect All/);
assert.match(text.legacyJs, /chkSelectAllInPage/);
assert.match(text.legacyJs, /output \+=' #'/);
assert.match(text.legacyJs, /output \+=' Name'/);
assert.match(text.legacyJs, /output \+=' Status'/);
assert.match(text.legacyJs, /sendmessage/);
assert.match(text.legacyJs, /sendSMSTeachers/);
assert.match(text.legacyJs, /sendWhatsappTeachers/);
assert.match(text.legacyJs, /Should at least select one Recipient/);

assert.match(text.bridge, /target\.set\("legacyRecipient", id\.trim\(\)\)/);
assert.match(text.bridge, /redirect\(`\/messages\/compose\$\{target\.size \? `\?\$\{target\.toString\(\)\}` : ""\}`\)/);
assert.match(text.page, /getChildren\(\{ status: "ACTIVE", pageSize: "all" \}\)/);
assert.match(text.page, /getLegacyNotificationNatures\(\)/);
assert.match(text.client, /data-legacy-bulk-recipient-table/);
assert.match(text.client, /classGroupKey/);
assert.match(text.client, /groupedChildren/);
assert.match(text.client, /Class: \{group\.className\} \| Branch: \{group\.branchName\}/);
assert.match(text.client, /aria-label=\{`Select all children in \$\{group\.className\}`\}/);
assert.match(text.client, /Select All Children/);
assert.match(text.client, /Select All Active/);
assert.match(text.client, /Unselect All/);
assert.match(text.client, /<th className="w-14 px-3 py-2 text-left font-medium">\s*#/);
assert.match(text.client, /<th className="px-3 py-2 text-left font-medium">\s*Name/);
assert.match(text.client, /<th className="w-28 px-3 py-2 text-left font-medium">\s*Status/);
assert.match(text.client, /Teachers/);
assert.match(text.client, /Sending Via/);
assert.match(text.sideEffects, /const LEGACY_MESSAGE_SIDE_EFFECTS/);
assert.match(text.sideEffects, /legacyMethod: "addToGeneral"/);
assert.match(text.sideEffects, /addToPayments/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/message_portal.php",
);
assert.ok(row);
assert.match(row.status ?? "", /DataTables visual parity restored/);
assert.match(row.verification ?? "", /legacy per-class DataTables-style selector/);
assert.match(row.verification ?? "", /verify-legacy-bulk-message-visual-contract\.ts/);
assert.doesNotMatch(row.verification ?? "", /final DataTables visual parity/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/message_portal.php |"));
assert.match(markdownRow ?? "", /DataTables visual parity restored/);
assert.match(markdownRow ?? "", /legacy per-class DataTables-style selector/);
assert.match(text.topGaps, /Bulk message visual contract now covers/);

console.log("legacy bulk message visual contract assertions passed");
