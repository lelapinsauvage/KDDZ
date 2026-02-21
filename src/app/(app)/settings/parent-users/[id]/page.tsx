import { notFound } from "next/navigation";
import { getParentUser } from "@/lib/actions/parent-users";
import { db } from "@/lib/db";
import { ParentUserDetailClient } from "./parent-user-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ParentUserDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [parentUserResult, children] = await Promise.all([
    getParentUser(id),
    db.child.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  if (!parentUserResult.success || !parentUserResult.data) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = parentUserResult.data as any;

  const serializedUser = {
    id: user.id as string,
    username: user.username as string,
    childId: user.childId as string,
    childName: user.child
      ? `${user.child.firstName} ${user.child.lastName}`
      : "—",
    isActive: user.isActive as boolean,
    createdAt: (user.createdAt as Date).toISOString().split("T")[0],
  };

  const childOptions = children.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  return (
    <ParentUserDetailClient
      parentUser={serializedUser}
      children={childOptions}
    />
  );
}
