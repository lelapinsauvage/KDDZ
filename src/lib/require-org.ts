import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface OrgContext {
  userId: string;
  organizationId: string;
  branchId: string | null;
  role: "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
}

/** For read functions — throws on missing org (caught by try/catch). */
export async function requireOrg(): Promise<OrgContext> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  let orgId = session.user.organizationId as string | null | undefined;
  let branchId = (session.user.branchId ?? null) as string | null;

  // Fallback 1: if no orgId but have branchId, look up from branch
  if (!orgId && branchId) {
    const branch = await db.branch.findUnique({
      where: { id: branchId },
      select: { organizationId: true },
    });
    if (branch?.organizationId) orgId = branch.organizationId;
  }

  // Fallback 2: if still no orgId, look up user record in DB (stale JWT)
  if (!orgId) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        organizationId: true,
        branchId: true,
        branch: { select: { organizationId: true } },
      },
    });
    if (dbUser) {
      orgId = dbUser.organizationId ?? dbUser.branch?.organizationId ?? null;
      if (!branchId) branchId = dbUser.branchId;
    }
  }

  // Fallback 3: if user has no org at all, pick the first org in the system
  if (!orgId) {
    const firstOrg = await db.organization.findFirst({
      select: { id: true },
    });
    if (firstOrg) orgId = firstOrg.id;
  }

  if (!orgId) throw new Error("No organization context");
  return {
    userId: session.user.id,
    organizationId: orgId,
    branchId,
    role: session.user.role,
  };
}

/** For write functions — returns error object instead of throwing. */
export async function requireOrgSafe(): Promise<
  | { ok: true; ctx: OrgContext }
  | { ok: false; error: string }
> {
  try {
    const ctx = await requireOrg();
    return { ok: true, ctx };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
