import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/emails-insurance.php",
  templates: "src/lib/actions/notification-templates.ts",
  insuranceJob: "src/lib/jobs/insurance-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacy, /Insurance Email/);
assert.match(text.legacy, /email-insurance-subj/);
assert.match(text.legacy, /email-insurance-msg/);
assert.match(text.legacy, /\{\{child_name\}\}/);
assert.match(text.legacy, /\{\{expiry_date\}\}/);

assert.match(text.templates, /INSURANCE: \{[\s\S]*email-insurance-subj[\s\S]*email-insurance-msg/);
assert.match(text.insuranceJob, /import \{ deliverEmail, emailDeliveryAuditData \}/);
assert.match(text.insuranceJob, /category: "INSURANCE"/);
assert.match(text.insuranceJob, /legacyDeliveryTable: INSURANCE_RECEIPT_SOURCE/);
assert.match(text.insuranceJob, /emailDelivery: emailDeliveryAuditData\(emailDelivery\)/);
assert.match(text.insuranceJob, /select: \{ id: true, email: true, name: true \}/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/page/emails-insurance.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy insurance template fallback and provider delivery audit restored",
);
assert.match(row.verification ?? "", /email-insurance-subj/);
assert.match(row.verification ?? "", /email-insurance-msg/);
assert.match(row.verification ?? "", /provider-neutral `deliverEmail` bridge/);
assert.match(row.verification ?? "", /emailDeliveryAuditData/);
assert.doesNotMatch(row.verification ?? "", /delivery audit remains/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/page/emails-insurance.php |"),
  );
assert.match(markdownRow ?? "", /restored - legacy insurance template fallback and provider delivery audit restored/);
assert.doesNotMatch(markdownRow ?? "", /delivery audit remains/);

console.log("legacy insurance email template delivery contract assertions passed");
