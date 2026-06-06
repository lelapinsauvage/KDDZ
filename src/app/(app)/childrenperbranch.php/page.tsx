import { notFound, redirect } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";

interface PageProps {
  searchParams: Promise<{ brid?: string }>;
}

export default async function LegacyChildrenPerBranchRedirect({
  searchParams,
}: PageProps) {
  const { brid } = await searchParams;

  if (!brid?.trim()) {
    redirect("/children");
  }

  const branchId = await resolveLegacyBranchId(brid);
  if (!branchId) {
    notFound();
  }

  redirect(`/branches/${encodeURIComponent(branchId)}/children`);
}
