"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
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

export async function getLegacyLoginFailureRedirect(
  identifier: string,
): Promise<ActionResult<{ redirectTo: string | null }>> {
  try {
    const identity = await resolveStaffLoginIdentity(db, identifier);
    const disabledStatus = await getLegacyLoginDisabledStatus(db, identity);
    if (!disabledStatus.isDisabled || !identity) {
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
