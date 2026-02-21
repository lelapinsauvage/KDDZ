"use client";

import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
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
import { ArrowLeft, Save, Send } from "lucide-react";

// --- Schema ---

const visitFormSchema = z.object({
  childName: z.string().min(1, "Child name is required"),
  doctor: z.string().min(1, "Doctor is required"),
  visitDate: z.string().min(1, "Visit date is required"),
  reason: z.string().min(1, "Reason is required"),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prescriptions: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

type VisitFormValues = z.infer<typeof visitFormSchema>;

// --- Props ---

interface VisitDetailClientProps {
  isNew: boolean;
  formData: VisitFormValues;
  children: { id: string; name: string }[];
}

// --- Client Component ---

export function VisitDetailClient({ isNew, formData, children }: VisitDetailClientProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: formData,
  });

  const onSave = (data: VisitFormValues) => {
    console.log("Saving visit:", data);
  };

  const onSubmit = (data: VisitFormValues) => {
    console.log("Submitting visit:", data);
  };

  return (
    <>
      <PageHeader
        title={isNew ? "New Doctor Visit" : "Doctor Visit"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Visits", href: "/medical/visits" },
          { label: isNew ? "New" : formData.childName },
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
            <Button variant="outline" onClick={handleSubmit(onSave)}>
              <Save className="size-4" />
              Save Draft
            </Button>
            <Button
              style={{ background: "#1caf9a" }}
              className="text-white"
              onClick={handleSubmit(onSubmit)}
            >
              <Send className="size-4" />
              Submit
            </Button>
          </div>
        </div>

        <form className="space-y-6">
          {/* Visit Info */}
          <Card>
            <CardHeader>
              <CardTitle>Visit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Child Name</Label>
                  <Select
                    value={watch("childName")}
                    onValueChange={(val) => setValue("childName", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={child.name}>
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.childName && (
                    <p className="text-xs text-red-500">{errors.childName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Input placeholder="e.g. Dr. Antoine Karam" {...register("doctor")} />
                  {errors.doctor && (
                    <p className="text-xs text-red-500">{errors.doctor.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Visit Date</Label>
                  <Input type="date" {...register("visitDate")} />
                  {errors.visitDate && (
                    <p className="text-xs text-red-500">{errors.visitDate.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label>Reason for Visit</Label>
                <Input placeholder="e.g. Annual checkup, follow-up, etc." {...register("reason")} />
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
                <div className="space-y-2">
                  <Label>Prescriptions</Label>
                  <Textarea
                    placeholder="Medications prescribed..."
                    rows={2}
                    {...register("prescriptions")}
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
