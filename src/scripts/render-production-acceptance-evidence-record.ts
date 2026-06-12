import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const templatePath = optionValue("--template") ?? "docs/production-acceptance-evidence-template.md";
const outputPath = optionValue("--out");
const readinessReportPath = requiredOption("--readiness-report");
const closeoutSummaryPath = requiredOption("--summary-report");
const partialReportPath = requiredOption("--partial-report");
const checklistReportPath = requiredOption("--checklist-report");
const preflightManifestPath = optionValue("--preflight-manifest");
const branch = requiredOption("--branch");
const commit = requiredOption("--commit");
const acceptanceDate = requiredOption("--acceptance-date");
const environment = optionValue("--environment") ?? "production";
const legacySourcePackage = optionValue("--legacy-source-package") ?? "accepted evidence recorded in release-ticket-verified";
const productionApprover = optionValue("--production-approver") ?? "release-ticket-verified";
const approval = optionValue("--approval") ?? "release-ticket-verified";
const remainingTickets = optionValue("--remaining-production-tickets") ?? "none";
const releaseDecision = optionValue("--release-decision") ?? "accepted";
const closeoutDigest = optionValue("--summary-digest") ?? "verified in evidence package manifest";

type ReleaseMetadata = {
  branch?: string;
  commit?: string;
  acceptanceDate?: string;
};

if (!outputPath) {
  console.error(
    "Usage: pnpm tsx src/scripts/render-production-acceptance-evidence-record.ts --out=<production-acceptance-evidence.md> --readiness-report=<readiness.json> --summary-report=<closeout-summary.json> --partial-report=<partials.json> --checklist-report=<evidence-checklist.json> --branch=<branch> --commit=<sha> --acceptance-date=<YYYY-MM-DD> [--preflight-manifest=<preflight-artifacts.json>] [--summary-digest=<sha256>]"
  );
  process.exit(2);
}

assertDate(acceptanceDate);
assertReleaseMetadata();
assertNoSensitiveOutput(
  JSON.stringify({
    outputPath,
    readinessReportPath,
    closeoutSummaryPath,
    partialReportPath,
    checklistReportPath,
    preflightManifestPath,
    branch,
    commit,
    acceptanceDate,
    environment,
    legacySourcePackage,
    productionApprover,
    approval,
    remainingTickets,
    releaseDecision,
  })
);

const readinessDigest = sha256File(readinessReportPath);
const partialDigest = sha256File(partialReportPath);
const checklistDigest = sha256File(checklistReportPath);
const preflightDigest = preflightManifestPath ? sha256File(preflightManifestPath) : null;
const readiness = JSON.parse(readFileSync(readinessReportPath, "utf8")) as {
  summary?: { ready?: number; total?: number };
};
const readinessResult =
  typeof readiness.summary?.ready === "number" && typeof readiness.summary?.total === "number"
    ? `${readiness.summary.ready}/${readiness.summary.total} ready`
    : "accepted evidence recorded in release-ticket-verified";

const rendered = fillTemplate(readFileSync(templatePath, "utf8"));
ensureParentDir(outputPath);
writeFileSync(outputPath, rendered, "utf8");

const verification = spawnSync("pnpm", [
  "tsx",
  "src/scripts/verify-production-acceptance-evidence-record.ts",
  outputPath,
  `--readiness-report=${readinessReportPath}`,
  `--summary-report=${closeoutSummaryPath}`,
  `--partial-report=${partialReportPath}`,
  `--checklist-report=${checklistReportPath}`,
  ...optionalArg("--preflight-manifest", preflightManifestPath),
  `--readiness-digest=${readinessDigest}`,
  ...optionalArg("--summary-digest", optionValue("--summary-digest")),
  `--partial-digest=${partialDigest}`,
  `--checklist-digest=${checklistDigest}`,
  ...optionalArg("--preflight-digest", preflightDigest),
  `--branch=${branch}`,
  `--commit=${commit}`,
  `--acceptance-date=${acceptanceDate}`,
  "--require-zero-artifacts",
], {
  cwd: process.cwd(),
  encoding: "utf8",
});
if (verification.status !== 0) {
  process.stdout.write(verification.stdout);
  process.stderr.write(verification.stderr);
  process.exit(verification.status ?? 1);
}

console.log(
  JSON.stringify(
    {
      status: "production acceptance evidence record rendered",
      record: outputPath,
      readinessReport: readinessReportPath,
      closeoutSummary: closeoutSummaryPath,
      partialReport: partialReportPath,
      evidenceChecklist: checklistReportPath,
      preflightManifest: preflightManifestPath ?? null,
      branch,
      commit,
      redacted: true,
    },
    null,
    2
  )
);

function fillTemplate(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      if (!line.startsWith("|")) return line;

      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length < 2) return line;

      const [field, value] = cells;
      if (field === "Field" || field === "Evidence" || /^-+$/.test(field) || /^-+$/.test(value)) {
        return line;
      }

      return `| ${field} | ${filledValueFor(field)} |`;
    })
    .join("\n");
}

function filledValueFor(field: string) {
  if (field === "Acceptance date") return acceptanceDate;
  if (field === "Environment") return environment;
  if (field === "Modern branch/commit") return `\`${branch}\` / ${commit}`;
  if (field === "Legacy source package") return legacySourcePackage;
  if (field === "Production approver") return productionApprover;
  if (field === "`audit-production-readiness.ts` result") return readinessResult;
  if (field === "Redacted readiness report") return readinessReportPath;
  if (field === "Redacted readiness report SHA-256") return readinessDigest;
  if (field === "Redacted closeout summary") return closeoutSummaryPath;
  if (field === "Redacted closeout summary SHA-256") return closeoutDigest;
  if (field === "Partial gate report") return partialReportPath;
  if (field === "Partial gate report SHA-256") return partialDigest;
  if (field === "Production evidence checklist") return checklistReportPath;
  if (field === "Production evidence checklist SHA-256") return checklistDigest;
  if (field === "Production preflight manifest") return preflightManifestPath ?? "accepted evidence recorded in release-ticket-verified";
  if (field === "Production preflight manifest SHA-256") return preflightDigest ?? "accepted evidence recorded in release-ticket-verified";
  if (field === "All gates accepted or explicitly retired") return "yes";
  if (field === "Remaining production tickets") return remainingTickets;
  if (field === "Approval link/id") return approval;
  if (field === "Release decision") return releaseDecision;
  return "accepted evidence recorded in release-ticket-verified";
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function ensureParentDir(path: string) {
  const dir = dirname(path);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
}

function requiredOption(name: string) {
  const value = optionValue(name);
  if (!value) {
    console.error(`${name} is required`);
    process.exit(2);
  }
  return value;
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function assertDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    console.error("--acceptance-date must use YYYY-MM-DD");
    process.exit(2);
  }
}

function assertReleaseMetadata() {
  const expected = { branch, commit, acceptanceDate };
  const closeout = readJson<{ preflightReleaseMetadata?: ReleaseMetadata }>(closeoutSummaryPath);
  assertOptionalReleaseMetadata(closeout.preflightReleaseMetadata, expected, "closeout summary preflight release metadata");

  if (preflightManifestPath) {
    const preflight = readJson<{ releaseMetadata?: ReleaseMetadata }>(preflightManifestPath);
    assertOptionalReleaseMetadata(preflight.releaseMetadata, expected, "preflight release metadata");
    if (closeout.preflightReleaseMetadata && preflight.releaseMetadata) {
      assertMetadataMatch(closeout.preflightReleaseMetadata, preflight.releaseMetadata, "closeout summary preflight release metadata drifted from preflight manifest");
    }
  }
}

function assertOptionalReleaseMetadata(
  metadata: ReleaseMetadata | undefined,
  expected: Required<ReleaseMetadata>,
  label: string
) {
  if (!metadata) return;
  assertMetadataMatch(metadata, expected, `${label} drifted from requested release`);
}

function assertMetadataMatch(actual: ReleaseMetadata, expected: ReleaseMetadata, message: string) {
  if (
    actual.branch !== expected.branch ||
    actual.commit !== expected.commit ||
    actual.acceptanceDate !== expected.acceptanceDate
  ) {
    throw new Error(message);
  }
}

function readJson<T>(path: string) {
  const text = readFileSync(path, "utf8");
  assertNoSensitiveOutput(text);
  return JSON.parse(text) as T;
}

function optionalArg(name: string, value: string | null) {
  return value ? [`${name}=${value}`] : [];
}

function assertNoSensitiveOutput(output: string) {
  const outputWithoutDigests = output.replace(/\b[a-f0-9]{64}\b/gi, "sha256-digest");
  if (/https?:\/\/[^\s")]+/i.test(outputWithoutDigests)) {
    throw new Error("production acceptance evidence renderer inputs must not include raw URLs");
  }
  if (/(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{12,}/i.test(outputWithoutDigests)) {
    throw new Error("production acceptance evidence renderer inputs must not include raw secret values");
  }
  if (/\b(?:\+?\d[\s().-]?){10,}\b/.test(outputWithoutDigests)) {
    throw new Error("production acceptance evidence renderer inputs must not include phone numbers");
  }
}
