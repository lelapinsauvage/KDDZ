import { getEmployees } from "@/lib/actions/employees";
import { getEmployeeEvents } from "@/lib/actions/employee-events";
import { CalendarClient } from "./calendar-client";

export default async function EmployeeCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth();

  // Fetch all active employees and events for this month in parallel
  const [teachersRes, nursesRes, doctorsRes, managersRes, eventsRes] =
    await Promise.all([
      getEmployees("teacher", { isActive: true, pageSize: 200 }),
      getEmployees("nurse", { isActive: true, pageSize: 200 }),
      getEmployees("doctor", { isActive: true, pageSize: 200 }),
      getEmployees("manager", { isActive: true, pageSize: 200 }),
      getEmployeeEvents({ month, year }),
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
      type: "teacher",
    })),
    ...nurseList.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Nurse",
      type: "nurse",
    })),
    ...doctorList.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Doctor",
      type: "doctor",
    })),
    ...managerList.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      role: "Manager",
      type: "manager",
    })),
  ];

  // Serialize events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEvents = (eventsRes.data ?? []) as any[];
  const events = rawEvents.map((evt) => ({
    id: evt.id,
    employeeId: evt.employeeId,
    employeeType: evt.employeeType,
    status: evt.status,
    date: evt.date instanceof Date
      ? evt.date.toISOString().split("T")[0]
      : new Date(evt.date).toISOString().split("T")[0],
    referenceNumber: evt.referenceNumber ?? null,
    notes: evt.notes ?? null,
  }));

  return (
    <CalendarClient
      employees={employees}
      events={events}
      initialYear={year}
      initialMonth={month}
    />
  );
}
