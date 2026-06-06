import { notFound } from "next/navigation";
import { getParentUser } from "@/lib/actions/parent-users";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { ParentUserDetailClient } from "./parent-user-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ParentUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { organizationId: orgId } = await requireOrg();

  const [parentUserResult, children] = await Promise.all([
    getParentUser(id),
    db.child.findMany({
      where: { isActive: true, branch: { organizationId: orgId } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  if (!parentUserResult.success || !parentUserResult.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = parentUserResult.data as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parentContacts = (user.child?.parents ?? []).map((p: any) => ({
    type: p.type as string,
    name: [p.firstName, p.lastName].filter(Boolean).join(" ") || null,
    phone: p.phone || p.mobile || null,
    email: p.email || null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relativeContacts = (user.child?.relatives ?? []).map((r: any) => ({
    name: r.name as string,
    relation: (r.relation ?? null) as string | null,
    phone: (r.phone ?? null) as string | null,
    isAuthorized: r.isAuthorized as boolean,
  }));

  const serializedUser = {
    id: user.id as string,
    username: user.username as string,
    childId: user.childId as string,
    childName: user.child
      ? `${user.child.firstName} ${user.child.lastName}`
      : "—",
    childFirstName: (user.child?.firstName ?? "") as string,
    childLastName: (user.child?.lastName ?? "") as string,
    childClassName: (user.child?.class?.name ?? null) as string | null,
    childBranchName: (user.child?.branch?.name ?? null) as string | null,
    isActive: user.isActive as boolean,
    createdAt: (user.createdAt as Date).toISOString().split("T")[0],
    updatedAt: (user.updatedAt as Date).toISOString().split("T")[0],
    parents: parentContacts as Array<{
      type: string;
      name: string | null;
      phone: string | null;
      email: string | null;
    }>,
    relatives: relativeContacts as Array<{
      name: string;
      relation: string | null;
      phone: string | null;
      isAuthorized: boolean;
    }>,
  };

  const childOptions = children.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  return (
    <ParentUserDetailClient
      parentUser={serializedUser}
      childrenList={childOptions}
    />
  );
}
