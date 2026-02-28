"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function ManagementSection({ register }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        الإدارة
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        بيانات المدير المسؤول والطبيب المسؤول عن الحضانة
      </p>

      {/* Director sub-section */}
      <h4 className="mb-3 text-sm font-semibold text-foreground">
        المدير المسؤول
      </h4>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>الاسم</Label>
          <Input {...register("directorFirstName")} dir="rtl" />
        </div>
        <div>
          <Label>العائلة</Label>
          <Input {...register("directorLastName")} dir="rtl" />
        </div>
        <div>
          <Label>الاختصاص</Label>
          <Input {...register("directorSpecialty")} dir="rtl" />
        </div>
      </div>

      {/* Doctor sub-section */}
      <h4 className="mb-3 text-sm font-semibold text-foreground">
        الطبيب المسؤول
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>الاسم</Label>
          <Input {...register("doctorFirstName")} dir="rtl" />
        </div>
        <div>
          <Label>اسم الأب</Label>
          <Input {...register("doctorFatherName")} dir="rtl" />
        </div>
        <div>
          <Label>العائلة</Label>
          <Input {...register("doctorLastName")} dir="rtl" />
        </div>
        <div>
          <Label>رقم النقابة</Label>
          <Input {...register("doctorSyndicateNo")} dir="rtl" />
        </div>
        <div>
          <Label>الاختصاص</Label>
          <Input {...register("doctorSpecialty")} dir="rtl" />
        </div>
      </div>
    </div>
  );
}
