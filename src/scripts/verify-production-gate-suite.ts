import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

type ParityRow = {
  status?: string;
  [key: string]: unknown;
};

const checks = [
  {
    label: "production acceptance gates contract",
    command: ["pnpm", "tsx", "src/scripts/verify-production-acceptance-gates-contract.ts"],
  },
  {
    label: "production readiness audit contract",
    command: ["pnpm", "tsx", "src/scripts/verify-production-readiness-audit-contract.ts"],
  },
  {
    label: "production acceptance evidence record contract",
    command: ["pnpm", "tsx", "src/scripts/verify-production-acceptance-evidence-record-contract.ts"],
  },
  {
    label: "production closeout contract",
    command: ["pnpm", "tsx", "src/scripts/verify-production-closeout-contract.ts"],
  },
  {
    label: "production partial report contract",
    command: ["pnpm", "tsx", "src/scripts/verify-production-partial-report-contract.ts"],
  },
  {
    label: "production evidence checklist contract",
    command: ["pnpm", "tsx", "src/scripts/verify-production-evidence-checklist-contract.ts"],
  },
  {
    label: "page parity matrix JSON",
    command: ["python3", "-m", "json.tool", "docs/page-parity-matrix.json"],
  },
] as const;

for (const check of checks) {
  const [bin, ...args] = check.command;
  execFileSync(bin, args, {
    cwd: process.cwd(),
    stdio: check.label === "page parity matrix JSON" ? "ignore" : "inherit",
  });
}

const tracker = trackerSummary();

assert.equal(tracker.total, 1713, "production gate suite must be updated when total parity rows change");
assert.equal(tracker.partial, 17, "production gate suite must be updated when partial parity rows change");
assert.equal(tracker.donePct, 99);
assert.equal(tracker.leftPct, 1);

console.log(
  JSON.stringify(
    {
      status: "production gate suite passed",
      tracker,
    },
    null,
    2
  )
);

function trackerSummary() {
  const matrix = JSON.parse(readFileSync("docs/page-parity-matrix.json", "utf8")) as ParityRow[];
  let total = 0;
  let partial = 0;

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    const row = value as ParityRow;
    if (typeof row.status === "string") {
      total += 1;
      if (row.status.toLowerCase().startsWith("partial")) {
        partial += 1;
      }
    }

    Object.values(row).forEach(walk);
  }

  walk(matrix);
  const complete = total - partial;
  const donePct = Math.round((complete / total) * 1000) / 10;
  const leftPct = Math.round((100 - donePct) * 10) / 10;

  return {
    total,
    complete,
    partial,
    donePct,
    leftPct,
  };
}
