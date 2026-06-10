import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/emails-vaccinations.php",
  templates: "src/lib/actions/notification-templates.ts",
  vaccinationJob: "src/lib/jobs/vaccination-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacy, /vaccinations/);
assert.match(text.legacy, /email-vaccinations-subj/);
assert.match(text.legacy, /email-vaccinations-msg/);
assert.match(text.legacy, /\{\{child_name\}\}/);
assert.match(text.legacy, /\{\{vaccination_name\}\}/);
assert.match(text.legacy, /\{\{x_days\}\}/);

assert.match(text.templates, /VACCINATIONS: \{[\s\S]*email-vaccinations-subj[\s\S]*email-vaccinations-msg/);
assert.match(text.vaccinationJob, /import \{ deliverEmail, emailDeliveryAuditData \}/);
assert.match(text.vaccinationJob, /category: "VACCINATIONS"/);
assert.match(text.vaccinationJob, /legacyDeliveryTable: VACCINATION_RECEIPT_SOURCE/);
assert.match(text.vaccinationJob, /emailDelivery: emailDeliveryAuditData\(emailDelivery\)/);
assert.match(text.vaccinationJob, /select: \{ id: true, email: true, name: true \}/);
assert.match(text.vaccinationJob, /x_days: candidate\.daysUntilDue/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/page/emails-vaccinations.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy vaccination template fallback and provider delivery audit restored",
);
assert.match(row.verification ?? "", /email-vaccinations-subj/);
assert.match(row.verification ?? "", /email-vaccinations-msg/);
assert.match(row.verification ?? "", /provider-neutral `deliverEmail` bridge/);
assert.match(row.verification ?? "", /emailDeliveryAuditData/);
assert.doesNotMatch(row.verification ?? "", /delivery audit remains/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/page/emails-vaccinations.php |"),
  );
assert.match(markdownRow ?? "", /restored - legacy vaccination template fallback and provider delivery audit restored/);
assert.doesNotMatch(markdownRow ?? "", /delivery audit remains/);

console.log("legacy vaccination email template delivery contract assertions passed");
