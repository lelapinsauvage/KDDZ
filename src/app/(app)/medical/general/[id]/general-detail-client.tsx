"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";

// --- Constants ---

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// --- Schema ---

const generalFormSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  doctor: z.string().min(1, "Doctor name is required"),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  medications: z.string().optional(),
  specialNeeds: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  hasInsurance: z.boolean(),
  insuranceType: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  generalHealthNotes: z.string().optional(),
  doctorNotes: z.string().optional(),
});

type GeneralFormValues = z.infer<typeof generalFormSchema>;

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

interface GeneralDetailClientProps {
  isNew: boolean;
  formId: string | null;
  initialData: GeneralFormValues;
  initialStatus: "DRAFT" | "SUBMITTED" | "REVIEWED";
  childrenList: { id: string; name: string }[];
}

// --- Client Component ---

export function GeneralDetailClient({
  isNew,
  formId,
  initialData,
  initialStatus,
  childrenList,
}: GeneralDetailClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(initialStatus);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<GeneralFormValues>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: initialData,
  });

  const hasInsurance = watch("hasInsurance");
  const selectedChildId = watch("childId");

  // Find selected child name for breadcrumb
  const selectedChildName =
    childrenList.find((c) => c.id === selectedChildId)?.name ?? "";

  // --- Build data payload ---

  function buildPayload(values: GeneralFormValues) {
    return {
      doctor: values.doctor,
      bloodType: values.bloodType ?? "",
      allergies: values.allergies ?? "",
      chronicConditions: values.chronicConditions ?? "",
      medications: values.medications ?? "",
      specialNeeds: values.specialNeeds ?? "",
      emergencyContactName: values.emergencyContactName ?? "",
      emergencyContactPhone: values.emergencyContactPhone ?? "",
      hasInsurance: values.hasInsurance,
      insuranceType: values.hasInsurance ? (values.insuranceType ?? "") : "",
      insuranceExpiry: values.hasInsurance ? (values.insuranceExpiry ?? "") : "",
      generalHealthNotes: values.generalHealthNotes ?? "",
      doctorNotes: values.doctorNotes ?? "",
    };
  }

  // --- Save Draft ---

  async function onSaveDraft(values: GeneralFormValues) {
    setSaving(true);
    try {
      const data = buildPayload(values);

      if (isNew || !formId) {
        const result = await createMedicalForm({
          childId: values.childId,
          formType: "GENERAL",
          status: "DRAFT",
          data,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Draft saved successfully.");
      } else {
        const result = await updateMedicalForm(formId, {
          childId: values.childId,
          status: "DRAFT",
          data,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Draft updated successfully.");
      }
      setStatus("DRAFT");
      router.push("/medical/general");
    } finally {
      setSaving(false);
    }
  }

  // --- Submit ---

  async function onSubmitForm(values: GeneralFormValues) {
    setSubmitting(true);
    try {
      const data = buildPayload(values);

      if (isNew || !formId) {
        const result = await createMedicalForm({
          childId: values.childId,
          formType: "GENERAL",
          status: "SUBMITTED",
          data,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Form submitted successfully.");
      } else {
        const result = await updateMedicalForm(formId, {
          childId: values.childId,
          status: "SUBMITTED",
          data,
        });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Form submitted successfully.");
      }
      setStatus("SUBMITTED");
      router.push("/medical/general");
    } finally {
      setSubmitting(false);
    }
  }

  const isLoading = saving || submitting;

  return (
    <>
      <PageHeader
        title={isNew ? "New General Medical Form" : "General Medical Form"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "General", href: "/medical/general" },
          { label: isNew ? "New" : selectedChildName || "Detail" },
        ]}
      />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href="/medical/general">
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
              disabled={isLoading}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Draft
            </Button>
            <Button
              variant="default"
              className="text-white"
              onClick={handleSubmit(onSubmitForm)}
              disabled={isLoading}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Submit
            </Button>
          </div>
        </div>

        <form className="space-y-4 md:space-y-6">
          {/* Child Information */}
          <Card>
            <CardHeader>
              <CardTitle>Child Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="childId">Child</Label>
                  <Select
                    value={watch("childId")}
                    onValueChange={(val) => setValue("childId", val, { shouldValidate: true })}
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
                  <Label htmlFor="doctor">Doctor Name</Label>
                  <Input
                    placeholder="e.g. Dr. Antoine Karam"
                    {...register("doctor")}
                  />
                  {errors.doctor && (
                    <p className="text-xs text-red-500">{errors.doctor.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select
                    value={watch("bloodType") ?? ""}
                    onValueChange={(val) => setValue("bloodType", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map((bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    placeholder="List any known allergies..."
                    rows={3}
                    {...register("allergies")}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="chronicConditions">Chronic Conditions</Label>
                  <Textarea
                    placeholder="List any chronic conditions (e.g. asthma, diabetes)..."
                    rows={3}
                    {...register("chronicConditions")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medications & Special Needs */}
          <Card>
            <CardHeader>
              <CardTitle>Medications & Special Needs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="medications">Medications</Label>
                  <Textarea
                    placeholder="List current medications and dosages..."
                    rows={3}
                    {...register("medications")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialNeeds">Special Needs</Label>
                  <Textarea
                    placeholder="Describe any special needs or accommodations..."
                    rows={3}
                    {...register("specialNeeds")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contact Name</Label>
                  <Input
                    placeholder="e.g. John Doe"
                    {...register("emergencyContactName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                  <Input
                    placeholder="e.g. +961 70 123456"
                    {...register("emergencyContactPhone")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="hasInsurance"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="hasInsurance"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="hasInsurance" className="cursor-pointer">
                    Child has insurance
                  </Label>
                </div>

                {hasInsurance && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="insuranceType">Insurance Type</Label>
                      <Input
                        placeholder="e.g. NSSF, Private, COOP"
                        {...register("insuranceType")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insuranceExpiry">Insurance Expiry Date</Label>
                      <Input type="date" {...register("insuranceExpiry")} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="generalHealthNotes">General Health Notes</Label>
                  <Textarea
                    placeholder="Enter general health observations, developmental notes, etc."
                    rows={4}
                    {...register("generalHealthNotes")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctorNotes">Doctor Notes</Label>
                  <Textarea
                    placeholder="Doctor's observations and recommendations..."
                    rows={4}
                    {...register("doctorNotes")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
