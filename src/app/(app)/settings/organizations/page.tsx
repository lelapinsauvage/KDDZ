import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrganizations } from "@/lib/actions/organizations";
import { OrganizationsClient } from "./organizations-client";

export default async function OrganizationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/settings");

  const result = await getOrganizations();
  const organizations = result.success ? (result.data as OrganizationRow[]) : [];

  return <OrganizationsClient organizations={organizations} />;
}

export interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: Date;
  _count: { branches: number; users: number };
}
