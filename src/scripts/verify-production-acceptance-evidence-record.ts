import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  productionEvidencePlaceholderValues,
  productionGateSections,
  requiredProductionEvidenceSections,
} from "./production-acceptance-evidence-spec";

type ReadinessReport = {
  redacted?: boolean;
  summary?: {
    ready?: number;
    needsEvidence?: number;
    total?: number;
  };
  gates?: Array<{
    gate?: string;
    status?: string;
  }>;
};

const recordPath = positionalArgs()[0];
const readinessReportPath = optionValue("--readiness-report");
const closeoutSummaryPath = optionValue("--summary-report");
const partialReportPath = optionValue("--partial-report");
const checklistReportPath = optionValue("--checklist-report");
const expectedBranch = optionValue("--branch");
const expectedCommit = optionValue("--commit");

if (!recordPath || recordPath.startsWith("-")) {
  console.error(
    "Usage: pnpm tsx src/scripts/verify-production-acceptance-evidence-record.ts <filled-production-evidence.md> [--readiness-report=<redacted-readiness.json>] [--summary-report=<closeout-summary.json>] [--partial-report=<partials.json>] [--checklist-report=<evidence-checklist.json>] [--branch=<branch>] [--commit=<sha>]"
  );
  process.exit(2);
}

const raw = readFileSync(recordPath, "utf8");
assertNoSensitiveContent(raw);

const sections = parseMarkdownTables(raw);
const errors: string[] = [];

for (const spec of requiredProductionEvidenceSections) {
  const fields = sections.get(spec.section);
  if (!fields) {
    errors.push(`missing section: ${spec.section}`);
    continue;
  }

  for (const field of spec.fields) {
    const value = fields.get(field);
    if (value === undefined) {
      errors.push(`${spec.section}: missing field "${field}"`);
      continue;
    }
    if (isPlaceholder(value)) {
      errors.push(`${spec.section}: field "${field}" still has placeholder/empty value`);
    }
  }
}

if (readinessReportPath) {
  verifyReadinessReport(readinessReportPath, sections, errors);
}
verifyArtifactPointers(sections, errors);
verifyBranchAndCommit(sections, errors);
verifyFinalDecision(sections, errors);

if (errors.length > 0) {
  console.error("Production acceptance evidence record is incomplete:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "production acceptance evidence record verified",
      record: recordPath,
      readinessReport: readinessReportPath ?? null,
      closeoutSummary: closeoutSummaryPath ?? null,
      partialReport: partialReportPath ?? null,
      evidenceChecklist: checklistReportPath ?? null,
      branch: expectedBranch ?? null,
      commit: expectedCommit ?? null,
      sections: requiredProductionEvidenceSections.length,
      fields: requiredProductionEvidenceSections.reduce((count, section) => count + section.fields.length, 0),
      redacted: true,
    },
    null,
    2
  )
);

function parseMarkdownTables(markdown: string) {
  const sections = new Map<string, Map<string, string>>();
  let currentSection: string | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      currentSection = heading[1];
      sections.set(currentSection, new Map());
      continue;
    }

    if (!currentSection || !line.startsWith("|")) {
      continue;
    }

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length < 2) {
      continue;
    }

    const [field, value] = cells;
    if (
      field === "Field" ||
      field === "Evidence" ||
      /^-+$/.test(field) ||
      /^-+$/.test(value)
    ) {
      continue;
    }

    sections.get(currentSection)?.set(field, value);
  }

  return sections;
}

function isPlaceholder(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;

  return productionEvidencePlaceholderValues.includes(normalized);
}

function assertNoSensitiveContent(value: string) {
  assert.doesNotMatch(value, /https?:\/\/[^\s)]+/i, "evidence record must not contain raw URLs");
  assert.doesNotMatch(
    value,
    /(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i,
    "evidence record must not contain raw secret values"
  );
  assertNoPhoneNumbers(value);
}

function assertNoPhoneNumbers(value: string) {
  const candidates = value.match(/\b\+?\d[\d().\-\s]{8,}\d\b/g) ?? [];
  for (const candidate of candidates) {
    const digitCount = candidate.replace(/\D/g, "").length;
    assert.ok(digitCount < 10, "evidence record must not contain phone numbers");
  }
}

function verifyReadinessReport(
  path: string,
  sections: Map<string, Map<string, string>>,
  errors: string[]
) {
  const reportText = readFileSync(path, "utf8");
  assertNoSensitiveContent(reportText);

  const report = JSON.parse(reportText) as ReadinessReport;
  if (report.redacted !== true) {
    errors.push("readiness report: redacted must be true");
  }
  if (!report.summary) {
    errors.push("readiness report: missing summary");
  }
  if (!Array.isArray(report.gates)) {
    errors.push("readiness report: missing gates");
    return;
  }

  const ready = report.summary?.ready;
  const needsEvidence = report.summary?.needsEvidence;
  const total = report.summary?.total;
  if (ready !== total || needsEvidence !== 0) {
    errors.push(`readiness report: expected all gates ready, got ready=${ready} needsEvidence=${needsEvidence} total=${total}`);
  }

  const metadataResult = sections.get("Run Metadata")?.get("`audit-production-readiness.ts` result") ?? "";
  if (typeof ready === "number" && typeof total === "number" && !metadataResult.includes(`${ready}/${total}`)) {
    errors.push(`Run Metadata: readiness result must include ${ready}/${total}`);
  }

  const expectedGateSections = productionGateSections();
  const reportGates = new Set<string>();
  for (const gate of report.gates) {
    if (!gate.gate) {
      errors.push("readiness report: gate entry missing gate id");
      continue;
    }
    reportGates.add(gate.gate);
    if (gate.status !== "ready-to-review") {
      errors.push(`readiness report: ${gate.gate} status is ${gate.status ?? "missing"}`);
    }
  }

  for (const section of expectedGateSections) {
    if (!reportGates.has(section)) {
      errors.push(`readiness report: missing ${section}`);
    }
  }
}

function verifyBranchAndCommit(
  sections: Map<string, Map<string, string>>,
  errors: string[]
) {
  if (!expectedBranch && !expectedCommit) {
    return;
  }

  const value = sections.get("Run Metadata")?.get("Modern branch/commit") ?? "";
  if (expectedBranch && !value.includes(expectedBranch)) {
    errors.push(`Run Metadata: Modern branch/commit must include branch ${expectedBranch}`);
  }
  if (expectedCommit && !value.includes(expectedCommit)) {
    errors.push(`Run Metadata: Modern branch/commit must include commit ${expectedCommit}`);
  }
}

function verifyArtifactPointers(
  sections: Map<string, Map<string, string>>,
  errors: string[]
) {
  const metadata = sections.get("Run Metadata");
  if (!metadata) {
    return;
  }

  const expectedArtifacts = [
    { field: "Redacted readiness report", path: readinessReportPath },
    { field: "Redacted closeout summary", path: closeoutSummaryPath },
    { field: "Partial gate report", path: partialReportPath },
    { field: "Production evidence checklist", path: checklistReportPath },
  ];

  for (const artifact of expectedArtifacts) {
    if (!artifact.path) {
      continue;
    }
    const value = metadata.get(artifact.field) ?? "";
    if (!value.includes(artifact.path)) {
      errors.push(`Run Metadata: ${artifact.field} must include ${artifact.path}`);
    }
  }
}

function verifyFinalDecision(
  sections: Map<string, Map<string, string>>,
  errors: string[]
) {
  const decision = sections.get("Final Decision");
  if (!decision) {
    return;
  }

  const acceptedOrRetired = normalizedValue(decision.get("All gates accepted or explicitly retired") ?? "");
  if (!/\b(yes|accepted|retired)\b/.test(acceptedOrRetired)) {
    errors.push("Final Decision: all gates must be accepted or explicitly retired");
  }

  const remainingTickets = normalizedValue(decision.get("Remaining production tickets") ?? "");
  if (remainingTickets !== "none") {
    errors.push("Final Decision: remaining production tickets must be none");
  }

  const releaseDecision = normalizedValue(decision.get("Release decision") ?? "");
  if (releaseDecision !== "accepted") {
    errors.push("Final Decision: release decision must be accepted");
  }
}

function normalizedValue(value: string) {
  return value.trim().toLowerCase();
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function positionalArgs() {
  const args: string[] = [];
  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg.startsWith("--")) {
      if (!arg.includes("=") && process.argv[index + 1] && !process.argv[index + 1].startsWith("-")) {
        index += 1;
      }
      continue;
    }
    args.push(arg);
  }
  return args;
}
