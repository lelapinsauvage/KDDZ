"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useMemo } from "react";
import {
  branchComplianceSchema,
  type BranchComplianceFormValues,
  calculateCompletionPercentage,
  calculateSectionCompletion,
} from "@/lib/validations/branch";
import { upsertCompliance } from "@/lib/actions/branch-compliance";
import { ComplianceProgressBar } from "@/components/branches/compliance-progress-bar";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

// Section components
import { LegalEntitySection } from "./compliance/legal-entity-section";
import { RegistrationSection } from "./compliance/registration-section";
import { SignatorySection } from "./compliance/signatory-section";
import { NurseryIdentitySection } from "./compliance/nursery-identity-section";
import { AddressSection } from "./compliance/address-section";
import { PropertySection } from "./compliance/property-section";
import { ManagementSection } from "./compliance/management-section";
import { CapacitySection } from "./compliance/capacity-section";
import { InsuranceSection } from "./compliance/insurance-section";

interface Props {
  branchId: string;
  branchName: string;
  themeColor?: string;
  initialData?: Partial<BranchComplianceFormValues> | null;
}

export function BranchComplianceForm({
  branchId,
  branchName,
  themeColor = "#1caf9a",
  initialData,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<BranchComplianceFormValues>({
    resolver: zodResolver(branchComplianceSchema),
    defaultValues: {
      entityType: "",
      legalName: "",
      organizationType: "",
      companySubType: "",
      purpose: "",
      registrationNumber: "",
      registrationPlace: "",
      registrationDate: "",
      signatoryName: "",
      signatoryRole: "",
      signatoryNationality: "",
      signatoryPhone: "",
      nameArabic: "",
      nameLatin: "",
      country: "Lebanon",
      governorate: "",
      district: "",
      town: "",
      floor: "",
      building: "",
      street: "",
      landmark: "",
      poBox: "",
      postalCode: "",
      addrPhone: "",
      addrMobile: "",
      addrFax: "",
      addrEmail: "",
      addrWebsite: "",
      ownerName: "",
      propertyNumber: "",
      propertyGovernorate: "",
      propertyDistrict: "",
      propertyRegion: "",
      ownershipType: "",
      directorFirstName: "",
      directorLastName: "",
      directorSpecialty: "",
      doctorFirstName: "",
      doctorFatherName: "",
      doctorLastName: "",
      doctorSyndicateNo: "",
      doctorSpecialty: "",
      totalChildren: 0,
      walkers: 0,
      nonWalkers: 0,
      workingHours: "",
      insuranceCompany: "",
      insuranceContractType: "",
      ...normalizeInitialData(initialData),
    },
  });

  const { register, handleSubmit, watch, setValue } = form;
  const watchedValues = watch();

  const overallPercent = useMemo(
    () => calculateCompletionPercentage(watchedValues as Record<string, unknown>),
    [watchedValues],
  );
  const sectionCompletion = useMemo(
    () => calculateSectionCompletion(watchedValues as Record<string, unknown>),
    [watchedValues],
  );

  function onSubmit(data: BranchComplianceFormValues) {
    startTransition(async () => {
      const result = await upsertCompliance(branchId, data as Record<string, unknown>);
      if (result.success) {
        toast.success("Compliance data saved successfully");
      } else {
        toast.error(result.error ?? "Failed to save compliance data");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* ── Sticky sidebar ── */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <ComplianceProgressBar
            branchName={branchName}
            overallPercent={overallPercent}
            sectionCompletion={sectionCompletion}
            themeColor={themeColor}
          />
          <div className="mt-4">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
            >
              <Save className="size-4" />
              {isPending ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>

        {/* ── Right: 9 sections stacked ── */}
        <div className="space-y-6">
          <LegalEntitySection register={register} watch={watch} setValue={setValue} />
          <RegistrationSection register={register} />
          <SignatorySection register={register} />
          <NurseryIdentitySection register={register} />
          <AddressSection register={register} />
          <PropertySection register={register} watch={watch} setValue={setValue} />
          <ManagementSection register={register} />
          <CapacitySection register={register} />
          <InsuranceSection register={register} />

          {/* Bottom save button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
            >
              <Save className="size-4" />
              {isPending ? "Saving..." : "Save Compliance Data"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

/** Normalize DB data into form-compatible defaults */
function normalizeInitialData(
  data: Partial<BranchComplianceFormValues> | null | undefined,
): Partial<BranchComplianceFormValues> {
  if (!data) return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "registrationDate" && value) {
      result[key] =
        value instanceof Date ? value.toISOString().split("T")[0] : String(value);
    } else if (value === null || value === undefined) {
      // Skip nulls — use schema defaults
    } else {
      result[key] = value;
    }
  }
  return result as Partial<BranchComplianceFormValues>;
}
