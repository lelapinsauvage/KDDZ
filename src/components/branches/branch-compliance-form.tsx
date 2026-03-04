"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useMemo, useState } from "react";
import {
  branchComplianceSchema,
  type BranchComplianceFormValues,
  calculateCompletionPercentage,
  calculateSectionCompletion,
  complianceSections,
} from "@/lib/validations/branch";
import { upsertCompliance } from "@/lib/actions/branch-compliance";
import { Button } from "@/components/ui/button";
import { Save, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Section components
import { LegalEntitySection } from "./compliance/legal-entity-section";
import { OwnerInfoSection } from "./compliance/owner-info-section";
import { NurseryNameSection } from "./compliance/nursery-name-section";
import { NurseryAddressSection } from "./compliance/nursery-address-section";
import { PropertyLeaseSection } from "./compliance/property-lease-section";
import { ManagementSection } from "./compliance/management-section";
import { CapacitySection } from "./compliance/capacity-section";
import { InsuranceSection } from "./compliance/insurance-section";
import { StaffComplianceSection } from "./compliance/staff-compliance-section";
import { MinistryAttachmentsSection } from "./compliance/ministry-attachments-section";

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  type: string;
  hireDate?: string | null;
  documents?: { type: string; title?: string | null; expiryDate?: string | Date | null }[];
}

export interface ComplianceDocument {
  id: string;
  documentType: string;
  label?: string | null;
  filename?: string | null;
  fileUrl?: string | null;
  expiryDate?: string | Date | null;
  status: string;
}

interface Props {
  branchId: string;
  branchName: string;
  themeColor?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: Record<string, any> | null;
  staff?: StaffMember[];
  documents?: ComplianceDocument[];
}

const SECTION_KEYS = complianceSections.map((s) => s.id);

export function BranchComplianceForm({
  branchId,
  branchName,
  themeColor = "#1caf9a",
  initialData,
  staff = [],
  documents = [],
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState(SECTION_KEYS[0]);

  const form = useForm<BranchComplianceFormValues>({
    resolver: zodResolver(branchComplianceSchema),
    defaultValues: {
      entityType: "",
      ownerFirstName: "",
      ownerFatherName: "",
      ownerFamilyName: "",
      ownerMotherName: "",
      ownerMotherMaidenName: "",
      ownerDob: "",
      ownerPlaceOfBirth: "",
      ownerNationality: "",
      ownerRegistryNumber: "",
      nameArabic: "",
      nameLatin: "",
      governorate: "",
      district: "",
      town: "",
      realEstateArea: "",
      propertyNumber: "",
      addressSection: "",
      street: "",
      building: "",
      floor: "",
      addrPhone: "",
      addrFax: "",
      addrEmail: "",
      postalCode: "",
      // Property / Lease
      ownershipType: "",
      ownerName: "",
      propertyGovernorate: "",
      propertyDistrict: "",
      propertyRegion: "",
      // Management
      directorFirstName: "",
      directorLastName: "",
      directorSpecialty: "",
      doctorFirstName: "",
      doctorFatherName: "",
      doctorLastName: "",
      doctorSyndicateNo: "",
      doctorSpecialty: "",
      // Capacity
      totalChildren: 0,
      walkers: 0,
      nonWalkers: 0,
      workingHours: "",
      // Insurance
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
        toast.success("تم حفظ البيانات بنجاح");
      } else {
        toast.error(result.error ?? "فشل في حفظ البيانات");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6">
      {/* Ministry Header */}
      <div className="mb-6 rounded-sm border bg-card p-5 text-center shadow-sm" dir="rtl">
        <p className="text-lg font-bold text-foreground">الجمهورية اللبنانية</p>
        <p className="text-sm font-semibold text-muted-foreground">وزارة الصحة العامة</p>
        <p className="text-sm text-muted-foreground">مديرية الوقاية الطبية</p>
        <p className="text-sm text-muted-foreground">دائرة صحة الأم والولد والمدارس</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Vertical Tabs Sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
          {/* Progress ring */}
          <div className="rounded-sm border bg-card p-4 shadow-sm text-center">
            <p className="text-sm font-semibold text-foreground">{branchName}</p>
            <div className="mx-auto mt-3 relative flex size-20 items-center justify-center">
              <svg className="size-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-muted/50"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={themeColor}
                  strokeWidth="3"
                  strokeDasharray={`${overallPercent}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-base font-bold text-foreground">
                {overallPercent}%
              </span>
            </div>
          </div>

          {/* Section nav */}
          <div className="rounded-sm border bg-card p-3 shadow-sm">
            <ul className="space-y-1">
              {complianceSections.map((section, idx) => {
                const completion = sectionCompletion[section.id];
                const isDone = completion && completion.total > 0 && completion.percent === 100;
                const isActive = activeTab === section.id;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(section.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-right text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/80",
                      )}
                      dir="rtl"
                    >
                      {isDone ? (
                        <CheckCircle2
                          className="size-4 shrink-0"
                          style={{ color: themeColor }}
                        />
                      ) : (
                        <Circle className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground/40",
                        )} />
                      )}
                      <span className="flex-1 truncate">
                        <span className="text-xs text-muted-foreground/60 ml-1">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        {section.title}
                      </span>
                      {completion && completion.total > 0 && (
                        <span className="text-xs text-muted-foreground/70">
                          {completion.filled}/{completion.total}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Save button */}
          <Button type="submit" disabled={isPending} className="w-full">
            <Save className="size-4" />
            {isPending ? "جارٍ الحفظ..." : "حفظ البيانات"}
          </Button>
        </div>

        {/* Right: Active section content */}
        <div className="min-h-[400px]">
          {activeTab === "legal-entity" && (
            <LegalEntitySection watch={watch} setValue={setValue} />
          )}
          {activeTab === "owner-info" && (
            <OwnerInfoSection register={register} />
          )}
          {activeTab === "nursery-name" && (
            <NurseryNameSection register={register} />
          )}
          {activeTab === "nursery-address" && (
            <NurseryAddressSection register={register} />
          )}
          {activeTab === "property-lease" && (
            <PropertyLeaseSection register={register} watch={watch} setValue={setValue} />
          )}
          {activeTab === "management" && (
            <ManagementSection register={register} />
          )}
          {activeTab === "capacity" && (
            <CapacitySection register={register} />
          )}
          {activeTab === "insurance" && (
            <InsuranceSection register={register} />
          )}
          {activeTab === "staff-compliance" && (
            <StaffComplianceSection staff={staff} />
          )}
          {activeTab === "ministry-attachments" && (
            <MinistryAttachmentsSection branchId={branchId} documents={documents} />
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={SECTION_KEYS.indexOf(activeTab) === 0}
              onClick={() => {
                const idx = SECTION_KEYS.indexOf(activeTab);
                if (idx > 0) setActiveTab(SECTION_KEYS[idx - 1]);
              }}
            >
              السابق
            </Button>
            {SECTION_KEYS.indexOf(activeTab) < SECTION_KEYS.length - 1 ? (
              <Button
                type="button"
                onClick={() => {
                  const idx = SECTION_KEYS.indexOf(activeTab);
                  if (idx < SECTION_KEYS.length - 1) setActiveTab(SECTION_KEYS[idx + 1]);
                }}
              >
                التالي
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                <Save className="size-4" />
                {isPending ? "جارٍ الحفظ..." : "حفظ البيانات"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

/** Normalize DB data into form-compatible defaults */
function normalizeInitialData(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any> | null | undefined,
): Partial<BranchComplianceFormValues> {
  if (!data) return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "ownerDob" && value) {
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
