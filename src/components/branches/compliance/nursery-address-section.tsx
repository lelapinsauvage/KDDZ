"use client";

import { UseFormRegister } from "react-hook-form";
import type { BranchComplianceFormValues } from "@/lib/validations/branch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  register: UseFormRegister<BranchComplianceFormValues>;
}

export function NurseryAddressSection({ register }: Props) {
  return (
    <div className="rounded-sm border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        عنوان الحضانة
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        العنوان الكامل لدار الحضانة
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>المحافظة</Label>
          <Input {...register("governorate")} dir="rtl" />
        </div>
        <div>
          <Label>القضاء</Label>
          <Input {...register("district")} dir="rtl" />
        </div>
        <div>
          <Label>البلدة</Label>
          <Input {...register("town")} dir="rtl" />
        </div>
        <div>
          <Label>المنطقة العقارية</Label>
          <Input {...register("realEstateArea")} dir="rtl" />
        </div>
        <div>
          <Label>رقم العقار</Label>
          <Input {...register("propertyNumber")} dir="rtl" />
        </div>
        <div>
          <Label>القسم</Label>
          <Input {...register("addressSection")} dir="rtl" />
        </div>
        <div>
          <Label>الشارع</Label>
          <Input {...register("street")} dir="rtl" />
        </div>
        <div>
          <Label>المبنى</Label>
          <Input {...register("building")} dir="rtl" />
        </div>
        <div>
          <Label>الطابق</Label>
          <Input {...register("floor")} dir="rtl" />
        </div>
        <div>
          <Label>رقم الهاتف</Label>
          <Input {...register("addrPhone")} dir="ltr" />
        </div>
        <div>
          <Label>الفاكس</Label>
          <Input {...register("addrFax")} dir="ltr" />
        </div>
        <div>
          <Label>البريد الإلكتروني</Label>
          <Input type="email" {...register("addrEmail")} dir="ltr" />
        </div>
        <div>
          <Label>الرمز البريدي</Label>
          <Input {...register("postalCode")} dir="ltr" />
        </div>
      </div>
    </div>
  );
}
