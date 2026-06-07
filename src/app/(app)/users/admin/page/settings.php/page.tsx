import { redirect } from "next/navigation";
import {
  legacyAdminSettingsRedirect,
  type LegacyAdminSettingsSearchParams,
} from "@/lib/legacy-admin-settings-redirect";

interface PageProps {
  searchParams: Promise<LegacyAdminSettingsSearchParams>;
}

export default async function LegacyAdminSettingsRedirectPage({
  searchParams,
}: PageProps) {
  redirect(legacyAdminSettingsRedirect(await searchParams));
}
