import { redirect } from "next/navigation";
import { withLegacySearchQuery } from "@/lib/legacy-query";

interface PageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function LegacyZonesManagementRedirect({ searchParams }: PageProps) {
  const { q } = await searchParams;
  redirect(withLegacySearchQuery("/settings/zones", q));
}
