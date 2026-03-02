"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCallLog } from "@/lib/actions/calls";

const CALL_CAUSE_OPTIONS = [
  { value: "health", label: "Health Issue" },
  { value: "behavior", label: "Behavior" },
  { value: "absence", label: "Absence" },
  { value: "pickup", label: "Pickup Arrangement" },
  { value: "emergency", label: "Emergency" },
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "complaint", label: "Complaint" },
  { value: "follow_up", label: "Follow Up" },
  { value: "other", label: "Other" },
];

interface Props {
  childId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffList: { id: string; name: string | null; email: string }[];
}

export function CallReportDialog({
  childId,
  open,
  onOpenChange,
  staffList,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [direction, setDirection] = useState<"INCOMING" | "OUTGOING">("INCOMING");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [causeOfCall, setCauseOfCall] = useState("");
  const [subject, setSubject] = useState("");
  const [remarks, setRemarks] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState("");

  function resetForm() {
    setDirection("INCOMING");
    setDate(new Date().toISOString().slice(0, 10));
    setTime("");
    setCauseOfCall("");
    setSubject("");
    setRemarks("");
    setTeacherId("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!date) {
      setError("Date is required");
      return;
    }

    setError("");

    startTransition(async () => {
      const result = await createCallLog({
        childId,
        direction,
        date,
        time: time || undefined,
        reason: causeOfCall || undefined,
        subject: subject || undefined,
        remarks: remarks || undefined,
        staffId: teacherId || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      resetForm();
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Log Call</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Call Type */}
          <div className="space-y-1.5">
            <Label>Call Type *</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as "INCOMING" | "OUTGOING")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOMING">Incoming</SelectItem>
                <SelectItem value="OUTGOING">Outgoing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="call-date">Date *</Label>
              <Input
                id="call-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="call-time">Time</Label>
              <Input
                id="call-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Cause of Call */}
          <div className="space-y-1.5">
            <Label>Cause of Call</Label>
            <Select value={causeOfCall} onValueChange={setCauseOfCall}>
              <SelectTrigger>
                <SelectValue placeholder="Select cause..." />
              </SelectTrigger>
              <SelectContent>
                {CALL_CAUSE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="call-subject">Subject</Label>
            <Input
              id="call-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief subject of the call..."
            />
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <Label htmlFor="call-remarks">Remarks</Label>
            <Textarea
              id="call-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Teacher who filled report */}
          <div className="space-y-1.5">
            <Label>Teacher Who Filled Report</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher..." />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Attachments placeholder */}
          <div className="space-y-1.5">
            <Label>Attachments</Label>
            <div className="flex items-center justify-center rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              File upload coming soon
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Call Log"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
