import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { ChildSubNav } from "@/components/children/child-sub-nav";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export default async function ChildLayout({ params, children }: Props) {
  const { id } = await params;

  const child = await getChild(id);
  if (!child) {
    notFound();
  }

  return (
    <div>
      <ChildSubNav
        childId={id}
        childName={`${child.firstName} ${child.lastName}`}
      />
      {children}
    </div>
  );
}
