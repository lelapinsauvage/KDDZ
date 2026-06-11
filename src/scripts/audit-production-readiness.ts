import { dirname } from "node:path";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

type GateId =
  | "PROD-DUMPS"
  | "PROD-MEDIA"
  | "PROD-RECON"
  | "PROD-CRON"
  | "PROD-PROVIDERS"
  | "PROD-NATIVE"
  | "PROD-NATURE"
  | "PROD-PRINT"
  | "PROD-CALLS"
  | "PROD-NURSERY"
  | "PROD-ACL"
  | "PROD-BACKFILL";

type GateAudit = {
  gate: GateId;
  status: "ready-to-review" | "needs-evidence";
  present: string[];
  missing: string[];
};

type ProviderAudit = {
  name: string;
  status: "configured" | "disabled" | "incomplete";
  present: string[];
  missing: string[];
};

const evidenceGateRequirements: Array<{
  gate: GateId;
  env: string[];
}> = [
  {
    gate: "PROD-DUMPS",
    env: [
      "LEGACY_PRODUCTION_DUMP_MANIFEST",
      "LEGACY_FIRST_MIGRATION_SOURCE_REPORT",
    ],
  },
  {
    gate: "PROD-MEDIA",
    env: [
      "LEGACY_MEDIA_AUDIT_REPORT",
      "LEGACY_MEDIA_EXPORT_MANIFEST",
      "LEGACY_MEDIA_UPLOAD_MANIFEST",
      "LEGACY_MEDIA_URL_APPLY_MANIFEST",
    ],
  },
  {
    gate: "PROD-RECON",
    env: [
      "MIGRATION_RECONCILIATION_REPORT",
      "MIGRATION_RECONCILIATION_ACCEPTANCE_REPORT",
    ],
  },
  {
    gate: "PROD-CRON",
    env: [
      "PRODUCTION_CRONTAB_EVIDENCE",
      "CRON_HELPER_DECISION_REPORT",
      "HOSTED_SCHEDULER_EVIDENCE",
    ],
  },
  {
    gate: "PROD-NATIVE",
    env: ["NATIVE_IOS_ACCEPTANCE_REPORT", "NATIVE_ANDROID_ACCEPTANCE_REPORT"],
  },
  {
    gate: "PROD-NATURE",
    env: ["NOTIFICATIONS_NATURE_ACCEPTANCE_REPORT"],
  },
  {
    gate: "PROD-PRINT",
    env: ["PRINT_STATIONERY_ACCEPTANCE_REPORT"],
  },
  {
    gate: "PROD-CALLS",
    env: ["REAL_CALL_ROWS_ACCEPTANCE_REPORT"],
  },
  {
    gate: "PROD-NURSERY",
    env: ["NURSERY_COMPLIANCE_ACCEPTANCE_REPORT"],
  },
  {
    gate: "PROD-ACL",
    env: ["LEGACY_ACL_ACCEPTANCE_REPORT"],
  },
  {
    gate: "PROD-BACKFILL",
    env: ["LEGACY_BACKFILL_ACCEPTANCE_REPORT"],
  },
];

const json = process.argv.includes("--json");
const outputPath = optionValue("--out");
const envFilePath = optionValue("--env-file");
const generatedAt = generatedAtValue();
if (envFilePath) {
  loadEnvFile(envFilePath);
}
const listRequirements = process.argv.includes("--list-requirements");
const gateFilter = parseGateFilter(optionValue("--gate"));

if (listRequirements) {
  printRequirements({ json, gateFilter });
  process.exit(0);
}

const evidenceAudits = evidenceGateRequirements.map(auditEvidenceGate);
const providerAudits = [auditPushProvider(), auditEmailProvider(), auditChannelProvider("SMS"), auditChannelProvider("WHATSAPP")];
const providerDeliveryAudit = auditAnyEnv(["PROVIDER_DELIVERY_ACCEPTANCE_REPORT"]);
const cronSecretAudit = auditAnyEnv(["CRON_SECRET", "VERCEL_CRON_SECRET"]);
const providerGate: GateAudit = {
  gate: "PROD-PROVIDERS",
  status:
    providerAudits.every((audit) => audit.status !== "incomplete") &&
    providerDeliveryAudit.missing.length === 0
      ? "ready-to-review"
      : "needs-evidence",
  present: [
    ...providerAudits.flatMap((audit) => audit.present.map((item) => `${audit.name}:${item}`)),
    ...providerDeliveryAudit.present.map((item) => `delivery-evidence:${item}`),
  ],
  missing: [
    ...providerAudits.flatMap((audit) => audit.missing.map((item) => `${audit.name}:${item}`)),
    ...providerDeliveryAudit.missing.map((item) => `delivery-evidence:${item}`),
  ],
};
const cronGate = evidenceAudits.find((audit) => audit.gate === "PROD-CRON");
if (cronGate) {
  cronGate.present.push(...cronSecretAudit.present);
  cronGate.missing.push(...cronSecretAudit.missing);
  cronGate.status = cronGate.missing.length === 0 ? "ready-to-review" : "needs-evidence";
}

const allGateAudits = [...evidenceAudits, providerGate].sort((a, b) => a.gate.localeCompare(b.gate));
const gateAudits = gateFilter ? allGateAudits.filter((audit) => audit.gate === gateFilter) : allGateAudits;
const summary = {
  ready: gateAudits.filter((audit) => audit.status === "ready-to-review").length,
  needsEvidence: gateAudits.filter((audit) => audit.status === "needs-evidence").length,
  total: gateAudits.length,
};
const report = {
  schemaVersion: 1,
  generatedAt,
  redacted: true,
  summary,
  gates: gateAudits,
  providers: providerAudits,
  note: "No environment values, URLs, tokens, keys, passwords, or report contents are included.",
};

if (outputPath) {
  writeRedactedReport(outputPath, report);
}

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("Production readiness audit (redacted)");
  console.log(`Ready to review: ${summary.ready}/${summary.total}`);
  console.log(`Needs evidence: ${summary.needsEvidence}/${summary.total}`);
  console.log("");
  console.log("| Gate | Status | Present | Missing |");
  console.log("| --- | --- | --- | --- |");
  for (const audit of gateAudits) {
    console.log(
      `| ${audit.gate} | ${audit.status} | ${formatList(audit.present)} | ${formatList(audit.missing)} |`
    );
  }
  console.log("");
  if (outputPath) {
    console.log(`Redacted report written: ${outputPath}`);
  }
  console.log("No environment values, URLs, tokens, keys, passwords, or report contents were printed.");
}

process.exitCode = summary.needsEvidence === 0 ? 0 : 1;

function auditEvidenceGate(requirement: { gate: GateId; env: string[] }): GateAudit {
  const present: string[] = [];
  const missing: string[] = [];

  for (const envName of requirement.env) {
    const value = readEnv(envName);
    if (!value) {
      missing.push(envName);
      continue;
    }
    present.push(evidenceLabel(envName, value));
  }

  return {
    gate: requirement.gate,
    status: missing.length === 0 ? "ready-to-review" : "needs-evidence",
    present,
    missing,
  };
}

function auditPushProvider(): ProviderAudit {
  const explicitProvider = readEnv("PUSH_DELIVERY_PROVIDER")?.toLowerCase();
  const inferredProvider = readEnv("PUSH_DELIVERY_WEBHOOK_URL")
    ? "webhook"
    : readEnv("ONESIGNAL_APP_ID") && (readEnv("ONESIGNAL_REST_API_KEY") || readEnv("ONESIGNAL_API_KEY"))
      ? "onesignal"
      : "disabled";
  const provider = explicitProvider ?? inferredProvider;

  if (provider === "disabled" && explicitProvider === "disabled") {
    return {
      name: "push",
      status: "disabled",
      present: ["PUSH_DELIVERY_PROVIDER=disabled"],
      missing: [],
    };
  }

  if (provider === "disabled") {
    return {
      name: "push",
      status: "disabled",
      present: [],
      missing: ["PUSH_DELIVERY_PROVIDER or PUSH_DELIVERY_WEBHOOK_URL or ONESIGNAL_APP_ID+ONESIGNAL_REST_API_KEY"],
    };
  }

  if (provider === "webhook") {
    return auditProvider("push", ["PUSH_DELIVERY_WEBHOOK_URL"]);
  }

  if (provider === "onesignal") {
    return auditProvider("push", ["ONESIGNAL_APP_ID", ["ONESIGNAL_REST_API_KEY", "ONESIGNAL_API_KEY"]]);
  }

  return {
    name: "push",
    status: "incomplete",
    present: ["PUSH_DELIVERY_PROVIDER"],
    missing: ["supported provider: disabled|webhook|onesignal"],
  };
}

function auditEmailProvider(): ProviderAudit {
  const explicitProvider = readEnv("EMAIL_DELIVERY_PROVIDER")?.toLowerCase();
  const inferredProvider = readEnv("RESEND_API_KEY") ? "resend" : readEnv("EMAIL_DELIVERY_WEBHOOK_URL") ? "webhook" : "disabled";
  const provider = explicitProvider ?? inferredProvider;

  if (provider === "disabled" && explicitProvider === "disabled") {
    return {
      name: "email",
      status: "disabled",
      present: ["EMAIL_DELIVERY_PROVIDER=disabled"],
      missing: [],
    };
  }

  if (provider === "disabled") {
    return {
      name: "email",
      status: "disabled",
      present: [],
      missing: ["EMAIL_DELIVERY_PROVIDER or EMAIL_DELIVERY_WEBHOOK_URL or RESEND_API_KEY"],
    };
  }

  if (provider === "webhook") {
    return auditProvider("email", ["EMAIL_DELIVERY_WEBHOOK_URL", "EMAIL_FROM"]);
  }

  if (provider === "resend") {
    return auditProvider("email", ["RESEND_API_KEY", "EMAIL_FROM"]);
  }

  return {
    name: "email",
    status: "incomplete",
    present: ["EMAIL_DELIVERY_PROVIDER"],
    missing: ["supported provider: disabled|webhook|resend"],
  };
}

function auditChannelProvider(prefix: "SMS" | "WHATSAPP"): ProviderAudit {
  const lower = prefix.toLowerCase();
  const providerName = lower === "sms" ? "sms" : "whatsapp";
  const explicitProvider = readEnv(`${prefix}_DELIVERY_PROVIDER`)?.toLowerCase();
  const hasWebhook = Boolean(
    readEnv(`${prefix}_DELIVERY_WEBHOOK_URL`) ??
      readEnv("LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL") ??
      readEnv("MESSAGE_CHANNEL_DELIVERY_WEBHOOK_URL")
  );
  const provider = explicitProvider ?? (hasWebhook ? "webhook" : "disabled");

  if (provider === "disabled" && explicitProvider === "disabled") {
    return {
      name: providerName,
      status: "disabled",
      present: [`${prefix}_DELIVERY_PROVIDER=disabled`],
      missing: [],
    };
  }

  if (provider === "disabled") {
    return {
      name: providerName,
      status: "disabled",
      present: [],
      missing: [
        `${prefix}_DELIVERY_PROVIDER or ${prefix}_DELIVERY_WEBHOOK_URL or LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL`,
      ],
    };
  }

  if (provider === "webhook") {
    return auditProvider(providerName, [
      [`${prefix}_DELIVERY_WEBHOOK_URL`, "LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL", "MESSAGE_CHANNEL_DELIVERY_WEBHOOK_URL"],
    ]);
  }

  return {
    name: providerName,
    status: "incomplete",
    present: [`${prefix}_DELIVERY_PROVIDER`],
    missing: ["supported provider: disabled|webhook"],
  };
}

function auditProvider(name: string, requirements: Array<string | string[]>): ProviderAudit {
  const present: string[] = [];
  const missing: string[] = [];

  for (const requirement of requirements) {
    if (Array.isArray(requirement)) {
      const configured = requirement.find((envName) => Boolean(readEnv(envName)));
      if (configured) {
        present.push(configured);
      } else {
        missing.push(requirement.join(" or "));
      }
      continue;
    }

    if (readEnv(requirement)) {
      present.push(requirement);
    } else {
      missing.push(requirement);
    }
  }

  return {
    name,
    status: missing.length === 0 ? "configured" : "incomplete",
    present,
    missing,
  };
}

function auditAnyEnv(envNames: string[]) {
  const configured = envNames.find((envName) => Boolean(readEnv(envName)));
  return configured
    ? { present: [configured], missing: [] as string[] }
    : { present: [] as string[], missing: [envNames.join(" or ")] };
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  if (isPlaceholderValue(value)) return null;
  return value ? value : null;
}

function isPlaceholderValue(value: string | undefined) {
  if (!value) return false;
  return [
    "non-secret-report-id",
    "replace-me",
    "replace_me",
    "todo",
    "tbd",
    "changeme",
  ].includes(value.trim().toLowerCase());
}

function evidenceLabel(envName: string, value: string) {
  if (existsSync(value)) {
    const stat = statSync(value);
    return `${envName} (${stat.isDirectory() ? "directory" : "file"})`;
  }

  return `${envName} (configured)`;
}

function formatList(items: string[]) {
  return items.length ? items.join(", ") : "-";
}

function printRequirements(params: { json: boolean; gateFilter: GateId | null }) {
  const evidenceRequirements = evidenceGateRequirements
    .filter((requirement) => !params.gateFilter || requirement.gate === params.gateFilter)
    .map((requirement) => ({
    gate: requirement.gate,
    requiredEvidencePointers: [
      ...requirement.env,
      ...(requirement.gate === "PROD-CRON" ? ["CRON_SECRET or VERCEL_CRON_SECRET"] : []),
    ],
  }));
  const providerRequirements = params.gateFilter && params.gateFilter !== "PROD-PROVIDERS" ? [] : [
    {
      provider: "delivery-evidence",
      acceptedSetup:
        "PROVIDER_DELIVERY_ACCEPTANCE_REPORT pointing to a non-secret sent/skipped/failed summary and provider response-id record",
    },
    {
      provider: "push",
      acceptedSetup:
        "PUSH_DELIVERY_PROVIDER=disabled, PUSH_DELIVERY_PROVIDER=webhook with PUSH_DELIVERY_WEBHOOK_URL, or PUSH_DELIVERY_PROVIDER=onesignal with ONESIGNAL_APP_ID plus ONESIGNAL_REST_API_KEY/ONESIGNAL_API_KEY",
    },
    {
      provider: "email",
      acceptedSetup:
        "EMAIL_DELIVERY_PROVIDER=disabled, EMAIL_DELIVERY_PROVIDER=webhook with EMAIL_DELIVERY_WEBHOOK_URL plus EMAIL_FROM, or EMAIL_DELIVERY_PROVIDER=resend with RESEND_API_KEY plus EMAIL_FROM",
    },
    {
      provider: "sms",
      acceptedSetup:
        "SMS_DELIVERY_PROVIDER=disabled, SMS_DELIVERY_PROVIDER=webhook with SMS_DELIVERY_WEBHOOK_URL, or shared LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL/MESSAGE_CHANNEL_DELIVERY_WEBHOOK_URL",
    },
    {
      provider: "whatsapp",
      acceptedSetup:
        "WHATSAPP_DELIVERY_PROVIDER=disabled, WHATSAPP_DELIVERY_PROVIDER=webhook with WHATSAPP_DELIVERY_WEBHOOK_URL, or shared LEGACY_CHANNEL_DELIVERY_WEBHOOK_URL/MESSAGE_CHANNEL_DELIVERY_WEBHOOK_URL",
    },
  ];
  const payload = {
    redacted: true,
    evidenceRequirements,
    providerRequirements,
    note: "Requirement names only. No environment values, URLs, tokens, keys, passwords, or report contents are included.",
  };

  if (params.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log("Production readiness requirements (redacted)");
  console.log("");
  console.log("| Gate | Required evidence pointers |");
  console.log("| --- | --- |");
  for (const requirement of evidenceRequirements) {
    console.log(`| ${requirement.gate} | ${requirement.requiredEvidencePointers.join(", ")} |`);
  }
  if (providerRequirements.length > 0) {
    console.log("");
    console.log("| Provider | Accepted setup |");
    console.log("| --- | --- |");
    for (const requirement of providerRequirements) {
      console.log(`| ${requirement.provider} | ${requirement.acceptedSetup} |`);
    }
  }
  console.log("");
  console.log("No environment values, URLs, tokens, keys, passwords, or report contents were printed.");
}

function parseGateFilter(value: string | null): GateId | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  const gates: readonly string[] = [
    ...evidenceGateRequirements.map((requirement) => requirement.gate),
    "PROD-PROVIDERS",
  ];
  if (gates.includes(normalized)) return normalized as GateId;
  throw new Error(`Unknown production gate "${value}". Use --list-requirements to inspect valid gates.`);
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

function writeRedactedReport(path: string, report: object) {
  const dir = dirname(path);
  if (dir && dir !== ".") {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

function loadEnvFile(path: string) {
  const raw = readFileSync(path, "utf8");
  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals <= 0) {
      throw new Error(`Invalid env-file line ${index + 1}: expected NAME=value`);
    }

    const key = trimmed.slice(0, equals).trim();
    const value = unquoteEnvValue(trimmed.slice(equals + 1).trim());
    if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
      throw new Error(`Invalid env-file key on line ${index + 1}: ${key}`);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function unquoteEnvValue(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
