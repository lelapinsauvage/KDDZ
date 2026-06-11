import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type FocusedGate = {
  gate: string;
  slug: string;
  rows: string[];
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
    evidenceSpec: string;
    evidenceTemplate: string;
  };
  artifacts: ArtifactEntry[];
  redacted: true;
};

const focusedGates: FocusedGate[] = [
  { gate: "PROD-CRON", slug: "cron", rows: ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P10", "P12"] },
  {
    gate: "PROD-PROVIDERS",
    slug: "provider",
    rows: ["P01", "P02", "P03", "P05", "P06", "P07", "P08", "P09", "P11", "P12", "P13", "P14", "P15", "P17"],
  },
  { gate: "PROD-NATIVE", slug: "native", rows: ["P15", "P16", "P17"] },
  { gate: "PROD-NATURE", slug: "nature", rows: ["P17"] },
];

const outputDir = optionValue("--out-dir");
const generatedAt = generatedAtValue();
const parityMatrixPath = optionValue("--parity-matrix") ?? "docs/page-parity-matrix.json";
const partialGateMapPath = optionValue("--partial-gate-map") ?? "docs/partial-production-gate-map.md";

if (!outputDir) {
  console.error(
    "Usage: pnpm tsx src/scripts/report-production-focused-artifacts.ts --out-dir=<dir> [--generated-at=<iso>] [--parity-matrix=<path>] [--partial-gate-map=<path>]"
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

  return {
    gate: entry.gate,
    partialReport: artifact(partialReportPath),
    evidenceChecklist: artifact(checklistPath),
    blockingRows: entry.rows,
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
