import {
  getNotificationTemplates,
  getSentNotifications,
} from "@/lib/actions/notification-templates";
import { NotificationSettingsClient } from "./notification-settings-client";

export default async function NotificationSettingsPage() {
  const [templatesResult, logsResult] = await Promise.all([
    getNotificationTemplates(),
    getSentNotifications({}),
  ]);

  return (
    <NotificationSettingsClient
      initialTemplates={templatesResult.data ?? []}
      initialLogs={logsResult.data ?? []}
    />
  );
}
