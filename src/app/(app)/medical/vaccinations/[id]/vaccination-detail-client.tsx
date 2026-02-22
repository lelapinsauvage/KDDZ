"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createVaccination, updateVaccination, deleteVaccination } from "@/lib/actions/medical";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";

// --- Constants ---

const VACCINE_OPTIONS = [
  "Hepatitis B",
  "IPV (Polio)",
  "OPV (Oral Polio)",
  "DPT-Hib-HepB",
  "Measles",
  "MMR",
  "DPT",
  "DT",
  "DTaP",
  "Varicella",
  "PCV13",
  "Hib",
  "Rotavirus",
  "Influenza",
  "Hepatitis A",
];

const DOSE_OPTIONS = [
  "1st Dose",
  "2nd Dose",
  "3rd Dose",
  "1st Booster",
  "2nd Booster",
];

// --- Schema ---

const vaccinationFormSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  vaccineName: z.string().min(1, "Vaccine name is required"),
  doseNumber: z.string().optional(),
  dateGiven: z.string().min(1, "Date given is required"),
  nextDueDate: z.string().optional(),
  administeredBy: z.string().optional(),
  notes: z.string().optional(),
});

type VaccinationFormValues = z.infer<typeof vaccinationFormSchema>;

// --- Props ---

interface VaccinationDetailClientProps {
  isNew: boolean;
  vaccinationId: string | null;
  childId: string;
  vaccineName: string;
  doseNumber: string;
  dateGiven: string;
  nextDueDate: string;
  administeredBy: string;
  notes: string;
  children: { id: string; name: string }[];
}

// --- Client Component ---

export function VaccinationDetailClient({
  isNew,
  vaccinationId,
  childId,
  vaccineName,
  doseNumber,
  dateGiven,
  nextDueDate,
  administeredBy,
  notes,
  children,
}: VaccinationDetailClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VaccinationFormValues>({
    resolver: zodResolver(vaccinationFormSchema),
    defaultValues: {
      childId,
      vaccineName,
      doseNumber,
      dateGiven,
      nextDueDate,
      administeredBy,
      notes,
    },
  });

  async function onSave(data: VaccinationFormValues) {
    setSaving(true);

    // Build the vaccine name with dose
    let fullVaccineName = data.vaccineName;
    if (data.doseNumber) {
      fullVaccineName = `${data.vaccineName} (${data.doseNumber})`;
    }

    // Build notes with administered by prefix
    let fullNotes = "";
    if (data.administeredBy) {
      fullNotes = `Administered by: ${data.administeredBy}.`;
      if (data.notes) {
        fullNotes += `\n${data.notes}`;
      }
    } else {
      fullNotes = data.notes ?? "";
    }

    try {
      if (isNew) {
        const result = await createVaccination({
          childId: data.childId,
          vaccineName: fullVaccineName,
          dateGiven: data.dateGiven,
          nextDueDate: data.nextDueDate || undefined,
          notes: fullNotes || undefined,
        });

        if (result.success) {
          toast.success("Vaccination record created successfully");
          router.push("/medical/vaccinations");
        } else {
          toast.error(result.error || "Failed to create vaccination record");
        }
      } else {
        const result = await updateVaccination(vaccinationId!, {
          childId: data.childId,
          vaccineName: fullVaccineName,
          dateGiven: data.dateGiven,
          nextDueDate: data.nextDueDate || null,
          notes: fullNotes || null,
        });

        if (result.success) {
          toast.success("Vaccination record updated successfully");
          router.push("/medical/vaccinations");
        } else {
          toast.error(result.error || "Failed to update vaccination record");
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!vaccinationId) return;
    setDeleting(true);
    try {
      const result = await deleteVaccination(vaccinationId);
      if (result.success) {
        toast.success("Vaccination record deleted");
        router.push("/medical/vaccinations");
      } else {
        toast.error(result.error || "Failed to delete vaccination record");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <>
      <PageHeader
        title={isNew ? "New Vaccination Record" : "Vaccination Record"}
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Vaccinations", href: "/medical/vaccinations" },
          { label: isNew ? "New" : watch("vaccineName") || "Details" },
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
            {!isNew && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setShowDeleteDialog(true)}
                disabled={saving || deleting}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
            <Button
              style={{ background: "#1caf9a" }}
              className="text-white"
              onClick={handleSubmit(onSave)}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <form className="space-y-6">
          {/* Vaccination Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vaccination Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>
                    Child <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watch("childId")}
                    onValueChange={(val) => setValue("childId", val, { shouldValidate: true })}
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
                  <Label>
                    Vaccine Name <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watch("vaccineName")}
                    onValueChange={(val) => setValue("vaccineName", val, { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select vaccine" />
                    </SelectTrigger>
                    <SelectContent>
                      {VACCINE_OPTIONS.map((vaccine) => (
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
                <div className="space-y-2">
                  <Label>Dose Number</Label>
                  <Select
                    value={watch("doseNumber") || ""}
                    onValueChange={(val) => setValue("doseNumber", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select dose" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOSE_OPTIONS.map((dose) => (
                        <SelectItem key={dose} value={dose}>
                          {dose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Administration Details */}
          <Card>
            <CardHeader>
              <CardTitle>Administration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>
                    Date Given <span className="text-red-500">*</span>
                  </Label>
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
                  <Label>Administered By</Label>
                  <Input
                    placeholder="e.g. Dr. Antoine Karam"
                    {...register("administeredBy")}
                  />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vaccination Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vaccination record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
