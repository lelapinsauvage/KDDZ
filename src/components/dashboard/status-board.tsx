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
  green: "bg-[#6B8F71]",
  amber: "bg-amber-500",
  red: "bg-red-500",
} as const;

const pillarThemes: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; iconBg: string; iconColor: string; cardBg: string; cardBorder: string; metricColor: string }
> = {
  Attendance: {
    icon: Users,
    iconBg: "bg-[#C35A2C]/10",
    iconColor: "text-[#C35A2C]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#C35A2C]",
  },
  Reports: {
    icon: FileText,
    iconBg: "bg-[#8B7355]/10",
    iconColor: "text-[#8B7355]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#8B7355]",
  },
  Staff: {
    icon: Briefcase,
    iconBg: "bg-[#6B8F71]/10",
    iconColor: "text-[#6B8F71]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#6B8F71]",
  },
  Finance: {
    icon: DollarSign,
    iconBg: "bg-[#B08968]/10",
    iconColor: "text-[#B08968]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#B08968]",
  },
  Health: {
    icon: Heart,
    iconBg: "bg-[#B07070]/10",
    iconColor: "text-[#B07070]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#B07070]",
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
            className={`relative flex min-w-[120px] flex-col items-center gap-2.5 rounded-2xl border px-4 py-5 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${theme.cardBg} ${theme.cardBorder}`}
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
