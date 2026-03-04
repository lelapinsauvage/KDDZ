"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function InsuranceSection({ register }: Props) {
  return (
    <div className="rounded-sm border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        الضمان
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        بيانات عقد الضمان لسلامة الأطفال
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>اسم شركة الضمان</Label>
          <Input {...register("insuranceCompany")} dir="rtl" />
        </div>
        <div>
          <Label>نوع عقد الضمان</Label>
          <Input {...register("insuranceContractType")} dir="rtl" />
        </div>
      </div>
    </div>
  );
}
