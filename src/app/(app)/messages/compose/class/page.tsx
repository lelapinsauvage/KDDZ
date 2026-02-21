"use client";

import { useState, useMemo } from "react";
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
import { Send, Users } from "lucide-react";
import { demoClasses, demoChildren, demoBranches } from "@/lib/demo-data";

export default function ClassMessagePage() {
  const [selectedClass, setSelectedClass] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Count the number of parents (children) in the selected class
  const recipientCount = useMemo(() => {
    if (!selectedClass) return 0;
    return demoChildren.filter((c) => c.classId === selectedClass).length;
  }, [selectedClass]);

  // Get branch name for the selected class
  const selectedClassDetail = useMemo(() => {
    if (!selectedClass) return null;
    const cls = demoClasses.find((c) => c.id === selectedClass);
    if (!cls) return null;
    const branch = demoBranches.find((b) => b.id === cls.branchId);
    return { ...cls, branchName: branch?.name ?? "Unknown" };
  }, [selectedClass]);

  function handleSend() {
    console.log("Sending class message:", { selectedClass, subject, body, recipientCount });
    // TODO: POST to API
  }

  return (
    <>
      <PageHeader
        title="Class Message"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Messages", href: "/messages/inbox" },
          { label: "Compose", href: "/messages/compose" },
          { label: "Class Message" },
        ]}
      />

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send Message to Class</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class..." />
                </SelectTrigger>
                <SelectContent>
                  {demoClasses.map((cls) => {
                    const branch = demoBranches.find((b) => b.id === cls.branchId);
                    return (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} — {branch?.name ?? "Unknown"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedClassDetail && (
                <div className="flex items-center gap-2 pt-1">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Send to all parents in{" "}
                    <span className="font-medium text-[#333]">{selectedClassDetail.name}</span>
                  </span>
                  <Badge variant="secondary" className="bg-[#1caf9a]/10 text-[#1caf9a] font-normal">
                    {recipientCount} {recipientCount === 1 ? "parent" : "parents"}
                  </Badge>
                </div>
              )}
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
                placeholder="Type your message to all parents in the selected class..."
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
                disabled={!selectedClass || !subject || !body}
              >
                <Send className="mr-1 size-3.5" />
                Send to Class
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
