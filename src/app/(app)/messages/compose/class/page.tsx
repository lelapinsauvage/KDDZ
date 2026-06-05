import { getClasses } from "@/lib/actions/classes";
import { ClassMessageClient } from "./class-message-client";

interface Props {
  searchParams: Promise<{ classId?: string }>;
}

export default async function ClassMessagePage({ searchParams }: Props) {
  const { classId } = await searchParams;
  const classesResult = await getClasses({ isActive: true });

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

  return <ClassMessageClient classes={classes} defaultClassId={classId} />;
}
