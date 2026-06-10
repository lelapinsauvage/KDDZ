import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const envFilePath = optionValue("--env-file");
const evidenceRecordPath = optionValue("--evidence-record");
const outputPath = optionValue("--out") ?? "/tmp/kiddzonl-production-readiness.json";
const summaryOutputPath = optionValue("--summary-out");
const branch = optionValue("--branch") ?? gitOutput(["branch", "--show-current"]);
const commit = optionValue("--commit") ?? gitOutput(["rev-parse", "HEAD"]);

if (!envFilePath || !evidenceRecordPath) {
  console.error(
    "Usage: pnpm tsx src/scripts/run-production-closeout.ts --env-file=<private-readiness.env> --evidence-record=<production-acceptance-evidence.md> [--out=<readiness.json>] [--summary-out=<closeout-summary.json>] [--branch=<branch>] [--commit=<sha>]"
  );
  process.exit(2);
}

ensureParentDir(outputPath);

run("pnpm", [
  "tsx",
  "src/scripts/audit-production-readiness.ts",
  `--env-file=${envFilePath}`,
  `--out=${outputPath}`,
]);

run("pnpm", [
  "tsx",
  "src/scripts/verify-production-acceptance-evidence-record.ts",
  evidenceRecordPath,
  `--readiness-report=${outputPath}`,
  `--branch=${branch}`,
  `--commit=${commit}`,
]);

const summary = {
  status: "production closeout verified",
  readinessReport: outputPath,
  evidenceRecord: evidenceRecordPath,
  branch,
  commit,
  redacted: true,
};

if (summaryOutputPath) {
  ensureParentDir(summaryOutputPath);
  writeFileSync(summaryOutputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(summary, null, 2));

function run(command: string, args: string[]) {
  execFileSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

function gitOutput(args: string[]) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function ensureParentDir(path: string) {
  const dir = dirname(path);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}
