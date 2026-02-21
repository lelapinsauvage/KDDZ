import { getParentUsers } from "@/lib/actions/parent-users";
import { db } from "@/lib/db";
import { ParentUsersClient } from "./parent-users-client";

export default async function ParentUsersPage() {
  const [parentUsersResult, children] = await Promise.all([
    getParentUsers(),
    db.child.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawData = (parentUsersResult.success ? parentUsersResult.data : { parentUsers: [] }) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawUsers = (rawData.parentUsers ?? []) as Array<any>;

  const serializedUsers = rawUsers.map((u) => ({
    id: u.id as string,
    username: u.username as string,
    childName: u.child
      ? `${u.child.firstName} ${u.child.lastName}`
      : "—",
    childId: u.childId as string,
    branchName: (u.child?.branch?.name ?? "—") as string,
    status: (u.isActive ? "Active" : "Inactive") as "Active" | "Inactive",
    createdAt: (u.createdAt as Date).toISOString().split("T")[0],
  }));

  const childOptions = children.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  return (
    <ParentUsersClient
      users={serializedUsers}
      children={childOptions}
    />
  );
}
