import { notFound, redirect } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";

interface PageProps {
  searchParams: Promise<{
    brid?: string | string[];
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

function appendMonthlyParams(
  target: URLSearchParams,
  params: Awaited<PageProps["searchParams"]>
) {
  const monthParam = firstParam(params.month) ?? firstParam(params.from) ?? firstParam(params.p);
  if (monthParam?.trim()) {
    target.set("month", monthParam.trim());
  }

  const classId = firstParam(params.classId) ?? firstParam(params.class);
  if (classId?.trim()) {
    target.set("classId", classId.trim());
  }

  const query = firstParam(params.q);
  if (query?.trim()) {
    target.set("q", query.trim());
  }
}

export default async function LegacyMonthlyBranchReportRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const brid = firstParam(params.brid)?.trim();

  if (!brid) {
    redirect("/reports/monthly");
  }

  const branchId = await resolveLegacyBranchId(brid);
  if (!branchId) {
    notFound();
  }

  const target = new URLSearchParams({ branch: branchId });
  appendMonthlyParams(target, params);
  redirect(`/reports/monthly-branch?${target.toString()}`);
}
