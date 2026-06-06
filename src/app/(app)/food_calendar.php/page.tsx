import { notFound, redirect } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";

interface PageProps {
  searchParams: Promise<{ id?: string; brid?: string; month?: string; year?: string }>;
}

export default async function LegacyFoodCalendarRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const target = new URLSearchParams();
  const legacyBranchId = params.brid ?? params.id;

  if (legacyBranchId?.trim()) {
    const branchId = await resolveLegacyBranchId(legacyBranchId);
    if (!branchId) {
      notFound();
    }
    target.set("branch", branchId);
  }
  if (params.month?.trim()) {
    target.set("month", params.month.trim());
  }
  if (params.year?.trim()) {
    target.set("year", params.year.trim());
  }

  redirect(`/food/calendar${target.size ? `?${target.toString()}` : ""}`);
}
