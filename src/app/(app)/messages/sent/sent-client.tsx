"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/shared/export-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ChevronLeft,
  ChevronRight,
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
  legacyDelivery: LegacyDeliveryAudit;
  createdAt: string;
}

interface LegacyDeliveryAudit {
  channels: string[];
  scope: string | null;
  pendingExternal: boolean;
}

type SentPageSize = number | "all";

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
  page: number;
  pageSize: SentPageSize;
}

interface SentClientProps {
  messages: SentMessage[];
  exportMessages: SentMessage[];
  total: number;
  initialFilters: SentFilters;
}

const EMPTY_TEXT_FILTERS = {
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

const FILTER_KEYS = Object.keys(EMPTY_TEXT_FILTERS) as Array<
  keyof typeof EMPTY_TEXT_FILTERS
>;

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
  { header: "Delivery", key: "delivery" },
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

function threadLabel(message: SentMessage) {
  if (message.legacyThreadId) return String(message.legacyThreadId);
  if (message.threadId) return message.threadId.slice(0, 8);
  return "-";
}

function deliveryLabel(audit: LegacyDeliveryAudit) {
  const scope = audit.scope && audit.scope !== "Parent" ? audit.scope : null;
  return [
    ...audit.channels,
    scope,
    audit.pendingExternal ? "Pending" : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function DeliveryBadges({ audit }: { audit: LegacyDeliveryAudit }) {
  const scope = audit.scope && audit.scope !== "Parent" ? audit.scope : null;

  if (!audit.channels.length && !scope && !audit.pendingExternal) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div className="flex max-w-[180px] flex-wrap gap-1">
      {audit.channels.map((channel) => (
        <Badge
          key={channel}
          variant="outline"
          className="border-border bg-background px-1.5 py-0 text-[10px] font-normal"
        >
          {channel}
        </Badge>
      ))}
      {scope && (
        <Badge
          variant="outline"
          className="border-border bg-muted px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
        >
          {scope}
        </Badge>
      )}
      {audit.pendingExternal && (
        <Badge
          variant="outline"
          className="border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] font-normal text-amber-700"
        >
          Pending
        </Badge>
      )}
    </div>
  );
}

export function SentClient({
  messages,
  exportMessages,
  total,
  initialFilters,
}: SentClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SentFilters>({
    ...EMPTY_TEXT_FILTERS,
    ...initialFilters,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function replaceParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (!("page" in updates)) {
      params.delete("page");
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  function updateFilter(key: keyof typeof EMPTY_TEXT_FILTERS, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    replaceParams({ [key]: value });
  }

  function clearFilters() {
    setFilters((current) => ({ ...current, ...EMPTY_TEXT_FILTERS, page: 1 }));
    replaceParams({
      q: "",
      id: "",
      to: "",
      dateFrom: "",
      dateTo: "",
      nature: "",
      subject: "",
      message: "",
      thread: "",
      page: "",
    });
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

  const showAllRows = filters.pageSize === "all";
  const numericPageSize =
    typeof filters.pageSize === "number" ? filters.pageSize : Math.max(total, 1);
  const pageCount = showAllRows
    ? 1
    : Math.max(1, Math.ceil(total / numericPageSize));
  const pageStart = total === 0 ? 0 : (filters.page - 1) * numericPageSize + 1;
  const pageEnd = showAllRows
    ? total
    : Math.min(total, filters.page * numericPageSize);
  const visibleFallbackOffset = showAllRows
    ? 0
    : (filters.page - 1) * numericPageSize;
  const exportSource = exportMessages.length ? exportMessages : messages;
  const exportRows = useMemo(
    () =>
      exportSource.map((message, index) => ({
        serial: message.legacyId ?? index + 1,
        to: message.recipientName,
        date: formatLegacyDateTime(message.createdAt),
        nature: message.nature,
        delivery: deliveryLabel(message.legacyDelivery),
        subject: message.subject ?? "",
        message: message.body,
        thread: threadLabel(message),
      })),
    [exportSource],
  );

  const hasFilters = FILTER_KEYS.some((key) => filters[key].trim() !== "");

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
            Showing {pageStart} - {pageEnd} of {total} sent{" "}
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
              disabled={messages.length === 0}
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

        <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="w-[72px] bg-muted/60">#</TableHead>
                  <TableHead className="min-w-[220px] bg-muted/60">To</TableHead>
                  <TableHead className="min-w-[160px] bg-muted/60">Date</TableHead>
                  <TableHead className="min-w-[120px] bg-muted/60">Nature</TableHead>
                  <TableHead className="min-w-[170px] bg-muted/60">Delivery</TableHead>
                  <TableHead className="min-w-[220px] bg-muted/60">Subject</TableHead>
                  <TableHead className="min-w-[280px] bg-muted/60">Message</TableHead>
                  <TableHead className="min-w-[120px] bg-muted/60">Thread</TableHead>
                  <TableHead className="w-[92px] bg-muted/60 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length ? (
                  messages.map((message, index) => {
                    const serial =
                      message.legacyId ?? visibleFallbackOffset + index + 1;
                    const nature = message.nature || "General";

                    return (
                      <TableRow key={message.id} className="border-border/40">
                        <TableCell>
                          <span className="text-xs font-medium text-muted-foreground">
                            {serial}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-[180px] items-center gap-2.5">
                            <div
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(message.recipientName)}`}
                            >
                              {initials(message.recipientName)}
                            </div>
                            <span className="text-sm">{message.recipientName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatLegacyDateTime(message.createdAt) || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-xs font-normal ${NATURE_STYLES[nature.toLowerCase()] ?? ""}`}
                          >
                            {nature}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DeliveryBadges audit={message.legacyDelivery} />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/messages/${message.id}`}
                            className="block max-w-[260px] truncate text-sm text-foreground hover:underline"
                          >
                            {message.subject || "(No subject)"}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-[340px] truncate text-sm text-muted-foreground">
                            {message.body || "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/messages/${message.id}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <MessageSquare className="size-3" />
                            {threadLabel(message)}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
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
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="text-sm font-medium">No sent messages found</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        No messages match the current filters.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{pageStart}</span>
            {" - "}
            <span className="font-medium text-foreground">{pageEnd}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={`${filters.pageSize}`}
              onValueChange={(value) => {
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  pageSize: value === "all" ? "all" : Number(value),
                }));
                replaceParams({ pageSize: value, page: "1" });
              }}
            >
              <SelectTrigger className="h-9 w-[82px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100, 1000].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              disabled={showAllRows || filters.page <= 1 || isPending}
              onClick={() => {
                const page = Math.max(1, filters.page - 1);
                setFilters((current) => ({ ...current, page }));
                replaceParams({ page: `${page}` });
              }}
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>
            <span className="min-w-[84px] text-center text-sm text-muted-foreground">
              Page {filters.page} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={showAllRows || filters.page >= pageCount || isPending}
              onClick={() => {
                const page = Math.min(pageCount, filters.page + 1);
                setFilters((current) => ({ ...current, page }));
                replaceParams({ page: `${page}` });
              }}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
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
