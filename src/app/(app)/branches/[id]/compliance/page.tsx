import { notFound } from "next/navigation";
import { getBranch } from "@/lib/actions/branches";
import { getCompliance } from "@/lib/actions/branch-compliance";
import { BranchComplianceForm } from "@/components/branches/branch-compliance-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BranchCompliancePage({ params }: Props) {
  const { id } = await params;

  const [branchResult, complianceResult] = await Promise.all([
    getBranch(id),
    getCompliance(id),
  ]);

  if (!branchResult.success || !branchResult.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branch = branchResult.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compliance = complianceResult.data as any;

  return (
    <BranchComplianceForm
      branchId={id}
      branchName={branch.name}
      themeColor={branch.themeColor}
      initialData={compliance}
    />
  );
}
