import { notFound, redirect } from "next/navigation";
import { resolveLegacyClassId } from "@/lib/legacy-class";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyClassMessagePortalRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/messages/compose/class");
  }

  const classId = await resolveLegacyClassId(id);
  if (!classId) {
    notFound();
  }

  redirect(`/messages/compose/class?classId=${encodeURIComponent(classId)}`);
}
