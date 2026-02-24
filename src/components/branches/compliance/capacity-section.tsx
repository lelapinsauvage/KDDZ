"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function CapacitySection({ register }: Props) {
  return (
    <FormSection id="capacity" title="Capacity" subtitle="السعة" color="green" collapsible defaultOpen>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label>Total Children</Label>
          <Input type="number" min={0} {...register("totalChildren")} placeholder="0" />
        </div>
        <div>
          <Label>Walkers</Label>
          <Input type="number" min={0} {...register("walkers")} placeholder="0" />
        </div>
        <div>
          <Label>Non-Walkers</Label>
          <Input type="number" min={0} {...register("nonWalkers")} placeholder="0" />
        </div>
        <div>
          <Label>Working Hours</Label>
          <Input {...register("workingHours")} placeholder="e.g. 7:00 AM - 5:00 PM" />
        </div>
      </div>
    </FormSection>
  );
}
