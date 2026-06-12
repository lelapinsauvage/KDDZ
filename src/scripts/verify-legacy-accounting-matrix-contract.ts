import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const files = {
  legacyPhp: `${legacyRoot}/Front/templates/admin/accounting.php`,
  legacyJs: `${legacyRoot}/Front/templates/admin/js/accounting.js`,
  bridge: "src/app/(app)/accounting.php/page.tsx",
  page: "src/app/(app)/accounting/page.tsx",
  client: "src/app/(app)/accounting/accounting-client.tsx",
  quickDialog: "src/components/accounting/quick-payment-dialog.tsx",
  paymentDialog: "src/app/(app)/accounting/payment-dialog.tsx",
  paymentsActions: "src/lib/actions/payments.ts",
  matrix: "docs/page-parity-matrix.json",
  matrixMd: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('accounting\.php'\)/);
assert.match(text.legacyPhp, /\$fromyear = \$db->returnCurrentYear\(\)/);
assert.match(text.legacyPhp, /\$toyear = \$fromyear \+ 1/);
assert.match(text.legacyPhp, /id="emp_id" value="<\?= \$id \?>"/);
assert.match(text.legacyPhp, /Total Payments Summary/);
assert.match(text.legacyPhp, /Registration Fees/);
assert.match(text.legacyPhp, /Monthly Fees/);
assert.match(text.legacyPhp, /Bus Fees/);
assert.match(text.legacyPhp, /Xtra-time Fees/);
assert.match(text.legacyPhp, /Other Fees/);
assert.match(text.legacyPhp, /Child Info[\s\S]*First Name[\s\S]*Last Name[\s\S]*Branch[\s\S]*Class/);
assert.match(text.legacyPhp, /Oct[\s\S]*Nov[\s\S]*Dec[\s\S]*Jan[\s\S]*Feb[\s\S]*Mar[\s\S]*April[\s\S]*May[\s\S]*Jun[\s\S]*Jul[\s\S]*Aug[\s\S]*Sep[\s\S]*Total/);
assert.match(text.legacyPhp, /New payment For/);
assert.match(text.legacyPhp, /Update payment For/);
assert.match(text.legacyPhp, /Payment Amount/);
assert.match(text.legacyPhp, /Cash[\s\S]*Cheque[\s\S]*Credit Card[\s\S]*Bank Transfer/);
assert.match(text.legacyPhp, /ProfileImage1[\s\S]*accept="image\/jpeg"/);
assert.match(text.legacyPhp, /onclick="javascript:window\.print\(\);"/);

assert.match(text.legacyJs, /var child_id = \$\('#emp_id'\)\.val\(\)/);
assert.match(text.legacyJs, /getchild_paymentsExcel&child_id=' \+ child_id/);
assert.match(text.legacyJs, /url": "\.\.\/\.\.\/\.\.\/ajax\/v1\/getallpayments"/);
assert.match(text.legacyJs, /year: \$\("#sel_year"\)\.val\(\)/);
assert.match(text.legacyJs, /cat: cat0/);
assert.doesNotMatch(
  text.legacyJs,
  /getallpayments[\s\S]{0,220}child_id/,
  "legacy accounting id is retained for statement export, not the main payment matrix AJAX filter",
);
assert.match(text.legacyJs, /function newpay\(cid, month, cat\)/);
assert.match(text.legacyJs, /function showmod\(child_id,month\)/);
assert.match(text.legacyJs, /function updatePay\(tid\)/);
assert.match(text.legacyJs, /function deleteDO\(did\)/);
assert.match(text.legacyJs, /url: '\.\.\/\.\.\/\.\.\/ajax\/v1\/deletePayment'/);
assert.match(text.legacyJs, /\/\/ var conn = new ab\.Session/);
assert.match(text.legacyJs, /\/\/ conn\.subscribe\("newpayment"\+cat_master/);
assert.match(text.legacyJs, /\/\/ console\.warn\('WebSocket connection closed'\)/);

assert.match(text.bridge, /redirect\("\/accounting"\)/);
assert.match(text.page, /await requireRole\("ADMIN", "MANAGER"\)/);
assert.match(text.page, /getPayments\(\{ pageSize: "all" \}\)/);
assert.match(text.page, /getPaymentsSummary\(\)/);
assert.match(text.page, /getChildrenForPayment\(\)/);

assert.match(text.client, /const FEE_TABS = \[/);
for (const label of [
  "Total Payments",
  "Registration",
  "Monthly",
  "Bus",
  "Xtra-time",
  "Other",
]) {
  assert.match(text.client, new RegExp(escapeRegExp(label)));
}
assert.match(text.client, /const SCHOOL_YEAR_MONTHS = \[/);
for (const label of ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]) {
  assert.match(text.client, new RegExp(`label: "${label}"`));
}
assert.match(text.client, /function currentAcademicStartYear\(\)/);
assert.match(text.client, /function academicStartForPayment\(payment: PaymentRow, month: number\)/);
assert.match(text.client, /getMonth\(\) \+ 1 >= 10/);
assert.match(text.client, /Array\(SCHOOL_YEAR_MONTHS\.length\)\.fill\(0\)/);
assert.match(text.client, /for \(const child of filteredChildren\)/);
assert.match(text.client, /for \(const p of tabPayments\)/);
assert.match(text.client, /Child Info/);
assert.match(text.client, /First Name/);
assert.match(text.client, /Last Name/);
assert.match(text.client, /Grand Total/);
assert.match(text.client, /onClick=\{\(\) => window\.print\(\)\}/);
assert.match(text.client, /<h1 className="text-xl font-semibold">Invoice - Receipt<\/h1>/);
assert.match(text.client, /Accounting matrix - \{selectedAcademicYear\}-\{selectedAcademicYear \+ 1\}/);
assert.match(text.client, /Printed on/);
assert.match(text.client, /print:hidden/);
assert.match(text.client, /print:overflow-visible/);
assert.match(text.client, /print:text-\[8px\]/);
assert.match(text.client, /handleCellClick\(row\.childId, monthDef\.month, amount\)/);
assert.match(text.client, /if \(amount > 0\)[\s\S]*setDetailsCell/);
assert.match(text.client, /setQuickDialogOpen\(true\)/);
assert.match(text.client, /<QuickPaymentDialog/);
assert.match(text.client, /preselectedMonth=\{selectedCell\?\.month\}/);
assert.match(text.client, /<DialogTitle>Payments Details<\/DialogTitle>/);
assert.match(text.client, /ReceiptFileUrl|receiptFileUrl/);
assert.match(text.client, /href=\{`\/accounting\/invoice\/\$\{payment\.id\}`\}/);
assert.match(text.client, /handleEdit\(payment\)/);
assert.match(text.client, /handleDelete\(payment\)/);

assert.match(text.quickDialog, /SheetTitle>Record Payment<\/SheetTitle/);
assert.match(text.quickDialog, /Enter payment details below\./);
assert.match(text.quickDialog, /showCloseButton=\{false\}/);
assert.match(text.quickDialog, /aria-label="Close payment dialog"/);
assert.match(text.quickDialog, /onClick=\{\(\) => onOpenChange\(false\)\}/);
assert.match(text.quickDialog, /Label>Child<\/Label/);
assert.match(text.quickDialog, /Label>Amount/);
assert.match(text.quickDialog, /Registration[\s\S]*Monthly[\s\S]*Bus[\s\S]*Xtra-Time[\s\S]*Other/);
assert.match(text.quickDialog, /Cash[\s\S]*Cheque[\s\S]*Credit Card[\s\S]*Bank Transfer/);
assert.match(text.quickDialog, /coverageFromMonth/);
assert.match(text.quickDialog, /coverageToMonth/);
assert.match(text.quickDialog, /scope: "payment-receipt"/);
assert.match(text.quickDialog, /receiptFileUrl: uploaded\.publicUrl/);
assert.match(text.quickDialog, /SheetClose asChild/);

assert.match(text.paymentDialog, /Receipt Attachment/);
assert.match(text.paymentDialog, /scope: "payment-receipt"/);
assert.match(text.paymentDialog, /receiptFileUrl: nextReceiptFileUrl/);

assert.match(text.paymentsActions, /pageSize !== "all"/);
assert.match(text.paymentsActions, /deletedAt: null/);
assert.match(text.paymentsActions, /receiptFileUrl: data\.receiptFileUrl \?\? null/);
assert.match(text.paymentsActions, /export async function deletePayment/);
assert.match(text.paymentsActions, /data: \{ deletedAt: new Date\(\) \}/);
assert.match(text.paymentsActions, /revalidatePath\("\/accounting"\)/);
assert.match(text.paymentsActions, /revalidatePath\(`\/accounting\/invoice\/\$\{id\}`\)/);

type MatrixRow = {
  modernRoute?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find((entry) => entry.modernRoute === "/accounting.php, /accounting");

assert.ok(row);
assert.match(row.status ?? "", /restored - legacy accounting bridge/);
assert.match(row.status ?? "", /page print/);
assert.match(row.verification ?? "", /Oct-Sep school-year\/category matrix/);
assert.match(row.verification ?? "", /Browser smoke/);
assert.match(row.verification ?? "", /enabled page-level Print and Record Payment actions/);
assert.match(row.verification ?? "", /Record Payment sheet/);

assert.match(
  text.matrixMd,
  /accounting\.php \| Front\/templates\/admin\/js\/accounting\.js \| \/accounting\.php, \/accounting \| restored - legacy accounting bridge/,
);
assert.match(text.matrixMd, /accounting\.php[\s\S]*Browser smoke/);
assert.match(text.matrixMd, /accounting\.php[\s\S]*enabled page-level Print and Record Payment actions/);

assert.match(
  text.topGaps,
  /Legacy `accounting\.js` WebSocket refresh blocks are commented out/,
);
assert.match(
  text.topGaps,
  /The page-level matrix print action is restored/,
);
assert.match(
  text.topGaps,
  /Local accounting matrix implementation is closed; remaining acceptance is exact production print\/stationery review/,
);
assert.match(text.topGaps, /under `PROD-PRINT`/);
assert.doesNotMatch(
  text.topGaps,
  /Remaining work is exact visual audit for any legacy WebSocket refresh\/status behavior that was commented out or environment-specific/,
);
assert.doesNotMatch(
  text.topGaps,
  /Remaining work is exact production visual acceptance for print\/stationery/,
);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

console.log("legacy accounting matrix contract assertions passed");
