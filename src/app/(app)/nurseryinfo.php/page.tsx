import { notFound, redirect } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";

interface PageProps {
  searchParams: Promise<{ id?: string; brid?: string }>;
}

export default async function LegacyNurseryInfoRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const legacyBranchId = params.brid ?? params.id;

  if (!legacyBranchId?.trim()) {
    redirect("/settings/nursery");
  }

  const branchId = await resolveLegacyBranchId(legacyBranchId);
  if (!branchId) {
    notFound();
  }

  redirect(`/settings/nursery?branch=${encodeURIComponent(branchId)}`);
}
