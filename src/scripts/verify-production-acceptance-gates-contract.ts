import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type ParityRow = {
  status?: string;
  verification?: string;
  notes?: string;
  legacy?: string;
  modern?: string;
  children?: ParityRow[];
  [key: string]: unknown;
};

const files = {
  gates: "docs/legacy-production-acceptance-gates.md",
  matrix: "docs/page-parity-matrix.json",
  topGaps: "docs/top-20-restoration-gaps.md",
  cron: "docs/cron-notification-matrix.md",
  native: "docs/native-acceptance-ledger.md",
  migrationReadme: "src/scripts/migration/README.md",
};

const contents = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, readFileSync(file, "utf8")])
) as Record<keyof typeof files, string>;

const expectedGates = [
  "PROD-DUMPS",
  "PROD-MEDIA",
  "PROD-RECON",
  "PROD-CRON",
  "PROD-PROVIDERS",
  "PROD-NATIVE",
  "PROD-NATURE",
  "PROD-PRINT",
  "PROD-CALLS",
  "PROD-NURSERY",
  "PROD-ACL",
  "PROD-BACKFILL",
] as const;

for (const gate of expectedGates) {
  assert.match(contents.gates, new RegExp(`\\| ${gate} \\|`), `${gate} is missing from production gates`);
}

const requiredReferences = [
  "docs/page-parity-matrix.json",
  "docs/top-20-restoration-gaps.md",
  "docs/cron-notification-matrix.md",
  "docs/native-acceptance-ledger.md",
  "src/scripts/migration/README.md",
  "src/scripts/verify-parent-credentialed-native-e2e.ts",
  "src/scripts/verify-legacy-calls-contract.ts",
  "src/scripts/migration/reconcile-migration-counts.ts",
  "notifications_nature",
  "master.php",
  "/ws/*.php",
];

for (const reference of requiredReferences) {
  assert.match(contents.gates, new RegExp(escapeRegExp(reference)), `${reference} is missing from production gates`);
}

for (const envName of [
  "PUSH_DELIVERY_PROVIDER",
  "ONESIGNAL_APP_ID",
  "ONESIGNAL_REST_API_KEY",
  "PUSH_DELIVERY_WEBHOOK_URL",
  "EMAIL_DELIVERY_PROVIDER",
  "EMAIL_DELIVERY_WEBHOOK_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SMS_DELIVERY_PROVIDER",
  "SMS_DELIVERY_WEBHOOK_URL",
  "WHATSAPP_DELIVERY_PROVIDER",
  "WHATSAPP_DELIVERY_WEBHOOK_URL",
  "LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL",
]) {
  assert.match(contents.gates, new RegExp(`\\b${envName}\\b`), `${envName} must be named without a value`);
  assert.doesNotMatch(contents.gates, new RegExp(`${envName}\\s*=`), `${envName} must not have an inline value`);
}

assert.doesNotMatch(contents.gates, /https?:\/\/[^\s)]+/i, "production gates must not include webhook URLs");
assert.doesNotMatch(contents.gates, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i, "production gates must not include secret values");

const matrix = JSON.parse(contents.matrix) as ParityRow[];
const partialRows: ParityRow[] = [];

function collectPartialRows(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(collectPartialRows);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const row = value as ParityRow;
  if (typeof row.status === "string" && row.status.toLowerCase().startsWith("partial")) {
    partialRows.push(row);
  }

  Object.values(row).forEach(collectPartialRows);
}

collectPartialRows(matrix);

assert.equal(partialRows.length, 17, "the production gate contract must be updated when partial row count changes");

const externalGatePattern =
  /(production|provider|credential|hosted|schedule|cron|crontab|native-device|iOS|Android|canonical|import|print|stationery|notifications_nature|backfill|visual audit|SMS|WhatsApp|OneSignal|email)/i;

for (const row of partialRows) {
  const evidence = [row.status, row.verification, row.notes].filter(Boolean).join("\n");
  assert.match(
    evidence,
    externalGatePattern,
    `partial row is not tied to an external production gate: ${row.status ?? "unknown"}`
  );
}

assert.match(contents.topGaps, /legacy-production-acceptance-gates\.md/);
assert.match(contents.cron, /legacy-production-acceptance-gates\.md/);
assert.match(contents.native, /legacy-production-acceptance-gates\.md/);
assert.match(contents.migrationReadme, /reconcile-migration-counts\.ts/);

console.log("production acceptance gates contract assertions passed");

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
