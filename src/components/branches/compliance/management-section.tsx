"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function ManagementSection({ register }: Props) {
  return (
    <FormSection id="management" title="Management" subtitle="الادارة" color="purple" collapsible defaultOpen>
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Director
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>First Name</Label>
            <Input {...register("directorFirstName")} placeholder="First name" />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input {...register("directorLastName")} placeholder="Last name" />
          </div>
          <div>
            <Label>Specialty / Diploma</Label>
            <Input {...register("directorSpecialty")} placeholder="Specialty" />
          </div>
        </div>

        <hr className="border-border" />

        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Doctor
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>First Name</Label>
            <Input {...register("doctorFirstName")} placeholder="First name" />
          </div>
          <div>
            <Label>Father&apos;s Name</Label>
            <Input {...register("doctorFatherName")} placeholder="Father's name" />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input {...register("doctorLastName")} placeholder="Last name" />
          </div>
          <div>
            <Label>Syndicate No.</Label>
            <Input {...register("doctorSyndicateNo")} placeholder="Syndicate number" />
          </div>
          <div>
            <Label>Specialty</Label>
            <Input {...register("doctorSpecialty")} placeholder="Specialty" />
          </div>
        </div>
      </div>
    </FormSection>
  );
}
