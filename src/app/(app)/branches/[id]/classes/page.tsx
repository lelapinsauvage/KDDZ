import { getClasses } from "@/lib/actions/classes";
import { getBranches } from "@/lib/actions/branches";
import { getLegacyClassActionPermissions } from "@/lib/legacy-class-action-permissions";
import { requireOrg } from "@/lib/require-org";
import {
  ClassesClient,
  type ClassItem,
  type BranchOption,
} from "@/components/classes/classes-client";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    ids?: string | string[];
    name?: string | string[];
    lname?: string | string[];
    language?: string | string[];
    dob?: string | string[];
    maxStudents?: string | string[];
    from?: string | string[];
    to?: string | string[];
    order_date_from?: string | string[];
    order_date_to?: string | string[];
    q?: string | string[];
  }>;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BranchClassesPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const ctx = await requireOrg();

  const [classesResult, branchesResult, actionPermissions] = await Promise.all([
    getClasses({ branchId: id }),
    getBranches(),
    getLegacyClassActionPermissions(ctx),
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
  const branchName = branches.find((branch) => branch.id === id)?.name;

  return (
    <ClassesClient
      classes={classes}
      branches={branches}
      branchId={id}
      branchName={branchName}
      showBranchColumn
      initialSearchQuery={firstParam(query.q)?.trim() ?? ""}
      initialLegacyFilters={{
        classNumber: firstParam(query.ids)?.trim() ?? "",
        name: firstParam(query.name)?.trim() ?? "",
        language: firstParam(query.language)?.trim() ?? firstParam(query.lname)?.trim() ?? "",
        maxStudents: firstParam(query.maxStudents)?.trim() ?? firstParam(query.dob)?.trim() ?? "",
        createdFrom:
          firstParam(query.from)?.trim() ?? firstParam(query.order_date_from)?.trim() ?? "",
        createdTo:
          firstParam(query.to)?.trim() ?? firstParam(query.order_date_to)?.trim() ?? "",
      }}
      actionPermissions={actionPermissions}
    />
  );
}
