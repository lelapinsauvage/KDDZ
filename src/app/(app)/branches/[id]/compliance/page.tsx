import { notFound } from "next/navigation";
import { getBranch } from "@/lib/actions/branches";
import { getCompliance, getDocuments, getStaffForCompliance } from "@/lib/actions/branch-compliance";
import { getLegacyNurseryActionPermissions } from "@/lib/legacy-nursery-action-permissions";
import { requireOrgSafe } from "@/lib/require-org";
import { BranchComplianceForm } from "@/components/branches/branch-compliance-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BranchCompliancePage({ params }: Props) {
  const { id } = await params;
  const orgResult = await requireOrgSafe();
  const nurseryPermissions = orgResult.ok
    ? await getLegacyNurseryActionPermissions(orgResult.ctx)
    : { canUpdateNurseryInfo: false };

  const [branchResult, complianceResult, docsResult, staffResult] = await Promise.all([
    getBranch(id),
    getCompliance(id),
    getDocuments(id),
    getStaffForCompliance(id),
  ]);

  if (!branchResult.success || !branchResult.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branch = branchResult.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compliance = complianceResult.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const documents = (docsResult.data as any[]) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const staff = (staffResult.data as any[]) ?? [];

  return (
    <BranchComplianceForm
      branchId={id}
      branchName={branch.name}
      themeColor={branch.themeColor}
      initialData={compliance}
      staff={staff}
      documents={documents}
      canUpdateNurseryInfo={nurseryPermissions.canUpdateNurseryInfo}
    />
  );
}
