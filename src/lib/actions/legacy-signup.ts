"use server";

import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { deliverEmail, emailDeliveryAuditData } from "@/lib/email-delivery";

type UserRole = "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

type LegacyProfileFieldType = "text_input" | "checkbox" | "textarea";
type LegacyProfileSignupMode = "require" | "optional";

export type LegacySignupProfileField = {
  legacyId: number;
  label: string;
  section: string;
  fieldType: LegacyProfileFieldType;
  signup: LegacyProfileSignupMode;
};

export type LegacySignupPageData = {
  sourceDatabase: string | null;
  registrationsDisabled: boolean;
  useEmailAsUsername: boolean;
  requireActivation: boolean;
  captchaMode: string;
  defaultLevelLabels: string[];
  profileFields: LegacySignupProfileField[];
};

export type LegacySignupProfileValueInput = {
  fieldLegacyId: number;
  value: string | boolean | null;
};

export type LegacySignupInput = {
  sourceDatabase: string;
  name: string;
  username?: string;
  email: string;
  password: string;
  passwordConfirm: string;
  profileValues?: LegacySignupProfileValueInput[];
};

export type LegacySignupResult = {
  email: string;
  username: string;
  requiresActivation: boolean;
  activationUrl?: string;
  redirectTo: string;
  welcomeDeliveryConfigured: boolean;
  adminNotificationRecipients: number;
};

const MIN_PASSWORD_LENGTH = 5;

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

function legacyBool(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return Boolean(
    normalized && !["0", "false", "no", "off", "null"].includes(normalized),
  );
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeProfileFieldType(
  value: string | null | undefined,
): LegacyProfileFieldType {
  const normalized = value?.trim();
  if (normalized === "checkbox" || normalized === "textarea") return normalized;
  return "text_input";
}

function normalizeSignupMode(
  value: string | boolean | null | undefined,
): LegacyProfileSignupMode | "hide" {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "require" || normalized === "optional") return normalized;
    if (["1", "true", "yes", "on"].includes(normalized)) return "optional";
  }
  if (value === true) return "optional";
  return "hide";
}

function parsePhpStringArray(serialized: string | null | undefined) {
  if (!serialized?.trim()) return [];
  const matches = Array.from(serialized.matchAll(/s:\d+:"([^"]*)"/g)).map(
    (match) => match[1].trim(),
  );
  if (matches.length > 0) return matches.filter(Boolean);

  return serialized
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function parsePhpLevelIds(serialized: string | null | undefined) {
  return parsePhpStringArray(serialized)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function serializePhpStringArray(values: Array<string | number>) {
  const strings = values.map(String);
  return `a:${strings.length}:{${strings
    .map(
      (value, index) =>
        `i:${index};s:${Buffer.byteLength(value)}:"${value}";`,
    )
    .join("")}}`;
}

function siteAddress() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3001"
  );
}

function activationUrl(key: string) {
  try {
    return new URL(`/activate.php?key=${encodeURIComponent(key)}`, siteAddress())
      .toString();
  } catch {
    return `/activate.php?key=${encodeURIComponent(key)}`;
  }
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(
    /(\[\[([a-zA-Z0-9_]+)\]\]|\{\{\s*([a-zA-Z0-9_]+)\s*\}\})/g,
    (match, _token, squareKey: string | undefined, braceKey: string | undefined) => {
      const key = squareKey ?? braceKey;
      return key ? (values[key] ?? match) : match;
    },
  );
}

function choosePreferredSource(sources: string[], requested?: string | null) {
  const uniqueSources = Array.from(new Set(sources.filter(Boolean))).sort();
  if (requested && uniqueSources.includes(requested)) return requested;

  return (
    uniqueSources.find((source) =>
      source.toLowerCase().includes("users29sept"),
    ) ??
    uniqueSources.find((source) => source.toLowerCase().includes("29sept")) ??
    uniqueSources.find((source) => !source.toLowerCase().includes("2018")) ??
    uniqueSources[0] ??
    null
  );
}

function settingsMap(
  rows: Array<{ settingKey: string; settingValue: string | null }>,
) {
  const map = new Map<string, string | null>();
  for (const row of rows) {
    if (!map.has(row.settingKey)) map.set(row.settingKey, row.settingValue);
  }
  return map;
}

function setting(
  map: Map<string, string | null>,
  key: string,
  fallback = "",
) {
  return map.get(key) ?? fallback;
}

function roleForLegacyLevels(
  levelIds: number[],
  levels: Array<{ legacyId: number; label: string }>,
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

function normalizeProfileValue(
  field: LegacySignupProfileField,
  value: string | boolean | null | undefined,
) {
  if (field.fieldType === "checkbox") {
    return value === true ||
      value === "1" ||
      (typeof value === "string" &&
        ["true", "yes", "on"].includes(value.trim().toLowerCase()))
      ? "1"
      : "0";
  }
  if (value === null || typeof value === "undefined") return "";
  return typeof value === "string" ? value.trim() : String(value);
}

function profileFieldFromRecord(record: {
  legacyId: number;
  recordKey: string | null;
  recordValue: string | null;
  legacyData: Prisma.JsonValue | null;
}): LegacySignupProfileField | null {
  const data = legacyObject(record.legacyData);
  const signup = normalizeSignupMode(
    typeof data.signup === "boolean" || typeof data.signup === "string"
      ? data.signup
      : legacyString(data, "signup"),
  );
  if (signup === "hide") return null;

  return {
    legacyId: record.legacyId,
    label:
      legacyString(data, "label") ||
      record.recordKey ||
      `Profile field ${record.legacyId}`,
    section: legacyString(data, "section") || "Profile",
    fieldType: normalizeProfileFieldType(
      legacyString(data, "type") || record.recordValue,
    ),
    signup,
  };
}

async function getSignupSources() {
  const settings = await db.legacySetting.findMany({
    where: { legacyTable: "login_settings" },
    select: { sourceDatabase: true },
    orderBy: { sourceDatabase: "asc" },
    distinct: ["sourceDatabase"],
  });
  if (settings.length > 0) return settings.map((row) => row.sourceDatabase);

  const levels = await db.legacyAuthRecord.findMany({
    where: { recordType: "login_level" },
    select: { sourceDatabase: true },
    orderBy: { sourceDatabase: "asc" },
    distinct: ["sourceDatabase"],
  });
  return levels.map((row) => row.sourceDatabase);
}

async function getSourceContext(sourceDatabase: string) {
  const [settings, levels, profileFieldRecords] = await Promise.all([
    db.legacySetting.findMany({
      where: { sourceDatabase, legacyTable: "login_settings" },
      orderBy: { legacyId: "asc" },
      select: {
        settingKey: true,
        settingValue: true,
      },
    }),
    db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase,
        recordType: "login_level",
        OR: [{ isDisabled: false }, { isDisabled: null }],
      },
      orderBy: { legacyId: "asc" },
      select: {
        legacyId: true,
        recordKey: true,
      },
    }),
    db.legacyAuthRecord.findMany({
      where: {
        sourceDatabase,
        recordType: "profile_field",
        OR: [{ isDisabled: false }, { isDisabled: null }],
      },
      orderBy: [
        { legacyId: "asc" },
        { recordKey: "asc" },
      ],
      select: {
        legacyId: true,
        recordKey: true,
        recordValue: true,
        legacyData: true,
      },
    }),
  ]);

  const map = settingsMap(settings);
  const profileFields = profileFieldRecords
    .map(profileFieldFromRecord)
    .filter((field): field is LegacySignupProfileField => Boolean(field));
  const defaultLevelIds = parsePhpLevelIds(setting(map, "default-level"));
  const defaultLevels = defaultLevelIds.length
    ? levels.filter((level) => defaultLevelIds.includes(level.legacyId))
    : levels.slice(0, 1);

  return {
    settings: map,
    levels: levels.map((level) => ({
      legacyId: level.legacyId,
      label: level.recordKey ?? `Level ${level.legacyId}`,
    })),
    defaultLevelIds: defaultLevels.map((level) => level.legacyId),
    defaultLevelLabels: defaultLevels.map(
      (level) => level.recordKey ?? `Level ${level.legacyId}`,
    ),
    profileFields,
  };
}

export async function getLegacySignupPageData(
  requestedSource?: string | null,
): Promise<ActionResult<LegacySignupPageData>> {
  try {
    const source = choosePreferredSource(
      await getSignupSources(),
      requestedSource?.trim() || null,
    );

    if (!source) {
      return {
        success: true,
        data: {
          sourceDatabase: null,
          registrationsDisabled: true,
          useEmailAsUsername: false,
          requireActivation: false,
          captchaMode: "disableCaptcha",
          defaultLevelLabels: [],
          profileFields: [],
        },
      };
    }

    const context = await getSourceContext(source);
    return {
      success: true,
      data: {
        sourceDatabase: source,
        registrationsDisabled: legacyBool(
          setting(context.settings, "disable-registrations-enable"),
        ),
        useEmailAsUsername: legacyBool(
          setting(context.settings, "email-as-username-enable"),
        ),
        requireActivation: legacyBool(
          setting(context.settings, "user-activation-enable"),
        ),
        captchaMode: setting(context.settings, "integration-captcha", "disableCaptcha"),
        defaultLevelLabels: context.defaultLevelLabels,
        profileFields: context.profileFields,
      },
    };
  } catch (error) {
    console.error("Failed to load legacy signup data:", error);
    return {
      success: false,
      error: "Legacy signup settings are unavailable.",
    };
  }
}

async function saveSignupProfileValues(
  tx: Prisma.TransactionClient,
  params: {
    sourceDatabase: string;
    userId: string;
    legacyUserId: number;
    fields: LegacySignupProfileField[];
    values: LegacySignupProfileValueInput[];
  },
) {
  if (params.fields.length === 0) return;

  const submittedByField = new Map<number, LegacySignupProfileValueInput>();
  for (const value of params.values) {
    const fieldLegacyId = Number(value.fieldLegacyId);
    if (Number.isInteger(fieldLegacyId) && fieldLegacyId > 0) {
      submittedByField.set(fieldLegacyId, value);
    }
  }

  const maxRecord = await tx.legacyAuthRecord.findFirst({
    where: {
      sourceDatabase: params.sourceDatabase,
      legacyTable: "login_profiles",
    },
    orderBy: { legacyId: "desc" },
    select: { legacyId: true },
  });
  let nextLegacyId = (maxRecord?.legacyId ?? 0) + 1;

  for (const field of params.fields) {
    const submitted = submittedByField.get(field.legacyId);
    const recordValue = normalizeProfileValue(field, submitted?.value ?? null);
    const legacyId = nextLegacyId;
    nextLegacyId += 1;

    await tx.legacyAuthRecord.create({
      data: {
        sourceDatabase: params.sourceDatabase,
        legacyTable: "login_profiles",
        legacyKey: `${params.sourceDatabase}:login_profiles:${legacyId}`,
        legacyId,
        recordType: "profile_value",
        userId: params.userId,
        legacyUserId: params.legacyUserId,
        recordKey: field.label,
        recordValue,
        legacyData: {
          p_id: legacyId,
          pfield_id: field.legacyId,
          user_id: params.legacyUserId,
          profile_label: field.label,
          profile_value: recordValue,
          inserted_from: "modern_legacy_signup",
        },
      },
    });
  }
}

async function notifyRecipientsForLevels(params: {
  tx: Prisma.TransactionClient;
  sourceDatabase: string;
  levelIds: number[];
  levels: Array<{ legacyId: number; label: string }>;
  organizationId: string | null;
}) {
  if (params.levelIds.length === 0) return [] as string[];

  const legacyUsers = await params.tx.legacyAuthRecord.findMany({
    where: {
      sourceDatabase: params.sourceDatabase,
      recordType: "login_user",
      userId: { not: null },
      OR: [{ isDisabled: false }, { isDisabled: null }],
    },
    select: {
      userId: true,
      recordValue: true,
    },
  });
  const selected = new Set(params.levelIds);
  const exactUserIds = legacyUsers.flatMap((row) => {
    const matches = parsePhpLevelIds(row.recordValue).some((levelId) =>
      selected.has(levelId),
    );
    return matches && row.userId ? [row.userId] : [];
  });

  const role = roleForLegacyLevels(params.levelIds, params.levels);
  const fallbackUsers = await params.tx.user.findMany({
    where: {
      isActive: true,
      role,
      OR: [
        ...(params.organizationId
          ? [{ organizationId: params.organizationId }]
          : []),
        { organizationId: null },
      ],
    },
    select: { id: true },
  });

  return Array.from(
    new Set([...exactUserIds, ...fallbackUsers.map((user) => user.id)]),
  );
}

export async function createLegacySignup(
  input: LegacySignupInput,
): Promise<ActionResult<LegacySignupResult>> {
  try {
    const sourceDatabase = input.sourceDatabase.trim();
    if (!sourceDatabase) {
      return { success: false, error: "Legacy signup is not configured." };
    }

    const context = await getSourceContext(sourceDatabase);
    if (
      legacyBool(setting(context.settings, "disable-registrations-enable"))
    ) {
      return { success: false, error: "Registrations disabled." };
    }

    const useEmailAsUsername = legacyBool(
      setting(context.settings, "email-as-username-enable"),
    );
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const username = useEmailAsUsername
      ? email
      : (input.username ?? "").trim();

    if (!name) return { success: false, error: "You must enter your name." };
    if (!username) {
      return { success: false, error: "You must enter a username." };
    }
    if (!useEmailAsUsername && username.length > 11) {
      return {
        success: false,
        error: "Your username must be under 11 characters",
      };
    }
    if (!validateEmail(email)) {
      return {
        success: false,
        error: "You have entered an invalid e-mail address, try again.",
      };
    }
    if (input.password !== input.passwordConfirm) {
      return { success: false, error: "Your passwords did not match." };
    }
    if (input.password.length < MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      };
    }

    const blockedDomains = parsePhpStringArray(
      setting(context.settings, "restrict-signups-by-email"),
    ).map((domain) => domain.toLowerCase());
    const emailDomain = email.split("@").pop()?.toLowerCase() ?? "";
    if (emailDomain && blockedDomains.includes(emailDomain)) {
      return { success: false, error: "That email address is not allowed." };
    }

    const submittedValues = input.profileValues ?? [];
    const submittedByField = new Map(
      submittedValues.map((value) => [Number(value.fieldLegacyId), value]),
    );
    for (const field of context.profileFields) {
      if (field.signup !== "require") continue;
      const submitted = submittedByField.get(field.legacyId);
      const value = normalizeProfileValue(field, submitted?.value ?? null);
      if (!value || value === "0") {
        return {
          success: false,
          error: `The field "${field.label}" is required!`,
        };
      }
    }

    const defaultLevelIds = context.defaultLevelIds;
    if (defaultLevelIds.length === 0) {
      return { success: false, error: "No user level has been selected." };
    }

    const duplicateLegacy = await db.legacyAuthRecord.findFirst({
      where: {
        sourceDatabase,
        recordType: "login_user",
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: email, mode: "insensitive" } },
        ],
      },
      select: {
        username: true,
        email: true,
      },
    });
    if (duplicateLegacy?.username?.toLowerCase() === username.toLowerCase()) {
      return { success: false, error: "Sorry, username already taken." };
    }
    if (duplicateLegacy?.email?.toLowerCase() === email) {
      return {
        success: false,
        error: "That email address has already been taken.",
      };
    }

    const duplicateModern = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (duplicateModern) {
      return {
        success: false,
        error: "That email address has already been taken.",
      };
    }

    const [organization, maxUser] = await Promise.all([
      db.organization.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      }),
      db.legacyAuthRecord.findFirst({
        where: { sourceDatabase, recordType: "login_user" },
        orderBy: { legacyId: "desc" },
        select: { legacyId: true },
      }),
    ]);
    const organizationId = organization?.id ?? null;
    const legacyUserId = (maxUser?.legacyId ?? 0) + 1;
    const userLevel = serializePhpStringArray(defaultLevelIds);
    const passwordHash = await hash(input.password, 12);
    const requireActivation = legacyBool(
      setting(context.settings, "user-activation-enable"),
    );
    const key = requireActivation ? randomBytes(16).toString("hex") : null;
    const activate = key ? activationUrl(key) : "";
    const values = {
      site_address: siteAddress(),
      full_name: name,
      username,
      email,
      activate,
    };
    const welcomeSubject = renderTemplate(
      setting(context.settings, "email-welcome-subj", "Welcome"),
      values,
    );
    const welcomeBody = renderTemplate(
      setting(context.settings, "email-welcome-msg", "Welcome {{full_name}}"),
      values,
    );
    const newUserSubject = renderTemplate(
      setting(context.settings, "email-new-user-subj", "New user registration"),
      values,
    );
    const newUserBody = renderTemplate(
      setting(
        context.settings,
        "email-new-user-msg",
        "A new user has registered: {{username}}",
      ),
      values,
    );
    const notifyLevelIds = parsePhpLevelIds(
      setting(context.settings, "notify-new-users"),
    );
    const redirectTo = setting(context.settings, "new-user-redirect", "/dashboard") ||
      "/dashboard";
    const shouldSendWelcome = !legacyBool(
      setting(context.settings, "email-welcome-disable"),
    );
    const loginLegacyData = {
      user_id: legacyUserId,
      user_level: userLevel,
      restricted: requireActivation ? 1 : 0,
      username,
      name,
      email,
      usites: "0",
      uclasses: "0",
      uchild: "0",
      db_id: organizationId,
      timestamp: new Date().toISOString(),
      inserted_from: "modern_legacy_signup",
      welcomeEmail: shouldSendWelcome
        ? {
            subject: welcomeSubject,
            body: welcomeBody,
            deliveryConfigured: false,
          }
        : null,
    };
    const activationLegacyData = key
      ? {
          type: "new_user",
          username,
          email,
          activate,
          emailSubject: welcomeSubject,
          emailBody: welcomeBody,
          deliveryConfigured: false,
          inserted_from: "modern_legacy_signup",
        }
      : null;

    const created = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          role: roleForLegacyLevels(defaultLevelIds, context.levels),
          passwordHash,
          isActive: !requireActivation,
          emailVerified: requireActivation ? null : new Date(),
          organizationId,
        },
        select: { id: true },
      });

      const legacyRecord = await tx.legacyAuthRecord.create({
        data: {
          sourceDatabase,
          legacyTable: "login_users",
          legacyKey: `${sourceDatabase}:login_users:${legacyUserId}`,
          legacyId: legacyUserId,
          recordType: "login_user",
          userId: user.id,
          legacyUserId,
          username,
          email,
          recordKey: username,
          recordValue: userLevel,
          isDisabled: requireActivation,
          legacyData: loginLegacyData,
        },
      });

      await saveSignupProfileValues(tx, {
        sourceDatabase,
        userId: user.id,
        legacyUserId,
        fields: context.profileFields,
        values: submittedValues,
      });

      let activationRecordId: string | null = null;
      if (key && activationLegacyData) {
        const activationRecord = await tx.legacyAuthRecord.create({
          data: {
            sourceDatabase,
            legacyTable: "login_confirm",
            legacyKey: `${sourceDatabase}:login_confirm:new_user:${key}`,
            legacyId: 0,
            recordType: "new_user",
            userId: user.id,
            legacyUserId,
            username,
            email,
            recordKey: key,
            recordValue: activate,
            legacyData: activationLegacyData,
          },
        });
        activationRecordId = activationRecord.id;
      }

      let adminNotificationRecipients = 0;
      let adminRecipientIds: string[] = [];
      if (legacyBool(setting(context.settings, "notify-new-user-enable"))) {
        const recipientIds = await notifyRecipientsForLevels({
          tx,
          sourceDatabase,
          levelIds: notifyLevelIds,
          levels: context.levels,
          organizationId,
        });
        adminRecipientIds = recipientIds;
        adminNotificationRecipients = recipientIds.length;

        if (recipientIds.length > 0) {
          await tx.notification.createMany({
            data: recipientIds.map((userId) => ({
              userId,
              title: newUserSubject,
              body: newUserBody,
              type: "NEW_USER_NOTIFICATION",
              category: "NEW_USER_NOTIFICATION",
              isRead: false,
            })),
          });
        }
      }

      return {
        userId: user.id,
        legacyRecordId: legacyRecord.id,
        activationRecordId,
        adminNotificationRecipients,
        adminRecipientIds,
      };
    });
    const welcomeDelivery = shouldSendWelcome
      ? await deliverEmail({
          recipients: [{ email, name }],
          subject: welcomeSubject,
          body: welcomeBody,
          category: requireActivation ? "ACTIVATION_RESEND" : "WELCOME",
          metadata: {
            source: "legacy_signup_welcome",
            requiresActivation: requireActivation,
            legacyUserId,
          },
        })
      : null;
    const adminUsers = created.adminRecipientIds.length
      ? await db.user.findMany({
          where: { id: { in: created.adminRecipientIds } },
          select: { email: true, name: true },
        })
      : [];
    const adminEmailDelivery =
      adminUsers.length > 0
        ? await deliverEmail({
            recipients: adminUsers
              .filter((user) => Boolean(user.email))
              .map((user) => ({ email: user.email, name: user.name })),
            subject: newUserSubject,
            body: newUserBody,
            category: "NEW_USER_NOTIFICATION",
            metadata: {
              source: "legacy_signup_admin_notice",
              legacyUserId,
            },
            mode: "bcc",
          })
        : null;

    await db.legacyAuthRecord.update({
      where: { id: created.legacyRecordId },
      data: {
        legacyData: {
          ...loginLegacyData,
          welcomeEmail: shouldSendWelcome
            ? {
                subject: welcomeSubject,
                body: welcomeBody,
                deliveryConfigured: welcomeDelivery?.configured ?? false,
                ...(welcomeDelivery
                  ? { emailDelivery: emailDeliveryAuditData(welcomeDelivery) }
                  : {}),
              }
            : null,
          ...(adminEmailDelivery
            ? {
                newUserNotificationEmail: {
                  subject: newUserSubject,
                  body: newUserBody,
                  deliveryConfigured: adminEmailDelivery.configured,
                  emailDelivery: emailDeliveryAuditData(adminEmailDelivery),
                },
              }
            : {}),
        },
      },
    });
    if (created.activationRecordId && activationLegacyData) {
      await db.legacyAuthRecord.update({
        where: { id: created.activationRecordId },
        data: {
          legacyData: {
            ...activationLegacyData,
            deliveryConfigured: welcomeDelivery?.configured ?? false,
            ...(welcomeDelivery
              ? { emailDelivery: emailDeliveryAuditData(welcomeDelivery) }
              : {}),
          },
        },
      });
    }

    revalidatePath("/signup");
    revalidatePath("/settings/legacy-users");
    revalidatePath("/activate.php");

    return {
      success: true,
      data: {
        email,
        username,
        requiresActivation: requireActivation,
        activationUrl: activate || undefined,
        redirectTo,
        welcomeDeliveryConfigured: welcomeDelivery?.configured ?? false,
        adminNotificationRecipients: created.adminNotificationRecipients,
      },
    };
  } catch (error) {
    console.error("Failed to create legacy signup:", error);
    return {
      success: false,
      error: "Failed to create your account",
    };
  }
}
