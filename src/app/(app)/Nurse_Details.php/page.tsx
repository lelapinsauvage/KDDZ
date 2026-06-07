import { notFound, redirect } from "next/navigation";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyNurseDetailsRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/employees/nurses/new");
  }

  const nurseId = await resolveLegacyStaffId("nurse", id);
  if (!nurseId) {
    notFound();
  }

  redirect(`/employees/nurses/${encodeURIComponent(nurseId)}`);
}
