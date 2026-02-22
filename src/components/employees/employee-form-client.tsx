"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import {
  employeeFormSchema,
  type EmployeeFormValues,
} from "@/lib/validations/employee";
import type { EmployeeType } from "@/components/employees/employee-columns";
import { createEmployee, updateEmployee } from "@/lib/actions/employees";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, ArrowLeft, User } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Branch {
  id: string;
  name: string;
}

interface EmployeeFormClientProps {
  type: EmployeeType;
  branches: Branch[];
  employee?: EmployeeFormValues & { id: string };
}

const labels: Record<EmployeeType, { singular: string; plural: string; pluralLower: string }> = {
  teacher: { singular: "Teacher", plural: "Teachers", pluralLower: "teachers" },
  nurse: { singular: "Nurse", plural: "Nurses", pluralLower: "nurses" },
  doctor: { singular: "Doctor", plural: "Doctors", pluralLower: "doctors" },
  manager: { singular: "Manager", plural: "Managers", pluralLower: "managers" },
};

// ---------------------------------------------------------------------------
// FormSection — collapsible card matching old Metronic portlet box
// ---------------------------------------------------------------------------

function FormSection({
  title,
  color = "blue",
  children,
}: {
  title: string;
  color?: "blue" | "green" | "yellow" | "purple";
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: "border-t-sky-400",
    green: "border-t-primary",
    yellow: "border-t-amber-400",
    purple: "border-t-violet-400",
  };
  return (
    <div className={`rounded-md border border-border bg-white ${colorMap[color]} border-t-4 shadow-sm`}>
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmployeeFormClient({
  type,
  branches,
  employee,
}: EmployeeFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!employee;
  const { singular, plural, pluralLower } = labels[type];

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: employee ?? {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      mobile: "",
      nationality: "",
      dateOfBirth: "",
      hireDate: "",
      specialization: "",
      licenseNumber: "",
      branchId: "",
      isActive: true,
      address: { street: "", city: "", region: "" },
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  function onSubmit(data: EmployeeFormValues) {
    setError(null);
    startTransition(async () => {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        mobile: data.mobile || null,
        nationality: data.nationality || null,
        dateOfBirth: data.dateOfBirth || null,
        hireDate: data.hireDate || null,
        specialization: data.specialization || null,
        branchId: data.branchId,
        isActive: data.isActive,
        ...(type === "doctor" ? { licenseNumber: data.licenseNumber || null } : {}),
      };

      const result = isEditing
        ? await updateEmployee(type, employee!.id, payload)
        : await createEmployee(type, payload);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      router.push(`/employees/${pluralLower}`);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title={isEditing ? `Edit ${singular}` : `New ${singular}`}
        breadcrumbs={[
          { label: "Employees" },
          { label: plural, href: `/employees/${pluralLower}` },
          { label: isEditing ? "Edit" : "New" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* ── Left sidebar: profile photo + save button ── */}
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex size-40 items-center justify-center rounded-full bg-muted/50">
                <User className="size-20 text-[#c5ccd6]" />
              </div>
              <p className="mt-4 text-lg font-semibold text-foreground">
                {watch("firstName") || watch("lastName")
                  ? `${watch("firstName")} ${watch("lastName")}`
                  : `New ${singular}`}
              </p>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Save className="size-4" />
                {isPending ? "Saving..." : isEditing ? `Update ${singular}` : `Create ${singular}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/employees/${pluralLower}`)}
              >
                <ArrowLeft className="size-4" />
                Back to {plural}
              </Button>
            </div>
          </div>

          {/* ── Right: form sections ── */}
          <div className="space-y-6">
            {/* Personal Info */}
            <FormSection title={`${singular} Info`} color="blue">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="firstName" {...register("firstName")} placeholder="First Name" />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="lastName" {...register("lastName")} placeholder="Last Name" />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                </div>
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" {...register("nationality")} placeholder="Nationality" />
                </div>
                <div>
                  <Label htmlFor="specialization">
                    {type === "doctor" ? "Studied Domain" : "Specialization"}
                  </Label>
                  <Input
                    id="specialization"
                    {...register("specialization")}
                    placeholder={type === "doctor" ? "Studied Domain" : "Specialization"}
                  />
                </div>
                {type === "doctor" && (
                  <div>
                    <Label htmlFor="licenseNumber">Registration / License No</Label>
                    <Input
                      id="licenseNumber"
                      {...register("licenseNumber")}
                      placeholder="Registration number"
                    />
                  </div>
                )}
              </div>
            </FormSection>

            {/* Address */}
            <FormSection title="Address" color="green">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="address.street">Street</Label>
                  <Input id="address.street" {...register("address.street")} placeholder="Street" />
                </div>
                <div>
                  <Label htmlFor="address.city">City</Label>
                  <Input id="address.city" {...register("address.city")} placeholder="City" />
                </div>
                <div>
                  <Label htmlFor="address.region">Region</Label>
                  <Input id="address.region" {...register("address.region")} placeholder="Region" />
                </div>
              </div>
            </FormSection>

            {/* Contact Info */}
            <FormSection title="Contact Info" color="blue">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="phone">Telephone</Label>
                  <Input id="phone" {...register("phone")} placeholder="Telephone" />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input id="mobile" {...register("mobile")} placeholder="Mobile #" />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} placeholder="Email Address" />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Garderie Info */}
            <FormSection title="Garderie Info" color="blue">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="isActive">
                    Active <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watch("isActive") ? "true" : "false"}
                    onValueChange={(v) => setValue("isActive", v === "true")}
                  >
                    <SelectTrigger id="isActive">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branchId">
                    Branch <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watch("branchId")}
                    onValueChange={(v) => setValue("branchId", v)}
                  >
                    <SelectTrigger id="branchId">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.branchId && (
                    <p className="mt-1 text-xs text-red-500">{errors.branchId.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="hireDate">Hire Date</Label>
                  <Input id="hireDate" type="date" {...register("hireDate")} />
                </div>
              </div>
            </FormSection>

            {/* Attachments placeholder */}
            <FormSection title="Attachments" color="purple">
              <p className="text-sm text-muted-foreground">
                Attach photo, ID, vaccination card, certificates, contract documents, etc.
              </p>
              <p className="mt-2 text-xs text-[#999]">
                File upload will be available once the storage backend is configured.
              </p>
            </FormSection>
          </div>
        </div>
      </form>
    </>
  );
}
