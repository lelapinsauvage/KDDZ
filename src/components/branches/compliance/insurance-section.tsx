"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function InsuranceSection({ register }: Props) {
  return (
    <FormSection id="insurance" title="Insurance" subtitle="الضمان" color="red" collapsible defaultOpen>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Insurance Company</Label>
          <Input {...register("insuranceCompany")} placeholder="Company name" />
        </div>
        <div>
          <Label>Contract Type</Label>
          <Input {...register("insuranceContractType")} placeholder="e.g. All-risk, Civil liability" />
        </div>
      </div>
    </FormSection>
  );
}
