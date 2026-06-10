import { randomBytes } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  resolveStaffLoginIdentity,
  type ResolvedStaffLoginIdentity,
} from "@/lib/legacy-auth-identity";

type LegacySocialProviderKey = "facebook" | "google" | "twitter" | "yahoo";

type LegacySocialProviderDefinition = {
  key: LegacySocialProviderKey;
  label: string;
  settingKey: string;
  authProviderId: string | null;
  clientIdEnv: string[];
  clientSecretEnv: string[];
};

export type LegacySocialProviderStatus = {
  key: LegacySocialProviderKey;
  label: string;
  settingKey: string;
  authProviderId: string | null;
  isSupported: boolean;
  isConfigured: boolean;
};

export type ConfiguredLegacyOAuthProvider = LegacySocialProviderStatus & {
  authProviderId: string;
  clientId: string;
  clientSecret: string;
};

export const LEGACY_SOCIAL_PROVIDER_DEFINITIONS: LegacySocialProviderDefinition[] =
  [
    {
      key: "facebook",
      label: "Facebook",
      settingKey: "integration-facebook-enable",
      authProviderId: "facebook",
      clientIdEnv: ["AUTH_FACEBOOK_ID", "FACEBOOK_CLIENT_ID"],
      clientSecretEnv: ["AUTH_FACEBOOK_SECRET", "FACEBOOK_CLIENT_SECRET"],
    },
    {
      key: "google",
      label: "Google",
      settingKey: "integration-google-enable",
      authProviderId: "google",
      clientIdEnv: ["AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID"],
      clientSecretEnv: ["AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET"],
    },
    {
      key: "twitter",
      label: "Twitter",
      settingKey: "integration-twitter-enable",
      authProviderId: "twitter",
      clientIdEnv: ["AUTH_TWITTER_ID", "TWITTER_CLIENT_ID"],
      clientSecretEnv: ["AUTH_TWITTER_SECRET", "TWITTER_CLIENT_SECRET"],
    },
    {
      key: "yahoo",
      label: "Yahoo",
      settingKey: "integration-yahoo-enable",
      authProviderId: null,
      clientIdEnv: ["AUTH_YAHOO_ID", "YAHOO_CLIENT_ID"],
      clientSecretEnv: ["AUTH_YAHOO_SECRET", "YAHOO_CLIENT_SECRET"],
    },
  ];

function envValue(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

function legacyObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function legacyString(value: unknown, key: string) {
  const raw = legacyObject(value)[key];
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number") return String(raw);
  return "";
}

export function legacySocialProviderStatuses(): LegacySocialProviderStatus[] {
  return LEGACY_SOCIAL_PROVIDER_DEFINITIONS.map((provider) => {
    const clientId = envValue(provider.clientIdEnv);
    const clientSecret = envValue(provider.clientSecretEnv);
    return {
      key: provider.key,
      label: provider.label,
      settingKey: provider.settingKey,
      authProviderId: provider.authProviderId,
      isSupported: Boolean(provider.authProviderId),
      isConfigured: Boolean(provider.authProviderId && clientId && clientSecret),
    };
  });
}

export function configuredLegacyOAuthProviders(): ConfiguredLegacyOAuthProvider[] {
  return LEGACY_SOCIAL_PROVIDER_DEFINITIONS.flatMap((provider) => {
    const clientId = envValue(provider.clientIdEnv);
    const clientSecret = envValue(provider.clientSecretEnv);
    if (!provider.authProviderId || !clientId || !clientSecret) return [];
    return [
      {
        key: provider.key,
        label: provider.label,
        settingKey: provider.settingKey,
        authProviderId: provider.authProviderId,
        isSupported: true,
        isConfigured: true,
        clientId,
        clientSecret,
      },
    ];
  });
}

export function isLegacySocialAuthProvider(provider: string | null | undefined) {
  if (!provider) return false;
  return legacySocialProviderStatuses().some(
    (entry) => entry.authProviderId === provider,
  );
}

export function legacySocialKeyForAuthProvider(
  provider: string | null | undefined,
) {
  if (!provider) return null;
  return (
    legacySocialProviderStatuses().find(
      (entry) => entry.authProviderId === provider,
    )?.key ?? null
  );
}

function providerAccountCandidates(params: {
  providerAccountId?: string | null;
  email?: string | null;
}) {
  return new Set(
    [params.providerAccountId, params.email]
      .map((value) => value?.trim().toLowerCase())
      .filter(Boolean) as string[],
  );
}

export async function resolveLegacySocialAuthIdentity(params: {
  provider: string;
  providerAccountId?: string | null;
  email?: string | null;
}): Promise<ResolvedStaffLoginIdentity | null> {
  const legacyProviderKey = legacySocialKeyForAuthProvider(params.provider);
  if (!legacyProviderKey) return null;

  const candidates = providerAccountCandidates(params);
  if (candidates.size === 0) return null;

  const records = await db.legacyAuthRecord.findMany({
    where: {
      recordType: "social_integration",
      userId: { not: null },
      OR: [{ isDisabled: false }, { isDisabled: null }],
    },
    orderBy: [{ sourceDatabase: "asc" }, { legacyId: "asc" }],
    select: {
      userId: true,
      legacyData: true,
    },
  });

  const matched = records.find((record) => {
    const identifier = legacyString(record.legacyData, legacyProviderKey);
    return Boolean(identifier && candidates.has(identifier.toLowerCase()));
  });
  if (!matched?.userId) return null;

  const user = await db.user.findUnique({
    where: { id: matched.userId },
    include: { branch: { select: { organizationId: true } } },
  });
  if (!user?.email) return user ? { user, legacy: null } : null;

  return resolveStaffLoginIdentity(db, user.email);
}

export async function recordLegacySocialLoginAudit(params: {
  identity: ResolvedStaffLoginIdentity;
  provider: string;
  providerAccountId?: string | null;
}) {
  const user = params.identity.user;
  if (!user) return;

  const now = new Date();
  const sourceDatabase = params.identity.legacy?.sourceDatabase ?? "modern";
  const legacyUserId =
    params.identity.legacy?.legacyUserId ?? params.identity.legacy?.legacyId ?? null;
  const auditId = randomBytes(10).toString("hex");
  const legacyData = {
    provider: params.provider,
    providerAccountId: params.providerAccountId ?? null,
    userId: user.id,
    legacyUserId,
    loggedAt: now.toISOString(),
    inserted_from: "modern_oauth_login",
  } satisfies Prisma.InputJsonObject;

  await db.legacyAuthRecord.create({
    data: {
      sourceDatabase,
      legacyTable: "login_integration_audit",
      legacyKey: `${sourceDatabase}:login_integration_audit:${auditId}`,
      legacyId: 0,
      recordType: "social_login_audit",
      userId: user.id,
      legacyUserId,
      username: params.identity.legacy?.username ?? null,
      email: user.email,
      recordKey: params.provider,
      recordValue: params.providerAccountId ?? null,
      legacyData,
    },
  });
}
