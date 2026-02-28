import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrganization } from "@/lib/actions/organizations";
import { OrgDetailClient } from "./org-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/settings");

  const { id } = await params;
  const result = await getOrganization(id);

  if (!result.success || !result.data) {
    redirect("/settings/organizations");
  }

  return <OrgDetailClient organization={result.data as OrgDetail} />;
}

export interface OrgBranch {
  id: string;
  name: string;
  isActive: boolean;
  _count: { children: number; teachers: number };
}

export interface OrgUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  branch: { id: string; name: string } | null;
}

export interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: Date;
  branches: OrgBranch[];
  users: OrgUser[];
  _count: { branches: number; users: number; schoolYears: number };
}
