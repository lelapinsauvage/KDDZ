import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  authenticateParent,
  verifyChildAccess,
  formatChildName,
  formatDateTimeLong,
  jsonError,
  jsonSuccess,
} from "@/lib/parent-auth";

interface NotificationGroup {
  name: string;
  details: { datetime: string; subject: string; body: string }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const auth = await authenticateParent(request);
  if ("error" in auth) return auth.error;
  const { parentUser } = auth;

  if (!verifyChildAccess(parentUser, childId)) {
    return jsonError("Access denied", 403);
  }

  try {
    const child = await db.child.findUnique({ where: { id: childId } });
    if (!child) {
      return jsonSuccess({
        info: {
          name: "",
          status: false,
          no_notifications: "No New Notifications",
        },
      });
    }

    const childName = formatChildName(child);
    const result: Record<string, unknown> = {
      info: {
        name: childName,
        status: true,
        no_notifications: "No New Notifications",
      },
    };

    // 1. Birthday alarms
    const birthdayAlarms = await db.alarm.findMany({
      where: {
        type: "BIRTHDAY",
        isActive: true,
        referenceId: childId,
        referenceType: "Child",
      },
      orderBy: { createdAt: "desc" },
    });
    result.notification1 = buildNotificationGroup(
      "Birthday",
      birthdayAlarms.map((a) => ({
        datetime: formatDateTimeLong(a.dueDate ?? a.createdAt),
        subject: "Birthday Reminder",
        body: a.message ?? "",
      }))
    );

    // 2. Vaccination alarms
    const vaccinationAlarms = await db.alarm.findMany({
      where: {
        type: "VACCINATION",
        isActive: true,
        referenceId: childId,
        referenceType: "Child",
      },
      orderBy: { createdAt: "desc" },
    });
    result.notification2 = buildNotificationGroup(
      "Vaccinations",
      vaccinationAlarms.map((a) => ({
        datetime: formatDateTimeLong(a.dueDate ?? a.createdAt),
        subject: "Vaccination Reminder",
        body: a.message ?? "",
      }))
    );

    // 3. Medicine alarms
    const medicineAlarms = await db.alarm.findMany({
      where: {
        type: "MEDICINE",
        isActive: true,
        referenceId: childId,
        referenceType: "Child",
      },
      orderBy: { createdAt: "desc" },
    });
    result.notification3 = buildNotificationGroup(
      "Medicine",
      medicineAlarms.map((a) => ({
        datetime: formatDateTimeLong(a.dueDate ?? a.createdAt),
        subject: "Medicine Reminder",
        body: a.message ?? "",
      }))
    );

    // 4. Events (branch-filtered)
    const now = new Date();
    const events = await db.event.findMany({
      where: {
        isActive: true,
        date: { lte: now },
        OR: [{ branchId: child.branchId }, { branchId: null }],
      },
      orderBy: { date: "desc" },
    });
    result.notification4 = buildNotificationGroup(
      "Events",
      events.map((e) => ({
        datetime: formatDateTimeLong(e.date),
        subject: e.title,
        body: e.description ?? "",
      }))
    );

    // 5. Insurance alarms
    const insuranceAlarms = await db.alarm.findMany({
      where: {
        type: "INSURANCE",
        isActive: true,
        referenceId: childId,
        referenceType: "Child",
      },
      orderBy: { createdAt: "desc" },
    });
    result.notification5 = buildNotificationGroup(
      "Insurance",
      insuranceAlarms.map((a) => ({
        datetime: formatDateTimeLong(a.dueDate ?? a.createdAt),
        subject: "Insurance Reminder",
        body: a.message ?? "",
      }))
    );

    // 6. Payment alarms
    const paymentAlarms = await db.alarm.findMany({
      where: {
        type: "PAYMENT",
        isActive: true,
        referenceId: childId,
        referenceType: "Child",
      },
      orderBy: { createdAt: "desc" },
    });
    result.notification6 = buildNotificationGroup(
      "Payments",
      paymentAlarms.map((a) => ({
        datetime: formatDateTimeLong(a.dueDate ?? a.createdAt),
        subject: "Payment Reminder",
        body: a.message ?? "",
      }))
    );

    // 7. Messages
    const messages = await db.message.findMany({
      where: {
        recipientId: parentUser.id,
        recipientType: "PARENT",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    result.notification7 = buildNotificationGroup(
      "Messages",
      messages.map((m) => ({
        datetime: formatDateTimeLong(m.createdAt),
        subject: m.subject ?? "",
        body: m.body.replace(/"/g, ""),
      }))
    );

    // 8. Assessment notifications
    const assessments = await db.assessment.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
    });
    result.notification8 = buildNotificationGroup(
      "Assessments",
      assessments.map((a) => ({
        datetime: formatDateTimeLong(a.createdAt),
        subject: `Assessment Type ${a.assessmentType}`,
        body: `New assessment available for ${childName}`,
      }))
    );

    // 9. Medical alarms (missing reports)
    const medicalAlarms = await db.alarm.findMany({
      where: {
        type: "MEDICAL",
        isActive: true,
        referenceId: childId,
        referenceType: "Child",
      },
      orderBy: { createdAt: "desc" },
    });
    result.notification9 = buildNotificationGroup(
      "Medical Reports",
      medicalAlarms.map((a) => ({
        datetime: formatDateTimeLong(a.dueDate ?? a.createdAt),
        subject: "Medical Report Reminder",
        body: a.message ?? "",
      }))
    );

    return jsonSuccess(result);
  } catch {
    return jsonError("Internal server error", 500);
  }
}

function buildNotificationGroup(
  name: string,
  details: { datetime: string; subject: string; body: string }[]
): NotificationGroup {
  return { name, details };
}
