import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type CommandResult = {
  status: number;
  stdout: string;
  stderr: string;
};

const script = "src/scripts/verify-production-acceptance-evidence-record.ts";
const template = readFileSync("docs/production-acceptance-evidence-template.md", "utf8");
const tmp = mkdtempSync(join(tmpdir(), "kiddzonl-evidence-record-"));

try {
  const validRecordPath = join(tmp, "production-acceptance-filled.md");
  writeFileSync(validRecordPath, fillTemplate(template), "utf8");
  const readinessReportPath = join(tmp, "readiness.json");
  writeFileSync(readinessReportPath, JSON.stringify(readinessReport(), null, 2), "utf8");

  const validRecord = runVerifier(validRecordPath, [`--readiness-report=${readinessReportPath}`]);
  assert.equal(validRecord.status, 0, validRecord.stdout + validRecord.stderr);
  assert.match(validRecord.stdout, /production acceptance evidence record verified/);
  assert.match(validRecord.stdout, /readiness\.json/);
  assert.match(validRecord.stdout, /"redacted": true/);

  const placeholderRecordPath = join(tmp, "production-acceptance-placeholder.md");
  writeFileSync(placeholderRecordPath, template, "utf8");

  const placeholderRecord = runVerifier(placeholderRecordPath);
  assert.equal(placeholderRecord.status, 1);
  assert.match(placeholderRecord.stderr, /placeholder\/empty value/);

  const secretRecordPath = join(tmp, "production-acceptance-secret.md");
  writeFileSync(
    secretRecordPath,
    fillTemplate(template).replace("release-ticket-verified", "https://example.invalid/private-release-ticket"),
    "utf8"
  );

  const secretRecord = runVerifier(secretRecordPath);
  assert.equal(secretRecord.status, 1);
  assert.match(secretRecord.stderr, /raw URLs/);

  const blockedReadinessReportPath = join(tmp, "blocked-readiness.json");
  writeFileSync(
    blockedReadinessReportPath,
    JSON.stringify(
      readinessReport({
        summary: { ready: 11, needsEvidence: 1, total: 12 },
        gateOverride: { gate: "PROD-NATIVE", status: "needs-evidence" },
      }),
      null,
      2
    ),
    "utf8"
  );

  const blockedReadiness = runVerifier(validRecordPath, [`--readiness-report=${blockedReadinessReportPath}`]);
  assert.equal(blockedReadiness.status, 1);
  assert.match(blockedReadiness.stderr, /expected all gates ready/);
  assert.match(blockedReadiness.stderr, /PROD-NATIVE status is needs-evidence/);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log("production acceptance evidence record contract assertions passed");

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
      if (
        field === "Field" ||
        field === "Evidence" ||
        /^-+$/.test(field) ||
        /^-+$/.test(value)
      ) {
        return line;
      }

      return `| ${field} | ${filledValueFor(field)} |`;
    })
    .join("\n");
}

function filledValueFor(field: string) {
  if (field === "Acceptance date") return "2026-06-10";
  if (field === "Environment") return "staging-production-import";
  if (field === "Modern branch/commit") return "`legacy-parity-runbook` / 0404c6a";
  if (field === "`audit-production-readiness.ts` result") return "12/12 ready";
  if (field === "Release decision") return "accepted";
  if (field === "Remaining production tickets") return "none";
  if (field === "Approval link/id") return "release-ticket-verified";
  return "accepted evidence recorded in release-ticket-verified";
}

function readinessReport(options: {
  summary?: { ready: number; needsEvidence: number; total: number };
  gateOverride?: { gate: string; status: string };
} = {}) {
  const gates = [
    "PROD-ACL",
    "PROD-BACKFILL",
    "PROD-CALLS",
    "PROD-CRON",
    "PROD-DUMPS",
    "PROD-MEDIA",
    "PROD-NATIVE",
    "PROD-NATURE",
    "PROD-NURSERY",
    "PROD-PRINT",
    "PROD-PROVIDERS",
    "PROD-RECON",
  ].map((gate) => ({
    gate,
    status: options.gateOverride?.gate === gate ? options.gateOverride.status : "ready-to-review",
    present: ["non-secret evidence pointer"],
    missing: [],
  }));

  return {
    generatedAt: "2026-06-10T00:00:00.000Z",
    redacted: true,
    summary: options.summary ?? { ready: 12, needsEvidence: 0, total: 12 },
    gates,
    providers: [],
    note: "No environment values, URLs, tokens, keys, passwords, or report contents are included.",
  };
}

function runVerifier(recordPath: string, args: string[] = []): CommandResult {
  try {
    const stdout = execFileSync("pnpm", ["tsx", script, recordPath, ...args], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const result = error as {
      status?: number;
      stdout?: string | Buffer;
      stderr?: string | Buffer;
    };
    return {
      status: result.status ?? 1,
      stdout: String(result.stdout ?? ""),
      stderr: String(result.stderr ?? ""),
    };
  }
}
