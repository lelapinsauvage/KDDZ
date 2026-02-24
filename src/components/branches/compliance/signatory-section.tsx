"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function SignatorySection({ register }: Props) {
  return (
    <FormSection id="signatory" title="Authorized Signatory" color="green" collapsible defaultOpen>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Full Name</Label>
          <Input {...register("signatoryName")} placeholder="Signatory full name" />
        </div>
        <div>
          <Label>Role / Title</Label>
          <Input {...register("signatoryRole")} placeholder="e.g. Managing Director" />
        </div>
        <div>
          <Label>Nationality</Label>
          <Input {...register("signatoryNationality")} placeholder="Nationality" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input {...register("signatoryPhone")} placeholder="+961 XX XXX XXX" />
        </div>
      </div>
    </FormSection>
  );
}
