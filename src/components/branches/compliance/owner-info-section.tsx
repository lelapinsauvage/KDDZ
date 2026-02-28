"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function OwnerInfoSection({ register }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        معلومات عن صاحب العلاقة
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        بيانات صاحب الطلب الشخصية
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>الاسم</Label>
          <Input {...register("ownerFirstName")} dir="rtl" />
        </div>
        <div>
          <Label>اسم الأب</Label>
          <Input {...register("ownerFatherName")} dir="rtl" />
        </div>
        <div>
          <Label>العائلة</Label>
          <Input {...register("ownerFamilyName")} dir="rtl" />
        </div>
        <div>
          <Label>اسم الأم</Label>
          <Input {...register("ownerMotherName")} dir="rtl" />
        </div>
        <div>
          <Label>شهرة الأم</Label>
          <Input {...register("ownerMotherMaidenName")} dir="rtl" />
        </div>
        <div>
          <Label>تاريخ الولادة</Label>
          <Input type="date" {...register("ownerDob")} dir="ltr" />
        </div>
        <div>
          <Label>محل الولادة</Label>
          <Input {...register("ownerPlaceOfBirth")} dir="rtl" />
        </div>
        <div>
          <Label>الجنسية</Label>
          <Input {...register("ownerNationality")} dir="rtl" />
        </div>
        <div>
          <Label>رقم السجل</Label>
          <Input {...register("ownerRegistryNumber")} dir="rtl" />
        </div>
      </div>
    </div>
  );
}
