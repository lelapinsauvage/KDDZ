"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Inbox,
  ArrowUpDown,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { deleteMessage, resendMessage } from "@/lib/actions/messages";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SentMessage {
  id: string;
  senderId: string;
  senderType: string;
  recipientId: string;
  recipientType: string;
  recipientName: string;
  subject: string | null;
  body: string;
  isRead: boolean;
  threadId: string | null;
  createdAt: string;
}

interface SentClientProps {
  messages: SentMessage[];
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  General: "bg-gray-100 text-gray-700",
  Urgent: "bg-red-100 text-red-700",
  Legal: "bg-amber-100 text-amber-700",
  Event: "bg-blue-100 text-blue-700",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SentClient({ messages, total }: SentClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  // Column definitions
  const columns: ColumnDef<SentMessage>[] = [
    {
      id: "index",
      header: "#",
      size: 50,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.index + 1}</span>
      ),
    },
    {
      accessorKey: "recipientName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="px-0"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          To
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const msg = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(msg.recipientName)}`}
            >
              {initials(msg.recipientName)}
            </div>
            <span className="text-sm">{msg.recipientName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="px-0"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Date
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div>
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
        <Button
          variant="ghost"
          size="sm"
          className="px-0"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Subject
          <ArrowUpDown className="ml-1 size-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const msg = row.original;
        const { cleanSubject } = parseNature(msg.subject);
        return (
          <div>
            <Link
              href={`/messages/${msg.id}`}
              className="text-sm text-foreground hover:underline"
            >
              {cleanSubject ?? "(No subject)"}
            </Link>
            <p className="max-w-xs truncate text-xs text-muted-foreground">
              {msg.body}
            </p>
          </div>
        );
      },
    },
    {
      id: "thread",
      header: "Thread",
      cell: ({ row }) => {
        const msg = row.original;
        if (!msg.threadId) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <Link
            href={`/messages/${msg.id}`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <MessageSquare className="size-3" />
            View
          </Link>
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
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResend(msg.id)}>
                <RefreshCw className="mr-2 size-4" />
                Resend
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
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

      <div className="p-4 md:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {total} sent {total === 1 ? "message" : "messages"}
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/messages/inbox">
                <Inbox className="mr-1 size-3.5" />
                Inbox
              </Link>
            </Button>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={messages}
          searchKey="subject"
          searchPlaceholder="Search by subject..."
        />
      </div>

      {/* Delete confirmation */}
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
              className="bg-red-600 hover:bg-red-700"
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
