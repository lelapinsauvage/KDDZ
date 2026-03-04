"use client";

import type { StaffMember } from "../branch-compliance-form";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  staff: StaffMember[];
}

const DOC_REQUIREMENTS = [
  { type: "CONTRACT", label: "عقود العمل لموظفي الحضانة" },
  { type: "MEDICAL_TEST", label: "شهادة صحية لموظفي الحضانة" },
  { type: "FIRST_AID", label: "إفادات الإسعاف الأولي لموظفي الحضانة" },
  { type: "CERTIFICATE", label: "شهادات موظفي الحضانة الدراسية" },
] as const;

const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  teacher: "معلّمة",
  nurse: "ممرّضة",
  doctor: "طبيب",
  manager: "مديرة",
};

export function StaffComplianceSection({ staff }: Props) {
  return (
    <div className="rounded-sm border bg-card p-6 shadow-sm" dir="rtl">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        مستندات الموظفين
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        حالة المستندات المطلوبة من الموظفين — للقراءة فقط
      </p>

      {staff.length === 0 ? (
        <div className="rounded-sm border border-dashed p-8 text-center text-sm text-muted-foreground">
          لا يوجد موظفين مسجلين في هذا الفرع
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary table per document type */}
          {DOC_REQUIREMENTS.map((req) => (
            <div key={req.type}>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                {req.label}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 text-right font-medium">الموظف</th>
                      <th className="py-2 text-right font-medium">الوظيفة</th>
                      <th className="py-2 text-center font-medium">الحالة</th>
                      <th className="py-2 text-right font-medium">تاريخ الانتهاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member) => {
                      const doc = member.documents?.find((d) => d.type === req.type);
                      const hasDoc = !!doc;
                      const expiryDate = doc?.expiryDate
                        ? new Date(doc.expiryDate).toLocaleDateString("ar-LB")
                        : "—";
                      return (
                        <tr key={member.id} className="border-b border-border/40">
                          <td className="py-2">
                            {member.firstName} {member.lastName}
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {EMPLOYEE_TYPE_LABELS[member.type] ?? member.type}
                          </td>
                          <td className="py-2 text-center">
                            {hasDoc ? (
                              <CheckCircle2 className="inline size-4 text-green-600" />
                            ) : (
                              <XCircle className="inline size-4 text-red-500" />
                            )}
                          </td>
                          <td className={cn(
                            "py-2",
                            !hasDoc && "text-muted-foreground",
                          )}>
                            {expiryDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
