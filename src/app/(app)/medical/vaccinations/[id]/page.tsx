"use client";

import { use } from "react";
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

// --- Demo Data ---

const demoVaccinationsMap: Record<string, VaccinationFormValues> = {
  vr1: {
    childName: "Lara Haddad",
    vaccineName: "DTaP (Diphtheria, Tetanus, Pertussis)",
    dateGiven: "2026-01-15",
    nextDueDate: "2026-07-15",
    batchNumber: "DTaP-2026-A4821",
    administeredBy: "Dr. Antoine Karam",
    notes: "4th dose in series. Child tolerated well, no adverse reactions observed during 15-minute monitoring period.",
  },
  vr2: {
    childName: "Adam Khoury",
    vaccineName: "MMR (Measles, Mumps, Rubella)",
    dateGiven: "2025-12-10",
    nextDueDate: "2026-06-10",
    batchNumber: "MMR-2025-B7293",
    administeredBy: "Dr. Nadia Saade",
    notes: "1st dose. Parents informed of possible mild fever 7-12 days post-vaccination. Advised to give paracetamol if needed.",
  },
  vr3: {
    childName: "Mia Gemayel",
    vaccineName: "Hepatitis B - Dose 3",
    dateGiven: "2025-11-05",
    nextDueDate: "",
    batchNumber: "HepB-2025-C1456",
    administeredBy: "Dr. Antoine Karam",
    notes: "Final dose in Hepatitis B series. Series complete. No further doses required.",
  },
  vr4: {
    childName: "Jad Nassar",
    vaccineName: "IPV (Polio)",
    dateGiven: "2025-08-20",
    nextDueDate: "2026-02-20",
    batchNumber: "IPV-2025-D8734",
    administeredBy: "Dr. Rami Haddad",
    notes: "3rd dose. Next dose overdue - parents to be contacted for scheduling.",
  },
  new: {
    childName: "",
    vaccineName: "",
    dateGiven: new Date().toISOString().split("T")[0],
    nextDueDate: "",
    batchNumber: "",
    administeredBy: "",
    notes: "",
  },
};

// --- Page Component ---

export default function VaccinationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isNew = id === "new";
  const formData = demoVaccinationsMap[id] || demoVaccinationsMap["new"];

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
                      {[
                        "Lara Haddad",
                        "Adam Khoury",
                        "Mia Gemayel",
                        "Jad Nassar",
                        "Lea Boustany",
                        "Karim Saab",
                        "Nour Mansour",
                        "Zein Abi Saab",
                        "Tia Daher",
                        "Rayan Frem",
                        "Yasmine Geagea",
                        "Tarek Hariri",
                      ].map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
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
