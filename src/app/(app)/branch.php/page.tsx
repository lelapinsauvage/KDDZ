import { notFound, redirect } from "next/navigation";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyBranchEditRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/branches");
  }

  const branchId = await resolveLegacyBranchId(id);
  if (!branchId) {
    notFound();
  }

  redirect(`/branches/${encodeURIComponent(branchId)}/edit`);
}
