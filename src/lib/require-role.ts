import { requireOrg, type OrgContext } from "./require-org";
type Role = OrgContext["role"];

export async function requireRole(...allowedRoles: Role[]): Promise<OrgContext> {
  const ctx = await requireOrg();
  if (!allowedRoles.includes(ctx.role)) {
    throw new Error("Forbidden: insufficient permissions");
  }
  return ctx;
}

export function isAdminRole(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
