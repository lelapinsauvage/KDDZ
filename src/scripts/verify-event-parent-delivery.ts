import "dotenv/config";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as notificationsPost } from "@/app/ws/notifications_master.php/route";
import { db } from "@/lib/db";
import { generateEventAlarmsForOrganization } from "@/lib/jobs/event-alarms";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null };

const EVENT_PARENT_RECEIPT_SOURCE = "custom_notifications_events_parents";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

async function main() {
  const marker = `verify-event-parent-delivery-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyChildId = Math.floor(Date.now() % 2_000_000_000);
  const now = new Date();
  const eventDate = addDays(now, 1);
  const eventTitle = `Parent event delivery ${marker}`;
  const eventBody = `Parent event body ${marker}`;

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let parentUser: IdRecord | null = null;
  let event: IdRecord | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Event Parent Delivery Verification",
        slug: `${marker}-org`,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "Event Parent Delivery Branch",
      },
      select: { id: true },
    });

    child = await db.child.create({
      data: {
        firstName: "Event",
        lastName: "Delivery",
        branchId: branch.id,
        legacyId: legacyChildId,
      },
      select: { id: true, legacyId: true },
    });

    parentUser = await db.parentUser.create({
      data: {
        username: `${marker}@example.test`,
        passwordHash: "not-used-by-event-delivery-verifier",
        childId: child.id,
        legacyChildId: child.legacyId,
        isActive: true,
      },
      select: { id: true },
    });

    event = await db.event.create({
      data: {
        organizationId: organization.id,
        branchId: branch.id,
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
      now,
    });
    assert.equal(firstRun.eventsMatched, 1, "first run should match the event");
    assert.equal(firstRun.alarmsCreated, 1, "first run should create one alarm");
    assert.equal(
      firstRun.parentRecipientsMatched,
      1,
      "first run should match the branch child as a parent recipient"
    );
    assert.equal(
      firstRun.parentReceiptsCreated,
      1,
      "first run should create one parent event receipt"
    );

    const generatedEvent = await db.event.findUnique({
      where: { id: event.id },
      select: { legacyId: true },
    });
    assert.ok(
      generatedEvent?.legacyId,
      "event generation should assign a legacy notification id"
    );

    const receipt = await db.notificationReceipt.findFirst({
      where: {
        sourceTable: EVENT_PARENT_RECEIPT_SOURCE,
        legacyNotificationId: generatedEvent.legacyId,
        legacyRecipientId: child.legacyId ?? 0,
      },
      select: {
        recipientType: true,
        recipientId: true,
        isRead: true,
        metadata: true,
      },
    });
    assert.ok(receipt, "generated parent event receipt should be persisted");
    assert.equal(receipt.recipientType, "PARENT_USER");
    assert.equal(receipt.recipientId, parentUser.id);
    assert.equal(receipt.isRead, false);

    const secondRun = await generateEventAlarmsForOrganization({
      organizationId: organization.id,
      now,
    });
    assert.equal(secondRun.eventsMatched, 1, "second run should still match the event");
    assert.equal(secondRun.alarmsCreated, 0, "second run must not duplicate alarms");
    assert.equal(
      secondRun.parentReceiptsCreated,
      0,
      "second run must not duplicate parent receipts"
    );

    const receiptCount = await db.notificationReceipt.count({
      where: {
        sourceTable: EVENT_PARENT_RECEIPT_SOURCE,
        legacyNotificationId: generatedEvent.legacyId,
        legacyRecipientId: child.legacyId ?? 0,
      },
    });
    assert.equal(receiptCount, 1, "parent event receipt should stay idempotent");

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
      notificationDetails(payload).some(
        (detail) => detail.subject === eventTitle && detail.body === eventBody
      ),
      true,
      "parent notifications payload should expose generated event receipt"
    );

    console.log("event parent delivery assertions passed");
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
    if (parentUser) await db.parentUser.deleteMany({ where: { id: parentUser.id } });
    if (child) await db.child.deleteMany({ where: { id: child.id } });
    if (branch) await db.branch.deleteMany({ where: { id: branch.id } });
    if (organization) {
      await db.organization.deleteMany({ where: { id: organization.id } });
    }
  }
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
