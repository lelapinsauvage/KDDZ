"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowUpDown,
  Eye,
  Inbox,
  MessageSquare,
  MoreHorizontal,
  PenSquare,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { deleteMessage, resendMessage } from "@/lib/actions/messages";
import type { ExportColumn } from "@/lib/export";

interface SentMessage {
  id: string;
  legacyId: number | null;
  legacyThreadId: number | null;
  legacyNature: string | null;
  legacyHref: string | null;
  senderId: string;
  senderType: string;
  recipientId: string;
  recipientType: string;
  recipientName: string;
  nature: string;
  subject: string | null;
  body: string;
  isRead: boolean;
  threadId: string | null;
  createdAt: string;
}

export interface SentFilters {
  q: string;
  id: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  nature: string;
  subject: string;
  message: string;
  thread: string;
}

interface SentClientProps {
  messages: SentMessage[];
  total: number;
  initialFilters: SentFilters;
}

const EMPTY_FILTERS: SentFilters = {
  q: "",
  id: "",
  to: "",
  dateFrom: "",
  dateTo: "",
  nature: "",
  subject: "",
  message: "",
  thread: "",
};

const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as Array<keyof SentFilters>;

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-orange-500",
];

const NATURE_STYLES: Record<string, string> = {
  general: "bg-gray-100 text-gray-700",
  urgent: "bg-red-100 text-red-700",
  legal: "bg-amber-100 text-amber-700",
  event: "bg-blue-100 text-blue-700",
};

const sentExportColumns: ExportColumn[] = [
  { header: "#", key: "serial" },
  { header: "To", key: "to" },
  { header: "Date", key: "date" },
  { header: "Nature", key: "nature" },
  { header: "Subject", key: "subject" },
  { header: "Message", key: "message" },
  { header: "Thread", key: "thread" },
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0] ?? "?").slice(0, 2).toUpperCase();
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatLegacyDateTime(value: string) {
  const date = parseDate(value);
  if (!date) return "";

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(" ");
}

function dateBoundary(value: string, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function includesFilter(value: unknown, filter: string) {
  if (!filter) return true;
  return String(value ?? "").toLowerCase().includes(filter.toLowerCase());
}

function threadLabel(message: SentMessage) {
  if (message.legacyThreadId) return String(message.legacyThreadId);
  if (message.threadId) return message.threadId.slice(0, 8);
  return "-";
}

function messageSearchText(message: SentMessage, serial: number | string) {
  return [
    serial,
    message.recipientName,
    formatLegacyDateTime(message.createdAt),
    message.nature,
    message.legacyNature,
    message.subject,
    message.body,
    threadLabel(message),
    message.legacyHref,
  ]
    .filter(Boolean)
    .join(" ");
}

function sortableHeader(label: string) {
  return function Header({ column }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    );
  };
}

export function SentClient({
  messages,
  total,
  initialFilters,
}: SentClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<SentFilters>({
    ...EMPTY_FILTERS,
    ...initialFilters,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateFilter(key: keyof SentFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters({ ...EMPTY_FILTERS });
  }

  function handleDelete() {
    if (!deletingId) return;
    startTransition(async () => {
      await deleteMessage(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
      router.refresh();
    });
  }

  function handleResend(id: string) {
    startTransition(async () => {
      await resendMessage(id);
      router.refresh();
    });
  }

  const filteredMessages = useMemo(() => {
    const from = dateBoundary(filters.dateFrom);
    const to = dateBoundary(filters.dateTo, true);

    return messages.filter((message, index) => {
      const serial = message.legacyId ?? index + 1;
      const createdAt = parseDate(message.createdAt);

      if (!includesFilter(serial, filters.id)) return false;
      if (!includesFilter(message.recipientName, filters.to)) return false;
      if (!includesFilter(message.nature, filters.nature)) return false;
      if (!includesFilter(message.subject, filters.subject)) return false;
      if (!includesFilter(message.body, filters.message)) return false;
      if (!includesFilter(threadLabel(message), filters.thread)) return false;
      if (from && (!createdAt || createdAt < from)) return false;
      if (to && (!createdAt || createdAt > to)) return false;
      if (!includesFilter(messageSearchText(message, serial), filters.q)) return false;

      return true;
    });
  }, [filters, messages]);

  const exportRows = useMemo(
    () =>
      filteredMessages.map((message, index) => ({
        serial: message.legacyId ?? index + 1,
        to: message.recipientName,
        date: formatLegacyDateTime(message.createdAt),
        nature: message.nature,
        subject: message.subject ?? "",
        message: message.body,
        thread: threadLabel(message),
      })),
    [filteredMessages],
  );

  const hasFilters = FILTER_KEYS.some((key) => filters[key].trim() !== "");

  const columns: ColumnDef<SentMessage>[] = [
    {
      accessorKey: "legacyId",
      header: "#",
      size: 70,
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground">
          {row.original.legacyId ?? row.index + 1}
        </span>
      ),
    },
    {
      accessorKey: "recipientName",
      header: sortableHeader("To"),
      cell: ({ row }) => {
        const message = row.original;
        return (
          <div className="flex min-w-[180px] items-center gap-2.5">
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(message.recipientName)}`}
            >
              {initials(message.recipientName)}
            </div>
            <span className="text-sm">{message.recipientName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: sortableHeader("Date"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatLegacyDateTime(row.original.createdAt) || "-"}
        </span>
      ),
      sortingFn: (a, b) => {
        return (
          new Date(a.original.createdAt).getTime() -
          new Date(b.original.createdAt).getTime()
        );
      },
    },
    {
      accessorKey: "nature",
      header: sortableHeader("Nature"),
      cell: ({ row }) => {
        const nature = row.original.nature || "General";
        return (
          <Badge
            variant="secondary"
            className={`text-xs font-normal ${NATURE_STYLES[nature.toLowerCase()] ?? ""}`}
          >
            {nature}
          </Badge>
        );
      },
    },
    {
      accessorKey: "subject",
      header: sortableHeader("Subject"),
      cell: ({ row }) => (
        <Link
          href={`/messages/${row.original.id}`}
          className="block max-w-[260px] truncate text-sm text-foreground hover:underline"
        >
          {row.original.subject || "(No subject)"}
        </Link>
      ),
    },
    {
      id: "message",
      accessorFn: (row) => row.body,
      header: "Message",
      cell: ({ row }) => (
        <p className="max-w-[340px] truncate text-sm text-muted-foreground">
          {row.original.body || "-"}
        </p>
      ),
    },
    {
      id: "thread",
      accessorFn: (row) => threadLabel(row),
      header: sortableHeader("Thread"),
      cell: ({ row }) => (
        <Link
          href={`/messages/${row.original.id}`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <MessageSquare className="size-3" />
          {threadLabel(row.original)}
        </Link>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 80,
      cell: ({ row }) => {
        const message = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/messages/${message.id}`}>
                  <Eye className="mr-2 size-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => handleResend(message.id)}
              >
                <RefreshCw className="mr-2 size-4" />
                Resend
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isPending}
                className="text-red-600"
                onClick={() => {
                  setDeletingId(message.id);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Sent Messages"
        breadcrumbs={[
          { label: "Messages", href: "/messages/inbox" },
          { label: "Sent" },
        ]}
        actions={
          <Button asChild size="sm">
            <Link href="/messages/compose">
              <PenSquare className="mr-1 size-3.5" />
              Compose
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredMessages.length} of {total} sent{" "}
            {total === 1 ? "message" : "messages"}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/messages/inbox">
                <Inbox className="mr-1 size-3.5" />
                Inbox
              </Link>
            </Button>
            <ExportButton
              filename="sent-messages"
              sheetName="Sent Messages"
              columns={sentExportColumns}
              data={exportRows}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredMessages.length === 0}
              onClick={() => window.print()}
            >
              <Printer className="mr-1 size-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="space-y-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search sent messages"
                placeholder="Search sent messages..."
                value={filters.q}
                onChange={(event) => updateFilter("q", event.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasFilters}
              onClick={clearFilters}
            >
              <X className="mr-1 size-4" />
              Reset
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Input
              aria-label="Filter by message number"
              placeholder="#"
              value={filters.id}
              onChange={(event) => updateFilter("id", event.target.value)}
            />
            <Input
              aria-label="Filter by recipient"
              placeholder="To"
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
            />
            <Input
              aria-label="Filter date from"
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateFilter("dateFrom", event.target.value)}
            />
            <Input
              aria-label="Filter date to"
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilter("dateTo", event.target.value)}
            />
            <Input
              aria-label="Filter by nature"
              placeholder="Nature"
              value={filters.nature}
              onChange={(event) => updateFilter("nature", event.target.value)}
            />
            <Input
              aria-label="Filter by subject"
              placeholder="Subject"
              value={filters.subject}
              onChange={(event) => updateFilter("subject", event.target.value)}
            />
            <Input
              aria-label="Filter by message"
              placeholder="Message"
              value={filters.message}
              onChange={(event) => updateFilter("message", event.target.value)}
            />
            <Input
              aria-label="Filter by thread"
              placeholder="Thread"
              value={filters.thread}
              onChange={(event) => updateFilter("thread", event.target.value)}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredMessages}
          pageSizeOptions={[10, 20, 50, 100, 1000]}
        />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sent message? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
