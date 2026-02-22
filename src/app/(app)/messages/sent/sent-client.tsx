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
} from "lucide-react";
import { deleteMessage } from "@/lib/actions/messages";

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
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500",
  "bg-violet-500", "bg-cyan-500", "bg-pink-500", "bg-teal-500",
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

  // Column definitions
  const columns: ColumnDef<SentMessage>[] = [
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
        const isGroup = msg.threadId !== null;
        return (
          <div className="flex items-center gap-2.5">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(msg.recipientName)}`}>
              {initials(msg.recipientName)}
            </div>
            <div>
              <span className="text-sm text-foreground">
                {msg.recipientName}
              </span>
              <Badge
                variant="outline"
                className={`ml-1.5 text-[10px] ${
                  isGroup ? "border-primary text-primary" : ""
                }`}
              >
                {isGroup ? "Group" : msg.recipientType}
              </Badge>
            </div>
          </div>
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
        return (
          <div>
            <Link
              href={`/messages/${msg.id}`}
              className="text-sm text-foreground hover:underline"
            >
              {msg.subject ?? "(No subject)"}
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
      id: "deliveryStatus",
      header: "Status",
      cell: ({ row }) => {
        const msg = row.original;
        return msg.isRead ? (
          <Badge
            variant="secondary"
            className="bg-green-50 text-green-700 font-normal"
          >
            Read
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-600 font-normal"
          >
            Delivered
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
