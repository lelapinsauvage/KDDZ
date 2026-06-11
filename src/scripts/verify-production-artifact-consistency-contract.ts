import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type PartialReport = {
  summary?: {
    partialRows?: number;
    gates?: string[];
    gateCounts?: Record<string, number>;
    gateFilter?: string;
  };
  rows?: Array<{
    row?: string;
    gates?: string[];
    statusAnchor?: string;
    closureReason?: string;
  }>;
};

type EvidenceChecklist = {
  summary?: {
    gates?: number;
    blockingPartialRows?: number;
    gateFilter?: string;
  };
  gates?: Array<{
    gate?: string;
    blockingPartialRows?: Array<{
      row?: string;
      statusAnchor?: string;
      closureReason?: string;
    }>;
  }>;
};

const partialReportPath = optionValue("--partial-report");
const checklistReportPath = optionValue("--checklist-report");

const partialReport = partialReportPath
  ? readJson<PartialReport>(partialReportPath)
  : runJson<PartialReport>("src/scripts/report-production-partials.ts");
const evidenceChecklist = checklistReportPath
  ? readJson<EvidenceChecklist>(checklistReportPath)
  : runJson<EvidenceChecklist>("src/scripts/report-production-evidence-checklist.ts");

const uniquePartialRows = new Set((partialReport.rows ?? []).map((row) => row.row).filter(isString));
assert.equal(partialReport.summary?.partialRows, uniquePartialRows.size);
assert.equal(evidenceChecklist.summary?.blockingPartialRows, uniquePartialRows.size);

const partialGates = partialReport.summary?.gates ?? [];
const checklistGates = evidenceChecklist.gates?.map((gate) => gate.gate).filter(Boolean).sort() ?? [];
const checklistBlockingGates = evidenceChecklist.gates
  ?.filter((gate) => gate.blockingPartialRows?.length)
  .map((gate) => gate.gate)
  .filter(Boolean)
  .sort() ?? [];
const partialGateFilter = partialReport.summary?.gateFilter;
const checklistGateFilter = evidenceChecklist.summary?.gateFilter;
const focusedGate = partialGateFilter ?? checklistGateFilter ?? null;

assert.equal(evidenceChecklist.summary?.gates, checklistGates.length);

const partialRowsByGate = new Map<string, Set<string>>();
for (const row of partialReport.rows ?? []) {
  assert.ok(row.row, "partial report row is missing row id");
  for (const gate of row.gates ?? []) {
    if (!partialRowsByGate.has(gate)) {
      partialRowsByGate.set(gate, new Set());
    }
    partialRowsByGate.get(gate)?.add(row.row);
  }
}

const checklistRowsByGate = new Map<string, Set<string>>();
for (const gate of evidenceChecklist.gates ?? []) {
  if (!gate.gate) {
    continue;
  }
  checklistRowsByGate.set(
    gate.gate,
    new Set(gate.blockingPartialRows?.map((row) => row.row).filter(isString) ?? [])
  );
}

if (focusedGate) {
  assert.equal(partialGateFilter, focusedGate, "focused partial report gateFilter drifted");
  assert.equal(checklistGateFilter, focusedGate, "focused checklist gateFilter drifted");
  assert.deepEqual(checklistGates, [focusedGate], "focused checklist must contain only the selected gate");
  assert.deepEqual(checklistBlockingGates, uniquePartialRows.size ? [focusedGate] : []);
  assert.ok(
    (partialReport.rows ?? []).every((row) => row.gates?.includes(focusedGate)),
    "focused partial report contains a row outside the selected gate"
  );
  assert.deepEqual(
    [...checklistRowsByGate.get(focusedGate) ?? []].sort(),
    [...uniquePartialRows].sort(),
    `${focusedGate} focused blocker rows drifted`
  );
  assert.equal(partialReport.summary?.gateCounts?.[focusedGate], uniquePartialRows.size, `${focusedGate} gate count drifted`);
} else {
  assert.deepEqual(checklistBlockingGates, partialGates);
  for (const [gate, rows] of partialRowsByGate) {
    assert.deepEqual([...checklistRowsByGate.get(gate) ?? []].sort(), [...rows].sort(), `${gate} blocker rows drifted`);
    assert.equal(partialReport.summary?.gateCounts?.[gate], rows.size, `${gate} gate count drifted`);
  }
  for (const gate of Object.keys(partialReport.summary?.gateCounts ?? {})) {
    assert.ok(partialRowsByGate.has(gate), `${gate} gate count has no mapped partial rows`);
  }
}

const partialRows = new Map(partialReport.rows?.map((row) => [row.row, row]) ?? []);
for (const gate of evidenceChecklist.gates ?? []) {
  for (const checklistRow of gate.blockingPartialRows ?? []) {
    const partialRow = partialRows.get(checklistRow.row);
    assert.ok(partialRow, `${checklistRow.row ?? "unknown row"} is missing from partial report`);
    assert.equal(checklistRow.statusAnchor, partialRow.statusAnchor);
    assert.equal(checklistRow.closureReason, partialRow.closureReason);
  }
}

if (!partialReportPath && !checklistReportPath) {
  verifyPathModeContract();
}

console.log("production artifact consistency contract assertions passed");

function runJson<T>(script: string) {
  const output = execFileSync("pnpm", ["tsx", script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return JSON.parse(output) as T;
}

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function verifyPathModeContract() {
  const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-artifact-consistency-"));
  try {
    const partialPath = join(tmp, "partials.json");
    const checklistPath = join(tmp, "checklist.json");
    execFileSync("pnpm", ["tsx", "src/scripts/report-production-partials.ts", "--json", `--out=${partialPath}`], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    execFileSync("pnpm", ["tsx", "src/scripts/report-production-evidence-checklist.ts", "--json", `--out=${checklistPath}`], {
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

    const focusedPartialPath = join(tmp, "cron-partials.json");
    const focusedChecklistPath = join(tmp, "cron-checklist.json");
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/report-production-partials.ts",
      "--json",
      "--gate=PROD-CRON",
      `--out=${focusedPartialPath}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/report-production-evidence-checklist.ts",
      "--json",
      "--gate=PROD-CRON",
      `--out=${focusedChecklistPath}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/verify-production-artifact-consistency-contract.ts",
      `--partial-report=${focusedPartialPath}`,
      `--checklist-report=${focusedChecklistPath}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });

    const staleChecklist = JSON.parse(readFileSync(checklistPath, "utf8")) as EvidenceChecklist;
    const cronGate = staleChecklist.gates?.find((gate) => gate.gate === "PROD-CRON");
    cronGate?.blockingPartialRows?.pop();
    const staleChecklistPath = join(tmp, "stale-checklist.json");
    writeFileSync(staleChecklistPath, `${JSON.stringify(staleChecklist, null, 2)}\n`, "utf8");

    const stale = spawnSync("pnpm", [
      "tsx",
      "src/scripts/verify-production-artifact-consistency-contract.ts",
      `--partial-report=${partialPath}`,
      `--checklist-report=${staleChecklistPath}`,
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /PROD-CRON blocker rows drifted/);

    const zeroPartialPath = join(tmp, "zero-partials.json");
    const zeroChecklistPath = join(tmp, "zero-checklist.json");
    const zeroPartialReport: PartialReport = {
      summary: {
        partialRows: 0,
        gates: [],
        gateCounts: {},
      },
      rows: [],
    };
    const zeroChecklist: EvidenceChecklist = {
      summary: {
        gates: 12,
        blockingPartialRows: 0,
      },
      gates: (readJson<EvidenceChecklist>(checklistPath).gates ?? []).map((gate) => ({
        ...gate,
        blockingPartialRows: [],
      })),
    };
    writeFileSync(zeroPartialPath, `${JSON.stringify(zeroPartialReport, null, 2)}\n`, "utf8");
    writeFileSync(zeroChecklistPath, `${JSON.stringify(zeroChecklist, null, 2)}\n`, "utf8");
    execFileSync("pnpm", [
      "tsx",
      "src/scripts/verify-production-artifact-consistency-contract.ts",
      `--partial-report=${zeroPartialPath}`,
      `--checklist-report=${zeroChecklistPath}`,
    ], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
