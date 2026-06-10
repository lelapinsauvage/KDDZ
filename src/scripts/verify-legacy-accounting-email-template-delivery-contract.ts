import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/emails-Accounting.php",
  templates: "src/lib/actions/notification-templates.ts",
  paymentJob: "src/lib/jobs/payment-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacy, /Accounting Notifications/);
assert.match(text.legacy, /email-accounting-subj/);
assert.match(text.legacy, /email-accounting-msg-before/);
assert.match(text.legacy, /email-accounting-msg-after/);
assert.match(text.legacy, /email-accounting-msg-paid/);
assert.match(text.legacy, /account-remind-before/);
assert.match(text.legacy, /account-remind-after/);
assert.match(text.legacy, /account-remind-paid/);
assert.match(text.legacy, /\{\{payment_date\}\}/);
assert.match(text.legacy, /\{\{family_name\}\}/);
assert.match(text.legacy, /\{\{fees\}\}/);

assert.match(text.templates, /PAYMENT: \{[\s\S]*email-accounting-subj[\s\S]*email-accounting-msg-paid/);
assert.match(text.templates, /PAYMENT_BEFORE: \{[\s\S]*email-accounting-subj[\s\S]*email-accounting-msg-before/);
assert.match(text.templates, /PAYMENT_AFTER: \{[\s\S]*email-accounting-subj[\s\S]*email-accounting-msg-after/);
assert.match(text.paymentJob, /import \{ deliverEmail, emailDeliveryAuditData \}/);
assert.match(text.paymentJob, /username: true/);
assert.match(text.paymentJob, /category: params\.category/);
assert.match(text.paymentJob, /legacyDeliveryTable: PAYMENT_RECEIPT_SOURCE/);
assert.match(text.paymentJob, /emailDelivery: emailDeliveryAuditData\(emailDelivery\)/);
assert.match(text.paymentJob, /templateCategory: template\.category/);
assert.match(text.paymentJob, /legacyTemplateSettingKey: template\.legacySettingKey/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/page/emails-Accounting.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy accounting reminder templates, selectors, and provider delivery audit restored",
);
assert.match(row.verification ?? "", /email-accounting-subj/);
assert.match(row.verification ?? "", /email-accounting-msg-before/);
assert.match(row.verification ?? "", /email-accounting-msg-after/);
assert.match(row.verification ?? "", /email-accounting-msg-paid/);
assert.match(row.verification ?? "", /provider-neutral `deliverEmail` bridge/);
assert.match(row.verification ?? "", /emailDeliveryAuditData/);
assert.doesNotMatch(row.verification ?? "", /provider delivery remains/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/page/emails-Accounting.php |"),
  );
assert.match(markdownRow ?? "", /restored - legacy accounting reminder templates, selectors, and provider delivery audit restored/);
assert.doesNotMatch(markdownRow ?? "", /provider delivery remains/);

console.log("legacy accounting email template delivery contract assertions passed");
