import { notFound, redirect } from "next/navigation";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyManagerDetailsRedirect({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    redirect("/employees/managers");
  }

  const managerId = await resolveLegacyStaffId("manager", id);
  if (!managerId) {
    notFound();
  }

  redirect(`/employees/managers/${encodeURIComponent(managerId)}`);
}
