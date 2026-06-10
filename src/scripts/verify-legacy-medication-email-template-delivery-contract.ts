import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/emails-medication.php",
  templates: "src/lib/actions/notification-templates.ts",
  medicineJob: "src/lib/jobs/medicine-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacy, /Medications/);
assert.match(text.legacy, /email-medication-subject/);
assert.match(text.legacy, /email-medication-msg/);
assert.match(text.legacy, /\{\{child_name\}\}/);
assert.match(text.legacy, /\{\{med_name\}\}/);
assert.match(text.legacy, /\{\{med_time\}\}/);

assert.match(text.templates, /MEDICINE: \{[\s\S]*email-medication-subject[\s\S]*email-medication-msg/);
assert.match(text.medicineJob, /import \{ deliverEmail, emailDeliveryAuditData \}/);
assert.match(text.medicineJob, /category: "MEDICINE"/);
assert.match(text.medicineJob, /legacyDeliveryTable: MEDICINE_RECEIPT_SOURCE/);
assert.match(text.medicineJob, /emailDelivery: emailDeliveryAuditData\(emailDelivery\)/);
assert.match(text.medicineJob, /select: \{ id: true, email: true, name: true \}/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/page/emails-medication.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy medication template fallback and provider delivery audit restored",
);
assert.match(row.verification ?? "", /email-medication-subject/);
assert.match(row.verification ?? "", /email-medication-msg/);
assert.match(row.verification ?? "", /provider-neutral `deliverEmail` bridge/);
assert.match(row.verification ?? "", /emailDeliveryAuditData/);
assert.doesNotMatch(row.verification ?? "", /delivery audit remains/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/page/emails-medication.php |"),
  );
assert.match(markdownRow ?? "", /restored - legacy medication template fallback and provider delivery audit restored/);
assert.doesNotMatch(markdownRow ?? "", /delivery audit remains/);

console.log("legacy medication email template delivery contract assertions passed");
