import { notFound, redirect } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";

interface PageProps {
  searchParams: Promise<{ brid?: string; month?: string; p?: string; year?: string }>;
}

function appendMonthlyParams(
  target: URLSearchParams,
  params: Awaited<PageProps["searchParams"]>
) {
  const monthParam = params.month ?? params.p;
  if (monthParam?.trim()) {
    target.set("month", monthParam.trim());
  }
  if (params.year?.trim()) {
    target.set("year", params.year.trim());
  }
}

export default async function LegacyMonthlyBranchReportRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  if (!params.brid?.trim()) {
    redirect("/reports/monthly");
  }

  const branchId = await resolveLegacyBranchId(params.brid);
  if (!branchId) {
    notFound();
  }

  const target = new URLSearchParams({ branch: branchId });
  appendMonthlyParams(target, params);
  redirect(`/reports/monthly-branch?${target.toString()}`);
}
