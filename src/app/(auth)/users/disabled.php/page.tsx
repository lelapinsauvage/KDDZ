import { LegacyDisabledPage } from "@/components/auth/legacy-disabled-page";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegacyUsersDisabledPhpPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  return (
    <LegacyDisabledPage
      initialName={firstParam(params.name) ?? ""}
      initialEmail={firstParam(params.email) ?? ""}
    />
  );
}
