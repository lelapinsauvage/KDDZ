import assert from "node:assert/strict";
import {
  buildEmptyLegacyMessageList,
  buildEmptyLegacyMessageThread,
  buildFailedLegacySendMessageResult,
  buildLegacyMessageListHeader,
  buildLegacyMessageListItem,
  buildLegacyMessageThreadItem,
  buildLegacyMessageThreadPayload,
  buildSentLegacySendMessageResult,
} from "@/lib/parent-message-contracts";

const emptyList = buildEmptyLegacyMessageList();
assert.equal(Array.isArray(emptyList), true, "empty message list must be array");
assert.deepEqual(emptyList[0], { name: "", status: false, count: 0 });

const header = buildLegacyMessageListHeader(123, "truthy", "5.7");
assert.equal(typeof header.name, "string", "message header name must be string");
assert.equal(header.name, "123");
assert.equal(header.status, true);
assert.equal(header.count, 5);

const listItem = buildLegacyMessageListItem({
  datetime: new Date("2026-06-08T12:00:00.000Z"),
  threadId: 42,
  modernThreadId: "modern-thread",
  legacyThreadId: 42,
  subject: null,
  lastMessage: 99,
  originalSender: "Parent",
});
assert.equal(typeof listItem.datetime, "string", "list datetime must be string");
assert.equal(typeof listItem.thread_id, "string", "list thread_id must be string");
assert.equal(typeof listItem.subject, "string", "list subject must be string");
assert.equal(typeof listItem.last_message, "string", "list last_message must be string");
assert.equal(
  typeof listItem.original_sender,
  "string",
  "list original_sender must be string"
);
assert.equal(listItem.thread_id, "42");
assert.equal(listItem.subject, "");
assert.equal(listItem.last_message, "99");

const emptyThread = buildEmptyLegacyMessageThread();
assert.equal(Array.isArray(emptyThread), true, "empty thread must be array");
assert.equal(emptyThread.length, 0);

const threadItem = buildLegacyMessageThreadItem({
  threadId: 42,
  modernThreadId: null,
  legacyThreadId: 42,
  datetime: "2026-06-08 12:00:00",
  sender: 1,
  senderType: "PARENT",
  subject: undefined,
  message: "Reply",
  isRead: 0,
});
const threadPayload = buildLegacyMessageThreadPayload([threadItem]);
assert.equal(Array.isArray(threadPayload), false, "thread payload must be object");
assert.equal(typeof threadPayload["1"].thread_id, "string");
assert.equal(typeof threadPayload["1"].sender, "string");
assert.equal(typeof threadPayload["1"].subject, "string");
assert.equal(typeof threadPayload["1"].message, "string");
assert.equal(threadPayload["1"].thread_id, "42");
assert.equal(threadPayload["1"].sender, "1");
assert.equal(threadPayload["1"].subject, "");

assert.deepEqual(buildFailedLegacySendMessageResult(), {
  feedback: "Message Failed to Send",
  threadid: 0,
});
assert.deepEqual(buildSentLegacySendMessageResult(42, "modern-thread"), {
  feedback: "Message Sent",
  threadid: 42,
  modern_thread_id: "modern-thread",
});

console.log("parent message legacy contract assertions passed");
