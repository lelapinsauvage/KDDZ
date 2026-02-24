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
import { Textarea } from "@/components/ui/textarea";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
  watch: UseFormWatch<BranchComplianceFormValues>;
  setValue: UseFormSetValue<BranchComplianceFormValues>;
}

const ENTITY_TYPES = ["INDIVIDUAL", "COMPANY", "ASSOCIATION", "COOPERATIVE"];
const ORG_TYPES = ["SARL", "SAL", "HOLDING", "OFFSHORE", "OTHER"];
const COMPANY_SUB_TYPES = ["LLC", "JOINT_STOCK", "PARTNERSHIP", "SOLE_PROPRIETORSHIP"];

export function LegalEntitySection({ register, watch, setValue }: Props) {
  const entityType = watch("entityType");

  return (
    <FormSection id="legal-entity" title="Legal Entity" color="blue" collapsible defaultOpen>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Entity Type</Label>
          <Select
            value={watch("entityType") || ""}
            onValueChange={(v) => setValue("entityType", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Legal Name</Label>
          <Input {...register("legalName")} placeholder="Registered legal name" />
        </div>
        <div>
          <Label>Organization Type</Label>
          <Select
            value={watch("organizationType") || ""}
            onValueChange={(v) => setValue("organizationType", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {ORG_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {entityType === "COMPANY" && (
          <div>
            <Label>Company Sub-Type</Label>
            <Select
              value={watch("companySubType") || ""}
              onValueChange={(v) => setValue("companySubType", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SUB_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="sm:col-span-2 lg:col-span-3">
          <Label>Purpose / Activity</Label>
          <Textarea {...register("purpose")} placeholder="Description of nursery purpose and activities" rows={2} />
        </div>
      </div>
    </FormSection>
  );
}
