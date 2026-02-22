"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Cake,
  Syringe,
  Heart,
  Pill,
  DollarSign,
  Shield,
  FileText,
  Calendar,
  MessageSquare,
  Bell,
  Clock,
  Check,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { snoozeAlarm, resolveAlarm } from "@/lib/actions/notification-center";
import type { ActionableAlarm } from "@/lib/actions/notification-center";

interface AlarmActionCardProps {
  alarm: ActionableAlarm;
}

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  BIRTHDAY:    { icon: Cake,          color: "text-pink-600",   bg: "bg-pink-50",   border: "border-pink-200" },
  VACCINATION: { icon: Syringe,       color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
  MEDICAL:     { icon: Heart,         color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200" },
  MEDICINE:    { icon: Pill,          color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  PAYMENT:     { icon: DollarSign,    color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200" },
  EVENT:       { icon: Calendar,      color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-200" },
  INSURANCE:   { icon: Shield,        color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  CONTRACT:    { icon: FileText,      color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  REQUEST:     { icon: MessageSquare, color: "text-sky-600",    bg: "bg-sky-50",    border: "border-sky-200" },
  ASSESSMENT:  { icon: FileText,      color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  OTHER:       { icon: Bell,          color: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-200" },
};

function getConfig(type: string) {
  return typeConfig[type] ?? typeConfig.OTHER;
}

export function AlarmActionCard({ alarm }: AlarmActionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const config = getConfig(alarm.type);
  const Icon = config.icon;
  const isRealAlarm =
    !alarm.id.startsWith("vax-") &&
    !alarm.id.startsWith("pay-") &&
    !alarm.id.startsWith("bday-");

  function handleResolve() {
    if (!isRealAlarm) return;
    startTransition(async () => {
      await resolveAlarm(alarm.id);
      router.refresh();
    });
  }

  function handleSnooze(days: number) {
    if (!isRealAlarm) return;
    startTransition(async () => {
      await snoozeAlarm(alarm.id, days);
      router.refresh();
    });
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        alarm.isOverdue
          ? "border-red-200 bg-red-50/60"
          : `${config.bg}/40 border-border/40`
      }`}
    >
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${alarm.isOverdue ? "bg-red-100" : config.bg}`}>
        <Icon
          className={`size-4 ${alarm.isOverdue ? "text-red-600" : config.color}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {alarm.message}
        </p>
        <div className="flex items-center gap-2">
          {alarm.dueDate && (
            <span
              className={`text-[11px] ${alarm.isOverdue ? "font-medium text-red-600" : "text-muted-foreground"}`}
            >
              {alarm.isOverdue ? "Overdue" : "Due"}: {alarm.dueDate}
            </span>
          )}
          {alarm.amount != null && (
            <span className="text-[11px] font-semibold text-amber-700">
              ${alarm.amount.toFixed(0)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {alarm.actionUrl && (
          <Button asChild size="sm" variant="ghost" className="size-7 rounded-lg p-0">
            <Link href={alarm.actionUrl}>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </Link>
          </Button>
        )}
        {isRealAlarm && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="size-7 rounded-lg p-0 text-emerald-600 hover:bg-emerald-100"
              onClick={handleResolve}
              disabled={isPending}
              title="Resolve"
            >
              <Check className="size-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-7 rounded-lg p-0 text-amber-600 hover:bg-amber-100"
                  disabled={isPending}
                  title="Snooze"
                >
                  <Clock className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSnooze(1)}>
                  1 day
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(3)}>
                  3 days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(7)}>
                  1 week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSnooze(30)}>
                  1 month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}
