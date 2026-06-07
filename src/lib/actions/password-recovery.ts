"use server";

import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import {
  deliverEmail,
  emailDeliveryAuditData,
  type EmailDeliverySummary,
} from "@/lib/email-delivery";

type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
};

const MIN_PASSWORD_LENGTH = 5;
const LOGIN_CONFIRM_TABLES = ["login_confirm", "login_confirm_man"];

type LegacyRecoverableRecord = {
  sourceDatabase: string;
  legacyTable: string;
  legacyId: number;
  legacyUserId: number | null;
  userId: string | null;
  recordType: string;
  username: string | null;
  email: string | null;
  recordKey: string | null;
};

function siteAddress() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3001"
  );
}

function resetUrl(key: string) {
  const base = siteAddress();
  try {
    return new URL(`/forgot.php?key=${encodeURIComponent(key)}`, base).toString();
  } catch {
    return `/forgot.php?key=${encodeURIComponent(key)}`;
  }
}

function showRecoveryLink() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.LEGACY_SHOW_PASSWORD_RESET_LINK === "true"
  );
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    return values[key] ?? match;
  });
}

function chooseLegacySettingValue(
  rows: Array<{
    sourceDatabase: string;
    settingKey: string;
    settingValue: string | null;
  }>,
  key: string,
) {
  const candidates = rows.filter(
    (row) => row.settingKey === key && row.settingValue?.trim(),
  );
  if (candidates.length === 0) return null;

  return (
    candidates.find((row) =>
      row.sourceDatabase.toLowerCase().includes("users29sept"),
    ) ??
    candidates.find((row) => row.sourceDatabase.toLowerCase().includes("29sept")) ??
    candidates.find((row) => !row.sourceDatabase.toLowerCase().includes("2018")) ??
    candidates[0]
  ).settingValue;
}

async function legacyTemplate(subjectKey: string, bodyKey: string) {
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
    subject: chooseLegacySettingValue(rows, subjectKey),
    body: chooseLegacySettingValue(rows, bodyKey),
  };
}

async function findRecoverableUser(usernamemail: string) {
  const credential = usernamemail.trim();
  if (!credential) return null;

  let legacyRecord: LegacyRecoverableRecord | null = null;

  try {
    legacyRecord = await db.legacyAuthRecord.findFirst({
      where: {
        recordType: { in: ["login_user", "manager_login_user"] },
        OR: [
          { username: { equals: credential, mode: "insensitive" as const } },
          { email: { equals: credential, mode: "insensitive" as const } },
        ],
      },
      orderBy: [{ sourceDatabase: "desc" }, { legacyId: "desc" }],
      select: {
        sourceDatabase: true,
        legacyTable: true,
        legacyId: true,
        legacyUserId: true,
        userId: true,
        recordType: true,
        username: true,
        email: true,
        recordKey: true,
      },
    });
  } catch (error) {
    console.warn("legacy password recovery metadata unavailable:", error);
  }

  const directUser = await db.user.findFirst({
    where: {
      OR: [
        { email: { equals: credential, mode: "insensitive" as const } },
        ...(legacyRecord?.userId ? [{ id: legacyRecord.userId }] : []),
        ...(legacyRecord?.email
          ? [
              {
                email: {
                  equals: legacyRecord.email,
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
    },
  });

  if (!directUser?.email) return null;

  return {
    user: directUser,
    legacy: legacyRecord,
    username:
      legacyRecord?.username ??
      legacyRecord?.recordKey ??
      directUser.email.split("@")[0] ??
      directUser.email,
  };
}

type RecoverableUser = NonNullable<Awaited<ReturnType<typeof findRecoverableUser>>>;

function loginConfirmTableFor(legacy: RecoverableUser["legacy"]) {
  return legacy?.recordType === "manager_login_user" ||
    legacy?.legacyTable === "login_users_man"
    ? "login_confirm_man"
    : "login_confirm";
}

export async function requestPasswordReset(
  usernamemail: string,
): Promise<
  ActionResult<{
    resetUrl?: string;
    deliveryConfigured: boolean;
    emailDelivery: EmailDeliverySummary;
  }>
> {
  const credential = usernamemail.trim();
  if (!credential) {
    return {
      success: false,
      error: "Please enter your username or email address.",
    };
  }

  const recoverable = await findRecoverableUser(credential);
  if (!recoverable?.user.isActive) {
    return { success: false, error: "This account does not exist." };
  }

  const key = randomBytes(16).toString("hex");
  const href = resetUrl(key);
  const legacyTable = loginConfirmTableFor(recoverable.legacy);
  const template = await legacyTemplate("email-forgot-subj", "email-forgot-msg");
  const values = {
    site_address: siteAddress(),
    full_name: recoverable.user.name ?? recoverable.username,
    username: recoverable.username,
    reset: href,
  };
  const subject = renderTemplate(
    template.subject ?? "Account Recovery",
    values,
  );
  const body = renderTemplate(
    template.body ??
      "Please use the following link to reset your password: {{reset}}",
    values,
  );
  const legacyData = {
    type: "forgot_pw",
    emailSubject: subject,
    emailBody: body,
    resetUrl: href,
    deliveryConfigured: false,
  };

  await db.$transaction([
    db.legacyAuthRecord.updateMany({
      where: {
        legacyTable,
        recordType: "forgot_pw",
        email: recoverable.user.email,
      },
      data: {
        recordType: "forgot_pw_replaced",
      },
    }),
    db.legacyAuthRecord.create({
      data: {
        sourceDatabase: recoverable.legacy?.sourceDatabase ?? "modern",
        legacyTable,
        legacyKey: `${
          recoverable.legacy?.sourceDatabase ?? "modern"
        }:${legacyTable}:forgot_pw:${key}`,
        legacyId: 0,
        recordType: "forgot_pw",
        userId: recoverable.user.id,
        legacyUserId:
          recoverable.legacy?.legacyUserId ?? recoverable.legacy?.legacyId ?? null,
        username: recoverable.username,
        email: recoverable.user.email,
        recordKey: key,
        recordValue: href,
        legacyData,
      },
    }),
  ]);
  const emailDelivery = await deliverEmail({
    recipients: [{ email: recoverable.user.email, name: recoverable.user.name }],
    subject,
    body,
    category: "PASSWORD_RECOVERY",
    metadata: {
      source: "legacy_password_recovery",
      legacyTable,
      recordType: "forgot_pw",
    },
  });

  await db.legacyAuthRecord.updateMany({
    where: {
      legacyTable,
      recordType: "forgot_pw",
      recordKey: key,
    },
    data: {
      legacyData: {
        ...legacyData,
        deliveryConfigured: emailDelivery.configured,
        emailDelivery: emailDeliveryAuditData(emailDelivery),
      },
    },
  });

  revalidatePath("/forgot");

  return {
    success: true,
    data: {
      deliveryConfigured: emailDelivery.configured,
      emailDelivery,
      resetUrl: showRecoveryLink() ? href : undefined,
    },
  };
}

export async function resetForgottenPassword(params: {
  key: string;
  password: string;
  password2: string;
}): Promise<ActionResult> {
  const key = params.key.trim();
  if (!/^[a-f0-9]{32}$/i.test(key)) {
    return { success: false, error: "Verification failed." };
  }
  if (params.password !== params.password2) {
    return { success: false, error: "Your passwords did not match, try again." };
  }
  if (params.password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  const record = await db.legacyAuthRecord.findFirst({
    where: {
      legacyTable: { in: LOGIN_CONFIRM_TABLES },
      recordType: "forgot_pw",
      recordKey: key,
    },
    select: {
      id: true,
      userId: true,
      email: true,
      username: true,
    },
  });

  if (!record) {
    return { success: false, error: "Verification failed." };
  }

  const user = await db.user.findFirst({
    where: {
      OR: [
        ...(record.userId ? [{ id: record.userId }] : []),
        ...(record.email ? [{ email: record.email }] : []),
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user?.email) {
    return { success: false, error: "Verification failed." };
  }

  const passwordHash = await hash(params.password, 12);
  const template = await legacyTemplate(
    "email-forgot-success-subj",
    "email-forgot-success-msg",
  );
  const values = {
    site_address: siteAddress(),
    full_name: user.name ?? record.username ?? user.email,
    username: record.username ?? user.email,
  };
  const successSubject = renderTemplate(
    template.subject ?? "Password reset complete",
    values,
  );
  const successBody = renderTemplate(
    template.body ?? "Your password has been successfully changed.",
    values,
  );
  const usedAt = new Date().toISOString();

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    db.legacyAuthRecord.updateMany({
      where: {
        legacyTable: { in: LOGIN_CONFIRM_TABLES },
        recordType: "forgot_pw",
        OR: [{ email: user.email }, { recordKey: key }],
      },
      data: {
        recordType: "forgot_pw_used",
        legacyData: {
          type: "forgot_pw",
          emailSubject: successSubject,
          emailBody: successBody,
          deliveryConfigured: false,
          usedAt,
        },
      },
    }),
  ]);
  const emailDelivery = await deliverEmail({
    recipients: [{ email: user.email, name: user.name }],
    subject: successSubject,
    body: successBody,
    category: "PASSWORD_RECOVERY",
    metadata: {
      source: "legacy_password_reset_success",
      tokenId: record.id,
    },
  });

  await db.legacyAuthRecord.update({
    where: { id: record.id },
    data: {
      legacyData: {
        type: "forgot_pw",
        emailSubject: successSubject,
        emailBody: successBody,
        deliveryConfigured: emailDelivery.configured,
        emailDelivery: emailDeliveryAuditData(emailDelivery),
        usedAt,
      },
    },
  });

  revalidatePath("/forgot");

  return { success: true };
}
