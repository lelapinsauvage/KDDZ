import { notFound, redirect } from "next/navigation";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyTeacherDetailsRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/employees/teachers/new");
  }

  const teacherId = await resolveLegacyStaffId("teacher", id);
  if (!teacherId) {
    notFound();
  }

  redirect(`/employees/teachers/${encodeURIComponent(teacherId)}`);
}
