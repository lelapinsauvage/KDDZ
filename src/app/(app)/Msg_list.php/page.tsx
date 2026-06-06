import { redirect } from "next/navigation";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";

type SearchValue = string | string[] | undefined;

interface LegacySentMessageSearchParams {
  q?: SearchValue;
  id?: SearchValue;
  ids?: SearchValue;
  from?: SearchValue;
  to?: SearchValue;
  dateFrom?: SearchValue;
  dateTo?: SearchValue;
  mind?: SearchValue;
  maxd?: SearchValue;
  order_date_from?: SearchValue;
  order_date_to?: SearchValue;
  nature?: SearchValue;
  subject?: SearchValue;
  message?: SearchValue;
  thread?: SearchValue;
  threadId?: SearchValue;
  order_status?: SearchValue;
}

function appendIfPresent(params: URLSearchParams, key: string, value: SearchValue) {
  const normalized = normalizeLegacySearchQuery(value);
  if (normalized) params.set(key, normalized);
}

export default async function LegacySentMessagesRedirect({
  searchParams,
}: {
  searchParams: Promise<LegacySentMessageSearchParams>;
}) {
  const source = await searchParams;
  const target = new URLSearchParams();

  appendIfPresent(target, "q", source.q);
  appendIfPresent(target, "id", source.ids ?? source.id);
  appendIfPresent(target, "to", source.to ?? source.from);
  appendIfPresent(
    target,
    "dateFrom",
    source.dateFrom ?? source.order_date_from ?? source.mind,
  );
  appendIfPresent(
    target,
    "dateTo",
    source.dateTo ?? source.order_date_to ?? source.maxd,
  );
  appendIfPresent(target, "nature", source.nature);
  appendIfPresent(target, "subject", source.subject);
  appendIfPresent(target, "message", source.message);
  appendIfPresent(target, "thread", source.thread ?? source.threadId ?? source.order_status);

  const suffix = target.toString();
  redirect(suffix ? `/messages/sent?${suffix}` : "/messages/sent");
}
