import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { generateEventAlarmsForOrganization } from "@/lib/jobs/event-alarms";

type IdRecord = { id: string };

const EVENT_RECEIPT_SOURCE = "custom_notifications_events";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

async function main() {
  const marker = `verify-event-staff-push-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const sourceDatabase = `${marker}-db`;
  const legacyStaffId = Math.floor(Date.now() % 2_000_000_000);
  const now = new Date();
  const eventDate = addDays(now, 1);
  const eventTitle = `Staff event delivery ${marker}`;
  const eventBody = `Staff event body ${marker}`;

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let staffUser: IdRecord | null = null;
  let event: IdRecord | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Event Staff Push Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        sourceDatabase,
        name: "Event Staff Push Branch",
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

    staffUser = await db.user.create({
      data: {
        email: `${marker}-teacher@example.test`,
        name: "Event Staff Push Teacher",
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
        legacyData: { uclasses: "0" },
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

    event = await db.event.create({
      data: {
        organizationId: organization.id,
        branchId: branch.id,
        sourceDatabase,
        title: eventTitle,
        description: eventBody,
        customSubject: eventTitle,
        customBody: eventBody,
        date: eventDate,
        notificationDaysBefore: [1],
        isActive: true,
      },
      select: { id: true },
    });

    const firstRun = await generateEventAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
      now,
    });
    assert.equal(firstRun.eventsMatched, 1);
    assert.equal(firstRun.alarmsCreated, 1);
    assert.equal(firstRun.receiptsCreated, 1);
    assert.equal(firstRun.notificationsCreated, 1);

    const generatedEvent = await db.event.findUnique({
      where: { id: event.id },
      select: { legacyId: true },
    });
    assert.ok(generatedEvent?.legacyId, "event generation should assign a legacy id");

    const receipt = await db.notificationReceipt.findFirst({
      where: {
        sourceTable: EVENT_RECEIPT_SOURCE,
        legacyNotificationId: generatedEvent.legacyId,
        legacyRecipientId: legacyStaffId,
        recipientType: "USER",
      },
      select: {
        recipientId: true,
        isRead: true,
        alarmId: true,
      },
    });
    assert.ok(receipt, "generated staff event receipt should be persisted");
    assert.equal(receipt.recipientId, staffUser.id);
    assert.equal(receipt.isRead, false);

    const alarm = await db.alarm.findFirst({
      where: {
        referenceId: event.id,
        referenceType: "Event",
      },
      select: { id: true, legacyData: true },
    });
    assert.ok(alarm, "event generation should create an alarm");
    assert.equal(receipt.alarmId, alarm.id);
    const alarmLegacy = asRecord(alarm.legacyData);
    assert.equal(alarmLegacy.sourceDeliveryTable, EVENT_RECEIPT_SOURCE);
    const pushDelivery = asRecord(alarmLegacy.pushDelivery);
    assert.equal(pushDelivery.provider, "disabled");
    assert.equal(pushDelivery.configured, false);
    assert.equal(pushDelivery.attemptedCount, 0);
    assert.equal(pushDelivery.skippedCount, 1);

    const secondRun = await generateEventAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
      now,
    });
    assert.equal(secondRun.eventsMatched, 1);
    assert.equal(secondRun.alarmsCreated, 0);
    assert.equal(secondRun.receiptsCreated, 0);
    assert.equal(secondRun.skippedExisting, 1);

    console.log("event staff push delivery assertions passed");
  } finally {
    if (event) {
      await db.notificationReceipt.deleteMany({
        where: {
          OR: [
            { metadata: { path: ["modernTargetId"], equals: event.id } },
            { alarm: { referenceId: event.id, referenceType: "Event" } },
          ],
        },
      });
      await db.notification.deleteMany({
        where: { title: eventTitle },
      });
      await db.alarm.deleteMany({
        where: { referenceId: event.id, referenceType: "Event" },
      });
      await db.event.deleteMany({ where: { id: event.id } });
    }
    if (staffUser) {
      await db.pushToken.deleteMany({ where: { userId: staffUser.id } });
      await db.notification.deleteMany({ where: { userId: staffUser.id } });
      await db.legacyAuthRecord.deleteMany({ where: { userId: staffUser.id } });
      await db.user.deleteMany({ where: { id: staffUser.id } });
    }
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
