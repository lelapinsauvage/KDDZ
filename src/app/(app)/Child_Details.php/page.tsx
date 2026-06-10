import { notFound, redirect } from "next/navigation";

import { resolveLegacyChildId } from "@/lib/legacy-child";

import ChildDetailPage from "../children/[id]/page";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyChildDetailsRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/children");
  }

  const childId = await resolveLegacyChildId(id);
  if (!childId) {
    notFound();
  }

  return <ChildDetailPage params={Promise.resolve({ id: childId })} />;
}
