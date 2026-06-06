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
    legacyId: b.legacyId ?? null,
    name: b.name,
    prefix: b.prefix ?? null,
    address: b.address ?? null,
    phone: b.phone ?? null,
    telephone: b.telephone ?? null,
    email: b.email ?? null,
    imageUrl: b.imageUrl ?? null,
    isActive: b.isActive ?? true,
    themeColor: b.themeColor ?? null,
    classCount: b._count?.classes ?? 0,
    childrenCount: b._count?.children ?? 0,
    teacherCount: b._count?.teachers ?? 0,
    compliancePercentage: b.compliance?.completionPercentage ?? null,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
  }));

  return <BranchesClient branches={branches} />;
}
