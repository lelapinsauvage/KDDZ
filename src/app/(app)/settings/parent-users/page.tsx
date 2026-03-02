import { getParentUsers } from "@/lib/actions/parent-users";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { ParentUsersClient } from "./parent-users-client";

export default async function ParentUsersPage() {
  const { organizationId: orgId } = await requireOrg();

  const [parentUsersResult, childrenWithoutAccount] = await Promise.all([
    getParentUsers(),
    db.child.findMany({
      where: {
        isActive: true,
        branch: { organizationId: orgId },
        parentUsers: { none: {} },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        branch: { select: { name: true } },
        class: { select: { name: true } },
      },
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
    childFirstName: (u.child?.firstName ?? "") as string,
    childLastName: (u.child?.lastName ?? "") as string,
    branchName: (u.child?.branch?.name ?? "—") as string,
    className: (u.child?.class?.name ?? "—") as string,
    status: (u.isActive ? "Active" : "Inactive") as "Active" | "Inactive",
    createdAt: (u.createdAt as Date).toISOString().split("T")[0],
  }));

  const serializedChildrenWithout = childrenWithoutAccount.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    firstName: c.firstName,
    lastName: c.lastName,
    branchName: c.branch?.name ?? "—",
    className: c.class?.name ?? "—",
  }));

  return (
    <ParentUsersClient
      usersWithAccount={serializedUsers}
      childrenWithoutAccount={serializedChildrenWithout}
    />
  );
}
