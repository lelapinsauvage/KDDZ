"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import { createMedicalForm, updateMedicalForm } from "@/lib/actions/medical";

// --- Schema ---

const visitFormSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  visitDate: z.string().min(1, "Visit date is required"),
  doctor: z.string().min(1, "Doctor is required"),
  reason: z.string().min(1, "Reason for visit is required"),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

type VisitFormValues = z.infer<typeof visitFormSchema>;

// --- Status badge ---

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Submitted
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Reviewed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// --- Props ---

interface VisitDetailClientProps {
  isNew: boolean;
  formId: string | null;
  initialData: VisitFormValues;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  children: { id: string; name: string }[];
}

// --- Client Component ---

export function VisitDetailClient({
  isNew,
  formId,
  initialData,
  status,
  children,
}: VisitDetailClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: initialData,
  });

  const selectedChildId = watch("childId");
  const selectedChildName =
    children.find((c) => c.id === selectedChildId)?.name ?? "";

  const buildPayload = (data: VisitFormValues, formStatus: "DRAFT" | "SUBMITTED") => ({
    childId: data.childId,
    formType: "VISITS" as const,
    status: formStatus,
    data: {
      visitDate: data.visitDate,
      doctor: data.doctor,
      reason: data.reason,
      diagnosis: data.diagnosis ?? "",
      treatment: data.treatment ?? "",
      followUpDate: data.followUpDate ?? "",
      notes: data.notes ?? "",
    },
  });

  const onSaveDraft = async (data: VisitFormValues) => {
    setIsSaving(true);
    try {
      const payload = buildPayload(data, "DRAFT");

      const result = isNew
        ? await createMedicalForm(payload)
        : await updateMedicalForm(formId!, payload);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Visit saved as draft.");
        router.push("/medical/visits");
      }
    } catch {
      toast.error("Failed to save visit.");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitForm = async (data: VisitFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = buildPayload(data, "SUBMITTED");

      const result = isNew
        ? await createMedicalForm(payload)
        : await updateMedicalForm(formId!, payload);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Visit submitted successfully.");
        router.push("/medical/visits");
      }
    } catch {
      toast.error("Failed to submit visit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSaving || isSubmitting;

  return (
    <>
      <PageHeader
        title={isNew ? "New Doctor Visit" : "Doctor Visit"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Visits", href: "/medical/visits" },
          { label: isNew ? "New" : selectedChildName || "Details" },
        ]}
      />
      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href="/medical/visits">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to List
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getStatusBadge(status)}
            <Button
              variant="outline"
              onClick={handleSubmit(onSaveDraft)}
              disabled={busy}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Draft
            </Button>
            <Button
              style={{ background: "#1caf9a" }}
              className="text-white"
              onClick={handleSubmit(onSubmitForm)}
              disabled={busy}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Submit
            </Button>
          </div>
        </div>

        <form className="space-y-6">
          {/* Visit Information */}
          <Card>
            <CardHeader>
              <CardTitle>Visit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Child</Label>
                  <Select
                    value={watch("childId")}
                    onValueChange={(val) => setValue("childId", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.childId && (
                    <p className="text-xs text-red-500">{errors.childId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Visit Date</Label>
                  <Input type="date" {...register("visitDate")} />
                  {errors.visitDate && (
                    <p className="text-xs text-red-500">{errors.visitDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Input placeholder="e.g. Dr. Antoine Karam" {...register("doctor")} />
                  {errors.doctor && (
                    <p className="text-xs text-red-500">{errors.doctor.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Reason for Visit</Label>
                <Input
                  placeholder="e.g. Annual checkup, follow-up, illness..."
                  {...register("reason")}
                />
                {errors.reason && (
                  <p className="text-xs text-red-500">{errors.reason.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis & Treatment */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis & Treatment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Diagnosis</Label>
                  <Textarea
                    placeholder="Doctor's diagnosis..."
                    rows={3}
                    {...register("diagnosis")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Treatment</Label>
                  <Textarea
                    placeholder="Treatment plan and instructions..."
                    rows={3}
                    {...register("treatment")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Follow-up & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-up & Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Follow-up Date</Label>
                  <Input type="date" {...register("followUpDate")} />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any additional notes or observations..."
                  rows={4}
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
