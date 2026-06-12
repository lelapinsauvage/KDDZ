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
  releaseMetadata?: ReleaseMetadata;
  generatedFrom: {
    matrix: string;
    gateMap: string;
    productionGates: string;
    evidenceSpec: string;
    evidenceTemplate: string;
  };
  artifacts: {
    partialReport: ArtifactRef;
    evidenceChecklist: ArtifactRef;
    blockingGateStatus: ArtifactRef;
    focusedArtifactsManifest: ArtifactRef;
    closeoutPlan: ArtifactRef;
    readinessEnvTemplates: Record<string, ArtifactRef>;
  };
  blockingGateSummary: BlockingGateSummary;
  verifiedBy: string[];
  redacted: true;
};

type ReleaseMetadata = {
  branch: string;
  commit: string;
  acceptanceDate: string;
};

type BlockingGateSummary = {
  gates: number;
  ready: number;
  needsEvidence: number;
  blockingPartialRows: number;
  blockingGateLinks: number;
  missingEvidenceItems: number;
  closeoutMode: string;
  canCloseLocally: boolean;
  gatesToClose: Array<{
    gate: string;
    blockingPartialRows: number;
    blockingGateLinks: number;
    missingEvidenceItems: number;
    nextActions: string[];
  }>;
};

type BlockingGateStatus = {
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    productionGates?: string;
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
    blockingGateLinks?: number;
    missingEvidenceItems?: number;
    closeoutMode?: string;
    canCloseLocally?: boolean;
  };
  gates?: Array<{
    gate?: string;
    missingEvidence?: string[];
    blockingGateLinks?: number;
    blockingPartialRows?: unknown[];
    nextActions?: string[];
  }>;
};

const outputDir = optionValue("--out-dir");
const generatedAt = generatedAtValue();
const parityMatrixPath = optionValue("--parity-matrix") ?? "docs/page-parity-matrix.json";
const partialGateMapPath = optionValue("--partial-gate-map") ?? "docs/partial-production-gate-map.md";
const productionGatesPath = optionValue("--production-gates") ?? "docs/legacy-production-acceptance-gates.md";
const releaseMetadata = releaseMetadataValue();

if (!outputDir) {
  console.error(
    "Usage: pnpm tsx src/scripts/report-production-preflight-artifacts.ts --out-dir=<dir> [--generated-at=<iso>] [--parity-matrix=<path>] [--partial-gate-map=<path>] [--production-gates=<path>] [--release-branch=<branch>] [--release-commit=<sha>] [--acceptance-date=<YYYY-MM-DD>]"
  );
  process.exit(2);
}

mkdirSync(outputDir, { recursive: true });

const partialReportPath = join(outputDir, "kiddzonl-production-partials.json");
const evidenceChecklistPath = join(outputDir, "kiddzonl-production-evidence-checklist.json");
const blockingGateStatusPath = join(outputDir, "kiddzonl-production-blocking-gate-status.json");
const closeoutPlanPath = join(outputDir, "kiddzonl-production-closeout-plan.json");
const focusedArtifactsDir = join(outputDir, "focused");
const focusedManifestPath = join(focusedArtifactsDir, "kiddzonl-production-focused-artifacts.json");
const readinessEnvTemplateDir = join(outputDir, "readiness-env");

run("src/scripts/report-production-partials.ts", [
  "--json",
  `--out=${partialReportPath}`,
  `--generated-at=${generatedAt}`,
  `--parity-matrix=${parityMatrixPath}`,
  `--partial-gate-map=${partialGateMapPath}`,
  `--production-gates=${productionGatesPath}`,
]);
run("src/scripts/report-production-evidence-checklist.ts", [
  "--json",
  `--out=${evidenceChecklistPath}`,
  `--generated-at=${generatedAt}`,
  `--partial-gate-map=${partialGateMapPath}`,
  `--production-gates=${productionGatesPath}`,
]);
run("src/scripts/report-production-gate-status.ts", [
  "--json",
  "--blocking-only",
  `--out=${blockingGateStatusPath}`,
  `--generated-at=${generatedAt}`,
  `--parity-matrix=${parityMatrixPath}`,
  `--partial-gate-map=${partialGateMapPath}`,
  `--production-gates=${productionGatesPath}`,
]);
run("src/scripts/report-production-closeout-plan.ts", [
  "--json",
  `--out=${closeoutPlanPath}`,
  `--generated-at=${generatedAt}`,
  `--parity-matrix=${parityMatrixPath}`,
  `--partial-gate-map=${partialGateMapPath}`,
  `--production-gates=${productionGatesPath}`,
  ...optionalArg("--release-branch", releaseMetadata?.branch),
  ...optionalArg("--release-commit", releaseMetadata?.commit),
  ...optionalArg("--acceptance-date", releaseMetadata?.acceptanceDate),
]);
const readinessEnvTemplates = writeReadinessEnvTemplates(readinessEnvTemplateDir);
run("src/scripts/verify-production-artifact-consistency-contract.ts", [
  `--partial-report=${partialReportPath}`,
  `--checklist-report=${evidenceChecklistPath}`,
]);
run("src/scripts/report-production-focused-artifacts.ts", [
  `--out-dir=${focusedArtifactsDir}`,
  `--generated-at=${generatedAt}`,
  `--parity-matrix=${parityMatrixPath}`,
  `--partial-gate-map=${partialGateMapPath}`,
  `--production-gates=${productionGatesPath}`,
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
  ...(releaseMetadata ? { releaseMetadata } : {}),
  generatedFrom: {
    matrix: parityMatrixPath,
    gateMap: partialGateMapPath,
    productionGates: productionGatesPath,
    evidenceSpec: "src/scripts/production-acceptance-evidence-spec.ts",
    evidenceTemplate: "docs/production-acceptance-evidence-template.md",
  },
  artifacts: {
    partialReport: artifact(partialReportPath),
    evidenceChecklist: artifact(evidenceChecklistPath),
    blockingGateStatus: artifact(blockingGateStatusPath),
    focusedArtifactsManifest: artifact(focusedManifestPath),
    closeoutPlan: artifact(closeoutPlanPath),
    readinessEnvTemplates,
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

function writeReadinessEnvTemplates(outputDir: string) {
  mkdirSync(outputDir, { recursive: true });
  const templates: Record<string, { gate?: string; path: string }> = {
    full: { path: join(outputDir, "private-readiness.env") },
    cron: { gate: "PROD-CRON", path: join(outputDir, "private-readiness-cron.env") },
    provider: { gate: "PROD-PROVIDERS", path: join(outputDir, "private-readiness-provider.env") },
    native: { gate: "PROD-NATIVE", path: join(outputDir, "private-readiness-native.env") },
    nature: { gate: "PROD-NATURE", path: join(outputDir, "private-readiness-nature.env") },
  };
  for (const template of Object.values(templates)) {
    run("src/scripts/render-production-readiness-env-template.ts", [
      "--include-work-orders",
      `--out=${template.path}`,
      ...optionalArg("--gate", template.gate),
      ...optionalArg("--release-branch", releaseMetadata?.branch),
      ...optionalArg("--release-commit", releaseMetadata?.commit),
      ...optionalArg("--acceptance-date", releaseMetadata?.acceptanceDate),
    ]);
  }
  return Object.fromEntries(
    Object.entries(templates).map(([key, template]) => [key, artifact(template.path)])
  );
}

function summarizeBlockingGateStatus(path: string): BlockingGateSummary {
  const status = JSON.parse(readFileSync(path, "utf8")) as BlockingGateStatus;
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
  if (status.generatedFrom?.productionGates !== productionGatesPath) {
    throw new Error("Blocking gate status production-gates source drifted before preflight manifest generation");
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

function optionalArg(name: string, value: string | null | undefined) {
  return value ? [`${name}=${value}`] : [];
}

function releaseMetadataValue(): ReleaseMetadata | undefined {
  const branch = optionValue("--release-branch");
  const commit = optionValue("--release-commit");
  const acceptanceDate = optionValue("--acceptance-date");
  if (!branch && !commit && !acceptanceDate) return undefined;
  if (!branch || !commit || !acceptanceDate) {
    console.error("--release-branch, --release-commit, and --acceptance-date must be provided together");
    process.exit(2);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(acceptanceDate)) {
    console.error("--acceptance-date must use YYYY-MM-DD format");
    process.exit(2);
  }
  return { branch, commit, acceptanceDate };
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
