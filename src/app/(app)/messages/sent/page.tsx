import { getSentMessages } from "@/lib/actions/messages";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";
import { SentClient } from "./sent-client";

type SearchValue = string | string[] | undefined;

interface SentSearchParams {
  q?: SearchValue;
  id?: SearchValue;
  to?: SearchValue;
  dateFrom?: SearchValue;
  dateTo?: SearchValue;
  nature?: SearchValue;
  subject?: SearchValue;
  message?: SearchValue;
  thread?: SearchValue;
  page?: SearchValue;
  pageSize?: SearchValue;
}

function normalizeParam(value: SearchValue) {
  return normalizeLegacySearchQuery(value);
}

type SentPageSize = number | "all";

const PAGE_SIZES = [10, 20, 50, 100, 1000];

function parsePageSize(value: SearchValue): SentPageSize {
  const normalized = normalizeParam(value);
  if (normalized === "all") return "all";
  const parsed = Number(normalized) || 10;
  return PAGE_SIZES.includes(parsed) ? parsed : 10;
}

function parsePage(value: SearchValue) {
  return Math.max(1, Number(normalizeParam(value)) || 1);
}

export default async function SentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<SentSearchParams>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.pageSize);
  const initialFilters = {
    q: normalizeParam(params.q),
    id: normalizeParam(params.id),
    to: normalizeParam(params.to),
    dateFrom: normalizeParam(params.dateFrom),
    dateTo: normalizeParam(params.dateTo),
    nature: normalizeParam(params.nature),
    subject: normalizeParam(params.subject),
    message: normalizeParam(params.message),
    thread: normalizeParam(params.thread),
    page,
    pageSize,
  };

  const listParams = {
    search: initialFilters.q || undefined,
    id: initialFilters.id || undefined,
    to: initialFilters.to || undefined,
    dateFrom: initialFilters.dateFrom || undefined,
    dateTo: initialFilters.dateTo || undefined,
    nature: initialFilters.nature || undefined,
    subject: initialFilters.subject || undefined,
    message: initialFilters.message || undefined,
    thread: initialFilters.thread || undefined,
    page,
    pageSize,
  };

  const [result, exportResult] = await Promise.all([
    getSentMessages(listParams),
    getSentMessages({ ...listParams, page: 1, pageSize: "all" }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportData = exportResult.data as any;
  const messages = (data?.messages ?? []) as Array<{
    id: string;
    legacyId: number | null;
    legacyThreadId: number | null;
    legacyNature: string | null;
    legacyHref: string | null;
    senderId: string;
    senderType: string;
    recipientId: string;
    recipientType: string;
    recipientName: string;
    nature: string;
    subject: string | null;
    body: string;
    isRead: boolean;
    threadId: string | null;
    legacyDelivery: {
      channels: string[];
      scope: string | null;
      pendingExternal: boolean;
    };
    createdAt: string;
  }>;
  const exportMessages = (exportData?.messages ?? []) as typeof messages;
  const total = (data?.total ?? 0) as number;

  return (
    <SentClient
      key={JSON.stringify(initialFilters)}
      messages={messages}
      exportMessages={exportMessages}
      total={total}
      initialFilters={initialFilters}
    />
  );
}
