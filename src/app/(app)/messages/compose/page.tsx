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

const recipientOptions = [
  { id: "all-teachers", name: "All Teachers", type: "group" },
  { id: "all-parents-nursery-a", name: "All Parents — Nursery A", type: "group" },
  { id: "all-parents-toddler-a", name: "All Parents — Toddler A", type: "group" },
  { id: "sara-khalil", name: "Sara Khalil (Teacher)", type: "individual" },
  { id: "rima-haddad", name: "Rima Haddad (Teacher)", type: "individual" },
  { id: "layla-bazzi", name: "Layla Bazzi (Nurse)", type: "individual" },
  { id: "omar-gemayel", name: "Omar Gemayel (Manager)", type: "individual" },
];

export default function ComposeMessagePage() {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function handleSend() {
    console.log("Sending message:", { recipient, subject, body });
    // TODO: POST to API
  }

  return (
    <>
      <PageHeader
        title="Compose Message"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Messages" },
          { label: "Compose" },
        ]}
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent>
                  {recipientOptions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
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
