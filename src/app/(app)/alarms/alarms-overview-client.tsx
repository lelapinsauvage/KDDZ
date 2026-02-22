"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Cake,
  ClipboardCheck,
  Syringe,
  Stethoscope,
  Pill,
  CalendarDays,
  Shield,
  DollarSign,
  MessageSquare,
  FileText,
  Bell,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import type { AlarmCountItem } from "@/lib/actions/alarms";

const iconMap: Record<string, LucideIcon> = {
  Cake,
  ClipboardCheck,
  Syringe,
  Stethoscope,
  Pill,
  CalendarDays,
  Shield,
  DollarSign,
  MessageSquare,
  FileText,
  Bell,
};

// Classify alarm types into urgency levels
const urgencyMap: Record<string, "critical" | "warning" | "info"> = {
  VACCINATION: "critical",
  MEDICAL: "critical",
  MEDICINE: "critical",
  PAYMENT: "critical",
  INSURANCE: "warning",
  CONTRACT: "warning",
  ASSESSMENT: "warning",
  REQUEST: "warning",
  BIRTHDAY: "info",
  EVENT: "info",
  OTHER: "info",
};

const urgencyLabels: Record<string, string> = {
  critical: "Needs Attention",
  warning: "Upcoming",
  info: "Informational",
};

const urgencyColors: Record<string, string> = {
  critical: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

interface AlarmsOverviewClientProps {
  counts: AlarmCountItem[];
  totalActive: number;
}

export function AlarmsOverviewClient({
  counts,
  totalActive,
}: AlarmsOverviewClientProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredCounts = useMemo(() => {
    if (filter === "all") return counts;
    if (filter === "active") return counts.filter((c) => c.count > 0);
    // Filter by urgency level
    return counts.filter((c) => urgencyMap[c.type] === filter);
  }, [counts, filter]);

  // Group by urgency
  const grouped = useMemo(() => {
    const groups: Record<string, AlarmCountItem[]> = {
      critical: [],
      warning: [],
      info: [],
    };
    filteredCounts.forEach((item) => {
      const urgency = urgencyMap[item.type] ?? "info";
      groups[urgency].push(item);
    });
    return groups;
  }, [filteredCounts]);

  const activeCount = counts.filter((c) => c.count > 0).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        breadcrumbs={[{ label: "Notifications" }]}
      />
      <div className="space-y-6 p-4 md:p-6">
        {/* Summary + filter chips */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {totalActive}
              </p>
              <p className="text-xs text-muted-foreground">
                active alerts
              </p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap gap-1.5">
            {[
              { key: "all", label: "All" },
              { key: "active", label: `Active (${activeCount})` },
              { key: "critical", label: "Needs Attention" },
              { key: "warning", label: "Upcoming" },
              { key: "info", label: "Informational" },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  filter === chip.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped alarm cards */}
        {(["critical", "warning", "info"] as const).map((level) => {
          const items = grouped[level];
          if (!items || items.length === 0) return null;

          return (
            <div key={level} className="space-y-3">
              <h3 className={`text-sm font-semibold uppercase tracking-wide ${urgencyColors[level]}`}>
                {urgencyLabels[level]}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => {
                  const Icon = iconMap[item.icon] ?? Bell;
                  const [bgClass, textClass] = item.color.split(" ");

                  return (
                    <Link key={item.type} href={item.href}>
                      <Card className="group cursor-pointer py-4 transition-shadow hover:shadow-md">
                        <CardContent className="flex items-center gap-4">
                          <div
                            className={`flex size-10 items-center justify-center rounded-lg ${bgClass}`}
                          >
                            <Icon className={`size-5 ${textClass}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary">
                              {item.label}
                            </p>
                            <div className="flex items-center gap-2">
                              {item.count > 0 ? (
                                <Badge className="bg-red-100 text-red-700">
                                  {item.count} active
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No active alerts
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
