import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    q?: string | string[];
    uid?: string | string[];
    user?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegacyAdminUsersRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const query = firstParam(params.q) ?? firstParam(params.uid) ?? firstParam(params.user);
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";

  redirect(`/settings/legacy-users${suffix}`);
}
