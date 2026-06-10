import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { generateContractAlarmsForOrganization } from "@/lib/jobs/contract-alarms";

type IdRecord = { id: string };

const CONTRACT_RECEIPT_SOURCE = "custom_notifications_contracts";

function utcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
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
  const marker = `verify-contract-push-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyBranchId = Math.floor(Date.now() % 1_000_000_000) + 4_000_000;
  const legacyTeacherId = legacyBranchId + 10_000;
  const legacyAttachmentId = legacyBranchId + 20_000;
  const legacyUserId = legacyBranchId + 30_000;
  const now = new Date();
  const today = utcDate(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDate = addDays(today, 3);
  const expiryKey = dateKey(expiryDate);

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let user: IdRecord | null = null;
  let teacher: IdRecord | null = null;
  let attachment: IdRecord | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Contract Push Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "Contract Push Branch",
        legacyKey: `${marker}:t_branch:${legacyBranchId}`,
        legacyId: legacyBranchId,
        legacyTable: "t_branch",
        sourceDatabase: marker,
      },
      select: { id: true },
    });

    await db.settings.createMany({
      data: [
        {
          branchId: branch.id,
          key: "alarm.contract.enabled",
          value: "true",
        },
        {
          branchId: branch.id,
          key: "alarm.contract.threshold",
          value: "7",
        },
      ],
    });

    user = await db.user.create({
      data: {
        email: `${marker}-staff@example.test`,
        name: "Contract Push Staff",
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
        legacyKey: `${marker}:login_users:${legacyUserId}`,
        legacyId: legacyUserId,
        legacyUserId,
        recordType: "login_user",
        userId: user.id,
        username: `${marker}-staff`,
        email: `${marker}-staff@example.test`,
        isDisabled: false,
        legacyData: {
          usites: String(legacyBranchId),
          uclasses: "0",
        },
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

    teacher = await db.teacher.create({
      data: {
        sourceDatabase: marker,
        legacyKey: `${marker}:t_teacher:${legacyTeacherId}`,
        legacyId: legacyTeacherId,
        legacyTable: "t_teacher",
        userId: user.id,
        firstName: "Contract",
        lastName: "Teacher",
        branchId: branch.id,
        isActive: true,
      },
      select: { id: true },
    });

    attachment = await db.teacherAttachment.create({
      data: {
        teacherId: teacher.id,
        sourceDatabase: marker,
        legacyKey: `${marker}:t_teacher_attachments:${legacyAttachmentId}`,
        legacyId: legacyAttachmentId,
        legacyTable: "t_teacher_attachments",
        legacyTeacherId,
        filename: "contract.pdf",
        fileUrl: "https://example.test/contract.pdf",
        type: "contract",
        expiryDate,
      },
      select: { id: true },
    });

    const firstRun = await generateContractAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
      now: today,
    });
    assert.equal(firstRun.documentsMatched, 1);
    assert.equal(firstRun.alarmsCreated, 1);
    assert.equal(firstRun.receiptsCreated, 1);
    assert.equal(firstRun.notificationsCreated, 1);

    const alarm = await db.alarm.findFirst({
      where: {
        type: "CONTRACT",
        referenceId: teacher.id,
        referenceType: "Teacher",
        branchId: branch.id,
      },
      select: { id: true, message: true, legacyData: true },
    });
    assert.ok(alarm, "contract generation should create an alarm");
    assert.equal(
      alarm.message,
      `"contract" Document For Contract Teacher Will Expire On ${expiryKey} (3 Day(s))`,
    );
    const alarmLegacy = asRecord(alarm.legacyData);
    const legacyNotificationId = Number(alarmLegacy.aid);
    assert.ok(Number.isFinite(legacyNotificationId));
    assert.equal(alarmLegacy.sourceDeliveryTable, CONTRACT_RECEIPT_SOURCE);
    assert.equal(alarmLegacy.legacyRecipientRule, "getUserAndBoss");

    const receipt = await db.notificationReceipt.findFirst({
      where: {
        sourceTable: CONTRACT_RECEIPT_SOURCE,
        legacyNotificationId,
        legacyRecipientId: legacyUserId,
        recipientType: "USER",
      },
      select: { recipientId: true, isRead: true, alarmId: true },
    });
    assert.ok(receipt, "contract generation should create a staff receipt");
    assert.equal(receipt.recipientId, user.id);
    assert.equal(receipt.isRead, false);
    assert.equal(receipt.alarmId, alarm.id);

    const pushDelivery = asRecord(alarmLegacy.pushDelivery);
    assert.equal(pushDelivery.provider, "disabled");
    assert.equal(pushDelivery.configured, false);
    assert.equal(pushDelivery.attemptedCount, 0);
    assert.equal(pushDelivery.skippedCount, 1);

    const secondRun = await generateContractAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
      now: today,
    });
    assert.equal(secondRun.alarmsCreated, 0);
    assert.equal(secondRun.receiptsCreated, 0);
    assert.equal(secondRun.skippedExisting, 1);

    console.log("contract push delivery assertions passed");
  } finally {
    if (teacher) {
      await db.notificationReceipt.deleteMany({
        where: {
          alarm: {
            type: "CONTRACT",
            referenceId: teacher.id,
            referenceType: "Teacher",
          },
        },
      });
      await db.alarm.deleteMany({
        where: {
          type: "CONTRACT",
          referenceId: teacher.id,
          referenceType: "Teacher",
        },
      });
    }
    if (attachment) {
      await db.teacherAttachment.deleteMany({ where: { id: attachment.id } });
    }
    if (teacher) await db.teacher.deleteMany({ where: { id: teacher.id } });
    if (user) {
      await db.pushToken.deleteMany({ where: { userId: user.id } });
      await db.notification.deleteMany({ where: { userId: user.id } });
      await db.legacyAuthRecord.deleteMany({ where: { userId: user.id } });
      await db.user.deleteMany({ where: { id: user.id } });
    }
    if (branch) {
      await db.settings.deleteMany({ where: { branchId: branch.id } });
      await db.branch.deleteMany({ where: { id: branch.id } });
    }
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
