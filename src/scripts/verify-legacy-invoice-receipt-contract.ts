import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const legacyRoot =
  "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup";

const text = {
  legacyPhp: readFileSync(`${legacyRoot}/Front/templates/admin/invo.php`, "utf8"),
  legacyPayment: readFileSync(
    `${legacyRoot}/Front/templates/admin/classes/Data.class.php`,
    "utf8",
  ),
  bridge: readFileSync("src/app/(app)/invo.php/page.tsx", "utf8"),
  resolver: readFileSync("src/lib/legacy-payment.ts", "utf8"),
  guards: readFileSync("src/lib/legacy-page-guards.ts", "utf8"),
  page: readFileSync("src/app/(app)/accounting/invoice/[id]/page.tsx", "utf8"),
  client: readFileSync(
    "src/app/(app)/accounting/invoice/[id]/invoice-client.tsx",
    "utf8",
  ),
  matrix: readFileSync("docs/page-parity-matrix.json", "utf8"),
  matrixMd: readFileSync("docs/page-parity-matrix.md", "utf8"),
  topGaps: readFileSync("docs/top-20-restoration-gaps.md", "utf8"),
};

assert.match(text.legacyPhp, /Check::protectPageOrFunction\('children\.php'\)/);
assert.match(text.legacyPhp, /protect\("\*"\)/);
assert.match(text.legacyPhp, /\$_REQUEST\["po"\]/);
assert.match(text.legacyPhp, /encrypt_decrypt\('decrypt', \$_REQUEST\["po"\]\)/);
assert.match(text.legacyPhp, /\$db->getPaymentById\(\$po\)/);
assert.match(text.legacyPhp, /assets\/admin\/pages\/css\/invoice\.css/);
assert.match(text.legacyPhp, /Receipt Voucher/);
assert.match(text.legacyPhp, /Receipt No\./);
assert.match(text.legacyPhp, /Child No\./);
assert.match(text.legacyPhp, /Invoice Date/);
assert.match(text.legacyPhp, /Child Name/);
assert.match(text.legacyPhp, /We have received/);
assert.match(text.legacyPhp, /Mr\/Mrs\./);
assert.match(text.legacyPhp, /convert_number_to_words/);
assert.match(text.legacyPhp, /Valid From/);
assert.match(text.legacyPhp, /Signature/);
assert.match(text.legacyPhp, /window\.print\(\)/);
assert.match(text.legacyPayment, /function getPaymentById\(\$id\)/);
assert.match(text.legacyPayment, /pay_num/);
assert.match(text.legacyPayment, /amount_init/);
assert.match(text.legacyPayment, /currency_nm/);

assert.match(text.bridge, /searchParams: Promise<\{ po\?: string \}>/);
assert.match(text.bridge, /redirect\("\/accounting"\)/);
assert.match(text.bridge, /resolveLegacyPaymentId\(po\)/);
assert.match(text.bridge, /notFound\(\)/);
assert.match(text.bridge, /redirect\(`\/accounting\/invoice\/\$\{encodeURIComponent\(paymentId\)\}`\)/);

assert.match(text.resolver, /legacyNumericCandidates\(identifier\)/);
assert.match(text.resolver, /UUID_PATTERN\.test\(normalizedIdentifier\)/);
assert.match(text.resolver, /legacyId: \{ in: legacyIds \}/);
assert.match(text.resolver, /legacyKey: normalizedIdentifier/);
assert.match(text.resolver, /deletedAt: null/);
assert.match(text.resolver, /child: \{ branch: \{ organizationId \} \}/);

assert.match(text.guards, /legacyPage: "children\.php"[\s\S]*exact: \["\/invo\.php"\]/);
assert.match(text.guards, /patterns: \[\/\^\\\/accounting\\\/invoice\\\/\[\^\/\]\+\$\/\]/);

assert.match(text.page, /legacyValue\(payment\.legacyData, "pay_num"\)/);
assert.match(text.page, /payment\.reference/);
assert.match(text.page, /childNumber: payment\.child\.childNumber/);
assert.match(text.page, /childLastName: payment\.child\.lastName/);
assert.match(text.page, /branchName: payment\.child\.branch\.name/);

for (const expected of [
  /Receipt Voucher/,
  /Receipt No\. \{receiptNo\}/,
  /Child No\. : \{invoice\.childNumber/,
  /Invoice Date : \{formatLegacyDate\(invoice\.date\)\}/,
  /<b>Child Name<\/b> : \{invoice\.childName\}/,
  /We have received \{methodLabel\} from Mr\/Mrs\. \{invoice\.childLastName\}/,
  /The amount of \{formatCurrency\(invoice\.amount, invoice\.currency\)\}/,
  /\{numberToWords\(invoice\.amount\)\} \{currencyName\(invoice\.currency\)\}/,
  /<b>\{categoryLabel\}<\/b>/,
  /<b>Month<\/b>: \{monthName\(invoice\.month\)\}/,
  /<b>Valid From<\/b>: \{formatLegacyDate\(invoice\.dateFrom\)\} <b>To<\/b>/,
  /<b>Signature<\/b> :/,
  /window\.print\(\)/,
  /print:hidden/,
  /print:bg-white/,
]) {
  assert.match(text.client, expected);
}

const matrix = JSON.parse(text.matrix) as Array<{
  legacyPhp?: string;
  modernRoute?: string;
  status?: string;
  verification?: string;
}>;
const row = matrix.find(
  (entry) => entry.legacyPhp === "Front/templates/admin/invo.php",
);
assert.ok(row, "page parity row for invo.php");
assert.equal(row.modernRoute, "/invo.php, /accounting/invoice/[id]");
assert.equal(
  row.status,
  "restored - legacy invoice bridge, Receipt Voucher fields, migrated receipt number, amount in words, child context, validity dates, signature, and print action restored",
);
assert.match(row.verification ?? "", /\/invo\.php\?po=/);
assert.match(row.verification ?? "", /raw numeric, UUID, legacy key, and encrypted legacy payment ids/);
assert.match(row.verification ?? "", /verify-legacy-invoice-receipt-contract\.ts/);
assert.match(row.verification ?? "", /Production logo\/stationery and browser print acceptance remains tracked under `PROD-PRINT`/);
assert.doesNotMatch(row.verification ?? "", /^Final logo\/stationery and browser print stylesheet acceptance remains\.$/);

assert.match(
  text.matrixMd,
  /Front\/templates\/admin\/invo\.php \|  \| \/invo\.php, \/accounting\/invoice\/\[id\] \| restored - legacy invoice bridge, Receipt Voucher fields, migrated receipt number, amount in words, child context, validity dates, signature, and print action restored/,
);
assert.match(
  text.topGaps,
  /Local invoice implementation and `\/invo\.php\?po=` bridge parity are closed; remaining acceptance is production logo\/stationery and browser print review under `PROD-PRINT`/,
);

console.log("legacy invoice receipt contract assertions passed");
