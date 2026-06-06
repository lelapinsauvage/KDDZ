"use client";

import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock,
  HeartPulse,
  Mail,
  Stethoscope,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { HeaderLegacyBadgeFamily } from "@/lib/actions/header";

const familyIcons: Record<HeaderLegacyBadgeFamily["key"], LucideIcon> = {
  messages: Mail,
  medicine: HeartPulse,
  birthdays: CalendarDays,
  assessments: CircleHelp,
  medical: Stethoscope,
  general: Bell,
};

function legacyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";

  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${month} ${day}${suffix}, ${date.getFullYear()}`;
}

function LegacyFamilyPopover({ family }: { family: HeaderLegacyBadgeFamily }) {
  const Icon = familyIcons[family.key] ?? Bell;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex size-9 items-center justify-center rounded-lg text-[#b4bcc8] transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-ring/20"
          aria-label={family.label}
          title={family.label}
        >
          <Icon className="size-[18px]" />
          <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
            {family.count > 99 ? "99+" : family.count}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] rounded-sm border-border/40 p-0 shadow-sm"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{family.label}</h3>
          </div>
          <Badge variant="secondary" className="rounded-sm text-xs">
            {family.count}
          </Badge>
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {family.items.length ? (
            <div className="divide-y divide-border/50">
              {family.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm leading-tight text-foreground">
                        {item.text}
                      </p>
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        {legacyDate(item.datetime)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-7 text-center text-sm text-muted-foreground">
              {family.emptyLabel}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2.5">
          <Link
            href={family.href}
            className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {family.seeAllLabel}
            <ChevronRight className="size-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function LegacyAlarmBar({
  families,
}: {
  families: HeaderLegacyBadgeFamily[];
}) {
  if (!families.length) return null;

  return (
    <div className="hidden items-center gap-0.5 xl:flex" aria-label="Legacy alarm bar">
      {families.map((family) => (
        <LegacyFamilyPopover key={family.key} family={family} />
      ))}
    </div>
  );
}
