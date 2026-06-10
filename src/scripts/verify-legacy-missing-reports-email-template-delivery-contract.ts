import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/emails-missingReports.php",
  templates: "src/lib/actions/notification-templates.ts",
  medicalJob: "src/lib/jobs/medical-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacy, /Missing Reports/);
assert.match(text.legacy, /email-missingReport-subj/);
assert.match(text.legacy, /email-missingReport-msg/);
assert.match(text.legacy, /Characters Count/);
assert.match(text.legacy, /\(155 per SMS\)/);
assert.match(text.legacy, /\{\{child_name\}\}/);
assert.match(text.legacy, /\{\{report_name\}\}/);

assert.match(
  text.templates,
  /MISSING_REPORTS: \{[\s\S]*email-missingReport-subj[\s\S]*email-missingReport-msg/,
);
assert.match(text.medicalJob, /import \{ deliverEmail, emailDeliveryAuditData \}/);
assert.match(text.medicalJob, /interface LegacyMedicalRecipient \{[\s\S]*email: string \| null;[\s\S]*name: string \| null;/);
assert.match(text.medicalJob, /select: \{ id: true, email: true, name: true \}/);
assert.match(text.medicalJob, /const usersById = new Map\(users\.map\(\(user\) => \[user\.id, user\]\)\)/);
assert.match(text.medicalJob, /async function storeMedicalEmailAudit/);
assert.match(text.medicalJob, /category: "MISSING_REPORTS"/);
assert.match(text.medicalJob, /source: "generateMedicalAlarms"/);
assert.match(text.medicalJob, /legacyDeliveryTable: MEDICAL_RECEIPT_SOURCE/);
assert.match(text.medicalJob, /emailDelivery: emailDeliveryAuditData\(emailDelivery\)/);
assert.match(text.medicalJob, /report_name: report\.reportName/);
assert.match(text.medicalJob, /await storeMedicalEmailAudit\(\{/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/page/emails-missingReports.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy missing-report template fallback and provider delivery audit restored",
);
assert.match(row.verification ?? "", /email-missingReport-subj/);
assert.match(row.verification ?? "", /email-missingReport-msg/);
assert.match(row.verification ?? "", /provider-neutral `deliverEmail` bridge/);
assert.match(row.verification ?? "", /emailDeliveryAuditData/);
assert.match(row.verification ?? "", /custom_notifications_medical/);
assert.doesNotMatch(row.verification ?? "", /delivery audit remains/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes(
      "| Front/templates/admin/users/admin/page/emails-missingReports.php |",
    ),
  );
assert.match(
  markdownRow ?? "",
  /restored - legacy missing-report template fallback and provider delivery audit restored/,
);
assert.doesNotMatch(markdownRow ?? "", /delivery audit remains/);

console.log("legacy missing reports email template delivery contract assertions passed");
