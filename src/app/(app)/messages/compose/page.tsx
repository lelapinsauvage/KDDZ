import { getBranches } from "@/lib/actions/branches";
import { getChildren } from "@/lib/actions/children";
import { getClasses } from "@/lib/actions/classes";
import { getLegacyNotificationNatures } from "@/lib/actions/notification-templates";
import { db } from "@/lib/db";
import { legacyNatureRowsToMessageOptions } from "@/lib/message-compose-options";
import { requireOrg } from "@/lib/require-org";
import { ComposeClient } from "./compose-client";

export default async function ComposeMessagePage() {
  const { organizationId: orgId } = await requireOrg();
  const [branchesRes, childrenRes, classesRes, naturesRes, rawTeachers] =
    await Promise.all([
      getBranches(),
      getChildren({ status: "ACTIVE", pageSize: "all" }),
      getClasses({ isActive: true }),
      getLegacyNotificationNatures(),
      db.teacher.findMany({
        where: { isActive: true, branch: { organizationId: orgId } },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          branch: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
    ]);

  const rawBranches = (branchesRes.data ?? []) as Array<{
    id: string;
    name: string;
  }>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childData = (childrenRes as any)?.data ?? childrenRes;
  const rawChildren = (
    Array.isArray(childData) ? childData : childData?.children ?? []
  ) as Array<{
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    branch?: { id: string; name: string } | null;
    class?: { id: string; name: string } | null;
  }>;

  const rawClasses = (classesRes.data ?? []) as Array<{
    id: string;
    name: string;
    branch: { id: string; name: string };
  }>;
  const linkedUserIds = rawTeachers
    .map((teacher) => teacher.userId)
    .filter((id): id is string => Boolean(id));
  const teacherEmails = rawTeachers
    .map((teacher) => teacher.email?.trim())
    .filter((email): email is string => Boolean(email));
  const matchedUsers =
    linkedUserIds.length > 0 || teacherEmails.length > 0
      ? await db.user.findMany({
          where: {
            organizationId: orgId,
            isActive: true,
            OR: [
              ...(linkedUserIds.length > 0 ? [{ id: { in: linkedUserIds } }] : []),
              ...(teacherEmails.length > 0 ? [{ email: { in: teacherEmails } }] : []),
            ],
          },
          select: { id: true, email: true },
        })
      : [];
  const userIds = new Set(matchedUsers.map((user) => user.id));
  const userIdByEmail = new Map(
    matchedUsers
      .filter((user) => Boolean(user.email))
      .map((user) => [user.email.toLowerCase(), user.id]),
  );

  const branches = rawBranches.map((b) => ({ id: b.id, name: b.name }));

  const children = rawChildren.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    isActive: c.isActive,
    branchId: c.branch?.id ?? null,
    branchName: c.branch?.name ?? null,
    classId: c.class?.id ?? null,
    className: c.class?.name ?? null,
  }));

  const classes = rawClasses.map((cls) => ({
    id: cls.id,
    name: cls.name,
    branchId: cls.branch.id,
    branchName: cls.branch.name,
  }));
  const teachers = rawTeachers
    .map((teacher) => {
      const userId =
        teacher.userId && userIds.has(teacher.userId)
          ? teacher.userId
          : userIdByEmail.get(teacher.email?.trim().toLowerCase() ?? "");
      if (!userId) return null;
      return {
        id: teacher.id,
        userId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        branchId: teacher.branch?.id ?? null,
        branchName: teacher.branch?.name ?? null,
        classId: teacher.class?.id ?? null,
        className: teacher.class?.name ?? null,
      };
    })
    .filter((teacher): teacher is NonNullable<typeof teacher> => Boolean(teacher));
  const natures = legacyNatureRowsToMessageOptions(naturesRes.data);

  return (
    <ComposeClient
      branches={branches}
      childrenList={children}
      classes={classes}
      teachers={teachers}
      natures={natures}
    />
  );
}
