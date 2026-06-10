import "dotenv/config";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET as medicalForm1Get } from "@/app/(app)/Medical_form1.php/route";
import { db } from "@/lib/db";
import { generateMedicalAlarmsForOrganization } from "@/lib/jobs/medical-alarms";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null };

const MEDICAL_RECEIPT_SOURCE = "custom_notifications_medical";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

async function main() {
  const marker = `verify-medical-push-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyBranchId = Math.floor(Date.now() % 1_000_000_000) + 5_000_000;
  const legacyClassId = legacyBranchId + 10_000;
  const legacyChildId = legacyBranchId + 20_000;
  const legacyUserId = legacyBranchId + 30_000;
  const today = startOfToday();

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let classroom: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let user: IdRecord | null = null;
  let conditionForm: IdRecord | null = null;
  let vaccinationForm: IdRecord | null = null;
  const previousVerifyUserId = process.env.GARDERIE_VERIFY_USER_ID;

  try {
    organization = await db.organization.create({
      data: {
        name: "Medical Push Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "Medical Push Branch",
        legacyKey: `${marker}:t_branch:${legacyBranchId}`,
        legacyId: legacyBranchId,
        legacyTable: "t_branch",
        sourceDatabase: marker,
      },
      select: { id: true },
    });

    classroom = await db.class.create({
      data: {
        branchId: branch.id,
        name: "Medical Push Class",
        sourceDatabase: marker,
        legacyKey: `${marker}:t_class:${legacyClassId}`,
        legacyId: legacyClassId,
        legacyTable: "t_class",
        isActive: true,
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
    await db.settings.create({
      data: {
        branchId: branch.id,
        key: "alarm.medical.enabled",
        value: "true",
      },
    });

    child = await db.child.create({
      data: {
        sourceDatabase: marker,
        legacyKey: `${marker}:t_child:${legacyChildId}`,
        legacyId: legacyChildId,
        legacyTable: "t_child",
        firstName: "Medical",
        lastName: "Push",
        branchId: branch.id,
        classId: classroom.id,
        isActive: true,
        isDraft: false,
        lunchIncluded: true,
      },
      select: { id: true, legacyId: true },
    });

    conditionForm = await db.medicalForm.create({
      data: {
        childId: child.id,
        sourceDatabase: marker,
        legacyTable: "t_form_2",
        legacyId: legacyChildId + 100,
        legacyChildId,
        legacyBranchId,
        legacyClassId,
        formType: "CONDITIONS",
        status: "SUBMITTED",
        data: { verifier: marker },
      },
      select: { id: true },
    });
    vaccinationForm = await db.medicalForm.create({
      data: {
        childId: child.id,
        sourceDatabase: marker,
        legacyTable: "t_form_4",
        legacyId: legacyChildId + 200,
        legacyChildId,
        legacyBranchId,
        legacyClassId,
        formType: "VACCINATIONS",
        status: "SUBMITTED",
        data: { verifier: marker },
      },
      select: { id: true },
    });

    user = await db.user.create({
      data: {
        email: `${marker}-staff@example.test`,
        name: "Medical Push Staff",
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
        legacyData: { uclasses: String(legacyClassId) },
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

    const firstRun = await generateMedicalAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
      now: today,
    });
    assert.equal(firstRun.reportsMatched, 1);
    assert.equal(firstRun.alarmsCreated, 1);
    assert.equal(firstRun.receiptsCreated, 1);
    assert.equal(firstRun.notificationsCreated, 1);

    const alarm = await db.alarm.findFirst({
      where: {
        type: "MEDICAL",
        referenceId: child.id,
        referenceType: "Child",
        branchId: branch.id,
      },
      select: { id: true, message: true, legacyData: true },
    });
    assert.ok(alarm, "medical generation should create an alarm");
    assert.match(alarm.message ?? "", /General Form/);
    const alarmLegacy = asRecord(alarm.legacyData);
    const legacyNotificationId = Number(alarmLegacy.aid);
    assert.ok(Number.isFinite(legacyNotificationId));
    assert.equal(alarmLegacy.sourceDeliveryTable, MEDICAL_RECEIPT_SOURCE);
    assert.equal(alarmLegacy.legacyChildId, legacyChildId);
    assert.equal(alarmLegacy.legacyClassId, legacyClassId);
    assert.equal(alarmLegacy.type, "t_form_1");
    assert.equal(alarmLegacy.reportName, "General Form");
    const href = String(alarmLegacy.href);
    assert.match(href, /^Medical_form1\.php\?id=/);

    process.env.GARDERIE_VERIFY_USER_ID = user.id;
    const bridgeResponse = await medicalForm1Get(
      new NextRequest(`http://localhost/${href}`),
    );
    assert.equal(bridgeResponse.status, 307);
    const location = bridgeResponse.headers.get("location");
    assert.ok(location, "Medical_form1.php bridge should redirect");
    const target = new URL(location);
    assert.equal(target.pathname, "/medical/general/new");
    assert.equal(target.searchParams.get("childId"), child.id);

    const receipt = await db.notificationReceipt.findFirst({
      where: {
        sourceTable: MEDICAL_RECEIPT_SOURCE,
        legacyNotificationId,
        legacyRecipientId: legacyUserId,
        recipientType: "USER",
      },
      select: { recipientId: true, isRead: true, alarmId: true },
    });
    assert.ok(receipt, "medical generation should create a staff receipt");
    assert.equal(receipt.recipientId, user.id);
    assert.equal(receipt.isRead, false);
    assert.equal(receipt.alarmId, alarm.id);

    const pushDelivery = asRecord(alarmLegacy.pushDelivery);
    assert.equal(pushDelivery.provider, "disabled");
    assert.equal(pushDelivery.configured, false);
    assert.equal(pushDelivery.attemptedCount, 0);
    assert.equal(pushDelivery.skippedCount, 1);

    const secondRun = await generateMedicalAlarmsForOrganization({
      organizationId: organization.id,
      branchId: branch.id,
      now: today,
    });
    assert.equal(secondRun.alarmsCreated, 0);
    assert.equal(secondRun.receiptsCreated, 0);
    assert.equal(secondRun.skippedExisting, 1);

    console.log("medical push delivery assertions passed");
  } finally {
    if (previousVerifyUserId === undefined) {
      delete process.env.GARDERIE_VERIFY_USER_ID;
    } else {
      process.env.GARDERIE_VERIFY_USER_ID = previousVerifyUserId;
    }
    if (child) {
      await db.notificationReceipt.deleteMany({
        where: {
          alarm: {
            referenceId: child.id,
            referenceType: "Child",
            type: "MEDICAL",
          },
        },
      });
      await db.alarm.deleteMany({
        where: {
          referenceId: child.id,
          referenceType: "Child",
          type: "MEDICAL",
        },
      });
    }
    if (user) {
      await db.pushToken.deleteMany({ where: { userId: user.id } });
      await db.notification.deleteMany({ where: { userId: user.id } });
      await db.legacyAuthRecord.deleteMany({ where: { userId: user.id } });
      await db.user.deleteMany({ where: { id: user.id } });
    }
    if (conditionForm) await db.medicalForm.deleteMany({ where: { id: conditionForm.id } });
    if (vaccinationForm) {
      await db.medicalForm.deleteMany({ where: { id: vaccinationForm.id } });
    }
    if (child) await db.child.deleteMany({ where: { id: child.id } });
    if (classroom) await db.class.deleteMany({ where: { id: classroom.id } });
    if (branch) {
      await db.settings.deleteMany({ where: { branchId: branch.id } });
      await db.branch.deleteMany({ where: { id: branch.id } });
    }
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
