import { LegacyPublicProfilePage } from "@/components/auth/legacy-public-profile-page";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

export default function LegacyProfilePhpPage({ searchParams }: PageProps) {
  return (
    <LegacyPublicProfilePage
      searchParams={searchParams}
      legacyPath="/profile.php"
    />
  );
}
