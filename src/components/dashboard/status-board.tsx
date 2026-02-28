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
  semantic: "success" | "warning" | "error";
}> = [
  {
    key: "totalAttendance",
    label: "Total Attendance",
    icon: Users,
    href: "/daily-reports?status=submitted",
    semantic: "success",
  },
  {
    key: "totalAbsence",
    label: "Total Absence",
    icon: UserX,
    href: "/absent-reports",
    semantic: "warning",
  },
  {
    key: "missingDailyReports",
    label: "Missing Daily Reports",
    icon: FileWarning,
    href: "/daily-reports?status=missing",
    semantic: "error",
  },
  {
    key: "missingAbsentReports",
    label: "Missing Absent Reports",
    icon: AlertTriangle,
    href: "/absent-reports?status=missing",
    semantic: "error",
  },
];

/* Design system semantic colors */
const semanticStyles = {
  success: {
    iconBg: "bg-[#ECFDF5]",
    iconColor: "text-[#16A34A]",
    metric: "text-[#15803D]",
    ring: "border-[#16A34A]/20",
    dot: "bg-[#16A34A]",
  },
  warning: {
    iconBg: "bg-[#FFFBEB]",
    iconColor: "text-[#D97706]",
    metric: "text-[#B45309]",
    ring: "border-[#D97706]/20",
    dot: "bg-[#D97706]",
  },
  error: {
    iconBg: "bg-[#FEF2F2]",
    iconColor: "text-[#DC2626]",
    metric: "text-[#B91C1C]",
    ring: "border-[#DC2626]/20",
    dot: "bg-[#DC2626]",
  },
};

export function StatusBoard({ compliance }: StatusBoardProps) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Today&apos;s Compliance
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = compliance[card.key];
          const style = semanticStyles[card.semantic];
          const isAlarm = card.semantic === "error" && value > 0;

          return (
            <Link
              key={card.key}
              href={card.href}
              className={`relative flex flex-col items-center gap-2 sm:gap-2.5 rounded-xl border px-3 py-4 sm:px-4 sm:py-5 bg-card transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_4px_6px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 ${
                isAlarm
                  ? "border-[#DC2626]/30 bg-[#FEF2F2]"
                  : `border-border ${style.ring}`
              }`}
            >
              {isAlarm && (
                <div className="absolute top-2.5 right-2.5">
                  <div className="size-2.5 rounded-full bg-[#DC2626]" />
                  <div className="absolute inset-0 size-2.5 rounded-full bg-[#DC2626] animate-ping opacity-40" />
                </div>
              )}

              <div
                className={`flex size-10 items-center justify-center rounded-xl ${style.iconBg}`}
              >
                <Icon className={`size-5 ${style.iconColor}`} />
              </div>

              <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
                {card.label}
              </span>
              <span
                className={`text-xl font-bold tabular-nums ${style.metric}`}
              >
                {value}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
