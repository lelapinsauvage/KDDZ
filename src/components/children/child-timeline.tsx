"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  UserX,
  Stethoscope,
  Syringe,
  DollarSign,
  AlertTriangle,
  Phone,
} from "lucide-react";
import type { TimelineEvent } from "@/lib/actions/timeline";
import type { LucideIcon } from "lucide-react";

interface ChildTimelineProps {
  events: TimelineEvent[];
}

const typeConfig: Record<
  TimelineEvent["type"],
  { icon: LucideIcon; iconBg: string; iconColor: string; label: string }
> = {
  daily_report: {
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    label: "Reports",
  },
  absence: {
    icon: UserX,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    label: "Absences",
  },
  medical: {
    icon: Stethoscope,
    iconBg: "bg-[#4F46E5]/15",
    iconColor: "text-[#4F46E5]",
    label: "Medical",
  },
  vaccination: {
    icon: Syringe,
    iconBg: "bg-primary/10",
    iconColor: "text-[#0B9178]",
    label: "Vaccinations",
  },
  payment: {
    icon: DollarSign,
    iconBg: "bg-[#059669]/15",
    iconColor: "text-[#059669]",
    label: "Payments",
  },
  accident: {
    icon: AlertTriangle,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    label: "Accidents",
  },
  call: {
    icon: Phone,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    label: "Calls",
  },
};

const filterOptions: Array<{ key: string; label: string }> = [
  { key: "all", label: "All" },
  { key: "daily_report", label: "Reports" },
  { key: "absence", label: "Absences" },
  { key: "medical", label: "Medical" },
  { key: "payment", label: "Payments" },
  { key: "call", label: "Calls" },
];

function getDateGroup(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");

  const diffMs = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  return "Earlier";
}

export function ChildTimeline({ events }: ChildTimelineProps) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((e) => e.type === filter);
  }, [events, filter]);

  const grouped = useMemo(() => {
    const groups: Array<{ label: string; events: TimelineEvent[] }> = [];
    const order = ["Today", "Yesterday", "This Week", "Earlier"];
    const map = new Map<string, TimelineEvent[]>();

    for (const event of filtered) {
      const group = getDateGroup(event.date);
      const arr = map.get(group) ?? [];
      arr.push(event);
      map.set(group, arr);
    }

    for (const label of order) {
      const items = map.get(label);
      if (items && items.length > 0) {
        groups.push({ label, events: items });
      }
    }

    return groups;
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {filterOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setFilter(opt.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === opt.key
                ? "bg-foreground text-background"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No events found.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.events.map((event) => {
                  const config = typeConfig[event.type];
                  const Icon = config.icon;
                  return (
                    <Link
                      key={`${event.type}-${event.id}`}
                      href={event.href}
                      className="flex items-center gap-3 rounded-sm bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/60"
                    >
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${config.iconBg}`}
                      >
                        <Icon className={`size-3.5 ${config.iconColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {event.summary}
                        </p>
                      </div>
                      {event.metadata?.status && (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px] font-medium rounded-md"
                        >
                          {event.metadata.status}
                        </Badge>
                      )}
                      <span className="shrink-0 text-[11px] text-muted-foreground/70">
                        {event.date}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
