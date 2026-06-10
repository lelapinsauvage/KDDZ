"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { deliverEmail, emailDeliveryAuditData } from "@/lib/email-delivery";
import { requireLegacyAdminPanelAccess } from "@/lib/legacy-system-action-permissions";

type UserRole = "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
export type LegacyUserRecordType = "login_user" | "manager_login_user";
type LegacyLevelRecordType = "login_level" | "manager_login_level";
type LegacyProfileValueRecordType = "profile_value" | "manager_profile_value";
export type LegacyProfileFieldRecordType =
  | "profile_field"
  | "manager_profile_field";
export type LegacyProfileFieldType = "text_input" | "checkbox" | "textarea";
export type LegacyProfileSignupMode = "hide" | "require" | "optional";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

export type LegacyAdminUserRow = {
  id: string;
  sourceDatabase: string;
  legacyTable: string;
  legacyId: number;
  recordType: LegacyUserRecordType;
  username: string;
  name: string;
  email: string;
  isRestricted: boolean;
  levelIds: number[];
  levelLabels: string[];
  sites: string;
  classes: string;
  userId: string | null;
  modernRole: UserRole | null;
  modernActive: boolean | null;
  registeredAt: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  loginCount: number;
  loginHistory: LegacyAdminLoginHistoryEntry[];
  profileValues: LegacyAdminProfileValue[];
  socialIntegrations: LegacyAdminSocialIntegration[];
};

export type LegacyAdminLoginHistoryEntry = {
  id: string;
  legacyId: number;
  legacyTable: string;
  occurredAt: string | null;
  ipAddress: string | null;
};

export type LegacyAdminProfileValue = {
  id: string;
  legacyId: number;
  fieldLegacyId: number;
  label: string;
  value: string | null;
  fieldType: LegacyProfileFieldType;
  section: string;
  isPublic: boolean;
  signup: LegacyProfileSignupMode;
  hasStoredValue: boolean;
};

export type LegacyAdminSocialIntegration = {
  providerKey: string;
  provider: string;
  identifier: string;
};

type LegacyAdminProfileFieldDefinition = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  label: string;
  fieldType: LegacyProfileFieldType;
  section: string;
  isPublic: boolean;
  signup: LegacyProfileSignupMode;
  recordType: LegacyProfileFieldRecordType;
};

export type LegacyAdminProfileFieldRow =
  LegacyAdminProfileFieldDefinition & {
    legacyTable: "login_profile_fields" | "login_profile_fields_man";
    valueCount: number;
  };

export type LegacyAdminProfileFieldsData = {
  groups: LegacyAdminUserGroup[];
  fields: LegacyAdminProfileFieldRow[];
};

export type LegacyAdminProfileFieldInput = {
  sourceDatabase: string;
  recordType: LegacyProfileFieldRecordType;
  section: string;
  fieldType: LegacyProfileFieldType;
  label: string;
  signup: LegacyProfileSignupMode;
  isPublic: boolean;
};

export type LegacyAdminProfileValueInput = {
  fieldLegacyId: number;
  value: string | boolean | null;
};

export type LegacyAdminLevelOption = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  label: string;
  recordType: LegacyLevelRecordType;
  isDisabled: boolean;
  welcomeEmail: boolean;
};

export type LegacyAdminUserGroup = {
  key: string;
  sourceDatabase: string;
  recordType: LegacyUserRecordType;
  label: string;
  levelRecordType: LegacyLevelRecordType;
};

export type LegacyAdminBranchOption = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  label: string;
};

export type LegacyAdminClassOption = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  label: string;
  branchLegacyId: number | null;
  branchLabel: string | null;
};

export type LegacyAdminUsersData = {
  users: LegacyAdminUserRow[];
  levels: LegacyAdminLevelOption[];
  groups: LegacyAdminUserGroup[];
  branches: LegacyAdminBranchOption[];
  classes: LegacyAdminClassOption[];
};

export type LegacyAdminUserInput = {
  sourceDatabase: string;
  recordType: LegacyUserRecordType;
  name: string;
  username: string;
  email: string;
  password?: string;
  password2?: string;
  levelIds: number[];
  sites?: string;
  classes?: string;
  isRestricted?: boolean;
  profileValues?: LegacyAdminProfileValueInput[];
};

const USER_CONFIG: Record<
  LegacyUserRecordType,
  {
    legacyTable: "login_users" | "login_users_man";
    levelRecordType: LegacyLevelRecordType;
    label: string;
  }
> = {
  login_user: {
    legacyTable: "login_users",
    levelRecordType: "login_level",
    label: "Staff Users",
  },
  manager_login_user: {
    legacyTable: "login_users_man",
    levelRecordType: "manager_login_level",
    label: "Manager Users",
  },
};

const SOCIAL_LOGIN_PROVIDERS = [
  "twitter",
  "facebook",
  "google",
  "yahoo",
] as const;
const PROFILE_FIELD_TYPES = ["text_input", "checkbox", "textarea"] as const;
const PROFILE_SIGNUP_MODES = ["hide", "require", "optional"] as const;

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

function normalizeProfileFieldType(
  value: string | null | undefined,
): LegacyProfileFieldType {
  const normalized = value?.trim();
  if (normalized === "checkbox" || normalized === "textarea") {
    return normalized;
  }
  return "text_input";
}

function normalizeProfileSignupMode(
  value: string | boolean | null | undefined,
): LegacyProfileSignupMode {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "require" || normalized === "optional") {
      return normalized;
    }
    if (normalized === "hide" || normalized === "0" || normalized === "") {
      return "hide";
    }
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return "optional";
    }
  }

  if (value === true) return "optional";
  return "hide";
}

function parsePhpLevelIds(serialized: string | null) {
  if (!serialized) return [];
  return Array.from(serialized.matchAll(/s:\d+:"(\d+)"/g))
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value));
}

function serializePhpStringArray(values: number[]) {
  const ids = Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

  return `a:${ids.length}:{${ids
    .map((value, index) => {
      const stringValue = String(value);
      return `i:${index};s:${stringValue.length}:"${stringValue}";`;
    })
    .join("")}}`;
}

function normalizeIds(values: number[]) {
  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );
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

async function legacyEmailTemplate(
  sourceDatabase: string,
  subjectKey: string,
  bodyKey: string,
) {
  const rows = await db.legacySetting.findMany({
    where: {
      legacyTable: { in: ["login_settings", "login_settings_man"] },
      settingKey: { in: [subjectKey, bodyKey] },
    },
    select: {
      sourceDatabase: true,
      settingKey: true,
      settingValue: true,
    },
    orderBy: [{ sourceDatabase: "desc" }, { legacyId: "desc" }],
  });

  return {
    subject: chooseSettingValue(rows, sourceDatabase, subjectKey),
    body: chooseSettingValue(rows, sourceDatabase, bodyKey),
  };
}

function roleForLegacyLevels(
  levelIds: number[],
  levels: LegacyAdminLevelOption[],
): UserRole {
  const labels = levels
    .filter((level) => levelIds.includes(level.legacyId))
    .map((level) => level.label.toLowerCase());

  if (
    levelIds.includes(1) ||
    levelIds.includes(4) ||
    labels.some((label) => label.includes("admin") || label.includes("owner"))
  ) {
    return "ADMIN";
  }
  if (levelIds.includes(5) || labels.some((label) => label.includes("manager"))) {
    return "MANAGER";
  }
  if (labels.some((label) => label.includes("nurse"))) return "NURSE";
  if (labels.some((label) => label.includes("doctor"))) return "DOCTOR";
  return "TEACHER";
}

function userLegacyData(params: {
  existing?: unknown;
  legacyId: number;
  userLevel: string;
  name: string;
  username: string;
  email: string;
  isRestricted: boolean;
  sites: string;
  classes: string;
  dbId?: string | number | null;
  passwordChanged?: boolean;
}) {
  return {
    ...legacyObject(params.existing),
    user_id: params.legacyId,
    user_level: params.userLevel,
    restricted: params.isRestricted ? 1 : 0,
    username: params.username,
    name: params.name,
    email: params.email,
    usites: params.sites,
    uclasses: params.classes,
    db_id: params.dbId ?? null,
    ...(params.passwordChanged
      ? { password_updated_from: "modern_legacy_user_admin" }
      : {}),
    updated_from: "modern_legacy_user_admin",
  } satisfies Prisma.InputJsonObject;
}

function configForRecordType(recordType: LegacyUserRecordType) {
  return USER_CONFIG[recordType];
}

function auditPrincipalForRecordType(recordType: LegacyUserRecordType) {
  return recordType === "manager_login_user" ? "MANAGER_USER" : "USER";
}

function profileRecordTypeForUser(
  recordType: LegacyUserRecordType,
): LegacyProfileValueRecordType {
  return recordType === "manager_login_user"
    ? "manager_profile_value"
    : "profile_value";
}

function profileFieldRecordTypeForUser(
  recordType: LegacyUserRecordType,
): LegacyProfileFieldRecordType {
  return recordType === "manager_login_user"
    ? "manager_profile_field"
    : "profile_field";
}

function profileLegacyTableForUser(recordType: LegacyUserRecordType) {
  return recordType === "manager_login_user"
    ? "login_profiles_man"
    : "login_profiles";
}

function profileFieldLegacyTableForRecordType(
  recordType: LegacyProfileFieldRecordType,
) {
  return recordType === "manager_profile_field"
    ? "login_profile_fields_man"
    : "login_profile_fields";
}

function profileValueRecordTypeForField(
  recordType: LegacyProfileFieldRecordType,
): LegacyProfileValueRecordType {
  return recordType === "manager_profile_field"
    ? "manager_profile_value"
    : "profile_value";
}

function profileSourceUserRecordType(
  recordType: LegacyProfileFieldRecordType,
): LegacyUserRecordType {
  return recordType === "manager_profile_field"
    ? "manager_login_user"
    : "login_user";
}

function isProfileFieldRecordType(
  recordType: string,
): recordType is LegacyProfileFieldRecordType {
  return recordType === "profile_field" || recordType === "manager_profile_field";
}

function profileGroupKey(
  sourceDatabase: string,
  recordType: LegacyUserRecordType,
) {
  return `${sourceDatabase}:${recordType}`;
}

function userAuditKey(
  sourceDatabase: string,
  recordType: LegacyUserRecordType,
  legacyUserId: number,
) {
  return `${sourceDatabase}:${auditPrincipalForRecordType(recordType)}:${legacyUserId}`;
}

function userProfileKey(
  sourceDatabase: string,
  recordType: LegacyUserRecordType,
  legacyUserId: number,
) {
  return `${sourceDatabase}:${profileRecordTypeForUser(recordType)}:${legacyUserId}`;
}

function userProfileFieldKey(
  sourceDatabase: string,
  recordType: LegacyUserRecordType,
  legacyUserId: number,
  fieldLegacyId: number,
) {
  return `${userProfileKey(sourceDatabase, recordType, legacyUserId)}:${fieldLegacyId}`;
}

function userRecordTypeForProfileRecord(recordType: string): LegacyUserRecordType {
  return recordType === "manager_profile_value" ||
    recordType === "manager_profile_field"
    ? "manager_login_user"
    : "login_user";
}

function userSocialIntegrationKey(sourceDatabase: string, legacyUserId: number) {
  return `${sourceDatabase}:login_user:${legacyUserId}`;
}

function socialProviderLabel(provider: string) {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

function socialIntegrationsFromLegacyData(
  legacyData: unknown,
): LegacyAdminSocialIntegration[] {
  const data = legacyObject(legacyData);

  return SOCIAL_LOGIN_PROVIDERS.flatMap((provider) => {
    const raw = data[provider];
    const value =
      typeof raw === "string"
        ? raw.trim()
        : typeof raw === "number"
          ? String(raw)
          : "";

    if (!value || value === "0") return [];
    return [
      {
        providerKey: provider,
        provider: socialProviderLabel(provider),
        identifier: value,
      },
    ];
  });
}

function normalizeSocialProviderKey(provider: string) {
  const normalized = provider.trim().toLowerCase();
  return SOCIAL_LOGIN_PROVIDERS.find((entry) => entry === normalized) ?? null;
}

function linkedSocialProviderList(data: Prisma.InputJsonObject) {
  return SOCIAL_LOGIN_PROVIDERS.filter((provider) => {
    const value = data[provider];
    return Boolean(
      (typeof value === "string" && value.trim() && value.trim() !== "0") ||
        (typeof value === "number" && value > 0),
    );
  }).join(",");
}

type LegacyProfileFieldRecord = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  recordType: string;
  recordKey: string | null;
  recordValue: string | null;
  isDisabled: boolean | null;
  legacyData: Prisma.JsonValue | null;
};

type LegacyProfileValueRecord = {
  id: string;
  sourceDatabase: string;
  legacyId: number;
  legacyUserId: number | null;
  recordType: string;
  recordKey: string | null;
  recordValue: string | null;
  legacyData: Prisma.JsonValue | null;
};

function profileFieldFromRecord(
  record: LegacyProfileFieldRecord,
): LegacyAdminProfileFieldDefinition {
  const data = legacyObject(record.legacyData);
  const signupRaw = data.signup;
  const label =
    legacyString(data, "label") ||
    record.recordKey ||
    `Profile field ${record.legacyId}`;
  const isPublic = legacyBoolean(
    data,
    "public",
    !(record.isDisabled ?? false),
  );

  return {
    id: record.id,
    sourceDatabase: record.sourceDatabase,
    legacyId: record.legacyId,
    label,
    fieldType: normalizeProfileFieldType(
      legacyString(data, "type") || record.recordValue,
    ),
    section: legacyString(data, "section") || "Profile",
    isPublic,
    signup: normalizeProfileSignupMode(
      typeof signupRaw === "boolean" || typeof signupRaw === "string"
        ? signupRaw
        : legacyString(data, "signup"),
    ),
    recordType: record.recordType as LegacyProfileFieldRecordType,
  };
}

function profileFieldRowFromRecord(
  record: LegacyProfileFieldRecord,
  valueCount = 0,
): LegacyAdminProfileFieldRow {
  const field = profileFieldFromRecord(record);

  return {
    ...field,
    legacyTable: profileFieldLegacyTableForRecordType(field.recordType),
    valueCount,
  };
}

function profileFieldLegacyIdFromValueRecord(record: LegacyProfileValueRecord) {
  const fromData = legacyNumber(record.legacyData, "pfield_id");
  if (fromData && fromData > 0) return fromData;

  const match = record.recordKey?.match(/^profile_field:(\d+)$/);
  const fromKey = match ? Number.parseInt(match[1], 10) : Number.NaN;
  return Number.isInteger(fromKey) && fromKey > 0 ? fromKey : null;
}

function normalizeProfileInputValue(
  field: LegacyAdminProfileFieldDefinition,
  value: string | boolean | null,
) {
  if (field.fieldType === "checkbox") {
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

function buildProfileContext(
  fieldRecords: LegacyProfileFieldRecord[],
  valueRecords: LegacyProfileValueRecord[],
) {
  const fieldsByGroup = new Map<string, LegacyAdminProfileFieldDefinition[]>();
  const fieldIdsByGroup = new Map<string, Set<number>>();

  for (const record of fieldRecords) {
    const field = profileFieldFromRecord(record);
    const recordType = userRecordTypeForProfileRecord(record.recordType);
    const groupKey = profileGroupKey(record.sourceDatabase, recordType);
    const fields = fieldsByGroup.get(groupKey) ?? [];
    const fieldIds = fieldIdsByGroup.get(groupKey) ?? new Set<number>();

    fields.push(field);
    fieldIds.add(field.legacyId);
    fieldsByGroup.set(groupKey, fields);
    fieldIdsByGroup.set(groupKey, fieldIds);
  }

  for (const fields of fieldsByGroup.values()) {
    fields.sort((a, b) => {
      const section = a.section.localeCompare(b.section);
      if (section !== 0) return section;
      return a.legacyId - b.legacyId;
    });
  }

  const valuesByUserField = new Map<string, LegacyProfileValueRecord>();
  const orphanValuesByUser = new Map<string, LegacyProfileValueRecord[]>();

  for (const record of valueRecords) {
    const legacyUserId = record.legacyUserId;
    if (!legacyUserId) continue;

    const recordType = userRecordTypeForProfileRecord(record.recordType);
    const fieldLegacyId = profileFieldLegacyIdFromValueRecord(record);
    const groupKey = profileGroupKey(record.sourceDatabase, recordType);
    const userKey = userProfileKey(record.sourceDatabase, recordType, legacyUserId);

    if (
      fieldLegacyId &&
      (fieldIdsByGroup.get(groupKey)?.has(fieldLegacyId) ?? false)
    ) {
      const valueKey = userProfileFieldKey(
        record.sourceDatabase,
        recordType,
        legacyUserId,
        fieldLegacyId,
      );
      if (!valuesByUserField.has(valueKey)) {
        valuesByUserField.set(valueKey, record);
      }
      continue;
    }

    const orphanValues = orphanValuesByUser.get(userKey) ?? [];
    orphanValues.push(record);
    orphanValuesByUser.set(userKey, orphanValues);
  }

  return { fieldsByGroup, valuesByUserField, orphanValuesByUser };
}

function buildProfileValuesForLegacyUser(params: {
  sourceDatabase: string;
  recordType: LegacyUserRecordType;
  legacyUserId: number;
  context: ReturnType<typeof buildProfileContext>;
}) {
  const groupKey = profileGroupKey(params.sourceDatabase, params.recordType);
  const fields = params.context.fieldsByGroup.get(groupKey) ?? [];
  const values = fields.map((field) => {
    const valueRecord = params.context.valuesByUserField.get(
      userProfileFieldKey(
        params.sourceDatabase,
        params.recordType,
        params.legacyUserId,
        field.legacyId,
      ),
    );

    return {
      id: valueRecord?.id ?? `profile-field:${field.id}:${params.legacyUserId}`,
      legacyId: valueRecord?.legacyId ?? field.legacyId,
      fieldLegacyId: field.legacyId,
      label: field.label,
      value: valueRecord?.recordValue ?? null,
      fieldType: field.fieldType,
      section: field.section,
      isPublic: field.isPublic,
      signup: field.signup,
      hasStoredValue: Boolean(valueRecord),
    };
  });

  const userKey = userProfileKey(
    params.sourceDatabase,
    params.recordType,
    params.legacyUserId,
  );
  const orphanValues = params.context.orphanValuesByUser.get(userKey) ?? [];

  for (const orphan of orphanValues) {
    const fieldLegacyId =
      profileFieldLegacyIdFromValueRecord(orphan) ?? orphan.legacyId;
    values.push({
      id: orphan.id,
      legacyId: orphan.legacyId,
      fieldLegacyId,
      label: orphan.recordKey ?? `Profile field ${fieldLegacyId}`,
      value: orphan.recordValue,
      fieldType: "text_input",
      section: "Legacy profile",
      isPublic: true,
      signup: "hide",
      hasStoredValue: true,
    });
  }

  return values;
}

async function getProfileValuesForUser(
  sourceDatabase: string,
  recordType: LegacyUserRecordType,
  legacyUserId: number,
) {
  const [fieldRecords, valueRecords] = await Promise.all([
    db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase,
        recordType: profileFieldRecordTypeForUser(recordType),
      },
      orderBy: [{ legacyId: "asc" }],
      select: {
        id: true,
        sourceDatabase: true,
        legacyId: true,
        recordType: true,
        recordKey: true,
        recordValue: true,
        isDisabled: true,
        legacyData: true,
      },
    }),
    db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase,
        legacyUserId,
        recordType: profileRecordTypeForUser(recordType),
      },
      orderBy: [{ legacyId: "asc" }],
      select: {
        id: true,
        sourceDatabase: true,
        legacyId: true,
        legacyUserId: true,
        userId: true,
        recordType: true,
        recordKey: true,
        recordValue: true,
        legacyData: true,
      },
    }),
  ]);

  const context = buildProfileContext(fieldRecords, valueRecords);
  return buildProfileValuesForLegacyUser({
    sourceDatabase,
    recordType,
    legacyUserId,
    context,
  });
}

async function getDefaultLevelId(
  sourceDatabase: string,
  recordType: LegacyUserRecordType,
) {
  const setting = await db.legacySetting.findFirst({
    where: {
      sourceDatabase,
      legacyTable:
        recordType === "manager_login_user"
          ? "login_settings_man"
          : "login_settings",
      settingKey: { in: ["default-level", "default_level"] },
    },
    orderBy: { legacyId: "asc" },
    select: { settingValue: true },
  });
  const legacyLevelIds = parsePhpLevelIds(setting?.settingValue ?? null);
  const defaultLevelId =
    legacyLevelIds[0] ?? Number.parseInt(setting?.settingValue ?? "", 10);

  return Number.isInteger(defaultLevelId) && defaultLevelId > 0
    ? defaultLevelId
    : null;
}

async function saveLegacyProfileValues(
  tx: Prisma.TransactionClient,
  params: {
    sourceDatabase: string;
    recordType: LegacyUserRecordType;
    legacyUserId: number;
    userId: string | null;
    values: LegacyAdminProfileValueInput[] | undefined;
  },
) {
  if (!params.values?.length) return;

  const submittedByField = new Map<number, LegacyAdminProfileValueInput>();
  for (const value of params.values) {
    const fieldLegacyId = Number(value.fieldLegacyId);
    if (Number.isInteger(fieldLegacyId) && fieldLegacyId > 0) {
      submittedByField.set(fieldLegacyId, value);
    }
  }
  if (submittedByField.size === 0) return;

  const fieldRecordType = profileFieldRecordTypeForUser(params.recordType);
  const valueRecordType = profileRecordTypeForUser(params.recordType);
  const legacyTable = profileLegacyTableForUser(params.recordType);
  const fieldRecords = await tx.legacyAuthRecord.findMany({
    where: {
      sourceDatabase: params.sourceDatabase,
      recordType: fieldRecordType,
      legacyId: { in: Array.from(submittedByField.keys()) },
    },
    select: {
      id: true,
      sourceDatabase: true,
      legacyId: true,
      recordType: true,
      recordKey: true,
      recordValue: true,
      isDisabled: true,
      legacyData: true,
    },
  });

  const fields = fieldRecords
    .map(profileFieldFromRecord)
    .sort((a, b) => a.legacyId - b.legacyId);
  const fieldsById = new Map(fields.map((field) => [field.legacyId, field]));
  const existingValueRecords = await tx.legacyAuthRecord.findMany({
    where: {
      sourceDatabase: params.sourceDatabase,
      legacyUserId: params.legacyUserId,
      recordType: valueRecordType,
    },
    select: {
      id: true,
      sourceDatabase: true,
      legacyId: true,
      legacyUserId: true,
      recordType: true,
      recordKey: true,
      recordValue: true,
      legacyData: true,
    },
  });
  const existingByField = new Map<number, LegacyProfileValueRecord>();

  for (const record of existingValueRecords) {
    const fieldLegacyId = profileFieldLegacyIdFromValueRecord(record) ?? record.legacyId;
    if (fieldLegacyId && !existingByField.has(fieldLegacyId)) {
      existingByField.set(fieldLegacyId, record);
    }
  }

  const maxValueRecord = await tx.legacyAuthRecord.findFirst({
    where: {
      sourceDatabase: params.sourceDatabase,
      legacyTable,
    },
    orderBy: { legacyId: "desc" },
    select: { legacyId: true },
  });
  let nextLegacyId = (maxValueRecord?.legacyId ?? 0) + 1;

  const submittedFieldIds = Array.from(submittedByField.keys()).sort(
    (a, b) => a - b,
  );

  for (const fieldLegacyId of submittedFieldIds) {
    const submitted = submittedByField.get(fieldLegacyId);
    if (!submitted) continue;

    const existingRecord = existingByField.get(fieldLegacyId);
    const field =
      fieldsById.get(fieldLegacyId) ??
      (existingRecord
        ? ({
            id: existingRecord.id,
            sourceDatabase: existingRecord.sourceDatabase,
            legacyId: fieldLegacyId,
            label:
              existingRecord.recordKey ?? `Profile field ${fieldLegacyId}`,
            fieldType: "text_input",
            section: "Legacy profile",
            isPublic: true,
            signup: "hide",
            recordType: fieldRecordType,
          } satisfies LegacyAdminProfileFieldDefinition)
        : null);

    if (!field) {
      throw new Error("One or more profile fields no longer exist.");
    }

    const recordValue = normalizeProfileInputValue(field, submitted.value);
    const legacyData = {
      pfield_id: fieldLegacyId,
      user_id: params.legacyUserId,
      profile_label: field.label,
      profile_value: recordValue,
      updated_from: "modern_legacy_user_admin",
    } satisfies Prisma.InputJsonObject;

    if (existingRecord) {
      await tx.legacyAuthRecord.update({
        where: { id: existingRecord.id },
        data: {
          recordKey: field.label,
          recordValue,
          legacyData: {
            ...legacyObject(existingRecord.legacyData),
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
        recordKey: field.label,
        recordValue,
        legacyData: {
          p_id: legacyId,
          ...legacyData,
          inserted_from: "modern_legacy_user_admin",
        },
      },
    });
  }
}

function firstGroup(groups: LegacyAdminUserGroup[]) {
  return groups[0] ?? null;
}

function mapUserRow(params: {
  record: {
    id: string;
    sourceDatabase: string;
    legacyTable: string;
    legacyId: number;
    recordType: string;
    legacyUserId: number | null;
    userId: string | null;
    username: string | null;
    email: string | null;
    recordKey: string | null;
    recordValue: string | null;
    isDisabled: boolean | null;
    legacyData: Prisma.JsonValue | null;
  };
  levelOptions: LegacyAdminLevelOption[];
  modernUser?: {
    role: UserRole;
    isActive: boolean;
    name: string | null;
  } | null;
  loginAudit?: {
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
    loginCount: number;
  } | null;
  loginHistory?: LegacyAdminLoginHistoryEntry[];
  profileValues?: LegacyAdminProfileValue[];
  socialIntegrations?: LegacyAdminSocialIntegration[];
}): LegacyAdminUserRow {
  const levelIds = parsePhpLevelIds(params.record.recordValue);
  const levelRecordType =
    params.record.recordType === "manager_login_user"
      ? "manager_login_level"
      : "login_level";
  const legacyName = legacyString(params.record.legacyData, "name");
  const labels = params.levelOptions
    .filter(
      (level) =>
        level.sourceDatabase === params.record.sourceDatabase &&
        level.recordType === levelRecordType &&
        levelIds.includes(level.legacyId),
    )
    .map((level) => level.label);

  return {
    id: params.record.id,
    sourceDatabase: params.record.sourceDatabase,
    legacyTable: params.record.legacyTable,
    legacyId: params.record.legacyUserId ?? params.record.legacyId,
    recordType: params.record.recordType as LegacyUserRecordType,
    username:
      params.record.username ??
      params.record.recordKey ??
      legacyString(params.record.legacyData, "username"),
    name: legacyName || params.modernUser?.name || "",
    email: params.record.email ?? legacyString(params.record.legacyData, "email"),
    isRestricted: params.record.isDisabled ?? false,
    levelIds,
    levelLabels: labels,
    sites: legacyString(params.record.legacyData, "usites") || "0",
    classes: legacyString(params.record.legacyData, "uclasses") || "0",
    userId: params.record.userId,
    modernRole: params.modernUser?.role ?? null,
    modernActive: params.modernUser?.isActive ?? null,
    registeredAt:
      legacyString(params.record.legacyData, "timestamp") ||
      legacyString(params.record.legacyData, "created_at") ||
      null,
    lastLoginAt: params.loginAudit?.lastLoginAt?.toISOString() ?? null,
    lastLoginIp: params.loginAudit?.lastLoginIp ?? null,
    loginCount: params.loginAudit?.loginCount ?? 0,
    loginHistory: params.loginHistory ?? [],
    profileValues: params.profileValues ?? [],
    socialIntegrations: params.socialIntegrations ?? [],
  };
}

async function getLevelsAndGroups() {
  const levelRecords = await db.legacyAuthRecord.findMany({
    where: {
      recordType: { in: ["login_level", "manager_login_level"] },
    },
    orderBy: [
      { sourceDatabase: "asc" },
      { recordType: "asc" },
      { legacyId: "asc" },
    ],
  });

  const levels: LegacyAdminLevelOption[] = levelRecords.map((level) => ({
    id: level.id,
    sourceDatabase: level.sourceDatabase,
    legacyId: level.legacyId,
    label: level.recordKey ?? `Level ${level.legacyId}`,
    recordType: level.recordType as LegacyLevelRecordType,
    isDisabled: level.isDisabled ?? false,
    welcomeEmail: level.welcomeEmail ?? false,
  }));

  const groupMap = new Map<string, LegacyAdminUserGroup>();
  for (const level of levels) {
    const recordType =
      level.recordType === "manager_login_level"
        ? "manager_login_user"
        : "login_user";
    const config = USER_CONFIG[recordType];
    const key = `${level.sourceDatabase}:${recordType}`;
    groupMap.set(key, {
      key,
      sourceDatabase: level.sourceDatabase,
      recordType,
      label: config.label,
      levelRecordType: config.levelRecordType,
    });
  }

  return { levels, groups: Array.from(groupMap.values()) };
}

async function getBranchAndClassOptions() {
  const [branchRecords, classRecords] = await Promise.all([
    db.branch.findMany({
      where: {
        sourceDatabase: { not: null },
        legacyId: { not: null },
      },
      orderBy: [
        { sourceDatabase: "asc" },
        { legacyId: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        sourceDatabase: true,
        legacyId: true,
        name: true,
      },
    }),
    db.class.findMany({
      where: {
        sourceDatabase: { not: null },
        legacyId: { not: null },
      },
      orderBy: [
        { sourceDatabase: "asc" },
        { legacyId: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        sourceDatabase: true,
        legacyId: true,
        name: true,
        branch: {
          select: {
            legacyId: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const branches: LegacyAdminBranchOption[] = branchRecords
    .filter(
      (
        branch,
      ): branch is typeof branch & {
        sourceDatabase: string;
        legacyId: number;
      } => branch.sourceDatabase !== null && branch.legacyId !== null,
    )
    .map((branch) => ({
      id: branch.id,
      sourceDatabase: branch.sourceDatabase,
      legacyId: branch.legacyId,
      label: branch.name,
    }));

  const classes: LegacyAdminClassOption[] = classRecords
    .filter(
      (
        classRecord,
      ): classRecord is typeof classRecord & {
        sourceDatabase: string;
        legacyId: number;
      } =>
        classRecord.sourceDatabase !== null && classRecord.legacyId !== null,
    )
    .map((classRecord) => ({
      id: classRecord.id,
      sourceDatabase: classRecord.sourceDatabase,
      legacyId: classRecord.legacyId,
      label: classRecord.name,
      branchLegacyId: classRecord.branch.legacyId,
      branchLabel: classRecord.branch.name,
    }));

  return { branches, classes };
}

async function validateLegacyUserInput(
  input: LegacyAdminUserInput,
  existingId?: string,
) {
  const sourceDatabase = input.sourceDatabase.trim();
  const name = input.name.trim();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const config = configForRecordType(input.recordType);

  if (!sourceDatabase) return { error: "Missing legacy source database" };
  if (!config) return { error: "Unknown legacy user type" };
  if (!name) return { error: "You must enter a name." };
  if (!username) return { error: "You must enter a username." };
  if (username.length < 2) return { error: "Username is required." };
  if (!validateEmail(email)) {
    return { error: "You have entered an invalid e-mail address, try again." };
  }
  if (!existingId && !input.password) {
    return { error: "You must enter a password." };
  }
  if (input.password && input.password.length < 5) {
    return { error: "Your password must be at least 5 characters." };
  }
  if (input.password && input.password !== input.password2) {
    return { error: "Your passwords did not match." };
  }

  let levelIds = normalizeIds(input.levelIds);
  if (levelIds.length === 0 && !existingId) {
    const defaultLevelId = await getDefaultLevelId(
      sourceDatabase,
      input.recordType,
    );
    levelIds = defaultLevelId ? [defaultLevelId] : [];
  }
  if (levelIds.length === 0) {
    return { error: "No user level has been selected." };
  }

  const validLevels = await db.legacyAuthRecord.findMany({
    where: {
      sourceDatabase,
      recordType: config.levelRecordType,
      legacyId: { in: levelIds },
    },
    select: { legacyId: true },
  });

  if (validLevels.length !== levelIds.length) {
    return { error: "One or more legacy levels no longer exist." };
  }

  const duplicateLegacy = await db.legacyAuthRecord.findMany({
    where: {
      sourceDatabase,
      recordType: input.recordType,
      OR: [{ username }, { email }],
    },
    select: { id: true, username: true, email: true },
  });

  if (
    duplicateLegacy.some(
      (record) => record.id !== existingId && record.username === username,
    )
  ) {
    return { error: "Sorry, username already taken." };
  }
  if (
    duplicateLegacy.some(
      (record) => record.id !== existingId && record.email === email,
    )
  ) {
    return { error: "That email address has already been taken." };
  }

  return {
    sourceDatabase,
    name,
    username,
    email,
    levelIds,
    sites: input.sites?.trim() || "0",
    classes: input.classes?.trim() || "0",
    isRestricted: Boolean(input.isRestricted),
  };
}

function profileFieldCountKey(
  sourceDatabase: string,
  recordType: LegacyProfileFieldRecordType,
  legacyId: number,
) {
  return `${sourceDatabase}:${recordType}:${legacyId}`;
}

function buildProfileFieldValueCounts(valueRecords: LegacyProfileValueRecord[]) {
  const counts = new Map<string, number>();

  for (const record of valueRecords) {
    const fieldLegacyId = profileFieldLegacyIdFromValueRecord(record);
    if (!fieldLegacyId) continue;

    const userRecordType = userRecordTypeForProfileRecord(record.recordType);
    const fieldRecordType = profileFieldRecordTypeForUser(userRecordType);
    const key = profileFieldCountKey(
      record.sourceDatabase,
      fieldRecordType,
      fieldLegacyId,
    );
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

async function countProfileValuesForField(
  sourceDatabase: string,
  recordType: LegacyProfileFieldRecordType,
  legacyId: number,
) {
  const valueRecords = await db.legacyAuthRecord.findMany({
    where: {
      sourceDatabase,
      recordType: profileValueRecordTypeForField(recordType),
    },
    select: {
      id: true,
      sourceDatabase: true,
      legacyId: true,
      legacyUserId: true,
      recordType: true,
      recordKey: true,
      recordValue: true,
      legacyData: true,
    },
  });

  return buildProfileFieldValueCounts(valueRecords).get(
    profileFieldCountKey(sourceDatabase, recordType, legacyId),
  ) ?? 0;
}

function validateLegacyProfileFieldInput(
  input: LegacyAdminProfileFieldInput,
  existing?: { sourceDatabase: string; recordType: string },
) {
  const sourceDatabase = (existing?.sourceDatabase ?? input.sourceDatabase).trim();
  const recordType = existing?.recordType ?? input.recordType;
  const section = input.section.trim();
  const label = input.label.trim();
  const fieldType = normalizeProfileFieldType(input.fieldType);
  const signup = normalizeProfileSignupMode(input.signup);

  if (!sourceDatabase) return { error: "Missing legacy source database" };
  if (!isProfileFieldRecordType(recordType)) {
    return { error: "Unknown legacy profile field type" };
  }
  if (!PROFILE_FIELD_TYPES.includes(fieldType)) {
    return { error: "Unknown input type" };
  }
  if (!section) return { error: "Section name is required." };
  if (!label) return { error: "Field name is required." };
  if (!PROFILE_SIGNUP_MODES.includes(signup)) {
    return { error: "Unknown sign-up visibility" };
  }

  return {
    sourceDatabase,
    recordType,
    legacyTable: profileFieldLegacyTableForRecordType(recordType),
    section,
    label,
    fieldType,
    signup,
    isPublic: Boolean(input.isPublic),
  };
}

function legacyProfileFieldData(params: {
  legacyId: number;
  section: string;
  fieldType: LegacyProfileFieldType;
  label: string;
  signup: LegacyProfileSignupMode;
  isPublic: boolean;
  existing?: Prisma.JsonValue | null;
  marker: "inserted_from" | "updated_from";
}): Prisma.InputJsonObject {
  return {
    ...legacyObject(params.existing),
    id: params.legacyId,
    section: params.section,
    type: params.fieldType,
    label: params.label,
    public: params.isPublic ? 1 : 0,
    signup: params.signup,
    [params.marker]: "modern_legacy_profile_fields",
  };
}

function revalidateLegacyProfileFieldPaths() {
  revalidatePath("/settings/legacy-users/profile-fields");
  revalidatePath("/settings/legacy-users");
  revalidatePath("/users/admin/page/user-profiles.php");
}

export async function getLegacyProfileFields(): Promise<
  ActionResult<LegacyAdminProfileFieldsData>
> {
  try {
    await requireLegacyAdminPanelAccess();

    const [{ groups }, fieldRecords, valueRecords] = await Promise.all([
      getLevelsAndGroups(),
      db.legacyAuthRecord.findMany({
        where: {
          recordType: { in: ["profile_field", "manager_profile_field"] },
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
          recordValue: true,
          isDisabled: true,
          legacyData: true,
        },
      }),
      db.legacyAuthRecord.findMany({
        where: {
          recordType: { in: ["profile_value", "manager_profile_value"] },
        },
        select: {
          id: true,
          sourceDatabase: true,
          legacyId: true,
          legacyUserId: true,
          recordType: true,
          recordKey: true,
          recordValue: true,
          legacyData: true,
        },
      }),
    ]);

    const groupMap = new Map(groups.map((group) => [group.key, group]));
    const valueCounts = buildProfileFieldValueCounts(valueRecords);
    const fields = fieldRecords
      .filter(
        (
          record,
        ): record is LegacyProfileFieldRecord & {
          recordType: LegacyProfileFieldRecordType;
        } => isProfileFieldRecordType(record.recordType),
      )
      .map((record) => {
        const row = profileFieldRowFromRecord(
          record,
          valueCounts.get(
            profileFieldCountKey(
              record.sourceDatabase,
              record.recordType,
              record.legacyId,
            ),
          ) ?? 0,
        );
        const sourceRecordType = profileSourceUserRecordType(row.recordType);
        const config = USER_CONFIG[sourceRecordType];
        const key = profileGroupKey(row.sourceDatabase, sourceRecordType);
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            key,
            sourceDatabase: row.sourceDatabase,
            recordType: sourceRecordType,
            label: config.label,
            levelRecordType: config.levelRecordType,
          });
        }
        return row;
      })
      .sort((a, b) => {
        const source = a.sourceDatabase.localeCompare(b.sourceDatabase);
        if (source !== 0) return source;
        const type = a.recordType.localeCompare(b.recordType);
        if (type !== 0) return type;
        const section = a.section.localeCompare(b.section);
        if (section !== 0) return section;
        return a.legacyId - b.legacyId;
      });

    const sortedGroups = Array.from(groupMap.values()).sort((a, b) => {
      const source = a.sourceDatabase.localeCompare(b.sourceDatabase);
      if (source !== 0) return source;
      return a.label.localeCompare(b.label);
    });

    return { success: true, data: { fields, groups: sortedGroups } };
  } catch (error) {
    console.error("Failed to fetch legacy profile fields:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch legacy profile fields",
    };
  }
}

export async function createLegacyProfileField(
  input: LegacyAdminProfileFieldInput,
): Promise<ActionResult<LegacyAdminProfileFieldRow>> {
  try {
    await requireLegacyAdminPanelAccess();
    const validated = validateLegacyProfileFieldInput(input);
    if ("error" in validated) return { success: false, error: validated.error };

    const maxField = await db.legacyAuthRecord.findFirst({
      where: {
        sourceDatabase: validated.sourceDatabase,
        legacyTable: validated.legacyTable,
      },
      orderBy: { legacyId: "desc" },
      select: { legacyId: true },
    });
    const legacyId = (maxField?.legacyId ?? 0) + 1;

    const created = await db.legacyAuthRecord.create({
      data: {
        sourceDatabase: validated.sourceDatabase,
        legacyTable: validated.legacyTable,
        legacyKey: `${validated.sourceDatabase}:${validated.legacyTable}:${legacyId}`,
        legacyId,
        recordType: validated.recordType,
        recordKey: validated.label,
        recordValue: validated.fieldType,
        isDisabled: !validated.isPublic,
        legacyData: legacyProfileFieldData({
          legacyId,
          section: validated.section,
          fieldType: validated.fieldType,
          label: validated.label,
          signup: validated.signup,
          isPublic: validated.isPublic,
          marker: "inserted_from",
        }),
      },
    });

    revalidateLegacyProfileFieldPaths();

    return {
      success: true,
      data: profileFieldRowFromRecord(created),
    };
  } catch (error) {
    console.error("Failed to create legacy profile field:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create legacy profile field",
    };
  }
}

export async function updateLegacyProfileField(
  fieldId: string,
  input: LegacyAdminProfileFieldInput,
): Promise<ActionResult<LegacyAdminProfileFieldRow>> {
  try {
    await requireLegacyAdminPanelAccess();
    const existing = await db.legacyAuthRecord.findUnique({
      where: { id: fieldId },
    });
    if (!existing || !isProfileFieldRecordType(existing.recordType)) {
      return { success: false, error: "No such profile field!" };
    }

    const validated = validateLegacyProfileFieldInput(input, existing);
    if ("error" in validated) return { success: false, error: validated.error };

    const updated = await db.legacyAuthRecord.update({
      where: { id: existing.id },
      data: {
        legacyTable: validated.legacyTable,
        recordType: validated.recordType,
        recordKey: validated.label,
        recordValue: validated.fieldType,
        isDisabled: !validated.isPublic,
        legacyData: legacyProfileFieldData({
          legacyId: existing.legacyId,
          section: validated.section,
          fieldType: validated.fieldType,
          label: validated.label,
          signup: validated.signup,
          isPublic: validated.isPublic,
          existing: existing.legacyData,
          marker: "updated_from",
        }),
      },
    });
    const valueCount = await countProfileValuesForField(
      updated.sourceDatabase,
      updated.recordType as LegacyProfileFieldRecordType,
      updated.legacyId,
    );

    revalidateLegacyProfileFieldPaths();

    return {
      success: true,
      data: profileFieldRowFromRecord(updated, valueCount),
    };
  } catch (error) {
    console.error("Failed to update legacy profile field:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update legacy profile field",
    };
  }
}

export async function deleteLegacyProfileField(
  fieldId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireLegacyAdminPanelAccess();
    const existing = await db.legacyAuthRecord.findUnique({
      where: { id: fieldId },
    });
    if (!existing || !isProfileFieldRecordType(existing.recordType)) {
      return { success: false, error: "No such profile field!" };
    }

    await db.legacyAuthRecord.update({
      where: { id: existing.id },
      data: {
        recordType: `${existing.recordType}_deleted`,
        isDisabled: true,
        legacyData: {
          ...legacyObject(existing.legacyData),
          deleted_from: "modern_legacy_profile_fields",
        },
      },
    });

    revalidateLegacyProfileFieldPaths();

    return { success: true, data: { id: existing.id } };
  } catch (error) {
    console.error("Failed to delete legacy profile field:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete legacy profile field",
    };
  }
}

export async function getLegacyAdminUsers(): Promise<
  ActionResult<LegacyAdminUsersData>
> {
  try {
    await requireLegacyAdminPanelAccess();

    const [{ levels, groups }, { branches, classes }, records] =
      await Promise.all([
        getLevelsAndGroups(),
        getBranchAndClassOptions(),
        db.legacyAuthRecord.findMany({
          where: {
            recordType: { in: ["login_user", "manager_login_user"] },
          },
          orderBy: [
            { sourceDatabase: "asc" },
            { recordType: "asc" },
            { legacyId: "asc" },
          ],
        }),
      ]);
    const userIds = records
      .map((record) => record.userId)
      .filter((id): id is string => Boolean(id));
    const sourceDatabases = Array.from(
      new Set(records.map((record) => record.sourceDatabase)),
    );
    const legacyUserIds = Array.from(
      new Set(
        records
          .map((record) => record.legacyUserId ?? record.legacyId)
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    const [
      modernUsers,
      loginAuditRows,
      profileFieldRecords,
      profileRecords,
      integrationRecords,
    ] = await Promise.all([
        userIds.length
          ? db.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, role: true, isActive: true, name: true },
            })
          : Promise.resolve([]),
        legacyUserIds.length
          ? db.legacyLoginTimestamp.findMany({
              where: {
                sourceDatabase: { in: sourceDatabases },
                legacyUserId: { in: legacyUserIds },
                principalType: { in: ["USER", "MANAGER_USER"] },
              },
              orderBy: [{ occurredAt: "desc" }, { legacyId: "desc" }],
              select: {
                id: true,
                sourceDatabase: true,
                legacyTable: true,
                legacyId: true,
                legacyUserId: true,
                principalType: true,
                ipAddress: true,
                occurredAt: true,
              },
            })
          : Promise.resolve([]),
        sourceDatabases.length
          ? db.legacyAuthRecord.findMany({
              where: {
                sourceDatabase: { in: sourceDatabases },
                recordType: { in: ["profile_field", "manager_profile_field"] },
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
                recordValue: true,
                isDisabled: true,
                legacyData: true,
              },
            })
          : Promise.resolve([]),
        legacyUserIds.length
          ? db.legacyAuthRecord.findMany({
              where: {
                sourceDatabase: { in: sourceDatabases },
                legacyUserId: { in: legacyUserIds },
                recordType: { in: ["profile_value", "manager_profile_value"] },
              },
              orderBy: [
                { sourceDatabase: "asc" },
                { legacyUserId: "asc" },
                { legacyId: "asc" },
              ],
              select: {
                id: true,
                sourceDatabase: true,
                legacyId: true,
                legacyUserId: true,
                recordType: true,
                recordKey: true,
                recordValue: true,
                legacyData: true,
              },
            })
          : Promise.resolve([]),
        legacyUserIds.length
          ? db.legacyAuthRecord.findMany({
              where: {
                sourceDatabase: { in: sourceDatabases },
                legacyUserId: { in: legacyUserIds },
                recordType: "social_integration",
              },
              orderBy: [
                { sourceDatabase: "asc" },
                { legacyUserId: "asc" },
                { legacyId: "asc" },
              ],
              select: {
                sourceDatabase: true,
                legacyUserId: true,
                legacyData: true,
              },
            })
          : Promise.resolve([]),
      ]);
    const modernById = new Map(modernUsers.map((user) => [user.id, user]));
    const auditByUser = new Map<
      string,
      { lastLoginAt: Date | null; lastLoginIp: string | null; loginCount: number }
    >();
    const loginHistoryByUser = new Map<
      string,
      LegacyAdminLoginHistoryEntry[]
    >();

    for (const row of loginAuditRows) {
      const recordType =
        row.principalType === "MANAGER_USER"
          ? "manager_login_user"
          : "login_user";
      const key = userAuditKey(row.sourceDatabase, recordType, row.legacyUserId);
      const history = loginHistoryByUser.get(key) ?? [];
      history.push({
        id: row.id,
        legacyId: row.legacyId,
        legacyTable: row.legacyTable,
        occurredAt: row.occurredAt?.toISOString() ?? null,
        ipAddress: row.ipAddress,
      });
      loginHistoryByUser.set(key, history);

      const current = auditByUser.get(key) ?? {
        lastLoginAt: null,
        lastLoginIp: null,
        loginCount: 0,
      };

      current.loginCount += 1;
      if (
        row.occurredAt &&
        (!current.lastLoginAt || row.occurredAt > current.lastLoginAt)
      ) {
        current.lastLoginAt = row.occurredAt;
        current.lastLoginIp = row.ipAddress;
      }
      auditByUser.set(key, current);
    }

    const profileContext = buildProfileContext(
      profileFieldRecords,
      profileRecords,
    );

    const integrationsByUser = new Map<string, LegacyAdminSocialIntegration[]>();
    for (const integration of integrationRecords) {
      const legacyUserId = integration.legacyUserId;
      if (!legacyUserId) continue;

      integrationsByUser.set(
        userSocialIntegrationKey(integration.sourceDatabase, legacyUserId),
        socialIntegrationsFromLegacyData(integration.legacyData),
      );
    }

    return {
      success: true,
      data: {
        users: records.map((record) => {
          const legacyUserId = record.legacyUserId ?? record.legacyId;
          const recordType = record.recordType as LegacyUserRecordType;

          return mapUserRow({
            record,
            levelOptions: levels,
            modernUser: record.userId ? modernById.get(record.userId) : null,
            loginAudit: auditByUser.get(
              userAuditKey(record.sourceDatabase, recordType, legacyUserId),
            ),
            loginHistory: loginHistoryByUser.get(
              userAuditKey(record.sourceDatabase, recordType, legacyUserId),
            ),
            profileValues: buildProfileValuesForLegacyUser({
              sourceDatabase: record.sourceDatabase,
              recordType,
              legacyUserId,
              context: profileContext,
            }),
            socialIntegrations:
              recordType === "login_user"
                ? integrationsByUser.get(
                    userSocialIntegrationKey(record.sourceDatabase, legacyUserId),
                  )
                : undefined,
          });
        }),
        levels,
        groups,
        branches,
        classes,
      },
    };
  } catch (error) {
    console.error("Failed to fetch legacy admin users:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch legacy admin users",
    };
  }
}

export async function createLegacyAdminUser(
  input: LegacyAdminUserInput,
): Promise<ActionResult<LegacyAdminUserRow>> {
  try {
    const ctx = await requireLegacyAdminPanelAccess();
    const validated = await validateLegacyUserInput(input);
    if ("error" in validated) return { success: false, error: validated.error };

    const config = configForRecordType(input.recordType);
    const { levels } = await getLevelsAndGroups();
    const role = roleForLegacyLevels(
      validated.levelIds,
      levels.filter(
        (level) =>
          level.sourceDatabase === validated.sourceDatabase &&
          level.recordType === config.levelRecordType,
      ),
    );

    const existingModern = await db.user.findUnique({
      where: { email: validated.email },
      select: { id: true },
    });
    if (existingModern) {
      return {
        success: false,
        error: "That email address has already been taken.",
      };
    }

    const maxUser = await db.legacyAuthRecord.findFirst({
      where: {
        sourceDatabase: validated.sourceDatabase,
        recordType: input.recordType,
      },
      orderBy: { legacyId: "desc" },
      select: { legacyId: true },
    });
    const legacyId = (maxUser?.legacyId ?? 0) + 1;
    const userLevel = serializePhpStringArray(validated.levelIds);
    const passwordHash = await hash(input.password ?? "", 12);
    const template = await legacyEmailTemplate(
      validated.sourceDatabase,
      "email-add-user-subj",
      "email-add-user-msg",
    );
    const templateValues = {
      site_address: siteAddress(),
      full_name: validated.name,
      username: validated.username,
      email: validated.email,
      password: input.password ?? "",
    };
    const emailSubject = renderTemplate(
      template.subject ?? "Your account has been created",
      templateValues,
    );
    const emailBody = renderTemplate(
      template.body ??
        "Hello {{full_name}}, your account has been created.\n\nUsername: {{username}}\nPassword: {{password}}",
      templateValues,
    );

    const created = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          role,
          passwordHash,
          isActive: !validated.isRestricted,
          organizationId: ctx.organizationId,
        },
        select: { id: true, role: true, isActive: true, name: true },
      });

      const legacyRecord = await tx.legacyAuthRecord.create({
        data: {
          sourceDatabase: validated.sourceDatabase,
          legacyTable: config.legacyTable,
          legacyKey: `${validated.sourceDatabase}:${config.legacyTable}:${legacyId}`,
          legacyId,
          recordType: input.recordType,
          userId: user.id,
          legacyUserId: legacyId,
          username: validated.username,
          email: validated.email,
          recordKey: validated.username,
          recordValue: userLevel,
          isDisabled: validated.isRestricted,
          legacyData: userLegacyData({
            legacyId,
            userLevel,
            name: validated.name,
            username: validated.username,
            email: validated.email,
            isRestricted: validated.isRestricted,
            sites: validated.sites,
            classes: validated.classes,
            dbId: ctx.organizationId,
            passwordChanged: true,
          }),
        },
      });

      return { user, legacyRecord };
    });
    const emailDelivery = await deliverEmail({
      recipients: [{ email: validated.email, name: validated.name }],
      subject: emailSubject,
      body: emailBody,
      category: "ADD_USER",
      metadata: {
        source: "legacy_admin_add_user",
        legacyUserId: legacyId,
      },
    });
    const updatedLegacyRecord = await db.legacyAuthRecord.update({
      where: { id: created.legacyRecord.id },
      data: {
        legacyData: {
          ...legacyObject(created.legacyRecord.legacyData),
          addUserEmail: {
            subject: emailSubject,
            body: emailBody,
            deliveryConfigured: emailDelivery.configured,
            emailDelivery: emailDeliveryAuditData(emailDelivery),
          },
        },
      },
    });

    revalidatePath("/settings/legacy-users");

    return {
      success: true,
      data: mapUserRow({
        record: updatedLegacyRecord,
        levelOptions: levels,
        modernUser: created.user,
      }),
    };
  } catch (error) {
    console.error("Failed to create legacy admin user:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create legacy admin user",
    };
  }
}

export async function updateLegacyAdminUser(
  legacyRecordId: string,
  input: LegacyAdminUserInput,
): Promise<ActionResult<LegacyAdminUserRow>> {
  try {
    const ctx = await requireLegacyAdminPanelAccess();
    const existing = await db.legacyAuthRecord.findUnique({
      where: { id: legacyRecordId },
    });
    if (!existing) return { success: false, error: "No such user!" };

    const recordType = existing.recordType as LegacyUserRecordType;
    const validated = await validateLegacyUserInput(
      { ...input, sourceDatabase: existing.sourceDatabase, recordType },
      existing.id,
    );
    if ("error" in validated) return { success: false, error: validated.error };

    const config = configForRecordType(recordType);
    const legacyUserId = existing.legacyUserId ?? existing.legacyId;
    const { levels } = await getLevelsAndGroups();
    const role = roleForLegacyLevels(
      validated.levelIds,
      levels.filter(
        (level) =>
          level.sourceDatabase === validated.sourceDatabase &&
          level.recordType === config.levelRecordType,
      ),
    );
    const userLevel = serializePhpStringArray(validated.levelIds);
    const previousLevelIds = parsePhpLevelIds(existing.recordValue);
    const relevantLevels = levels.filter(
      (level) =>
        level.sourceDatabase === validated.sourceDatabase &&
        level.recordType === config.levelRecordType,
    );
    const newWelcomeLevels = relevantLevels.filter(
      (level) =>
        level.welcomeEmail &&
        validated.levelIds.includes(level.legacyId) &&
        !previousLevelIds.includes(level.legacyId),
    );

    const duplicateModern = await db.user.findUnique({
      where: { email: validated.email },
      select: { id: true },
    });
    if (duplicateModern && duplicateModern.id !== existing.userId) {
      return {
        success: false,
        error: "That email address has already been taken.",
      };
    }

    const passwordHash = input.password ? await hash(input.password, 12) : null;
    const updated = await db.$transaction(async (tx) => {
      let modernUser: {
        id: string;
        role: UserRole;
        isActive: boolean;
        name: string | null;
      } | null = null;

      if (existing.userId) {
        modernUser = await tx.user.update({
          where: { id: existing.userId },
          data: {
            email: validated.email,
            name: validated.name,
            role,
            isActive: !validated.isRestricted,
            ...(passwordHash ? { passwordHash } : {}),
          },
          select: { id: true, role: true, isActive: true, name: true },
        });
      } else if (passwordHash) {
        modernUser = await tx.user.create({
          data: {
            email: validated.email,
            name: validated.name,
            role,
            passwordHash,
            isActive: !validated.isRestricted,
            organizationId: ctx.organizationId,
          },
          select: { id: true, role: true, isActive: true, name: true },
        });
      }

      const legacyRecord = await tx.legacyAuthRecord.update({
        where: { id: existing.id },
        data: {
          legacyTable: config.legacyTable,
          recordType,
          userId: modernUser?.id ?? existing.userId,
          legacyUserId,
          username: validated.username,
          email: validated.email,
          recordKey: validated.username,
          recordValue: userLevel,
          isDisabled: validated.isRestricted,
          legacyData: userLegacyData({
            existing: existing.legacyData,
            legacyId: legacyUserId,
            userLevel,
            name: validated.name,
            username: validated.username,
            email: validated.email,
            isRestricted: validated.isRestricted,
            sites: validated.sites,
            classes: validated.classes,
            dbId: legacyString(existing.legacyData, "db_id") || ctx.organizationId,
            passwordChanged: Boolean(passwordHash),
          }),
        },
      });

      await saveLegacyProfileValues(tx, {
        sourceDatabase: existing.sourceDatabase,
        recordType,
        legacyUserId,
        userId: legacyRecord.userId,
        values: input.profileValues,
      });

      return { modernUser, legacyRecord };
    });
    const profileValues = await getProfileValuesForUser(
      updated.legacyRecord.sourceDatabase,
      recordType,
      legacyUserId,
    );
    let returnedLegacyRecord = updated.legacyRecord;
    if (newWelcomeLevels.length > 0) {
      const template = await legacyEmailTemplate(
        validated.sourceDatabase,
        "email-add-user-subj",
        "email-add-user-msg",
      );
      const templateValues = {
        site_address: siteAddress(),
        full_name: validated.name,
        username: validated.username,
        email: validated.email,
        password: input.password ?? "",
      };
      const emailSubject = renderTemplate(
        template.subject ?? "Your account has been updated",
        templateValues,
      );
      const emailBody = renderTemplate(
        template.body ??
          "Hello {{full_name}}, your account has been updated.\n\nUsername: {{username}}",
        templateValues,
      );
      const emailDelivery = await deliverEmail({
        recipients: [{ email: validated.email, name: validated.name }],
        subject: emailSubject,
        body: emailBody,
        category: "ADD_USER",
        metadata: {
          source: "legacy_admin_edit_user_welcome_level",
          legacyUserId,
          welcomeLevelIds: newWelcomeLevels
            .map((level) => level.legacyId)
            .join(","),
        },
      });

      returnedLegacyRecord = await db.legacyAuthRecord.update({
        where: { id: updated.legacyRecord.id },
        data: {
          legacyData: {
            ...legacyObject(updated.legacyRecord.legacyData),
            welcomeLevelEmail: {
              subject: emailSubject,
              body: emailBody,
              levels: newWelcomeLevels.map((level) => ({
                id: level.legacyId,
                label: level.label,
              })),
              deliveryConfigured: emailDelivery.configured,
              emailDelivery: emailDeliveryAuditData(emailDelivery),
            },
          } satisfies Prisma.InputJsonObject,
        },
      });
    }

    revalidatePath("/settings/legacy-users");

    return {
      success: true,
      data: mapUserRow({
        record: returnedLegacyRecord,
        levelOptions: levels,
        modernUser: updated.modernUser,
        profileValues,
      }),
    };
  } catch (error) {
    console.error("Failed to update legacy admin user:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update legacy admin user",
    };
  }
}

export async function deleteLegacyAdminUser(
  legacyRecordId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireLegacyAdminPanelAccess();

    const existing = await db.legacyAuthRecord.findUnique({
      where: { id: legacyRecordId },
    });
    if (!existing) return { success: false, error: "No such user!" };

    await db.$transaction(async (tx) => {
      const legacyUserId = existing.legacyUserId ?? existing.legacyId;
      const integrationRecords =
        existing.recordType === "login_user"
          ? await tx.legacyAuthRecord.findMany({
              where: {
                sourceDatabase: existing.sourceDatabase,
                recordType: "social_integration",
                legacyUserId,
              },
              select: { id: true, legacyData: true },
            })
          : [];

      await tx.legacyAuthRecord.update({
        where: { id: existing.id },
        data: {
          recordType: `${existing.recordType}_deleted`,
          isDisabled: true,
          legacyData: {
            ...legacyObject(existing.legacyData),
            deleted_from: "modern_legacy_user_admin",
          },
        },
      });

      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: false },
        });
      }

      await Promise.all(
        integrationRecords.map((integration) =>
          tx.legacyAuthRecord.update({
            where: { id: integration.id },
            data: {
              recordType: "social_integration_deleted",
              isDisabled: true,
              legacyData: {
                ...legacyObject(integration.legacyData),
                deleted_from: "modern_legacy_user_admin",
              },
            },
          }),
        ),
      );
    });

    revalidatePath("/settings/legacy-users");

    return { success: true, data: { id: existing.id } };
  } catch (error) {
    console.error("Failed to delete legacy admin user:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete legacy admin user",
    };
  }
}

export async function unlinkLegacyAdminUserSocialProvider(
  legacyRecordId: string,
  provider: string,
): Promise<ActionResult<{ providerKey: string }>> {
  const providerKey = normalizeSocialProviderKey(provider);
  if (!providerKey) return { success: false, error: "Unknown provider." };

  try {
    await requireLegacyAdminPanelAccess();

    const existing = await db.legacyAuthRecord.findUnique({
      where: { id: legacyRecordId },
      select: {
        id: true,
        sourceDatabase: true,
        legacyId: true,
        legacyUserId: true,
        userId: true,
        recordType: true,
        username: true,
        email: true,
        recordKey: true,
      },
    });
    if (!existing) return { success: false, error: "No such user!" };
    if (existing.recordType !== "login_user") {
      return {
        success: false,
        error: "Manager social links are not stored in legacy login_integration.",
      };
    }

    const legacyUserId = existing.legacyUserId ?? existing.legacyId;
    const integration = await db.legacyAuthRecord.findFirst({
      where: {
        sourceDatabase: existing.sourceDatabase,
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
    if (!integration) {
      return { success: false, error: "Social link not found." };
    }

    const legacyData = legacyObject(integration.legacyData);
    const previousIdentifier = legacyString(legacyData, providerKey);
    if (!previousIdentifier) {
      return { success: false, error: "Social link not found." };
    }

    const updatedData = {
      ...legacyData,
      [providerKey]: "",
      [`${providerKey}_unlinked_at`]: new Date().toISOString(),
      [`${providerKey}_previous_identifier`]: previousIdentifier,
      updated_from: "modern_legacy_user_admin_social_unlink",
    };
    const linkedProviders = linkedSocialProviderList(updatedData);

    await db.$transaction([
      db.legacyAuthRecord.update({
        where: { id: integration.id },
        data: {
          recordValue: linkedProviders,
          isDisabled: linkedProviders.length === 0,
          legacyData: updatedData,
        },
      }),
      db.legacyAuthRecord.create({
        data: {
          sourceDatabase: existing.sourceDatabase,
          legacyTable: "login_integration_audit",
          legacyKey: `${existing.sourceDatabase}:login_integration_admin_unlink:${legacyUserId}:${providerKey}:${randomBytes(6).toString("hex")}`,
          legacyId: 0,
          recordType: "social_unlink_audit",
          userId: existing.userId,
          legacyUserId,
          username: existing.username ?? existing.recordKey,
          email: existing.email,
          recordKey: providerKey,
          recordValue: previousIdentifier,
          legacyData: {
            provider: providerKey,
            previousIdentifier,
            source: "legacy_user_admin",
            unlinkedAt: new Date().toISOString(),
          },
        },
      }),
    ]);

    revalidatePath("/settings/legacy-users");

    return { success: true, data: { providerKey } };
  } catch (error) {
    console.error("Failed to unlink legacy admin social provider:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to unlink social provider",
    };
  }
}

export async function getDefaultLegacyAdminUserGroup(): Promise<
  ActionResult<LegacyAdminUserGroup | null>
> {
  try {
    await requireLegacyAdminPanelAccess();
    const { groups } = await getLevelsAndGroups();
    return { success: true, data: firstGroup(groups) };
  } catch (error) {
    console.error("Failed to fetch default legacy user group:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch default legacy user group",
    };
  }
}
