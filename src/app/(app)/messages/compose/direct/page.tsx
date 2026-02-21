"use client";

import { useState } from "react";
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

// Individual recipients only (no groups)
const individualRecipients = [
  { id: "sara-khalil", name: "Sara Khalil", role: "Teacher" },
  { id: "rima-haddad", name: "Rima Haddad", role: "Teacher" },
  { id: "layla-bazzi", name: "Layla Bazzi", role: "Nurse" },
  { id: "omar-gemayel", name: "Omar Gemayel", role: "Manager" },
  { id: "maya-nassar", name: "Maya Nassar", role: "Parent" },
  { id: "nada-boustany", name: "Nada Boustany", role: "Parent" },
  { id: "hala-daher", name: "Hala Daher", role: "Nurse" },
];

export default function DirectMessagePage() {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function handleSend() {
    console.log("Sending direct message:", { recipient, subject, body });
    // TODO: POST to API
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

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Direct Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a person..." />
                </SelectTrigger>
                <SelectContent>
                  {individualRecipients.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.role})
                    </SelectItem>
                  ))}
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

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline">Save Draft</Button>
              <Button
                onClick={handleSend}
                style={{ background: "#1caf9a" }}
                disabled={!recipient || !subject || !body}
              >
                <Send className="mr-1 size-3.5" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
