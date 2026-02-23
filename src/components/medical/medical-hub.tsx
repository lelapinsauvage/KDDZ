"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Stethoscope,
  Heart,
  CalendarCheck,
  Syringe,
  AlertTriangle,
  Plus,
  ChevronDown,
} from "lucide-react";
import type {
  MedicalEvent,
  VaccinationRecord,
  MedicalTimelineData,
} from "@/lib/actions/medical-timeline";
import type { LucideIcon } from "lucide-react";

interface MedicalHubProps {
  data: MedicalTimelineData;
  childId: string;
}

const typeConfig: Record<
  MedicalEvent["type"],
  { icon: LucideIcon; iconBg: string; iconColor: string; label: string }
> = {
  general: {
    icon: Stethoscope,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    label: "General",
  },
  conditions: {
    icon: Heart,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    label: "Conditions",
  },
  visits: {
    icon: CalendarCheck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    label: "Visits",
  },
  vaccinations: {
    icon: Syringe,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    label: "Vaccinations",
  },
  accidents: {
    icon: AlertTriangle,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    label: "Accidents",
  },
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-amber-100/60 text-amber-700 border-amber-200/60",
  SUBMITTED: "bg-blue-100/60 text-blue-700 border-blue-200/60",
  REVIEWED: "bg-emerald-100/60 text-emerald-700 border-emerald-200/60",
  GIVEN: "bg-emerald-100/60 text-emerald-700 border-emerald-200/60",
  PENDING: "bg-amber-100/60 text-amber-700 border-amber-200/60",
};

export function MedicalHub({ data, childId }: MedicalHubProps) {
  const [filter, setFilter] = useState("all");

  const filteredEvents = useMemo(() => {
    if (filter === "all") return data.events;
    return data.events.filter((e) => e.type === filter);
  }, [data.events, filter]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Summary + Quick add */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          Object.entries(typeConfig) as Array<
            [MedicalEvent["type"], (typeof typeConfig)[MedicalEvent["type"]]]
          >
        ).map(([type, config]) => {
          const count = data.summary[type];
          const Icon = config.icon;
          const isActive = filter === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(isActive ? "all" : type)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className={`size-3 ${isActive ? "" : config.iconColor}`} />
              {config.label}
              <span className="font-bold">{count}</span>
            </button>
          );
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="ml-auto rounded-xl">
              <Plus className="mr-1 size-3.5" />
              Add Record
              <ChevronDown className="ml-1 size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/medical/general?childId=${childId}`}>General</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/medical/visits?childId=${childId}`}>Visit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/medical/conditions?childId=${childId}`}>
                Condition
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/medical/vaccinations?childId=${childId}`}>
                Vaccination
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/medical/accidents?childId=${childId}`}>
                Accident
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Medical Timeline */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-sm">
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-foreground">
            Medical History
          </p>
        </div>
        <div className="border-t border-border/30 px-5 pb-4 pt-3">
          {filteredEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No medical records found.
            </p>
          ) : (
            <div className="space-y-1.5">
              {filteredEvents.map((event) => {
                const config = typeConfig[event.type];
                const Icon = config.icon;
                return (
                  <div
                    key={`${event.type}-${event.id}`}
                    className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5"
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
                    <Badge
                      className={`shrink-0 rounded-md text-[10px] font-medium border-0 ${statusColors[event.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {event.status}
                    </Badge>
                    <span className="shrink-0 text-[11px] text-muted-foreground/70">
                      {event.date}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vaccination Schedule */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4">
          <div className="flex size-7 items-center justify-center rounded-lg bg-teal-100">
            <Syringe className="size-3.5 text-teal-600" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Vaccination Schedule
          </p>
        </div>
        <div className="border-t border-border/30 px-5 pb-4 pt-3">
          {data.vaccinations.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No vaccination records.
            </p>
          ) : (
            <div className="space-y-1.5">
              {data.vaccinations.map((v) => {
                const isOverdue =
                  v.nextDueDate && v.nextDueDate < today && !v.dateGiven;
                return (
                  <div
                    key={v.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                      isOverdue ? "bg-rose-50 ring-1 ring-rose-200" : "bg-muted/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {v.name}
                      </p>
                      {v.notes && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {v.notes}
                        </p>
                      )}
                    </div>
                    {v.dateGiven && (
                      <span className="text-[11px] text-emerald-600 font-medium">
                        Given {v.dateGiven}
                      </span>
                    )}
                    {v.nextDueDate && (
                      <span
                        className={`text-[11px] font-medium ${
                          isOverdue ? "text-rose-600" : "text-muted-foreground"
                        }`}
                      >
                        {isOverdue ? "Overdue" : "Due"}: {v.nextDueDate}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
