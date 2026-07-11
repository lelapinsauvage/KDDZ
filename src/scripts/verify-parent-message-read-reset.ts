import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { POST as parentMessageListPost } from "@/app/api/parent/messages/[childId]/route";
import { POST as parentMessageThreadPost } from "@/app/api/parent/messages/thread/[threadId]/route";
import { POST as messageThreadPost } from "@/app/ws/message.php/route";
import { db } from "@/lib/db";

type IdRecord = { id: string };
type ChildRecord = { id: string; legacyId: number | null };

async function main() {
  const marker = `verify-message-read-reset-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  const legacyThreadId = Math.floor(Date.now() % 2_000_000_000);
  const organizationSlug = `${marker}-org`;

  let organization: IdRecord | null = null;
  let branch: IdRecord | null = null;
  let child: ChildRecord | null = null;
  let parentUser: IdRecord | null = null;
  let otherChild: ChildRecord | null = null;
  let otherParentUser: IdRecord | null = null;
  let thread: IdRecord | null = null;
  let unreadMessage: IdRecord | null = null;
  let otherUnreadMessage: IdRecord | null = null;

  try {
    organization = await db.organization.create({
      data: {
        name: "Message Read Reset Verification",
        slug: organizationSlug,
      },
      select: { id: true },
    });

    branch = await db.branch.create({
      data: {
        organizationId: organization.id,
        name: "Message Read Reset Branch",
      },
      select: { id: true },
    });

    child = await db.child.create({
      data: {
        firstName: "Message",
        lastName: "Read Reset",
        branchId: branch.id,
        legacyId: legacyThreadId,
      },
      select: { id: true, legacyId: true },
    });

    parentUser = await db.parentUser.create({
      data: {
        username: `${marker}@example.test`,
        passwordHash: "not-used-by-read-reset-verifier",
        childId: child.id,
        legacyChildId: child.legacyId,
        isActive: true,
      },
      select: { id: true },
    });

    otherChild = await db.child.create({
      data: {
        firstName: "Other",
        lastName: "Family",
        branchId: branch.id,
        legacyId: legacyThreadId + 1,
      },
      select: { id: true, legacyId: true },
    });

    otherParentUser = await db.parentUser.create({
      data: {
        username: `${marker}-other@example.test`,
        passwordHash: "not-used-by-read-reset-verifier",
        childId: otherChild.id,
        legacyChildId: otherChild.legacyId,
        isActive: true,
      },
      select: { id: true },
    });

    thread = await db.messageThread.create({
      data: {
        subject: "Read reset verification",
        organizationId: organization.id,
      },
      select: { id: true },
    });

    unreadMessage = await db.message.create({
      data: {
        senderId: randomUUID(),
        senderType: "ADMIN",
        recipientId: parentUser.id,
        recipientType: "PARENT",
        subject: "Read reset verification",
        body: "Unread parent message",
        threadId: thread.id,
        organizationId: organization.id,
        legacyThreadId,
        legacySenderType: 0,
        legacyRecipientType: 1,
        legacyDeliveryUserType: 1,
        isRead: false,
      },
      select: { id: true },
    });

    otherUnreadMessage = await db.message.create({
      data: {
        senderId: randomUUID(),
        senderType: "ADMIN",
        recipientId: otherParentUser.id,
        recipientType: "PARENT",
        subject: "Read reset verification",
        body: "Other family private message",
        threadId: thread.id,
        organizationId: organization.id,
        legacyThreadId,
        legacySenderType: 0,
        legacyRecipientType: 1,
        legacyDeliveryUserType: 1,
        isRead: false,
      },
      select: { id: true },
    });

    const existingCount = await db.message.count({ where: { legacyThreadId } });
    assert.equal(existingCount, 2, "temporary broadcast thread should have two family rows");

    const ambiguousRequest = new NextRequest(
      `http://localhost/api/parent/messages/thread/${legacyThreadId}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ threadid: String(legacyThreadId) }),
      }
    );
    const ambiguousResponse = await parentMessageThreadPost(ambiguousRequest, {
      params: Promise.resolve({ threadId: String(legacyThreadId) }),
    });
    assert.ok(ambiguousResponse, "ambiguous parent thread route should return a response");
    assert.equal(ambiguousResponse.status, 200);
    assert.deepEqual(
      await ambiguousResponse.json(),
      [],
      "an unauthenticated multi-parent thread without a relationship hint must fail closed"
    );

    const directRequest = new NextRequest(
      `http://localhost/api/parent/messages/thread/${legacyThreadId}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          threadid: String(legacyThreadId),
          child_id: String(child.legacyId),
        }),
      }
    );

    const directResponse = await parentMessageThreadPost(directRequest, {
      params: Promise.resolve({ threadId: String(legacyThreadId) }),
    });
    assert.ok(directResponse, "parent message thread route should return a response");
    assert.equal(
      directResponse.status,
      200,
      "parent message thread route should return HTTP 200"
    );

    const directPayload = await directResponse.json();
    assert.equal(
      Array.isArray(directPayload),
      false,
      "direct thread payload must be an object"
    );
    assert.equal(directPayload["1"]?.message, "Unread parent message");
    assert.equal(
      Object.keys(directPayload).length,
      1,
      "direct thread payload must contain only the resolved family conversation"
    );
    assert.equal(
      JSON.stringify(directPayload).includes("Other family private message"),
      false,
      "direct thread payload must not expose another family row"
    );
    assert.equal(
      directPayload["1"]?.is_read,
      true,
      "direct thread payload should be read"
    );

    await db.message.update({
      where: { id: unreadMessage.id },
      data: { isRead: false },
    });

    const request = new NextRequest("http://localhost/ws/message.php", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        usites: String(legacyThreadId),
        pid: String(child.legacyId),
      }),
    });

    const response = await messageThreadPost(request);
    assert.ok(response, "ws/message.php should return a response");
    assert.equal(response.status, 200, "ws/message.php should return HTTP 200");

    const payload = await response.json();
    assert.equal(Array.isArray(payload), false, "ws thread payload must be an object");
    assert.equal(payload["1"]?.message, "Unread parent message");
    assert.equal(payload["1"]?.is_read, true, "ws thread payload should be read");
    assert.equal(Object.keys(payload).length, 1, "ws thread payload must be family-isolated");
    assert.equal(
      JSON.stringify(payload).includes("Other family private message"),
      false,
      "ws thread payload must not expose another family row"
    );

    const listRequest = new NextRequest(
      `http://localhost/api/parent/messages/${child.legacyId}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ usites: String(child.legacyId) }),
      }
    );
    const listResponse = await parentMessageListPost(listRequest, {
      params: Promise.resolve({ childId: String(child.legacyId) }),
    });
    assert.ok(listResponse, "parent message list route should return a response");
    assert.equal(listResponse.status, 200);
    const listPayload = await listResponse.json();
    assert.equal(Array.isArray(listPayload), true, "legacy message list must remain an array");
    assert.equal(
      JSON.stringify(listPayload).includes("Other family private message"),
      false,
      "legacy thread previews must remain relationship-scoped"
    );

    const persisted = await db.message.findUnique({
      where: { id: unreadMessage.id },
      select: { isRead: true },
    });
    assert.equal(persisted?.isRead, true, "DB row should be marked read");
    const otherPersisted = await db.message.findUnique({
      where: { id: otherUnreadMessage.id },
      select: { isRead: true },
    });
    assert.equal(
      otherPersisted?.isRead,
      false,
      "opening one family conversation must not mark another family row read"
    );

    console.log("parent message read reset and shared-thread isolation assertions passed");
  } finally {
    if (thread) await db.message.deleteMany({ where: { threadId: thread.id } });
    if (thread) await db.messageThread.deleteMany({ where: { id: thread.id } });
    if (unreadMessage) {
      await db.message.deleteMany({ where: { id: unreadMessage.id } });
    }
    if (parentUser) await db.parentUser.deleteMany({ where: { id: parentUser.id } });
    if (otherParentUser) {
      await db.parentUser.deleteMany({ where: { id: otherParentUser.id } });
    }
    if (child) await db.child.deleteMany({ where: { id: child.id } });
    if (otherChild) await db.child.deleteMany({ where: { id: otherChild.id } });
    if (branch) await db.branch.deleteMany({ where: { id: branch.id } });
    if (organization) {
      await db.organization.deleteMany({ where: { id: organization.id } });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
