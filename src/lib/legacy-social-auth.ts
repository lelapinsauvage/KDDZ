import { randomBytes } from "crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  resolveStaffLoginIdentity,
  type ResolvedStaffLoginIdentity,
} from "@/lib/legacy-auth-identity";

export type LegacySocialProviderKey = "facebook" | "google" | "twitter" | "yahoo";

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

export type LegacySocialSignupPrefill = {
  key: string;
  provider: LegacySocialProviderKey;
  providerLabel: string;
  providerAccountId: string;
  email: string;
  name: string;
  username: string;
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

function providerDefinitionForKey(key: LegacySocialProviderKey) {
  return LEGACY_SOCIAL_PROVIDER_DEFINITIONS.find((provider) => provider.key === key);
}

function linkedSocialProviderList(data: Record<string, unknown>) {
  return LEGACY_SOCIAL_PROVIDER_DEFINITIONS.flatMap((provider) => {
    const identifier = legacyString(data, provider.key);
    return identifier ? [provider.key] : [];
  }).join(",");
}

function emailUsername(email: string) {
  const local = email.split("@")[0]?.trim() ?? "";
  return local.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 15);
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

export async function createLegacySocialSignupPrefill(params: {
  provider: string;
  providerAccountId?: string | null;
  email?: string | null;
  name?: string | null;
  username?: string | null;
}) {
  const legacyProviderKey = legacySocialKeyForAuthProvider(params.provider);
  const providerAccountId = params.providerAccountId?.trim();
  if (!legacyProviderKey || !providerAccountId) return null;

  const email = params.email?.trim().toLowerCase() ?? "";
  const username =
    params.username?.trim() ||
    (email ? emailUsername(email) : "") ||
    `${legacyProviderKey}_${providerAccountId}`.slice(0, 15);
  const name = params.name?.trim() || username || email || providerAccountId;
  const key = randomBytes(24).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
  const providerDefinition = providerDefinitionForKey(legacyProviderKey);

  await db.legacyAuthRecord.create({
    data: {
      sourceDatabase: "modern",
      legacyTable: "login_integration_signup",
      legacyKey: `modern:login_integration_signup:${key}`,
      legacyId: 0,
      recordType: "social_signup_prefill",
      email: email || null,
      username,
      recordKey: key,
      recordValue: providerAccountId,
      legacyData: {
        provider: legacyProviderKey,
        providerLabel: providerDefinition?.label ?? legacyProviderKey,
        authProvider: params.provider,
        providerAccountId,
        email,
        name,
        username,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        inserted_from: "modern_oauth_new_social",
      },
    },
  });

  return key;
}

export async function getLegacySocialSignupPrefill(
  key: string | null | undefined,
): Promise<LegacySocialSignupPrefill | null> {
  const trimmed = key?.trim();
  if (!trimmed) return null;

  const record = await db.legacyAuthRecord.findFirst({
    where: {
      legacyTable: "login_integration_signup",
      recordType: "social_signup_prefill",
      recordKey: trimmed,
      OR: [{ isDisabled: false }, { isDisabled: null }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      recordKey: true,
      recordValue: true,
      legacyData: true,
    },
  });
  if (!record?.recordKey || !record.recordValue) return null;

  const data = legacyObject(record.legacyData);
  const provider = legacyString(data, "provider") as LegacySocialProviderKey;
  const providerDefinition = providerDefinitionForKey(provider);
  if (!providerDefinition) return null;

  const expiresAt = legacyString(data, "expiresAt");
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) return null;

  return {
    key: record.recordKey,
    provider,
    providerLabel: legacyString(data, "providerLabel") || providerDefinition.label,
    providerAccountId: legacyString(data, "providerAccountId") || record.recordValue,
    email: legacyString(data, "email"),
    name: legacyString(data, "name"),
    username: legacyString(data, "username"),
  };
}

export async function consumeLegacySocialSignupPrefill(
  tx: Prisma.TransactionClient,
  params: {
    key?: string | null;
    sourceDatabase: string;
    userId: string;
    legacyUserId: number;
    username: string;
    email: string;
  },
) {
  const key = params.key?.trim();
  if (!key) return null;

  const record = await tx.legacyAuthRecord.findFirst({
    where: {
      legacyTable: "login_integration_signup",
      recordType: "social_signup_prefill",
      recordKey: key,
      OR: [{ isDisabled: false }, { isDisabled: null }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      recordValue: true,
      legacyData: true,
    },
  });
  if (!record?.recordValue) return null;

  const data = legacyObject(record.legacyData);
  const expiresAt = legacyString(data, "expiresAt");
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
    await tx.legacyAuthRecord.update({
      where: { id: record.id },
      data: {
        isDisabled: true,
        recordType: "social_signup_prefill_expired",
        legacyData: {
          ...data,
          expiredAt: new Date().toISOString(),
          updated_from: "modern_legacy_signup",
        },
      },
    });
    return null;
  }

  const provider = legacyString(data, "provider") as LegacySocialProviderKey;
  if (!providerDefinitionForKey(provider)) return null;

  const existing = await tx.legacyAuthRecord.findFirst({
    where: {
      sourceDatabase: params.sourceDatabase,
      legacyTable: "login_integration",
      recordType: "social_integration",
      legacyUserId: params.legacyUserId,
    },
    orderBy: [{ legacyId: "desc" }],
    select: {
      id: true,
      legacyData: true,
    },
  });
  const existingData = legacyObject(existing?.legacyData) as Prisma.InputJsonObject;
  const updatedData: Prisma.InputJsonObject = {
    ...existingData,
    [provider]: record.recordValue,
    user_id: params.legacyUserId,
    [`${provider}_linked_at`]: new Date().toISOString(),
    linked_from: "modern_legacy_social_signup",
  };
  const linkedProviders = linkedSocialProviderList(updatedData);

  if (existing) {
    await tx.legacyAuthRecord.update({
      where: { id: existing.id },
      data: {
        userId: params.userId,
        legacyUserId: params.legacyUserId,
        username: params.username,
        email: params.email,
        recordValue: linkedProviders,
        isDisabled: false,
        legacyData: updatedData,
      },
    });
  } else {
    await tx.legacyAuthRecord.create({
      data: {
        sourceDatabase: params.sourceDatabase,
        legacyTable: "login_integration",
        legacyKey: `${params.sourceDatabase}:login_integration:${params.legacyUserId}`,
        legacyId: params.legacyUserId,
        recordType: "social_integration",
        userId: params.userId,
        legacyUserId: params.legacyUserId,
        username: params.username,
        email: params.email,
        recordKey: String(params.legacyUserId),
        recordValue: linkedProviders,
        isDisabled: false,
        legacyData: updatedData,
      },
    });
  }

  await tx.legacyAuthRecord.update({
    where: { id: record.id },
    data: {
      isDisabled: true,
      recordType: "social_signup_prefill_used",
      userId: params.userId,
      legacyUserId: params.legacyUserId,
      username: params.username,
      email: params.email,
      legacyData: {
        ...data,
        consumedAt: new Date().toISOString(),
        consumedByUserId: params.userId,
        consumedByLegacyUserId: params.legacyUserId,
        updated_from: "modern_legacy_signup",
      },
    },
  });

  return { provider, providerAccountId: record.recordValue };
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

export async function linkLegacySocialAuthIdentityByEmail(params: {
  provider: string;
  providerAccountId?: string | null;
  email?: string | null;
}): Promise<ResolvedStaffLoginIdentity | null> {
  const legacyProviderKey = legacySocialKeyForAuthProvider(params.provider);
  const providerAccountId = params.providerAccountId?.trim();
  const email = params.email?.trim().toLowerCase();
  if (!legacyProviderKey || !providerAccountId || !email) return null;

  const identity = await resolveStaffLoginIdentity(db, email);
  if (!identity?.user || identity.legacy?.recordType !== "login_user") return null;

  const legacyUserId = identity.legacy.legacyUserId ?? identity.legacy.legacyId;
  const existing = await db.legacyAuthRecord.findFirst({
    where: {
      sourceDatabase: identity.legacy.sourceDatabase,
      legacyTable: "login_integration",
      recordType: "social_integration",
      legacyUserId,
    },
    orderBy: [{ legacyId: "desc" }],
    select: {
      id: true,
      legacyData: true,
    },
  });
  const existingData = legacyObject(existing?.legacyData) as Prisma.InputJsonObject;
  const updatedData: Prisma.InputJsonObject = {
    ...existingData,
    [legacyProviderKey]: providerAccountId,
    user_id: legacyUserId,
    [`${legacyProviderKey}_linked_at`]: new Date().toISOString(),
    linked_from: "modern_oauth_verified_email",
  };
  const linkedProviders = linkedSocialProviderList(updatedData);

  await db.$transaction([
    existing
      ? db.legacyAuthRecord.update({
          where: { id: existing.id },
          data: {
            userId: identity.user.id,
            legacyUserId,
            username: identity.legacy.username ?? identity.legacy.recordKey,
            email: identity.legacy.email ?? identity.user.email,
            recordValue: linkedProviders,
            isDisabled: false,
            legacyData: updatedData,
          },
        })
      : db.legacyAuthRecord.create({
          data: {
            sourceDatabase: identity.legacy.sourceDatabase,
            legacyTable: "login_integration",
            legacyKey: `${identity.legacy.sourceDatabase}:login_integration:${legacyUserId}`,
            legacyId: legacyUserId,
            recordType: "social_integration",
            userId: identity.user.id,
            legacyUserId,
            username: identity.legacy.username ?? identity.legacy.recordKey,
            email: identity.legacy.email ?? identity.user.email,
            recordKey: String(legacyUserId),
            recordValue: linkedProviders,
            isDisabled: false,
            legacyData: updatedData,
          },
        }),
    db.legacyAuthRecord.create({
      data: {
        sourceDatabase: identity.legacy.sourceDatabase,
        legacyTable: "login_integration_audit",
        legacyKey: `${identity.legacy.sourceDatabase}:login_integration_link:${legacyUserId}:${legacyProviderKey}:${randomBytes(6).toString("hex")}`,
        legacyId: 0,
        recordType: "social_link_audit",
        userId: identity.user.id,
        legacyUserId,
        username: identity.legacy.username ?? identity.legacy.recordKey,
        email: identity.legacy.email ?? identity.user.email,
        recordKey: legacyProviderKey,
        recordValue: providerAccountId,
        legacyData: {
          provider: legacyProviderKey,
          providerAccountId,
          email,
          linkedAt: new Date().toISOString(),
          source: "oauth_verified_email",
        },
      },
    }),
  ]);

  return identity;
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
