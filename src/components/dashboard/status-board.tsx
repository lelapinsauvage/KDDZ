import Link from "next/link";
import {
  Users,
  UserX,
  FileWarning,
  AlertTriangle,
} from "lucide-react";
import type { DailyComplianceStats } from "@/lib/actions/dashboard";

interface StatusBoardProps {
  compliance: DailyComplianceStats;
}

const cards: Array<{
  key: keyof DailyComplianceStats;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  highlight?: boolean;
  iconBg: string;
  iconColor: string;
  metricColor: string;
}> = [
  {
    key: "totalAttendance",
    label: "Total Attendance",
    icon: Users,
    href: "/daily-reports?status=submitted",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    metricColor: "text-emerald-600",
  },
  {
    key: "totalAbsence",
    label: "Total Absence",
    icon: UserX,
    href: "/absent-reports",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    metricColor: "text-amber-600",
  },
  {
    key: "missingDailyReports",
    label: "Missing Daily Reports",
    icon: FileWarning,
    href: "/daily-reports?status=missing",
    highlight: true,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600",
    metricColor: "text-red-600",
  },
  {
    key: "missingAbsentReports",
    label: "Missing Absent Reports",
    icon: AlertTriangle,
    href: "/absent-reports?status=missing",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-600",
    metricColor: "text-orange-600",
  },
];

export function StatusBoard({ compliance }: StatusBoardProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = compliance[card.key];
        const isHighlighted = card.highlight && value > 0;

        return (
          <Link
            key={card.key}
            href={card.href}
            className={`relative flex flex-col items-center gap-2.5 rounded-2xl border px-4 py-5 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${
              isHighlighted
                ? "border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-950/20"
                : "border-border/40 bg-card"
            }`}
          >
            {isHighlighted && (
              <div className="absolute top-2.5 right-2.5">
                <div className="size-2.5 rounded-full bg-red-500" />
                <div className="absolute inset-0 size-2.5 rounded-full bg-red-500 animate-ping opacity-40" />
              </div>
            )}

            <div className={`flex size-10 items-center justify-center rounded-xl ${card.iconBg}`}>
              <Icon className={`size-5 ${card.iconColor}`} />
            </div>

            <span className="text-xs font-medium text-muted-foreground text-center">
              {card.label}
            </span>
            <span className={`text-lg font-bold ${card.metricColor}`}>
              {value}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
