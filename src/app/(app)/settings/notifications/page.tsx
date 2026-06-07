import {
  getLegacyNotificationLogs,
  getLegacyNotificationNatures,
  getLegacyNotificationSettings,
  getLegacyEmailLevels,
  getNotificationTemplates,
  getSentNotifications,
} from "@/lib/actions/notification-templates";
import { NotificationSettingsClient } from "./notification-settings-client";

interface PageProps {
  searchParams: Promise<{
    tab?: string | string[];
    template?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NotificationSettingsPage({
  searchParams,
}: PageProps) {
  const [
    templatesResult,
    logsResult,
    legacySettingsResult,
    legacyNaturesResult,
    legacyLogsResult,
    legacyEmailLevelsResult,
    params,
  ] = await Promise.all([
    getNotificationTemplates(),
    getSentNotifications({}),
    getLegacyNotificationSettings(),
    getLegacyNotificationNatures(),
    getLegacyNotificationLogs(),
    getLegacyEmailLevels(),
    searchParams,
  ]);

  return (
    <NotificationSettingsClient
      initialTemplates={templatesResult.data ?? []}
      initialLogs={logsResult.data ?? []}
      initialLegacySettings={legacySettingsResult.data ?? []}
      initialLegacyNatures={legacyNaturesResult.data ?? []}
      initialLegacyLogs={legacyLogsResult.data ?? []}
      initialLegacyEmailLevels={legacyEmailLevelsResult.data ?? []}
      initialTab={firstParam(params.tab)}
      initialTemplateCategory={firstParam(params.template)}
    />
  );
}
