"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  MailCheck,
  MessageSquare,
  RefreshCw,
  Reply,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  bulkMarkAsRead,
  markAllMessageNotificationsAsRead,
  markAsRead,
} from "@/lib/actions/messages";

interface MessageAlarm {
  id: string;
  legacyId: number | null;
  senderId: string;
  senderType: string;
  senderName: string;
  date: string;
  nature: string;
  subject: string | null;
  body: string;
  isRead: boolean;
  status: "Viewed" | "New";
  threadId: string | null;
  legacyHref: string | null;
  searchText: string;
}

interface MessageAlarmsClientProps {
  messages: MessageAlarm[];
  total: number;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "" };
  return {
    date: date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function truncateId(id: string) {
  return id.slice(0, 8);
}

function cleanSubject(subject: string | null, nature: string) {
  if (!subject) return "(No subject)";
  const escapedNature = nature.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return subject.replace(new RegExp(`^\\[${escapedNature}\\]\\s*`, "i"), "");
}

const natureStyles: Record<string, string> = {
  General: "bg-muted text-muted-foreground border-border",
  Urgent:
    "bg-[var(--color-error-light)] text-[var(--color-error-dark)] border-[var(--color-error)]/20",
  Legal:
    "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20",
  Event:
    "bg-[var(--color-info-light)] text-[var(--color-info-dark)] border-[var(--color-info)]/20",
};

export function MessageAlarmsClient({
  messages,
  total,
}: MessageAlarmsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [natureFilter, setNatureFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const natures = useMemo(
    () =>
      Array.from(new Set(messages.map((m) => m.nature).filter(Boolean))).sort(),
    [messages],
  );

  const unreadCount = useMemo(
    () => messages.filter((message) => !message.isRead).length,
    [messages],
  );

  const filteredMessages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return messages.filter((message) => {
      if (statusFilter === "NEW" && message.isRead) return false;
      if (statusFilter === "VIEWED" && !message.isRead) return false;
      if (natureFilter !== "ALL" && message.nature !== natureFilter) {
        return false;
      }
      const messageDate = message.date.slice(0, 10);
      if (dateFrom && messageDate < dateFrom) return false;
      if (dateTo && messageDate > dateTo) return false;
      if (
        normalizedSearch &&
        !message.searchText.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [dateFrom, dateTo, messages, natureFilter, search, statusFilter]);

  function resetFilters() {
    setStatusFilter("ALL");
    setNatureFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  function markViewed(id: string) {
    startTransition(async () => {
      const result = await markAsRead(id);
      if (!result.success) {
        toast.error(result.error ?? "Could not update notification");
        return;
      }
      toast.success("Message notification marked viewed");
      router.refresh();
    });
  }

  function markSelectedViewed(rows: MessageAlarm[]) {
    const ids = rows.map((row) => row.id);
    if (ids.length === 0) return;

    startTransition(async () => {
      const result = await bulkMarkAsRead(ids);
      if (!result.success) {
        toast.error(result.error ?? "Could not update notifications");
        return;
      }
      toast.success(`${ids.length} message notification${ids.length === 1 ? "" : "s"} marked viewed`);
      router.refresh();
    });
  }

  function markAllViewed() {
    startTransition(async () => {
      const result = await markAllMessageNotificationsAsRead();
      if (!result.success) {
        toast.error(result.error ?? "Could not update notifications");
        return;
      }
      const count = result.data?.count ?? 0;
      toast.success(`${count} message notification${count === 1 ? "" : "s"} marked viewed`);
      router.refresh();
    });
  }

  const columns: ColumnDef<MessageAlarm>[] = [
    {
      accessorKey: "legacyId",
      header: ({ column }) => <SortableHeader column={column}>#</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.legacyId ?? truncateId(row.original.id)}
        </span>
      ),
      sortingFn: (a, b) =>
        (a.original.legacyId ?? 0) - (b.original.legacyId ?? 0),
    },
    {
      accessorKey: "senderName",
      header: ({ column }) => (
        <SortableHeader column={column}>From</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <p className="font-medium text-foreground">
            {row.original.senderName}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.senderType}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <SortableHeader column={column}>Date</SortableHeader>
      ),
      cell: ({ row }) => {
        const formatted = formatDate(row.original.date);
        return (
          <div className="whitespace-nowrap text-sm">
            <p>{formatted.date}</p>
            <p className="text-xs text-muted-foreground">{formatted.time}</p>
          </div>
        );
      },
      sortingFn: (a, b) =>
        new Date(a.original.date).getTime() -
        new Date(b.original.date).getTime(),
    },
    {
      accessorKey: "nature",
      header: "Nature",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`font-normal ${natureStyles[row.original.nature] ?? "bg-muted text-muted-foreground border-border"}`}
        >
          {row.original.nature}
        </Badge>
      ),
    },
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <SortableHeader column={column}>Subject</SortableHeader>
      ),
      cell: ({ row }) => (
        <Link
          href={`/messages/${row.original.id}`}
          className={`block min-w-[180px] max-w-[280px] truncate hover:underline ${
            row.original.isRead
              ? "text-muted-foreground"
              : "font-semibold text-foreground"
          }`}
        >
          {cleanSubject(row.original.subject, row.original.nature)}
        </Link>
      ),
    },
    {
      accessorKey: "body",
      header: "Message",
      cell: ({ row }) => (
        <p className="max-w-[360px] truncate text-sm text-muted-foreground">
          {row.original.body || "-"}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) =>
        row.original.isRead ? (
          <Badge variant="secondary" className="font-normal">
            Viewed
          </Badge>
        ) : (
          <Badge className="bg-primary/10 text-primary font-normal hover:bg-primary/20">
            New
          </Badge>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="size-8" asChild>
                <Link href={`/messages/${row.original.id}`}>
                  <Reply className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          {!row.original.isRead && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={isPending}
                  onClick={() => markViewed(row.original.id)}
                >
                  <Eye className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark viewed</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Messages Notifications Listing"
        breadcrumbs={[
          { label: "Notifications", href: "/alarms" },
          { label: "Messages" },
        ]}
        actions={
          <Button
            type="button"
            size="sm"
            onClick={markAllViewed}
            disabled={isPending || unreadCount === 0}
            className="gap-2"
          >
            <MailCheck className="size-4" />
            Set All As Viewed
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div role="search" className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notifications..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="NEW">New ({unreadCount})</SelectItem>
              <SelectItem value="VIEWED">Viewed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={natureFilter} onValueChange={setNatureFilter}>
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Natures</SelectItem>
              {natures.map((nature) => (
                <SelectItem key={nature} value={nature}>
                  {nature}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            aria-label="Date from"
            className="w-full sm:w-[155px]"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            aria-label="Date to"
            className="w-full sm:w-[155px]"
          />
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
            <span>
              {filteredMessages.length} of {total} notification
              {total === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredMessages}
          bulkActions={[
            {
              label: "Mark as Viewed",
              icon: MailCheck,
              onClick: markSelectedViewed,
            },
          ]}
          emptyState={
            <EmptyState
              icon={MessageSquare}
              title="No message notifications"
              description="Message notifications that match the current filters will appear here."
            />
          }
        />
      </div>
    </>
  );
}
