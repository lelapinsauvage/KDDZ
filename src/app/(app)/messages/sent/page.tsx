"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, PenSquare, SendHorizonal } from "lucide-react";

const demoSentMessages = [
  {
    id: "s1",
    to: "Maya Nassar",
    toRole: "Parent",
    subject: "Re: Jad will be absent tomorrow",
    preview: "Thank you for letting us know. We hope Jad feels better soon. Please don't hesitate to...",
    date: "2025-02-20",
    time: "19:10",
  },
  {
    id: "s2",
    to: "All Parents — Nursery A",
    toRole: "Group",
    subject: "Nursery A — Photo Day Reminder",
    preview: "Dear parents, a reminder that photo day for Nursery A is scheduled for next Monday...",
    date: "2025-02-20",
    time: "10:00",
  },
  {
    id: "s3",
    to: "Sara Khalil",
    toRole: "Teacher",
    subject: "Supply Request — Art Materials",
    preview: "Hi Sara, I've approved the supply request for the new art materials. They should arrive...",
    date: "2025-02-19",
    time: "14:45",
  },
  {
    id: "s4",
    to: "Nada Boustany",
    toRole: "Parent",
    subject: "Re: Payment confirmation",
    preview: "Thank you, Nada. We have received your payment and updated Lea's account accordingly...",
    date: "2025-02-18",
    time: "11:00",
  },
  {
    id: "s5",
    to: "All Teachers",
    toRole: "Group",
    subject: "Updated Holiday Schedule",
    preview: "Please find the updated holiday schedule for March attached. Note the change in the...",
    date: "2025-02-17",
    time: "09:30",
  },
];

export default function SentMessagesPage() {
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
              {demoSentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <SendHorizonal className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">To: {msg.to}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          msg.toRole === "Group"
                            ? "border-[#1caf9a] text-[#1caf9a]"
                            : ""
                        }`}
                      >
                        {msg.toRole}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.subject}</p>
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
