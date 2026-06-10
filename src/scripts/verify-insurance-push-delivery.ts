import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { generateInsuranceAlarmsForOrganization } from "@/lib/jobs/insurance-alarms";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null };

const INSURANCE_RECEIPT_SOURCE = "custom_notifications_insurance";

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

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function main() {
  const marker = `verify-insurance-push-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyChildId = Math.floor(Date.now() % 2_000_000_000);
  const legacyUserId = legacyChildId + 40_000;
  const today = startOfToday();
  const expiryDate = addDays(today, 1);

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let user: IdRecord | null = null;
  let medicalForm: IdRecord | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Insurance Push Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "Insurance Push Branch",
        sourceDatabase: marker,
      },
      select: { id: true },
    });

    await db.legacySetting.createMany({
      data: Array.from({ length: 10 }, (_value, index) => ({
        sourceDatabase: marker,
        legacyTable: "t_notification_setting",
        legacyId: index + 1,
        settingKey: `notification-${index + 1}`,
        settingValue: "1",
        legacyData: { alarms: 1 },
      })),
    });
    await db.settings.createMany({
      data: [
        {
          branchId: branch.id,
          key: "alarm.insurance.enabled",
          value: "true",
        },
        {
          branchId: branch.id,
          key: "alarm.insurance.threshold",
          value: "2",
        },
      ],
    });

    child = await db.child.create({
      data: {
        sourceDatabase: marker,
        firstName: "Insurance",
        lastName: "Push",
        branchId: branch.id,
        legacyId: legacyChildId,
        isActive: true,
        isDraft: false,
        lunchIncluded: true,
      },
      select: { id: true, legacyId: true },
    });

    medicalForm = await db.medicalForm.create({
      data: {
        childId: child.id,
        sourceDatabase: marker,
        legacyTable: "t_form_1",
        legacyId: legacyChildId + 100,
        legacyChildId,
        formType: "GENERAL",
        status: "SUBMITTED",
        data: {
          hasInsurance: true,
          insuranceExpiry: dateKey(expiryDate),
          insuranceType: "Legacy insurance",
        },
      },
      select: { id: true },
    });

    user = await db.user.create({
      data: {
        email: `${marker}-staff@example.test`,
        name: "Insurance Push Staff",
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
        legacyKey: `${marker}:login_users:${legacyUserId}`,
        legacyId: legacyUserId,
        legacyUserId,
        recordType: "user",
        userId: user.id,
        email: `${marker}-staff@example.test`,
        isDisabled: false,
        legacyData: { uclasses: "0" },
      },
    });

    await db.pushToken.create({
      data: {
        userId: user.id,
        token: `${marker}-ios-token`,
        platform: "IOS",
        isActive: true,
        legacyTable: "notifications_tokens",
      },
    });

    const firstRun = await generateInsuranceAlarmsForOrganization({
      organizationId: organization.id,
      now: today,
    });
    assert.equal(firstRun.formsScanned, 1);
    assert.equal(firstRun.formsMatched, 1);
    assert.equal(firstRun.alarmsCreated, 1);
    assert.equal(firstRun.receiptsCreated, 1);
    assert.equal(firstRun.notificationsCreated, 1);

    const alarm = await db.alarm.findFirst({
      where: {
        type: "INSURANCE",
        referenceId: child.id,
        referenceType: "Child",
      },
      select: { id: true, legacyData: true },
    });
    assert.ok(alarm, "insurance generation should create an alarm");
    const alarmLegacy = asRecord(alarm.legacyData);
    const legacyNotificationId = Number(alarmLegacy.aid);
    assert.ok(Number.isFinite(legacyNotificationId));
    assert.equal(alarmLegacy.insuranceExpiryDate, dateKey(expiryDate));

    const receipt = await db.notificationReceipt.findFirst({
      where: {
        sourceTable: INSURANCE_RECEIPT_SOURCE,
        legacyNotificationId,
        legacyRecipientId: legacyUserId,
        recipientType: "USER",
      },
      select: { recipientId: true, isRead: true, alarmId: true },
    });
    assert.ok(receipt, "insurance generation should create a staff receipt");
    assert.equal(receipt.recipientId, user.id);
    assert.equal(receipt.isRead, false);
    assert.equal(receipt.alarmId, alarm.id);

    const pushDelivery = asRecord(alarmLegacy.pushDelivery);
    assert.equal(pushDelivery.provider, "disabled");
    assert.equal(pushDelivery.configured, false);
    assert.equal(pushDelivery.attemptedCount, 0);
    assert.equal(pushDelivery.skippedCount, 1);

    const secondRun = await generateInsuranceAlarmsForOrganization({
      organizationId: organization.id,
      now: today,
    });
    assert.equal(secondRun.alarmsCreated, 0);
    assert.equal(secondRun.receiptsCreated, 0);
    assert.equal(secondRun.skippedExisting, 1);

    console.log("insurance push delivery assertions passed");
  } finally {
    if (child) {
      await db.notificationReceipt.deleteMany({
        where: {
          OR: [
            {
              alarm: {
                referenceId: child.id,
                referenceType: "Child",
                type: "INSURANCE",
              },
            },
            { recipientId: child.id },
          ],
        },
      });
      await db.alarm.deleteMany({
        where: {
          referenceId: child.id,
          referenceType: "Child",
          type: "INSURANCE",
        },
      });
    }
    if (medicalForm) {
      await db.medicalForm.deleteMany({ where: { id: medicalForm.id } });
    }
    if (user) {
      await db.pushToken.deleteMany({ where: { userId: user.id } });
      await db.notification.deleteMany({ where: { userId: user.id } });
      await db.legacyAuthRecord.deleteMany({ where: { userId: user.id } });
      await db.user.deleteMany({ where: { id: user.id } });
    }
    if (child) await db.child.deleteMany({ where: { id: child.id } });
    if (branch) await db.branch.deleteMany({ where: { id: branch.id } });
    await db.legacySetting.deleteMany({ where: { sourceDatabase: marker } });
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
