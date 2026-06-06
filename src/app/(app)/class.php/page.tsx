import { notFound, redirect } from "next/navigation";
import { resolveLegacyClassId } from "@/lib/legacy-class";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyClassFormRedirect({ searchParams }: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/classes?new=1");
  }

  const classId = await resolveLegacyClassId(id);
  if (!classId) {
    notFound();
  }

  redirect(`/classes?edit=${encodeURIComponent(classId)}`);
}
