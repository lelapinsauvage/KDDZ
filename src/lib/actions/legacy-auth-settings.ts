"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireLegacyAdminPanelAccess } from "@/lib/legacy-system-action-permissions";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

type LegacyAuthSettingsTable = "login_settings" | "login_settings_man";
type LegacyAuthLevelRecordType = "login_level" | "manager_login_level";

export type LegacyAuthSettingsSource = {
  key: string;
  sourceDatabase: string;
  legacyTable: LegacyAuthSettingsTable;
  label: string;
  levelRecordType: LegacyAuthLevelRecordType;
};

export type LegacyAuthSettingRow = {
  id: string;
  sourceDatabase: string;
  legacyTable: string;
  legacyId: number;
  scope: string | null;
  settingKey: string;
  settingValue: string | null;
  description: string | null;
};

export type LegacyAuthLevelOption = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  label: string;
  recordType: LegacyAuthLevelRecordType;
  isDisabled: boolean;
};

export type LegacyAuthSettingsData = {
  sources: LegacyAuthSettingsSource[];
  settings: LegacyAuthSettingRow[];
  levels: LegacyAuthLevelOption[];
};

export type LegacyAuthGeneralSettingsInput = {
  sourceKey: string;
  adminEmail: string;
  siteAddress: string;
  defaultSession: string;
  defaultLevelIds: number[];
  customAvatarEnabled: boolean;
  emailAsUsernameEnabled: boolean;
  disableRegistrationsEnabled: boolean;
  disableLoginsEnabled: boolean;
  userActivationEnabled: boolean;
  emailWelcomeDisabled: boolean;
  notifyNewUserEnabled: boolean;
  notifyNewUserLevelIds: number[];
  restrictSignupDomains: string[];
  passwordEncryptForceEnabled: boolean;
  passwordEncryption: "MD5" | "SHA256";
  guestRedirect: string;
  newUserRedirect: string;
  signoutRedirectReferrerEnabled: boolean;
  signoutRedirectUrl: string;
  signinRedirectReferrerEnabled: boolean;
  signinRedirectUrl: string;
};

export type LegacyAuthDeniedSettingsInput = {
  sourceKey: string;
  blockMessageEnabled: boolean;
  blockMessage: string;
  guestBlockMessageEnabled: boolean;
  guestBlockMessage: string;
};

export type LegacyAuthIntegrationSettingsInput = {
  sourceKey: string;
  twitterEnabled: boolean;
  twitterKey: string;
  twitterSecret: string;
  facebookEnabled: boolean;
  facebookAppId: string;
  facebookAppSecret: string;
  googleEnabled: boolean;
  googleId: string;
  googleSecret: string;
  yahooEnabled: boolean;
  captchaProvider: "disableCaptcha" | "reCAPTCHA" | "playThru";
  recaptchaPublicKey: string;
  recaptchaPrivateKey: string;
  playThruPublisherKey: string;
  playThruScoringKey: string;
};

export type LegacyAuthUpdateSettingsInput = {
  sourceKey: string;
  updateCheckEnabled: boolean;
};

const SOURCE_CONFIG: Record<
  LegacyAuthSettingsTable,
  {
    label: string;
    scope: string;
    levelRecordType: LegacyAuthLevelRecordType;
  }
> = {
  login_settings: {
    label: "Staff Login",
    scope: "login",
    levelRecordType: "login_level",
  },
  login_settings_man: {
    label: "Manager Login",
    scope: "manager_login",
    levelRecordType: "manager_login_level",
  },
};

function sourceKey(sourceDatabase: string, legacyTable: LegacyAuthSettingsTable) {
  return `${sourceDatabase}:${legacyTable}`;
}

function sourceFromKey(key: string) {
  const [sourceDatabase, legacyTable] = key.split(":");
  if (
    !sourceDatabase ||
    (legacyTable !== "login_settings" && legacyTable !== "login_settings_man")
  ) {
    return null;
  }

  return {
    sourceDatabase,
    legacyTable,
    key: sourceKey(sourceDatabase, legacyTable),
    label: SOURCE_CONFIG[legacyTable].label,
    levelRecordType: SOURCE_CONFIG[legacyTable].levelRecordType,
  } satisfies LegacyAuthSettingsSource;
}

function legacyObject(value: unknown): Prisma.InputJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }
  return {};
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeDomains(domains: string[]) {
  return Array.from(
    new Set(
      domains
        .map((domain) => domain.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function normalizeIds(values: number[]) {
  return Array.from(
    new Set(values.filter((value) => Number.isInteger(value) && value > 0)),
  ).sort((a, b) => a - b);
}

function serializePhpStringArray(values: string[]) {
  return `a:${values.length}:{${values
    .map((value, index) => `i:${index};s:${Buffer.byteLength(value)}:"${value}";`)
    .join("")}}`;
}

function serializePhpNumberArray(values: number[]) {
  return serializePhpStringArray(values.map(String));
}

function boolValue(value: boolean) {
  return value ? "1" : "0";
}

function rowFromSetting(setting: {
  id: string;
  sourceDatabase: string;
  legacyTable: string;
  legacyId: number;
  scope: string | null;
  settingKey: string;
  settingValue: string | null;
  description: string | null;
}): LegacyAuthSettingRow {
  return {
    id: setting.id,
    sourceDatabase: setting.sourceDatabase,
    legacyTable: setting.legacyTable,
    legacyId: setting.legacyId,
    scope: setting.scope,
    settingKey: setting.settingKey,
    settingValue: setting.settingValue,
    description: setting.description,
  };
}

async function upsertLegacySettings(
  tx: Prisma.TransactionClient,
  source: LegacyAuthSettingsSource,
  values: Record<string, string>,
) {
  const keys = Object.keys(values);
  if (!keys.length) return;

  const existingRows = await tx.legacySetting.findMany({
    where: {
      sourceDatabase: source.sourceDatabase,
      legacyTable: source.legacyTable,
      settingKey: { in: keys },
    },
  });
  const existingByKey = new Map(
    existingRows.map((row) => [row.settingKey, row]),
  );
  const maxRow = await tx.legacySetting.findFirst({
    where: {
      sourceDatabase: source.sourceDatabase,
      legacyTable: source.legacyTable,
    },
    orderBy: { legacyId: "desc" },
    select: { legacyId: true },
  });
  let nextLegacyId = (maxRow?.legacyId ?? 0) + 1;

  for (const key of keys) {
    const value = values[key];
    const existing = existingByKey.get(key);
    if (existing) {
      await tx.legacySetting.update({
        where: { id: existing.id },
        data: {
          settingValue: value,
          legacyData: {
            ...legacyObject(existing.legacyData),
            option_name: key,
            option_value: value,
            updated_from: "modern_legacy_auth_settings",
          },
        },
      });
      continue;
    }

    const legacyId = nextLegacyId;
    nextLegacyId += 1;

    await tx.legacySetting.create({
      data: {
        sourceDatabase: source.sourceDatabase,
        legacyTable: source.legacyTable,
        legacyId,
        scope: SOURCE_CONFIG[source.legacyTable].scope,
        settingKey: key,
        settingValue: value,
        legacyData: {
          id: legacyId,
          option_name: key,
          option_value: value,
          inserted_from: "modern_legacy_auth_settings",
        },
      },
    });
  }
}

function revalidateLegacyAuthSettingsPaths() {
  revalidatePath("/settings/legacy-auth");
  revalidatePath("/settings/legacy-users");
  revalidatePath("/users/admin/page/general-options.php");
  revalidatePath("/users/admin/page/denied.php");
  revalidatePath("/users/admin/page/integration.php");
  revalidatePath("/users/admin/page/update.php");
  revalidatePath("/users/admin/page/settings.php");
  revalidatePath("/users/admin/settings.php");
}

export async function getLegacyAuthSettings(): Promise<
  ActionResult<LegacyAuthSettingsData>
> {
  try {
    await requireLegacyAdminPanelAccess();

    const [settings, levelRecords] = await Promise.all([
      db.legacySetting.findMany({
        where: {
          legacyTable: { in: ["login_settings", "login_settings_man"] },
        },
        orderBy: [
          { sourceDatabase: "asc" },
          { legacyTable: "asc" },
          { settingKey: "asc" },
        ],
      }),
      db.legacyAuthRecord.findMany({
        where: {
          recordType: { in: ["login_level", "manager_login_level"] },
        },
        orderBy: [
          { sourceDatabase: "asc" },
          { recordType: "asc" },
          { legacyId: "asc" },
        ],
        select: {
          id: true,
          sourceDatabase: true,
          legacyId: true,
          recordType: true,
          recordKey: true,
          isDisabled: true,
        },
      }),
    ]);

    const sourceMap = new Map<string, LegacyAuthSettingsSource>();
    for (const setting of settings) {
      const source = sourceFromKey(
        sourceKey(
          setting.sourceDatabase,
          setting.legacyTable as LegacyAuthSettingsTable,
        ),
      );
      if (source) sourceMap.set(source.key, source);
    }
    for (const level of levelRecords) {
      const legacyTable =
        level.recordType === "manager_login_level"
          ? "login_settings_man"
          : "login_settings";
      const source = sourceFromKey(sourceKey(level.sourceDatabase, legacyTable));
      if (source) sourceMap.set(source.key, source);
    }

    return {
      success: true,
      data: {
        sources: Array.from(sourceMap.values()).sort((a, b) => {
          const source = a.sourceDatabase.localeCompare(b.sourceDatabase);
          if (source !== 0) return source;
          return a.label.localeCompare(b.label);
        }),
        settings: settings.map(rowFromSetting),
        levels: levelRecords.map((level) => ({
          id: level.id,
          sourceDatabase: level.sourceDatabase,
          legacyId: level.legacyId,
          label: level.recordKey ?? `Level ${level.legacyId}`,
          recordType: level.recordType as LegacyAuthLevelRecordType,
          isDisabled: level.isDisabled ?? false,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to fetch legacy auth settings:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch legacy auth settings",
    };
  }
}

export async function updateLegacyAuthGeneralSettings(
  input: LegacyAuthGeneralSettingsInput,
): Promise<ActionResult<LegacyAuthSettingsData>> {
  try {
    await requireLegacyAdminPanelAccess();
    const source = sourceFromKey(input.sourceKey);
    if (!source) return { success: false, error: "Unknown legacy settings source" };

    const adminEmail = input.adminEmail.trim().toLowerCase();
    if (!validateEmail(adminEmail)) {
      return {
        success: false,
        error: "You have entered an invalid e-mail address, try again.",
      };
    }

    let siteAddress = input.siteAddress.trim();
    if (!siteAddress) {
      return { success: false, error: "Please enter your site address." };
    }
    if (!siteAddress.endsWith("/")) siteAddress = `${siteAddress}/`;

    const defaultSession = Number.parseInt(input.defaultSession, 10);
    if (!Number.isInteger(defaultSession) || defaultSession < 0) {
      return {
        success: false,
        error: "You must enter a default session (numeric value only).",
      };
    }

    const defaultLevelIds = normalizeIds(input.defaultLevelIds);
    const notifyNewUserLevelIds = normalizeIds(input.notifyNewUserLevelIds);
    const domains = normalizeDomains(input.restrictSignupDomains);

    await db.$transaction((tx) =>
      upsertLegacySettings(tx, source, {
        admin_email: adminEmail,
        site_address: siteAddress,
        default_session: String(defaultSession),
        "default-level": serializePhpNumberArray(
          defaultLevelIds.length ? defaultLevelIds : [3],
        ),
        "custom-avatar-enable": boolValue(input.customAvatarEnabled),
        "email-as-username-enable": boolValue(input.emailAsUsernameEnabled),
        "disable-registrations-enable": boolValue(
          input.disableRegistrationsEnabled,
        ),
        "disable-logins-enable": boolValue(input.disableLoginsEnabled),
        "user-activation-enable": boolValue(input.userActivationEnabled),
        "email-welcome-disable": boolValue(input.emailWelcomeDisabled),
        "notify-new-user-enable": boolValue(input.notifyNewUserEnabled),
        "notify-new-users": serializePhpNumberArray(notifyNewUserLevelIds),
        "restrict-signups-by-email": domains.length
          ? serializePhpStringArray(domains)
          : "",
        "pw-encrypt-force-enable": boolValue(input.passwordEncryptForceEnabled),
        "pw-encryption":
          input.passwordEncryption === "SHA256" ? "SHA256" : "MD5",
        "guest-redirect": input.guestRedirect.trim(),
        "new-user-redirect": input.newUserRedirect.trim(),
        "signout-redirect-referrer-enable": boolValue(
          input.signoutRedirectReferrerEnabled,
        ),
        "signout-redirect-url": input.signoutRedirectUrl.trim(),
        "signin-redirect-referrer-enable": boolValue(
          input.signinRedirectReferrerEnabled,
        ),
        "signin-redirect-url": input.signinRedirectUrl.trim(),
      }),
    );

    revalidateLegacyAuthSettingsPaths();
    return getLegacyAuthSettings();
  } catch (error) {
    console.error("Failed to update legacy auth general settings:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update legacy auth general settings",
    };
  }
}

export async function updateLegacyAuthDeniedSettings(
  input: LegacyAuthDeniedSettingsInput,
): Promise<ActionResult<LegacyAuthSettingsData>> {
  try {
    await requireLegacyAdminPanelAccess();
    const source = sourceFromKey(input.sourceKey);
    if (!source) return { success: false, error: "Unknown legacy settings source" };

    await db.$transaction((tx) =>
      upsertLegacySettings(tx, source, {
        "block-msg-enable": boolValue(input.blockMessageEnabled),
        "block-msg": input.blockMessage,
        "block-msg-out-enable": boolValue(input.guestBlockMessageEnabled),
        "block-msg-out": input.guestBlockMessage,
      }),
    );

    revalidateLegacyAuthSettingsPaths();
    return getLegacyAuthSettings();
  } catch (error) {
    console.error("Failed to update legacy auth denied settings:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update legacy auth denied settings",
    };
  }
}

export async function updateLegacyAuthIntegrationSettings(
  input: LegacyAuthIntegrationSettingsInput,
): Promise<ActionResult<LegacyAuthSettingsData>> {
  try {
    await requireLegacyAdminPanelAccess();
    const source = sourceFromKey(input.sourceKey);
    if (!source) return { success: false, error: "Unknown legacy settings source" };

    const captchaProvider =
      input.captchaProvider === "reCAPTCHA" || input.captchaProvider === "playThru"
        ? input.captchaProvider
        : "disableCaptcha";

    await db.$transaction((tx) =>
      upsertLegacySettings(tx, source, {
        "integration-twitter-enable": boolValue(input.twitterEnabled),
        "twitter-key": input.twitterKey.trim(),
        "twitter-secret": input.twitterSecret.trim(),
        "integration-facebook-enable": boolValue(input.facebookEnabled),
        "facebook-app-id": input.facebookAppId.trim(),
        "facebook-app-secret": input.facebookAppSecret.trim(),
        "integration-google-enable": boolValue(input.googleEnabled),
        "google-id": input.googleId.trim(),
        "google-secret": input.googleSecret.trim(),
        "integration-yahoo-enable": boolValue(input.yahooEnabled),
        "integration-captcha": captchaProvider,
        "reCAPTCHA-public-key": input.recaptchaPublicKey.trim(),
        "reCAPTCHA-private-key": input.recaptchaPrivateKey.trim(),
        "playThru-publisher-key": input.playThruPublisherKey.trim(),
        "playThru-scoring-key": input.playThruScoringKey.trim(),
      }),
    );

    revalidateLegacyAuthSettingsPaths();
    return getLegacyAuthSettings();
  } catch (error) {
    console.error("Failed to update legacy auth integration settings:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update legacy auth integration settings",
    };
  }
}

export async function updateLegacyAuthUpdateSettings(
  input: LegacyAuthUpdateSettingsInput,
): Promise<ActionResult<LegacyAuthSettingsData>> {
  try {
    await requireLegacyAdminPanelAccess();
    const source = sourceFromKey(input.sourceKey);
    if (!source) return { success: false, error: "Unknown legacy settings source" };

    await db.$transaction((tx) =>
      upsertLegacySettings(tx, source, {
        "update-check-enable": boolValue(input.updateCheckEnabled),
      }),
    );

    revalidateLegacyAuthSettingsPaths();
    return getLegacyAuthSettings();
  } catch (error) {
    console.error("Failed to update legacy auth update settings:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update legacy auth update settings",
    };
  }
}
