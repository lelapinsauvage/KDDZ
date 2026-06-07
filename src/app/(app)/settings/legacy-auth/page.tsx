import { redirect } from "next/navigation";
import { getLegacyAuthSettings } from "@/lib/actions/legacy-auth-settings";
import { requireLegacyAdminPanelAccess } from "@/lib/legacy-system-action-permissions";
import { LegacyAuthSettingsClient } from "./legacy-auth-settings-client";

interface PageProps {
  searchParams: Promise<{
    tab?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LegacyAuthSettingsPage({
  searchParams,
}: PageProps) {
  try {
    await requireLegacyAdminPanelAccess();
  } catch {
    redirect("/forbidden.php");
  }

  const [settingsResult, params] = await Promise.all([
    getLegacyAuthSettings(),
    searchParams,
  ]);

  return (
    <LegacyAuthSettingsClient
      initialData={
        settingsResult.data ?? {
          sources: [],
          settings: [],
          levels: [],
        }
      }
      initialError={settingsResult.success ? null : (settingsResult.error ?? null)}
      initialTab={firstParam(params.tab)}
    />
  );
}
