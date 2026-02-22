"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/alarms";

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

export function NotificationDropdown({
  notifications: initialNotifications,
  unreadCount: initialUnreadCount,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-10 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none sm:w-10">
          <Bell className={`size-[18px] ${unreadCount > 0 ? "text-amber-500" : ""}`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full p-0 text-[10px] leading-none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-xl">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-normal text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {notifications.length > 0 ? (
            notifications.slice(0, 8).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex cursor-pointer flex-col items-start gap-1 py-2.5"
                onClick={() => !n.isRead && handleMarkRead(n.id)}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span
                    className={`text-sm leading-tight ${n.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}
                  >
                    {n.title}
                  </span>
                  {!n.isRead && (
                    <span className="mt-0.5 size-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                {n.body && (
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {n.body}
                  </span>
                )}
                <span className="text-xs text-muted-foreground/70">
                  {timeAgo(n.createdAt)}
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </DropdownMenuGroup>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/alarms"
                className="flex justify-center text-xs font-medium text-primary"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
