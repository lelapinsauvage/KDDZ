import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(isAbsolute(path) ? path : join(root, path), "utf8");
}

const text = {
  legacyPhp: read("/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/child_accounting.php"),
  legacyJs: read("/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/child_accounting.js"),
  client: read("src/app/(app)/children/[id]/accounting/accounting-client.tsx"),
  page: read("src/app/(app)/children/[id]/accounting/page.tsx"),
  legacyBridge: read("src/app/(app)/child_accounting.php/page.tsx"),
  parityMatrix: read("docs/page-parity-matrix.md"),
};

for (const expected of [
  /Registration Fees/,
  /Monthly Fees/,
  /Bus Fees/,
  /Other Fees/,
]) {
  assert.match(text.legacyPhp, expected);
  assert.match(text.client, expected);
}

assert.match(text.legacyPhp, /Xtra-time Fees|Xtra-Time Fees/);
assert.match(text.client, /Xtra-Time Fees/);

for (const expected of [
  /Date/,
  /Child #/,
  /First Name/,
  /Last Name/,
  /Amount\(\$\)|Amount \(\$\)/,
  /Payment/,
  /From/,
  /To/,
  /Remarks/,
  /Attachment/,
]) {
  assert.match(text.legacyPhp, expected);
  assert.match(text.client, expected);
}

for (const expected of [
  /Add New Payment/,
  /Export Statement/,
  /handleExport/,
  /PaymentDialog/,
  /AttachmentPreviewDialog/,
  /paymentReceiptHref/,
  /\/images\/AccDocs\//,
  /\/accounting\/invoice\//,
  /View Attachment/,
]) {
  assert.match(text.client, expected);
}

for (const expected of [
  /#newpayment/,
  /Payment Amount/,
  /date_from/,
  /date_to/,
  /month_from/,
  /getchild_paymentsExcel/,
]) {
  assert.match(text.legacyPhp + text.legacyJs, expected);
}

assert.match(text.page, /legacyPaymentMethodLabel/);
assert.match(text.page, /by Bank Transfere/);
assert.match(text.legacyBridge, /resolveLegacyChildId/);
assert.match(text.legacyBridge, /redirect\("\/children"\)/);
assert.match(text.legacyBridge, /\/children\/\$\{encodeURIComponent\(childId\)\}\/accounting/);

const row = text.parityMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/child_accounting.php |"));

assert.ok(row, "child_accounting.php parity row should exist");
assert.doesNotMatch(
  row,
  /Remaining work is final logged-in visual smoke/,
  "child_accounting.php parity row should no longer be blocked on local visual smoke",
);
assert.match(row, /Browser smoke confirmed/);
assert.match(row, /verify-legacy-child-accounting-visual-smoke-contract\.ts/);

console.log("legacy child accounting visual smoke contract assertions passed");
