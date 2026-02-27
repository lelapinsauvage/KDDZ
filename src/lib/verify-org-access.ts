import { db } from "@/lib/db";

/** Verify a branchId belongs to the given org. */
export async function verifyBranchAccess(branchId: string, orgId: string): Promise<boolean> {
  const branch = await db.branch.findFirst({
    where: { id: branchId, organizationId: orgId },
    select: { id: true },
  });
  return !!branch;
}

/** Verify a child belongs to the given org via its branch. */
export async function verifyChildAccess(childId: string, orgId: string): Promise<boolean> {
  const child = await db.child.findFirst({
    where: { id: childId, branch: { organizationId: orgId } },
    select: { id: true },
  });
  return !!child;
}

/** Get all branch IDs for an organization (for IN-clause filters). */
export async function getOrgBranchIds(orgId: string): Promise<string[]> {
  const branches = await db.branch.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  });
  return branches.map((b) => b.id);
}
