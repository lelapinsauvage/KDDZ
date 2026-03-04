"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function NurseryNameSection({ register }: Props) {
  return (
    <div className="rounded-sm border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        اسم الحضانة
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        اسم دار الحضانة بالعربية وباللاتينية
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>بالعربية</Label>
          <Input {...register("nameArabic")} dir="rtl" />
        </div>
        <div>
          <Label>باللاتينية</Label>
          <Input {...register("nameLatin")} dir="ltr" />
        </div>
      </div>
    </div>
  );
}
