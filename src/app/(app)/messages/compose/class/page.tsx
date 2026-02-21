import { getClasses } from "@/lib/actions/classes";
import { ClassMessageClient } from "./class-message-client";

export default async function ClassMessagePage() {
  const classesResult = await getClasses({ isActive: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return <ClassMessageClient classes={classes} />;
}
