import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    lid?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegacyLevelsRedirect({ searchParams }: PageProps) {
  const params = await searchParams;
  const legacyLevelId = firstParam(params.lid);
  const suffix = legacyLevelId
    ? `?level=${encodeURIComponent(legacyLevelId)}`
    : "";

  redirect(`/settings/access-control${suffix}`);
}
