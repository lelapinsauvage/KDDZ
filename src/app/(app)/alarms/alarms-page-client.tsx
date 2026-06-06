"use client";

import { PageHeader } from "@/components/layout/page-header";
import { NotificationCenter } from "@/components/alarms/notification-center";
import type { ActionableAlarmGroups } from "@/lib/actions/notification-center";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  StaffReceiptAlarmsClient,
  type StaffReceiptAlarm,
  type StaffReceiptAlarmHistory,
} from "./_components/staff-receipt-alarms-client";

interface AlarmsPageClientProps {
  dashboardData: ActionableAlarmGroups;
  branches: { id: string; name: string }[];
  notificationAlarms: StaffReceiptAlarm[];
  notificationHistory: StaffReceiptAlarmHistory[];
}

export function AlarmsPageClient({
  dashboardData,
  branches,
  notificationAlarms,
  notificationHistory,
}: AlarmsPageClientProps) {
  return (
    <>
      <PageHeader
        title="Notifications"
        breadcrumbs={[{ label: "Notifications" }]}
      />
      <div className="space-y-4 p-4 md:p-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="general">General Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <NotificationCenter
              data={dashboardData}
              showHeader={false}
              bodyClassName="space-y-5"
            />
          </TabsContent>

          <TabsContent value="general">
            <StaffReceiptAlarmsClient
              family="general"
              alarms={notificationAlarms}
              history={notificationHistory}
              branches={branches}
              showHeader={false}
              showGenerate={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
