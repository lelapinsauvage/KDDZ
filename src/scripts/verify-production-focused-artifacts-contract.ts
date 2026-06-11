import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type PartialReport = {
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
  };
  summary?: {
    partialRows?: number;
    gates?: string[];
    gateCounts?: Record<string, number>;
    gateFilter?: string;
  };
  rows?: Array<{
    row?: string;
    gates?: string[];
  }>;
};

type EvidenceChecklist = {
  generatedAt?: string;
  generatedFrom?: {
    partialGateMap?: string;
  };
  summary?: {
    gates?: number;
    blockingPartialRows?: number;
    gateFilter?: string;
  };
  gates?: Array<{
    gate?: string;
    blockingPartialRows?: Array<{ row?: string }>;
  }>;
};

type FocusedManifest = {
  status?: string;
  schemaVersion?: number;
  generatedAt?: string;
  generatedFrom?: {
    matrix?: string;
    gateMap?: string;
    evidenceSpec?: string;
    evidenceTemplate?: string;
  };
  artifacts?: Array<{
    gate?: string;
    partialReport?: { path?: string; algorithm?: string; digest?: string };
    evidenceChecklist?: { path?: string; algorithm?: string; digest?: string };
    blockingRows?: string[];
    verifiedBy?: string;
  }>;
  redacted?: boolean;
};

type FocusedManifestArtifact = NonNullable<FocusedManifest["artifacts"]>[number];

const generatedAt = "2026-06-10T00:00:00.000Z";
const gates = [
  { gate: "PROD-CRON", slug: "cron", rows: ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P10", "P12"] },
  {
    gate: "PROD-PROVIDERS",
    slug: "provider",
    rows: ["P01", "P02", "P03", "P05", "P06", "P07", "P08", "P09", "P11", "P12", "P13", "P14", "P15", "P17"],
  },
  { gate: "PROD-NATIVE", slug: "native", rows: ["P15", "P16", "P17"] },
  { gate: "PROD-NATURE", slug: "nature", rows: ["P17"] },
] as const;

const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-focused-artifacts-"));

try {
  const bundleDir = join(tmp, "bundle");
  execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-focused-artifacts.ts",
    `--out-dir=${bundleDir}`,
    `--generated-at=${generatedAt}`,
  ], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  const manifest = readJson<FocusedManifest>(join(bundleDir, "kiddzonl-production-focused-artifacts.json"));
  assert.equal(manifest.status, "production focused artifacts verified");
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.generatedAt, generatedAt);
  assert.equal(manifest.generatedFrom?.matrix, "docs/page-parity-matrix.json");
  assert.equal(manifest.generatedFrom?.gateMap, "docs/partial-production-gate-map.md");
  assert.equal(manifest.generatedFrom?.evidenceSpec, "src/scripts/production-acceptance-evidence-spec.ts");
  assert.equal(manifest.generatedFrom?.evidenceTemplate, "docs/production-acceptance-evidence-template.md");
  assert.equal(manifest.redacted, true);
  assert.deepEqual(manifest.artifacts?.map((artifact) => artifact.gate), gates.map((entry) => entry.gate));
  for (const { gate, rows, slug } of gates) {
    const artifact: FocusedManifestArtifact | undefined = manifest.artifacts?.find((entry) => entry.gate === gate);
    assert.ok(artifact, `${gate} is missing from focused artifact manifest`);
    assert.deepEqual(artifact.blockingRows, rows);
    assert.equal(artifact.verifiedBy, "src/scripts/verify-production-artifact-consistency-contract.ts");
    assert.equal(artifact.partialReport?.algorithm, "sha256");
    assert.equal(artifact.evidenceChecklist?.algorithm, "sha256");
    assert.match(artifact.partialReport?.digest ?? "", /^[a-f0-9]{64}$/);
    assert.match(artifact.evidenceChecklist?.digest ?? "", /^[a-f0-9]{64}$/);
    assert.ok(artifact.partialReport?.path?.endsWith(`${slug}-partials.json`));
    assert.ok(artifact.evidenceChecklist?.path?.endsWith(`${slug}-checklist.json`));
  }

  const missingOutDir = spawnSync("pnpm", ["tsx", "src/scripts/report-production-focused-artifacts.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(missingOutDir.status, 2);
  assert.match(missingOutDir.stderr, /--out-dir=<dir>/);

  const invalidGeneratedAt = spawnSync("pnpm", [
    "tsx",
    "src/scripts/report-production-focused-artifacts.ts",
    `--out-dir=${join(tmp, "invalid")}`,
    "--generated-at=not-a-date",
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(invalidGeneratedAt.status, 2);
  assert.match(invalidGeneratedAt.stderr, /--generated-at must be an ISO timestamp/);

  for (const { gate, rows } of gates) {
    const partialPath = join(tmp, `${gate.toLowerCase()}-partials.json`);
    const checklistPath = join(tmp, `${gate.toLowerCase()}-checklist.json`);

    execFileSync("pnpm", [
      "tsx",
      "src/scripts/report-production-partials.ts",
      "--json",
      `--gate=${gate}`,
      `--out=${partialPath}`,
      `--generated-at=${generatedAt}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/report-production-evidence-checklist.ts",
      "--json",
      `--gate=${gate}`,
      `--out=${checklistPath}`,
      `--generated-at=${generatedAt}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/verify-production-artifact-consistency-contract.ts",
      `--partial-report=${partialPath}`,
      `--checklist-report=${checklistPath}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });

    const partial = readJson<PartialReport>(partialPath);
    const checklist = readJson<EvidenceChecklist>(checklistPath);
    assert.equal(partial.generatedAt, generatedAt, `${gate} partial report generatedAt drifted`);
    assert.equal(checklist.generatedAt, generatedAt, `${gate} checklist generatedAt drifted`);
    assert.equal(partial.generatedFrom?.matrix, "docs/page-parity-matrix.json");
    assert.equal(partial.generatedFrom?.gateMap, "docs/partial-production-gate-map.md");
    assert.equal(checklist.generatedFrom?.partialGateMap, "docs/partial-production-gate-map.md");
    assert.equal(partial.summary?.gateFilter, gate);
    assert.equal(checklist.summary?.gateFilter, gate);
    assert.equal(partial.summary?.partialRows, rows.length);
    assert.equal(checklist.summary?.blockingPartialRows, rows.length);
    assert.deepEqual(partial.rows?.map((row) => row.row), rows);
    assert.deepEqual(checklist.gates?.map((entry) => entry.gate), [gate]);
    assert.deepEqual(checklist.gates?.[0]?.blockingPartialRows?.map((row) => row.row), rows);
    assert.ok(partial.rows?.every((row) => row.gates?.includes(gate)), `${gate} report contains a row outside the selected gate`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("production focused artifacts contract assertions passed");

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}
