import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const generatedAt = "2026-06-10T00:00:00.000Z";
const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-evidence-renderer-"));

try {
  const readinessPath = join(tmp, "readiness.json");
  const closeoutSummaryPath = join(tmp, "closeout-summary.json");
  const partialPath = join(tmp, "partials.json");
  const checklistPath = join(tmp, "checklist.json");
  const preflightManifestPath = join(tmp, "preflight.json");
  const recordPath = join(tmp, "production-acceptance-evidence.md");

  execFileSync("pnpm", ["tsx", "src/scripts/report-production-partials.ts", "--json", `--out=${partialPath}`, `--generated-at=${generatedAt}`], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  execFileSync("pnpm", ["tsx", "src/scripts/report-production-evidence-checklist.ts", "--json", `--out=${checklistPath}`, `--generated-at=${generatedAt}`], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  writeFileSync(readinessPath, `${JSON.stringify(readinessReport(), null, 2)}\n`, "utf8");
  writeFileSync(closeoutSummaryPath, `${JSON.stringify(closeoutSummary(), null, 2)}\n`, "utf8");
  writeFileSync(preflightManifestPath, `${JSON.stringify(preflightManifest(), null, 2)}\n`, "utf8");

  const output = execFileSync("pnpm", [
    "tsx",
    "src/scripts/render-production-acceptance-evidence-record.ts",
    `--out=${recordPath}`,
    `--readiness-report=${readinessPath}`,
    `--summary-report=${closeoutSummaryPath}`,
    `--partial-report=${partialPath}`,
    `--checklist-report=${checklistPath}`,
    `--preflight-manifest=${preflightManifestPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    "--acceptance-date=2026-06-10",
    "--environment=staging-production-import",
    "--legacy-source-package=release-ticket-verified",
    "--production-approver=release-ticket-verified",
    "--approval=release-ticket-verified",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.match(output, /production acceptance evidence record rendered/);

  const record = readFileSync(recordPath, "utf8");
  assert.match(record, /\| Acceptance date \| 2026-06-10 \|/);
  assert.match(record, /\| Modern branch\/commit \| `legacy-parity-runbook` \/ 0404c6a \|/);
  assert.match(record, new RegExp(`\\| Redacted readiness report SHA-256 \\| ${sha256File(readinessPath)} \\|`));
  assert.match(record, /\| Redacted closeout summary SHA-256 \| verified in evidence package manifest \|/);
  assert.match(record, new RegExp(`\\| Partial gate report SHA-256 \\| ${sha256File(partialPath)} \\|`));
  assert.match(record, new RegExp(`\\| Production evidence checklist SHA-256 \\| ${sha256File(checklistPath)} \\|`));
  assert.match(record, new RegExp(`\\| Production preflight manifest SHA-256 \\| ${sha256File(preflightManifestPath)} \\|`));

  const explicitSummaryDigestRecordPath = join(tmp, "explicit-summary-digest.md");
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/render-production-acceptance-evidence-record.ts",
    `--out=${explicitSummaryDigestRecordPath}`,
    `--readiness-report=${readinessPath}`,
    `--summary-report=${closeoutSummaryPath}`,
    `--partial-report=${partialPath}`,
    `--checklist-report=${checklistPath}`,
    `--preflight-manifest=${preflightManifestPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    "--acceptance-date=2026-06-10",
    `--summary-digest=${sha256File(closeoutSummaryPath)}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const explicitSummaryDigestRecord = readFileSync(explicitSummaryDigestRecordPath, "utf8");
  assert.match(
    explicitSummaryDigestRecord,
    new RegExp(`\\| Redacted closeout summary SHA-256 \\| ${sha256File(closeoutSummaryPath)} \\|`)
  );

  execFileSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-acceptance-evidence-record.ts",
    recordPath,
    `--readiness-report=${readinessPath}`,
    `--summary-report=${closeoutSummaryPath}`,
    `--partial-report=${partialPath}`,
    `--checklist-report=${checklistPath}`,
    `--preflight-manifest=${preflightManifestPath}`,
    `--readiness-digest=${sha256File(readinessPath)}`,
    `--partial-digest=${sha256File(partialPath)}`,
    `--checklist-digest=${sha256File(checklistPath)}`,
    `--preflight-digest=${sha256File(preflightManifestPath)}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });

  const invalidDate = spawnSync("pnpm", [
    "tsx",
    "src/scripts/render-production-acceptance-evidence-record.ts",
    `--out=${join(tmp, "bad.md")}`,
    `--readiness-report=${readinessPath}`,
    `--summary-report=${closeoutSummaryPath}`,
    `--partial-report=${partialPath}`,
    `--checklist-report=${checklistPath}`,
    `--preflight-manifest=${preflightManifestPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    "--acceptance-date=06-10-2026",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(invalidDate.status, 2);
  assert.match(invalidDate.stderr, /--acceptance-date must use YYYY-MM-DD/);

  const deferred = spawnSync("pnpm", [
    "tsx",
    "src/scripts/render-production-acceptance-evidence-record.ts",
    `--out=${join(tmp, "deferred.md")}`,
    `--readiness-report=${readinessPath}`,
    `--summary-report=${closeoutSummaryPath}`,
    `--partial-report=${partialPath}`,
    `--checklist-report=${checklistPath}`,
    `--preflight-manifest=${preflightManifestPath}`,
    "--branch=legacy-parity-runbook",
    "--commit=0404c6a",
    "--acceptance-date=2026-06-10",
    "--release-decision=deferred",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(deferred.status, 1);
  assert.match(deferred.stderr, /release decision must be accepted/);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("production acceptance evidence renderer contract assertions passed");

function readinessReport() {
  const gates = [
    "PROD-ACL",
    "PROD-BACKFILL",
    "PROD-CALLS",
    "PROD-CRON",
    "PROD-DUMPS",
    "PROD-MEDIA",
    "PROD-NATIVE",
    "PROD-NATURE",
    "PROD-NURSERY",
    "PROD-PRINT",
    "PROD-PROVIDERS",
    "PROD-RECON",
  ].map((gate) => ({
    gate,
    status: "ready-to-review",
    present: ["non-secret evidence pointer"],
    missing: [],
  }));

  return {
    schemaVersion: 1,
    generatedAt,
    redacted: true,
    summary: { ready: 12, needsEvidence: 0, total: 12 },
    gates,
    providers: [],
    note: "No environment values, URLs, tokens, keys, passwords, or report contents are included.",
  };
}

function closeoutSummary() {
  return {
    status: "production closeout verified",
    schemaVersion: 1,
    generatedAt,
    generatedFrom: {
      matrix: "docs/page-parity-matrix.json",
      gateMap: "docs/partial-production-gate-map.md",
    },
    redacted: true,
  };
}

function preflightManifest() {
  return {
    status: "production preflight artifacts verified",
    schemaVersion: 1,
    generatedAt,
    redacted: true,
    blockingGateSummary: {
      gates: 0,
      ready: 12,
      needsEvidence: 0,
      blockingPartialRows: 0,
      missingEvidenceItems: 0,
      gatesToClose: [],
    },
  };
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
