import { notFound } from "next/navigation";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";
import TeacherDetailsPage from "../employees/teachers/[id]/page";
import NewTeacherPage from "../employees/teachers/new/page";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyTeacherDetailsPage({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    return <NewTeacherPage />;
  }

  const teacherId = await resolveLegacyStaffId("teacher", id);
  if (!teacherId) {
    notFound();
  }

  return <TeacherDetailsPage params={Promise.resolve({ id: teacherId })} />;
}
