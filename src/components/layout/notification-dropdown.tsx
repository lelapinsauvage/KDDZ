"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Cake,
  ClipboardCheck,
  Syringe,
  Pill,
  DollarSign,
  Shield,
  FileText,
  CalendarDays,
  Heart,
  MessageSquare,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/alarms";

// --- Type-to-style mapping for colored left borders & icons ---
const typeConfig: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; border: string }
> = {
  BIRTHDAY: {
    icon: Cake,
    color: "text-[#EC4899]",
    bg: "bg-[#EC4899]/10",
    border: "border-l-[#EC4899]",
  },
  ASSESSMENT: {
    icon: ClipboardCheck,
    color: "text-[#4F46E5]",
    bg: "bg-[#4F46E5]/10",
    border: "border-l-[#4F46E5]",
  },
  VACCINATION: {
    icon: Syringe,
    color: "text-[#059669]",
    bg: "bg-[#059669]/10",
    border: "border-l-[#059669]",
  },
  MEDICAL: {
    icon: Heart,
    color: "text-[#0B9178]",
    bg: "bg-[#0B9178]/10",
    border: "border-l-[#0B9178]",
  },
  MEDICINE: {
    icon: Pill,
    color: "text-[#4F46E5]",
    bg: "bg-[#4F46E5]/10",
    border: "border-l-[#4F46E5]",
  },
  INSURANCE: {
    icon: Shield,
    color: "text-[#0B9178]",
    bg: "bg-[#0B9178]/10",
    border: "border-l-[#0B9178]",
  },
  PAYMENT: {
    icon: DollarSign,
    color: "text-[#D97706]",
    bg: "bg-[#D97706]/10",
    border: "border-l-[#D97706]",
  },
  CONTRACT: {
    icon: FileText,
    color: "text-[#4F46E5]",
    bg: "bg-[#4F46E5]/10",
    border: "border-l-[#4F46E5]",
  },
  EVENT: {
    icon: CalendarDays,
    color: "text-[#059669]",
    bg: "bg-[#059669]/10",
    border: "border-l-[#059669]",
  },
  REQUEST: {
    icon: MessageSquare,
    color: "text-[#059669]",
    bg: "bg-[#059669]/10",
    border: "border-l-[#059669]",
  },
};

const defaultTypeConfig = {
  icon: Bell,
  color: "text-[#8B8178]",
  bg: "bg-[#8B8178]/10",
  border: "border-l-[#8B8178]",
};

function getTypeConfig(title: string) {
  // Try to infer notification type from title keywords
  const t = title.toUpperCase();
  if (t.includes("BIRTHDAY")) return typeConfig.BIRTHDAY;
  if (t.includes("ASSESSMENT")) return typeConfig.ASSESSMENT;
  if (t.includes("VACCINATION")) return typeConfig.VACCINATION;
  if (t.includes("MEDICAL")) return typeConfig.MEDICAL;
  if (t.includes("MEDICINE") || t.includes("MEDICATION"))
    return typeConfig.MEDICINE;
  if (t.includes("INSURANCE")) return typeConfig.INSURANCE;
  if (t.includes("PAYMENT") || t.includes("OVERDUE"))
    return typeConfig.PAYMENT;
  if (t.includes("CONTRACT")) return typeConfig.CONTRACT;
  if (t.includes("EVENT") || t.includes("HOLIDAY")) return typeConfig.EVENT;
  if (t.includes("REQUEST") || t.includes("MESSAGE"))
    return typeConfig.REQUEST;
  return defaultTypeConfig;
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

interface Notification {
  id: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
}

export function NotificationDropdown({
  notifications: initialNotifications,
  unreadCount: initialUnreadCount,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleMarkRead(id: string) {
    startTransition(async () => {
      const result = await markNotificationRead(id);
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none">
          <Bell
            className={`size-[18px] ${unreadCount > 0 ? "text-primary" : ""}`}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] rounded-2xl p-0 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border/40">
              {notifications.slice(0, 10).map((n) => {
                const config = getTypeConfig(n.title);
                const Icon = config.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                    className={`flex w-full items-start gap-3 border-l-[3px] px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                      config.border
                    } ${!n.isRead ? "bg-muted/20" : ""}`}
                  >
                    <div
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
                    >
                      <Icon className={`size-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-tight ${
                            n.isRead
                              ? "text-muted-foreground"
                              : "font-medium text-foreground"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#059669]/10">
                <CheckCircle2 className="size-6 text-[#059669]" />
              </div>
              <p className="text-sm font-medium text-foreground">
                All caught up!
              </p>
              <p className="text-xs text-muted-foreground">
                No new notifications right now.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2.5">
            <Link
              href="/alarms"
              onClick={() => setOpen(false)}
              className="flex justify-center text-xs font-medium text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
