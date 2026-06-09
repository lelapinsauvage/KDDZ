import type { ExportColumn } from "@/lib/export";

export const LEGACY_SENT_MESSAGE_PAGE_SIZES = [10, 20, 50, 100, 1000] as const;

export type LegacySentMessagePageSize =
  | (typeof LEGACY_SENT_MESSAGE_PAGE_SIZES)[number]
  | "all";

export function isLegacySentMessagePageSize(
  value: number,
): value is (typeof LEGACY_SENT_MESSAGE_PAGE_SIZES)[number] {
  return LEGACY_SENT_MESSAGE_PAGE_SIZES.includes(
    value as (typeof LEGACY_SENT_MESSAGE_PAGE_SIZES)[number],
  );
}

export function parseLegacySentMessagePageSize(
  value: string | null | undefined,
): LegacySentMessagePageSize {
  if (value === "all") return "all";
  const parsed = Number(value) || 10;
  return isLegacySentMessagePageSize(parsed) ? parsed : 10;
}

export const LEGACY_SENT_MESSAGE_EXPORT_COLUMNS: ExportColumn[] = [
  { header: "#", key: "serial" },
  { header: "To", key: "to" },
  { header: "Date", key: "date" },
  { header: "Nature", key: "nature" },
  { header: "Subject", key: "subject" },
  { header: "Message", key: "message" },
  { header: "Thread", key: "thread" },
];

export interface LegacySentMessageExportInput {
  legacyId: number | null;
  legacyThreadId: number | null;
  threadId: string | null;
  recipientName: string;
  nature: string;
  subject: string | null;
  body: string;
  createdAt: string;
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatLegacySentMessageDateTime(value: string) {
  const date = parseDate(value);
  if (!date) return "";

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(" ");
}

export function legacySentMessageThreadLabel(
  message: Pick<LegacySentMessageExportInput, "legacyThreadId" | "threadId">,
) {
  if (message.legacyThreadId) return String(message.legacyThreadId);
  if (message.threadId) return message.threadId.slice(0, 8);
  return "-";
}

export function buildLegacySentMessageExportRows(
  messages: LegacySentMessageExportInput[],
) {
  return messages.map((message, index) => ({
    serial: message.legacyId ?? index + 1,
    to: message.recipientName,
    date: formatLegacySentMessageDateTime(message.createdAt),
    nature: message.nature,
    subject: message.subject ?? "",
    message: message.body,
    thread: legacySentMessageThreadLabel(message),
  }));
}
