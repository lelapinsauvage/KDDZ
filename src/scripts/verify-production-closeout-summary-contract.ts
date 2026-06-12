import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

type DigestRecord = {
  algorithm?: string;
  digest?: string;
};

type CloseoutSummary = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
  };
  readinessReport?: string;
  evidenceRecord?: string;
  partialReport?: string | null;
  evidenceChecklist?: string | null;
  preflightManifest?: string | null;
  partialReportSummary?: PartialReportSummary | null;
  evidenceChecklistSummary?: EvidenceChecklistSummary | null;
  artifactDigests?: {
    readinessReport?: DigestRecord;
    evidenceRecord?: DigestRecord;
    partialReport?: DigestRecord;
    evidenceChecklist?: DigestRecord;
    preflightManifest?: DigestRecord;
  };
  artifactConsistency?: {
    status?: string;
    script?: string;
  } | null;
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

type PartialReportSummary = {
  partialRows?: number | null;
  gates?: string[];
  gateCounts?: Record<string, number>;
};

type EvidenceChecklistSummary = {
  gates?: number | null;
  requiredFields?: number | null;
  blockingPartialRows?: number | null;
};

type PartialReport = {
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
  };
  summary?: PartialReportSummary;
};

type EvidenceChecklist = {
  generatedFrom?: {
    partialGateMap?: string;
  };
  summary?: EvidenceChecklistSummary;
};

const summaryPath = positionalArg();

if (summaryPath) {
  verifyCloseoutSummary(summaryPath);
} else {
  verifySelfTestContract();
}

console.log("production closeout summary contract assertions passed");

function verifyCloseoutSummary(path: string) {
  const summaryText = readFileSync(path, "utf8");
  assertNoSensitiveOutput(summaryText);

  const summary = JSON.parse(summaryText) as CloseoutSummary;
  assert.equal(summary.status, "production closeout verified");
  assert.equal(summary.schemaVersion, 1, "production closeout summary schema version drifted");
  assertValidIsoTimestamp(summary.generatedAt, "closeout summary generatedAt");
  assertNonEmptyString(summary.generatedFrom?.matrix, "production closeout summary is missing source matrix path");
  assertNonEmptyString(summary.generatedFrom?.gateMap, "production closeout summary is missing source gate-map path");
  assert.equal(summary.redacted, true);
  assert.deepEqual(summary.readinessSummary, { ready: 12, needsEvidence: 0, total: 12 });
  const expectedBranch = optionValue("--branch");
  const expectedCommit = optionValue("--commit");
  const expectedParityTracker = parityTrackerSummary(summary.generatedFrom?.matrix ?? "docs/page-parity-matrix.json");
  if (process.argv.includes("--require-zero-partials")) {
    assert.ok(expectedBranch, "final production closeout summary requires --branch with --require-zero-partials");
    assert.ok(expectedCommit, "final production closeout summary requires --commit with --require-zero-partials");
    assert.equal(summary.requireZeroPartials, true, "production closeout summary must come from a require-zero-partials run");
    assert.deepEqual(summary.parityTracker, expectedParityTracker, "production closeout summary tracker drifted");
    assert.equal(summary.parityTracker?.partial, 0, "production closeout summary still has unresolved partial rows");
    assert.equal(summary.parityTracker?.donePct, 100, "production closeout summary is not fully complete");
    assert.equal(summary.parityTracker?.leftPct, 0, "production closeout summary still has work left");
    assert.equal(summary.partialReportSummary?.partialRows, 0, "production closeout partial report summary still has unresolved partial rows");
    assert.deepEqual(summary.partialReportSummary?.gates, [], "production closeout partial report summary still lists blocking gates");
    assert.deepEqual(summary.partialReportSummary?.gateCounts, {}, "production closeout partial report summary still has gate counts");
    assert.equal(
      summary.evidenceChecklistSummary?.blockingPartialRows,
      0,
      "production closeout evidence checklist summary still has blocking partial rows"
    );
  } else {
    assert.deepEqual(summary.parityTracker, expectedParityTracker);
  }
  if (expectedBranch) {
    assert.equal(summary.branch, expectedBranch, "production closeout summary branch drifted");
  }
  if (expectedCommit) {
    assert.equal(summary.commit, expectedCommit, "production closeout summary commit drifted");
  }

  const readinessReportPath = optionValue("--readiness-report") ?? summary.readinessReport;
  const evidenceRecordPath = optionValue("--evidence-record") ?? summary.evidenceRecord;
  const partialReportPath = optionValue("--partial-report") ?? summary.partialReport ?? null;
  const checklistReportPath = optionValue("--checklist-report") ?? summary.evidenceChecklist ?? null;
  const preflightManifestPath = optionValue("--preflight-manifest") ?? summary.preflightManifest ?? null;

  assert.ok(readinessReportPath, "closeout summary is missing readiness report path");
  assert.equal(summary.readinessReport, readinessReportPath);
  assertDigest(summary.artifactDigests?.readinessReport, readinessReportPath, "readiness report");
  assert.ok(evidenceRecordPath, "closeout summary is missing evidence record path");
  assert.equal(summary.evidenceRecord, evidenceRecordPath);
  assertDigest(summary.artifactDigests?.evidenceRecord, evidenceRecordPath, "evidence record");

  if (partialReportPath) {
    assert.equal(summary.partialReport, partialReportPath);
    assertDigest(summary.artifactDigests?.partialReport, partialReportPath, "partial report");
    const partialReport = readArtifact<PartialReport>(partialReportPath);
    assert.equal(partialReport.generatedFrom?.matrix, summary.generatedFrom.matrix, "partial report matrix source drifted");
    assert.equal(partialReport.generatedFrom?.gateMap, summary.generatedFrom.gateMap, "partial report gate-map source drifted");
    assert.deepEqual(summary.partialReportSummary, normalizePartialSummary(partialReport.summary));
  }

  if (checklistReportPath) {
    assert.equal(summary.evidenceChecklist, checklistReportPath);
    assertDigest(summary.artifactDigests?.evidenceChecklist, checklistReportPath, "evidence checklist");
    const checklist = readArtifact<EvidenceChecklist>(checklistReportPath);
    assert.equal(checklist.generatedFrom?.partialGateMap, summary.generatedFrom.gateMap, "evidence checklist gate-map source drifted");
    assert.deepEqual(summary.evidenceChecklistSummary, normalizeChecklistSummary(checklist.summary));
  }

  if (preflightManifestPath) {
    assert.equal(summary.preflightManifest, preflightManifestPath);
    assertDigest(summary.artifactDigests?.preflightManifest, preflightManifestPath, "preflight manifest");
  }

  if (partialReportPath && checklistReportPath) {
    assert.deepEqual(summary.artifactConsistency, {
      status: "verified",
      script: "src/scripts/verify-production-artifact-consistency-contract.ts",
    });
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/verify-production-artifact-consistency-contract.ts",
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
  }

  verifyEvidenceRecordAgainstSummary({
    evidenceRecordPath,
    readinessReportPath,
    closeoutSummaryPath: path,
    partialReportPath,
    checklistReportPath,
    preflightManifestPath,
    partialReportDigest: summary.artifactDigests?.partialReport?.digest,
    checklistReportDigest: summary.artifactDigests?.evidenceChecklist?.digest,
    preflightManifestDigest: summary.artifactDigests?.preflightManifest?.digest,
    branch: summary.branch,
    commit: summary.commit,
  });
}

function verifySelfTestContract() {
  const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-closeout-summary-"));
  const generatedAt = "2026-06-10T00:00:00.000Z";
  try {
    const envFilePath = join(tmp, "private-readiness.env");
    const evidenceRecordPath = join(tmp, "production-acceptance-evidence.md");
    const readinessReportPath = join(tmp, "readiness.json");
    const closeoutSummaryPath = join(tmp, "closeout-summary.json");
    const partialReportPath = join(tmp, "partials.json");
    const checklistReportPath = join(tmp, "evidence-checklist.json");
    const preflightManifestPath = join(tmp, "preflight-artifacts.json");
    const zeroParityMatrixPath = join(tmp, "zero-page-parity-matrix.json");
    const zeroPartialGateMapPath = join(tmp, "zero-partial-production-gate-map.md");
    const zeroEvidenceRecordPath = join(tmp, "zero-production-acceptance-evidence.md");
    const zeroReadinessReportPath = join(tmp, "zero-readiness.json");
    const zeroCloseoutSummaryPath = join(tmp, "zero-closeout-summary.json");
    const zeroPartialReportPath = join(tmp, "zero-partials.json");
    const zeroChecklistReportPath = join(tmp, "zero-evidence-checklist.json");
    const zeroPreflightManifestPath = join(tmp, "zero-preflight-artifacts.json");

    writeFileSync(envFilePath, readinessEnvFile(), "utf8");
    execFileSync("pnpm", ["tsx", "src/scripts/report-production-partials.ts", "--json", `--out=${partialReportPath}`, `--generated-at=${generatedAt}`], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    execFileSync("pnpm", ["tsx", "src/scripts/report-production-evidence-checklist.ts", "--json", `--out=${checklistReportPath}`, `--generated-at=${generatedAt}`], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    writeFileSync(preflightManifestPath, preflightManifest(partialReportPath, checklistReportPath, generatedAt), "utf8");
    writeFileSync(
      evidenceRecordPath,
      fillTemplate(readFileSync("docs/production-acceptance-evidence-template.md", "utf8"), {
        readinessReportPath,
        closeoutSummaryPath,
        partialReportPath,
        checklistReportPath,
        preflightManifestPath,
        readinessReportDigest: "verified in closeout summary artifact digests",
        partialReportDigest: sha256File(partialReportPath),
        checklistReportDigest: sha256File(checklistReportPath),
        preflightManifestDigest: sha256File(preflightManifestPath),
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
      `--preflight-manifest=${preflightManifestPath}`,
      "--branch=legacy-parity-runbook",
      "--commit=0404c6a",
      `--generated-at=${generatedAt}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });

    assertSuccessfulVerifier([
      closeoutSummaryPath,
      `--evidence-record=${evidenceRecordPath}`,
      `--readiness-report=${readinessReportPath}`,
      `--partial-report=${partialReportPath}`,
      `--checklist-report=${checklistReportPath}`,
      `--preflight-manifest=${preflightManifestPath}`,
    ]);
    const closeoutSummary = readJson<CloseoutSummary>(closeoutSummaryPath);
    assert.deepEqual(closeoutSummary.generatedFrom, {
      matrix: "docs/page-parity-matrix.json",
      gateMap: "docs/partial-production-gate-map.md",
    });
    assertFailingVerifier(
      [
        closeoutSummaryPath,
        `--evidence-record=${evidenceRecordPath}`,
        `--readiness-report=${readinessReportPath}`,
        `--partial-report=${partialReportPath}`,
        `--checklist-report=${checklistReportPath}`,
        `--preflight-manifest=${preflightManifestPath}`,
        "--require-zero-partials",
      ],
      /requires --branch/
    );
    assertFailingVerifier(
      [
        closeoutSummaryPath,
        `--evidence-record=${evidenceRecordPath}`,
        `--readiness-report=${readinessReportPath}`,
        `--partial-report=${partialReportPath}`,
        `--checklist-report=${checklistReportPath}`,
        `--preflight-manifest=${preflightManifestPath}`,
        "--branch=legacy-parity-runbook",
        "--commit=0404c6a",
        "--require-zero-partials",
      ],
      /must come from a require-zero-partials run/
    );

    writeFileSync(zeroParityMatrixPath, zeroPartialMatrixJson(), "utf8");
    writeFileSync(zeroPartialGateMapPath, zeroPartialGateMapMarkdown(), "utf8");
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/report-production-partials.ts",
      "--json",
      `--out=${zeroPartialReportPath}`,
      `--generated-at=${generatedAt}`,
      `--parity-matrix=${zeroParityMatrixPath}`,
      `--partial-gate-map=${zeroPartialGateMapPath}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/report-production-evidence-checklist.ts",
      "--json",
      `--out=${zeroChecklistReportPath}`,
      `--generated-at=${generatedAt}`,
      `--partial-gate-map=${zeroPartialGateMapPath}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    writeFileSync(zeroPreflightManifestPath, preflightManifest(zeroPartialReportPath, zeroChecklistReportPath, generatedAt), "utf8");
    writeFileSync(
      zeroEvidenceRecordPath,
      fillTemplate(readFileSync("docs/production-acceptance-evidence-template.md", "utf8"), {
        readinessReportPath: zeroReadinessReportPath,
        closeoutSummaryPath: zeroCloseoutSummaryPath,
        partialReportPath: zeroPartialReportPath,
        checklistReportPath: zeroChecklistReportPath,
        preflightManifestPath: zeroPreflightManifestPath,
        readinessReportDigest: "verified in closeout summary artifact digests",
        partialReportDigest: sha256File(zeroPartialReportPath),
        checklistReportDigest: sha256File(zeroChecklistReportPath),
        preflightManifestDigest: sha256File(zeroPreflightManifestPath),
      }),
      "utf8"
    );
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/run-production-closeout.ts",
      `--env-file=${envFilePath}`,
      `--evidence-record=${zeroEvidenceRecordPath}`,
      `--out=${zeroReadinessReportPath}`,
      `--summary-out=${zeroCloseoutSummaryPath}`,
      `--partials-out=${zeroPartialReportPath}`,
      `--checklist-out=${zeroChecklistReportPath}`,
      `--preflight-manifest=${zeroPreflightManifestPath}`,
      "--branch=legacy-parity-runbook",
      "--commit=0404c6a",
      `--generated-at=${generatedAt}`,
      `--parity-matrix=${zeroParityMatrixPath}`,
      `--partial-gate-map=${zeroPartialGateMapPath}`,
      "--require-zero-partials",
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    const zeroCloseoutSummary = readJson<CloseoutSummary>(zeroCloseoutSummaryPath);
    assert.deepEqual(zeroCloseoutSummary.generatedFrom, {
      matrix: zeroParityMatrixPath,
      gateMap: zeroPartialGateMapPath,
    });
    assertSuccessfulVerifier([
      zeroCloseoutSummaryPath,
      `--evidence-record=${zeroEvidenceRecordPath}`,
      `--readiness-report=${zeroReadinessReportPath}`,
      `--partial-report=${zeroPartialReportPath}`,
      `--checklist-report=${zeroChecklistReportPath}`,
      `--preflight-manifest=${zeroPreflightManifestPath}`,
      "--branch=legacy-parity-runbook",
      "--commit=0404c6a",
      "--require-zero-partials",
    ]);

    const staleFinalSummaryPath = join(tmp, "stale-final-summary.json");
    const staleFinalSummary = readJson<CloseoutSummary>(closeoutSummaryPath);
    staleFinalSummary.requireZeroPartials = true;
    staleFinalSummary.parityTracker = parityTrackerSummary(zeroParityMatrixPath);
    if (staleFinalSummary.generatedFrom) {
      staleFinalSummary.generatedFrom.matrix = zeroParityMatrixPath;
    }
    writeJson(staleFinalSummaryPath, staleFinalSummary);
    assertFailingVerifier(
      [
        staleFinalSummaryPath,
        `--evidence-record=${evidenceRecordPath}`,
        `--readiness-report=${readinessReportPath}`,
        `--partial-report=${partialReportPath}`,
        `--checklist-report=${checklistReportPath}`,
        "--branch=legacy-parity-runbook",
        "--commit=0404c6a",
        "--require-zero-partials",
      ],
      /partial report summary still has unresolved partial rows/
    );
    assertFailingVerifier(
      [
        closeoutSummaryPath,
        `--evidence-record=${evidenceRecordPath}`,
        `--readiness-report=${readinessReportPath}`,
        `--partial-report=${partialReportPath}`,
        `--checklist-report=${checklistReportPath}`,
        "--branch=legacy-parity-runbook",
        "--commit=deadbeef",
      ],
      /production closeout summary commit drifted/
    );

    const staleDigestPath = join(tmp, "stale-digest-summary.json");
    const staleDigestSummary = readJson<CloseoutSummary>(closeoutSummaryPath);
    if (staleDigestSummary.artifactDigests?.partialReport) {
      staleDigestSummary.artifactDigests.partialReport.digest = "0".repeat(64);
    }
    writeJson(staleDigestPath, staleDigestSummary);
    assertFailingVerifier(
      [staleDigestPath, `--partial-report=${partialReportPath}`],
      /partial report digest mismatch/
    );

    const staleEvidenceDigestPath = join(tmp, "stale-evidence-digest-summary.json");
    const staleEvidenceDigestSummary = readJson<CloseoutSummary>(closeoutSummaryPath);
    if (staleEvidenceDigestSummary.artifactDigests?.evidenceRecord) {
      staleEvidenceDigestSummary.artifactDigests.evidenceRecord.digest = "1".repeat(64);
    }
    writeJson(staleEvidenceDigestPath, staleEvidenceDigestSummary);
    assertFailingVerifier(
      [staleEvidenceDigestPath, `--evidence-record=${evidenceRecordPath}`],
      /evidence record digest mismatch/
    );

    const sourceMismatchPartialPath = join(tmp, "source-mismatch-partials.json");
    const sourceMismatchPartial = readJson<PartialReport>(partialReportPath);
    if (sourceMismatchPartial.generatedFrom) {
      sourceMismatchPartial.generatedFrom.gateMap = "docs/other-partial-production-gate-map.md";
    }
    writeJson(sourceMismatchPartialPath, sourceMismatchPartial);
    const sourceMismatchSummaryPath = join(tmp, "source-mismatch-summary.json");
    const sourceMismatchSummary = readJson<CloseoutSummary>(closeoutSummaryPath);
    sourceMismatchSummary.partialReport = sourceMismatchPartialPath;
    if (sourceMismatchSummary.artifactDigests?.partialReport) {
      sourceMismatchSummary.artifactDigests.partialReport.digest = sha256File(sourceMismatchPartialPath);
    }
    writeJson(sourceMismatchSummaryPath, sourceMismatchSummary);
    assertFailingVerifier(
      [
        sourceMismatchSummaryPath,
        `--evidence-record=${evidenceRecordPath}`,
        `--readiness-report=${readinessReportPath}`,
        `--partial-report=${sourceMismatchPartialPath}`,
        `--checklist-report=${checklistReportPath}`,
      ],
      /partial report gate-map source drifted/
    );

    const staleEvidenceRecordPath = join(tmp, "stale-production-acceptance-evidence.md");
    const staleEvidenceRecord = readFileSync(evidenceRecordPath, "utf8").replace(
      "legacy-parity-runbook` / 0404c6a",
      "legacy-parity-runbook` / deadbeef"
    );
    writeFileSync(staleEvidenceRecordPath, staleEvidenceRecord, "utf8");
    const staleEvidenceRecordSummaryPath = join(tmp, "stale-evidence-record-summary.json");
    const staleEvidenceRecordSummary = readJson<CloseoutSummary>(closeoutSummaryPath);
    staleEvidenceRecordSummary.evidenceRecord = staleEvidenceRecordPath;
    if (staleEvidenceRecordSummary.artifactDigests?.evidenceRecord) {
      staleEvidenceRecordSummary.artifactDigests.evidenceRecord.digest = sha256File(staleEvidenceRecordPath);
    }
    writeJson(staleEvidenceRecordSummaryPath, staleEvidenceRecordSummary);
    assertFailingVerifier(
      [
        staleEvidenceRecordSummaryPath,
        `--evidence-record=${staleEvidenceRecordPath}`,
        `--readiness-report=${readinessReportPath}`,
        `--partial-report=${partialReportPath}`,
        `--checklist-report=${checklistReportPath}`,
      ],
      /Modern branch\/commit must include commit 0404c6a/
    );

    const staleCountPath = join(tmp, "stale-count-summary.json");
    const staleCountSummary = readJson<CloseoutSummary>(closeoutSummaryPath);
    if (staleCountSummary.evidenceChecklistSummary) {
      staleCountSummary.evidenceChecklistSummary.blockingPartialRows = 16;
    }
    writeJson(staleCountPath, staleCountSummary);
    assertFailingVerifier(
      [staleCountPath, `--checklist-report=${checklistReportPath}`],
      /Expected values to be strictly deep-equal/
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function assertDigest(record: DigestRecord | undefined, path: string, label: string) {
  assert.equal(record?.algorithm, "sha256", `${label} digest algorithm must be sha256`);
  assert.equal(record?.digest, sha256File(path), `${label} digest mismatch`);
}

function assertNonEmptyString(value: unknown, message: string): asserts value is string {
  if (typeof value !== "string") {
    assert.fail(message);
  }
  assert.notEqual(value.trim(), "", message);
}

function verifyEvidenceRecordAgainstSummary(params: {
  evidenceRecordPath: string;
  readinessReportPath: string;
  closeoutSummaryPath: string;
  partialReportPath: string | null;
  checklistReportPath: string | null;
  preflightManifestPath: string | null;
  partialReportDigest?: string;
  checklistReportDigest?: string;
  preflightManifestDigest?: string;
  branch?: string;
  commit?: string;
}) {
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-acceptance-evidence-record.ts",
    params.evidenceRecordPath,
    `--readiness-report=${params.readinessReportPath}`,
    `--summary-report=${params.closeoutSummaryPath}`,
    ...optionalArg("--partial-report", params.partialReportPath),
    ...optionalArg("--checklist-report", params.checklistReportPath),
    ...optionalArg("--preflight-manifest", params.preflightManifestPath),
    ...optionalArg("--partial-digest", params.partialReportDigest),
    ...optionalArg("--checklist-digest", params.checklistReportDigest),
    ...optionalArg("--preflight-digest", params.preflightManifestDigest),
    ...optionalArg("--branch", params.branch),
    ...optionalArg("--commit", params.commit),
  ], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function readArtifact<T>(path: string) {
  const text = readFileSync(path, "utf8");
  assertNoSensitiveOutput(text);
  return JSON.parse(text) as T;
}

function normalizePartialSummary(summary: PartialReportSummary | undefined): PartialReportSummary {
  return {
    partialRows: summary?.partialRows ?? null,
    gates: summary?.gates ?? [],
    gateCounts: summary?.gateCounts ?? {},
  };
}

function normalizeChecklistSummary(summary: EvidenceChecklistSummary | undefined): EvidenceChecklistSummary {
  return {
    gates: summary?.gates ?? null,
    requiredFields: summary?.requiredFields ?? null,
    blockingPartialRows: summary?.blockingPartialRows ?? null,
  };
}

function parityTrackerSummary(path: string) {
  const matrix = JSON.parse(readFileSync(path, "utf8")) as unknown;
  let total = 0;
  let partial = 0;

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }

    const row = value as { status?: unknown };
    if (typeof row.status === "string") {
      total += 1;
      if (row.status.toLowerCase().startsWith("partial")) {
        partial += 1;
      }
    }
    Object.values(row).forEach(walk);
  }

  walk(matrix);
  const complete = total - partial;
  const donePct = Math.round((complete / total) * 1000) / 10;
  const leftPct = Math.round((100 - donePct) * 10) / 10;
  return { total, complete, partial, donePct, leftPct };
}

function assertSuccessfulVerifier(args: string[]) {
  const result = runVerifier(args);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assertNoSensitiveOutput(result.stdout + result.stderr);
}

function assertFailingVerifier(args: string[], pattern: RegExp) {
  const result = runVerifier(args);
  assert.equal(result.status, 1);
  assert.match(result.stderr, pattern);
  assertNoSensitiveOutput(result.stdout + result.stderr);
}

function runVerifier(args: string[]): CommandResult {
  const result = spawnSync("pnpm", ["tsx", "src/scripts/verify-production-closeout-summary-contract.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function zeroPartialMatrixJson() {
  const matrix = JSON.parse(readFileSync("docs/page-parity-matrix.json", "utf8")) as unknown;

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }

    const row = value as { status?: unknown };
    if (typeof row.status === "string" && row.status.toLowerCase().startsWith("partial")) {
      row.status = "complete - production evidence accepted for zero-partial closeout summary contract";
    }
    Object.values(value).forEach(walk);
  }

  walk(matrix);
  return `${JSON.stringify(matrix, null, 2)}\n`;
}

function zeroPartialGateMapMarkdown() {
  return [
    "# Partial Production Gate Map",
    "",
    "| Row | Status anchor | Gates | Closure reason |",
    "| --- | --- | --- | --- |",
    "",
  ].join("\n");
}

function preflightManifest(partialReportPath: string, checklistReportPath: string, generatedAt: string) {
  const blockingGateSummary = buildBlockingGateSummary(partialReportPath, generatedAt);
  return `${JSON.stringify(
    {
      status: "production preflight artifacts verified",
      schemaVersion: 1,
      generatedAt,
      generatedFrom: {
        matrix: "docs/page-parity-matrix.json",
        gateMap: "docs/partial-production-gate-map.md",
      },
      artifacts: {
        partialReport: {
          path: partialReportPath,
          sha256: sha256File(partialReportPath),
        },
        evidenceChecklist: {
          path: checklistReportPath,
          sha256: sha256File(checklistReportPath),
        },
      },
      blockingGateSummary,
      redacted: true,
    },
    null,
    2
  )}\n`;
}

function buildBlockingGateSummary(partialReportPath: string, generatedAt: string) {
  const partialReport = readJson<{
    generatedFrom?: { matrix?: string; gateMap?: string };
  }>(partialReportPath);
  const status = JSON.parse(
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/report-production-gate-status.ts",
      "--json",
      "--blocking-only",
      `--generated-at=${generatedAt}`,
      ...optionalArg("--parity-matrix", partialReport.generatedFrom?.matrix),
      ...optionalArg("--partial-gate-map", partialReport.generatedFrom?.gateMap),
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
    })
  ) as {
    summary?: {
      gates?: number;
      ready?: number;
      needsEvidence?: number;
      blockingPartialRows?: number;
      missingEvidenceItems?: number;
    };
    gates?: Array<{ gate?: string }>;
  };

  return {
    gates: status.summary?.gates ?? 0,
    ready: status.summary?.ready ?? 0,
    needsEvidence: status.summary?.needsEvidence ?? 0,
    blockingPartialRows: status.summary?.blockingPartialRows ?? 0,
    missingEvidenceItems: status.summary?.missingEvidenceItems ?? 0,
    gatesToClose: (status.gates ?? []).map((gate) => gate.gate).filter((gate): gate is string => Boolean(gate)),
  };
}

function readinessEnvFile() {
  return [
    "PUSH_DELIVERY_PROVIDER=webhook",
    "PUSH_DELIVERY_WEBHOOK_URL=https://example.invalid/summary-push-secret",
    "EMAIL_DELIVERY_PROVIDER=resend",
    "RESEND_API_KEY=re_summary_secret_should_not_print",
    "EMAIL_FROM=noreply@example.invalid",
    "SMS_DELIVERY_PROVIDER=webhook",
    "SMS_DELIVERY_WEBHOOK_URL=https://example.invalid/summary-sms-secret",
    "WHATSAPP_DELIVERY_PROVIDER=webhook",
    "WHATSAPP_DELIVERY_WEBHOOK_URL=https://example.invalid/summary-whatsapp-secret",
    "PROVIDER_DELIVERY_ACCEPTANCE_REPORT=summary-secret-provider-delivery-id",
    "PROVIDER_CHANNEL_ROLLOUT_REPORT=summary-secret-provider-rollout-id",
    "PROVIDER_RESPONSE_ID_AUDIT_REPORT=summary-secret-provider-response-id-audit-id",
    "PROVIDER_CHANNEL_DECISION_REPORT=summary-secret-provider-decision-id",
    "PROVIDER_PARTIAL_ROW_COVERAGE_REPORT=summary-secret-provider-partial-row-coverage-id",
    "CRON_SECRET=summary_cron_secret_should_not_print",
    "LEGACY_PRODUCTION_DUMP_MANIFEST=summary-secret-dump-id",
    "LEGACY_SCHOOL_YEAR_DUMP_COVERAGE_REPORT=summary-secret-school-year-dump-coverage-id",
    "LEGACY_DUMP_CHECKSUM_MANIFEST=summary-secret-dump-checksum-id",
    "LEGACY_FIRST_MIGRATION_SOURCE_REPORT=summary-secret-first-migration-source-id",
    "LEGACY_MEDIA_AUDIT_REPORT=summary-secret-media-audit-id",
    "LEGACY_MEDIA_EXPORT_MANIFEST=summary-secret-media-export-id",
    "LEGACY_MEDIA_UPLOAD_MANIFEST=summary-secret-media-upload-id",
    "LEGACY_MEDIA_STORAGE_INTEGRITY_REPORT=summary-secret-media-storage-integrity-id",
    "LEGACY_MEDIA_MISSING_FILE_TRIAGE_REPORT=summary-secret-media-missing-file-triage-id",
    "LEGACY_MEDIA_URL_APPLY_MANIFEST=summary-secret-media-url-apply-id",
    "MIGRATION_RECONCILIATION_REPORT=summary-secret-reconciliation-id",
    "MIGRATION_RECONCILIATION_MISMATCH_TRIAGE_REPORT=summary-secret-reconciliation-mismatch-triage-id",
    "MIGRATION_RECONCILIATION_ACCEPTANCE_REPORT=summary-secret-reconciliation-acceptance-id",
    "PRODUCTION_CRONTAB_EVIDENCE=summary-secret-crontab-id",
    "CRON_HELPER_DECISION_REPORT=summary-secret-cron-helper-decision-id",
    "CRON_SCHEDULE_COVERAGE_REPORT=summary-secret-cron-schedule-coverage-id",
    "HOSTED_DAILY_SCHEDULE_EVIDENCE=summary-secret-hosted-daily-schedule-id",
    "HOSTED_TEN_MINUTE_SCHEDULE_EVIDENCE=summary-secret-hosted-ten-minute-schedule-id",
    "HOSTED_SCHEDULER_EVIDENCE=summary-secret-scheduler-id",
    "CRON_PARTIAL_ROW_COVERAGE_REPORT=summary-secret-cron-partial-row-coverage-id",
    "NATIVE_IOS_ACCEPTANCE_REPORT=summary-secret-ios-id",
    "NATIVE_ANDROID_ACCEPTANCE_REPORT=summary-secret-android-id",
    "NATIVE_LEGACY_ROUTE_ACCEPTANCE_REPORT=summary-secret-native-route-id",
    "NATIVE_CRASH_PARSER_AUDIT_REPORT=summary-secret-native-crash-parser-id",
    "NATIVE_PARENT_FLOW_ACCEPTANCE_REPORT=summary-secret-native-parent-flow-id",
    "NATIVE_NOTIFICATIONS_MESSAGES_ALARMS_REPORT=summary-secret-native-notifications-messages-alarms-id",
    "NATIVE_PUSH_TOKEN_ACCEPTANCE_REPORT=summary-secret-native-push-token-id",
    "NATIVE_PARTIAL_ROW_COVERAGE_REPORT=summary-secret-native-partial-row-coverage-id",
    "NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT=summary-secret-nature-id",
    "NOTIFICATIONS_NATURE_GROUP_COMPARISON_REPORT=summary-secret-nature-group-comparison-id",
    "NOTIFICATIONS_NATURE_PARTIAL_ROW_COVERAGE_REPORT=summary-secret-nature-partial-row-coverage-id",
    "PRINT_ACCOUNTING_MATRIX_ACCEPTANCE_REPORT=summary-secret-print-accounting-matrix-id",
    "PRINT_INVOICE_RECEIPT_ACCEPTANCE_REPORT=summary-secret-print-invoice-receipt-id",
    "PRINT_STATIONERY_ACCEPTANCE_REPORT=summary-secret-print-id",
    "REAL_CALL_ROWS_ACCEPTANCE_REPORT=summary-secret-calls-id",
    "CALL_SUBMITTED_DRAFT_ACCEPTANCE_REPORT=summary-secret-call-submitted-draft-id",
    "CALL_PHP_BRIDGE_ACCEPTANCE_REPORT=summary-secret-call-php-bridge-id",
    "NURSERY_COMPLIANCE_ACCEPTANCE_REPORT=summary-secret-nursery-id",
    "NURSERY_BRANCH_BRIDGE_ACCEPTANCE_REPORT=summary-secret-nursery-branch-bridge-id",
    "NURSERY_DOCUMENT_UPLOAD_ACCEPTANCE_REPORT=summary-secret-nursery-document-upload-id",
    "LEGACY_ACL_ACCEPTANCE_REPORT=summary-secret-acl-id",
    "LEGACY_PAGE_GUARD_ACCEPTANCE_REPORT=summary-secret-legacy-page-guard-id",
    "LEGACY_ACTION_GUARD_ACCEPTANCE_REPORT=summary-secret-legacy-action-guard-id",
    "LEGACY_BACKFILL_ACCEPTANCE_REPORT=summary-secret-backfill-id",
    "LEGACY_BACKFILL_RERUN_REPORT=summary-secret-backfill-rerun-id",
    "LEGACY_BACKFILL_TICKET_TRIAGE_REPORT=summary-secret-backfill-ticket-triage-id",
    "",
  ].join("\n");
}

type ArtifactPaths = {
  readinessReportPath: string;
  closeoutSummaryPath: string;
  partialReportPath: string;
  checklistReportPath: string;
  preflightManifestPath: string;
  readinessReportDigest: string;
  partialReportDigest: string;
  checklistReportDigest: string;
  preflightManifestDigest: string;
};

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

function filledValueFor(field: string, artifactPaths: ArtifactPaths) {
  if (field === "Acceptance date") return "2026-06-10";
  if (field === "Environment") return "staging-production-import";
  if (field === "Modern branch/commit") return "`legacy-parity-runbook` / 0404c6a";
  if (field === "`audit-production-readiness.ts` result") return "12/12 ready";
  if (field === "Redacted readiness report") return artifactPaths.readinessReportPath;
  if (field === "Redacted readiness report SHA-256") return artifactPaths.readinessReportDigest;
  if (field === "Redacted closeout summary") return artifactPaths.closeoutSummaryPath;
  if (field === "Redacted closeout summary SHA-256") return "verified in evidence package manifest";
  if (field === "Partial gate report") return artifactPaths.partialReportPath;
  if (field === "Partial gate report SHA-256") return artifactPaths.partialReportDigest;
  if (field === "Production evidence checklist") return artifactPaths.checklistReportPath;
  if (field === "Production evidence checklist SHA-256") return artifactPaths.checklistReportDigest;
  if (field === "Production preflight manifest") return artifactPaths.preflightManifestPath;
  if (field === "Production preflight manifest SHA-256") return artifactPaths.preflightManifestDigest;
  if (field === "Release decision") return "accepted";
  if (field === "Remaining production tickets") return "none";
  if (field === "Approval link/id") return "release-ticket-verified";
  return "accepted evidence recorded in release-ticket-verified";
}

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
  for (const fragment of [
    "https://example.invalid",
    "secret_should_not_print",
    "summary-secret-dump-id",
    "summary-secret-school-year-dump-coverage-id",
    "summary-secret-dump-checksum-id",
    "summary-secret-first-migration-source-id",
    "summary-secret-media-audit-id",
    "summary-secret-media-export-id",
    "summary-secret-media-upload-id",
    "summary-secret-media-storage-integrity-id",
    "summary-secret-media-missing-file-triage-id",
    "summary-secret-media-url-apply-id",
    "summary-secret-provider-delivery-id",
    "summary-secret-provider-rollout-id",
    "summary-secret-provider-response-id-audit-id",
    "summary-secret-provider-decision-id",
    "summary-secret-provider-partial-row-coverage-id",
    "summary-secret-reconciliation-id",
    "summary-secret-reconciliation-mismatch-triage-id",
    "summary-secret-reconciliation-acceptance-id",
    "summary-secret-crontab-id",
    "summary-secret-cron-helper-decision-id",
    "summary-secret-cron-schedule-coverage-id",
    "summary-secret-hosted-daily-schedule-id",
    "summary-secret-hosted-ten-minute-schedule-id",
    "summary-secret-scheduler-id",
    "summary-secret-cron-partial-row-coverage-id",
    "summary-secret-ios-id",
    "summary-secret-android-id",
    "summary-secret-native-route-id",
    "summary-secret-native-crash-parser-id",
    "summary-secret-native-parent-flow-id",
    "summary-secret-native-notifications-messages-alarms-id",
    "summary-secret-native-push-token-id",
    "summary-secret-native-partial-row-coverage-id",
    "summary-secret-nature-id",
    "summary-secret-nature-group-comparison-id",
    "summary-secret-nature-partial-row-coverage-id",
    "summary-secret-print-accounting-matrix-id",
    "summary-secret-print-invoice-receipt-id",
    "summary-secret-print-id",
    "summary-secret-calls-id",
    "summary-secret-call-submitted-draft-id",
    "summary-secret-call-php-bridge-id",
    "summary-secret-nursery-id",
    "summary-secret-nursery-branch-bridge-id",
    "summary-secret-nursery-document-upload-id",
    "summary-secret-acl-id",
    "summary-secret-legacy-page-guard-id",
    "summary-secret-legacy-action-guard-id",
    "summary-secret-backfill-id",
    "summary-secret-backfill-rerun-id",
    "summary-secret-backfill-ticket-triage-id",
  ]) {
    assert.doesNotMatch(outputWithoutDigests, new RegExp(escapeRegExp(fragment)), `${fragment} leaked in closeout summary output`);
  }
  assert.doesNotMatch(outputWithoutDigests, /(api[_-]?key|secret|token)\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i);
  assert.doesNotMatch(outputWithoutDigests, /\b(?:\+?\d[\s().-]?){10,}\b/);
}

function assertValidIsoTimestamp(value: string | undefined, label: string) {
  assert.ok(value, `${label} is missing`);
  assert.equal(new Date(value).toISOString(), value, `${label} must be an ISO timestamp`);
}

function positionalArg() {
  return process.argv.find((arg, index) => index > 1 && !arg.startsWith("--")) ?? null;
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
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
