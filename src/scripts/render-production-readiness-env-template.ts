import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

type GateRequirement = {
  gate: string;
  requiredEvidencePointers: string[];
};

type ProviderRequirement = {
  provider: string;
  acceptedSetup: string;
};

type RequirementPayload = {
  redacted?: boolean;
  evidenceRequirements?: GateRequirement[];
  providerRequirements?: ProviderRequirement[];
};

type CloseoutPlan = {
  gates?: Array<{
    gate?: string;
    evidenceWorkOrder?: {
      finishCondition?: string;
      focusedCoverageRows?: string[];
      proofCommands?: string[];
    };
  }>;
};

const outputPath = optionValue("--out");
const gate = optionValue("--gate");
const releaseBranch = optionValue("--release-branch");
const releaseCommit = optionValue("--release-commit");
const acceptanceDate = optionValue("--acceptance-date");
const generatedAt = optionValue("--generated-at");
validateReleaseMetadata(releaseBranch, releaseCommit, acceptanceDate);
const includeWorkOrders = process.argv.includes("--include-work-orders");
const payload = loadRequirements(gate);
const closeoutWorkOrders = includeWorkOrders ? loadCloseoutWorkOrders(gate) : new Map<string, NonNullable<NonNullable<CloseoutPlan["gates"]>[number]["evidenceWorkOrder"]>>();
const rendered = renderTemplate(payload, gate, closeoutWorkOrders, {
  releaseBranch,
  releaseCommit,
  acceptanceDate,
});

if (outputPath) {
  const dir = dirname(outputPath);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, rendered, "utf8");
}

process.stdout.write(rendered);

function loadRequirements(gate: string | null) {
  const args = [
    "tsx",
    "src/scripts/audit-production-readiness.ts",
    "--list-requirements",
    "--json",
    ...(gate ? [`--gate=${gate}`] : []),
  ];
  const raw = execFileSync("pnpm", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const parsed = JSON.parse(raw) as RequirementPayload;
  if (parsed.redacted !== true) {
    throw new Error("readiness requirement source must be redacted");
  }
  return parsed;
}

function loadCloseoutWorkOrders(gate: string | null) {
  const raw = execFileSync("pnpm", [
    "tsx",
    "src/scripts/report-production-closeout-plan.ts",
    "--json",
    ...optionalArg("--generated-at", generatedAt),
    ...optionalArg("--release-branch", releaseBranch),
    ...optionalArg("--release-commit", releaseCommit),
    ...optionalArg("--acceptance-date", acceptanceDate),
  ], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const plan = JSON.parse(raw) as CloseoutPlan;
  const workOrders = new Map<string, NonNullable<NonNullable<CloseoutPlan["gates"]>[number]["evidenceWorkOrder"]>>();
  for (const entry of plan.gates ?? []) {
    if (!entry.gate || !entry.evidenceWorkOrder) continue;
    if (gate && entry.gate !== gate.trim().toUpperCase()) continue;
    workOrders.set(entry.gate, entry.evidenceWorkOrder);
  }
  return workOrders;
}

function renderTemplate(
  payload: RequirementPayload,
  gate: string | null,
  closeoutWorkOrders: Map<string, NonNullable<NonNullable<CloseoutPlan["gates"]>[number]["evidenceWorkOrder"]>>,
  release: {
    releaseBranch: string | null;
    releaseCommit: string | null;
    acceptanceDate: string | null;
  }
) {
  const lines = [
    "# KiddzOnline production readiness private env template",
    "# Fill this file outside git, then pass it with:",
    "# pnpm tsx src/scripts/audit-production-readiness.ts --env-file=/secure/private-readiness.env",
    "# Values may be private file paths or external evidence record IDs.",
    "# Keep URLs, tokens, keys, phone numbers, and payload bodies out of committed docs.",
    "",
    `# Scope: ${gate ? gate.trim().toUpperCase() : "all production acceptance gates"}`,
  ];
  if (release.releaseBranch || release.releaseCommit || release.acceptanceDate) {
    lines.push(
      `# Release branch: ${release.releaseBranch ?? "unspecified"}`,
      `# Release commit: ${release.releaseCommit ?? "unspecified"}`,
      `# Acceptance date: ${release.acceptanceDate ?? "unspecified"}`
    );
  }
  lines.push("");

  const seen = new Set<string>();
  for (const requirement of payload.evidenceRequirements ?? []) {
    lines.push(`# ${requirement.gate}`);
    addWorkOrderComments(lines, closeoutWorkOrders.get(requirement.gate));
    for (const pointer of requirement.requiredEvidencePointers ?? []) {
      const names = pointer.split(/\s+or\s+/i).map((name) => name.trim()).filter(Boolean);
      if (names.length > 1) {
        lines.push(`# Provide at least one of: ${names.join(" or ")}`);
      }
      for (const name of names) {
        addEnvLine(lines, seen, name);
      }
    }
    lines.push("");
  }

  const providerRequirements = payload.providerRequirements ?? [];
  if (providerRequirements.length > 0) {
    lines.push("# PROD-PROVIDERS");
    addWorkOrderComments(lines, closeoutWorkOrders.get("PROD-PROVIDERS"));
    for (const requirement of providerRequirements) {
      lines.push(`# ${requirement.provider}: ${requirement.acceptedSetup}`);
    }
    lines.push("");
    for (const name of providerEnvNames()) {
      addEnvLine(lines, seen, name);
    }
    lines.push("");
  }

  lines.push("# After filling the file, archive only redacted command output:");
  lines.push(`# pnpm tsx src/scripts/audit-production-readiness.ts --env-file=/secure/private-readiness.env --json --out=/tmp/kiddzonl-production-readiness.json --generated-at=${generatedAt ?? "<release-generated-at-iso>"}`);
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function addWorkOrderComments(lines: string[], workOrder: NonNullable<NonNullable<CloseoutPlan["gates"]>[number]["evidenceWorkOrder"]> | undefined) {
  if (!workOrder) return;
  if (workOrder.finishCondition) {
    lines.push(`# Finish condition: ${workOrder.finishCondition}`);
  }
  if ((workOrder.focusedCoverageRows?.length ?? 0) > 0) {
    lines.push(`# Focused coverage rows: ${workOrder.focusedCoverageRows?.join(", ")}`);
  }
  for (const command of workOrder.proofCommands ?? []) {
    lines.push(`# Proof command: ${command}`);
  }
}

function addEnvLine(lines: string[], seen: Set<string>, name: string) {
  if (!/^[A-Z_][A-Z0-9_]*$/.test(name) || seen.has(name)) {
    return;
  }
  seen.add(name);
  lines.push(`${name}=replace-me`);
}

function providerEnvNames() {
  return [
    "PROVIDER_DELIVERY_ACCEPTANCE_REPORT",
    "PROVIDER_CHANNEL_ROLLOUT_REPORT",
    "PROVIDER_RESPONSE_ID_AUDIT_REPORT",
    "PROVIDER_CHANNEL_DECISION_REPORT",
    "PROVIDER_PARTIAL_ROW_COVERAGE_REPORT",
    "PUSH_DELIVERY_PROVIDER",
    "PUSH_DELIVERY_WEBHOOK_URL",
    "ONESIGNAL_APP_ID",
    "ONESIGNAL_REST_API_KEY",
    "ONESIGNAL_API_KEY",
    "EMAIL_DELIVERY_PROVIDER",
    "EMAIL_DELIVERY_WEBHOOK_URL",
    "RESEND_API_KEY",
    "EMAIL_FROM",
    "SMS_DELIVERY_PROVIDER",
    "SMS_DELIVERY_WEBHOOK_URL",
    "WHATSAPP_DELIVERY_PROVIDER",
    "WHATSAPP_DELIVERY_WEBHOOK_URL",
    "LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL",
    "MESSAGE_CHANNEL_DELIVERY_WEBHOOK_URL",
  ];
}

function optionValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1] ?? null;

  return null;
}

function optionalArg(name: string, value: string | null | undefined) {
  return value ? [`${name}=${value}`] : [];
}

function validateReleaseMetadata(
  branch: string | null,
  commit: string | null,
  date: string | null
) {
  if (!branch && !commit && !date) return;
  if (!branch || !commit || !date) {
    console.error("--release-branch, --release-commit, and --acceptance-date must be provided together");
    process.exit(2);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error("--acceptance-date must use YYYY-MM-DD format");
    process.exit(2);
  }
}
