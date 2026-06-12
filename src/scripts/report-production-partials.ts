import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type ParityRow = {
  status?: string;
  verification?: string;
  notes?: string;
  [key: string]: unknown;
};

type PartialGateRow = {
  row: string;
  statusAnchor: string;
  gates: string[];
  closureReason: string;
  matrixStatus: string;
};

const json = process.argv.includes("--json");
const outputPath = optionValue("--out");
const generatedAt = generatedAtValue();
const parityMatrixPath = optionValue("--parity-matrix") ?? "docs/page-parity-matrix.json";
const partialGateMapPath = optionValue("--partial-gate-map") ?? "docs/partial-production-gate-map.md";
const selectedGate = optionValue("--gate");
const productionGatesPath = optionValue("--production-gates") ?? "docs/legacy-production-acceptance-gates.md";

const partialRows = collectPartialRows();
const mapRows = parsePartialGateMap();
const knownProductionGates = parseProductionGates();
validatePartialGateMap(mapRows, knownProductionGates);

if (partialRows.length !== mapRows.length) {
  throw new Error(`Partial matrix/map mismatch: matrix=${partialRows.length} map=${mapRows.length}`);
}

const reportRows = mapRows.map((row, index): PartialGateRow => {
  const partial = partialRows[index];
  if (!partial.status?.toLowerCase().includes(row.statusAnchor.toLowerCase())) {
    throw new Error(`${row.row} anchor mismatch: "${row.statusAnchor}" not found in "${partial.status ?? ""}"`);
  }

  return {
    ...row,
    matrixStatus: partial.status ?? "",
  };
});

const filteredRows = selectedGate ? filterRowsForGate(reportRows, selectedGate) : reportRows;
const summary = {
  partialRows: filteredRows.length,
  gates: [...new Set(filteredRows.flatMap((row) => row.gates))].sort(),
  gateCounts: gateCounts(filteredRows),
  ...(selectedGate ? { gateFilter: selectedGate } : {}),
};
const payload = {
  status: "production partial gate report",
  schemaVersion: 1,
  generatedAt,
  generatedFrom: {
    matrix: parityMatrixPath,
    gateMap: partialGateMapPath,
  },
  summary,
  rows: filteredRows,
};

const rendered = json ? `${JSON.stringify(payload, null, 2)}\n` : renderMarkdown(filteredRows);
if (outputPath) {
  const dir = dirname(outputPath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, rendered, "utf8");
}

process.stdout.write(rendered);

function collectPartialRows() {
  const matrix = JSON.parse(readFileSync(parityMatrixPath, "utf8")) as unknown;
  const rows: ParityRow[] = [];

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") {
      return;
    }

    const row = value as ParityRow;
    if (typeof row.status === "string" && row.status.toLowerCase().startsWith("partial")) {
      rows.push(row);
    }
    Object.values(row).forEach(walk);
  }

  walk(matrix);
  return rows;
}

function parsePartialGateMap() {
  const markdown = readFileSync(partialGateMapPath, "utf8");
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^\| P\d{2} \|/.test(line))
    .map((line) => {
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      const [row, statusAnchor, gates, closureReason] = cells;
      return {
        row,
        statusAnchor,
        gates: gates.split(",").map((gate) => gate.trim()).filter(Boolean),
        closureReason,
      };
    });
}

function parseProductionGates() {
  const markdown = readFileSync(productionGatesPath, "utf8");
  return new Set(
    markdown
      .split(/\r?\n/)
      .map((line) => line.match(/^\| (PROD-[A-Z]+) \|/)?.[1])
      .filter((gate): gate is string => Boolean(gate)),
  );
}

function validatePartialGateMap(rows: Array<Omit<PartialGateRow, "matrixStatus">>, knownGates: Set<string>) {
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const expectedRow = `P${String(index + 1).padStart(2, "0")}`;
    if (row.row !== expectedRow) {
      throw new Error(`Partial gate map row order drifted: expected ${expectedRow}, found ${row.row || "empty"}`);
    }
    if (seen.has(row.row)) {
      throw new Error(`Partial gate map contains duplicate row id: ${row.row}`);
    }
    seen.add(row.row);
    if (!row.statusAnchor) {
      throw new Error(`${row.row} is missing a status anchor`);
    }
    if (!row.closureReason) {
      throw new Error(`${row.row} is missing a closure reason`);
    }
    if (row.gates.length === 0) {
      throw new Error(`${row.row} is missing production gate ids`);
    }
    for (const gate of row.gates) {
      if (!knownGates.has(gate)) {
        throw new Error(`${row.row} references unknown production gate ${gate}`);
      }
    }
  });
}

function filterRowsForGate(rows: PartialGateRow[], gate: string) {
  if (!rows.some((row) => row.gates.includes(gate))) {
    const knownGates = [...new Set(rows.flatMap((row) => row.gates))].sort();
    console.error(`Unknown production gate or no mapped partial rows for gate: ${gate}`);
    console.error(`Known mapped gates: ${knownGates.join(", ") || "none"}`);
    process.exit(2);
  }

  return rows.filter((row) => row.gates.includes(gate));
}

function renderMarkdown(rows: PartialGateRow[]) {
  const counts = gateCounts(rows);
  const lines = [
    "# Production Partial Gate Report",
    "",
    `Generated at: ${generatedAt}`,
    "",
    `Partial rows: ${rows.length}`,
    "",
    "| Gate | Blocking partial rows |",
    "| --- | --- |",
    ...Object.entries(counts).map(([gate, count]) => `| ${gate} | ${count} |`),
    "",
    "| Row | Gates | Status anchor | Closure reason |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.row} | ${row.gates.join(", ")} | ${row.statusAnchor} | ${row.closureReason} |`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function gateCounts(rows: PartialGateRow[]) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    for (const gate of row.gates) {
      counts[gate] = (counts[gate] ?? 0) + 1;
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
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
