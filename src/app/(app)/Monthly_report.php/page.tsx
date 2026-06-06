import { redirect } from "next/navigation";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";

interface PageProps {
  searchParams: Promise<{
    branch?: string | string[];
    class?: string | string[];
    classId?: string | string[];
    from?: string | string[];
    month?: string | string[];
    p?: string | string[];
    q?: string | string[];
  }>;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeMonth(value?: string | string[]) {
  const raw = firstParam(value)?.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default async function LegacyMonthlyReportRedirect({ searchParams }: PageProps) {
  const source = await searchParams;
  const params = new URLSearchParams();
  const month = normalizeMonth(source.month) ?? normalizeMonth(source.from) ?? normalizeMonth(source.p);
  const branch = normalizeLegacySearchQuery(source.branch);
  const classId = normalizeLegacySearchQuery(source.classId ?? source.class);
  const query = normalizeLegacySearchQuery(source.q);

  if (month) params.set("month", month);
  if (branch) params.set("branch", branch);
  if (classId) params.set("classId", classId);
  if (query) params.set("q", query);

  const suffix = params.toString();
  redirect(suffix ? `/reports/monthly?${suffix}` : "/reports/monthly");
}
