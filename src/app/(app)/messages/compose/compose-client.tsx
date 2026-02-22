"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, UserRound, Users, Inbox } from "lucide-react";
import { sendMessage } from "@/lib/actions/messages";
import type { RecipientType } from "@/generated/prisma/enums";

interface Recipient {
  id: string;
  name: string;
  type: "employee" | "parent";
  recipientType: RecipientType;
}

interface ComposeClientProps {
  recipients: Recipient[];
}

export function ComposeClient({ recipients }: ComposeClientProps) {
  const router = useRouter();
  const [recipient, setRecipient] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredRecipients = useMemo(() => {
    if (!recipientSearch) return recipients;
    const q = recipientSearch.toLowerCase();
    return recipients.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipients, recipientSearch]);

  function handleSend() {
    const selected = recipients.find((r) => r.id === recipient);
    if (!selected) return;

    setError(null);
    startTransition(async () => {
      const result = await sendMessage({
        recipientId: selected.id,
        recipientType: selected.recipientType,
        subject: subject || null,
        body,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/messages/sent"), 1000);
      } else {
        setError(result.error ?? "Failed to send message");
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Compose Message"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Messages", href: "/messages/inbox" },
          { label: "Compose" },
        ]}
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-3 py-3">
              <UserRound className="size-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Direct Message
                </p>
                <p className="text-xs text-muted-foreground">
                  Send to one person
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/messages/compose/direct">Go</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-300/50 bg-blue-50/50">
            <CardContent className="flex items-center gap-3 py-3">
              <Users className="size-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Class Message
                </p>
                <p className="text-xs text-muted-foreground">
                  Send to all parents in a class
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/messages/compose/class">Go</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 py-3">
              <Inbox className="size-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Inbox</p>
                <p className="text-xs text-muted-foreground">
                  View received messages
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/messages/inbox">Go</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Compose Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                placeholder="Search recipients..."
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                className="mb-2"
              />
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredRecipients.length > 0 ? (
                    filteredRecipients.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No recipients found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Message subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message..."
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">
                Message sent successfully! Redirecting...
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => router.push("/messages/inbox")}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
               
                disabled={!recipient || !subject || !body || isPending || success}
              >
                <Send className="mr-1 size-3.5" />
                {isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
