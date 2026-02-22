import { notFound } from "next/navigation";
import { getEmployee } from "@/lib/actions/employees";
import { getBranches } from "@/lib/actions/branches";
import { EmployeeFormClient } from "@/components/employees/employee-form-client";

export default async function EditDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [empResult, branchResult] = await Promise.all([
    getEmployee("doctor", id),
    getBranches(),
  ]);

  if (!empResult.success || !empResult.data) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emp = empResult.data as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branches = ((branchResult.data as any[]) ?? []).map((b: any) => ({
    id: b.id as string,
    name: b.name as string,
  }));

  const address = emp.addresses?.[0];

  return (
    <EmployeeFormClient
      type="doctor"
      branches={branches}
      employee={{
        id: emp.id,
        firstName: emp.firstName ?? "",
        lastName: emp.lastName ?? "",
        email: emp.email ?? "",
        phone: emp.phone ?? "",
        mobile: emp.mobile ?? "",
        nationality: emp.nationality ?? "",
        dateOfBirth: emp.dateOfBirth
          ? new Date(emp.dateOfBirth).toISOString().split("T")[0]
          : "",
        hireDate: emp.hireDate
          ? new Date(emp.hireDate).toISOString().split("T")[0]
          : "",
        specialization: emp.specialization ?? "",
        licenseNumber: emp.licenseNumber ?? "",
        branchId: emp.branchId ?? "",
        isActive: emp.isActive ?? true,
        address: {
          street: address?.street ?? "",
          city: address?.city ?? "",
          region: address?.region ?? "",
        },
      }}
    />
  );
}
