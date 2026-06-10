import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/emails-birthday.php",
  templates: "src/lib/actions/notification-templates.ts",
  birthdayJob: "src/lib/jobs/birthday-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacy, /Birthday Email/);
assert.match(text.legacy, /email-birthday-subj/);
assert.match(text.legacy, /email-birthday-msg/);
assert.match(text.legacy, /\{\{child_name\}\}/);

assert.match(text.templates, /BIRTHDAY: \{[\s\S]*email-birthday-subj[\s\S]*email-birthday-msg/);
assert.match(text.birthdayJob, /import \{ deliverEmail, emailDeliveryAuditData \}/);
assert.match(text.birthdayJob, /category: "BIRTHDAY"/);
assert.match(text.birthdayJob, /legacyDeliveryTable: BIRTHDAY_RECEIPT_SOURCE/);
assert.match(text.birthdayJob, /emailDelivery: emailDeliveryAuditData\(emailDelivery\)/);
assert.match(text.birthdayJob, /select: \{ id: true, email: true, name: true \}/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/page/emails-birthday.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy birthday template fallback and provider delivery audit restored",
);
assert.match(row.verification ?? "", /email-birthday-subj/);
assert.match(row.verification ?? "", /email-birthday-msg/);
assert.match(row.verification ?? "", /provider-neutral `deliverEmail` bridge/);
assert.match(row.verification ?? "", /emailDeliveryAuditData/);
assert.doesNotMatch(row.verification ?? "", /delivery audit remains/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/page/emails-birthday.php |"),
  );
assert.match(markdownRow ?? "", /restored - legacy birthday template fallback and provider delivery audit restored/);
assert.doesNotMatch(markdownRow ?? "", /delivery audit remains/);

console.log("legacy birthday email template delivery contract assertions passed");
