import "dotenv/config";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { generateContractAlarmsForOrganization } from "@/lib/jobs/contract-alarms";

type IdRecord = { id: string };
type AttachmentRecord = { id: string; expiryDate: Date | null };

function utcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function main() {
  const marker = `verify-contract-alarms-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyBranchId = Math.floor(Date.now() % 1_000_000_000) + 3_000_000;
  const legacyTeacherId = legacyBranchId + 100;
  const legacyAttachmentId = legacyBranchId + 200;
  const directLegacyUserId = legacyBranchId + 300;
  const branchLegacyUserId = legacyBranchId + 400;
  const adminLegacyUserId = legacyBranchId + 500;
  const classScopedLegacyUserId = legacyBranchId + 600;
  const now = new Date();
  const today = utcDate(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryDate = addDays(today, 3);
  let expiryKey = dateKey(expiryDate);

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let directUser: IdRecord | null = null;
  let branchUser: IdRecord | null = null;
  let adminUser: IdRecord | null = null;
  let classScopedUser: IdRecord | null = null;
  let teacher: IdRecord | null = null;
  let attachment: AttachmentRecord | null = null;
  let alarmId: string | null = null;
  let legacyNotificationId: number | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Contract Alarm Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "Contract Alarm Branch",
        sourceDatabase: marker,
        legacyKey: `${marker}:t_branch:${legacyBranchId}`,
        legacyId: legacyBranchId,
        legacyTable: "t_branch",
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

    directUser = await db.user.create({
      data: {
        email: `${marker}-direct@example.test`,
        name: "Direct Teacher User",
        role: "TEACHER",
        organizationId: organization.id,
        branchId: branch.id,
        isActive: true,
      },
      select: { id: true },
    });

    branchUser = await db.user.create({
      data: {
        email: `${marker}-branch@example.test`,
        name: "Branch Contract User",
        role: "TEACHER",
        organizationId: organization.id,
        branchId: branch.id,
        isActive: true,
      },
      select: { id: true },
    });

    adminUser = await db.user.create({
      data: {
        email: `${marker}-admin@example.test`,
        name: "Global Admin Contract User",
        role: "ADMIN",
        organizationId: organization.id,
        isActive: true,
      },
      select: { id: true },
    });

    classScopedUser = await db.user.create({
      data: {
        email: `${marker}-class@example.test`,
        name: "Class Scoped Contract User",
        role: "TEACHER",
        organizationId: organization.id,
        branchId: branch.id,
        isActive: true,
      },
      select: { id: true },
    });

    await db.legacyAuthRecord.createMany({
      data: [
        {
          sourceDatabase: marker,
          legacyTable: "login_users",
          legacyKey: `${marker}:login_users:${directLegacyUserId}`,
          legacyId: directLegacyUserId,
          legacyUserId: directLegacyUserId,
          recordType: "login_user",
          userId: directUser.id,
          username: `${marker}-direct`,
          email: `${marker}-direct@example.test`,
          legacyData: {
            usites: "999999",
            uclasses: "44",
          },
        },
        {
          sourceDatabase: marker,
          legacyTable: "login_users",
          legacyKey: `${marker}:login_users:${branchLegacyUserId}`,
          legacyId: branchLegacyUserId,
          legacyUserId: branchLegacyUserId,
          recordType: "login_user",
          userId: branchUser.id,
          username: `${marker}-branch`,
          email: `${marker}-branch@example.test`,
          legacyData: {
            usites: String(legacyBranchId),
            uclasses: "0",
          },
        },
        {
          sourceDatabase: marker,
          legacyTable: "login_users",
          legacyKey: `${marker}:login_users:${adminLegacyUserId}`,
          legacyId: adminLegacyUserId,
          legacyUserId: adminLegacyUserId,
          recordType: "login_user",
          userId: adminUser.id,
          username: `${marker}-admin`,
          email: `${marker}-admin@example.test`,
          legacyData: {
            usites: "0",
            uclasses: "0",
          },
        },
        {
          sourceDatabase: marker,
          legacyTable: "login_users",
          legacyKey: `${marker}:login_users:${classScopedLegacyUserId}`,
          legacyId: classScopedLegacyUserId,
          legacyUserId: classScopedLegacyUserId,
          recordType: "login_user",
          userId: classScopedUser.id,
          username: `${marker}-class`,
          email: `${marker}-class@example.test`,
          legacyData: {
            usites: String(legacyBranchId),
            uclasses: "12",
          },
        },
      ],
    });

    teacher = await db.teacher.create({
      data: {
        sourceDatabase: marker,
        legacyKey: `${marker}:t_teacher:${legacyTeacherId}`,
        legacyId: legacyTeacherId,
        legacyTable: "t_teacher",
        userId: directUser.id,
        firstName: "Tina",
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
      select: { id: true, expiryDate: true },
    });
    assert.ok(attachment.expiryDate);
    expiryKey = dateKey(attachment.expiryDate);

    const firstSummary = await generateContractAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
      now: today,
    });

    assert.equal(firstSummary.branchesScanned, 1);
    assert.equal(firstSummary.documentsScanned, 1);
    assert.equal(
      firstSummary.documentsMatched,
      1,
      JSON.stringify(firstSummary),
    );
    assert.equal(firstSummary.alarmsCreated, 1);
    assert.equal(firstSummary.receiptsCreated, 3);
    assert.equal(firstSummary.notificationsCreated, 3);
    assert.equal(firstSummary.skippedExisting, 0);
    assert.equal(firstSummary.skippedNoRecipients, 0);

    const alarm = await db.alarm.findFirstOrThrow({
      where: {
        type: "CONTRACT",
        referenceId: teacher.id,
        referenceType: "Teacher",
        branchId: branch.id,
      },
      select: {
        id: true,
        dueDate: true,
        message: true,
        legacyData: true,
      },
    });
    alarmId = alarm.id;
    const legacyData = asRecord(alarm.legacyData);
    legacyNotificationId = Number(legacyData.aid);

    assert.equal(
      alarm.message,
      `"contract" Document For Tina Teacher Will Expire On ${expiryKey} (3 Day(s))`,
    );
    assert.equal(dateKey(alarm.dueDate!), expiryKey);
    assert.equal(legacyData.sourceTable, "t_alarms_contracts");
    assert.equal(legacyData.sourceDeliveryTable, "custom_notifications_contracts");
    assert.equal(legacyData.sourceDocumentTable, "t_teacher_attachments");
    assert.equal(legacyData.sourceStaffTable, "t_teacher");
    assert.equal(legacyData.modernGenerator, "generateContractAlarms");
    assert.equal(legacyData.legacyMethod, "Data::AlarmsTeachersContracts");
    assert.equal(legacyData.legacyRecipientRule, "getUserAndBoss");
    assert.equal(legacyData.personId, teacher.id);
    assert.equal(legacyData.legacyPersonId, legacyTeacherId);
    assert.equal(legacyData.documentId, attachment.id);
    assert.equal(legacyData.legacyDocumentId, legacyAttachmentId);
    assert.equal(legacyData.type, "contract");
    assert.equal(legacyData.level, "t_teacher");
    assert.equal(legacyData.mid, 3);
    assert.equal(legacyData.indays, 3);
    assert.equal(legacyData.signedDaysUntilExpiry, 3);
    assert.equal(legacyData.expiryDate, expiryKey);
    assert.equal(legacyData.legacyBranchId, legacyBranchId);
    assert.equal(legacyData.href, "alarmsContracts.php");
    assert.equal(Number.isFinite(legacyNotificationId), true);

    const receipts = await db.notificationReceipt.findMany({
      where: {
        sourceTable: "custom_notifications_contracts",
        legacyNotificationId,
      },
      select: {
        recipientId: true,
        recipientType: true,
        legacyRecipientId: true,
        alarmId: true,
        isRead: true,
        metadata: true,
      },
      orderBy: { legacyRecipientId: "asc" },
    });
    assert.deepEqual(
      receipts.map((receipt) => receipt.legacyRecipientId),
      [directLegacyUserId, branchLegacyUserId, adminLegacyUserId].sort((a, b) => a - b),
    );
    assert.equal(
      receipts.some((receipt) => receipt.legacyRecipientId === classScopedLegacyUserId),
      false,
      "class-scoped login_users rows should not receive getUserAndBoss contract alarms",
    );

    for (const receipt of receipts) {
      assert.equal(receipt.recipientType, "USER");
      assert.equal(receipt.alarmId, alarm.id);
      assert.equal(receipt.isRead, false);
      const metadata = asRecord(receipt.metadata);
      assert.equal(metadata.modernGenerator, "generateContractAlarms");
      assert.equal(metadata.legacyMethod, "Data::AlarmsTeachersContracts");
      assert.equal(metadata.legacyRecipientRule, "getUserAndBoss");
      assert.equal(metadata.legacyBranchId, legacyBranchId);
      assert.equal(metadata.sourceStaffTable, "t_teacher");
      assert.equal(metadata.legacyPersonId, legacyTeacherId);
      assert.equal(metadata.documentId, attachment.id);
      assert.equal(metadata.legacyDocumentId, legacyAttachmentId);
      assert.equal(metadata.documentType, "contract");
      assert.equal(metadata.expiryDate, expiryKey);
    }

    const notificationCount = await db.notification.count({
      where: {
        userId: {
          in: [directUser.id, branchUser.id, adminUser.id],
        },
        type: "CONTRACT",
        category: "CONTRACT",
        body: alarm.message,
      },
    });
    assert.equal(notificationCount, 3);

    const secondSummary = await generateContractAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
      now: today,
    });

    assert.equal(secondSummary.documentsScanned, 1);
    assert.equal(secondSummary.documentsMatched, 1);
    assert.equal(secondSummary.alarmsCreated, 0);
    assert.equal(secondSummary.receiptsCreated, 0);
    assert.equal(secondSummary.notificationsCreated, 0);
    assert.equal(secondSummary.skippedExisting, 1);

    assert.equal(
      await db.alarm.count({
        where: {
          type: "CONTRACT",
          referenceId: teacher.id,
          referenceType: "Teacher",
        },
      }),
      1,
    );
    assert.equal(
      await db.notificationReceipt.count({
        where: {
          sourceTable: "custom_notifications_contracts",
          legacyNotificationId,
        },
      }),
      3,
    );

    console.log("contract alarm generation assertions passed");
  } finally {
    if (legacyNotificationId !== null) {
      await db.notificationReceipt.deleteMany({
        where: {
          sourceTable: "custom_notifications_contracts",
          legacyNotificationId,
        },
      });
    }
    if (alarmId) {
      await db.alarm.deleteMany({ where: { id: alarmId } });
    } else if (teacher) {
      await db.alarm.deleteMany({
        where: {
          type: "CONTRACT",
          referenceId: teacher.id,
          referenceType: "Teacher",
        },
      });
    }
    const userIds = [
      directUser?.id,
      branchUser?.id,
      adminUser?.id,
      classScopedUser?.id,
    ].filter((id): id is string => Boolean(id));
    if (userIds.length > 0) {
      await db.notification.deleteMany({ where: { userId: { in: userIds } } });
    }
    if (attachment) await db.teacherAttachment.deleteMany({ where: { id: attachment.id } });
    if (teacher) await db.teacher.deleteMany({ where: { id: teacher.id } });
    await db.legacyAuthRecord.deleteMany({ where: { sourceDatabase: marker } });
    if (branch) {
      await db.settings.deleteMany({ where: { branchId: branch.id } });
      await db.branch.deleteMany({ where: { id: branch.id } });
    }
    if (userIds.length > 0) {
      await db.user.deleteMany({ where: { id: { in: userIds } } });
    }
    if (organization) await db.organization.deleteMany({ where: { id: organization.id } });
    await db.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
