import { getEmployees } from "@/lib/actions/employees";
import { CalendarClient } from "./calendar-client";

export default async function EmployeeCalendarPage() {
  // Fetch all active employees across all types
  const [teachersRes, nursesRes, doctorsRes, managersRes] = await Promise.all([
    getEmployees("teacher", { isActive: true, pageSize: 100 }),
    getEmployees("nurse", { isActive: true, pageSize: 100 }),
    getEmployees("doctor", { isActive: true, pageSize: 100 }),
    getEmployees("manager", { isActive: true, pageSize: 100 }),
  ]);

  type EmployeeRow = {
    id: string;
    firstName: string;
    lastName: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacherList = ((teachersRes.data as any)?.employees ?? []) as EmployeeRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nurseList = ((nursesRes.data as any)?.employees ?? []) as EmployeeRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctorList = ((doctorsRes.data as any)?.employees ?? []) as EmployeeRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const managerList = ((managersRes.data as any)?.employees ?? []) as EmployeeRow[];

  const employees = [
    ...teacherList.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Teacher",
    })),
    ...nurseList.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Nurse",
    })),
    ...doctorList.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Doctor",
    })),
    ...managerList.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Manager",
    })),
  ];

  return <CalendarClient employees={employees} />;
}
