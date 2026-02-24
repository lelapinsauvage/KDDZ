"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function AddressSection({ register }: Props) {
  return (
    <FormSection id="address" title="Address" subtitle="عنوان الحضانة" color="yellow" collapsible defaultOpen>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Country</Label>
          <Input {...register("country")} placeholder="Lebanon" />
        </div>
        <div>
          <Label>Governorate</Label>
          <Input {...register("governorate")} placeholder="Governorate" />
        </div>
        <div>
          <Label>District</Label>
          <Input {...register("district")} placeholder="District" />
        </div>
        <div>
          <Label>Town / City</Label>
          <Input {...register("town")} placeholder="Town" />
        </div>
        <div>
          <Label>Street</Label>
          <Input {...register("street")} placeholder="Street name" />
        </div>
        <div>
          <Label>Building</Label>
          <Input {...register("building")} placeholder="Building name / #" />
        </div>
        <div>
          <Label>Floor</Label>
          <Input {...register("floor")} placeholder="Floor" />
        </div>
        <div>
          <Label>Landmark</Label>
          <Input {...register("landmark")} placeholder="Near..." />
        </div>
        <div>
          <Label>P.O. Box</Label>
          <Input {...register("poBox")} placeholder="P.O. Box" />
        </div>
        <div>
          <Label>Postal Code</Label>
          <Input {...register("postalCode")} placeholder="Postal code" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input {...register("addrPhone")} placeholder="Phone" />
        </div>
        <div>
          <Label>Mobile</Label>
          <Input {...register("addrMobile")} placeholder="Mobile" />
        </div>
        <div>
          <Label>Fax</Label>
          <Input {...register("addrFax")} placeholder="Fax" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" {...register("addrEmail")} placeholder="Email" />
        </div>
        <div>
          <Label>Website</Label>
          <Input {...register("addrWebsite")} placeholder="https://" />
        </div>
      </div>
    </FormSection>
  );
}
