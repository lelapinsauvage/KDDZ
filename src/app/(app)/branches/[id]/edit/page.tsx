import { notFound, redirect } from "next/navigation";
import { getBranch } from "@/lib/actions/branches";
import { BranchForm } from "@/components/branches/branch-form";
import { getLegacyBranchActionPermissions } from "@/lib/legacy-branch-action-permissions";
import { requireOrg } from "@/lib/require-org";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BranchEditPage({ params }: Props) {
  const { id } = await params;
  const ctx = await requireOrg();
  const permissions = await getLegacyBranchActionPermissions(ctx);
  if (!permissions.canUpdateBranch) {
    redirect("/forbidden.php");
  }

  const result = await getBranch(id);
  if (!result.success || !result.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branch = result.data as any;

  return (
    <BranchForm
      hideHeader
      branch={{
        id: branch.id,
        name: branch.name ?? "",
        prefix: branch.prefix ?? "",
        address: branch.address ?? "",
        phone: branch.phone ?? "",
        telephone: branch.telephone ?? "",
        email: branch.email ?? "",
        imageUrl: branch.imageUrl ?? "",
        themeColor: branch.themeColor ?? "#1caf9a",
        isActive: branch.isActive ?? true,
      }}
    />
  );
}
