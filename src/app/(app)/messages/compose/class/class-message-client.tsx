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
import { Send, Users } from "lucide-react";
import { sendClassMessage } from "@/lib/actions/messages";

interface ClassOption {
  id: string;
  name: string;
  branchName: string;
  childCount: number;
}

interface ClassMessageClientProps {
  classes: ClassOption[];
}

export function ClassMessageClient({ classes }: ClassMessageClientProps) {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState("");
  const [nature, setNature] = useState("General");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const selectedClassDetail = useMemo(() => {
    if (!selectedClass) return null;
    return classes.find((c) => c.id === selectedClass) ?? null;
  }, [selectedClass, classes]);

  function handleSend() {
    if (!selectedClass) return;

    setError(null);
    startTransition(async () => {
      const result = await sendClassMessage({
        classId: selectedClass,
        subject: subject || null,
        body,
        nature,
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

      <div className="p-4 md:p-6">
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

            <div className="space-y-2">
              <Label>Nature</Label>
              <Select value={nature} onValueChange={setNature}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
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
                placeholder="Type your message to all parents in the selected class..."
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && (
              <p className="text-sm text-green-600">
                Message sent to {sentCount} parent
                {sentCount !== 1 ? "s" : ""} successfully! Redirecting...
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
               
                disabled={
                  !selectedClass || !subject || !body || isPending || success
                }
              >
                <Send className="mr-1 size-3.5" />
                {isPending ? "Sending..." : "Send to Class"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
