import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { generatePaymentAlarmsForOrganization } from "@/lib/jobs/payment-alarms";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null };

const PAYMENT_RECEIPT_SOURCE = "custom_notifications_payments";

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
  const marker = `verify-payment-parent-push-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyChildId = Math.floor(Date.now() % 2_000_000_000);
  const legacyParentId = legacyChildId + 12_345;
  const today = startOfToday();
  const dueDate = addDays(today, 1);

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let parentUser: IdRecord | null = null;
  let reminder: IdRecord | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Payment Parent Push Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "Payment Parent Push Branch",
      },
      select: { id: true },
    });

    child = await db.child.create({
      data: {
        firstName: "Payment",
        lastName: "Push",
        branchId: branch.id,
        legacyId: legacyChildId,
        isActive: true,
        isDraft: false,
        lunchIncluded: true,
      },
      select: { id: true, legacyId: true },
    });

    parentUser = await db.parentUser.create({
      data: {
        username: `${marker}-parent@example.test`,
        passwordHash: "not-used-by-payment-push-verifier",
        childId: child.id,
        legacyId: legacyParentId,
        legacyChildId: child.legacyId,
        isActive: true,
      },
      select: { id: true },
    });

    await db.pushToken.create({
      data: {
        parentUserId: parentUser.id,
        token: `${marker}-ios-token`,
        platform: "IOS",
        isActive: true,
        legacyTable: "notifications_tokens",
        legacyChildId,
      },
    });

    reminder = await db.paymentReminder.create({
      data: {
        childId: child.id,
        legacyChildId,
        legacyId: legacyChildId + 50_000,
        amount: "150.00",
        currency: "USD",
        dueDate,
        category: "MONTHLY",
        sent: false,
      },
      select: { id: true },
    });

    const firstRun = await generatePaymentAlarmsForOrganization({
      organizationId: organization.id,
      now: today,
    });
    assert.equal(firstRun.reminderGroupsMatched, 1);
    assert.equal(firstRun.remindersMatched, 1);
    assert.equal(firstRun.paidAlarmsCreated, 1);
    assert.equal(firstRun.receiptsCreated, 1);
    assert.equal(firstRun.parentRecipientsMatched, 1);

    const alarm = await db.alarm.findFirst({
      where: {
        type: "PAYMENT",
        referenceId: child.id,
        referenceType: "Child",
      },
      select: { id: true, legacyData: true },
    });
    assert.ok(alarm, "payment generation should create an alarm");
    const alarmLegacy = asRecord(alarm.legacyData);
    const legacyNotificationId = Number(alarmLegacy.aid);
    assert.ok(Number.isFinite(legacyNotificationId));

    const receipt = await db.notificationReceipt.findFirst({
      where: {
        sourceTable: PAYMENT_RECEIPT_SOURCE,
        legacyNotificationId,
        legacyRecipientId: legacyParentId,
        recipientType: "PARENT_USER",
      },
      select: { recipientId: true, isRead: true, alarmId: true },
    });
    assert.ok(receipt, "payment generation should create a parent receipt");
    assert.equal(receipt.recipientId, parentUser.id);
    assert.equal(receipt.isRead, false);
    assert.equal(receipt.alarmId, alarm.id);

    const parentPushDelivery = asRecord(alarmLegacy.parentPushDelivery);
    assert.equal(parentPushDelivery.provider, "disabled");
    assert.equal(parentPushDelivery.configured, false);
    assert.equal(parentPushDelivery.attemptedCount, 0);
    assert.equal(parentPushDelivery.skippedCount, 1);

    const secondRun = await generatePaymentAlarmsForOrganization({
      organizationId: organization.id,
      now: today,
    });
    assert.equal(secondRun.paidAlarmsCreated, 0);
    assert.equal(secondRun.receiptsCreated, 0);
    assert.equal(secondRun.skippedExisting, 1);

    console.log("payment parent push delivery assertions passed");
  } finally {
    if (reminder) {
      await db.paymentReminder.deleteMany({ where: { id: reminder.id } });
    }
    if (child) {
      await db.notificationReceipt.deleteMany({
        where: {
          OR: [
            { alarm: { referenceId: child.id, referenceType: "Child", type: "PAYMENT" } },
            { recipientId: child.id },
          ],
        },
      });
      await db.alarm.deleteMany({
        where: { referenceId: child.id, referenceType: "Child", type: "PAYMENT" },
      });
    }
    if (parentUser) {
      await db.pushToken.deleteMany({ where: { parentUserId: parentUser.id } });
      await db.parentUser.deleteMany({ where: { id: parentUser.id } });
    }
    if (child) await db.child.deleteMany({ where: { id: child.id } });
    if (branch) await db.branch.deleteMany({ where: { id: branch.id } });
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
