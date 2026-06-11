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

const outputPath = optionValue("--out");
const gate = optionValue("--gate");
const payload = loadRequirements(gate);
const rendered = renderTemplate(payload, gate);

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

function renderTemplate(payload: RequirementPayload, gate: string | null) {
  const lines = [
    "# KiddzOnline production readiness private env template",
    "# Fill this file outside git, then pass it with:",
    "# pnpm tsx src/scripts/audit-production-readiness.ts --env-file=/secure/private-readiness.env",
    "# Values may be private file paths or external evidence record IDs.",
    "# Keep URLs, tokens, keys, phone numbers, and payload bodies out of committed docs.",
    "",
    `# Scope: ${gate ? gate.trim().toUpperCase() : "all production acceptance gates"}`,
    "",
  ];

  const seen = new Set<string>();
  for (const requirement of payload.evidenceRequirements ?? []) {
    lines.push(`# ${requirement.gate}`);
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
  lines.push("# pnpm tsx src/scripts/audit-production-readiness.ts --env-file=/secure/private-readiness.env --json --out=/tmp/kiddzonl-production-readiness.json --generated-at=<release-generated-at-iso>");
  lines.push("");

  return `${lines.join("\n")}\n`;
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
