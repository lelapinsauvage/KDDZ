"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, PenSquare, SendHorizonal } from "lucide-react";

interface SentMessage {
  id: string;
  recipientId: string;
  recipientType: string;
  subject: string | null;
  body: string;
  createdAt: string;
  threadId: string | null;
}

interface SentClientProps {
  messages: SentMessage[];
  total: number;
}

export function SentClient({ messages, total }: SentClientProps) {
  return (
    <>
      <PageHeader
        title="Sent Messages"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Messages" },
          { label: "Sent" },
        ]}
      />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search sent messages..." className="pl-9" />
          </div>
          <Button asChild size="sm" style={{ background: "#1caf9a" }}>
            <Link href="/messages/compose">
              <PenSquare className="mr-1 size-3.5" />
              Compose
            </Link>
          </Button>
        </div>

        {/* Message List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {messages.length > 0 ? (
                messages.map((msg) => {
                  const date = new Date(msg.createdAt);
                  const dateStr = date.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isGroup = msg.threadId !== null;

                  return (
                    <div
                      key={msg.id}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <SendHorizonal className="mt-1 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            To: {msg.recipientId.slice(0, 8)}...
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isGroup
                                ? "border-[#1caf9a] text-[#1caf9a]"
                                : ""
                            }`}
                          >
                            {isGroup ? "Group" : msg.recipientType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {msg.subject ?? "(No subject)"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {msg.body}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">{dateStr}</p>
                        <p className="text-xs text-muted-foreground">{timeStr}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No sent messages yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {total > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing {messages.length} of {total} messages
          </p>
        )}
      </div>
    </>
  );
}
