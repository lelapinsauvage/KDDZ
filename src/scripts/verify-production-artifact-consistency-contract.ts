import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

type PartialReport = {
  summary?: {
    partialRows?: number;
    gates?: string[];
    gateCounts?: Record<string, number>;
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

const partialReport = runJson<PartialReport>("src/scripts/report-production-partials.ts");
const evidenceChecklist = runJson<EvidenceChecklist>("src/scripts/report-production-evidence-checklist.ts");

assert.equal(partialReport.summary?.partialRows, 17);
assert.equal(evidenceChecklist.summary?.blockingPartialRows, partialReport.summary?.partialRows);

const partialGates = partialReport.summary?.gates ?? [];
const checklistGates = evidenceChecklist.gates?.map((gate) => gate.gate).filter(Boolean).sort() ?? [];
const checklistBlockingGates = evidenceChecklist.gates
  ?.filter((gate) => gate.blockingPartialRows?.length)
  .map((gate) => gate.gate)
  .filter(Boolean)
  .sort() ?? [];

assert.deepEqual(checklistBlockingGates, partialGates);
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

for (const [gate, rows] of partialRowsByGate) {
  assert.deepEqual([...checklistRowsByGate.get(gate) ?? []].sort(), [...rows].sort(), `${gate} blocker rows drifted`);
  assert.equal(partialReport.summary?.gateCounts?.[gate], rows.size, `${gate} gate count drifted`);
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

console.log("production artifact consistency contract assertions passed");

function runJson<T>(script: string) {
  const output = execFileSync("pnpm", ["tsx", script, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return JSON.parse(output) as T;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
