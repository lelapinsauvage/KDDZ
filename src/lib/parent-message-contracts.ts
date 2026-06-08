export type LegacyMessageListHeader = {
  name: string;
  status: boolean;
  count: number;
};

export type LegacyMessageListItem = {
  datetime: string;
  thread_id: string;
  modern_thread_id: string;
  legacy_thread_id: number | null;
  subject: string;
  last_message: string;
  original_sender: string;
};

export type LegacyMessageThreadItem = {
  thread_id: string;
  modern_thread_id: string | null;
  legacy_thread_id: number | null;
  datetime: string;
  sender: string;
  sender_type: string;
  subject: string;
  message: string;
  is_read: boolean;
};

export type LegacySendMessageResult = {
  feedback: "Message Sent" | "Message Failed to Send";
  threadid: number;
  modern_thread_id?: string;
};

export function buildEmptyLegacyMessageList(): LegacyMessageListHeader[] {
  return [buildLegacyMessageListHeader("", false, 0)];
}

export function buildLegacyMessageListHeader(
  name: unknown,
  status: unknown,
  count: unknown
): LegacyMessageListHeader {
  return {
    name: toLegacyString(name),
    status: Boolean(status),
    count: toLegacyCount(count),
  };
}

export function buildLegacyMessageListItem(input: {
  datetime: unknown;
  threadId: unknown;
  modernThreadId: unknown;
  legacyThreadId: number | null;
  subject: unknown;
  lastMessage: unknown;
  originalSender: unknown;
}): LegacyMessageListItem {
  return {
    datetime: toLegacyString(input.datetime),
    thread_id: toLegacyString(input.threadId),
    modern_thread_id: toLegacyString(input.modernThreadId),
    legacy_thread_id: input.legacyThreadId,
    subject: toLegacyString(input.subject),
    last_message: toLegacyString(input.lastMessage),
    original_sender: toLegacyString(input.originalSender),
  };
}

export function buildLegacyMessageThreadPayload(
  messages: LegacyMessageThreadItem[]
): Record<string, LegacyMessageThreadItem> {
  return Object.fromEntries(
    messages.map((message, index) => [String(index + 1), message])
  );
}

export function buildLegacyMessageThreadItem(input: {
  threadId: unknown;
  modernThreadId: unknown;
  legacyThreadId: number | null;
  datetime: unknown;
  sender: unknown;
  senderType: unknown;
  subject: unknown;
  message: unknown;
  isRead: unknown;
}): LegacyMessageThreadItem {
  return {
    thread_id: toLegacyString(input.threadId),
    modern_thread_id:
      input.modernThreadId === null || input.modernThreadId === undefined
        ? null
        : toLegacyString(input.modernThreadId),
    legacy_thread_id: input.legacyThreadId,
    datetime: toLegacyString(input.datetime),
    sender: toLegacyString(input.sender),
    sender_type: toLegacyString(input.senderType),
    subject: toLegacyString(input.subject),
    message: toLegacyString(input.message),
    is_read: Boolean(input.isRead),
  };
}

export function buildEmptyLegacyMessageThread(): [] {
  return [];
}

export function buildFailedLegacySendMessageResult(): LegacySendMessageResult {
  return {
    feedback: "Message Failed to Send",
    threadid: 0,
  };
}

export function buildSentLegacySendMessageResult(
  threadId: number,
  modernThreadId: string
): LegacySendMessageResult {
  return {
    feedback: "Message Sent",
    threadid: threadId,
    modern_thread_id: modernThreadId,
  };
}

function toLegacyString(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function toLegacyCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}
