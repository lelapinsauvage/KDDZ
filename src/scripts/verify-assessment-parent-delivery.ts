import "dotenv/config";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as notificationsPost } from "@/app/ws/notifications_master.php/route";
import { db } from "@/lib/db";
import { generateAssessmentAlarmsForOrganization } from "@/lib/jobs/assessment-alarms";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null };

const ASSESSMENT_ALARM_SOURCE = "t_alarms_assessment";
const ASSESSMENT_PARENT_ALARM_SOURCE = "t_alarms_assessment_parents";
const ASSESSMENT_RECEIPT_SOURCE = "custom_notifications_assessment";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function main() {
  const marker = `verify-assessment-parent-delivery-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const sourceDatabase = `${marker}-db`;
  const legacyChildId = Math.floor(Date.now() % 2_000_000_000);
  const legacyClassId = (legacyChildId % 1_000_000) + 100;
  const legacyStaffId = legacyClassId + 500;
  const today = startOfToday();
  const dateOfBirth = addDays(today, -80);
  const enrollmentDate = addDays(dateOfBirth, 1);

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let klass: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let parentUser: IdRecord | null = null;
  let staffUser: IdRecord | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Assessment Parent Delivery Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        sourceDatabase,
        name: "Assessment Parent Delivery Branch",
      },
      select: { id: true },
    });

    await db.legacySetting.createMany({
      data: Array.from({ length: 10 }, (_, index) => ({
        sourceDatabase,
        legacyTable: "t_notification_setting",
        legacyId: index + 1,
        settingKey: `notification-${index + 1}`,
        settingValue: "1",
        legacyData: { alarms: 1 },
      })),
    });

    klass = await db.class.create({
      data: {
        branchId: branch.id,
        sourceDatabase,
        legacyId: legacyClassId,
        name: "Assessment Verification Class",
      },
      select: { id: true },
    });

    child = await db.child.create({
      data: {
        firstName: "Assessment",
        lastName: "Delivery",
        branchId: branch.id,
        classId: klass.id,
        sourceDatabase,
        legacyId: legacyChildId,
        dateOfBirth,
        enrollmentDate,
        isActive: true,
        isDraft: false,
      },
      select: { id: true, legacyId: true },
    });

    parentUser = await db.parentUser.create({
      data: {
        username: `${marker}-parent@example.test`,
        passwordHash: "not-used-by-assessment-delivery-verifier",
        childId: child.id,
        legacyChildId: child.legacyId,
        isActive: true,
      },
      select: { id: true },
    });

    staffUser = await db.user.create({
      data: {
        email: `${marker}-teacher@example.test`,
        name: "Assessment Delivery Teacher",
        role: "TEACHER",
        organizationId: organization.id,
        branchId: branch.id,
        sourceDatabase,
        legacyId: legacyStaffId,
        legacyTable: "login_users",
        isActive: true,
      },
      select: { id: true },
    });

    await db.legacyAuthRecord.create({
      data: {
        sourceDatabase,
        legacyTable: "login_users",
        legacyKey: `${sourceDatabase}:login_users:${legacyStaffId}`,
        legacyId: legacyStaffId,
        legacyUserId: legacyStaffId,
        recordType: "user",
        userId: staffUser.id,
        username: `${marker}-teacher`,
        email: `${marker}-teacher@example.test`,
        isDisabled: false,
        legacyData: { uclasses: String(legacyClassId) },
      },
    });

    const firstRun = await generateAssessmentAlarmsForOrganization({
      organizationId: organization.id,
    });
    assert.equal(firstRun.childrenMatched, 1, "first run should match one due assessment");
    assert.equal(firstRun.alarmsCreated, 1, "first run should create one staff alarm");
    assert.equal(
      firstRun.parentAlarmsCreated,
      1,
      "first run should create one parent assessment alarm"
    );
    assert.equal(firstRun.receiptsCreated, 1, "first run should create one staff receipt");
    assert.equal(
      firstRun.notificationsCreated,
      1,
      "first run should create one staff notification"
    );

    const [staffAlarm, parentAlarm] = await Promise.all([
      db.alarm.findFirst({
        where: {
          type: "ASSESSMENT",
          referenceId: child.id,
          referenceType: "Child",
          legacyData: { path: ["sourceTable"], equals: ASSESSMENT_ALARM_SOURCE },
        },
        select: { id: true, message: true, legacyData: true },
      }),
      db.alarm.findFirst({
        where: {
          type: "ASSESSMENT",
          referenceId: child.id,
          referenceType: "Child",
          legacyData: { path: ["sourceTable"], equals: ASSESSMENT_PARENT_ALARM_SOURCE },
        },
        select: { id: true, message: true, legacyData: true },
      }),
    ]);
    assert.ok(staffAlarm, "staff assessment alarm should be persisted");
    assert.ok(parentAlarm, "parent assessment alarm should be persisted");
    assert.equal(
      parentAlarm.message,
      staffAlarm.message,
      "parent alarm should expose the same due-reminder body"
    );

    const staffLegacyData = staffAlarm.legacyData as { aid?: unknown };
    const legacyNotificationId = Number(staffLegacyData.aid);
    assert.ok(
      Number.isFinite(legacyNotificationId),
      "staff alarm should have a legacy notification id"
    );

    const receipt = await db.notificationReceipt.findFirst({
      where: {
        sourceTable: ASSESSMENT_RECEIPT_SOURCE,
        legacyNotificationId,
        legacyRecipientId: legacyStaffId,
        recipientType: "USER",
      },
      select: { recipientId: true, isRead: true },
    });
    assert.ok(receipt, "generated staff assessment receipt should be persisted");
    assert.equal(receipt.recipientId, staffUser.id);
    assert.equal(receipt.isRead, false);

    const secondRun = await generateAssessmentAlarmsForOrganization({
      organizationId: organization.id,
    });
    assert.equal(secondRun.childrenMatched, 1, "second run should still match one due assessment");
    assert.equal(secondRun.alarmsCreated, 0, "second run must not duplicate staff alarms");
    assert.equal(
      secondRun.parentAlarmsCreated,
      0,
      "second run must not duplicate parent alarms"
    );
    assert.equal(secondRun.receiptsCreated, 0, "second run must not duplicate receipts");
    assert.equal(
      secondRun.skippedExisting,
      1,
      "second run should count the existing staff alarm"
    );
    assert.equal(
      secondRun.skippedExistingParentAlarms,
      1,
      "second run should count the existing parent alarm"
    );

    const parentAlarmCount = await db.alarm.count({
      where: {
        type: "ASSESSMENT",
        referenceId: child.id,
        referenceType: "Child",
        legacyData: { path: ["sourceTable"], equals: ASSESSMENT_PARENT_ALARM_SOURCE },
      },
    });
    assert.equal(parentAlarmCount, 1, "parent assessment alarm should stay idempotent");

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
      notificationBodies(payload).includes(parentAlarm.message ?? ""),
      true,
      "parent notifications payload should expose generated assessment alarm body"
    );

    console.log("assessment parent delivery assertions passed");
  } finally {
    if (child) {
      await db.notificationReceipt.deleteMany({
        where: {
          OR: [
            { sourceTable: ASSESSMENT_RECEIPT_SOURCE, recipientId: staffUser?.id },
            { alarm: { referenceId: child.id, referenceType: "Child" } },
          ],
        },
      });
      await db.alarm.deleteMany({
        where: { referenceId: child.id, referenceType: "Child" },
      });
    }
    if (staffUser) {
      await db.notification.deleteMany({ where: { userId: staffUser.id } });
      await db.legacyAuthRecord.deleteMany({ where: { userId: staffUser.id } });
      await db.user.deleteMany({ where: { id: staffUser.id } });
    }
    if (parentUser) await db.parentUser.deleteMany({ where: { id: parentUser.id } });
    await db.legacySetting.deleteMany({ where: { sourceDatabase } });
    if (child) await db.child.deleteMany({ where: { id: child.id } });
    if (klass) await db.class.deleteMany({ where: { id: klass.id } });
    if (branch) await db.branch.deleteMany({ where: { id: branch.id } });
    if (organization) {
      await db.organization.deleteMany({ where: { id: organization.id } });
    }
  }
}

function notificationBodies(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];

  return Object.values(payload as Record<string, unknown>).flatMap((group) => {
    if (!group || typeof group !== "object" || Array.isArray(group)) return [];
    const details = (group as { details?: unknown }).details;
    if (!Array.isArray(details)) return [];
    return details.flatMap((detail) => {
      if (!detail || typeof detail !== "object" || Array.isArray(detail)) return [];
      const body = (detail as { body?: unknown }).body;
      return typeof body === "string" ? [body] : [];
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
