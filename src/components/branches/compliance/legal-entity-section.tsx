"use client";

import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { cn } from "@/lib/utils";

interface Props {
  watch: UseFormWatch<BranchComplianceFormValues>;
  setValue: UseFormSetValue<BranchComplianceFormValues>;
}

const OPTIONS = [
  { value: "NATURAL_PERSON", label: "شخص طبيعي" },
  { value: "LEGAL_ENTITY", label: "شخص معنوي" },
] as const;

export function LegalEntitySection({ watch, setValue }: Props) {
  const entityType = watch("entityType");

  return (
    <div className="rounded-sm border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        نوع الشخصية القانونية
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        حدد نوع الشخصية القانونية لصاحب الطلب
      </p>

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setValue("entityType", opt.value)}
            className={cn(
              "flex w-full items-center gap-3 rounded-sm border p-4 text-right text-sm font-medium transition-colors",
              entityType === opt.value
                ? "border-primary/50 bg-primary/5 text-foreground"
                : "border-border hover:bg-muted/50 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                entityType === opt.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30",
              )}
            >
              {entityType === opt.value && (
                <span className="size-2 rounded-full bg-white" />
              )}
            </span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
