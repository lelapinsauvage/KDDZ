import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AppContextProvider } from "@/components/providers/app-context-provider"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getHeaderAlarmCounts, getNotifications } from "@/lib/actions/alarms"
import { getUnreadMessageCount } from "@/lib/actions/messages"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, branches, years] = await Promise.all([
    auth(),
    db.branch.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.schoolYear.findMany({ select: { id: true, label: true }, orderBy: { startDate: "desc" } }),
  ])

  const defaultBranchId = session?.user?.branchId ?? null

  // Fetch header notification data in parallel
  const [alarmCountsResult, notificationsResult, messageCountResult] =
    await Promise.all([
      getHeaderAlarmCounts(),
      getNotifications({ limit: 8 }),
      getUnreadMessageCount().catch(() => ({ success: true, data: 0 })),
    ]);

  const alarmCounts = (alarmCountsResult.data as {
    birthdays: number;
    assessments: number;
    medical: number;
    totalAlarms: number;
  }) ?? { birthdays: 0, assessments: 0, medical: 0, totalAlarms: 0 };

  const notificationData = (notificationsResult.success
    ? notificationsResult.data
    : { notifications: [], unreadCount: 0 }) as {
    notifications: Array<{
      id: string;
      title: string;
      body: string | null;
      isRead: boolean;
      createdAt: Date;
    }>;
    unreadCount: number;
  };

  const messageCount =
    typeof messageCountResult.data === "number" ? messageCountResult.data : 0;

  const serializedNotifications = notificationData.notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
  }));

  return (
    <AppContextProvider
      branches={branches}
      years={years}
      defaultBranchId={defaultBranchId}
    >
      <SidebarProvider
        defaultOpen
        style={
          {
            "--sidebar-width": "270px",
          } as React.CSSProperties
        }
      >
        {/* Fixed header spanning full width */}
        <Header
          alarmCounts={alarmCounts}
          notifications={serializedNotifications}
          unreadNotificationCount={notificationData.unreadCount}
          unreadMessageCount={messageCount}
        />

        {/* Sidebar + main content area below header */}
        <AppSidebar />
        <SidebarInset className="mt-[46px] flex min-h-[calc(100svh-46px)] flex-col">
          {/* Scrollable content area */}
          <div className="flex-1 bg-[#eef1f5]">
            {children}
          </div>

          {/* Footer */}
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </AppContextProvider>
  )
}
