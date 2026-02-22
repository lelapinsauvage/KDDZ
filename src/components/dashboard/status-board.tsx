import Link from "next/link";
import {
  Users,
  FileText,
  Briefcase,
  DollarSign,
  Heart,
} from "lucide-react";
import type { PillarStatus } from "@/lib/actions/dashboard";

interface Pillar {
  label: string;
  metric: string;
  status: PillarStatus;
  href: string;
}

interface StatusBoardProps {
  pillars: Pillar[];
}

const statusDot = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
} as const;

const pillarThemes: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; iconBg: string; iconColor: string; cardBg: string; cardBorder: string; metricColor: string }
> = {
  Attendance: {
    icon: Users,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    cardBg: "bg-gradient-to-br from-teal-50/80 to-cyan-50/40",
    cardBorder: "border-teal-200/50",
    metricColor: "text-teal-700",
  },
  Reports: {
    icon: FileText,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    cardBg: "bg-gradient-to-br from-violet-50/80 to-purple-50/40",
    cardBorder: "border-violet-200/50",
    metricColor: "text-violet-700",
  },
  Staff: {
    icon: Briefcase,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    cardBg: "bg-gradient-to-br from-sky-50/80 to-blue-50/40",
    cardBorder: "border-sky-200/50",
    metricColor: "text-sky-700",
  },
  Finance: {
    icon: DollarSign,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    cardBg: "bg-gradient-to-br from-amber-50/80 to-orange-50/40",
    cardBorder: "border-amber-200/50",
    metricColor: "text-amber-700",
  },
  Health: {
    icon: Heart,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    cardBg: "bg-gradient-to-br from-rose-50/80 to-pink-50/40",
    cardBorder: "border-rose-200/50",
    metricColor: "text-rose-700",
  },
};

const defaultTheme = pillarThemes.Attendance;

export function StatusBoard({ pillars }: StatusBoardProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:grid md:grid-cols-5">
      {pillars.map((pillar) => {
        const theme = pillarThemes[pillar.label] ?? defaultTheme;
        const Icon = theme.icon;
        const dot = statusDot[pillar.status];
        const isRed = pillar.status === "red";

        return (
          <Link
            key={pillar.label}
            href={pillar.href}
            className={`relative flex min-w-[120px] flex-col items-center gap-2.5 rounded-2xl border px-4 py-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${theme.cardBg} ${theme.cardBorder}`}
          >
            {/* Status indicator dot — top-right corner */}
            <div className="absolute top-2.5 right-2.5">
              <div className={`size-2.5 rounded-full ${dot}`} />
              {isRed && (
                <div className={`absolute inset-0 size-2.5 rounded-full ${dot} animate-ping opacity-40`} />
              )}
            </div>

            {/* Icon with colored background */}
            <div className={`flex size-10 items-center justify-center rounded-xl ${theme.iconBg}`}>
              <Icon className={`size-5 ${theme.iconColor}`} />
            </div>

            <span className="text-xs font-medium text-muted-foreground">
              {pillar.label}
            </span>
            <span className={`text-sm font-bold ${theme.metricColor}`}>
              {pillar.metric}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
