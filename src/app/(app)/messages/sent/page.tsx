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
}

function normalizeParam(value: SearchValue) {
  return normalizeLegacySearchQuery(value);
}

export default async function SentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<SentSearchParams>;
}) {
  const params = await searchParams;
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
  };

  const result = await getSentMessages({ pageSize: 1000 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result.data as any;
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
    createdAt: string;
  }>;
  const total = (data?.total ?? 0) as number;

  return (
    <SentClient
      messages={messages}
      total={total}
      initialFilters={initialFilters}
    />
  );
}
