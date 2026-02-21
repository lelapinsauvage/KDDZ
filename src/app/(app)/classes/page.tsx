import { getClasses } from "@/lib/actions/classes";
import { getBranches } from "@/lib/actions/branches";
import {
  ClassesClient,
  type ClassRow,
  type BranchOption,
} from "@/components/classes/classes-client";

export default async function ClassesManagementPage() {
  const [classesResult, branchesResult] = await Promise.all([
    getClasses(),
    getBranches(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawClasses = (classesResult.data ?? []) as any[];
  const classes: ClassRow[] = rawClasses.map((cls) => ({
    id: cls.id,
    name: cls.name,
    branchId: cls.branchId,
    branchName: cls.branch?.name ?? "Unknown",
    ageGroup: cls.ageGroup ?? "",
    capacity: cls.capacity ?? 0,
    studentCount: cls._count?.children ?? 0,
    status:
      cls.isActive === false
        ? ("Inactive" as const)
        : ("Active" as const),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBranches = (branchesResult.data ?? []) as any[];
  const branches: BranchOption[] = rawBranches.map((b) => ({
    id: b.id,
    name: b.name,
  }));

  return <ClassesClient classes={classes} branches={branches} />;
}
