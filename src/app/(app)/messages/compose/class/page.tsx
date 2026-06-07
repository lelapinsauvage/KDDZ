import { getClasses } from "@/lib/actions/classes";
import { getChildren } from "@/lib/actions/children";
import { getLegacyNotificationNatures } from "@/lib/actions/notification-templates";
import { legacyNatureRowsToMessageOptions } from "@/lib/message-compose-options";
import { ClassMessageClient } from "./class-message-client";

interface Props {
  searchParams: Promise<{ classId?: string }>;
}

export default async function ClassMessagePage({ searchParams }: Props) {
  const { classId } = await searchParams;
  const [classesResult, childrenResult, naturesResult] = await Promise.all([
    getClasses({ isActive: true }),
    getChildren({ pageSize: "all" }),
    getLegacyNotificationNatures(),
  ]);

  const rawClasses = (classesResult.data ?? []) as Array<{
    id: string;
    name: string;
    branch: { id: string; name: string };
    _count: { children: number };
  }>;

  const classes = rawClasses.map((cls) => ({
    id: cls.id,
    name: cls.name,
    branchName: cls.branch.name,
    childCount: cls._count.children,
  }));
  const rawChildren = (childrenResult.children ?? []) as Array<{
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    classId: string | null;
  }>;
  const children = rawChildren.map((child) => ({
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    isActive: child.isActive,
    classId: child.classId,
  }));
  const natures = legacyNatureRowsToMessageOptions(naturesResult.data);

  return (
    <ClassMessageClient
      classes={classes}
      classChildrenList={children}
      natures={natures}
      defaultClassId={classId}
    />
  );
}
