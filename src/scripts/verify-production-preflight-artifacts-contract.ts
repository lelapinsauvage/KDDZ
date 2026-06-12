import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type ArtifactRef = {
  path?: string;
  algorithm?: string;
  digest?: string;
};

type GeneratedArtifact = {
  generatedAt?: string;
};

type PartialReport = GeneratedArtifact & {
  summary?: {
    partialRows?: number;
    gateCounts?: Record<string, number>;
  };
};

type EvidenceChecklist = GeneratedArtifact & {
  generatedFrom?: {
    productionGates?: string;
  };
  summary?: {
    blockingPartialRows?: number;
  };
};

type PreflightManifest = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
    evidenceSpec?: string;
    evidenceTemplate?: string;
  };
  artifacts?: {
    partialReport?: ArtifactRef;
    evidenceChecklist?: ArtifactRef;
    blockingGateStatus?: ArtifactRef;
    focusedArtifactsManifest?: ArtifactRef;
    closeoutPlan?: ArtifactRef;
  };
  blockingGateSummary?: BlockingGateSummary;
  verifiedBy?: string[];
  redacted?: boolean;
};

type BlockingGateSummary = {
  gates?: number;
  ready?: number;
  needsEvidence?: number;
  blockingPartialRows?: number;
  blockingGateLinks?: number;
  missingEvidenceItems?: number;
  closeoutMode?: string;
  canCloseLocally?: boolean;
  gatesToClose?: Array<{
    gate?: string;
    blockingPartialRows?: number;
    blockingGateLinks?: number;
    missingEvidenceItems?: number;
    nextActions?: string[];
  }>;
};

type GateStatusReport = {
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
  };
  sourceAlignment?: {
    status?: string;
    generatedAt?: string;
    readinessGeneratedAt?: string;
    partialReportGeneratedAt?: string;
    evidenceChecklistGeneratedAt?: string;
    partialReportRows?: number;
    checklistBlockingRows?: number;
    gateCounts?: Record<string, number>;
  };
  summary?: {
    gates?: number;
    ready?: number;
    needsEvidence?: number;
    blockingPartialRows?: number;
    blockingGateLinks?: number;
    missingEvidenceItems?: number;
    closeoutMode?: string;
    canCloseLocally?: boolean;
  };
  gates?: Array<{ gate?: string; missingEvidence?: unknown[]; blockingGateLinks?: number; blockingPartialRows?: unknown[]; nextActions?: string[] }>;
};

type FocusedManifest = {
  status?: string;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
  };
};

type CloseoutPlan = {
  status?: string;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
  };
  summary?: {
    gates?: number;
    ready?: number;
    needsEvidence?: number;
    blockingPartialRows?: number;
    blockingGateLinks?: number;
    missingEvidenceItems?: number;
    closeoutMode?: string;
    canCloseLocally?: boolean;
    requiredGateOrder?: string[];
  };
  sourceAlignment?: {
    status?: string;
  };
  gates?: Array<{
    gate?: string;
    blockingRows?: string[];
    focusedArtifactCommands?: string[];
    evidenceWorkOrder?: {
      externalDependency?: string;
      finishCondition?: string;
      evidencePointers?: string[];
      acceptanceCriteria?: string[];
      focusedCoverageRows?: string[];
      proofCommands?: string[];
    };
  }>;
  finalCloseoutCommands?: string[];
};

const generatedAt = "2026-06-10T00:00:00.000Z";
const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-preflight-artifacts-"));

try {
  const bundleDir = join(tmp, "bundle");
  const output = execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-preflight-artifacts.ts",
    `--out-dir=${bundleDir}`,
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const manifest = JSON.parse(output) as PreflightManifest;
  assert.deepEqual(
    JSON.parse(readFileSync(join(bundleDir, "kiddzonl-production-preflight-artifacts.json"), "utf8")),
    manifest
  );
  assert.equal(manifest.status, "production preflight artifacts verified");
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.generatedAt, generatedAt);
  assert.equal(manifest.redacted, true);
  assert.equal(manifest.generatedFrom?.matrix, "docs/page-parity-matrix.json");
  assert.equal(manifest.generatedFrom?.gateMap, "docs/partial-production-gate-map.md");
  assert.equal(manifest.generatedFrom?.productionGates, "docs/legacy-production-acceptance-gates.md");
  assert.equal(manifest.generatedFrom?.evidenceSpec, "src/scripts/production-acceptance-evidence-spec.ts");
  assert.equal(manifest.generatedFrom?.evidenceTemplate, "docs/production-acceptance-evidence-template.md");
  assert.deepEqual(manifest.verifiedBy, [
    "src/scripts/verify-production-artifact-consistency-contract.ts",
    "src/scripts/verify-production-focused-artifacts-manifest.ts",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
  ]);

  verifyArtifactRef("partial report", manifest.artifacts?.partialReport);
  verifyArtifactRef("evidence checklist", manifest.artifacts?.evidenceChecklist);
  verifyArtifactRef("blocking gate status", manifest.artifacts?.blockingGateStatus);
  verifyArtifactRef("focused artifacts manifest", manifest.artifacts?.focusedArtifactsManifest);
  verifyArtifactRef("closeout plan", manifest.artifacts?.closeoutPlan);

  const partial = readJson<PartialReport>(manifest.artifacts?.partialReport?.path ?? "");
  const checklist = readJson<EvidenceChecklist>(manifest.artifacts?.evidenceChecklist?.path ?? "");
  assert.equal(partial.generatedAt, manifest.generatedAt);
  assert.equal(checklist.generatedAt, manifest.generatedAt);
  assert.equal(checklist.generatedFrom?.productionGates, manifest.generatedFrom?.productionGates);

  execFileSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-artifact-consistency-contract.ts",
    `--partial-report=${manifest.artifacts?.partialReport?.path}`,
    `--checklist-report=${manifest.artifacts?.evidenceChecklist?.path}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-focused-artifacts-manifest.ts",
    `--manifest=${manifest.artifacts?.focusedArtifactsManifest?.path}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${join(bundleDir, "kiddzonl-production-preflight-artifacts.json")}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });

  const blocking = readJson<GateStatusReport>(manifest.artifacts?.blockingGateStatus?.path ?? "");
  assert.equal(blocking.generatedAt, manifest.generatedAt);
  assert.equal(blocking.generatedFrom?.matrix, manifest.generatedFrom?.matrix);
  assert.equal(blocking.generatedFrom?.gateMap, manifest.generatedFrom?.gateMap);
  assert.equal(blocking.generatedFrom?.productionGates, manifest.generatedFrom?.productionGates);
  const expectedGateCounts = partial.summary?.gateCounts ?? {};
  assert.deepEqual(blocking.sourceAlignment, {
    status: "verified",
    generatedAt,
    readinessGeneratedAt: generatedAt,
    partialReportGeneratedAt: generatedAt,
    evidenceChecklistGeneratedAt: generatedAt,
    partialReportRows: partial.summary?.partialRows ?? 0,
    checklistBlockingRows: checklist.summary?.blockingPartialRows ?? 0,
    gateCounts: expectedGateCounts,
  });
  assert.deepEqual(gateCounts(blocking.gates ?? []), expectedGateCounts);
  assert.deepEqual(gateLinkCounts(blocking.gates ?? []), expectedGateCounts);
  assert.deepEqual(blocking.gates?.map((gate) => gate.gate), Object.keys(expectedGateCounts));
  assert.equal(blocking.summary?.gates, Object.keys(expectedGateCounts).length);
  assert.equal(blocking.summary?.ready, 0);
  assert.equal(blocking.summary?.needsEvidence, Object.keys(expectedGateCounts).length);
  assert.equal(blocking.summary?.blockingPartialRows, partial.summary?.partialRows);
  assert.equal(blocking.summary?.blockingGateLinks, sumValues(expectedGateCounts));
  assert.equal(blocking.summary?.closeoutMode, "external-production-evidence");
  assert.equal(blocking.summary?.canCloseLocally, false);
  assert.ok((blocking.summary?.missingEvidenceItems ?? 0) > 0);
  assert.ok(blocking.gates?.every((gate) => (gate.blockingPartialRows?.length ?? 0) > 0));
  assert.deepEqual(manifest.blockingGateSummary, blockingGateSummary(blocking));
  assert.deepEqual(
    Object.fromEntries((manifest.blockingGateSummary?.gatesToClose ?? []).map((gate) => [gate.gate, gate.blockingGateLinks])),
    expectedGateCounts
  );
  assert.ok(manifest.blockingGateSummary?.gatesToClose?.every((gate) => (gate.nextActions?.length ?? 0) > 0));
  const focused = readJson<FocusedManifest>(manifest.artifacts?.focusedArtifactsManifest?.path ?? "");
  assert.equal(focused.generatedAt, manifest.generatedAt);
  assert.equal(focused.generatedFrom?.matrix, manifest.generatedFrom?.matrix);
  assert.equal(focused.generatedFrom?.gateMap, manifest.generatedFrom?.gateMap);
  assert.equal(focused.generatedFrom?.productionGates, manifest.generatedFrom?.productionGates);
  const closeoutPlan = readJson<CloseoutPlan>(manifest.artifacts?.closeoutPlan?.path ?? "");
  assert.equal(closeoutPlan.status, "production closeout plan");
  assert.equal(closeoutPlan.generatedAt, manifest.generatedAt);
  assert.equal(closeoutPlan.generatedFrom?.matrix, manifest.generatedFrom?.matrix);
  assert.equal(closeoutPlan.generatedFrom?.gateMap, manifest.generatedFrom?.gateMap);
  assert.equal(closeoutPlan.generatedFrom?.productionGates, manifest.generatedFrom?.productionGates);
  assert.equal(closeoutPlan.sourceAlignment?.status, "verified");
  assert.equal(closeoutPlan.summary?.blockingPartialRows, manifest.blockingGateSummary?.blockingPartialRows);
  assert.equal(closeoutPlan.summary?.blockingGateLinks, manifest.blockingGateSummary?.blockingGateLinks);
  assert.equal(closeoutPlan.summary?.closeoutMode, manifest.blockingGateSummary?.closeoutMode);
  assert.equal(closeoutPlan.summary?.canCloseLocally, manifest.blockingGateSummary?.canCloseLocally);
  assert.deepEqual(closeoutPlan.summary?.requiredGateOrder, ["PROD-CRON", "PROD-PROVIDERS", "PROD-NATIVE", "PROD-NATURE"]);
  assert.deepEqual(
    Object.fromEntries((closeoutPlan.gates ?? []).map((gate) => [gate.gate, gate.blockingRows?.length ?? 0]).sort(([a], [b]) => String(a).localeCompare(String(b)))),
    expectedGateCounts
  );
  assert.ok(closeoutPlan.gates?.every((gate) => gate.evidenceWorkOrder?.externalDependency === "production evidence"));
  assert.ok(closeoutPlan.gates?.every((gate) => gate.evidenceWorkOrder?.proofCommands?.some((command) => command.includes(`--gate=${gate.gate}`))));
  assert.ok(closeoutPlan.finalCloseoutCommands?.some((command) => command.includes("verify-production-preflight-artifacts-manifest.ts")));
  assert.ok(closeoutPlan.finalCloseoutCommands?.some((command) => command.includes("--manifest=/tmp/kiddzonl-production-evidence-package.json")));

  const missingOutDir = spawnSync("pnpm", ["tsx", "src/scripts/report-production-preflight-artifacts.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(missingOutDir.status, 2);
  assert.match(missingOutDir.stderr, /--out-dir=<dir>/);

  const invalidGeneratedAt = spawnSync("pnpm", [
    "tsx",
    "src/scripts/report-production-preflight-artifacts.ts",
    `--out-dir=${join(tmp, "invalid")}`,
    "--generated-at=not-a-date",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(invalidGeneratedAt.status, 2);
  assert.match(invalidGeneratedAt.stderr, /--generated-at must be an ISO timestamp/);

  const staleManifestPath = join(tmp, "stale-preflight-artifacts.json");
  const staleManifest = JSON.parse(JSON.stringify(manifest)) as PreflightManifest;
  assert.ok(staleManifest.artifacts?.partialReport);
  staleManifest.artifacts.partialReport.digest = "0".repeat(64);
  writeFileSync(staleManifestPath, `${JSON.stringify(staleManifest, null, 2)}\n`, "utf8");
  const stale = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${staleManifestPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /digest drifted/);

  const archiveMatrixPath = join(tmp, "archived-page-parity-matrix.json");
  const archiveGateMapPath = join(tmp, "archived-partial-production-gate-map.md");
  const archiveProductionGatesPath = join(tmp, "archived-legacy-production-acceptance-gates.md");
  const archiveBundleDir = join(tmp, "archive-bundle");
  copyFileSync("docs/page-parity-matrix.json", archiveMatrixPath);
  copyFileSync("docs/partial-production-gate-map.md", archiveGateMapPath);
  copyFileSync("docs/legacy-production-acceptance-gates.md", archiveProductionGatesPath);

  const archiveOutput = execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-preflight-artifacts.ts",
    `--out-dir=${archiveBundleDir}`,
    `--generated-at=${generatedAt}`,
    `--parity-matrix=${archiveMatrixPath}`,
    `--partial-gate-map=${archiveGateMapPath}`,
    `--production-gates=${archiveProductionGatesPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const archiveManifest = JSON.parse(archiveOutput) as PreflightManifest;
  assert.equal(archiveManifest.generatedFrom?.matrix, archiveMatrixPath);
  assert.equal(archiveManifest.generatedFrom?.gateMap, archiveGateMapPath);
  assert.equal(archiveManifest.generatedFrom?.productionGates, archiveProductionGatesPath);
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${join(archiveBundleDir, "kiddzonl-production-preflight-artifacts.json")}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });

  const mismatchedFocusedManifestPath = archiveManifest.artifacts?.focusedArtifactsManifest?.path;
  assert.ok(mismatchedFocusedManifestPath);
  assert.ok(archiveManifest.artifacts?.focusedArtifactsManifest);
  const mismatchedFocusedManifest = readJson<FocusedManifest>(mismatchedFocusedManifestPath);
  assert.ok(mismatchedFocusedManifest.generatedFrom);
  mismatchedFocusedManifest.generatedFrom.matrix = "docs/page-parity-matrix.json";
  writeFileSync(mismatchedFocusedManifestPath, `${JSON.stringify(mismatchedFocusedManifest, null, 2)}\n`, "utf8");
  archiveManifest.artifacts.focusedArtifactsManifest.digest = sha256File(mismatchedFocusedManifestPath);
  const sourceMismatchManifestPath = join(tmp, "source-mismatch-preflight-artifacts.json");
  writeFileSync(sourceMismatchManifestPath, `${JSON.stringify(archiveManifest, null, 2)}\n`, "utf8");
  const sourceMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${sourceMismatchManifestPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(sourceMismatch.status, 1);
  assert.match(sourceMismatch.stderr, /verify-production-focused-artifacts-manifest\.ts/);

  const blockingSummaryMismatchManifest = JSON.parse(JSON.stringify(manifest)) as PreflightManifest;
  assert.ok(blockingSummaryMismatchManifest.blockingGateSummary);
  blockingSummaryMismatchManifest.blockingGateSummary.blockingPartialRows = 999;
  const blockingSummaryMismatchPath = join(tmp, "blocking-summary-mismatch-preflight-artifacts.json");
  writeFileSync(blockingSummaryMismatchPath, `${JSON.stringify(blockingSummaryMismatchManifest, null, 2)}\n`, "utf8");
  const blockingSummaryMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${blockingSummaryMismatchPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(blockingSummaryMismatch.status, 1);
  assert.match(blockingSummaryMismatch.stderr, /blockingPartialRows: 999/);

  const gateLinkMismatchManifest = JSON.parse(JSON.stringify(manifest)) as PreflightManifest;
  assert.ok(gateLinkMismatchManifest.blockingGateSummary?.gatesToClose?.[0]);
  gateLinkMismatchManifest.blockingGateSummary.gatesToClose[0].blockingGateLinks = 999;
  const gateLinkMismatchPath = join(tmp, "gate-link-mismatch-preflight-artifacts.json");
  writeFileSync(gateLinkMismatchPath, `${JSON.stringify(gateLinkMismatchManifest, null, 2)}\n`, "utf8");
  const gateLinkMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${gateLinkMismatchPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(gateLinkMismatch.status, 1);
  assert.match(gateLinkMismatch.stderr, /blockingGateLinks: 999/);

  const workOrderMismatchManifest = JSON.parse(JSON.stringify(manifest)) as PreflightManifest;
  const workOrderMismatchPlanPath = workOrderMismatchManifest.artifacts?.closeoutPlan?.path;
  assert.ok(workOrderMismatchPlanPath);
  assert.ok(workOrderMismatchManifest.artifacts?.closeoutPlan);
  const originalWorkOrderPlan = readFileSync(workOrderMismatchPlanPath, "utf8");
  const workOrderMismatchPlan = readJson<CloseoutPlan>(workOrderMismatchPlanPath);
  assert.ok(workOrderMismatchPlan.gates?.[0]?.evidenceWorkOrder?.focusedCoverageRows);
  workOrderMismatchPlan.gates[0].evidenceWorkOrder.focusedCoverageRows = [];
  writeFileSync(workOrderMismatchPlanPath, `${JSON.stringify(workOrderMismatchPlan, null, 2)}\n`, "utf8");
  workOrderMismatchManifest.artifacts.closeoutPlan.digest = sha256File(workOrderMismatchPlanPath);
  const workOrderMismatchPath = join(tmp, "work-order-mismatch-preflight-artifacts.json");
  writeFileSync(workOrderMismatchPath, `${JSON.stringify(workOrderMismatchManifest, null, 2)}\n`, "utf8");
  const workOrderMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${workOrderMismatchPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(workOrderMismatch.status, 1);
  assert.match(workOrderMismatch.stderr, /focusedCoverageRows/);
  writeFileSync(workOrderMismatchPlanPath, originalWorkOrderPlan, "utf8");

  const closeoutModeMismatchManifest = JSON.parse(JSON.stringify(manifest)) as PreflightManifest;
  assert.ok(closeoutModeMismatchManifest.blockingGateSummary);
  closeoutModeMismatchManifest.blockingGateSummary.closeoutMode = "ready-for-final-closeout";
  closeoutModeMismatchManifest.blockingGateSummary.canCloseLocally = true;
  const closeoutModeMismatchPath = join(tmp, "closeout-mode-mismatch-preflight-artifacts.json");
  writeFileSync(closeoutModeMismatchPath, `${JSON.stringify(closeoutModeMismatchManifest, null, 2)}\n`, "utf8");
  const closeoutModeMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${closeoutModeMismatchPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(closeoutModeMismatch.status, 1);
  assert.match(closeoutModeMismatch.stderr, /ready-for-final-closeout/);

  const generatedAtMismatchManifest = JSON.parse(JSON.stringify(manifest)) as PreflightManifest;
  const generatedAtMismatchStatusPath = generatedAtMismatchManifest.artifacts?.blockingGateStatus?.path;
  assert.ok(generatedAtMismatchStatusPath);
  assert.ok(generatedAtMismatchManifest.artifacts?.blockingGateStatus);
  const generatedAtMismatchStatus = readJson<GateStatusReport>(generatedAtMismatchStatusPath);
  generatedAtMismatchStatus.generatedAt = "2026-06-10T00:00:01.000Z";
  writeFileSync(generatedAtMismatchStatusPath, `${JSON.stringify(generatedAtMismatchStatus, null, 2)}\n`, "utf8");
  generatedAtMismatchManifest.artifacts.blockingGateStatus.digest = sha256File(generatedAtMismatchStatusPath);
  const generatedAtMismatchManifestPath = join(tmp, "generated-at-mismatch-preflight-artifacts.json");
  writeFileSync(generatedAtMismatchManifestPath, `${JSON.stringify(generatedAtMismatchManifest, null, 2)}\n`, "utf8");
  const generatedAtMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${generatedAtMismatchManifestPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(generatedAtMismatch.status, 1);
  assert.match(generatedAtMismatch.stderr, /Expected values to be strictly equal/);

  const sourceAlignmentCountMismatchManifest = JSON.parse(JSON.stringify(manifest)) as PreflightManifest;
  const sourceAlignmentCountMismatchStatusPath = sourceAlignmentCountMismatchManifest.artifacts?.blockingGateStatus?.path;
  assert.ok(sourceAlignmentCountMismatchStatusPath);
  assert.ok(sourceAlignmentCountMismatchManifest.artifacts?.blockingGateStatus);
  const sourceAlignmentCountMismatchStatus = readJson<GateStatusReport>(sourceAlignmentCountMismatchStatusPath);
  sourceAlignmentCountMismatchStatus.generatedAt = generatedAt;
  assert.ok(sourceAlignmentCountMismatchStatus.sourceAlignment?.gateCounts);
  sourceAlignmentCountMismatchStatus.sourceAlignment.gateCounts["PROD-CRON"] = 8;
  writeFileSync(sourceAlignmentCountMismatchStatusPath, `${JSON.stringify(sourceAlignmentCountMismatchStatus, null, 2)}\n`, "utf8");
  sourceAlignmentCountMismatchManifest.artifacts.blockingGateStatus.digest = sha256File(sourceAlignmentCountMismatchStatusPath);
  const sourceAlignmentCountMismatchManifestPath = join(tmp, "source-alignment-count-mismatch-preflight-artifacts.json");
  writeFileSync(sourceAlignmentCountMismatchManifestPath, `${JSON.stringify(sourceAlignmentCountMismatchManifest, null, 2)}\n`, "utf8");
  const sourceAlignmentCountMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${sourceAlignmentCountMismatchManifestPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(sourceAlignmentCountMismatch.status, 1);
  assert.match(sourceAlignmentCountMismatch.stderr, /'PROD-CRON': 8/);

  const sourceAlignmentMismatchManifest = JSON.parse(JSON.stringify(manifest)) as PreflightManifest;
  const sourceAlignmentMismatchStatusPath = sourceAlignmentMismatchManifest.artifacts?.blockingGateStatus?.path;
  assert.ok(sourceAlignmentMismatchStatusPath);
  assert.ok(sourceAlignmentMismatchManifest.artifacts?.blockingGateStatus);
  const sourceAlignmentMismatchStatus = readJson<GateStatusReport>(sourceAlignmentMismatchStatusPath);
  sourceAlignmentMismatchStatus.generatedAt = generatedAt;
  if (sourceAlignmentMismatchStatus.sourceAlignment?.gateCounts) {
    sourceAlignmentMismatchStatus.sourceAlignment.gateCounts["PROD-CRON"] = 9;
  }
  assert.ok(sourceAlignmentMismatchStatus.sourceAlignment);
  sourceAlignmentMismatchStatus.sourceAlignment.status = "stale";
  writeFileSync(sourceAlignmentMismatchStatusPath, `${JSON.stringify(sourceAlignmentMismatchStatus, null, 2)}\n`, "utf8");
  sourceAlignmentMismatchManifest.artifacts.blockingGateStatus.digest = sha256File(sourceAlignmentMismatchStatusPath);
  const sourceAlignmentMismatchManifestPath = join(tmp, "source-alignment-mismatch-preflight-artifacts.json");
  writeFileSync(sourceAlignmentMismatchManifestPath, `${JSON.stringify(sourceAlignmentMismatchManifest, null, 2)}\n`, "utf8");
  const sourceAlignmentMismatch = spawnSync("pnpm", [
    "tsx",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
    `--manifest=${sourceAlignmentMismatchManifestPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(sourceAlignmentMismatch.status, 1);
  assert.match(sourceAlignmentMismatch.stderr, /status: 'stale'/);

} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("production preflight artifacts contract assertions passed");

function verifyArtifactRef(label: string, artifact: ArtifactRef | undefined) {
  assert.ok(artifact?.path, `${label} is missing path`);
  assert.equal(artifact.algorithm, "sha256", `${label} must use sha256`);
  assert.match(artifact.digest ?? "", /^[a-f0-9]{64}$/, `${label} digest must be sha256 hex`);
  assert.equal(artifact.digest, sha256File(artifact.path), `${label} digest drifted`);
  assertNoSensitiveOutput(readFileSync(artifact.path, "utf8"));
}

function readJson<T>(path: string) {
  const text = readFileSync(path, "utf8");
  assertNoSensitiveOutput(text);
  return JSON.parse(text) as T;
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function gateCounts(gates: Array<{ gate?: string; blockingPartialRows?: unknown[] }>) {
  return Object.fromEntries(
    gates
      .filter((gate) => typeof gate.gate === "string")
      .map((gate): [string, number] => [gate.gate as string, gate.blockingPartialRows?.length ?? 0])
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function gateLinkCounts(gates: Array<{ gate?: string; blockingGateLinks?: number }>) {
  return Object.fromEntries(
    gates
      .filter((gate) => typeof gate.gate === "string")
      .map((gate): [string, number] => [gate.gate as string, gate.blockingGateLinks ?? 0])
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function blockingGateSummary(status: GateStatusReport): BlockingGateSummary {
  return {
    gates: status.summary?.gates ?? 0,
    ready: status.summary?.ready ?? 0,
    needsEvidence: status.summary?.needsEvidence ?? 0,
    blockingPartialRows: status.summary?.blockingPartialRows ?? 0,
    blockingGateLinks: status.summary?.blockingGateLinks ?? 0,
    missingEvidenceItems: status.summary?.missingEvidenceItems ?? 0,
    closeoutMode: status.summary?.closeoutMode ?? "unknown",
    canCloseLocally: status.summary?.canCloseLocally === true,
    gatesToClose: (status.gates ?? []).map((gate) => ({
      gate: gate.gate ?? "unknown",
      blockingPartialRows: gate.blockingPartialRows?.length ?? 0,
      blockingGateLinks: gate.blockingGateLinks ?? gate.blockingPartialRows?.length ?? 0,
      missingEvidenceItems: gate.missingEvidence?.length ?? 0,
      nextActions: gate.nextActions ?? [],
    })),
  };
}

function sumValues(counts: Record<string, number>) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
  assert.doesNotMatch(outputWithoutDigests, /https?:\/\/[^\s")]+/i);
  assert.doesNotMatch(outputWithoutDigests, /(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i);
  assert.doesNotMatch(outputWithoutDigests, /\b(?:\+?\d[\s().-]?){10,}\b/);
}
