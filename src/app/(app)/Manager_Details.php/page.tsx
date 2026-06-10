import { notFound } from "next/navigation";
import { resolveLegacyStaffId } from "@/lib/legacy-staff";
import ManagerDetailsPage from "../employees/managers/[id]/page";
import NewManagerPage from "../employees/managers/new/page";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function LegacyManagerDetailsPage({
  searchParams,
}: PageProps) {
  const { id } = await searchParams;

  if (!id?.trim()) {
    return <NewManagerPage />;
  }

  const managerId = await resolveLegacyStaffId("manager", id);
  if (!managerId) {
    notFound();
  }

  return <ManagerDetailsPage params={Promise.resolve({ id: managerId })} />;
}
