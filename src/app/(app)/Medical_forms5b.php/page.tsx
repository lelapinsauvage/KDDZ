import { notFound, redirect } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";

interface PageProps {
  searchParams: Promise<{ brid?: string }>;
}

export default async function LegacyBranchAccidentReportsRedirect({
  searchParams,
}: PageProps) {
  const { brid } = await searchParams;

  if (!brid?.trim()) {
    redirect("/medical/accidents");
  }

  const branchId = await resolveLegacyBranchId(brid);
  if (!branchId) {
    notFound();
  }

  redirect(`/medical/accidents?branch=${encodeURIComponent(branchId)}`);
}
