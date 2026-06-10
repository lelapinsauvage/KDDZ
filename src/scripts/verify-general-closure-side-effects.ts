import "dotenv/config";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as notificationsPost } from "@/app/ws/notifications_master.php/route";
import { db } from "@/lib/db";
import {
  createLegacyBulkMessageSideEffects,
  findLegacyMessageSideEffect,
  legacyMessageSideEffectIntent,
  legacySideEffectHasTargets,
} from "@/lib/legacy-message-side-effects";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null; branchId: string; classId: string | null };
type ParentRecord = { id: string; legacyId: number | null; legacyChildId: number | null };

const GENERAL_PARENT_RECEIPT_SOURCE = "custom_notifications_parents";
const GENERAL_STAFF_RECEIPT_SOURCE = "custom_notifications";

async function main() {
  const marker = `verify-general-closure-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyChildId = Math.floor(Date.now() % 2_000_000_000);
  const legacyTeacherId = legacyChildId + 10_000;
  const subject = `Closure subject ${marker}`;
  const body = `Closure body ${marker}`;

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let sender: IdRecord | null = null;
  let teacher: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let parentUser: ParentRecord | null = null;
  let thread: IdRecord | null = null;
  let holiday: IdRecord | null = null;
  let alarm: IdRecord | null = null;

  try {
    const config = findLegacyMessageSideEffect("Closure");
    assert.ok(config, "Closure nature should map to a legacy side-effect config");
    assert.equal(config.legacyMethod, "addToGeneral");
    assert.equal(config.parentDeliveryTable, GENERAL_PARENT_RECEIPT_SOURCE);
    assert.equal(config.staffDeliveryTable, GENERAL_STAFF_RECEIPT_SOURCE);
    assert.equal(config.createsHoliday, true);
    assert.equal(legacySideEffectHasTargets(config, 1, 0), true);
    assert.deepEqual(
      legacyMessageSideEffectIntent("2"),
      {
        status: "writes-created-on-send",
        legacyNatureId: 2,
        family: "General",
        alarmType: "EVENT",
        legacyMethod: "addToGeneral",
        contentTable: "t_alarms",
        parentDeliveryTable: GENERAL_PARENT_RECEIPT_SOURCE,
        staffDeliveryTable: GENERAL_STAFF_RECEIPT_SOURCE,
        href: "alarms.php",
        createsHoliday: true,
        createsEvent: false,
      },
      "numeric legacy nature id should expose the exact General side-effect intent",
    );

    organization = await db.organization.create({
      data: {
        name: "General Closure Side Effect Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "General Closure Branch",
      },
      select: { id: true },
    });

    sender = await db.user.create({
      data: {
        email: `${marker}-sender@example.test`,
        name: "Closure Sender",
        role: "ADMIN",
        organizationId: organization.id,
        isActive: true,
      },
      select: { id: true },
    });

    teacher = await db.user.create({
      data: {
        email: `${marker}-teacher@example.test`,
        name: "Closure Teacher",
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
        firstName: "Closure",
        lastName: "Child",
        branchId: branch.id,
        legacyId: legacyChildId,
      },
      select: { id: true, legacyId: true, branchId: true, classId: true },
    });

    parentUser = await db.parentUser.create({
      data: {
        username: `${marker}-parent@example.test`,
        passwordHash: "not-used-by-general-closure-verifier",
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
        nature: "Closure",
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

    assert.ok(summary, "Closure side-effect generation should return a summary");
    assert.equal(summary.family, "General");
    assert.equal(summary.holidaysCreated, 1, "closure send should create one Holiday row");
    assert.equal(summary.alarmsCreated, 1, "closure send should create one general alarm");
    assert.equal(summary.receiptsCreated, 2, "closure send should create parent and staff receipts");

    const holidayRow = await db.holiday.findFirst({
      where: {
        name: subject,
        description: body,
        branchId: branch.id,
      },
      select: { id: true },
    });
    assert.ok(holidayRow, "closure send should persist a Holiday target");
    holiday = holidayRow;

    const alarmRow = await db.alarm.findFirst({
      where: {
        referenceId: holiday.id,
        referenceType: "Holiday",
      },
      select: { id: true, legacyData: true },
    });
    assert.ok(alarmRow, "closure send should persist a t_alarms-compatible alarm");
    alarm = { id: alarmRow.id };

    const legacyData = asRecord(alarmRow.legacyData);
    assert.equal(legacyData.sourceTable, "t_alarms");
    assert.equal(legacyData.sourceDeliveryTable, GENERAL_STAFF_RECEIPT_SOURCE);
    assert.equal(legacyData.parentDeliveryTable, GENERAL_PARENT_RECEIPT_SOURCE);
    assert.equal(legacyData.legacyMethod, "addToGeneral");
    assert.equal(legacyData.type, subject);
    assert.equal(legacyData.details, body);
    assert.equal(legacyData.href, "alarms.php");
    assert.equal(legacyData.ntype, 1);
    assert.equal(legacyData.status, 0);

    const legacyNotificationId = Number(legacyData.aid);
    assert.ok(Number.isFinite(legacyNotificationId), "alarm should preserve legacy aid");

    const parentReceipt = await db.notificationReceipt.findUnique({
      where: {
        sourceTable_legacyNotificationId_legacyRecipientId_recipientType: {
          sourceTable: GENERAL_PARENT_RECEIPT_SOURCE,
          legacyNotificationId,
          legacyRecipientId: child.legacyId ?? 0,
          recipientType: "CHILD",
        },
      },
      select: { recipientId: true, isRead: true, alarmId: true, metadata: true },
    });
    assert.ok(parentReceipt, "closure send should persist a parent receipt");
    assert.equal(parentReceipt.recipientId, child.id);
    assert.equal(parentReceipt.isRead, false);
    assert.equal(parentReceipt.alarmId, alarm.id);
    assert.equal(asRecord(parentReceipt.metadata).modernTargetType, "Holiday");

    const staffReceipt = await db.notificationReceipt.findUnique({
      where: {
        sourceTable_legacyNotificationId_legacyRecipientId_recipientType: {
          sourceTable: GENERAL_STAFF_RECEIPT_SOURCE,
          legacyNotificationId,
          legacyRecipientId: legacyTeacherId,
          recipientType: "USER",
        },
      },
      select: { recipientId: true, isRead: true, alarmId: true, metadata: true },
    });
    assert.ok(staffReceipt, "closure send should persist a selected-teacher receipt");
    assert.equal(staffReceipt.recipientId, teacher.id);
    assert.equal(staffReceipt.isRead, false);
    assert.equal(staffReceipt.alarmId, alarm.id);
    assert.equal(asRecord(staffReceipt.metadata).modernTargetType, "Holiday");

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
      notificationDetails(payload).some(
        (detail) => detail.subject === subject && detail.body === body,
      ),
      true,
      "parent notifications payload should expose generated closure receipt",
    );

    console.log("general closure side-effect assertions passed");
  } finally {
    if (thread) {
      await db.notificationReceipt.deleteMany({
        where: {
          OR: [
            { alarm: { legacyData: { path: ["messageThreadId"], equals: thread.id } } },
            { metadata: { path: ["modernTargetId"], equals: holiday?.id ?? "" } },
          ],
        },
      });
      await db.alarm.deleteMany({
        where: { legacyData: { path: ["messageThreadId"], equals: thread.id } },
      });
      await db.holiday.deleteMany({
        where: { id: holiday?.id ?? "00000000-0000-0000-0000-000000000000" },
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
