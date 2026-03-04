"use client";

import { UseFormWatch, UseFormSetValue, UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
  watch: UseFormWatch<BranchComplianceFormValues>;
  setValue: UseFormSetValue<BranchComplianceFormValues>;
}

const OWNERSHIP_OPTIONS = [
  { value: "OWNER", label: "مالك" },
  { value: "TENANT", label: "مستأجر" },
] as const;

export function PropertyLeaseSection({ register, watch, setValue }: Props) {
  const ownershipType = watch("ownershipType");

  return (
    <div className="rounded-sm border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        الملكية أو سند الإيجار المصدق
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        بيانات ملكية أو إيجار العقار المخصص للحضانة
      </p>

      {/* Ownership type radio */}
      <div className="mb-6 space-y-3">
        <Label>نوع الملكية</Label>
        {OWNERSHIP_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setValue("ownershipType", opt.value)}
            className={cn(
              "flex w-full items-center gap-3 rounded-sm border p-4 text-right text-sm font-medium transition-colors",
              ownershipType === opt.value
                ? "border-primary/50 bg-primary/5 text-foreground"
                : "border-border hover:bg-muted/50 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                ownershipType === opt.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30",
              )}
            >
              {ownershipType === opt.value && (
                <span className="size-2 rounded-full bg-white" />
              )}
            </span>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>اسم المالك</Label>
          <Input {...register("ownerName")} dir="rtl" />
        </div>
        <div>
          <Label>المحافظة</Label>
          <Input {...register("propertyGovernorate")} dir="rtl" />
        </div>
        <div>
          <Label>القضاء</Label>
          <Input {...register("propertyDistrict")} dir="rtl" />
        </div>
        <div>
          <Label>المنطقة العقارية</Label>
          <Input {...register("propertyRegion")} dir="rtl" />
        </div>
      </div>
    </div>
  );
}
