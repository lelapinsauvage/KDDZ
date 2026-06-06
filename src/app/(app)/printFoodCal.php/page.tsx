import { notFound, redirect } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";

interface PageProps {
  searchParams: Promise<{ brid?: string; month?: string; year?: string }>;
}

export default async function LegacyPrintFoodCalendarRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  if (!params.brid?.trim()) {
    redirect("/food/calendar/print");
  }

  const branchId = await resolveLegacyBranchId(params.brid);
  if (!branchId) {
    notFound();
  }

  const target = new URLSearchParams({ branch: branchId, autoprint: "1" });
  if (params.month?.trim()) {
    target.set("month", params.month.trim());
  }
  if (params.year?.trim()) {
    target.set("year", params.year.trim());
  }

  redirect(`/food/calendar/print?${target.toString()}`);
}
