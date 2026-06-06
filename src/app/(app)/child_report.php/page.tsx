import { notFound, redirect } from "next/navigation";
import { resolveLegacyChildId } from "@/lib/legacy-child";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyChildReportRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/daily-reports");
  }

  const childId = await resolveLegacyChildId(id);
  if (!childId) {
    notFound();
  }

  redirect(`/children/${encodeURIComponent(childId)}/report`);
}
