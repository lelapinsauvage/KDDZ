import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  productionGateSections,
  requiredProductionEvidenceSections,
} from "./production-acceptance-evidence-spec";

type PartialGateRow = {
  row: string;
  statusAnchor: string;
  gates: string[];
  closureReason: string;
};

type ChecklistGate = {
  gate: string;
  requiredFields: string[];
  blockingPartialRows: Array<Pick<PartialGateRow, "row" | "statusAnchor" | "closureReason">>;
};

const json = process.argv.includes("--json");
const outputPath = optionValue("--out");
const selectedGate = optionValue("--gate");

const gateSections = productionGateSections();
if (selectedGate && !gateSections.includes(selectedGate)) {
  console.error(`Unknown production gate: ${selectedGate}`);
  console.error(`Known gates: ${gateSections.join(", ")}`);
  process.exit(2);
}

const partialRows = parsePartialGateMap();
const gates = gateSections
  .filter((gate) => !selectedGate || gate === selectedGate)
  .map((gate): ChecklistGate => {
    const section = requiredProductionEvidenceSections.find((spec) => spec.section === gate);
    if (!section) {
      throw new Error(`${gate} is missing from production acceptance evidence spec`);
    }

    return {
      gate,
      requiredFields: section.fields,
      blockingPartialRows: partialRows
        .filter((row) => row.gates.includes(gate))
        .map(({ row, statusAnchor, closureReason }) => ({ row, statusAnchor, closureReason })),
    };
  });

const payload = {
  status: "production evidence checklist",
  generatedFrom: {
    evidenceSpec: "src/scripts/production-acceptance-evidence-spec.ts",
    evidenceTemplate: "docs/production-acceptance-evidence-template.md",
    partialGateMap: "docs/partial-production-gate-map.md",
  },
  summary: {
    gates: gates.length,
    requiredFields: gates.reduce((count, gate) => count + gate.requiredFields.length, 0),
    blockingPartialRows: [...new Set(gates.flatMap((gate) => gate.blockingPartialRows.map((row) => row.row)))].length,
  },
  gates,
};

const rendered = json ? `${JSON.stringify(payload, null, 2)}\n` : renderMarkdown(gates);
if (outputPath) {
  const dir = dirname(outputPath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, rendered, "utf8");
}

process.stdout.write(rendered);

function parsePartialGateMap() {
  const markdown = readFileSync("docs/partial-production-gate-map.md", "utf8");
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^\| P\d{2} \|/.test(line))
    .map((line): PartialGateRow => {
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

function renderMarkdown(gates: ChecklistGate[]) {
  const lines = ["# Production Evidence Checklist", ""];

  for (const gate of gates) {
    lines.push(`## ${gate.gate}`, "");
    lines.push("| Required evidence field |");
    lines.push("| --- |");
    for (const field of gate.requiredFields) {
      lines.push(`| ${field} |`);
    }
    lines.push("");
    lines.push("| Blocking partial row | Status anchor | Closure reason |");
    lines.push("| --- | --- | --- |");
    if (gate.blockingPartialRows.length === 0) {
      lines.push("| none | none | No remaining partial rows map to this gate. |");
    } else {
      for (const row of gate.blockingPartialRows) {
        lines.push(`| ${row.row} | ${row.statusAnchor} | ${row.closureReason} |`);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}
