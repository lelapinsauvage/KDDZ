"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import {
  createMedicalForm,
  updateMedicalForm,
} from "@/lib/actions/medical";

// --- Constants ---

const CONDITION_TYPES = [
  "Allergy",
  "Asthma",
  "Diabetes",
  "Epilepsy",
  "Heart Condition",
  "Skin Condition",
  "Digestive",
  "Respiratory",
  "Other",
] as const;

// --- Schema ---

const conditionFormSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  conditionType: z.string().min(1, "Condition type is required"),
  description: z.string().optional(),
  severity: z.string().min(1, "Severity is required"),
  diagnosisDate: z.string().min(1, "Diagnosis date is required"),
  treatmentPlan: z.string().optional(),
  doctorNotes: z.string().optional(),
});

type ConditionFormValues = z.infer<typeof conditionFormSchema>;

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

interface ConditionDetailClientProps {
  isNew: boolean;
  formId: string | null;
  formData: ConditionFormValues;
  childrenList: { id: string; name: string }[];
}

// --- Client Component ---

export function ConditionDetailClient({
  isNew,
  formId,
  formData,
  childrenList,
}: ConditionDetailClientProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(isNew ? "DRAFT" : "SUBMITTED");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConditionFormValues>({
    resolver: zodResolver(conditionFormSchema),
    defaultValues: formData,
  });

  async function onSaveDraft(data: ConditionFormValues) {
    setIsSaving(true);
    try {
      const payload = {
        conditionType: data.conditionType,
        description: data.description ?? "",
        severity: data.severity,
        diagnosisDate: data.diagnosisDate,
        treatmentPlan: data.treatmentPlan ?? "",
        doctorNotes: data.doctorNotes ?? "",
      };

      let result;

      if (isNew) {
        result = await createMedicalForm({
          childId: data.childId,
          formType: "CONDITIONS",
          status: "DRAFT",
          data: payload,
        });
      } else {
        result = await updateMedicalForm(formId!, {
          childId: data.childId,
          status: "DRAFT",
          data: payload,
        });
      }

      if (result.success) {
        setCurrentStatus("DRAFT");
        toast.success("Draft saved successfully.");
        router.push("/medical/conditions");
      } else {
        toast.error(result.error || "Failed to save draft.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }

  async function onSubmit(data: ConditionFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        conditionType: data.conditionType,
        description: data.description ?? "",
        severity: data.severity,
        diagnosisDate: data.diagnosisDate,
        treatmentPlan: data.treatmentPlan ?? "",
        doctorNotes: data.doctorNotes ?? "",
      };

      let result;

      if (isNew) {
        result = await createMedicalForm({
          childId: data.childId,
          formType: "CONDITIONS",
          status: "SUBMITTED",
          data: payload,
        });
      } else {
        result = await updateMedicalForm(formId!, {
          childId: data.childId,
          status: "SUBMITTED",
          data: payload,
        });
      }

      if (result.success) {
        setCurrentStatus("SUBMITTED");
        toast.success(isNew ? "Condition submitted successfully." : "Condition updated successfully.");
        router.push("/medical/conditions");
      } else {
        toast.error(result.error || "Failed to submit condition.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoading = isSaving || isSubmitting;

  return (
    <>
      <PageHeader
        title={isNew ? "New Medical Condition" : "Medical Condition"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Conditions", href: "/medical/conditions" },
          { label: isNew ? "New" : formData.conditionType || "Details" },
        ]}
      />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href="/medical/conditions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to List
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {getStatusBadge(currentStatus)}
            <Button
              variant="outline"
              onClick={handleSubmit(onSaveDraft)}
              disabled={isLoading}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Draft
            </Button>
            <Button
              variant="default"
              className="text-white"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
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

        <form className="space-y-4 md:space-y-6">
          {/* Child & Condition */}
          <Card>
            <CardHeader>
              <CardTitle>Child & Condition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      {childrenList.map((child) => (
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
                  <Label>Condition Type</Label>
                  <Select
                    value={watch("conditionType")}
                    onValueChange={(val) => setValue("conditionType", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select condition type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.conditionType && (
                    <p className="text-xs text-red-500">{errors.conditionType.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the condition, triggers, and symptoms..."
                  rows={3}
                  {...register("description")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Severity & Diagnosis */}
          <Card>
            <CardHeader>
              <CardTitle>Severity & Diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select
                    value={watch("severity")}
                    onValueChange={(val) => setValue("severity", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mild">Mild</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.severity && (
                    <p className="text-xs text-red-500">{errors.severity.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Diagnosis Date</Label>
                  <Input type="date" {...register("diagnosisDate")} />
                  {errors.diagnosisDate && (
                    <p className="text-xs text-red-500">{errors.diagnosisDate.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Treatment Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe the treatment plan, medications, dietary restrictions, emergency procedures..."
                rows={5}
                {...register("treatmentPlan")}
              />
            </CardContent>
          </Card>

          {/* Doctor Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Doctor Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Doctor's observations and additional recommendations..."
                rows={4}
                {...register("doctorNotes")}
              />
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
