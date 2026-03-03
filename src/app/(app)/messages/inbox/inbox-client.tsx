"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  PenSquare,
  MoreHorizontal,
  Trash2,
  Eye,
  MailCheck,
  MailX,
  Inbox,
} from "lucide-react";
import {
  markAsRead,
  markAsUnread,
  deleteMessage,
} from "@/lib/actions/messages";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InboxMessage {
  id: string;
  senderId: string;
  senderType: string;
  senderName: string;
  recipientId: string;
  recipientType: string;
  subject: string | null;
  body: string;
  isRead: boolean;
  threadId: string | null;
  createdAt: string;
}

interface InboxClientProps {
  messages: InboxMessage[];
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  "bg-[#059669]", "bg-[#0B9178]", "bg-[#D97706]", "bg-[#EC4899]",
  "bg-[#4F46E5]", "bg-[#059669]/80", "bg-[#EC4899]/80", "bg-[#0B9178]/80",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Parse nature tag from subject like "[Urgent] Hello" */
function parseNature(subject: string | null): {
  nature: string | null;
  cleanSubject: string | null;
} {
  if (!subject) return { nature: null, cleanSubject: null };
  const match = subject.match(/^\[(General|Urgent|Legal|Event)\]\s*(.*)/i);
  if (match) {
    return { nature: match[1], cleanSubject: match[2] || null };
  }
  return { nature: null, cleanSubject: subject };
}

const NATURE_STYLES: Record<string, string> = {
  General: "bg-muted text-muted-foreground border-border",
  Urgent: "bg-[var(--color-error-light)] text-[var(--color-error-dark)] border-[var(--color-error)]/20",
  Legal: "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20",
  Event: "bg-[var(--color-info-light)] text-[var(--color-info-dark)] border-[var(--color-info)]/20",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InboxClient({ messages, total }: InboxClientProps) {
  const router = useRouter();
  const [readFilter, setReadFilter] = useState("ALL");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (readFilter === "READ" && !msg.isRead) return false;
      if (readFilter === "UNREAD" && msg.isRead) return false;
      return true;
    });
  }, [messages, readFilter]);

  // Counts
  const unreadCount = useMemo(
    () => messages.filter((m) => !m.isRead).length,
    [messages],
  );

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markAsRead(id);
      router.refresh();
    });
  }

  function handleMarkUnread(id: string) {
    startTransition(async () => {
      await markAsUnread(id);
      router.refresh();
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

  // Column definitions
  const columns: ColumnDef<InboxMessage>[] = [
    {
      accessorKey: "senderName",
      header: ({ column }) => (
        <SortableHeader column={column}>From</SortableHeader>
      ),
      cell: ({ row }) => {
        const msg = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(msg.senderName)}`}>
                {initials(msg.senderName)}
              </div>
              {!msg.isRead && (
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
              )}
            </div>
            <div>
              <span
                className={`text-sm ${!msg.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              >
                {msg.senderName}
              </span>
              <Badge variant="outline" className="ml-1.5 text-[10px]">
                {msg.senderType}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      id: "nature",
      header: "Nature",
      cell: ({ row }) => {
        const { nature } = parseNature(row.original.subject);
        if (!nature)
          return <span className="text-xs text-muted-foreground">-</span>;
        return (
          <Badge
            variant="secondary"
            className={`text-xs font-normal ${NATURE_STYLES[nature] ?? ""}`}
          >
            {nature}
          </Badge>
        );
      },
    },
    {
      accessorKey: "subject",
      header: ({ column }) => (
        <SortableHeader column={column}>Subject</SortableHeader>
      ),
      cell: ({ row }) => {
        const msg = row.original;
        const { cleanSubject } = parseNature(msg.subject);
        return (
          <div>
            <Link
              href={`/messages/${msg.id}`}
              className={`text-sm hover:underline ${!msg.isRead ? "font-medium text-foreground" : "text-muted-foreground"}`}
            >
              {cleanSubject ?? "(No subject)"}
            </Link>
            <p className="max-w-md truncate text-xs text-muted-foreground">
              {msg.body}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Date</SortableHeader>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {date.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        );
      },
      sortingFn: (a, b) => {
        return (
          new Date(a.original.createdAt).getTime() -
          new Date(b.original.createdAt).getTime()
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const msg = row.original;
        return msg.isRead ? (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-600 font-normal"
          >
            Read
          </Badge>
        ) : (
          <Badge className="bg-primary/10 text-primary font-normal hover:bg-primary/20">
            Unread
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      size: 50,
      cell: ({ row }) => {
        const msg = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/messages/${msg.id}`}>
                  <Eye className="mr-2 size-4" />
                  View Message
                </Link>
              </DropdownMenuItem>
              {msg.isRead ? (
                <DropdownMenuItem onClick={() => handleMarkUnread(msg.id)}>
                  <MailX className="mr-2 size-4" />
                  Mark as Unread
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleMarkRead(msg.id)}>
                  <MailCheck className="mr-2 size-4" />
                  Mark as Read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setDeletingId(msg.id);
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
        title="Message Inbox"
        breadcrumbs={[
          { label: "Messages", href: "/messages/inbox" },
          { label: "Inbox" },
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

      <div className="p-4 md:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Messages</SelectItem>
                <SelectItem value="UNREAD">Unread ({unreadCount})</SelectItem>
                <SelectItem value="READ">Read</SelectItem>
              </SelectContent>
            </Select>

            {unreadCount > 0 && (
              <Badge className="bg-primary/10 text-primary font-normal">
                {unreadCount} unread
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/messages/sent">
                Sent Messages
              </Link>
            </Button>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={filteredMessages}
          searchKey="subject"
          searchPlaceholder="Search by subject..."
          emptyState={
            <EmptyState
              icon={Inbox}
              title="Your inbox is empty"
              description="No messages match your current filters. New messages will appear here."
            />
          }
        />

        {total > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredMessages.length} of {total} messages
          </p>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
