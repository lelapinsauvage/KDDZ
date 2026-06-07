import { notFound, redirect } from "next/navigation";
import { getLegacyBranchActionPermissions } from "@/lib/legacy-branch-action-permissions";
import { resolveLegacyBranchId } from "@/lib/legacy-branch";
import { requireOrg } from "@/lib/require-org";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyBranchEditRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;
  const ctx = await requireOrg();
  const permissions = await getLegacyBranchActionPermissions(ctx);

  if (!id?.trim()) {
    if (!permissions.canAddBranch) {
      redirect("/forbidden.php");
    }
    redirect("/branches/new");
  }

  if (!permissions.canUpdateBranch) {
    redirect("/forbidden.php");
  }

  const branchId = await resolveLegacyBranchId(id);
  if (!branchId) {
    notFound();
  }

  redirect(`/branches/${encodeURIComponent(branchId)}/edit`);
}
