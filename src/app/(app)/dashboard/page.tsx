import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMorningBriefing } from "@/lib/actions/dashboard";
import { StatusBoard } from "@/components/dashboard/status-board";
import { ActionCenter } from "@/components/dashboard/action-center";
import { TodayMenuWidget } from "@/components/dashboard/today-menu-widget";
import { WeeklyAttendanceChart } from "@/components/dashboard/weekly-attendance-chart";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { Sun, Moon, Sunrise } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (session?.user?.role === "TEACHER") {
    redirect("/today");
  }

  const briefing = await getMorningBriefing();
  const userName = session?.user?.name?.split(" ")[0] || "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const GreetingIcon =
    hour < 12 ? Sunrise : hour < 17 ? Sun : Moon;

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pillars = [
    {
      label: "Attendance",
      metric: `${briefing.attendance.present}/${briefing.attendance.total}`,
      status: briefing.attendance.status,
      href: "/daily-reports",
    },
    {
      label: "Reports",
      metric: `${briefing.reports.submitted}/${briefing.reports.total}`,
      status: briefing.reports.status,
      href: "/daily-reports",
    },
    {
      label: "Staff",
      metric: `${briefing.staff.present}/${briefing.staff.total}`,
      status: briefing.staff.status,
      href: "/employees/teachers",
    },
    {
      label: "Finance",
      metric: briefing.finance.overdueCount === 0
        ? "OK"
        : `${briefing.finance.overdueCount} due`,
      status: briefing.finance.status,
      href: "/accounting",
    },
    {
      label: "Health",
      metric: briefing.health.issues === 0 ? "OK" : `${briefing.health.issues} issue${briefing.health.issues > 1 ? "s" : ""}`,
      status: briefing.health.status,
      href: "/medical/general",
    },
  ];

  const attentionSummary =
    briefing.totalAttentionItems === 0
      ? "Everything looks good today — no items need your attention."
      : briefing.totalAttentionItems === 1
        ? "Just 1 thing needs a quick look."
        : `${briefing.totalAttentionItems} things could use your attention today.`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Greeting */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <GreetingIcon className="size-6 text-amber-500" />
            {greeting}, {userName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {attentionSummary}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{todayFormatted}</p>
      </div>

      {/* Status pillars */}
      <StatusBoard pillars={pillars} />

      {/* Action items */}
      <ActionCenter items={briefing.actionItems} />

      {/* Menu + Weekly chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TodayMenuWidget {...briefing.todayMenu} />
        <WeeklyAttendanceChart data={briefing.weeklyAttendance} />
      </div>

      {/* Insights */}
      <InsightsPanel insights={briefing.insights} />
    </div>
  );
}
