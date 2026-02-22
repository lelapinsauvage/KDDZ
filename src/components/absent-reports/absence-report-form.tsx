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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserX, Loader2 } from "lucide-react";

interface ChildOption {
  id: string;
  name: string;
  className: string;
}

interface AbsenceReportFormProps {
  children: ChildOption[];
  defaultValues?: Partial<AbsenceReportFormValues>;
  reportId?: string;
}

export function AbsenceReportForm({
  children: childrenList,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* General Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserX className="size-4 text-[#1caf9a]" />
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
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t bg-card px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} style={{ background: "#1caf9a" }}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {reportId ? "Update Report" : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
