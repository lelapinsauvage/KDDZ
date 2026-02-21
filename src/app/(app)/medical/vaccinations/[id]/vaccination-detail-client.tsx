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

const vaccinationFormSchema = z.object({
  childName: z.string().min(1, "Child name is required"),
  vaccineName: z.string().min(1, "Vaccine name is required"),
  dateGiven: z.string().min(1, "Date given is required"),
  nextDueDate: z.string().optional(),
  batchNumber: z.string().optional(),
  administeredBy: z.string().optional(),
  notes: z.string().optional(),
});

type VaccinationFormValues = z.infer<typeof vaccinationFormSchema>;

// --- Props ---

interface VaccinationDetailClientProps {
  isNew: boolean;
  formData: VaccinationFormValues;
  children: { id: string; name: string }[];
}

// --- Client Component ---

export function VaccinationDetailClient({ isNew, formData, children }: VaccinationDetailClientProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VaccinationFormValues>({
    resolver: zodResolver(vaccinationFormSchema),
    defaultValues: formData,
  });

  const onSave = (data: VaccinationFormValues) => {
    console.log("Saving vaccination:", data);
  };

  const onSubmit = (data: VaccinationFormValues) => {
    console.log("Submitting vaccination:", data);
  };

  return (
    <>
      <PageHeader
        title={isNew ? "New Vaccination Record" : "Vaccination Record"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Vaccinations", href: "/medical/vaccinations" },
          { label: isNew ? "New" : formData.vaccineName || "Details" },
        ]}
      />
      <div className="p-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link href="/medical/vaccinations">
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
          {/* Child & Vaccine Info */}
          <Card>
            <CardHeader>
              <CardTitle>Vaccination Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <Label>Vaccine Name</Label>
                  <Select
                    value={watch("vaccineName")}
                    onValueChange={(val) => setValue("vaccineName", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select vaccine" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "DTaP (Diphtheria, Tetanus, Pertussis)",
                        "MMR (Measles, Mumps, Rubella)",
                        "Hepatitis A",
                        "Hepatitis B",
                        "IPV (Polio)",
                        "Varicella (Chickenpox)",
                        "PCV13 (Pneumococcal)",
                        "Hib (Haemophilus influenzae)",
                        "Rotavirus",
                        "Influenza (Seasonal Flu)",
                      ].map((vaccine) => (
                        <SelectItem key={vaccine} value={vaccine}>
                          {vaccine}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vaccineName && (
                    <p className="text-xs text-red-500">{errors.vaccineName.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Administration */}
          <Card>
            <CardHeader>
              <CardTitle>Administration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Date Given</Label>
                  <Input type="date" {...register("dateGiven")} />
                  {errors.dateGiven && (
                    <p className="text-xs text-red-500">{errors.dateGiven.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Next Due Date</Label>
                  <Input type="date" {...register("nextDueDate")} />
                </div>
                <div className="space-y-2">
                  <Label>Batch Number</Label>
                  <Input placeholder="e.g. DTaP-2026-A4821" {...register("batchNumber")} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Administered By</Label>
                  <Input placeholder="e.g. Dr. Antoine Karam" {...register("administeredBy")} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any additional notes, reactions observed, follow-up instructions..."
                rows={4}
                {...register("notes")}
              />
            </CardContent>
          </Card>
        </form>
      </div>
    </>
  );
}
