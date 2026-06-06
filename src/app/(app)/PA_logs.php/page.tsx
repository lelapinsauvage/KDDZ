import { redirect } from "next/navigation";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";

interface PageProps {
  searchParams: Promise<{
    ac_no?: string | string[];
    cardId?: string | string[];
    date_in?: string | string[];
    date_out?: string | string[];
    datetime?: string | string[];
    from?: string;
    id?: string | string[];
    log?: string | string[];
    name?: string | string[];
    note?: string | string[];
    q?: string | string[];
    reader?: string | string[];
    readerId?: string | string[];
    shift?: string | string[];
    site?: string | string[];
    status?: string | string[];
    teacherNo?: string | string[];
    time_in?: string | string[];
    time_out?: string | string[];
    to?: string;
  }>;
}

function maybeDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export default async function LegacyAttendanceLogsRedirect({ searchParams }: PageProps) {
  const source = await searchParams;
  const params = new URLSearchParams();

  const dateFrom = maybeDate(source.from);
  const dateTo = maybeDate(source.to);
  const query = normalizeLegacySearchQuery(source.q);
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);
  if (query) params.set("q", query);

  const aliases: Array<[string, string | string[] | undefined]> = [
    ["id", source.id],
    ["readerId", source.readerId ?? source.ac_no],
    ["reader", source.reader ?? source.name],
    ["logDate", source.log],
    ["logTime", source.site],
    ["status", source.status ?? source.shift],
    ["cardId", source.cardId ?? source.date_out],
    ["teacherNo", source.teacherNo ?? source.time_out],
    ["note", source.note ?? source.date_in],
    ["datetime", source.datetime ?? source.time_in],
  ];
  for (const [key, value] of aliases) {
    const normalized = normalizeLegacySearchQuery(value);
    if (normalized) params.set(key, normalized);
  }

  const suffix = params.toString();
  redirect(suffix ? `/employees/attendance-logs?${suffix}` : "/employees/attendance-logs");
}
