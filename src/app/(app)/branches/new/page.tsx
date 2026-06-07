import { redirect } from "next/navigation";

import { BranchForm } from "@/components/branches/branch-form";
import { getLegacyBranchActionPermissions } from "@/lib/legacy-branch-action-permissions";
import { requireOrg } from "@/lib/require-org";

export default async function NewBranchPage() {
  const ctx = await requireOrg();
  const permissions = await getLegacyBranchActionPermissions(ctx);
  if (!permissions.canAddBranch) {
    redirect("/forbidden.php");
  }

  return <BranchForm />;
}
