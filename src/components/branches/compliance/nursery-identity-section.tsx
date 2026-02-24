"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function NurseryIdentitySection({ register }: Props) {
  return (
    <FormSection id="nursery-identity" title="Nursery Identity" color="teal" collapsible defaultOpen>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Name (Arabic)</Label>
          <Input {...register("nameArabic")} placeholder="الاسم بالعربية" dir="rtl" />
        </div>
        <div>
          <Label>Name (Latin)</Label>
          <Input {...register("nameLatin")} placeholder="Name in Latin characters" />
        </div>
      </div>
    </FormSection>
  );
}
