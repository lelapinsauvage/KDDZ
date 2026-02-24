"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import {
  branchFormSchema,
  type BranchFormValues,
} from "@/lib/validations/branch";
import { createBranch, updateBranch } from "@/lib/actions/branches";
import { PageHeader } from "@/components/layout/page-header";
import { FormSection } from "@/components/ui/form-section";
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
import { Save, ArrowLeft, Building2 } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BranchFormProps {
  branch?: BranchFormValues & { id: string };
  /** Hide PageHeader when rendered inside a layout that already has one */
  hideHeader?: boolean;
}

const COLOR_PRESETS = [
  "#1caf9a",
  "#4b8df8",
  "#e7505a",
  "#c49f47",
  "#8e44ad",
  "#e67e22",
  "#2ecc71",
  "#3498db",
  "#e74c3c",
  "#1abc9c",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BranchForm({ branch, hideHeader = false }: BranchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!branch;

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: branch ?? {
      name: "",
      prefix: "",
      address: "",
      phone: "",
      telephone: "",
      email: "",
      themeColor: "#1caf9a",
      isActive: true,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedColor = watch("themeColor") || "#1caf9a";

  function onSubmit(data: BranchFormValues) {
    setError(null);
    startTransition(async () => {
      const payload = {
        name: data.name,
        prefix: data.prefix || null,
        address: data.address || null,
        phone: data.phone || null,
        telephone: data.telephone || null,
        email: data.email || null,
        themeColor: data.themeColor || "#1caf9a",
        isActive: data.isActive,
      };

      const result = isEditing
        ? await updateBranch(branch!.id, payload)
        : await createBranch(payload);

      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      toast.success(
        isEditing ? "Branch updated successfully" : "Branch created successfully",
      );
      router.push("/branches");
      router.refresh();
    });
  }

  return (
    <>
      {!hideHeader && (
        <PageHeader
          title={isEditing ? "Edit Branch" : "New Branch"}
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Branches", href: "/branches" },
            { label: isEditing ? "Edit" : "New" },
          ]}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* ── Left sidebar ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
              <div
                className="mx-auto flex size-28 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${selectedColor}20` }}
              >
                <Building2
                  className="size-14"
                  style={{ color: selectedColor }}
                />
              </div>
              <p className="mt-4 text-lg font-semibold text-foreground">
                {watch("name") || "New Branch"}
              </p>
              {watch("prefix") && (
                <p className="text-sm text-muted-foreground">{watch("prefix")}</p>
              )}

              {/* Color picker */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Theme Color
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="size-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          selectedColor === color ? "currentColor" : "transparent",
                      }}
                      onClick={() => setValue("themeColor", color)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isPending}
              >
                <Save className="size-4" />
                {isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update Branch"
                    : "Create Branch"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/branches")}
              >
                <ArrowLeft className="size-4" />
                Back to Branches
              </Button>
            </div>
          </div>

          {/* ── Right: form sections ── */}
          <div className="space-y-6">
            {/* Branch Info */}
            <FormSection title="Branch Info" color="blue">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="name">
                    Branch Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g. Main Branch"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="prefix">Prefix / Code</Label>
                  <Input
                    id="prefix"
                    {...register("prefix")}
                    placeholder="e.g. MB"
                  />
                </div>
                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={watch("isActive") ? "true" : "false"}
                    onValueChange={(v) => setValue("isActive", v === "true")}
                  >
                    <SelectTrigger id="isActive">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            {/* Contact Info */}
            <FormSection title="Contact Info" color="green">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="phone">Mobile</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+961 XX XXX XXX"
                  />
                </div>
                <div>
                  <Label htmlFor="telephone">Telephone</Label>
                  <Input
                    id="telephone"
                    {...register("telephone")}
                    placeholder="XX XXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="branch@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Location */}
            <FormSection title="Location" color="yellow">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...register("address")}
                    placeholder="Full address"
                  />
                </div>
              </div>
            </FormSection>
          </div>
        </div>
      </form>
    </>
  );
}
