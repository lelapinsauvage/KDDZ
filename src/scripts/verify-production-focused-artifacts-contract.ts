import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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

const generatedAt = "2026-06-10T00:00:00.000Z";
const gates = [
  { gate: "PROD-CRON", rows: ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P10", "P12"] },
  { gate: "PROD-PROVIDERS", rows: ["P01", "P02", "P03", "P05", "P06", "P07", "P08", "P09", "P11", "P12", "P13", "P14", "P15", "P17"] },
  { gate: "PROD-NATIVE", rows: ["P15", "P16", "P17"] },
  { gate: "PROD-NATURE", rows: ["P17"] },
] as const;

const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-focused-artifacts-"));

try {
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
