import { requireRole } from "@/lib/require-role";
import { getBranches } from "@/lib/actions/branches";
import {
  BranchesClient,
  type BranchItem,
} from "@/components/branches/branches-client";

export default async function BranchesManagementPage() {
  await requireRole("ADMIN", "MANAGER");
  const result = await getBranches();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (result.data ?? []) as any[];
  const branches: BranchItem[] = raw.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address ?? null,
    phone: b.phone ?? null,
    email: b.email ?? null,
    isActive: b.isActive ?? true,
    themeColor: b.themeColor ?? null,
    classCount: b._count?.classes ?? 0,
    childrenCount: b._count?.children ?? 0,
    teacherCount: b._count?.teachers ?? 0,
    compliancePercentage: b.compliance?.completionPercentage ?? null,
  }));

  return <BranchesClient branches={branches} />;
}
