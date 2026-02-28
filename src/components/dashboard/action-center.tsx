import Link from "next/link";
import {
  DollarSign,
  AlertTriangle,
  Phone,
  Stethoscope,
  HeartPulse,
  ClipboardList,
  FileText,
  FilePlus,
  FileCheck,
} from "lucide-react";
import type { ActionCenterMetrics } from "@/lib/actions/dashboard";

interface ActionCenterProps {
  metrics: ActionCenterMetrics;
}

const gridItems: Array<{
  key: keyof ActionCenterMetrics;
  category: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  iconBg: string;
  iconColor: string;
  format?: "currency";
}> = [
  {
    key: "totalPayments",
    category: "Financial",
    label: "Total Payments Collected",
    icon: DollarSign,
    href: "/accounting",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    format: "currency",
  },
  {
    key: "accidentReports",
    category: "Medical",
    label: "Incident / Accident Reports",
    icon: AlertTriangle,
    href: "/medical/general?type=accidents",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600",
  },
  {
    key: "loggedCalls",
    category: "Comms",
    label: "Logged Calls",
    icon: Phone,
    href: "/medical/general?type=calls",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    key: "completedMedicalVisits",
    category: "Medical",
    label: "Completed Medical Visits",
    icon: Stethoscope,
    href: "/medical/general?type=visits",
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
  },
  {
    key: "missingMedicalVisits",
    category: "Compliance",
    label: "Missing Medical Visits",
    icon: HeartPulse,
    href: "/medical/general?status=missing",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-600",
  },
  {
    key: "missingAssessments",
    category: "Compliance",
    label: "Missing Assessments",
    icon: ClipboardList,
    href: "/assessments?status=missing",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-600",
  },
  {
    key: "pendingDailyReports",
    category: "Drafts",
    label: "Pending Daily Reports",
    icon: FileText,
    href: "/daily-reports?status=draft",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  {
    key: "pendingMedicalReports",
    category: "Drafts",
    label: "Pending Medical Reports",
    icon: FilePlus,
    href: "/medical/general?status=draft",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
  {
    key: "pendingAssessments",
    category: "Drafts",
    label: "Pending Assessments",
    icon: FileCheck,
    href: "/assessments?status=draft",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
];

export function ActionCenter({ metrics }: ActionCenterProps) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="px-5 py-3 border-b border-border/30">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Action Center
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/30">
        {gridItems.map((item) => {
          const Icon = item.icon;
          const value = metrics[item.key];
          const display =
            item.format === "currency"
              ? `$${value.toLocaleString()}`
              : value.toLocaleString();

          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 bg-card px-5 py-4 transition-colors hover:bg-muted/30"
            >
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
                <Icon className={`size-5 ${item.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.category}
                </span>
                <p className="text-sm font-medium text-foreground truncate">
                  {item.label}
                </p>
              </div>
              <span className="text-lg font-bold text-foreground tabular-nums">
                {display}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
