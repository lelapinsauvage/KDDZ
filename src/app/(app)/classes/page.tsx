import { getClasses } from "@/lib/actions/classes";
import { getBranches } from "@/lib/actions/branches";
import { getLegacyClassActionPermissions } from "@/lib/legacy-class-action-permissions";
import { requireOrg } from "@/lib/require-org";
import { redirect } from "next/navigation";
import {
  ClassesClient,
  type ClassItem,
  type BranchOption,
} from "@/components/classes/classes-client";

interface PageProps {
  searchParams: Promise<{ edit?: string; new?: string }>;
}

export default async function ClassesManagementPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ctx = await requireOrg();
  const actionPermissions = await getLegacyClassActionPermissions(ctx);

  if (params.new === "1" && !actionPermissions.canAddClass) {
    redirect("/forbidden.php");
  }
  if (params.edit && !actionPermissions.canUpdateClass) {
    redirect("/forbidden.php");
  }

  const [classesResult, branchesResult] = await Promise.all([
    getClasses(),
    getBranches(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawClasses = (classesResult.data ?? []) as any[];
  const classes: ClassItem[] = rawClasses.map((cls) => ({
    id: cls.id,
    legacyId: cls.legacyId ?? null,
    name: cls.name,
    branchId: cls.branchId,
    branchName: cls.branch?.name ?? "Unknown",
    language: cls.language ?? null,
    ageFrom: cls.ageFrom ?? null,
    ageTo: cls.ageTo ?? null,
    ageFromUnit: cls.ageFromUnit ?? null,
    ageToUnit: cls.ageToUnit ?? null,
    cameraNumber: cls.cameraNumber ?? null,
    maxStudents: cls.maxStudents || cls.capacity || 0,
    studentCount: cls._count?.children ?? 0,
    imageUrl: cls.imageUrl ?? null,
    isActive: cls.isActive ?? true,
    createdAt: cls.createdAt ? new Date(cls.createdAt).toISOString() : new Date().toISOString(),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawBranches = (branchesResult.data ?? []) as any[];
  const branches: BranchOption[] = rawBranches.map((b) => ({
    id: b.id,
    name: b.name,
  }));

  return (
    <ClassesClient
      classes={classes}
      branches={branches}
      initialEditClassId={params.edit}
      initialAddOpen={params.new === "1"}
      actionPermissions={actionPermissions}
    />
  );
}
