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
  BIRTHDAY:    { icon: Cake,          color: "text-[#EC4899]",  bg: "bg-[#EC4899]/10",  border: "border-[#EC4899]/30" },
  VACCINATION: { icon: Syringe,       color: "text-[#059669]",  bg: "bg-[#059669]/10",  border: "border-[#059669]/30" },
  MEDICAL:     { icon: Heart,         color: "text-[#0B9178]",  bg: "bg-[#0B9178]/10",  border: "border-[#0B9178]/30" },
  MEDICINE:    { icon: Pill,          color: "text-[#4F46E5]",  bg: "bg-[#4F46E5]/10",  border: "border-[#4F46E5]/30" },
  PAYMENT:     { icon: DollarSign,    color: "text-[#D97706]",  bg: "bg-[#D97706]/10",  border: "border-[#D97706]/30" },
  EVENT:       { icon: Calendar,      color: "text-[#059669]",  bg: "bg-[#059669]/10",  border: "border-[#059669]/30" },
  INSURANCE:   { icon: Shield,        color: "text-[#0B9178]",  bg: "bg-[#0B9178]/10",  border: "border-[#0B9178]/30" },
  CONTRACT:    { icon: FileText,      color: "text-[#4F46E5]",  bg: "bg-[#4F46E5]/10",  border: "border-[#4F46E5]/30" },
  REQUEST:     { icon: MessageSquare, color: "text-[#059669]",  bg: "bg-[#059669]/10",  border: "border-[#059669]/30" },
  ASSESSMENT:  { icon: FileText,      color: "text-[#4F46E5]",  bg: "bg-[#4F46E5]/10",  border: "border-[#4F46E5]/30" },
  OTHER:       { icon: Bell,          color: "text-[#8B8178]",  bg: "bg-[#8B8178]/10",  border: "border-[#8B8178]/30" },
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
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all ${
        alarm.isOverdue
          ? "border-[#0B9178]/30 bg-[#0B9178]/5"
          : "border-border/40 bg-card hover:shadow-[0_2px_12px_rgba(176,137,104,0.08)]"
      }`}
    >
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${alarm.isOverdue ? "bg-[#0B9178]/10" : config.bg}`}>
        <Icon
          className={`size-4 ${alarm.isOverdue ? "text-[#0B9178]" : config.color}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {alarm.message}
        </p>
        <div className="flex items-center gap-2">
          {alarm.dueDate && (
            <span
              className={`text-[11px] ${alarm.isOverdue ? "font-medium text-[#0B9178]" : "text-muted-foreground"}`}
            >
              {alarm.isOverdue ? "Overdue" : "Due"}: {alarm.dueDate}
            </span>
          )}
          {alarm.amount != null && (
            <span className="text-[11px] font-semibold text-[#D97706]">
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
              className="size-7 rounded-lg p-0 text-[#059669] hover:bg-[#059669]/10"
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
                  className="size-7 rounded-lg p-0 text-[#D97706] hover:bg-[#D97706]/10"
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
