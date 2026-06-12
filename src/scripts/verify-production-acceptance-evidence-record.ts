import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  productionEvidencePlaceholderValues,
  productionGateSections,
  requiredProductionEvidenceSections,
} from "./production-acceptance-evidence-spec";

type ReadinessReport = {
  generatedAt?: string;
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

type CloseoutSummary = {
  generatedAt?: string;
  requireZeroPartials?: boolean;
  parityTracker?: {
    partial?: number | null;
  };
  partialReportSummary?: {
    partialRows?: number | null;
  };
  evidenceChecklistSummary?: {
    blockingPartialRows?: number | null;
  };
};

type PartialReport = {
  generatedAt?: string;
  summary?: {
    partialRows?: number;
  };
};

type EvidenceChecklist = {
  generatedAt?: string;
  summary?: {
    blockingPartialRows?: number;
  };
};

type PreflightManifest = {
  generatedAt?: string;
  blockingGateSummary?: {
    blockingPartialRows?: number;
    blockingGateLinks?: number;
    closeoutMode?: string;
    canCloseLocally?: boolean;
  };
};

const recordPath = positionalArgs()[0];
const readinessReportPath = optionValue("--readiness-report");
const closeoutSummaryPath = optionValue("--summary-report");
const partialReportPath = optionValue("--partial-report");
const checklistReportPath = optionValue("--checklist-report");
const preflightManifestPath = optionValue("--preflight-manifest");
const expectedReadinessDigest = optionValue("--readiness-digest");
const expectedCloseoutDigest = optionValue("--summary-digest");
const expectedPartialDigest = optionValue("--partial-digest");
const expectedChecklistDigest = optionValue("--checklist-digest");
const expectedPreflightDigest = optionValue("--preflight-digest");
const expectedBranch = optionValue("--branch");
const expectedCommit = optionValue("--commit");
const expectedAcceptanceDate = optionValue("--acceptance-date");
const requireZeroArtifacts = process.argv.includes("--require-zero-artifacts");

if (!recordPath || recordPath.startsWith("-")) {
  console.error(
    "Usage: pnpm tsx src/scripts/verify-production-acceptance-evidence-record.ts <filled-production-evidence.md> [--readiness-report=<redacted-readiness.json>] [--summary-report=<closeout-summary.json>] [--partial-report=<partials.json>] [--checklist-report=<evidence-checklist.json>] [--preflight-manifest=<preflight-artifacts.json>] [--readiness-digest=<sha256>] [--summary-digest=<sha256>] [--partial-digest=<sha256>] [--checklist-digest=<sha256>] [--preflight-digest=<sha256>] [--branch=<branch>] [--commit=<sha>] [--acceptance-date=<YYYY-MM-DD>] [--require-zero-artifacts]"
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
verifyArtifactDigests(sections, errors);
if (requireZeroArtifacts) {
  verifyFinalArtifactClosure(errors);
}
verifyBranchAndCommit(sections, errors);
verifyAcceptanceDate(sections, errors);
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
      preflightManifest: preflightManifestPath ?? null,
      expectedDigests: {
        readinessReport: expectedReadinessDigest ?? null,
        closeoutSummary: expectedCloseoutDigest ?? null,
        partialReport: expectedPartialDigest ?? null,
        evidenceChecklist: expectedChecklistDigest ?? null,
        preflightManifest: expectedPreflightDigest ?? null,
      },
      branch: expectedBranch ?? null,
      commit: expectedCommit ?? null,
      acceptanceDate: expectedAcceptanceDate ?? null,
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

  if (productionEvidencePlaceholderValues.includes(normalized)) return true;
  if (/^<[^>]+>$/.test(normalized)) return true;
  if (/^non-secret\s+.*\b(id|path|label|pointer)\b/.test(normalized)) return true;
  if (/^(replace|todo|tbd|changeme)\b/.test(normalized)) return true;

  return false;
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
    if (/^[a-f0-9]{64}$/i.test(candidate.trim())) {
      continue;
    }
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

function verifyAcceptanceDate(
  sections: Map<string, Map<string, string>>,
  errors: string[]
) {
  if (!expectedAcceptanceDate) {
    return;
  }

  const value = sections.get("Run Metadata")?.get("Acceptance date") ?? "";
  if (!value.includes(expectedAcceptanceDate)) {
    errors.push(`Run Metadata: Acceptance date must include ${expectedAcceptanceDate}`);
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
    { field: "Production preflight manifest", path: preflightManifestPath },
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

function verifyArtifactDigests(
  sections: Map<string, Map<string, string>>,
  errors: string[]
) {
  const metadata = sections.get("Run Metadata");
  if (!metadata) {
    return;
  }

  const expectedArtifacts = [
    { field: "Redacted readiness report SHA-256", path: expectedReadinessDigest ? readinessReportPath : null, digest: expectedReadinessDigest },
    { field: "Redacted closeout summary SHA-256", path: expectedCloseoutDigest ? closeoutSummaryPath : null, digest: expectedCloseoutDigest },
    { field: "Partial gate report SHA-256", path: partialReportPath, digest: expectedPartialDigest },
    { field: "Production evidence checklist SHA-256", path: checklistReportPath, digest: expectedChecklistDigest },
    { field: "Production preflight manifest SHA-256", path: preflightManifestPath, digest: expectedPreflightDigest },
  ];

  for (const artifact of expectedArtifacts) {
    if (!artifact.path && !artifact.digest) {
      continue;
    }

    const expectedDigest = artifact.path ? sha256File(artifact.path) : artifact.digest!;
    if (artifact.path && artifact.digest && artifact.digest !== expectedDigest) {
      errors.push(`${artifact.field}: expected digest argument must match ${artifact.path}`);
      continue;
    }

    const value = metadata.get(artifact.field) ?? "";
    if (!value.includes(expectedDigest)) {
      errors.push(`Run Metadata: ${artifact.field} must include ${expectedDigest}`);
    }
  }

  if (closeoutSummaryPath && !expectedCloseoutDigest) {
    const value = metadata.get("Redacted closeout summary SHA-256") ?? "";
    if (!value.includes("verified in evidence package manifest")) {
      errors.push(
        "Run Metadata: Redacted closeout summary SHA-256 must say verified in evidence package manifest when --summary-digest is not supplied"
      );
    }
  }
}

function verifyFinalArtifactClosure(errors: string[]) {
  const generatedAtValues = new Map<string, string>();

  if (readinessReportPath) {
    const report = readJsonArtifact<ReadinessReport>(readinessReportPath, "readiness report", errors);
    collectGeneratedAt(generatedAtValues, "readiness report", report?.generatedAt, errors);
  }

  if (closeoutSummaryPath) {
    const summary = readJsonArtifact<CloseoutSummary>(closeoutSummaryPath, "closeout summary", errors);
    collectGeneratedAt(generatedAtValues, "closeout summary", summary?.generatedAt, errors);
    if (summary?.requireZeroPartials === false) {
      errors.push("closeout summary: requireZeroPartials must not be false for final acceptance");
    }
    requireZero(summary?.parityTracker?.partial, "closeout summary parityTracker.partial", errors);
    requireZero(summary?.partialReportSummary?.partialRows, "closeout summary partialReportSummary.partialRows", errors);
    requireZero(
      summary?.evidenceChecklistSummary?.blockingPartialRows,
      "closeout summary evidenceChecklistSummary.blockingPartialRows",
      errors
    );
  }

  if (partialReportPath) {
    const partialReport = readJsonArtifact<PartialReport>(partialReportPath, "partial report", errors);
    collectGeneratedAt(generatedAtValues, "partial report", partialReport?.generatedAt, errors);
    requireZero(partialReport?.summary?.partialRows, "partial report summary.partialRows", errors);
  }

  if (checklistReportPath) {
    const checklist = readJsonArtifact<EvidenceChecklist>(checklistReportPath, "evidence checklist", errors);
    collectGeneratedAt(generatedAtValues, "evidence checklist", checklist?.generatedAt, errors);
    requireZero(checklist?.summary?.blockingPartialRows, "evidence checklist summary.blockingPartialRows", errors);
  }

  if (preflightManifestPath) {
    const preflight = readJsonArtifact<PreflightManifest>(preflightManifestPath, "preflight manifest", errors);
    collectGeneratedAt(generatedAtValues, "preflight manifest", preflight?.generatedAt, errors);
    requireZero(
      preflight?.blockingGateSummary?.blockingPartialRows,
      "preflight manifest blockingGateSummary.blockingPartialRows",
      errors
    );
    requireZero(
      preflight?.blockingGateSummary?.blockingGateLinks,
      "preflight manifest blockingGateSummary.blockingGateLinks",
      errors
    );
    if (preflight?.blockingGateSummary?.canCloseLocally !== true) {
      errors.push("preflight manifest: blockingGateSummary.canCloseLocally must be true for final acceptance");
    }
    if (preflight?.blockingGateSummary?.closeoutMode && preflight.blockingGateSummary.closeoutMode !== "ready-for-final-closeout") {
      errors.push("preflight manifest: blockingGateSummary.closeoutMode must be ready-for-final-closeout");
    }
  }

  const uniqueGeneratedAt = new Set(generatedAtValues.values());
  if (uniqueGeneratedAt.size > 1) {
    errors.push(
      `artifact generatedAt values must match: ${[...generatedAtValues.entries()]
        .map(([label, value]) => `${label}=${value}`)
        .join(", ")}`
    );
  }
}

function readJsonArtifact<T>(path: string, label: string, errors: string[]) {
  try {
    const text = readFileSync(path, "utf8");
    assertNoSensitiveContent(text);
    return JSON.parse(text) as T;
  } catch (error) {
    errors.push(`${label}: could not read JSON artifact (${(error as Error).message})`);
    return null;
  }
}

function collectGeneratedAt(
  generatedAtValues: Map<string, string>,
  label: string,
  value: string | undefined,
  errors: string[]
) {
  if (!value) {
    errors.push(`${label}: missing generatedAt`);
    return;
  }
  try {
    if (new Date(value).toISOString() !== value) {
      errors.push(`${label}: generatedAt must be an ISO timestamp`);
      return;
    }
  } catch {
    errors.push(`${label}: generatedAt must be an ISO timestamp`);
    return;
  }
  generatedAtValues.set(label, value);
}

function requireZero(value: number | null | undefined, label: string, errors: string[]) {
  if (value === undefined || value === null) {
    return;
  }
  if (value !== 0) {
    errors.push(`${label} must be 0 for final acceptance, got ${value}`);
  }
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
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
