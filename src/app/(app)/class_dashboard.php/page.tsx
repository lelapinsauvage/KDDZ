import { notFound, redirect } from "next/navigation";
import { resolveLegacyClassId } from "@/lib/legacy-class";

interface PageProps {
  searchParams: Promise<{ db_curr?: string; id?: string }>;
}

export default async function LegacyClassDashboardRedirect({ searchParams }: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/classes");
  }

  const classId = await resolveLegacyClassId(id);
  if (!classId) notFound();

  redirect(`/classes/${encodeURIComponent(classId)}`);
}
