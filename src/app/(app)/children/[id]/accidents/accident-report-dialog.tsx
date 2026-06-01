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
import { createMedicalForm } from "@/lib/actions/medical";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import { FileText, Upload, X } from "lucide-react";

const LOCATION_OPTIONS = [
  { value: "playground", label: "Playground" },
  { value: "classroom", label: "Classroom" },
  { value: "bathroom", label: "Bathroom" },
  { value: "hallway", label: "Hallway" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "outdoor", label: "Outdoor Area" },
  { value: "stairs", label: "Stairs" },
  { value: "other", label: "Other" },
];

const FIRST_AID_OPTIONS = [
  { value: "none", label: "None" },
  { value: "bandage", label: "Bandage" },
  { value: "ice_pack", label: "Ice Pack" },
  { value: "antiseptic", label: "Antiseptic" },
  { value: "splint", label: "Splint" },
  { value: "other", label: "Other" },
];

const HOSPITAL_OPTIONS = [
  { value: "none", label: "Not Required" },
  { value: "emergency_room", label: "Emergency Room" },
  { value: "hospital_visit", label: "Hospital Visit" },
  { value: "ambulance", label: "Ambulance Called" },
];

const TREATMENT_OPTIONS = [
  { value: "none", label: "No Treatment Needed" },
  { value: "minor_wound_care", label: "Minor Wound Care" },
  { value: "medication", label: "Medication" },
  { value: "stitches", label: "Stitches" },
  { value: "cast_splint", label: "Cast / Splint" },
  { value: "observation", label: "Observation" },
  { value: "other", label: "Other" },
];

interface Props {
  childId: string;
  branchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffList: { id: string; name: string | null; email: string }[];
}

export function AccidentReportDialog({
  childId,
  branchId,
  open,
  onOpenChange,
  staffList,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [cause, setCause] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [specifyArea, setSpecifyArea] = useState("");
  const [cameraNumber, setCameraNumber] = useState("");
  const [firstAid, setFirstAid] = useState("");
  const [emergencyHospital, setEmergencyHospital] = useState("");
  const [treatment, setTreatment] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState("");

  function resetForm() {
    setCause("");
    setDate(new Date().toISOString().slice(0, 10));
    setTime("");
    setLocation("");
    setSpecifyArea("");
    setCameraNumber("");
    setFirstAid("");
    setEmergencyHospital("");
    setTreatment("");
    setTeacherId("");
    setAttachments([]);
    setError("");
  }

  function addAttachments(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (files.length) {
      setAttachments((current) => [...current, ...files]);
    }
  }

  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter((_, attachmentIndex) => attachmentIndex !== index),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!cause.trim()) {
      setError("Cause is required");
      return;
    }
    if (!date) {
      setError("Date is required");
      return;
    }
    if (!location) {
      setError("Location is required");
      return;
    }

    setError("");

    startTransition(async () => {
      const uploadedAttachments: Array<{ filename: string; fileUrl: string }> = [];
      if (attachments.length) {
        try {
          for (const file of attachments) {
            const uploaded = await uploadFileWithPresign({
              branchId,
              scope: "form-attachment",
              ownerId: childId,
              file,
            });
            uploadedAttachments.push({
              filename: file.name,
              fileUrl: uploaded.publicUrl,
            });
          }
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload attachments",
          );
          return;
        }
      }

      const result = await createMedicalForm({
        childId,
        formType: "ACCIDENTS",
        status: "SUBMITTED",
        data: {
          cause,
          date,
          time,
          location,
          specifyArea,
          cameraNumber,
          firstAid,
          emergencyHospital,
          treatment,
          teacherId,
        },
        attachments: uploadedAttachments,
      });

      if (result.error) {
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Accident Report</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Cause */}
          <div className="space-y-1.5">
            <Label htmlFor="cause">Cause *</Label>
            <Textarea
              id="cause"
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              placeholder="Describe the cause of the accident..."
              rows={2}
            />
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="acc-date">Date *</Label>
              <Input
                id="acc-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-time">Time</Label>
              <Input
                id="acc-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Location select */}
          <div className="space-y-1.5">
            <Label>The accident happened *</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location..." />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specify Area & Camera Number */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="specify-area">Specify Area</Label>
              <Input
                id="specify-area"
                value={specifyArea}
                onChange={(e) => setSpecifyArea(e.target.value)}
                placeholder="e.g. Near the slide"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camera-number">Camera Number</Label>
              <Input
                id="camera-number"
                value={cameraNumber}
                onChange={(e) => setCameraNumber(e.target.value)}
                placeholder="e.g. CAM-03"
              />
            </div>
          </div>

          {/* First Aid */}
          <div className="space-y-1.5">
            <Label>First Aid Applied</Label>
            <Select value={firstAid} onValueChange={setFirstAid}>
              <SelectTrigger>
                <SelectValue placeholder="Select first aid..." />
              </SelectTrigger>
              <SelectContent>
                {FIRST_AID_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Emergency Hospital */}
          <div className="space-y-1.5">
            <Label>Emergency Hospital</Label>
            <Select value={emergencyHospital} onValueChange={setEmergencyHospital}>
              <SelectTrigger>
                <SelectValue placeholder="Select hospital action..." />
              </SelectTrigger>
              <SelectContent>
                {HOSPITAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Treatment */}
          <div className="space-y-1.5">
            <Label>Treatment</Label>
            <Select value={treatment} onValueChange={setTreatment}>
              <SelectTrigger>
                <SelectValue placeholder="Select treatment..." />
              </SelectTrigger>
              <SelectContent>
                {TREATMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {/* Attachments */}
          <div className="space-y-1.5">
            <Label>Attachments</Label>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center gap-2 rounded-md border bg-muted/30 p-2"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      disabled={isPending}
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addAttachments(event.dataTransfer.files);
              }}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <Upload className="size-4" />
              Add files
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(event) => addAttachments(event.target.files)}
              />
            </label>
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
              {isPending ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
