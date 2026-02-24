"use client";

import { UseFormRegister, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
  watch: UseFormWatch<BranchComplianceFormValues>;
  setValue: UseFormSetValue<BranchComplianceFormValues>;
}

const OWNERSHIP_TYPES = ["OWNED", "RENTED", "LEASED"];

export function PropertySection({ register, watch, setValue }: Props) {
  return (
    <FormSection id="property" title="Property / Lease" color="yellow" collapsible defaultOpen>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Owner Name</Label>
          <Input {...register("ownerName")} placeholder="Property owner" />
        </div>
        <div>
          <Label>Property Number</Label>
          <Input {...register("propertyNumber")} placeholder="Property #" />
        </div>
        <div>
          <Label>Ownership Type</Label>
          <Select
            value={watch("ownershipType") || ""}
            onValueChange={(v) => setValue("ownershipType", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {OWNERSHIP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Governorate</Label>
          <Input {...register("propertyGovernorate")} placeholder="Governorate" />
        </div>
        <div>
          <Label>District</Label>
          <Input {...register("propertyDistrict")} placeholder="District" />
        </div>
        <div>
          <Label>Region</Label>
          <Input {...register("propertyRegion")} placeholder="Region" />
        </div>
      </div>
    </FormSection>
  );
}
