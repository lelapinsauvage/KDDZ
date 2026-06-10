import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacy:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/users/admin/page/emails-Expiring.php",
  templates: "src/lib/actions/notification-templates.ts",
  contractJob: "src/lib/jobs/contract-alarms.ts",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacy, /Expiration Notifications/);
assert.match(text.legacy, /email-expiring-subj/);
assert.match(text.legacy, /email-expiring-msg/);
assert.match(text.legacy, /\{\{person_name\}\}/);
assert.match(text.legacy, /\{\{document_name\}\}/);
assert.match(text.legacy, /\{\{expiry_date\}\}/);

assert.match(text.templates, /CONTRACT: \{[\s\S]*email-expiring-subj[\s\S]*email-expiring-msg/);
assert.match(text.templates, /map\.get\("CONTRACT"\) \?\? map\.get\("EXPIRATION"\)/);
assert.match(text.contractJob, /import \{ deliverEmail, emailDeliveryAuditData \}/);
assert.match(text.contractJob, /category: "CONTRACT"/);
assert.match(text.contractJob, /legacyDeliveryTable: CONTRACT_RECEIPT_SOURCE/);
assert.match(text.contractJob, /emailDelivery: emailDeliveryAuditData\(emailDelivery\)/);
assert.match(text.contractJob, /select: \{ id: true, branchId: true, role: true, email: true, name: true \}/);
assert.match(text.contractJob, /legacyRecipientRule: "getUserAndBoss"/);
assert.match(text.contractJob, /recipient\.legacyClasses\.trim\(\) !== "0"/);
assert.match(text.contractJob, /recipient\.legacySites\.trim\(\) === "0"/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const row = matrix.find(
  (entry) =>
    entry.legacyPhp ===
    "Front/templates/admin/users/admin/page/emails-Expiring.php",
);
assert.ok(row);
assert.equal(
  row.status,
  "restored - legacy expiring document template, getUserAndBoss targeting, and provider delivery audit restored",
);
assert.match(row.verification ?? "", /email-expiring-subj/);
assert.match(row.verification ?? "", /email-expiring-msg/);
assert.match(row.verification ?? "", /provider-neutral `deliverEmail` bridge/);
assert.match(row.verification ?? "", /emailDeliveryAuditData/);
assert.match(row.verification ?? "", /getUserAndBoss/);
assert.doesNotMatch(row.verification ?? "", /delivery audit remains/);

const markdownRow = text.markdownMatrix
  .split("\n")
  .find((line) =>
    line.includes("| Front/templates/admin/users/admin/page/emails-Expiring.php |"),
  );
assert.match(markdownRow ?? "", /restored - legacy expiring document template, getUserAndBoss targeting, and provider delivery audit restored/);
assert.doesNotMatch(markdownRow ?? "", /delivery audit remains/);

console.log("legacy expiring email template delivery contract assertions passed");
