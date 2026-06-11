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

const partialRows = collectPartialRows();
const mapRows = parsePartialGateMap();

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

const summary = {
  partialRows: reportRows.length,
  gates: [...new Set(reportRows.flatMap((row) => row.gates))].sort(),
  gateCounts: gateCounts(reportRows),
};
const payload = {
  status: "production partial gate report",
  generatedAt,
  generatedFrom: {
    matrix: "docs/page-parity-matrix.json",
    gateMap: "docs/partial-production-gate-map.md",
  },
  summary,
  rows: reportRows,
};

const rendered = json ? `${JSON.stringify(payload, null, 2)}\n` : renderMarkdown(reportRows);
if (outputPath) {
  const dir = dirname(outputPath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, rendered, "utf8");
}

process.stdout.write(rendered);

function collectPartialRows() {
  const matrix = JSON.parse(readFileSync("docs/page-parity-matrix.json", "utf8")) as unknown;
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
  const markdown = readFileSync("docs/partial-production-gate-map.md", "utf8");
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
