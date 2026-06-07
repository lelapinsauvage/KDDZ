"use server";

import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";

import { db } from "@/lib/db";
import { deliverEmail, emailDeliveryAuditData } from "@/lib/email-delivery";
import { getLegacyAccessPermissionDecision } from "@/lib/legacy-access-permissions";
import { requireOrgSafe } from "@/lib/require-org";
import { isAdminRole } from "@/lib/require-role";

const MIN_PASSWORD_LENGTH = 5;
const SOCIAL_LOGIN_PROVIDERS = ["twitter", "facebook", "google", "yahoo"] as const;

type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
};

type LegacyUserRecordType = "login_user" | "manager_login_user";
type LegacyProfileFieldType = "text_input" | "checkbox" | "textarea";

export type LegacyProfileFieldValue = {
  fieldLegacyId: number;
  label: string;
  section: string;
  fieldType: LegacyProfileFieldType;
  value: string;
  isPublic: boolean;
};

export type LegacyProfileAccessLogEntry = {
  id: string;
  occurredAt: string | null;
  ipAddress: string | null;
};

export type LegacyProfileIntegrationMethod = {
  provider: string;
  enabled: boolean;
  linked: boolean;
  identifier: string | null;
};

export type LegacyCurrentProfileData = {
  sourceDatabase: string;
  recordType: LegacyUserRecordType;
  legacyUserId: number;
  username: string;
  name: string;
  email: string;
  imageUrl: string | null;
  customAvatarEnabled: boolean;
  publicProfileEnabled: boolean;
  publicProfileUrl: string | null;
  profileFields: LegacyProfileFieldValue[];
  showAccessLogs: boolean;
  accessLogs: LegacyProfileAccessLogEntry[];
  integrations: LegacyProfileIntegrationMethod[];
};

export type LegacyProfileUpdateInput = {
  currentPassword: string;
  name: string;
  email: string;
  password?: string;
  confirm?: string;
  profileValues?: Array<{
    fieldLegacyId: number;
    value: string | boolean | null;
  }>;
};

export type LegacyProfileUpdateResult = {
  requiresConfirmation: boolean;
  confirmUrl?: string;
};

export type LegacyProfileConfirmationResult = {
  message: string;
};

export type LegacyPublicProfileData = {
  username: string;
  name: string;
  email: string;
  imageUrl: string | null;
  sourceDatabase: string;
  legacyUserId: number;
  profileFields: LegacyProfileFieldValue[];
};

function legacyObject(value: unknown): Prisma.InputJsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonObject;
  }
  return {};
}

function legacyString(value: unknown, key: string) {
  const raw = legacyObject(value)[key];
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  return "";
}

function legacyNumber(value: unknown, key: string) {
  const raw = legacyObject(value)[key];
  const parsed =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseInt(raw, 10)
        : Number.NaN;

  return Number.isInteger(parsed) ? parsed : null;
}

function legacyBoolean(value: unknown, key: string, fallback = false) {
  const raw = legacyObject(value)[key];
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off", ""].includes(normalized)) return false;
  }
  return fallback;
}

function boolSetting(value: string | null | undefined, fallback = false) {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parsePhpLevelIds(serialized: string | null) {
  if (!serialized) return [];
  return Array.from(serialized.matchAll(/s:\d+:"(\d+)"/g))
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value));
}

function normalizeProfileFieldType(
  value: string | null | undefined,
): LegacyProfileFieldType {
  const normalized = value?.trim();
  if (normalized === "checkbox" || normalized === "textarea") {
    return normalized;
  }
  return "text_input";
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function siteAddress() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3001"
  );
}

function profileConfirmUrl(key: string) {
  const base = siteAddress();
  try {
    return new URL(`/profile.php?key=${encodeURIComponent(key)}`, base).toString();
  } catch {
    return `/profile.php?key=${encodeURIComponent(key)}`;
  }
}

function showProfileConfirmationLink() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.LEGACY_SHOW_PROFILE_CONFIRM_LINK === "true"
  );
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    return values[key] ?? match;
  });
}

function chooseSettingValue(
  rows: Array<{
    sourceDatabase: string;
    settingKey: string;
    settingValue: string | null;
  }>,
  sourceDatabase: string,
  key: string,
) {
  const candidates = rows.filter(
    (row) => row.settingKey === key && row.settingValue?.trim(),
  );
  if (candidates.length === 0) return null;

  return (
    candidates.find((row) => row.sourceDatabase === sourceDatabase) ??
    candidates.find((row) =>
      row.sourceDatabase.toLowerCase().includes("users29sept"),
    ) ??
    candidates.find((row) => row.sourceDatabase.toLowerCase().includes("29sept")) ??
    candidates[0]
  ).settingValue;
}

async function legacySettings(sourceDatabase: string, keys: string[]) {
  if (keys.length === 0) return new Map<string, string | null>();
  const rows = await db.legacySetting.findMany({
    where: {
      legacyTable: { in: ["login_settings", "login_settings_man"] },
      settingKey: { in: keys },
    },
    select: {
      sourceDatabase: true,
      settingKey: true,
      settingValue: true,
    },
    orderBy: [{ sourceDatabase: "desc" }, { legacyId: "desc" }],
  });

  return new Map(
    keys.map((key) => [key, chooseSettingValue(rows, sourceDatabase, key)]),
  );
}

async function legacyTemplate(
  sourceDatabase: string,
  subjectKey: string,
  bodyKey: string,
) {
  const settings = await legacySettings(sourceDatabase, [subjectKey, bodyKey]);
  return {
    subject: settings.get(subjectKey) ?? null,
    body: settings.get(bodyKey) ?? null,
  };
}

function profileFieldRecordType(recordType: LegacyUserRecordType) {
  return recordType === "manager_login_user"
    ? "manager_profile_field"
    : "profile_field";
}

function profileValueRecordType(recordType: LegacyUserRecordType) {
  return recordType === "manager_login_user"
    ? "manager_profile_value"
    : "profile_value";
}

function profileValueLegacyTable(recordType: LegacyUserRecordType) {
  return recordType === "manager_login_user"
    ? "login_profiles_man"
    : "login_profiles";
}

function confirmLegacyTable(recordType: LegacyUserRecordType) {
  return recordType === "manager_login_user"
    ? "login_confirm_man"
    : "login_confirm";
}

function auditPrincipal(recordType: LegacyUserRecordType) {
  return recordType === "manager_login_user" ? "MANAGER_USER" : "USER";
}

function socialProviderLabel(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function socialIdentifier(legacyData: unknown, provider: string) {
  const raw = legacyObject(legacyData)[provider];
  const value =
    typeof raw === "string"
      ? raw.trim()
      : typeof raw === "number"
        ? String(raw)
        : "";
  return value && value !== "0" ? value : null;
}

function legacyProfileImageUrl(
  userImage: string | null | undefined,
  legacyData: Prisma.JsonValue | null | undefined,
) {
  return (
    userImage?.trim() ||
    legacyString(legacyData, "avatar") ||
    legacyString(legacyData, "image") ||
    legacyString(legacyData, "gravatar") ||
    null
  );
}

function normalizeStoredProfileImageUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

function profileFieldLegacyIdFromValue(record: {
  legacyId: number;
  recordKey: string | null;
  legacyData: Prisma.JsonValue | null;
}) {
  const fromData = legacyNumber(record.legacyData, "pfield_id");
  if (fromData && fromData > 0) return fromData;

  const match = record.recordKey?.match(/^profile_field:(\d+)$/);
  const fromKey = match ? Number.parseInt(match[1], 10) : Number.NaN;
  return Number.isInteger(fromKey) && fromKey > 0 ? fromKey : record.legacyId;
}

function normalizeProfileValue(
  fieldType: LegacyProfileFieldType,
  value: string | boolean | null,
) {
  if (fieldType === "checkbox") {
    return value === true ||
      value === "1" ||
      (typeof value === "string" &&
        ["true", "yes", "on"].includes(value.trim().toLowerCase()))
      ? "1"
      : "0";
  }

  if (value === null) return "";
  return typeof value === "string" ? value : String(value);
}

async function verifyPassword(password: string, passwordHash: string | null) {
  if (!passwordHash) return false;
  if (await compare(password, passwordHash)) return true;
  const legacyMd5 = createHash("md5").update(password).digest("hex");
  return compare(`md5:${legacyMd5}`, passwordHash);
}

async function findCurrentLegacyProfile(userId: string) {
  const records = await db.legacyAuthRecord.findMany({
    where: {
      userId,
      recordType: { in: ["login_user", "manager_login_user"] },
    },
    orderBy: [{ sourceDatabase: "desc" }, { legacyId: "desc" }],
    select: {
      id: true,
      sourceDatabase: true,
      legacyTable: true,
      legacyId: true,
      recordType: true,
      legacyUserId: true,
      username: true,
      email: true,
      recordKey: true,
      recordValue: true,
      isDisabled: true,
      legacyData: true,
    },
  });

  return (
    records.find((record) => record.recordType === "login_user") ??
    records.find((record) => record.recordType === "manager_login_user") ??
    null
  );
}

async function buildLegacyProfileFields(params: {
  sourceDatabase: string;
  recordType: LegacyUserRecordType;
  legacyUserId: number;
}) {
  const [fieldRecords, valueRecords] = await Promise.all([
    db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase: params.sourceDatabase,
        recordType: profileFieldRecordType(params.recordType),
      },
      orderBy: [{ legacyId: "asc" }],
      select: {
        id: true,
        legacyId: true,
        recordKey: true,
        recordValue: true,
        isDisabled: true,
        legacyData: true,
      },
    }),
    db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase: params.sourceDatabase,
        legacyUserId: params.legacyUserId,
        recordType: profileValueRecordType(params.recordType),
      },
      orderBy: [{ legacyId: "asc" }],
      select: {
        id: true,
        legacyId: true,
        recordKey: true,
        recordValue: true,
        legacyData: true,
      },
    }),
  ]);

  const valuesByField = new Map(
    valueRecords.map((record) => [
      profileFieldLegacyIdFromValue(record),
      record,
    ]),
  );
  const fields = fieldRecords.map((record) => {
    const data = legacyObject(record.legacyData);
    const fieldLegacyId = record.legacyId;
    const label =
      legacyString(data, "label") ||
      record.recordKey ||
      `Profile field ${fieldLegacyId}`;
    const valueRecord = valuesByField.get(fieldLegacyId);

    return {
      fieldLegacyId,
      label,
      section: legacyString(data, "section") || "Profile",
      fieldType: normalizeProfileFieldType(
        legacyString(data, "type") || record.recordValue,
      ),
      value: valueRecord?.recordValue ?? "",
      isPublic: legacyBoolean(data, "public", !(record.isDisabled ?? false)),
    } satisfies LegacyProfileFieldValue;
  });
  const knownFieldIds = new Set(fields.map((field) => field.fieldLegacyId));

  for (const valueRecord of valueRecords) {
    const fieldLegacyId = profileFieldLegacyIdFromValue(valueRecord);
    if (knownFieldIds.has(fieldLegacyId)) continue;
    fields.push({
      fieldLegacyId,
      label: valueRecord.recordKey ?? `Profile field ${fieldLegacyId}`,
      section: "Legacy profile",
      fieldType: "text_input",
      value: valueRecord.recordValue ?? "",
      isPublic: true,
    });
  }

  return fields.sort((a, b) => {
    const section = a.section.localeCompare(b.section);
    if (section !== 0) return section;
    return a.fieldLegacyId - b.fieldLegacyId;
  });
}

async function saveLegacyProfileValues(
  tx: Prisma.TransactionClient,
  params: {
    sourceDatabase: string;
    recordType: LegacyUserRecordType;
    legacyUserId: number;
    userId: string;
    values: LegacyProfileUpdateInput["profileValues"];
  },
) {
  if (!params.values?.length) return;

  const submittedByField = new Map<number, string | boolean | null>();
  for (const value of params.values) {
    const fieldLegacyId = Number(value.fieldLegacyId);
    if (Number.isInteger(fieldLegacyId) && fieldLegacyId > 0) {
      submittedByField.set(fieldLegacyId, value.value);
    }
  }
  if (submittedByField.size === 0) return;

  const fieldRecords = await tx.legacyAuthRecord.findMany({
    where: {
      sourceDatabase: params.sourceDatabase,
      recordType: profileFieldRecordType(params.recordType),
      legacyId: { in: Array.from(submittedByField.keys()) },
    },
    select: {
      legacyId: true,
      recordKey: true,
      recordValue: true,
      isDisabled: true,
      legacyData: true,
    },
  });
  const fieldsById = new Map(
    fieldRecords.map((record) => {
      const data = legacyObject(record.legacyData);
      return [
        record.legacyId,
        {
          label:
            legacyString(data, "label") ||
            record.recordKey ||
            `Profile field ${record.legacyId}`,
          fieldType: normalizeProfileFieldType(
            legacyString(data, "type") || record.recordValue,
          ),
        },
      ];
    }),
  );
  const valueRecordType = profileValueRecordType(params.recordType);
  const legacyTable = profileValueLegacyTable(params.recordType);
  const existingValueRecords = await tx.legacyAuthRecord.findMany({
    where: {
      sourceDatabase: params.sourceDatabase,
      legacyUserId: params.legacyUserId,
      recordType: valueRecordType,
    },
    select: {
      id: true,
      legacyId: true,
      recordKey: true,
      recordValue: true,
      legacyData: true,
    },
  });
  const existingByField = new Map(
    existingValueRecords.map((record) => [
      profileFieldLegacyIdFromValue(record),
      record,
    ]),
  );
  const maxValueRecord = await tx.legacyAuthRecord.findFirst({
    where: { sourceDatabase: params.sourceDatabase, legacyTable },
    orderBy: { legacyId: "desc" },
    select: { legacyId: true },
  });
  let nextLegacyId = (maxValueRecord?.legacyId ?? 0) + 1;

  for (const fieldLegacyId of Array.from(submittedByField.keys()).sort(
    (a, b) => a - b,
  )) {
    const field = fieldsById.get(fieldLegacyId);
    const existing = existingByField.get(fieldLegacyId);
    if (!field && !existing) continue;

    const label =
      field?.label ?? existing?.recordKey ?? `Profile field ${fieldLegacyId}`;
    const recordValue = normalizeProfileValue(
      field?.fieldType ?? "text_input",
      submittedByField.get(fieldLegacyId) ?? null,
    );
    const legacyData = {
      pfield_id: fieldLegacyId,
      user_id: params.legacyUserId,
      profile_label: label,
      profile_value: recordValue,
      updated_from: "modern_profile",
    } satisfies Prisma.InputJsonObject;

    if (existing) {
      await tx.legacyAuthRecord.update({
        where: { id: existing.id },
        data: {
          recordKey: label,
          recordValue,
          legacyData: {
            ...legacyObject(existing.legacyData),
            ...legacyData,
          },
        },
      });
      continue;
    }

    const legacyId = nextLegacyId;
    nextLegacyId += 1;
    await tx.legacyAuthRecord.create({
      data: {
        sourceDatabase: params.sourceDatabase,
        legacyTable,
        legacyKey: `${params.sourceDatabase}:${legacyTable}:${legacyId}`,
        legacyId,
        recordType: valueRecordType,
        userId: params.userId,
        legacyUserId: params.legacyUserId,
        recordKey: label,
        recordValue,
        legacyData: {
          p_id: legacyId,
          ...legacyData,
          inserted_from: "modern_profile",
        },
      },
    });
  }
}

export async function changeCurrentUserPassword(
  password: string,
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };

  if (!password) {
    return { success: false, error: "No Change !" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  try {
    const existing = await db.user.findUnique({
      where: { id: result.ctx.userId },
      select: { id: true, isActive: true },
    });
    if (!existing?.isActive) {
      return { success: false, error: "User not found" };
    }

    const passwordHash = await hash(password, 12);
    await db.user.update({
      where: { id: result.ctx.userId },
      data: { passwordHash },
    });

    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("changeCurrentUserPassword error:", error);
    return { success: false, error: "Failed to update password" };
  }
}

export async function getCurrentLegacyProfile(): Promise<
  LegacyCurrentProfileData | null
> {
  const result = await requireOrgSafe();
  if (!result.ok) return null;

  const legacyRecord = await findCurrentLegacyProfile(result.ctx.userId);
  if (!legacyRecord) return null;

  const recordType = legacyRecord.recordType as LegacyUserRecordType;
  const legacyUserId = legacyRecord.legacyUserId ?? legacyRecord.legacyId;
  const [settings, profileFields, socialIntegration, userImage] = await Promise.all([
    legacySettings(legacyRecord.sourceDatabase, [
      "custom-avatar-enable",
      "profile-public-enable",
      "profile-timestamps-enable",
      "profile-timestamps-admin-enable",
      ...SOCIAL_LOGIN_PROVIDERS.map(
        (provider) => `integration-${provider}-enable`,
      ),
    ]),
    buildLegacyProfileFields({
      sourceDatabase: legacyRecord.sourceDatabase,
      recordType,
      legacyUserId,
    }),
    recordType === "login_user"
      ? db.legacyAuthRecord.findFirst({
          where: {
            sourceDatabase: legacyRecord.sourceDatabase,
            legacyUserId,
            recordType: "social_integration",
          },
          orderBy: [{ legacyId: "desc" }],
          select: { legacyData: true },
        })
      : Promise.resolve(null),
    db.user.findUnique({
      where: { id: result.ctx.userId },
      select: { image: true },
    }),
  ]);

  const levelIds = parsePhpLevelIds(legacyRecord.recordValue);
  const timestampsEnabled = boolSetting(
    settings.get("profile-timestamps-enable"),
  );
  const timestampsAdminOnly = boolSetting(
    settings.get("profile-timestamps-admin-enable"),
  );
  const showAccessLogs =
    timestampsEnabled && !(timestampsAdminOnly && !levelIds.includes(1));
  const accessLogs = showAccessLogs
    ? await db.legacyLoginTimestamp.findMany({
        where: {
          sourceDatabase: legacyRecord.sourceDatabase,
          legacyUserId,
          principalType: auditPrincipal(recordType),
        },
        orderBy: [{ occurredAt: "desc" }, { legacyId: "desc" }],
        take: 10,
        select: {
          id: true,
          occurredAt: true,
          ipAddress: true,
        },
      })
    : [];
  const publicProfileEnabled = boolSetting(
    settings.get("profile-public-enable"),
  );
  const customAvatarEnabled = boolSetting(
    settings.get("custom-avatar-enable"),
    true,
  );
  const username =
    legacyRecord.username ||
    legacyRecord.recordKey ||
    legacyString(legacyRecord.legacyData, "username") ||
    "";
  const name = legacyString(legacyRecord.legacyData, "name");
  const email =
    legacyRecord.email || legacyString(legacyRecord.legacyData, "email") || "";
  const integrations = SOCIAL_LOGIN_PROVIDERS.map((provider) => {
    const identifier = socialIdentifier(socialIntegration?.legacyData, provider);
    return {
      provider: socialProviderLabel(provider),
      enabled: boolSetting(settings.get(`integration-${provider}-enable`)),
      linked: Boolean(identifier),
      identifier,
    };
  }).filter((method) => method.enabled || method.linked);

  return {
    sourceDatabase: legacyRecord.sourceDatabase,
    recordType,
    legacyUserId,
    username,
    name,
    email,
    imageUrl: legacyProfileImageUrl(userImage?.image, legacyRecord.legacyData),
    customAvatarEnabled,
    publicProfileEnabled,
    publicProfileUrl: publicProfileEnabled
      ? `${siteAddress().replace(/\/$/, "")}/profile.php?uid=${legacyUserId}`
      : null,
    profileFields,
    showAccessLogs,
    accessLogs: accessLogs.map((entry) => ({
      id: entry.id,
      occurredAt: entry.occurredAt?.toISOString() ?? null,
      ipAddress: entry.ipAddress,
    })),
    integrations,
  };
}

export async function getPublicLegacyProfile(
  uid: string | number,
): Promise<ActionResult<LegacyPublicProfileData>> {
  const legacyUserId =
    typeof uid === "number" ? uid : Number.parseInt(String(uid), 10);
  if (!Number.isInteger(legacyUserId) || legacyUserId <= 0) {
    return { success: false, error: "Sorry, that user does not exist." };
  }

  try {
    const record = await db.legacyAuthRecord.findFirst({
      where: {
        recordType: "login_user",
        OR: [{ legacyUserId }, { legacyId: legacyUserId }],
      },
      orderBy: [{ sourceDatabase: "desc" }, { legacyId: "desc" }],
      select: {
        userId: true,
        sourceDatabase: true,
        legacyId: true,
        legacyUserId: true,
        username: true,
        email: true,
        recordKey: true,
        legacyData: true,
      },
    });

    if (!record) {
      return { success: false, error: "Sorry, that user does not exist." };
    }
    const userImage = record.userId
      ? await db.user.findUnique({
          where: { id: record.userId },
          select: { image: true },
        })
      : null;

    const settings = await legacySettings(record.sourceDatabase, [
      "profile-public-enable",
    ]);
    if (!boolSetting(settings.get("profile-public-enable"))) {
      return { success: false, error: "This profile is private." };
    }

    const resolvedLegacyUserId = record.legacyUserId ?? record.legacyId;
    const profileFields = await buildLegacyProfileFields({
      sourceDatabase: record.sourceDatabase,
      recordType: "login_user",
      legacyUserId: resolvedLegacyUserId,
    });

    return {
      success: true,
      data: {
        username:
          record.username ||
          record.recordKey ||
          legacyString(record.legacyData, "username") ||
          `User ${resolvedLegacyUserId}`,
        name: legacyString(record.legacyData, "name") || "Unnamed",
        email: record.email || legacyString(record.legacyData, "email") || "",
        imageUrl: legacyProfileImageUrl(userImage?.image, record.legacyData),
        sourceDatabase: record.sourceDatabase,
        legacyUserId: resolvedLegacyUserId,
        profileFields,
      },
    };
  } catch (error) {
    console.error("getPublicLegacyProfile error:", error);
    return { success: false, error: "Unable to load public profile." };
  }
}

export async function updateCurrentUserLegacyProfileImage(
  imageUrl: string | null,
): Promise<ActionResult<{ imageUrl: string | null }>> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;
  const normalizedImageUrl = normalizeStoredProfileImageUrl(imageUrl);

  if (imageUrl && !normalizedImageUrl) {
    return { success: false, error: "Invalid avatar URL." };
  }

  try {
    const [user, legacyRecord] = await Promise.all([
      db.user.findUnique({
        where: { id: ctx.userId },
        select: { id: true, isActive: true },
      }),
      findCurrentLegacyProfile(ctx.userId),
    ]);

    if (!user?.isActive) {
      return { success: false, error: "User not found" };
    }
    if (!legacyRecord) {
      return {
        success: false,
        error: "Legacy profile metadata is not linked to this account.",
      };
    }

    const settings = await legacySettings(legacyRecord.sourceDatabase, [
      "custom-avatar-enable",
    ]);
    if (!boolSetting(settings.get("custom-avatar-enable"), true)) {
      return { success: false, error: "Custom avatar uploads are disabled." };
    }

    const updatedAt = new Date().toISOString();
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { image: normalizedImageUrl },
      }),
      db.legacyAuthRecord.update({
        where: { id: legacyRecord.id },
        data: {
          legacyData: {
            ...legacyObject(legacyRecord.legacyData),
            avatar: normalizedImageUrl ?? "",
            image: normalizedImageUrl ?? "",
            avatarUpdatedAt: updatedAt,
            avatar_updated_from: "modern_profile",
          },
        },
      }),
    ]);

    revalidatePath("/profile");
    revalidatePath("/profile.php");
    revalidatePath("/users/profile.php");

    return { success: true, data: { imageUrl: normalizedImageUrl } };
  } catch (error) {
    console.error("updateCurrentUserLegacyProfileImage error:", error);
    return { success: false, error: "Failed to update avatar" };
  }
}

export async function updateCurrentUserLegacyProfile(
  input: LegacyProfileUpdateInput,
): Promise<ActionResult<LegacyProfileUpdateResult>> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password?.trim() ?? "";
  const confirm = input.confirm?.trim() ?? "";

  if (!input.currentPassword) {
    return {
      success: false,
      error: "You must enter the current password to make changes.",
    };
  }
  if (!name) {
    return { success: false, error: "You must enter a name." };
  }
  if (!validateEmail(email)) {
    return {
      success: false,
      error: "You have entered an invalid e-mail address, try again.",
    };
  }
  if (password) {
    if (password !== confirm) {
      return { success: false, error: "Your passwords did not match." };
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      };
    }
  }

  try {
    const [user, legacyRecord] = await Promise.all([
      db.user.findUnique({
        where: { id: ctx.userId },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          isActive: true,
        },
      }),
      findCurrentLegacyProfile(ctx.userId),
    ]);

    if (!user?.isActive) {
      return { success: false, error: "User not found" };
    }
    if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
      return {
        success: false,
        error: "You entered the wrong current password.",
      };
    }
    if (!legacyRecord) {
      return {
        success: false,
        error: "Legacy profile metadata is not linked to this account.",
      };
    }

    const duplicateModern = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (duplicateModern && duplicateModern.id !== user.id) {
      return {
        success: false,
        error: "That email address has already been taken.",
      };
    }

    const recordType = legacyRecord.recordType as LegacyUserRecordType;
    const legacyUserId = legacyRecord.legacyUserId ?? legacyRecord.legacyId;
    const username =
      legacyRecord.username ||
      legacyRecord.recordKey ||
      legacyString(legacyRecord.legacyData, "username") ||
      user.email;
    const currentEmail =
      legacyRecord.email ||
      legacyString(legacyRecord.legacyData, "email") ||
      user.email;
    const passwordHash = password ? await hash(password, 12) : "";
    const requiresConfirmation = Boolean(passwordHash || email !== currentEmail);
    const pendingTemplate = requiresConfirmation
      ? await legacyTemplate(
          legacyRecord.sourceDatabase,
          "email-acct-update-subj",
          "email-acct-update-msg",
        )
      : null;
    const confirmationEmail = requiresConfirmation
      ? (() => {
          const key = randomBytes(16).toString("hex");
          const href = profileConfirmUrl(key);
          const values = {
            site_address: siteAddress(),
            full_name: name,
            username,
            confirm: href,
          };
          const subject = renderTemplate(
            pendingTemplate?.subject ?? "Confirm account update",
            values,
          );
          const body = renderTemplate(
            pendingTemplate?.body ??
              "Please confirm your account update by visiting {{confirm}}",
            values,
          );
          const legacyTable = confirmLegacyTable(recordType);
          const tokenLegacyData = {
            username,
            key,
            email,
            type: "update_emailPw",
            data: passwordHash,
            confirm: href,
            emailSubject: subject,
            emailBody: body,
            deliveryConfigured: false,
            inserted_from: "modern_profile",
          };

          return {
            key,
            href,
            legacyTable,
            subject,
            body,
            legacyData: tokenLegacyData,
          };
        })()
      : null;
    const confirmUrl = confirmationEmail?.href;

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { name },
      });

      await tx.legacyAuthRecord.update({
        where: { id: legacyRecord.id },
        data: {
          legacyUserId,
          username,
          recordKey: username,
          legacyData: {
            ...legacyObject(legacyRecord.legacyData),
            user_id: legacyUserId,
            username,
            name,
            email: currentEmail,
            updated_from: "modern_profile",
          },
        },
      });

      await saveLegacyProfileValues(tx, {
        sourceDatabase: legacyRecord.sourceDatabase,
        recordType,
        legacyUserId,
        userId: user.id,
        values: input.profileValues,
      });

      if (!confirmationEmail) return;

      await tx.legacyAuthRecord.create({
        data: {
          sourceDatabase: legacyRecord.sourceDatabase,
          legacyTable: confirmationEmail.legacyTable,
          legacyKey: `${legacyRecord.sourceDatabase}:${confirmationEmail.legacyTable}:update_emailPw:${confirmationEmail.key}`,
          legacyId: 0,
          recordType: "update_emailPw",
          userId: user.id,
          legacyUserId,
          username,
          email,
          recordKey: confirmationEmail.key,
          recordValue: passwordHash,
          legacyData: confirmationEmail.legacyData,
        },
      });
    });
    if (confirmationEmail) {
      const emailDelivery = await deliverEmail({
        recipients: [{ email, name }],
        subject: confirmationEmail.subject,
        body: confirmationEmail.body,
        category: "ACCOUNT_UPDATE_VERIFY",
        metadata: {
          source: "legacy_profile_update_confirmation",
          tokenKey: confirmationEmail.key,
        },
      });
      await db.legacyAuthRecord.updateMany({
        where: {
          legacyTable: confirmationEmail.legacyTable,
          recordType: "update_emailPw",
          recordKey: confirmationEmail.key,
        },
        data: {
          legacyData: {
            ...confirmationEmail.legacyData,
            deliveryConfigured: emailDelivery.configured,
            emailDelivery: emailDeliveryAuditData(emailDelivery),
          },
        },
      });
    }

    revalidatePath("/profile");
    revalidatePath("/profile.php");
    revalidatePath("/users/profile.php");

    return {
      success: true,
      data: {
        requiresConfirmation,
        confirmUrl:
          requiresConfirmation && confirmUrl && showProfileConfirmationLink()
            ? confirmUrl
            : undefined,
      },
    };
  } catch (error) {
    console.error("updateCurrentUserLegacyProfile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function confirmCurrentUserLegacyProfileUpdate(
  key: string,
): Promise<ActionResult<LegacyProfileConfirmationResult>> {
  const trimmedKey = key.trim();
  if (!/^[a-f0-9]{32}$/i.test(trimmedKey)) {
    return { success: false, error: "Incorrect confirmation link" };
  }

  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  try {
    const [user, legacyRecord, token] = await Promise.all([
      db.user.findUnique({
        where: { id: ctx.userId },
        select: { id: true, email: true, name: true, isActive: true },
      }),
      findCurrentLegacyProfile(ctx.userId),
      db.legacyAuthRecord.findFirst({
        where: {
          legacyTable: { in: ["login_confirm", "login_confirm_man"] },
          recordType: "update_emailPw",
          recordKey: trimmedKey,
        },
        select: {
          id: true,
          sourceDatabase: true,
          userId: true,
          legacyUserId: true,
          username: true,
          email: true,
          recordValue: true,
          legacyData: true,
        },
      }),
    ]);

    if (!user?.isActive || !legacyRecord || !token) {
      return { success: false, error: "Incorrect confirmation link" };
    }

    const legacyUserId = legacyRecord.legacyUserId ?? legacyRecord.legacyId;
    if (
      (token.userId && token.userId !== user.id) ||
      (token.legacyUserId && token.legacyUserId !== legacyUserId)
    ) {
      return { success: false, error: "Incorrect confirmation link" };
    }

    const email = token.email?.trim().toLowerCase();
    if (!email || !validateEmail(email)) {
      return { success: false, error: "Incorrect confirmation link" };
    }

    const duplicateModern = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (duplicateModern && duplicateModern.id !== user.id) {
      return {
        success: false,
        error: "That email address has already been taken.",
      };
    }

    const passwordHash =
      token.recordValue ||
      legacyString(token.legacyData, "data") ||
      legacyString(token.legacyData, "passwordHash");
    const template = await legacyTemplate(
      legacyRecord.sourceDatabase,
      "email-acct-update-success-subj",
      "email-acct-update-success-msg",
    );
    const username =
      token.username ||
      legacyRecord.username ||
      legacyRecord.recordKey ||
      legacyString(legacyRecord.legacyData, "username") ||
      email;
    const name =
      user.name || legacyString(legacyRecord.legacyData, "name") || username;
    const values = {
      site_address: siteAddress(),
      full_name: name,
      username,
    };
    const successSubject = renderTemplate(
      template.subject ?? "Account details successfully changed",
      values,
    );
    const successBody = renderTemplate(
      template.body ?? "Account details successfully changed.",
      values,
    );
    const usedAt = new Date().toISOString();

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          email,
          ...(passwordHash ? { passwordHash } : {}),
        },
      }),
      db.legacyAuthRecord.update({
        where: { id: legacyRecord.id },
        data: {
          email,
          legacyData: {
            ...legacyObject(legacyRecord.legacyData),
            email,
            ...(passwordHash
              ? { password_updated_from: "modern_profile_confirm" }
              : {}),
            updated_from: "modern_profile_confirm",
          },
        },
      }),
      db.legacyAuthRecord.update({
        where: { id: token.id },
        data: {
          recordType: "update_emailPw_used",
          legacyData: {
            ...legacyObject(token.legacyData),
            usedAt,
            emailSubject: successSubject,
            emailBody: successBody,
            deliveryConfigured: false,
          },
        },
      }),
    ]);
    const emailDelivery = await deliverEmail({
      recipients: [{ email, name }],
      subject: successSubject,
      body: successBody,
      category: "ACCOUNT_UPDATE_SUCCESS",
      metadata: {
        source: "legacy_profile_update_success",
        tokenId: token.id,
      },
    });

    await db.legacyAuthRecord.update({
      where: { id: token.id },
      data: {
        legacyData: {
          ...legacyObject(token.legacyData),
          usedAt,
          emailSubject: successSubject,
          emailBody: successBody,
          deliveryConfigured: emailDelivery.configured,
          emailDelivery: emailDeliveryAuditData(emailDelivery),
        },
      },
    });

    revalidatePath("/profile");
    revalidatePath("/profile.php");
    revalidatePath("/users/profile.php");

    return {
      success: true,
      data: { message: "Account details successfully changed." },
    };
  } catch (error) {
    console.error("confirmCurrentUserLegacyProfileUpdate error:", error);
    return { success: false, error: "Incorrect confirmation link" };
  }
}

function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function updateActiveSchoolYearDates(
  startDate: string,
  endDate: string,
): Promise<ActionResult> {
  const result = await requireOrgSafe();
  if (!result.ok) return { success: false, error: result.error };
  const { ctx } = result;

  if (!isAdminRole(ctx.role)) {
    return { success: false, error: "Forbidden: insufficient permissions" };
  }
  const editSchoolYearPermission = await getLegacyAccessPermissionDecision(
    ctx,
    "EditSchoolFromTo",
    "ACTION",
  );
  if (editSchoolYearPermission.isConfigured && !editSchoolYearPermission.isAllowed) {
    return { success: false, error: "Forbidden: insufficient permissions" };
  }

  if (!startDate || !endDate) {
    return { success: false, error: "Please Fill both start & end dates" };
  }

  const parsedStartDate = parseDateOnly(startDate);
  const parsedEndDate = parseDateOnly(endDate);
  if (!parsedStartDate || !parsedEndDate) {
    return { success: false, error: "Please Fill both start & end dates" };
  }

  if (parsedEndDate < parsedStartDate) {
    return { success: false, error: "End Date must be after Start Date" };
  }

  try {
    const activeYear = await db.schoolYear.findFirst({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
      },
      select: { id: true },
      orderBy: { startDate: "desc" },
    });

    if (!activeYear) {
      return { success: false, error: "Active scholastic year not found" };
    }

    await db.schoolYear.update({
      where: { id: activeYear.id },
      data: {
        startDate: parsedStartDate,
        endDate: parsedEndDate,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/settings.php");
    revalidatePath("/settings/school-years");

    return { success: true };
  } catch (error) {
    console.error("updateActiveSchoolYearDates error:", error);
    return { success: false, error: "Failed to update scholastic year" };
  }
}
