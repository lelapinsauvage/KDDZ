"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function RegistrationSection({ register }: Props) {
  return (
    <FormSection id="registration" title="Registration" subtitle="التسجيل" color="blue" collapsible defaultOpen>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Registration Number</Label>
          <Input {...register("registrationNumber")} placeholder="Registration #" />
        </div>
        <div>
          <Label>Place of Registration</Label>
          <Input {...register("registrationPlace")} placeholder="City / Office" />
        </div>
        <div>
          <Label>Registration Date</Label>
          <Input type="date" {...register("registrationDate")} />
        </div>
      </div>
    </FormSection>
  );
}
