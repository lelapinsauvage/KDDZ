"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  absenceReportSchema,
  type AbsenceReportFormValues,
} from "@/lib/validations/absence-report";
import {
  createAbsenceReport,
  updateAbsenceReport,
} from "@/lib/actions/absent-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserX, Loader2, Building2, Paperclip, Upload } from "lucide-react";

interface ChildOption {
  id: string;
  name: string;
  className: string;
}

interface AbsenceReportFormProps {
  childrenList: ChildOption[];
  defaultValues?: Partial<AbsenceReportFormValues>;
  reportId?: string;
}

export function AbsenceReportForm({
  childrenList,
  defaultValues,
  reportId,
}: AbsenceReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AbsenceReportFormValues>({
    resolver: zodResolver(absenceReportSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      status: "PENDING",
      ...defaultValues,
    },
  });

  function onSubmit(data: AbsenceReportFormValues) {
    setError(null);
    const fd = new FormData();
    fd.set("childId", data.childId);
    fd.set("date", data.date);
    if (data.reason) fd.set("reason", data.reason);
    if (data.absentFrom) fd.set("absentFrom", data.absentFrom);
    if (data.absentTo) fd.set("absentTo", data.absentTo);
    fd.set("hospitalized", String(data.hospitalized ?? false));
    if (data.hospitalName) fd.set("hospitalName", data.hospitalName);
    if (data.doctorName) fd.set("doctorName", data.doctorName);
    fd.set("status", data.status ?? "PENDING");

    startTransition(async () => {
      const result = reportId
        ? await updateAbsenceReport(reportId, fd)
        : await createAbsenceReport(fd);

      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        router.push("/absent-reports");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* General Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserX className="size-4 text-primary" />
            Absence Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="childId">Child *</Label>
              <Select
                value={watch("childId") || ""}
                onValueChange={(val) => setValue("childId", val)}
              >
                <SelectTrigger className={errors.childId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a child..." />
                </SelectTrigger>
                <SelectContent>
                  {childrenList.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name}{child.className ? ` — ${child.className}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.childId && (
                <p className="text-xs text-destructive">{errors.childId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                type="date"
                {...register("date")}
                className={errors.date ? "border-destructive" : ""}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status") || "PENDING"}
                onValueChange={(val) => setValue("status", val as "PENDING" | "APPROVED" | "REJECTED")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              placeholder="Reason for absence..."
              rows={4}
              {...register("reason")}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="absentFrom">Absent From</Label>
              <Input
                type="date"
                {...register("absentFrom")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="absentTo">Absent To</Label>
              <Input
                type="date"
                {...register("absentTo")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hospital Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-primary" />
            Hospital Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch
              id="hospitalized"
              checked={watch("hospitalized") ?? false}
              onCheckedChange={(checked) => setValue("hospitalized", checked)}
            />
            <Label htmlFor="hospitalized">Child attended hospital</Label>
          </div>

          {watch("hospitalized") && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name</Label>
                <Input
                  placeholder="Hospital name..."
                  {...register("hospitalName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor Name</Label>
                <Input
                  placeholder="Doctor name..."
                  {...register("doctorName")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="size-4 text-primary" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted">
            <Upload className="size-8 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Click to upload files
            </span>
            <span className="text-xs text-muted-foreground/70">
              Medical documents, doctor notes, etc.
            </span>
            <input type="file" multiple className="hidden" />
          </label>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-card px-4 py-3 md:px-6 md:py-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {reportId ? "Update Report" : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
