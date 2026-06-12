import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type ArtifactRef = {
  path: string;
  algorithm: "sha256";
  digest: string;
};

type PreflightManifest = {
  status: "production preflight artifacts verified";
  schemaVersion: 1;
  generatedAt: string;
  generatedFrom: {
    matrix: string;
    gateMap: string;
    evidenceSpec: string;
    evidenceTemplate: string;
  };
  artifacts: {
    partialReport: ArtifactRef;
    evidenceChecklist: ArtifactRef;
    blockingGateStatus: ArtifactRef;
    focusedArtifactsManifest: ArtifactRef;
  };
  blockingGateSummary: BlockingGateSummary;
  verifiedBy: string[];
  redacted: true;
};

type BlockingGateSummary = {
  gates: number;
  ready: number;
  needsEvidence: number;
  blockingPartialRows: number;
  missingEvidenceItems: number;
  gatesToClose: Array<{
    gate: string;
    blockingPartialRows: number;
    missingEvidenceItems: number;
    nextActions: string[];
  }>;
};

type BlockingGateStatus = {
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
  };
  sourceAlignment?: {
    status?: string;
    generatedAt?: string;
  };
  summary?: {
    gates?: number;
    ready?: number;
    needsEvidence?: number;
    blockingPartialRows?: number;
    missingEvidenceItems?: number;
  };
  gates?: Array<{
    gate?: string;
    missingEvidence?: string[];
    blockingPartialRows?: unknown[];
    nextActions?: string[];
  }>;
};

const outputDir = optionValue("--out-dir");
const generatedAt = generatedAtValue();
const parityMatrixPath = optionValue("--parity-matrix") ?? "docs/page-parity-matrix.json";
const partialGateMapPath = optionValue("--partial-gate-map") ?? "docs/partial-production-gate-map.md";

if (!outputDir) {
  console.error(
    "Usage: pnpm tsx src/scripts/report-production-preflight-artifacts.ts --out-dir=<dir> [--generated-at=<iso>] [--parity-matrix=<path>] [--partial-gate-map=<path>]"
  );
  process.exit(2);
}

mkdirSync(outputDir, { recursive: true });

const partialReportPath = join(outputDir, "kiddzonl-production-partials.json");
const evidenceChecklistPath = join(outputDir, "kiddzonl-production-evidence-checklist.json");
const blockingGateStatusPath = join(outputDir, "kiddzonl-production-blocking-gate-status.json");
const focusedArtifactsDir = join(outputDir, "focused");
const focusedManifestPath = join(focusedArtifactsDir, "kiddzonl-production-focused-artifacts.json");

run("src/scripts/report-production-partials.ts", [
  "--json",
  `--out=${partialReportPath}`,
  `--generated-at=${generatedAt}`,
  `--parity-matrix=${parityMatrixPath}`,
  `--partial-gate-map=${partialGateMapPath}`,
]);
run("src/scripts/report-production-evidence-checklist.ts", [
  "--json",
  `--out=${evidenceChecklistPath}`,
  `--generated-at=${generatedAt}`,
  `--partial-gate-map=${partialGateMapPath}`,
]);
run("src/scripts/report-production-gate-status.ts", [
  "--json",
  "--blocking-only",
  `--out=${blockingGateStatusPath}`,
  `--generated-at=${generatedAt}`,
  `--parity-matrix=${parityMatrixPath}`,
  `--partial-gate-map=${partialGateMapPath}`,
]);
run("src/scripts/verify-production-artifact-consistency-contract.ts", [
  `--partial-report=${partialReportPath}`,
  `--checklist-report=${evidenceChecklistPath}`,
]);
run("src/scripts/report-production-focused-artifacts.ts", [
  `--out-dir=${focusedArtifactsDir}`,
  `--generated-at=${generatedAt}`,
  `--parity-matrix=${parityMatrixPath}`,
  `--partial-gate-map=${partialGateMapPath}`,
]);
run("src/scripts/verify-production-focused-artifacts-manifest.ts", [
  `--manifest=${focusedManifestPath}`,
]);

assertVerifiedBlockingGateStatus(blockingGateStatusPath);
const blockingGateSummary = summarizeBlockingGateStatus(blockingGateStatusPath);
const manifest: PreflightManifest = {
  status: "production preflight artifacts verified",
  schemaVersion: 1,
  generatedAt,
  generatedFrom: {
    matrix: parityMatrixPath,
    gateMap: partialGateMapPath,
    evidenceSpec: "src/scripts/production-acceptance-evidence-spec.ts",
    evidenceTemplate: "docs/production-acceptance-evidence-template.md",
  },
  artifacts: {
    partialReport: artifact(partialReportPath),
    evidenceChecklist: artifact(evidenceChecklistPath),
    blockingGateStatus: artifact(blockingGateStatusPath),
    focusedArtifactsManifest: artifact(focusedManifestPath),
  },
  blockingGateSummary,
  verifiedBy: [
    "src/scripts/verify-production-artifact-consistency-contract.ts",
    "src/scripts/verify-production-focused-artifacts-manifest.ts",
    "src/scripts/verify-production-preflight-artifacts-manifest.ts",
  ],
  redacted: true,
};

const manifestPath = join(outputDir, "kiddzonl-production-preflight-artifacts.json");
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);

function run(script: string, args: string[]) {
  execFileSync("pnpm", ["tsx", script, ...args], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
}

function artifact(path: string): ArtifactRef {
  return {
    path,
    algorithm: "sha256",
    digest: createHash("sha256").update(readFileSync(path)).digest("hex"),
  };
}

function summarizeBlockingGateStatus(path: string): BlockingGateSummary {
  const status = JSON.parse(readFileSync(path, "utf8")) as BlockingGateStatus;
  return {
    gates: status.summary?.gates ?? 0,
    ready: status.summary?.ready ?? 0,
    needsEvidence: status.summary?.needsEvidence ?? 0,
    blockingPartialRows: status.summary?.blockingPartialRows ?? 0,
    missingEvidenceItems: status.summary?.missingEvidenceItems ?? 0,
    gatesToClose: (status.gates ?? []).map((gate) => ({
      gate: gate.gate ?? "unknown",
      blockingPartialRows: gate.blockingPartialRows?.length ?? 0,
      missingEvidenceItems: gate.missingEvidence?.length ?? 0,
      nextActions: gate.nextActions ?? [],
    })),
  };
}

function assertVerifiedBlockingGateStatus(path: string) {
  const status = JSON.parse(readFileSync(path, "utf8")) as BlockingGateStatus;
  if (status.generatedAt !== generatedAt) {
    throw new Error("Blocking gate status timestamp drifted before preflight manifest generation");
  }
  if (status.generatedFrom?.matrix !== parityMatrixPath) {
    throw new Error("Blocking gate status matrix source drifted before preflight manifest generation");
  }
  if (status.generatedFrom?.gateMap !== partialGateMapPath) {
    throw new Error("Blocking gate status gate-map source drifted before preflight manifest generation");
  }
  if (status.sourceAlignment?.status !== "verified") {
    throw new Error("Blocking gate status source alignment must be verified before preflight manifest generation");
  }
  if (status.sourceAlignment.generatedAt !== generatedAt) {
    throw new Error("Blocking gate status source-alignment timestamp drifted before preflight manifest generation");
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

function generatedAtValue() {
  const value = optionValue("--generated-at");
  if (!value) return new Date().toISOString();

  try {
    if (new Date(value).toISOString() === value) {
      return value;
    }
  } catch {
    // Report a stable CLI error below.
  }

  console.error("--generated-at must be an ISO timestamp, for example 2026-06-10T00:00:00.000Z");
  process.exit(2);
}
