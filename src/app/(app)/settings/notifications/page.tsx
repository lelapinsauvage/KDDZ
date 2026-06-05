import {
  getLegacyNotificationLogs,
  getLegacyNotificationNatures,
  getLegacyNotificationSettings,
  getNotificationTemplates,
  getSentNotifications,
} from "@/lib/actions/notification-templates";
import { NotificationSettingsClient } from "./notification-settings-client";

export default async function NotificationSettingsPage() {
  const [
    templatesResult,
    logsResult,
    legacySettingsResult,
    legacyNaturesResult,
    legacyLogsResult,
  ] = await Promise.all([
    getNotificationTemplates(),
    getSentNotifications({}),
    getLegacyNotificationSettings(),
    getLegacyNotificationNatures(),
    getLegacyNotificationLogs(),
  ]);

  return (
    <NotificationSettingsClient
      initialTemplates={templatesResult.data ?? []}
      initialLogs={logsResult.data ?? []}
      initialLegacySettings={legacySettingsResult.data ?? []}
      initialLegacyNatures={legacyNaturesResult.data ?? []}
      initialLegacyLogs={legacyLogsResult.data ?? []}
    />
  );
}
