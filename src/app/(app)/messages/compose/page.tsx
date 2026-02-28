import { getBranches } from "@/lib/actions/branches";
import { getChildren } from "@/lib/actions/children";
import { getClasses } from "@/lib/actions/classes";
import { ComposeClient } from "./compose-client";

export default async function ComposeMessagePage() {
  const [branchesRes, childrenRes, classesRes] = await Promise.all([
    getBranches(),
    getChildren({ status: "ACTIVE", pageSize: 500 }),
    getClasses({ isActive: true }),
  ]);

   
  const rawBranches = (branchesRes.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childData = (childrenRes as any)?.data ?? childrenRes;
  const rawChildren = (
    Array.isArray(childData) ? childData : childData?.children ?? []
  ) as Array<{
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    branch?: { id: string; name: string } | null;
    class?: { id: string; name: string } | null;
  }>;

  const rawClasses = (classesRes.data ?? []) as Array<{
    id: string;
    name: string;
    branch: { id: string; name: string };
  }>;

  const branches = rawBranches.map((b) => ({ id: b.id, name: b.name }));

  const children = rawChildren.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    isActive: c.isActive,
    branchId: c.branch?.id ?? null,
    branchName: c.branch?.name ?? null,
    classId: c.class?.id ?? null,
    className: c.class?.name ?? null,
  }));

  const classes = rawClasses.map((cls) => ({
    id: cls.id,
    name: cls.name,
    branchId: cls.branch.id,
    branchName: cls.branch.name,
  }));

  return (
    <ComposeClient branches={branches} childrenList={children} classes={classes} />
  );
}
