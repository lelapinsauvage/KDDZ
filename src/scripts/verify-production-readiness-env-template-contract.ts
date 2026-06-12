import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = "src/scripts/render-production-readiness-env-template.ts";
const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-readiness-env-template-"));
const generatedAt = "2026-06-12T00:00:00.000Z";

try {
  const fullPath = join(tmp, "private-readiness.env");
  const full = execFileSync("pnpm", [
    "tsx",
    script,
    `--out=${fullPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(readFileSync(fullPath, "utf8"), full);
  assert.match(full, /KiddzOnline production readiness private env template/);
  assert.match(full, /Scope: all production acceptance gates/);
  assert.match(full, /LEGACY_PRODUCTION_DUMP_MANIFEST=replace-me/);
  assert.match(full, /CRON_PARTIAL_ROW_COVERAGE_REPORT=replace-me/);
  assert.match(full, /NATIVE_PARTIAL_ROW_COVERAGE_REPORT=replace-me/);
  assert.match(full, /NOTIFICATIONS_NATURE_PARTIAL_ROW_COVERAGE_REPORT=replace-me/);
  assert.match(full, /PROVIDER_PARTIAL_ROW_COVERAGE_REPORT=replace-me/);
  assert.match(full, /PUSH_DELIVERY_PROVIDER=replace-me/);
  assert.match(full, /EMAIL_DELIVERY_PROVIDER=replace-me/);
  assert.match(full, /SMS_DELIVERY_PROVIDER=replace-me/);
  assert.match(full, /WHATSAPP_DELIVERY_PROVIDER=replace-me/);
  assert.doesNotMatch(full, /https?:\/\//);
  assert.doesNotMatch(full, /secret-value|token-value|phone-number/i);

  const auditWithTemplate = spawnSync("pnpm", [
    "tsx",
    "src/scripts/audit-production-readiness.ts",
    `--env-file=${fullPath}`,
    "--json",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(auditWithTemplate.status, 1);
  assert.match(auditWithTemplate.stdout, /"needsEvidence": 12/);
  assert.doesNotMatch(auditWithTemplate.stdout, /replace-me/);

  const cron = execFileSync("pnpm", [
    "tsx",
    script,
    "--gate=PROD-CRON",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(cron, /Scope: PROD-CRON/);
  assert.match(cron, /PRODUCTION_CRONTAB_EVIDENCE=replace-me/);
  assert.match(cron, /CRON_SECRET=replace-me/);
  assert.match(cron, /VERCEL_CRON_SECRET=replace-me/);
  assert.doesNotMatch(cron, /PROVIDER_PARTIAL_ROW_COVERAGE_REPORT=replace-me/);

  const cronWithWorkOrder = execFileSync("pnpm", [
    "tsx",
    script,
    "--gate=PROD-CRON",
    "--include-work-orders",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(cronWithWorkOrder, /Finish condition: Set every PROD-CRON evidence pointer/);
  assert.match(cronWithWorkOrder, /Focused coverage rows: P01, P02, P03, P04, P05, P06, P07, P10, P12/);
  assert.match(cronWithWorkOrder, /Proof command: pnpm tsx src\/scripts\/audit-production-readiness\.ts --env-file=\/secure\/private-readiness\.env --gate=PROD-CRON/);
  assert.match(cronWithWorkOrder, /Proof command: pnpm tsx src\/scripts\/report-production-gate-status\.ts --json --env-file=\/secure\/private-readiness\.env --gate=PROD-CRON/);
  assert.doesNotMatch(cronWithWorkOrder, /https?:\/\//);
  assert.doesNotMatch(cronWithWorkOrder, /secret-value|token-value|phone-number/i);

  const cronWithBoundWorkOrder = execFileSync("pnpm", [
    "tsx",
    script,
    "--gate=PROD-CRON",
    "--include-work-orders",
    "--release-branch=legacy-parity-runbook",
    "--release-commit=0252d1e",
    "--acceptance-date=2026-06-12",
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(cronWithBoundWorkOrder, /Release branch: legacy-parity-runbook/);
  assert.match(cronWithBoundWorkOrder, /Release commit: 0252d1e/);
  assert.match(cronWithBoundWorkOrder, /Acceptance date: 2026-06-12/);
  assert.match(cronWithBoundWorkOrder, new RegExp(`--generated-at=${generatedAt}`));
  assert.doesNotMatch(cronWithBoundWorkOrder, /<release-generated-at-iso>/);

  const partialReleaseMetadata = spawnSync("pnpm", [
    "tsx",
    script,
    "--gate=PROD-CRON",
    "--release-branch=legacy-parity-runbook",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(partialReleaseMetadata.status, 2);
  assert.match(partialReleaseMetadata.stderr, /must be provided together/);

  const invalidAcceptanceDate = spawnSync("pnpm", [
    "tsx",
    script,
    "--gate=PROD-CRON",
    "--release-branch=legacy-parity-runbook",
    "--release-commit=0252d1e",
    "--acceptance-date=06-12-2026",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(invalidAcceptanceDate.status, 2);
  assert.match(invalidAcceptanceDate.stderr, /--acceptance-date must use YYYY-MM-DD format/);

  const providers = execFileSync("pnpm", [
    "tsx",
    script,
    "--gate=PROD-PROVIDERS",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(providers, /Scope: PROD-PROVIDERS/);
  assert.match(providers, /PROVIDER_DELIVERY_ACCEPTANCE_REPORT=replace-me/);
  assert.match(providers, /LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL=replace-me/);
  assert.doesNotMatch(providers, /PRODUCTION_CRONTAB_EVIDENCE=replace-me/);

  const native = execFileSync("pnpm", [
    "tsx",
    script,
    "--gate=PROD-NATIVE",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(native, /Scope: PROD-NATIVE/);
  assert.match(native, /NATIVE_IOS_ACCEPTANCE_REPORT=replace-me/);
  assert.match(native, /NATIVE_ANDROID_ACCEPTANCE_REPORT=replace-me/);
  assert.match(native, /NATIVE_LEGACY_ROUTE_ACCEPTANCE_REPORT=replace-me/);
  assert.match(native, /NATIVE_PARTIAL_ROW_COVERAGE_REPORT=replace-me/);
  assert.doesNotMatch(native, /PROVIDER_PARTIAL_ROW_COVERAGE_REPORT=replace-me/);

  const nature = execFileSync("pnpm", [
    "tsx",
    script,
    "--gate=PROD-NATURE",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(nature, /Scope: PROD-NATURE/);
  assert.match(nature, /NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=replace-me/);
  assert.match(nature, /NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT=replace-me/);
  assert.match(nature, /NOTIFICATIONS_NATURE_PARTIAL_ROW_COVERAGE_REPORT=replace-me/);
  assert.doesNotMatch(nature, /NATIVE_PARTIAL_ROW_COVERAGE_REPORT=replace-me/);

  const fullWithWorkOrders = execFileSync("pnpm", [
    "tsx",
    script,
    "--include-work-orders",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(fullWithWorkOrders, /Finish condition: Set every PROD-CRON evidence pointer/);
  assert.match(fullWithWorkOrders, /Finish condition: Set every PROD-PROVIDERS evidence pointer/);
  assert.match(fullWithWorkOrders, /Finish condition: Set every PROD-NATIVE evidence pointer/);
  assert.match(fullWithWorkOrders, /Finish condition: Set every PROD-NATURE evidence pointer/);

  const invalidGate = spawnSync("pnpm", [
    "tsx",
    script,
    "--gate=NOT-A-GATE",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.notEqual(invalidGate.status, 0);
  assert.match(invalidGate.stderr, /Unknown production gate/);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("production readiness env template contract assertions passed");
