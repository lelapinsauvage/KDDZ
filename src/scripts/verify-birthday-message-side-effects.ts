import "dotenv/config";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as notificationsPost } from "@/app/ws/notifications_master.php/route";
import { db } from "@/lib/db";
import {
  createLegacyBulkMessageSideEffects,
  findLegacyMessageSideEffect,
  legacySideEffectHasTargets,
} from "@/lib/legacy-message-side-effects";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null; branchId: string; classId: string | null };
type ParentRecord = { id: string; legacyId: number | null; legacyChildId: number | null };

const BIRTHDAY_PARENT_SOURCE = "custom_notifications_birthday_parents";
const BIRTHDAY_STAFF_SOURCE = "custom_notifications_birthday";
const BIRTHDAY_CONTENT_SOURCE = "t_alarms_birthday";

async function main() {
  const marker = `verify-birthday-side-effect-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyChildId = Math.floor(Date.now() % 2_000_000_000);
  const legacyTeacherId = legacyChildId + 10_000;
  const subject = `Birthday subject ${marker}`;
  const body = `Birthday body ${marker}`;

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let sender: IdRecord | null = null;
  let teacher: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let parentUser: ParentRecord | null = null;
  let thread: IdRecord | null = null;

  try {
    const config = findLegacyMessageSideEffect("Birthdays");
    assert.ok(config, "Birthdays nature should map to a legacy side-effect config");
    assert.equal(config.legacyMethod, "addToBirthdays");
    assert.equal(config.contentTable, BIRTHDAY_CONTENT_SOURCE);
    assert.equal(config.parentDeliveryTable, BIRTHDAY_PARENT_SOURCE);
    assert.equal(config.staffDeliveryTable, BIRTHDAY_STAFF_SOURCE);
    assert.equal(config.parentDeliveryMode, "standaloneAlarm");
    assert.equal(config.parentStandaloneReceipt, true);
    assert.equal(legacySideEffectHasTargets(config, 1, 0), true);

    organization = await db.organization.create({
      data: {
        name: "Birthday Side Effect Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "Birthday Side Effect Branch",
      },
      select: { id: true },
    });

    sender = await db.user.create({
      data: {
        email: `${marker}-sender@example.test`,
        name: "Birthday Sender",
        role: "ADMIN",
        organizationId: organization.id,
        isActive: true,
      },
      select: { id: true },
    });

    teacher = await db.user.create({
      data: {
        email: `${marker}-teacher@example.test`,
        name: "Birthday Teacher",
        role: "TEACHER",
        organizationId: organization.id,
        branchId: branch.id,
        isActive: true,
      },
      select: { id: true },
    });

    await db.legacyAuthRecord.create({
      data: {
        sourceDatabase: marker,
        legacyTable: "login_users",
        legacyKey: `${marker}:login_users:${legacyTeacherId}`,
        legacyId: legacyTeacherId,
        legacyUserId: legacyTeacherId,
        recordType: "login_user",
        userId: teacher.id,
        username: `${marker}-teacher`,
        email: `${marker}-teacher@example.test`,
      },
    });

    child = await db.child.create({
      data: {
        firstName: "Birthday",
        lastName: "Child",
        branchId: branch.id,
        legacyId: legacyChildId,
      },
      select: { id: true, legacyId: true, branchId: true, classId: true },
    });

    parentUser = await db.parentUser.create({
      data: {
        username: `${marker}-parent@example.test`,
        passwordHash: "not-used-by-birthday-verifier",
        childId: child.id,
        legacyId: legacyChildId + 20_000,
        legacyChildId: child.legacyId,
        isActive: true,
      },
      select: { id: true, legacyId: true, legacyChildId: true },
    });

    thread = await db.messageThread.create({
      data: {
        subject,
        organizationId: organization.id,
      },
      select: { id: true },
    });

    const summary = await db.$transaction((tx) =>
      createLegacyBulkMessageSideEffects({
        tx,
        organizationId: organization!.id,
        senderId: sender!.id,
        threadId: thread!.id,
        nature: "Birthday",
        subject,
        body,
        teacherUserIds: [teacher!.id],
        children: [{
          id: child!.id,
          legacyId: child!.legacyId,
          branchId: child!.branchId,
          classId: child!.classId,
          parentUsers: [{
            id: parentUser!.id,
            legacyId: parentUser!.legacyId,
            legacyChildId: parentUser!.legacyChildId,
          }],
        }],
      }),
    );

    assert.ok(summary, "Birthday side-effect generation should return a summary");
    assert.equal(summary.family, "Birthdays");
    assert.equal(summary.alarmsCreated, 2, "birthday send should create staff and parent alarms");
    assert.equal(summary.receiptsCreated, 2, "birthday send should create staff and parent receipts");

    const [staffAlarm, parentAlarm] = await Promise.all([
      db.alarm.findFirst({
        where: {
          type: "BIRTHDAY",
          referenceType: "SelectedTeachers",
          legacyData: { path: ["messageThreadId"], equals: thread.id },
        },
        select: { id: true, legacyData: true },
      }),
      db.alarm.findFirst({
        where: {
          type: "BIRTHDAY",
          referenceId: child.id,
          referenceType: "Child",
          legacyData: { path: ["sourceTable"], equals: BIRTHDAY_PARENT_SOURCE },
        },
        select: { id: true, message: true, legacyData: true },
      }),
    ]);
    assert.ok(staffAlarm, "birthday send should persist a staff alarm");
    assert.ok(parentAlarm, "birthday send should persist a standalone parent alarm");

    const staffLegacy = asRecord(staffAlarm.legacyData);
    assert.equal(staffLegacy.sourceTable, BIRTHDAY_CONTENT_SOURCE);
    assert.equal(staffLegacy.sourceDeliveryTable, BIRTHDAY_STAFF_SOURCE);
    assert.equal(staffLegacy.parentDeliveryTable, BIRTHDAY_PARENT_SOURCE);

    const parentLegacy = asRecord(parentAlarm.legacyData);
    assert.equal(parentLegacy.sourceTable, BIRTHDAY_PARENT_SOURCE);
    assert.equal(parentLegacy.sourceContentTable, BIRTHDAY_CONTENT_SOURCE);
    assert.equal(parentLegacy.legacyMethod, "addToBirthdays");
    assert.equal(parentLegacy.cusntf_notification_text, body);
    assert.equal(parentLegacy.details, body);
    assert.equal(parentLegacy.cusntf_user_id, child.legacyId);
    assert.equal(parentLegacy.ntype, 1);
    assert.equal(parentLegacy.cusntf_is_viewed, 0);

    const staffLegacyNotificationId = Number(staffLegacy.aid);
    const parentLegacyNotificationId = Number(parentLegacy.id ?? parentLegacy.aid);
    assert.ok(
      Number.isFinite(staffLegacyNotificationId),
      "staff birthday alarm should preserve legacy aid"
    );
    assert.ok(
      Number.isFinite(parentLegacyNotificationId),
      "parent birthday alarm should preserve legacy custom notification id"
    );

    const [staffReceipt, parentReceipt] = await Promise.all([
      db.notificationReceipt.findUnique({
        where: {
          sourceTable_legacyNotificationId_legacyRecipientId_recipientType: {
            sourceTable: BIRTHDAY_STAFF_SOURCE,
            legacyNotificationId: staffLegacyNotificationId,
            legacyRecipientId: legacyTeacherId,
            recipientType: "USER",
          },
        },
        select: { recipientId: true, isRead: true, alarmId: true },
      }),
      db.notificationReceipt.findUnique({
        where: {
          sourceTable_legacyNotificationId_legacyRecipientId_recipientType: {
            sourceTable: BIRTHDAY_PARENT_SOURCE,
            legacyNotificationId: parentLegacyNotificationId,
            legacyRecipientId: child.legacyId ?? 0,
            recipientType: "CHILD",
          },
        },
        select: { recipientId: true, isRead: true, alarmId: true },
      }),
    ]);
    assert.ok(staffReceipt, "birthday send should persist a staff receipt");
    assert.equal(staffReceipt.recipientId, teacher.id);
    assert.equal(staffReceipt.isRead, false);
    assert.equal(staffReceipt.alarmId, staffAlarm.id);

    assert.ok(parentReceipt, "birthday send should persist a parent receipt");
    assert.equal(parentReceipt.recipientId, child.id);
    assert.equal(parentReceipt.isRead, false);
    assert.equal(parentReceipt.alarmId, parentAlarm.id);

    const request = new NextRequest("http://localhost/ws/notifications_master.php", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ usites: String(child.legacyId) }),
    });
    const response = await notificationsPost(request);
    assert.ok(response, "notifications_master.php should return a response");
    assert.equal(response.status, 200, "notifications_master.php should return HTTP 200");
    const payload = await response.json();
    assert.equal(
      notificationDetails(payload).some((detail) => detail.body === body),
      true,
      "parent notifications payload should expose generated birthday parent row",
    );

    console.log("birthday message side-effect assertions passed");
  } finally {
    if (thread) {
      await db.notificationReceipt.deleteMany({
        where: {
          OR: [
            { alarm: { legacyData: { path: ["messageThreadId"], equals: thread.id } } },
            { metadata: { path: ["modernTargetId"], equals: thread.id } },
          ],
        },
      });
      await db.alarm.deleteMany({
        where: { legacyData: { path: ["messageThreadId"], equals: thread.id } },
      });
      await db.messageThread.deleteMany({ where: { id: thread.id } });
    }
    if (parentUser) await db.parentUser.deleteMany({ where: { id: parentUser.id } });
    if (child) await db.child.deleteMany({ where: { id: child.id } });
    if (teacher) {
      await db.legacyAuthRecord.deleteMany({ where: { userId: teacher.id } });
      await db.user.deleteMany({ where: { id: teacher.id } });
    }
    if (sender) await db.user.deleteMany({ where: { id: sender.id } });
    if (branch) await db.branch.deleteMany({ where: { id: branch.id } });
    if (organization) {
      await db.organization.deleteMany({ where: { id: organization.id } });
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function notificationDetails(payload: unknown): Array<{ subject: string; body: string }> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];

  return Object.values(payload as Record<string, unknown>).flatMap((group) => {
    if (!group || typeof group !== "object" || Array.isArray(group)) return [];
    const details = (group as { details?: unknown }).details;
    if (!Array.isArray(details)) return [];
    return details.flatMap((detail) => {
      if (!detail || typeof detail !== "object" || Array.isArray(detail)) return [];
      const subject = (detail as { subject?: unknown }).subject;
      const body = (detail as { body?: unknown }).body;
      return typeof subject === "string" && typeof body === "string"
        ? [{ subject, body }]
        : [];
    });
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
