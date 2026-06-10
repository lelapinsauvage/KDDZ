import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { generateAssessmentAlarmsForOrganization } from "@/lib/jobs/assessment-alarms";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null };

const ASSESSMENT_ALARM_SOURCE = "t_alarms_assessment";
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
  const marker = `verify-assessment-staff-push-${Date.now()}-${Math.random()
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
  let staffUser: IdRecord | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Assessment Staff Push Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        sourceDatabase,
        name: "Assessment Staff Push Branch",
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
        name: "Assessment Staff Push Class",
      },
      select: { id: true },
    });

    child = await db.child.create({
      data: {
        firstName: "Assessment",
        lastName: "StaffPush",
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

    staffUser = await db.user.create({
      data: {
        email: `${marker}-teacher@example.test`,
        name: "Assessment Staff Push Teacher",
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

    await db.pushToken.create({
      data: {
        userId: staffUser.id,
        token: `${marker}-ios-token`,
        platform: "IOS",
        isActive: true,
        legacyTable: "notifications_tokens",
      },
    });

    const firstRun = await generateAssessmentAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
    });
    assert.equal(firstRun.childrenMatched, 1);
    assert.equal(firstRun.alarmsCreated, 1);
    assert.equal(firstRun.receiptsCreated, 1);
    assert.equal(firstRun.notificationsCreated, 1);

    const staffAlarm = await db.alarm.findFirst({
      where: {
        type: "ASSESSMENT",
        referenceId: child.id,
        referenceType: "Child",
        legacyData: { path: ["sourceTable"], equals: ASSESSMENT_ALARM_SOURCE },
      },
      select: { id: true, legacyData: true },
    });
    assert.ok(staffAlarm, "staff assessment alarm should be persisted");
    const staffLegacyData = asRecord(staffAlarm.legacyData);
    const legacyNotificationId = Number(staffLegacyData.aid);
    assert.ok(Number.isFinite(legacyNotificationId));
    assert.equal(staffLegacyData.sourceDeliveryTable, ASSESSMENT_RECEIPT_SOURCE);

    const receipt = await db.notificationReceipt.findFirst({
      where: {
        sourceTable: ASSESSMENT_RECEIPT_SOURCE,
        legacyNotificationId,
        legacyRecipientId: legacyStaffId,
        recipientType: "USER",
      },
      select: { recipientId: true, isRead: true, alarmId: true },
    });
    assert.ok(receipt, "generated staff assessment receipt should be persisted");
    assert.equal(receipt.recipientId, staffUser.id);
    assert.equal(receipt.isRead, false);
    assert.equal(receipt.alarmId, staffAlarm.id);

    const pushDelivery = asRecord(staffLegacyData.pushDelivery);
    assert.equal(pushDelivery.provider, "disabled");
    assert.equal(pushDelivery.configured, false);
    assert.equal(pushDelivery.attemptedCount, 0);
    assert.equal(pushDelivery.skippedCount, 1);

    const secondRun = await generateAssessmentAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
    });
    assert.equal(secondRun.alarmsCreated, 0);
    assert.equal(secondRun.receiptsCreated, 0);
    assert.equal(secondRun.skippedExisting, 1);

    console.log("assessment staff push delivery assertions passed");
  } finally {
    if (child) {
      await db.notificationReceipt.deleteMany({
        where: {
          alarm: {
            referenceId: child.id,
            referenceType: "Child",
            type: "ASSESSMENT",
          },
        },
      });
      await db.alarm.deleteMany({
        where: {
          referenceId: child.id,
          referenceType: "Child",
          type: "ASSESSMENT",
        },
      });
    }
    if (staffUser) {
      await db.pushToken.deleteMany({ where: { userId: staffUser.id } });
      await db.notification.deleteMany({ where: { userId: staffUser.id } });
      await db.legacyAuthRecord.deleteMany({ where: { userId: staffUser.id } });
      await db.user.deleteMany({ where: { id: staffUser.id } });
    }
    if (child) await db.child.deleteMany({ where: { id: child.id } });
    if (klass) await db.class.deleteMany({ where: { id: klass.id } });
    if (branch) await db.branch.deleteMany({ where: { id: branch.id } });
    await db.legacySetting.deleteMany({ where: { sourceDatabase } });
    if (organization) await db.organization.deleteMany({ where: { id: organization.id } });
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value));
  return value as Record<string, unknown>;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
