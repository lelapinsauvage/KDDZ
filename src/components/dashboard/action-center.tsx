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

/* Module-accent color mapping from design system */
const gridItems: Array<{
  key: keyof ActionCenterMetrics;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  iconBg: string;
  iconColor: string;
  format?: "currency";
}> = [
  {
    key: "totalPayments",
    label: "Payments Collected",
    icon: DollarSign,
    href: "/accounting",
    iconBg: "bg-[#EEF2FF]",
    iconColor: "text-[#4F46E5]",
    format: "currency",
  },
  {
    key: "accidentReports",
    label: "Incident Reports",
    icon: AlertTriangle,
    href: "/medical/general?type=accidents",
    iconBg: "bg-[#FEF2F2]",
    iconColor: "text-[#DC2626]",
  },
  {
    key: "loggedCalls",
    label: "Logged Calls",
    icon: Phone,
    href: "/medical/general?type=calls",
    iconBg: "bg-[#FFF1F2]",
    iconColor: "text-[#E11D48]",
  },
  {
    key: "completedMedicalVisits",
    label: "Medical Visits",
    icon: Stethoscope,
    href: "/medical/general?type=visits",
    iconBg: "bg-[#ECFDF5]",
    iconColor: "text-[#059669]",
  },
  {
    key: "missingMedicalVisits",
    label: "Missing Visits",
    icon: HeartPulse,
    href: "/medical/general?status=missing",
    iconBg: "bg-[#FFFBEB]",
    iconColor: "text-[#D97706]",
  },
  {
    key: "missingAssessments",
    label: "Missing Assessments",
    icon: ClipboardList,
    href: "/assessments?status=missing",
    iconBg: "bg-[#FFFBEB]",
    iconColor: "text-[#D97706]",
  },
  {
    key: "pendingDailyReports",
    label: "Pending Daily Reports",
    icon: FileText,
    href: "/daily-reports?status=draft",
    iconBg: "bg-[#EFF6FF]",
    iconColor: "text-[#2563EB]",
  },
  {
    key: "pendingMedicalReports",
    label: "Pending Medical Reports",
    icon: FilePlus,
    href: "/medical/general?status=draft",
    iconBg: "bg-[#EFF6FF]",
    iconColor: "text-[#2563EB]",
  },
  {
    key: "pendingAssessments",
    label: "Pending Assessments",
    icon: FileCheck,
    href: "/assessments?status=draft",
    iconBg: "bg-[#F5F3FF]",
    iconColor: "text-[#7C3AED]",
  },
];

export function ActionCenter({ metrics }: ActionCenterProps) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Action Center
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              className="group flex items-center gap-3 sm:gap-3.5 rounded-sm border border-border bg-card px-3 py-3.5 sm:px-4 sm:py-4 min-h-[44px] shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[0_4px_6px_rgba(15,23,42,0.06),0_2px_4px_rgba(15,23,42,0.04)] hover:-translate-y-0.5"
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${item.iconBg}`}
              >
                <Icon className={`size-5 ${item.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
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
