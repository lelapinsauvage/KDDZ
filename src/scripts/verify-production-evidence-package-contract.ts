import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

type CloseoutSummary = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  readinessReport?: string;
  evidenceRecord?: string;
  partialReport?: string | null;
  evidenceChecklist?: string | null;
  readinessSummary?: {
    ready?: number;
    needsEvidence?: number;
    total?: number;
  };
  parityTracker?: {
    total?: number;
    complete?: number;
    partial?: number;
    donePct?: number;
    leftPct?: number;
  };
  requireZeroPartials?: boolean;
  branch?: string;
  commit?: string;
  redacted?: boolean;
};

type PackageManifest = {
  status: "production evidence package verified";
  schemaVersion: 1;
  generatedAt?: string;
  artifacts: Record<string, ArtifactManifest>;
  closeout: {
    branch?: string;
    commit?: string;
    readinessSummary?: CloseoutSummary["readinessSummary"];
    parityTracker?: CloseoutSummary["parityTracker"];
    requireZeroPartials?: boolean;
  };
  redacted: true;
};

type ArtifactManifest = {
  path: string;
  algorithm: "sha256";
  digest: string;
  generatedAt?: string;
};

const summaryReportPath = optionValue("--summary-report");

if (summaryReportPath) {
  verifyEvidencePackage(summaryReportPath);
} else {
  verifySelfTestContract();
}

console.log("production evidence package contract assertions passed");

function verifyEvidencePackage(closeoutSummaryPath: string) {
  const summary = readJson<CloseoutSummary>(closeoutSummaryPath);
  assert.equal(summary.status, "production closeout verified");
  assert.equal(summary.schemaVersion, 1, "production evidence package closeout summary schema version drifted");
  assert.equal(summary.redacted, true);
  const expectedBranch = optionValue("--branch");
  const expectedCommit = optionValue("--commit");
  if (process.argv.includes("--require-zero-partials")) {
    assert.ok(expectedBranch, "final production evidence package requires --branch with --require-zero-partials");
    assert.ok(expectedCommit, "final production evidence package requires --commit with --require-zero-partials");
    assert.equal(summary.requireZeroPartials, true, "production evidence package must come from a require-zero-partials closeout");
    assert.equal(summary.parityTracker?.partial, 0, "production evidence package still has unresolved partial rows");
  }
  if (expectedBranch) {
    assert.equal(summary.branch, expectedBranch, "production evidence package branch drifted");
  }
  if (expectedCommit) {
    assert.equal(summary.commit, expectedCommit, "production evidence package commit drifted");
  }

  const readinessReportPath = optionValue("--readiness-report") ?? summary.readinessReport;
  const evidenceRecordPath = optionValue("--evidence-record") ?? summary.evidenceRecord;
  const partialReportPath = optionValue("--partial-report") ?? summary.partialReport ?? null;
  const checklistReportPath = optionValue("--checklist-report") ?? summary.evidenceChecklist ?? null;

  assert.ok(readinessReportPath, "production evidence package is missing readiness report path");
  assert.ok(evidenceRecordPath, "production evidence package is missing evidence record path");
  assert.ok(partialReportPath, "production evidence package is missing partial report path");
  assert.ok(checklistReportPath, "production evidence package is missing evidence checklist path");

  execFileSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-closeout-summary-contract.ts",
    closeoutSummaryPath,
    `--readiness-report=${readinessReportPath}`,
    `--evidence-record=${evidenceRecordPath}`,
    `--partial-report=${partialReportPath}`,
    `--checklist-report=${checklistReportPath}`,
    ...optionalArg("--branch", expectedBranch),
    ...optionalArg("--commit", expectedCommit),
    ...optionalFlag("--require-zero-partials", process.argv.includes("--require-zero-partials")),
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });

  const manifest = buildManifest({
    closeoutSummaryPath,
    readinessReportPath,
    evidenceRecordPath,
    partialReportPath,
    checklistReportPath,
    summary,
  });
  assertNoSensitiveOutput(JSON.stringify(manifest));

  const expectedManifestPath = optionValue("--manifest");
  if (expectedManifestPath) {
    assert.deepEqual(readJson<PackageManifest>(expectedManifestPath), manifest);
  }

  const manifestOutputPath = optionValue("--manifest-out");
  if (manifestOutputPath) {
    ensureParentDir(manifestOutputPath);
    writeFileSync(manifestOutputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  if (!manifestOutputPath) {
    console.log(JSON.stringify(manifest, null, 2));
  }
}

function verifySelfTestContract() {
  const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-evidence-package-"));
  const generatedAt = "2026-06-10T00:00:00.000Z";
  try {
    const envFilePath = join(tmp, "private-readiness.env");
    const evidenceRecordPath = join(tmp, "production-acceptance-evidence.md");
    const readinessReportPath = join(tmp, "readiness.json");
    const closeoutSummaryPath = join(tmp, "closeout-summary.json");
    const partialReportPath = join(tmp, "partials.json");
    const checklistReportPath = join(tmp, "evidence-checklist.json");
    const packageManifestPath = join(tmp, "evidence-package.json");

    writeFileSync(envFilePath, readinessEnvFile(), "utf8");
    execFileSync("pnpm", ["tsx", "src/scripts/report-production-partials.ts", "--json", `--out=${partialReportPath}`, `--generated-at=${generatedAt}`], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    execFileSync("pnpm", ["tsx", "src/scripts/report-production-evidence-checklist.ts", "--json", `--out=${checklistReportPath}`, `--generated-at=${generatedAt}`], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    writeFileSync(
      evidenceRecordPath,
      fillTemplate(readFileSync("docs/production-acceptance-evidence-template.md", "utf8"), {
        readinessReportPath,
        closeoutSummaryPath,
        partialReportPath,
        checklistReportPath,
        readinessReportDigest: "verified in closeout summary artifact digests",
        partialReportDigest: sha256File(partialReportPath),
        checklistReportDigest: sha256File(checklistReportPath),
      }),
      "utf8"
    );
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/run-production-closeout.ts",
      `--env-file=${envFilePath}`,
      `--evidence-record=${evidenceRecordPath}`,
      `--out=${readinessReportPath}`,
      `--summary-out=${closeoutSummaryPath}`,
      `--partials-out=${partialReportPath}`,
      `--checklist-out=${checklistReportPath}`,
      "--branch=legacy-parity-runbook",
      "--commit=0404c6a",
      `--generated-at=${generatedAt}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });

    runVerifier([
      `--summary-report=${closeoutSummaryPath}`,
      `--readiness-report=${readinessReportPath}`,
      `--evidence-record=${evidenceRecordPath}`,
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
      `--manifest-out=${packageManifestPath}`,
    ]);
    const packageManifest = readJson<PackageManifest>(packageManifestPath);
    const readinessGeneratedAt = readJson<{ generatedAt?: string }>(readinessReportPath).generatedAt;
    assert.equal(readinessGeneratedAt, generatedAt);
    assert.equal(packageManifest.schemaVersion, 1);
    assert.equal(packageManifest.generatedAt, generatedAt);
    assert.equal(packageManifest.artifacts.closeoutSummary.generatedAt, generatedAt);
    assert.equal(packageManifest.artifacts.readinessReport.generatedAt, generatedAt);
    assert.equal(packageManifest.artifacts.partialReport.generatedAt, generatedAt);
    assert.equal(packageManifest.artifacts.evidenceChecklist.generatedAt, generatedAt);
    assert.equal(packageManifest.artifacts.evidenceRecord.generatedAt, undefined);

    runVerifier([
      `--summary-report=${closeoutSummaryPath}`,
      `--readiness-report=${readinessReportPath}`,
      `--evidence-record=${evidenceRecordPath}`,
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
      `--manifest=${packageManifestPath}`,
    ]);

    const staleManifestPath = join(tmp, "stale-evidence-package.json");
    const staleManifest = readJson<PackageManifest>(packageManifestPath);
    staleManifest.artifacts.closeoutSummary.digest = "0".repeat(64);
    writeFileSync(staleManifestPath, `${JSON.stringify(staleManifest, null, 2)}\n`, "utf8");
    const stale = runVerifier([
      `--summary-report=${closeoutSummaryPath}`,
      `--readiness-report=${readinessReportPath}`,
      `--evidence-record=${evidenceRecordPath}`,
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
      `--manifest=${staleManifestPath}`,
    ], false);
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /Expected values to be strictly deep-equal/);
    assertNoSensitiveOutput(stale.stdout + stale.stderr);

    const unresolvedFinal = runVerifier([
      `--summary-report=${closeoutSummaryPath}`,
      `--readiness-report=${readinessReportPath}`,
      `--evidence-record=${evidenceRecordPath}`,
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
      "--require-zero-partials",
    ], false);
    assert.equal(unresolvedFinal.status, 1);
    assert.match(unresolvedFinal.stderr, /requires --branch/);
    assertNoSensitiveOutput(unresolvedFinal.stdout + unresolvedFinal.stderr);

    const unresolvedFinalWithRef = runVerifier([
      `--summary-report=${closeoutSummaryPath}`,
      `--readiness-report=${readinessReportPath}`,
      `--evidence-record=${evidenceRecordPath}`,
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
      "--branch=legacy-parity-runbook",
      "--commit=0404c6a",
      "--require-zero-partials",
    ], false);
    assert.equal(unresolvedFinalWithRef.status, 1);
    assert.match(unresolvedFinalWithRef.stderr, /must come from a require-zero-partials closeout/);
    assertNoSensitiveOutput(unresolvedFinalWithRef.stdout + unresolvedFinalWithRef.stderr);

    const wrongCommit = runVerifier([
      `--summary-report=${closeoutSummaryPath}`,
      `--readiness-report=${readinessReportPath}`,
      `--evidence-record=${evidenceRecordPath}`,
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
      "--branch=legacy-parity-runbook",
      "--commit=deadbeef",
    ], false);
    assert.equal(wrongCommit.status, 1);
    assert.match(wrongCommit.stderr, /production evidence package commit drifted/);
    assertNoSensitiveOutput(wrongCommit.stdout + wrongCommit.stderr);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function buildManifest(params: {
  closeoutSummaryPath: string;
  readinessReportPath: string;
  evidenceRecordPath: string;
  partialReportPath: string;
  checklistReportPath: string;
  summary: CloseoutSummary;
}): PackageManifest {
  return {
    status: "production evidence package verified",
    schemaVersion: 1,
    generatedAt: params.summary.generatedAt,
    artifacts: {
      closeoutSummary: artifact(params.closeoutSummaryPath),
      readinessReport: artifact(params.readinessReportPath),
      evidenceRecord: artifact(params.evidenceRecordPath),
      partialReport: artifact(params.partialReportPath),
      evidenceChecklist: artifact(params.checklistReportPath),
    },
    closeout: {
      branch: params.summary.branch,
      commit: params.summary.commit,
      readinessSummary: params.summary.readinessSummary,
      parityTracker: params.summary.parityTracker,
      requireZeroPartials: params.summary.requireZeroPartials,
    },
    redacted: true,
  };
}

function artifact(path: string): ArtifactManifest {
  const text = readFileSync(path, "utf8");
  assertNoSensitiveOutput(text);
  const generatedAt = generatedAtFromJson(text);
  return {
    path,
    algorithm: "sha256",
    digest: sha256File(path),
    ...(generatedAt ? { generatedAt } : {}),
  };
}

function generatedAtFromJson(text: string) {
  try {
    const payload = JSON.parse(text) as { generatedAt?: unknown };
    if (typeof payload.generatedAt !== "string") {
      return null;
    }
    assert.equal(new Date(payload.generatedAt).toISOString(), payload.generatedAt, "artifact generatedAt must be an ISO timestamp");
    return payload.generatedAt;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

function runVerifier(args: string[], expectSuccess = true) {
  const result = spawnSync("pnpm", ["tsx", "src/scripts/verify-production-evidence-package-contract.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (expectSuccess) {
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assertNoSensitiveOutput(result.stdout + result.stderr);
  }
  return result;
}

function fillTemplate(markdown: string, artifactPaths: ArtifactPaths) {
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      if (!line.startsWith("|")) return line;

      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length < 2) return line;

      const [field, value] = cells;
      if (field === "Field" || field === "Evidence" || /^-+$/.test(field) || /^-+$/.test(value)) {
        return line;
      }

      return `| ${field} | ${filledValueFor(field, artifactPaths)} |`;
    })
    .join("\n");
}

type ArtifactPaths = {
  readinessReportPath: string;
  closeoutSummaryPath: string;
  partialReportPath: string;
  checklistReportPath: string;
  readinessReportDigest: string;
  partialReportDigest: string;
  checklistReportDigest: string;
};

function filledValueFor(field: string, artifactPaths: ArtifactPaths) {
  if (field === "Acceptance date") return "2026-06-10";
  if (field === "Environment") return "staging-production-import";
  if (field === "Modern branch/commit") return "`legacy-parity-runbook` / 0404c6a";
  if (field === "`audit-production-readiness.ts` result") return "12/12 ready";
  if (field === "Redacted readiness report") return artifactPaths.readinessReportPath;
  if (field === "Redacted readiness report SHA-256") return artifactPaths.readinessReportDigest;
  if (field === "Redacted closeout summary") return artifactPaths.closeoutSummaryPath;
  if (field === "Partial gate report") return artifactPaths.partialReportPath;
  if (field === "Partial gate report SHA-256") return artifactPaths.partialReportDigest;
  if (field === "Production evidence checklist") return artifactPaths.checklistReportPath;
  if (field === "Production evidence checklist SHA-256") return artifactPaths.checklistReportDigest;
  if (field === "Release decision") return "accepted";
  if (field === "Remaining production tickets") return "none";
  if (field === "Approval link/id") return "release-ticket-verified";
  return "accepted evidence recorded in release-ticket-verified";
}

function readinessEnvFile() {
  return [
    "PUSH_DELIVERY_PROVIDER=webhook",
    "PUSH_DELIVERY_WEBHOOK_URL=https://example.invalid/package-push-secret",
    "EMAIL_DELIVERY_PROVIDER=resend",
    "RESEND_API_KEY=re_package_secret_should_not_print",
    "EMAIL_FROM=noreply@example.invalid",
    "SMS_DELIVERY_PROVIDER=webhook",
    "SMS_DELIVERY_WEBHOOK_URL=https://example.invalid/package-sms-secret",
    "WHATSAPP_DELIVERY_PROVIDER=webhook",
    "WHATSAPP_DELIVERY_WEBHOOK_URL=https://example.invalid/package-whatsapp-secret",
    "PROVIDER_DELIVERY_ACCEPTANCE_REPORT=package-secret-provider-delivery-id",
    "PROVIDER_CHANNEL_ROLLOUT_REPORT=package-secret-provider-rollout-id",
    "PROVIDER_RESPONSE_ID_AUDIT_REPORT=package-secret-provider-response-id-audit-id",
    "CRON_SECRET=package_cron_secret_should_not_print",
    "LEGACY_PRODUCTION_DUMP_MANIFEST=package-secret-dump-id",
    "LEGACY_FIRST_MIGRATION_SOURCE_REPORT=package-secret-first-migration-source-id",
    "LEGACY_MEDIA_AUDIT_REPORT=package-secret-media-audit-id",
    "LEGACY_MEDIA_EXPORT_MANIFEST=package-secret-media-export-id",
    "LEGACY_MEDIA_UPLOAD_MANIFEST=package-secret-media-upload-id",
    "LEGACY_MEDIA_URL_APPLY_MANIFEST=package-secret-media-url-apply-id",
    "MIGRATION_RECONCILIATION_REPORT=package-secret-reconciliation-id",
    "MIGRATION_RECONCILIATION_ACCEPTANCE_REPORT=package-secret-reconciliation-acceptance-id",
    "PRODUCTION_CRONTAB_EVIDENCE=package-secret-crontab-id",
    "CRON_HELPER_DECISION_REPORT=package-secret-cron-helper-decision-id",
    "CRON_SCHEDULE_COVERAGE_REPORT=package-secret-cron-schedule-coverage-id",
    "HOSTED_SCHEDULER_EVIDENCE=package-secret-scheduler-id",
    "NATIVE_IOS_ACCEPTANCE_REPORT=package-secret-ios-id",
    "NATIVE_ANDROID_ACCEPTANCE_REPORT=package-secret-android-id",
    "NATIVE_LEGACY_ROUTE_ACCEPTANCE_REPORT=package-secret-native-route-id",
    "NATIVE_CRASH_PARSER_AUDIT_REPORT=package-secret-native-crash-parser-id",
    "NATIVE_PARENT_FLOW_ACCEPTANCE_REPORT=package-secret-native-parent-flow-id",
    "NATIVE_NOTIFICATIONS_MESSAGES_ALARMS_REPORT=package-secret-native-notifications-messages-alarms-id",
    "NATIVE_PUSH_TOKEN_ACCEPTANCE_REPORT=package-secret-native-push-token-id",
    "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=package-secret-nature-id",
    "NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT=package-secret-nature-group-comparison-id",
    "PRINT_STATIONERY_ACCEPTANCE_REPORT=package-secret-print-id",
    "REAL_CALL_ROWS_ACCEPTANCE_REPORT=package-secret-calls-id",
    "NURSERY_COMPLIANCE_ACCEPTANCE_REPORT=package-secret-nursery-id",
    "LEGACY_ACL_ACCEPTANCE_REPORT=package-secret-acl-id",
    "LEGACY_BACKFILL_ACCEPTANCE_REPORT=package-secret-backfill-id",
    "",
  ].join("\n");
}

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
  for (const fragment of [
    "https://example.invalid",
    "secret_should_not_print",
    "package-secret-dump-id",
    "package-secret-first-migration-source-id",
    "package-secret-media-audit-id",
    "package-secret-media-export-id",
    "package-secret-media-upload-id",
    "package-secret-media-url-apply-id",
    "package-secret-provider-delivery-id",
    "package-secret-provider-rollout-id",
    "package-secret-provider-response-id-audit-id",
    "package-secret-reconciliation-id",
    "package-secret-reconciliation-acceptance-id",
    "package-secret-crontab-id",
    "package-secret-cron-helper-decision-id",
    "package-secret-cron-schedule-coverage-id",
    "package-secret-scheduler-id",
    "package-secret-ios-id",
    "package-secret-android-id",
    "package-secret-native-route-id",
    "package-secret-native-crash-parser-id",
    "package-secret-native-parent-flow-id",
    "package-secret-native-notifications-messages-alarms-id",
    "package-secret-native-push-token-id",
    "package-secret-nature-id",
    "package-secret-nature-group-comparison-id",
    "package-secret-print-id",
    "package-secret-calls-id",
    "package-secret-nursery-id",
    "package-secret-acl-id",
    "package-secret-backfill-id",
  ]) {
    assert.doesNotMatch(outputWithoutDigests, new RegExp(escapeRegExp(fragment)), `${fragment} leaked in package output`);
  }
  assert.doesNotMatch(outputWithoutDigests, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i);
  assert.doesNotMatch(outputWithoutDigests, /\b(?:\+?\d[\s().-]?){10,}\b/);
}

function readJson<T>(path: string) {
  const text = readFileSync(path, "utf8");
  assertNoSensitiveOutput(text);
  return JSON.parse(text) as T;
}

function ensureParentDir(path: string) {
  const dir = dirname(path);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function optionalFlag(name: string, enabled: boolean) {
  return enabled ? [name] : [];
}

function optionalArg(name: string, value: string | null | undefined) {
  return value ? [`${name}=${value}`] : [];
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
