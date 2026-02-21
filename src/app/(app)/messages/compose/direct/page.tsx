import { getEmployees } from "@/lib/actions/employees";
import { getParentUsers } from "@/lib/actions/parent-users";
import { DirectMessageClient } from "./direct-message-client";
import type { RecipientType } from "@/generated/prisma/enums";

export default async function DirectMessagePage() {
  // Fetch individual recipients from DB
  const [teachersRes, nursesRes, doctorsRes, managersRes, parentRes] = await Promise.all([
    getEmployees("teacher", { isActive: true, pageSize: 200 }),
    getEmployees("nurse", { isActive: true, pageSize: 200 }),
    getEmployees("doctor", { isActive: true, pageSize: 200 }),
    getEmployees("manager", { isActive: true, pageSize: 200 }),
    getParentUsers({ isActive: true, pageSize: 200 }),
  ]);

  type EmployeeRow = { id: string; firstName: string; lastName: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teachers = ((teachersRes.data as any)?.employees ?? []) as EmployeeRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nurses = ((nursesRes.data as any)?.employees ?? []) as EmployeeRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctors = ((doctorsRes.data as any)?.employees ?? []) as EmployeeRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const managers = ((managersRes.data as any)?.employees ?? []) as EmployeeRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parentUsers = ((parentRes.data as any)?.parentUsers ?? []) as Array<{
    id: string;
    username: string;
    child: { firstName: string; lastName: string };
  }>;

  const recipients: Array<{
    id: string;
    name: string;
    role: string;
    recipientType: RecipientType;
  }> = [
    ...teachers.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Teacher",
      recipientType: "TEACHER" as RecipientType,
    })),
    ...nurses.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Nurse",
      recipientType: "ADMIN" as RecipientType,
    })),
    ...doctors.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Doctor",
      recipientType: "ADMIN" as RecipientType,
    })),
    ...managers.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Manager",
      recipientType: "ADMIN" as RecipientType,
    })),
    ...parentUsers.map((pu) => ({
      id: pu.id,
      name: `${pu.username} (${pu.child.firstName} ${pu.child.lastName})`,
      role: "Parent",
      recipientType: "PARENT" as RecipientType,
    })),
  ];

  return <DirectMessageClient recipients={recipients} />;
}
