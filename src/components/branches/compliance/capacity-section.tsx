"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function CapacitySection({ register }: Props) {
  return (
    <div className="rounded-sm border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        السعة
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        عدد الأطفال الذين تستوعبهم الحضانة وساعات العمل
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>عدد الأطفال الإجمالي</Label>
          <Input type="number" {...register("totalChildren")} dir="ltr" />
        </div>
        <div>
          <Label>يمشون</Label>
          <Input type="number" {...register("walkers")} dir="ltr" />
        </div>
        <div>
          <Label>لا يمشون</Label>
          <Input type="number" {...register("nonWalkers")} dir="ltr" />
        </div>
        <div>
          <Label>ساعات الدوام</Label>
          <Input {...register("workingHours")} dir="rtl" />
        </div>
      </div>
    </div>
  );
}
