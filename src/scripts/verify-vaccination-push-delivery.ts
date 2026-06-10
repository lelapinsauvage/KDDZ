import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import {
  generateVaccinationAlarmsForOrganization,
  getVaccinationDueAlarmCandidates,
} from "@/lib/jobs/vaccination-alarms";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null };

const VACCINATION_RECEIPT_SOURCE = "custom_notifications_vaccinations";

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
  const marker = `verify-vaccination-push-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyChildId = Math.floor(Date.now() % 2_000_000_000);
  const legacyUserId = legacyChildId + 20_000;
  const today = startOfToday();
  const childDob = addDays(today, -58);

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let user: IdRecord | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Vaccination Push Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "Vaccination Push Branch",
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
          key: "alarm.vaccination.enabled",
          value: "true",
        },
        {
          branchId: branch.id,
          key: "alarm.vaccination.threshold",
          value: "2",
        },
      ],
    });

    child = await db.child.create({
      data: {
        sourceDatabase: marker,
        firstName: "Vaccination",
        lastName: "Push",
        branchId: branch.id,
        legacyId: legacyChildId,
        dateOfBirth: childDob,
        isActive: true,
        isDraft: false,
        lunchIncluded: true,
      },
      select: { id: true, legacyId: true },
    });

    user = await db.user.create({
      data: {
        email: `${marker}-staff@example.test`,
        name: "Vaccination Push Staff",
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

    const candidates = await getVaccinationDueAlarmCandidates({
      organizationId: organization.id,
      now: today,
    });
    if (candidates.length !== 2) {
      const persistedChild = await db.child.findUnique({
        where: { id: child.id },
        select: { dateOfBirth: true, isActive: true, isDraft: true, branchId: true },
      });
      const settings = await db.settings.findMany({
        where: { branchId: branch.id },
        select: { key: true, value: true },
      });
      assert.fail(
        `expected two candidates, got ${candidates.length}; child=${JSON.stringify(
          persistedChild,
        )}; settings=${JSON.stringify(settings)}`,
      );
    }
    assert.ok(candidates.some((candidate) => candidate.vaccineName === "IPV"));

    const firstRun = await generateVaccinationAlarmsForOrganization({
      organizationId: organization.id,
      now: today,
    });
    assert.equal(firstRun.remindersMatched, 2);
    assert.equal(firstRun.alarmsCreated, 2);
    assert.equal(firstRun.receiptsCreated, 2);
    assert.equal(firstRun.notificationsCreated, 2);

    const alarms = await db.alarm.findMany({
      where: {
        type: "VACCINATION",
        referenceId: child.id,
        referenceType: "Child",
      },
      select: { id: true, legacyData: true },
    });
    const alarm = alarms.find(
      (row) => asRecord(row.legacyData).vaccineName === "IPV",
    );
    assert.ok(alarm, "vaccination generation should create an alarm");
    const alarmLegacy = asRecord(alarm.legacyData);
    const legacyNotificationId = Number(alarmLegacy.aid);
    assert.ok(Number.isFinite(legacyNotificationId));
    assert.equal(alarmLegacy.vaccineName, "IPV");
    assert.equal(alarmLegacy.level, 0);

    const receipt = await db.notificationReceipt.findFirst({
      where: {
        sourceTable: VACCINATION_RECEIPT_SOURCE,
        legacyNotificationId,
        legacyRecipientId: legacyUserId,
        recipientType: "USER",
      },
      select: { recipientId: true, isRead: true, alarmId: true },
    });
    assert.ok(receipt, "vaccination generation should create a staff receipt");
    assert.equal(receipt.recipientId, user.id);
    assert.equal(receipt.isRead, false);
    assert.equal(receipt.alarmId, alarm.id);

    const pushDelivery = asRecord(alarmLegacy.pushDelivery);
    assert.equal(pushDelivery.provider, "disabled");
    assert.equal(pushDelivery.configured, false);
    assert.equal(pushDelivery.attemptedCount, 0);
    assert.equal(pushDelivery.skippedCount, 1);

    const secondRun = await generateVaccinationAlarmsForOrganization({
      organizationId: organization.id,
      now: today,
    });
    assert.equal(secondRun.alarmsCreated, 0);
    assert.equal(secondRun.receiptsCreated, 0);
    assert.equal(secondRun.skippedExisting, 2);

    console.log("vaccination push delivery assertions passed");
  } finally {
    if (child) {
      await db.notificationReceipt.deleteMany({
        where: {
          OR: [
            {
              alarm: {
                referenceId: child.id,
                referenceType: "Child",
                type: "VACCINATION",
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
          type: "VACCINATION",
        },
      });
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
