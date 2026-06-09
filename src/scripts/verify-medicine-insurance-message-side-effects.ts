import "dotenv/config";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as notificationsPost } from "@/app/ws/notifications_master.php/route";
import { db } from "@/lib/db";
import {
  createLegacyBulkMessageSideEffects,
  findLegacyMessageSideEffect,
  legacySideEffectHasTargets,
} from "@/lib/legacy-message-side-effects";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null; branchId: string; classId: string | null };
type ParentRecord = { id: string; legacyId: number | null; legacyChildId: number | null };

type Scenario = {
  nature: "Medicine" | "Insurance";
  family: "Medicine" | "Insurance";
  alarmType: "MEDICINE" | "INSURANCE";
  legacyMethod: "addToMedicine" | "addToInsurance";
  contentTable: "t_alarms_medicine" | "t_alarms_insurance";
  staffDeliveryTable: "custom_notifications_medicine" | "custom_notifications_insurance";
  parentDeliveryTable: "custom_notifications_medicine_parents" | "custom_notifications_insurance_parents";
  href: "alarmsMedicine.php" | "alarmsInsurance.php";
};

const SCENARIOS: Scenario[] = [
  {
    nature: "Medicine",
    family: "Medicine",
    alarmType: "MEDICINE",
    legacyMethod: "addToMedicine",
    contentTable: "t_alarms_medicine",
    staffDeliveryTable: "custom_notifications_medicine",
    parentDeliveryTable: "custom_notifications_medicine_parents",
    href: "alarmsMedicine.php",
  },
  {
    nature: "Insurance",
    family: "Insurance",
    alarmType: "INSURANCE",
    legacyMethod: "addToInsurance",
    contentTable: "t_alarms_insurance",
    staffDeliveryTable: "custom_notifications_insurance",
    parentDeliveryTable: "custom_notifications_insurance_parents",
    href: "alarmsInsurance.php",
  },
];

async function main() {
  for (const scenario of SCENARIOS) {
    await verifyScenario(scenario);
  }

  console.log("medicine and insurance message side-effect assertions passed");
}

async function verifyScenario(scenario: Scenario) {
  const marker = `verify-${scenario.nature.toLowerCase()}-side-effect-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyChildId = Math.floor(Date.now() % 2_000_000_000) + (
    scenario.nature === "Insurance" ? 200_000 : 0
  );
  const legacyTeacherId = legacyChildId + 10_000;
  const subject = `${scenario.nature} subject ${marker}`;
  const body = `${scenario.nature} body ${marker}`;

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let sender: IdRecord | null = null;
  let teacher: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let parentUser: ParentRecord | null = null;
  let thread: IdRecord | null = null;

  try {
    const config = findLegacyMessageSideEffect(scenario.nature);
    assert.ok(config, `${scenario.nature} nature should map to a legacy side-effect config`);
    assert.equal(config.family, scenario.family);
    assert.equal(config.alarmType, scenario.alarmType);
    assert.equal(config.legacyMethod, scenario.legacyMethod);
    assert.equal(config.contentTable, scenario.contentTable);
    assert.equal(config.parentDeliveryTable, scenario.parentDeliveryTable);
    assert.equal(config.staffDeliveryTable, scenario.staffDeliveryTable);
    assert.equal(config.href, scenario.href);
    assert.equal(config.parentDeliveryMode, undefined);
    assert.equal(config.parentStandaloneReceipt, undefined);
    assert.equal(legacySideEffectHasTargets(config, 1, 0), true);
    assert.equal(legacySideEffectHasTargets(config, 0, 1), true);

    organization = await db.organization.create({
      data: {
        name: `${scenario.nature} Side Effect Verification`,
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: `${scenario.nature} Side Effect Branch`,
      },
      select: { id: true },
    });

    sender = await db.user.create({
      data: {
        email: `${marker}-sender@example.test`,
        name: `${scenario.nature} Sender`,
        role: "ADMIN",
        organizationId: organization.id,
        isActive: true,
      },
      select: { id: true },
    });

    teacher = await db.user.create({
      data: {
        email: `${marker}-teacher@example.test`,
        name: `${scenario.nature} Teacher`,
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
        firstName: scenario.nature,
        lastName: "Child",
        branchId: branch.id,
        legacyId: legacyChildId,
      },
      select: { id: true, legacyId: true, branchId: true, classId: true },
    });

    parentUser = await db.parentUser.create({
      data: {
        username: `${marker}-parent@example.test`,
        passwordHash: `not-used-by-${scenario.nature.toLowerCase()}-verifier`,
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
        nature: scenario.nature,
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

    assert.ok(summary, `${scenario.nature} side-effect generation should return a summary`);
    assert.equal(summary.family, scenario.family);
    assert.equal(summary.alarmsCreated, 2, `${scenario.nature} send should create staff and parent alarms`);
    assert.equal(summary.receiptsCreated, 2, `${scenario.nature} send should create staff and parent receipts`);

    const [staffAlarm, parentAlarm] = await Promise.all([
      db.alarm.findFirst({
        where: {
          type: scenario.alarmType,
          referenceType: "SelectedTeachers",
          legacyData: { path: ["messageThreadId"], equals: thread.id },
        },
        select: { id: true, legacyData: true },
      }),
      db.alarm.findFirst({
        where: {
          type: scenario.alarmType,
          referenceId: child.id,
          referenceType: "Child",
          legacyData: { path: ["messageThreadId"], equals: thread.id },
        },
        select: { id: true, message: true, legacyData: true },
      }),
    ]);
    assert.ok(staffAlarm, `${scenario.nature} send should persist a staff alarm`);
    assert.ok(parentAlarm, `${scenario.nature} send should persist a child-scoped parent alarm`);

    const staffLegacy = asRecord(staffAlarm.legacyData);
    assert.equal(staffLegacy.sourceTable, scenario.contentTable);
    assert.equal(staffLegacy.sourceDeliveryTable, scenario.staffDeliveryTable);
    assert.equal(staffLegacy.parentDeliveryTable, scenario.parentDeliveryTable);
    assert.equal(staffLegacy.legacyMethod, scenario.legacyMethod);
    assert.equal(staffLegacy.details, body);
    assert.equal(staffLegacy.href, scenario.href);
    assert.equal(staffLegacy.ntype, 1);
    assert.equal(staffLegacy.child_id, 0);

    const parentLegacy = asRecord(parentAlarm.legacyData);
    assert.equal(parentLegacy.sourceTable, scenario.contentTable);
    assert.equal(parentLegacy.sourceDeliveryTable, scenario.staffDeliveryTable);
    assert.equal(parentLegacy.parentDeliveryTable, scenario.parentDeliveryTable);
    assert.equal(parentLegacy.legacyMethod, scenario.legacyMethod);
    assert.equal(parentLegacy.details, body);
    assert.equal(parentLegacy.href, scenario.href);
    assert.equal(parentLegacy.ntype, 1);
    assert.equal(parentLegacy.legacyChildId, child.legacyId);

    const staffLegacyNotificationId = Number(staffLegacy.aid);
    const parentLegacyNotificationId = Number(parentLegacy.aid);
    assert.ok(
      Number.isFinite(staffLegacyNotificationId),
      `${scenario.nature} staff alarm should preserve legacy aid`,
    );
    assert.ok(
      Number.isFinite(parentLegacyNotificationId),
      `${scenario.nature} parent alarm should preserve legacy aid`,
    );

    const [staffReceipt, parentReceipt] = await Promise.all([
      db.notificationReceipt.findUnique({
        where: {
          sourceTable_legacyNotificationId_legacyRecipientId_recipientType: {
            sourceTable: scenario.staffDeliveryTable,
            legacyNotificationId: staffLegacyNotificationId,
            legacyRecipientId: legacyTeacherId,
            recipientType: "USER",
          },
        },
        select: { recipientId: true, isRead: true, alarmId: true, metadata: true },
      }),
      db.notificationReceipt.findUnique({
        where: {
          sourceTable_legacyNotificationId_legacyRecipientId_recipientType: {
            sourceTable: scenario.parentDeliveryTable,
            legacyNotificationId: parentLegacyNotificationId,
            legacyRecipientId: child.legacyId ?? 0,
            recipientType: "CHILD",
          },
        },
        select: { recipientId: true, isRead: true, alarmId: true, metadata: true },
      }),
    ]);
    assert.ok(staffReceipt, `${scenario.nature} send should persist a staff receipt`);
    assert.equal(staffReceipt.recipientId, teacher.id);
    assert.equal(staffReceipt.isRead, false);
    assert.equal(staffReceipt.alarmId, staffAlarm.id);
    assert.equal(asRecord(staffReceipt.metadata).legacyMethod, scenario.legacyMethod);

    assert.ok(parentReceipt, `${scenario.nature} send should persist a parent receipt`);
    assert.equal(parentReceipt.recipientId, child.id);
    assert.equal(parentReceipt.isRead, false);
    assert.equal(parentReceipt.alarmId, parentAlarm.id);
    assert.equal(asRecord(parentReceipt.metadata).legacyMethod, scenario.legacyMethod);
    assert.equal(asRecord(parentReceipt.metadata).ntype, 1);

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
      notificationDetails(payload).some((detail) => detail.body === body),
      true,
      `parent notifications payload should expose generated ${scenario.nature} parent receipt`,
    );
  } finally {
    if (thread) {
      await db.notificationReceipt.deleteMany({
        where: {
          alarm: { legacyData: { path: ["messageThreadId"], equals: thread.id } },
        },
      });
      await db.alarm.deleteMany({
        where: { legacyData: { path: ["messageThreadId"], equals: thread.id } },
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
