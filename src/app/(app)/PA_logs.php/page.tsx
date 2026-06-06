import { redirect } from "next/navigation";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";

interface PageProps {
  searchParams: Promise<{ from?: string; q?: string; to?: string }>;
}

function maybeDate(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export default async function LegacyAttendanceLogsRedirect({ searchParams }: PageProps) {
  const { from, q, to } = await searchParams;
  const params = new URLSearchParams();

  const dateFrom = maybeDate(from);
  const dateTo = maybeDate(to);
  const query = normalizeLegacySearchQuery(q);
  if (dateFrom) params.set("from", dateFrom);
  if (dateTo) params.set("to", dateTo);
  if (query) params.set("q", query);

  const suffix = params.toString();
  redirect(suffix ? `/employees/attendance-logs?${suffix}` : "/employees/attendance-logs");
}
