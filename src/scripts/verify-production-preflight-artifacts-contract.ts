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

type PreflightManifest = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    evidenceSpec?: string;
    evidenceTemplate?: string;
  };
  artifacts?: {
    partialReport?: ArtifactRef;
    evidenceChecklist?: ArtifactRef;
    blockingGateStatus?: ArtifactRef;
    focusedArtifactsManifest?: ArtifactRef;
  };
  verifiedBy?: string[];
  redacted?: boolean;
};

type GateStatusReport = {
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
  };
  summary?: {
    gates?: number;
    ready?: number;
    needsEvidence?: number;
    blockingPartialRows?: number;
    missingEvidenceItems?: number;
  };
  gates?: Array<{ gate?: string; blockingPartialRows?: unknown[] }>;
};

type FocusedManifest = {
  status?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
  };
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
  assert.equal(blocking.generatedFrom?.matrix, manifest.generatedFrom?.matrix);
  assert.equal(blocking.generatedFrom?.gateMap, manifest.generatedFrom?.gateMap);
  assert.deepEqual(blocking.gates?.map((gate) => gate.gate), [
    "PROD-CRON",
    "PROD-NATIVE",
    "PROD-NATURE",
    "PROD-PROVIDERS",
  ]);
  assert.deepEqual(blocking.summary, {
    gates: 4,
    ready: 0,
    needsEvidence: 4,
    blockingPartialRows: 17,
    missingEvidenceItems: 28,
  });
  assert.ok(blocking.gates?.every((gate) => (gate.blockingPartialRows?.length ?? 0) > 0));
  const focused = readJson<FocusedManifest>(manifest.artifacts?.focusedArtifactsManifest?.path ?? "");
  assert.equal(focused.generatedFrom?.matrix, manifest.generatedFrom?.matrix);
  assert.equal(focused.generatedFrom?.gateMap, manifest.generatedFrom?.gateMap);

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
  const archiveBundleDir = join(tmp, "archive-bundle");
  copyFileSync("docs/page-parity-matrix.json", archiveMatrixPath);
  copyFileSync("docs/partial-production-gate-map.md", archiveGateMapPath);

  const archiveOutput = execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-preflight-artifacts.ts",
    `--out-dir=${archiveBundleDir}`,
    `--generated-at=${generatedAt}`,
    `--parity-matrix=${archiveMatrixPath}`,
    `--partial-gate-map=${archiveGateMapPath}`,
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const archiveManifest = JSON.parse(archiveOutput) as PreflightManifest;
  assert.equal(archiveManifest.generatedFrom?.matrix, archiveMatrixPath);
  assert.equal(archiveManifest.generatedFrom?.gateMap, archiveGateMapPath);
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
  assert.match(sourceMismatch.stderr, /Expected values to be strictly equal/);
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

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
  assert.doesNotMatch(outputWithoutDigests, /https?:\/\/[^\s")]+/i);
  assert.doesNotMatch(outputWithoutDigests, /(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i);
  assert.doesNotMatch(outputWithoutDigests, /\b(?:\+?\d[\s().-]?){10,}\b/);
}
