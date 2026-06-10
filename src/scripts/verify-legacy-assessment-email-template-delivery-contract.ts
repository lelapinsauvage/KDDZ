import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/emails-assessment.php",
  templates: "src/lib/actions/notification-templates.ts",
  assessmentJob: "src/lib/jobs/assessment-alarms.ts",
  parentDelivery: "src/scripts/verify-assessment-parent-delivery.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacy, /Assessment/);
assert.match(text.legacy, /email-assessment-subj/);
assert.match(text.legacy, /email-assessment-msg/);
assert.match(text.legacy, /\{\{child_name\}\}/);

assert.match(text.templates, /ASSESSMENT: \{[\s\S]*email-assessment-subj[\s\S]*email-assessment-msg/);
assert.match(text.assessmentJob, /import \{ deliverEmail, emailDeliveryAuditData \}/);
assert.match(text.assessmentJob, /category: "ASSESSMENT"/);
assert.match(text.assessmentJob, /legacyDeliveryTable: ASSESSMENT_RECEIPT_SOURCE/);
assert.match(text.assessmentJob, /emailDelivery: emailDeliveryAuditData\(emailDelivery\)/);
assert.match(text.assessmentJob, /select: \{ id: true, email: true, name: true \}/);
assert.match(text.assessmentJob, /legacyClassListAllows/);
assert.match(text.assessmentJob, /legacyClassAccess: "login_users\.uclasses"/);
assert.match(text.parentDelivery, /notifications_master\.php should return HTTP 200/);
assert.match(
  text.parentDelivery,
  /parent notifications payload should expose generated assessment alarm body/,
);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/page/emails-assessment.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy assessment template fallback, exact targeting, parent payload, and provider delivery audit restored",
);
assert.match(row.verification ?? "", /email-assessment-subj/);
assert.match(row.verification ?? "", /email-assessment-msg/);
assert.match(row.verification ?? "", /provider-neutral `deliverEmail` bridge/);
assert.match(row.verification ?? "", /emailDeliveryAuditData/);
assert.match(row.verification ?? "", /login_users\.uclasses/);
assert.match(row.verification ?? "", /notifications_master\.php/);
assert.doesNotMatch(row.verification ?? "", /delivery audit remains/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/page/emails-assessment.php |"),
  );
assert.match(markdownRow ?? "", /restored - legacy assessment template fallback, exact targeting, parent payload, and provider delivery audit restored/);
assert.doesNotMatch(markdownRow ?? "", /delivery audit remains/);

console.log("legacy assessment email template delivery contract assertions passed");
