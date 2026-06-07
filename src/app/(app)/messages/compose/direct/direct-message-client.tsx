"use client";

import { useState, useMemo, useTransition } from "react";
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
import { Send } from "lucide-react";
import { sendMessage } from "@/lib/actions/messages";
import type { RecipientType } from "@/generated/prisma/enums";
import type { MessageNatureOption } from "@/lib/message-compose-options";
import {
  DEFAULT_LEGACY_DELIVERY_OPTIONS,
  LegacyDeliveryOptionsField,
  type LegacyDeliveryOptions,
} from "../_components/legacy-delivery-options";

interface Recipient {
  id: string;
  name: string;
  role: string;
  recipientType: RecipientType;
}

interface DirectMessageClientProps {
  recipients: Recipient[];
  natures: MessageNatureOption[];
  defaultRecipientId?: string;
}

export function DirectMessageClient({
  recipients,
  natures,
  defaultRecipientId,
}: DirectMessageClientProps) {
  const router = useRouter();
  const [recipient, setRecipient] = useState(defaultRecipientId ?? "");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [nature, setNature] = useState(natures[0]?.value ?? "General");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delivery, setDelivery] = useState<LegacyDeliveryOptions>({
    ...DEFAULT_LEGACY_DELIVERY_OPTIONS,
    mobile: false,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const filteredRecipients = useMemo(() => {
    if (!recipientSearch) return recipients;
    const q = recipientSearch.toLowerCase();
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q),
    );
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
        nature,
        delivery,
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
        title="Direct Message"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Messages", href: "/messages/inbox" },
          { label: "Compose", href: "/messages/compose" },
          { label: "Direct Message" },
        ]}
      />

      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Direct Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                placeholder="Search by name or role..."
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                className="mb-2"
              />
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a person..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredRecipients.length > 0 ? (
                    filteredRecipients.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.role})
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
              <Label>Nature</Label>
              <Select value={nature} onValueChange={setNature}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {natures.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sending Via</Label>
              <LegacyDeliveryOptionsField
                value={delivery}
                onChange={setDelivery}
              />
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
                onClick={() => router.push("/messages/compose")}
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
