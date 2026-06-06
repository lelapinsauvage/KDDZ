import { redirect } from "next/navigation";
import { withLegacySearchQuery } from "@/lib/legacy-query";

export default async function LegacyDoctorsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;

  redirect(withLegacySearchQuery("/employees/doctors", q));
}
