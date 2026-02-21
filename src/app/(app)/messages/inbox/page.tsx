"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, MailOpen, Search, PenSquare, Trash2, Star } from "lucide-react";

const demoMessages = [
  {
    id: "m1",
    from: "Sara Khalil",
    fromRole: "Teacher",
    subject: "Lara Haddad — Daily Update",
    preview: "Lara had a great day today. She ate all her lunch and played well with her friends...",
    date: "2025-02-21",
    time: "14:30",
    isRead: false,
    isStarred: true,
  },
  {
    id: "m2",
    from: "Hala Daher",
    fromRole: "Nurse",
    subject: "Adam Khoury — Fever Notice",
    preview: "Adam had a mild fever of 37.8°C at 11:00 AM. We gave him water and monitored...",
    date: "2025-02-21",
    time: "11:15",
    isRead: false,
    isStarred: false,
  },
  {
    id: "m3",
    from: "Maya Nassar",
    fromRole: "Parent",
    subject: "Jad will be absent tomorrow",
    preview: "Hello, I wanted to let you know that Jad won't be coming tomorrow due to a doctor...",
    date: "2025-02-20",
    time: "18:45",
    isRead: true,
    isStarred: false,
  },
  {
    id: "m4",
    from: "Omar Gemayel",
    fromRole: "Manager",
    subject: "Staff Meeting Reminder — Friday",
    preview: "Reminder: We have our monthly staff meeting this Friday at 3:00 PM. Please prepare...",
    date: "2025-02-20",
    time: "09:00",
    isRead: true,
    isStarred: true,
  },
  {
    id: "m5",
    from: "Rima Haddad",
    fromRole: "Teacher",
    subject: "Pre-K A — Class Activity Photos",
    preview: "Hi, I've attached photos from today's art activity. The children created beautiful...",
    date: "2025-02-19",
    time: "15:20",
    isRead: true,
    isStarred: false,
  },
  {
    id: "m6",
    from: "Nada Boustany",
    fromRole: "Parent",
    subject: "Payment confirmation",
    preview: "I have transferred the February tuition. Please confirm receipt. Bank transfer ref...",
    date: "2025-02-18",
    time: "10:30",
    isRead: true,
    isStarred: false,
  },
];

export default function MessageInboxPage() {
  return (
    <>
      <PageHeader
        title="Message Inbox"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Messages" },
          { label: "Inbox" },
        ]}
      />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Trash2 className="mr-1 size-3.5" />
              Delete
            </Button>
            <Button asChild size="sm" style={{ background: "#1caf9a" }}>
              <Link href="/messages/compose">
                <PenSquare className="mr-1 size-3.5" />
                Compose
              </Link>
            </Button>
          </div>
        </div>

        {/* Message List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {demoMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
                    !msg.isRead ? "bg-[#1caf9a]/5" : ""
                  }`}
                >
                  <Checkbox className="mt-1" />
                  <button className="mt-1 text-muted-foreground hover:text-yellow-500">
                    <Star
                      className={`size-4 ${msg.isStarred ? "fill-yellow-500 text-yellow-500" : ""}`}
                    />
                  </button>
                  {msg.isRead ? (
                    <MailOpen className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Mail className="mt-1 size-4 shrink-0 text-[#1caf9a]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${!msg.isRead ? "font-semibold" : ""}`}>
                        {msg.from}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {msg.fromRole}
                      </Badge>
                    </div>
                    <p className={`text-sm ${!msg.isRead ? "font-medium" : "text-muted-foreground"}`}>
                      {msg.subject}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {msg.preview}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">{msg.date}</p>
                    <p className="text-xs text-muted-foreground">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
