import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type CommandResult = {
  status: number;
  stdout: string;
  stderr: string;
};

const script = "src/scripts/audit-production-readiness.ts";
const baseEnv: NodeJS.ProcessEnv = {
  PATH: process.env.PATH ?? "",
  HOME: process.env.HOME ?? "",
  NODE_ENV: "test",
};

const safeEnv: NodeJS.ProcessEnv = {
  ...baseEnv,
  PUSH_DELIVERY_PROVIDER: "webhook",
  PUSH_DELIVERY_WEBHOOK_URL: "https://example.invalid/push-secret-path",
  EMAIL_DELIVERY_PROVIDER: "resend",
  RESEND_API_KEY: "re_secret_should_not_print",
  EMAIL_FROM: "noreply@example.invalid",
  SMS_DELIVERY_PROVIDER: "webhook",
  SMS_DELIVERY_WEBHOOK_URL: "https://example.invalid/sms-secret-path",
  WHATSAPP_DELIVERY_PROVIDER: "webhook",
  WHATSAPP_DELIVERY_WEBHOOK_URL: "https://example.invalid/whatsapp-secret-path",
  CRON_SECRET: "cron_secret_should_not_print",
  LEGACY_PRODUCTION_DUMP_MANIFEST: "secret-dump-manifest-id",
  LEGACY_MEDIA_EXPORT_MANIFEST: "secret-media-export-id",
  LEGACY_MEDIA_UPLOAD_MANIFEST: "secret-media-upload-id",
  MIGRATION_RECONCILIATION_REPORT: "secret-reconciliation-id",
  PRODUCTION_CRONTAB_EVIDENCE: "secret-crontab-id",
  HOSTED_SCHEDULER_EVIDENCE: "secret-scheduler-id",
  NATIVE_IOS_ACCEPTANCE_REPORT: "secret-ios-id",
  NATIVE_ANDROID_ACCEPTANCE_REPORT: "secret-android-id",
  NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT: "secret-nature-id",
  PRINT_STATIONERY_ACCEPTANCE_REPORT: "secret-print-id",
  REAL_CALL_ROWS_ACCEPTANCE_REPORT: "secret-calls-id",
  NURSERY_COMPLIANCE_ACCEPTANCE_REPORT: "secret-nursery-id",
  LEGACY_ACL_ACCEPTANCE_REPORT: "secret-acl-id",
  LEGACY_BACKFILL_ACCEPTANCE_REPORT: "secret-backfill-id",
};

const sensitiveFragments = [
  "https://example.invalid",
  "secret_should_not_print",
  "secret-dump-manifest-id",
  "secret-media-export-id",
  "secret-media-upload-id",
  "secret-reconciliation-id",
  "secret-crontab-id",
  "secret-scheduler-id",
  "secret-ios-id",
  "secret-android-id",
  "secret-nature-id",
  "secret-print-id",
  "secret-calls-id",
  "secret-nursery-id",
  "secret-acl-id",
  "secret-backfill-id",
];

const requirementsText = runAudit(["--list-requirements"]);
assert.equal(requirementsText.status, 0);
assert.match(requirementsText.stdout, /Production readiness requirements \(redacted\)/);
assert.match(requirementsText.stdout, /PROD-DUMPS/);
assert.match(requirementsText.stdout, /No environment values/);
assertNoSensitiveOutput(requirementsText.stdout + requirementsText.stderr);

const requirementsJson = runAudit(["--list-requirements", "--json"]);
assert.equal(requirementsJson.status, 0);
const requirementsPayload = JSON.parse(requirementsJson.stdout) as {
  redacted?: boolean;
  evidenceRequirements?: unknown[];
  providerRequirements?: unknown[];
};
assert.equal(requirementsPayload.redacted, true);
assert.equal(requirementsPayload.evidenceRequirements?.length, 11);
assert.equal(requirementsPayload.providerRequirements?.length, 4);
assertNoSensitiveOutput(requirementsJson.stdout + requirementsJson.stderr);

const providerRequirements = runAudit(["--list-requirements", "--gate=PROD-PROVIDERS", "--json"]);
assert.equal(providerRequirements.status, 0);
const providerRequirementPayload = JSON.parse(providerRequirements.stdout) as {
  evidenceRequirements?: unknown[];
  providerRequirements?: unknown[];
};
assert.equal(providerRequirementPayload.evidenceRequirements?.length, 0);
assert.equal(providerRequirementPayload.providerRequirements?.length, 4);
assertNoSensitiveOutput(providerRequirements.stdout + providerRequirements.stderr);

const cronRequirements = runAudit(["--list-requirements", "--gate=PROD-CRON"]);
assert.equal(cronRequirements.status, 0);
assert.match(cronRequirements.stdout, /PROD-CRON/);
assert.doesNotMatch(cronRequirements.stdout, /PROD-DUMPS/);
assertNoSensitiveOutput(cronRequirements.stdout + cronRequirements.stderr);

const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-readiness-"));
try {
  const outPath = join(tmp, "readiness.json");
  const reportText = runAudit([`--out=${outPath}`]);
  assert.equal(reportText.status, 0);
  assert.match(reportText.stdout, /Ready to review: 12\/12/);
  assert.match(reportText.stdout, new RegExp(`Redacted report written: ${escapeRegExp(outPath)}`));
  assertNoSensitiveOutput(reportText.stdout + reportText.stderr);

  const report = readFileSync(outPath, "utf8");
  assertNoSensitiveOutput(report);
  const payload = JSON.parse(report) as {
    redacted?: boolean;
    summary?: { ready?: number; needsEvidence?: number; total?: number };
    gates?: unknown[];
    providers?: unknown[];
  };
  assert.equal(payload.redacted, true);
  assert.deepEqual(payload.summary, { ready: 12, needsEvidence: 0, total: 12 });
  assert.equal(payload.gates?.length, 12);
  assert.equal(payload.providers?.length, 4);

  const providerOutPath = join(tmp, "providers.json");
  const filteredReportText = runAudit([`--out=${providerOutPath}`, "--gate=PROD-PROVIDERS"]);
  assert.equal(filteredReportText.status, 0);
  assert.match(filteredReportText.stdout, /Ready to review: 1\/1/);
  assert.doesNotMatch(filteredReportText.stdout, /PROD-DUMPS/);
  assertNoSensitiveOutput(filteredReportText.stdout + filteredReportText.stderr);

  const filteredReport = readFileSync(providerOutPath, "utf8");
  assertNoSensitiveOutput(filteredReport);
  const filteredPayload = JSON.parse(filteredReport) as {
    summary?: { ready?: number; needsEvidence?: number; total?: number };
    gates?: Array<{ gate?: string }>;
  };
  assert.deepEqual(filteredPayload.summary, { ready: 1, needsEvidence: 0, total: 1 });
  assert.deepEqual(filteredPayload.gates?.map((gate) => gate.gate), ["PROD-PROVIDERS"]);

  const envFilePath = join(tmp, "private-readiness.env");
  const envFileReportPath = join(tmp, "env-file-readiness.json");
  writeFileSync(
    envFilePath,
    [
      "PUSH_DELIVERY_PROVIDER=webhook",
      "PUSH_DELIVERY_WEBHOOK_URL=https://example.invalid/env-file-push-secret",
      "EMAIL_DELIVERY_PROVIDER=resend",
      "RESEND_API_KEY=re_env_file_secret_should_not_print",
      "EMAIL_FROM=noreply@example.invalid",
      "SMS_DELIVERY_PROVIDER=webhook",
      "SMS_DELIVERY_WEBHOOK_URL=https://example.invalid/env-file-sms-secret",
      "WHATSAPP_DELIVERY_PROVIDER=webhook",
      "WHATSAPP_DELIVERY_WEBHOOK_URL=https://example.invalid/env-file-whatsapp-secret",
      "CRON_SECRET=env_file_cron_secret_should_not_print",
      "LEGACY_PRODUCTION_DUMP_MANIFEST=env-file-secret-dump-id",
      "LEGACY_MEDIA_EXPORT_MANIFEST=env-file-secret-media-export-id",
      "LEGACY_MEDIA_UPLOAD_MANIFEST=env-file-secret-media-upload-id",
      "MIGRATION_RECONCILIATION_REPORT=env-file-secret-reconciliation-id",
      "PRODUCTION_CRONTAB_EVIDENCE=env-file-secret-crontab-id",
      "HOSTED_SCHEDULER_EVIDENCE=env-file-secret-scheduler-id",
      "NATIVE_IOS_ACCEPTANCE_REPORT=env-file-secret-ios-id",
      "NATIVE_ANDROID_ACCEPTANCE_REPORT=env-file-secret-android-id",
      "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=env-file-secret-nature-id",
      "PRINT_STATIONERY_ACCEPTANCE_REPORT=env-file-secret-print-id",
      "REAL_CALL_ROWS_ACCEPTANCE_REPORT=env-file-secret-calls-id",
      "NURSERY_COMPLIANCE_ACCEPTANCE_REPORT=env-file-secret-nursery-id",
      "LEGACY_ACL_ACCEPTANCE_REPORT=env-file-secret-acl-id",
      "LEGACY_BACKFILL_ACCEPTANCE_REPORT=env-file-secret-backfill-id",
      "",
    ].join("\n"),
    "utf8"
  );
  const envFileReport = runAudit([`--env-file=${envFilePath}`, `--out=${envFileReportPath}`], baseEnv);
  assert.equal(envFileReport.status, 0);
  assert.match(envFileReport.stdout, /Ready to review: 12\/12/);
  assertNoSensitiveOutput(envFileReport.stdout + envFileReport.stderr);

  const envFileReportText = readFileSync(envFileReportPath, "utf8");
  assertNoSensitiveOutput(envFileReportText);
  const envFilePayload = JSON.parse(envFileReportText) as {
    summary?: { ready?: number; needsEvidence?: number; total?: number };
  };
  assert.deepEqual(envFilePayload.summary, { ready: 12, needsEvidence: 0, total: 12 });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const missingEvidence = runAudit([], baseEnv);
assert.equal(missingEvidence.status, 1);
assert.match(missingEvidence.stdout, /Needs evidence: 12\/12/);
assertNoSensitiveOutput(missingEvidence.stdout + missingEvidence.stderr);

const filteredMissingEvidence = runAudit(["--gate=PROD-CRON"], baseEnv);
assert.equal(filteredMissingEvidence.status, 1);
assert.match(filteredMissingEvidence.stdout, /Needs evidence: 1\/1/);
assert.match(filteredMissingEvidence.stdout, /PROD-CRON/);
assert.doesNotMatch(filteredMissingEvidence.stdout, /PROD-DUMPS/);
assertNoSensitiveOutput(filteredMissingEvidence.stdout + filteredMissingEvidence.stderr);

console.log("production readiness audit contract assertions passed");

function runAudit(args: string[], env: NodeJS.ProcessEnv = safeEnv): CommandResult {
  try {
    const stdout = execFileSync("pnpm", ["tsx", script, ...args], {
      cwd: process.cwd(),
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const result = error as {
      status?: number;
      stdout?: string | Buffer;
      stderr?: string | Buffer;
    };
    return {
      status: result.status ?? 1,
      stdout: String(result.stdout ?? ""),
      stderr: String(result.stderr ?? ""),
    };
  }
}

function assertNoSensitiveOutput(output: string) {
  for (const fragment of sensitiveFragments) {
    assert.doesNotMatch(output, new RegExp(escapeRegExp(fragment)), `${fragment} leaked in readiness output`);
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
