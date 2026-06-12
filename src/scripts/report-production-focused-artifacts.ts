import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type FocusedGate = {
  gate: string;
  slug: string;
};

type ArtifactEntry = {
  gate: string;
  partialReport: ArtifactRef;
  evidenceChecklist: ArtifactRef;
  blockingRows: string[];
  verifiedBy: string;
};

type ArtifactRef = {
  path: string;
  algorithm: "sha256";
  digest: string;
};

type FocusedArtifactManifest = {
  status: "production focused artifacts verified";
  schemaVersion: 1;
  generatedAt: string;
  generatedFrom: {
    matrix: string;
    gateMap: string;
    productionGates: string;
    evidenceSpec: string;
    evidenceTemplate: string;
  };
  artifacts: ArtifactEntry[];
  redacted: true;
};

const focusedGates: FocusedGate[] = [
  { gate: "PROD-CRON", slug: "cron" },
  { gate: "PROD-PROVIDERS", slug: "provider" },
  { gate: "PROD-NATIVE", slug: "native" },
  { gate: "PROD-NATURE", slug: "nature" },
];

const outputDir = optionValue("--out-dir");
const generatedAt = generatedAtValue();
const parityMatrixPath = optionValue("--parity-matrix") ?? "docs/page-parity-matrix.json";
const partialGateMapPath = optionValue("--partial-gate-map") ?? "docs/partial-production-gate-map.md";
const productionGatesPath = optionValue("--production-gates") ?? "docs/legacy-production-acceptance-gates.md";

if (!outputDir) {
  console.error(
    "Usage: pnpm tsx src/scripts/report-production-focused-artifacts.ts --out-dir=<dir> [--generated-at=<iso>] [--parity-matrix=<path>] [--partial-gate-map=<path>] [--production-gates=<path>]"
  );
  process.exit(2);
}

mkdirSync(outputDir, { recursive: true });

const artifacts = focusedGates.map((entry): ArtifactEntry => {
  const partialReportPath = join(outputDir, `kiddzonl-production-${entry.slug}-partials.json`);
  const checklistPath = join(outputDir, `kiddzonl-production-${entry.slug}-checklist.json`);

  run("src/scripts/report-production-partials.ts", [
    "--json",
    `--gate=${entry.gate}`,
    `--out=${partialReportPath}`,
    `--generated-at=${generatedAt}`,
    `--parity-matrix=${parityMatrixPath}`,
    `--partial-gate-map=${partialGateMapPath}`,
    `--production-gates=${productionGatesPath}`,
  ]);
  run("src/scripts/report-production-evidence-checklist.ts", [
    "--json",
    `--gate=${entry.gate}`,
    `--out=${checklistPath}`,
    `--generated-at=${generatedAt}`,
    `--partial-gate-map=${partialGateMapPath}`,
  ]);
  run("src/scripts/verify-production-artifact-consistency-contract.ts", [
    `--partial-report=${partialReportPath}`,
    `--checklist-report=${checklistPath}`,
  ]);

  const partialReport = JSON.parse(readFileSync(partialReportPath, "utf8")) as {
    rows?: Array<{ row?: string }>;
  };
  const blockingRows = (partialReport.rows ?? []).map((row) => {
    if (!row.row) {
      throw new Error(`${entry.gate} partial report has a row without an id`);
    }
    return row.row;
  });

  return {
    gate: entry.gate,
    partialReport: artifact(partialReportPath),
    evidenceChecklist: artifact(checklistPath),
    blockingRows,
    verifiedBy: "src/scripts/verify-production-artifact-consistency-contract.ts",
  };
});

const manifest: FocusedArtifactManifest = {
  status: "production focused artifacts verified",
  schemaVersion: 1,
  generatedAt,
  generatedFrom: {
    matrix: parityMatrixPath,
    gateMap: partialGateMapPath,
    productionGates: productionGatesPath,
    evidenceSpec: "src/scripts/production-acceptance-evidence-spec.ts",
    evidenceTemplate: "docs/production-acceptance-evidence-template.md",
  },
  artifacts,
  redacted: true,
};

const manifestPath = join(outputDir, "kiddzonl-production-focused-artifacts.json");
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
