"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, UserRound, Users, Loader2 } from "lucide-react";
import { sendMessage, sendClassMessage } from "@/lib/actions/messages";
import type { RecipientType } from "@/generated/prisma/enums";

type MessageMode = "person" | "class";

interface Recipient {
  id: string;
  name: string;
  type: "employee" | "parent";
  recipientType: RecipientType;
}

interface ClassOption {
  id: string;
  name: string;
  branchName: string;
  childCount: number;
}

interface ComposeClientProps {
  recipients: Recipient[];
  classes: ClassOption[];
}

export function ComposeClient({ recipients, classes }: ComposeClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<MessageMode>("person");
  const [recipient, setRecipient] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const filteredRecipients = useMemo(() => {
    if (!recipientSearch) return recipients;
    const q = recipientSearch.toLowerCase();
    return recipients.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipients, recipientSearch]);

  const selectedClassDetail = useMemo(() => {
    if (!selectedClass) return null;
    return classes.find((c) => c.id === selectedClass) ?? null;
  }, [selectedClass, classes]);

  function handleSend() {
    setError(null);

    if (mode === "person") {
      const selected = recipients.find((r) => r.id === recipient);
      if (!selected) return;

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
    } else {
      if (!selectedClass) return;

      startTransition(async () => {
        const result = await sendClassMessage({
          classId: selectedClass,
          subject: subject || null,
          body,
        });

        if (result.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = result.data as any;
          setSentCount(data?.recipientCount ?? 0);
          setSuccess(true);
          setTimeout(() => router.push("/messages/sent"), 2000);
        } else {
          setError(result.error ?? "Failed to send class message");
        }
      });
    }
  }

  const canSend =
    mode === "person"
      ? recipient && subject && body && !isPending && !success
      : selectedClass && subject && body && !isPending && !success;

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

      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Message</CardTitle>
              <div className="flex rounded-lg border p-0.5">
                <button
                  type="button"
                  onClick={() => setMode("person")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    mode === "person"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserRound className="size-3.5" />
                  Person
                </button>
                <button
                  type="button"
                  onClick={() => setMode("class")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    mode === "class"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="size-3.5" />
                  Class
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient picker — changes based on mode */}
            {mode === "person" ? (
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
            ) : (
              <div className="space-y-2">
                <Label>To (Class)</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} — {cls.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedClassDetail && (
                  <div className="flex items-center gap-2 pt-1">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Send to all parents in{" "}
                      <span className="font-medium text-foreground">
                        {selectedClassDetail.name}
                      </span>
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary font-normal"
                    >
                      {selectedClassDetail.childCount}{" "}
                      {selectedClassDetail.childCount === 1
                        ? "child"
                        : "children"}
                    </Badge>
                  </div>
                )}
              </div>
            )}

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
                placeholder={
                  mode === "person"
                    ? "Type your message..."
                    : "Type your message to all parents in the selected class..."
                }
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">
                {mode === "class"
                  ? `Message sent to ${sentCount} parent${sentCount !== 1 ? "s" : ""} successfully! Redirecting...`
                  : "Message sent successfully! Redirecting..."}
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
                disabled={!canSend}
                className="text-white"
              >
                {isPending ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1 size-3.5" />
                )}
                {isPending
                  ? "Sending..."
                  : mode === "class"
                    ? "Send to Class"
                    : "Send Message"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
