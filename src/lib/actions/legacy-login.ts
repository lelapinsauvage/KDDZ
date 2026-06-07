"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { deliverEmail, emailDeliveryAuditData } from "@/lib/email-delivery";
import {
  getLegacyLoginDisabledStatus,
  legacyString,
  resolveStaffLoginIdentity,
} from "@/lib/legacy-auth-identity";

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

const SIGNIN_REDIRECT_SETTING_KEYS = [
  "signin-redirect-referrer-enable",
  "signin-redirect-url",
] as const;

export type LegacyDisabledContactInput = {
  name: string;
  email: string;
  subject: string;
  comments: string;
  verify: string;
};

export type LegacyDisabledContactResult = {
  deliveryConfigured: boolean;
  adminNotifications: number;
};

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function inputString(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function legacyBool(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return Boolean(
    normalized && !["0", "false", "no", "off", "null"].includes(normalized),
  );
}

function modernizeLegacyRedirect(value: string) {
  const normalized = value.trim().replace(/^\/+/, "").toLowerCase();
  if (
    normalized === "home.php" ||
    normalized === "index.php" ||
    normalized === "front/templates/admin/home.php" ||
    normalized === "front/templates/admin/index.php"
  ) {
    return "/dashboard";
  }
  return value;
}

function safeInternalRedirect(
  value: string | null | undefined,
  origin: string,
  fallback = "/dashboard",
) {
  const trimmed = modernizeLegacyRedirect(inputString(value));
  if (!trimmed) return fallback;

  try {
    const url = new URL(trimmed, origin);
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
}

async function requestOrigin() {
  const requestHeaders = await headers();
  const proto =
    requestHeaders.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  return `${proto}://${host}`;
}

function disabledUrl(params: {
  name?: string | null;
  email?: string | null;
  reason?: string | null;
}) {
  const search = new URLSearchParams();
  if (params.name) search.set("name", params.name);
  if (params.email) search.set("email", params.email);
  if (params.reason) search.set("reason", params.reason);
  const query = search.toString();
  return query ? `/disabled.php?${query}` : "/disabled.php";
}

export async function getLegacyLoginSuccessRedirect(input: {
  callbackUrl?: string | null;
}): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const origin = await requestOrigin();
    const callbackUrl = inputString(input.callbackUrl);
    if (callbackUrl) {
      return {
        success: true,
        data: { redirectTo: safeInternalRedirect(callbackUrl, origin) },
      };
    }

    const rows = await db.legacySetting.findMany({
      where: {
        legacyTable: { in: ["login_settings", "login_settings_man"] },
        settingKey: { in: [...SIGNIN_REDIRECT_SETTING_KEYS] },
      },
      orderBy: [
        { legacyTable: "asc" },
        { sourceDatabase: "asc" },
        { legacyId: "desc" },
      ],
      select: {
        settingKey: true,
        settingValue: true,
      },
    });
    const value = (key: (typeof SIGNIN_REDIRECT_SETTING_KEYS)[number]) =>
      rows.find((row) => row.settingKey === key)?.settingValue ?? null;
    const useReferrer =
      rows.length === 0 ||
      legacyBool(value("signin-redirect-referrer-enable"));
    const target = useReferrer ? "home.php" : value("signin-redirect-url");

    return {
      success: true,
      data: { redirectTo: safeInternalRedirect(target, origin) },
    };
  } catch (error) {
    console.warn("getLegacyLoginSuccessRedirect fallback:", error);
    return { success: true, data: { redirectTo: "/dashboard" } };
  }
}

export async function getLegacyLoginFailureRedirect(
  identifier: string,
): Promise<ActionResult<{ redirectTo: string | null; message?: string }>> {
  try {
    const identity = await resolveStaffLoginIdentity(db, identifier);
    const disabledStatus = await getLegacyLoginDisabledStatus(db, identity);
    if (!disabledStatus.isDisabled) {
      return { success: true, data: { redirectTo: null } };
    }
    if (disabledStatus.reason === "legacy_logins_disabled") {
      return {
        success: true,
        data: {
          redirectTo: null,
          message: "The admin has disabled logins.",
        },
      };
    }
    if (!identity) {
      return { success: true, data: { redirectTo: null } };
    }

    const legacy = identity.legacy;
    const name =
      identity.user?.name ||
      legacyString(legacy?.legacyData, "name") ||
      legacy?.username ||
      legacy?.recordKey ||
      null;
    const email =
      identity.user?.email ||
      legacy?.email ||
      legacyString(legacy?.legacyData, "email") ||
      null;

    return {
      success: true,
      data: {
        redirectTo: disabledUrl({
          name,
          email,
          reason: disabledStatus.reason,
        }),
      },
    };
  } catch (error) {
    console.error("Failed to inspect legacy login failure:", error);
    return { success: false, error: "Unable to inspect login status." };
  }
}

export async function submitLegacyDisabledContact(
  input: LegacyDisabledContactInput,
): Promise<ActionResult<LegacyDisabledContactResult>> {
  const name = inputString(input.name);
  const email = inputString(input.email);
  const subject = inputString(input.subject);
  const comments = inputString(input.comments);
  const verify = inputString(input.verify).toLowerCase();

  let error = "";
  if (!name) {
    error = "You must enter your name.";
  } else if (!email) {
    error = "Please enter a valid email address.";
  } else if (!validateEmail(email)) {
    error = "You have enter an invalid e-mail address, try again.";
  }

  if (!subject) {
    error = "Please enter a subject.";
  } else if (!comments) {
    error = "Please enter your message.";
  } else if (!verify) {
    error = "Please enter the verification code.";
  } else if (verify !== "blue") {
    error = "The verification code you entered is incorrect.";
  }

  if (error) return { success: false, error };

  try {
    const identity = await resolveStaffLoginIdentity(db, email);
    const legacy = identity?.legacy ?? null;
    const user = identity?.user ?? null;
    const admins = await db.user.findMany({
      where: {
        role: "ADMIN",
        isActive: true,
      },
      select: { id: true, email: true, name: true },
    });
    const createdAt = new Date();
    const contactKey = randomBytes(10).toString("hex");
    const sourceDatabase = legacy?.sourceDatabase ?? "modern";
    const notificationTitle = "Disabled account contact";
    const notificationBody = `${name} (${email}) submitted: ${comments}`;
    const legacyData = {
      type: "disabled_contact",
      name,
      email,
      subject,
      comments,
      verify,
      deliveryConfigured: false,
      adminNotifications: admins.length,
      submittedAt: createdAt.toISOString(),
      inserted_from: "modern_disabled_php",
    } satisfies Prisma.InputJsonObject;

    const created = await db.$transaction(async (tx) => {
      const contactRecord = await tx.legacyAuthRecord.create({
        data: {
          sourceDatabase,
          legacyTable: "disabled_contact",
          legacyKey: `${sourceDatabase}:disabled_contact:${contactKey}`,
          legacyId: 0,
          recordType: "disabled_contact",
          userId: user?.id ?? null,
          legacyUserId: legacy?.legacyUserId ?? legacy?.legacyId ?? null,
          username: legacy?.username ?? legacy?.recordKey ?? null,
          email,
          recordKey: subject,
          recordValue: comments,
          legacyData,
        },
      });

      if (admins.length > 0) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: notificationTitle,
            body: notificationBody,
            type: "LEGACY_AUTH",
            category: "DISABLED_CONTACT",
          })),
        });
      }

      return { contactRecordId: contactRecord.id };
    });
    const emailDelivery = await deliverEmail({
      recipients: admins
        .filter((admin) => Boolean(admin.email))
        .map((admin) => ({ email: admin.email, name: admin.name })),
      subject: `${subject}: ${name}`,
      body: notificationBody,
      category: "DISABLED_CONTACT",
      metadata: {
        source: "legacy_disabled_contact",
        contactRecordId: created.contactRecordId,
      },
      mode: "bcc",
    });

    await db.legacyAuthRecord.update({
      where: { id: created.contactRecordId },
      data: {
        legacyData: {
          ...legacyData,
          deliveryConfigured: emailDelivery.configured,
          emailDelivery: emailDeliveryAuditData(emailDelivery),
        },
      },
    });

    revalidatePath("/disabled.php");
    revalidatePath("/users/disabled.php");

    return {
      success: true,
      data: {
        deliveryConfigured: emailDelivery.configured,
        adminNotifications: admins.length,
      },
    };
  } catch (error) {
    console.error("Failed to submit disabled contact:", error);
    return { success: false, error: "Unable to submit your message." };
  }
}
