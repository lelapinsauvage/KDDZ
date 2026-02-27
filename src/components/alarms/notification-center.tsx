"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Cake,
  Syringe,
  Heart,
  Pill,
  DollarSign,
  Calendar,
  Shield,
  FileText,
  MessageSquare,
  ChevronRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AlarmActionCard } from "./alarm-action-card";
import type { ActionableAlarm, ActionableAlarmGroups } from "@/lib/actions/notification-center";

interface NotificationCenterProps {
  data: ActionableAlarmGroups;
}

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string; label: string; href: string }> = {
  BIRTHDAY:    { icon: Cake,          color: "text-[#B07070]",  bg: "bg-[#B07070]/10",  label: "Birthdays",    href: "/alarms/birthdays" },
  VACCINATION: { icon: Syringe,       color: "text-[#6B8F71]",  bg: "bg-[#6B8F71]/10",  label: "Vaccinations", href: "/alarms/vaccinations" },
  MEDICAL:     { icon: Heart,         color: "text-[#C35A2C]",  bg: "bg-[#C35A2C]/10",  label: "Medical",      href: "/alarms/medical" },
  MEDICINE:    { icon: Pill,          color: "text-[#8B7355]",  bg: "bg-[#8B7355]/10",  label: "Medicine",     href: "/alarms/medicine" },
  PAYMENT:     { icon: DollarSign,    color: "text-[#B08968]",  bg: "bg-[#B08968]/10",  label: "Payments",     href: "/alarms/payments" },
  EVENT:       { icon: Calendar,      color: "text-[#6B8F71]",  bg: "bg-[#6B8F71]/10",  label: "Events",       href: "/alarms/events" },
  INSURANCE:   { icon: Shield,        color: "text-[#C35A2C]",  bg: "bg-[#C35A2C]/10",  label: "Insurance",    href: "/alarms/insurance" },
  CONTRACT:    { icon: FileText,      color: "text-[#8B7355]",  bg: "bg-[#8B7355]/10",  label: "Contracts",    href: "/alarms/contracts" },
  REQUEST:     { icon: MessageSquare, color: "text-[#6B8F71]",  bg: "bg-[#6B8F71]/10",  label: "Requests",     href: "/alarms/requests" },
  ASSESSMENT:  { icon: FileText,      color: "text-[#8B7355]",  bg: "bg-[#8B7355]/10",  label: "Assessments",  href: "/alarms/assessments" },
  OTHER:       { icon: Bell,          color: "text-[#8B8178]",  bg: "bg-[#8B8178]/10",  label: "Other",        href: "/alarms/others" },
};

function groupAlarmsByType(alarms: ActionableAlarm[]) {
  const groups = new Map<string, ActionableAlarm[]>();
  for (const alarm of alarms) {
    const existing = groups.get(alarm.type);
    if (existing) {
      existing.push(alarm);
    } else {
      groups.set(alarm.type, [alarm]);
    }
  }
  return groups;
}

export function NotificationCenter({ data }: NotificationCenterProps) {
  const allAlarms = [...data.critical, ...data.warning, ...data.info];
  const grouped = groupAlarmsByType(allAlarms);

  // Sort groups: types with overdue alarms first, then by count descending
  const sortedTypes = Array.from(grouped.entries()).sort(([, a], [, b]) => {
    const aOverdue = a.some((al) => al.isOverdue);
    const bOverdue = b.some((al) => al.isOverdue);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    return b.length - a.length;
  });

  return (
    <>
      <PageHeader
        title="Notifications"
        breadcrumbs={[{ label: "Notifications" }]}
      />
      <div className="space-y-5 p-4 md:p-6">
        {/* Summary */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {data.totalActive}
            </p>
            <p className="text-xs text-muted-foreground">active alerts</p>
          </div>
        </div>

        {data.totalActive === 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#6B8F71]/20 bg-[#6B8F71]/5 px-5 py-4">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#6B8F71]/10">
              <Sparkles className="size-4 text-[#6B8F71]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#6B8F71]">All clear</p>
              <p className="text-xs text-[#6B8F71]/80">
                No active notifications right now.
              </p>
            </div>
          </div>
        )}

        {/* Grouped by type */}
        {sortedTypes.map(([type, alarms]) => (
          <TypeSection key={type} type={type} alarms={alarms} />
        ))}
      </div>
    </>
  );
}

function TypeSection({
  type,
  alarms,
}: {
  type: string;
  alarms: ActionableAlarm[];
}) {
  const config = typeConfig[type] ?? typeConfig.OTHER;
  const Icon = config.icon;
  const [expanded, setExpanded] = useState(true);
  const hasOverdue = alarms.some((a) => a.isOverdue);

  return (
    <div className={`rounded-2xl border shadow-sm ${hasOverdue ? "border-[#C35A2C]/30 bg-card" : "border-border/40 bg-card"}`}>
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`flex size-9 items-center justify-center rounded-xl ${config.bg}`}>
          <Icon className={`size-4 ${config.color}`} />
        </div>
        <span className="text-sm font-semibold text-foreground">
          {config.label}
        </span>
        <Badge className={`ml-1 rounded-md border-0 px-1.5 py-0 text-[11px] font-bold ${config.bg} ${config.color}`}>
          {alarms.length}
        </Badge>
        {hasOverdue && (
          <Badge className="ml-1 rounded-md border-0 bg-[#C35A2C]/10 px-1.5 py-0 text-[11px] font-bold text-[#C35A2C]">
            overdue
          </Badge>
        )}
        <ChevronRight
          className={`ml-auto size-4 text-muted-foreground/50 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-5 pb-4 pt-3">
          <div className="space-y-1.5">
            {alarms.map((alarm) => (
              <AlarmActionCard key={alarm.id} alarm={alarm} />
            ))}
          </div>
          <div className="mt-3">
            <Link
              href={config.href}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
            >
              View all {config.label.toLowerCase()} <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
