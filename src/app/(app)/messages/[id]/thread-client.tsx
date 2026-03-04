"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  Send,
  Trash2,
  Mail,
  MailOpen,
  Clock,
} from "lucide-react";
import {
  replyToMessage,
  deleteMessage,
  markAsRead,
  markAsUnread,
} from "@/lib/actions/messages";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ThreadMessage {
  id: string;
  senderId: string;
  senderType: string;
  senderName: string;
  recipientId: string;
  recipientType: string;
  recipientName: string;
  subject: string | null;
  body: string;
  isRead: boolean;
  threadId: string | null;
  createdAt: string;
}

interface ThreadClientProps {
  message: ThreadMessage;
  threadMessages: ThreadMessage[];
  currentUserId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  "bg-[#059669]", "bg-primary", "bg-[#D97706]", "bg-[#EC4899]",
  "bg-[#4F46E5]", "bg-[#059669]/80", "bg-[#EC4899]/80", "bg-primary/80",
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

export function ThreadClient({
  message,
  threadMessages,
  currentUserId,
}: ThreadClientProps) {
  const router = useRouter();
  const [replyBody, setReplyBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isConversation = threadMessages.length > 1;

  function handleReply() {
    if (!replyBody.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await replyToMessage(message.id, replyBody.trim());
      if (result.success) {
        setReplyBody("");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to send reply");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteMessage(message.id);
      setDeleteDialogOpen(false);
      router.push("/messages/inbox");
    });
  }

  function handleToggleRead() {
    startTransition(async () => {
      if (message.isRead) {
        await markAsUnread(message.id);
      } else {
        await markAsRead(message.id);
      }
      router.refresh();
    });
  }

  function formatDate(iso: string) {
    const date = new Date(iso);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(iso: string) {
    const date = new Date(iso);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <PageHeader
        title={message.subject ?? "Message"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Messages", href: "/messages/inbox" },
          { label: "View Message" },
        ]}
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/messages/inbox">
              <ArrowLeft className="mr-1 size-3.5" />
              Back to Inbox
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleRead}
              disabled={isPending}
            >
              {message.isRead ? (
                <>
                  <Mail className="mr-1 size-3.5" />
                  Mark Unread
                </>
              ) : (
                <>
                  <MailOpen className="mr-1 size-3.5" />
                  Mark Read
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-1 size-3.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* Message Header Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(message.senderName)}`}>
                  {initials(message.senderName)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {message.subject ?? "(No subject)"}
                  </h2>
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      From: <strong>{message.senderName}</strong>
                    </span>
                    <span className="mx-1">|</span>
                    <span>
                      To: <strong>{message.recipientName}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {message.isRead ? (
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
                )}
                {isConversation && (
                  <Badge
                    variant="outline"
                    className="border-primary text-primary"
                  >
                    {threadMessages.length} messages
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Thread / Conversation */}
        <div className="space-y-3">
          {threadMessages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <Card
                key={msg.id}
                className={
                  isOwn ? "border-l-4 border-l-primary/50" : ""
                }
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white ${
                          isOwn ? "bg-primary" : avatarColor(msg.senderName)
                        }`}
                      >
                        {initials(msg.senderName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {msg.senderName}
                          {isOwn && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (You)
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {formatDate(msg.createdAt)} at{" "}
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {msg.senderType}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="prose prose-sm max-w-none text-sm text-foreground whitespace-pre-wrap">
                    {msg.body}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Reply Section */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Reply</p>
            <Textarea
              placeholder="Type your reply..."
              rows={5}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <Button
                onClick={handleReply}
               
                disabled={!replyBody.trim() || isPending}
              >
                <Send className="mr-1 size-3.5" />
                {isPending ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </CardContent>
        </Card>
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
