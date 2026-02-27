import { auth } from "@/lib/auth";

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
  if (!session.user.organizationId) throw new Error("No organization context");
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    branchId: session.user.branchId ?? null,
    role: session.user.role,
  };
}

/** For write functions — returns error object instead of throwing. */
export async function requireOrgSafe(): Promise<
  | { ok: true; ctx: OrgContext }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  if (!session.user.organizationId) return { ok: false, error: "No organization context" };
  return {
    ok: true,
    ctx: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      branchId: session.user.branchId ?? null,
      role: session.user.role,
    },
  };
}
