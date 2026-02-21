import { getEmployees } from "@/lib/actions/employees";
import { getParentUsers } from "@/lib/actions/parent-users";
import { ComposeClient } from "./compose-client";
import type { RecipientType } from "@/generated/prisma/enums";

export default async function ComposeMessagePage() {
  // Fetch real recipients from DB
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
    type: "employee" | "parent";
    recipientType: RecipientType;
  }> = [
    ...teachers.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName} (Teacher)`,
      type: "employee" as const,
      recipientType: "TEACHER" as RecipientType,
    })),
    ...nurses.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName} (Nurse)`,
      type: "employee" as const,
      recipientType: "ADMIN" as RecipientType,
    })),
    ...doctors.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName} (Doctor)`,
      type: "employee" as const,
      recipientType: "ADMIN" as RecipientType,
    })),
    ...managers.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName} (Manager)`,
      type: "employee" as const,
      recipientType: "ADMIN" as RecipientType,
    })),
    ...parentUsers.map((pu) => ({
      id: pu.id,
      name: `${pu.username} — Parent of ${pu.child.firstName} ${pu.child.lastName}`,
      type: "parent" as const,
      recipientType: "PARENT" as RecipientType,
    })),
  ];

  return <ComposeClient recipients={recipients} />;
}
