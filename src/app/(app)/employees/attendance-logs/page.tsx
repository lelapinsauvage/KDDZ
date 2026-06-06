import { getAttendanceLogs } from "@/lib/actions/employee-events";
import { getEmployees } from "@/lib/actions/employees";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";
import { AttendanceLogsClient } from "./attendance-logs-client";

export default async function AttendanceLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; q?: string | string[]; to?: string }>;
}) {
  const params = await searchParams;
  // Fetch logs and employees in parallel
  const [logsRes, teachersRes, nursesRes, doctorsRes, managersRes] =
    await Promise.all([
      getAttendanceLogs({ pageSize: 200 }),
      getEmployees("teacher", { pageSize: 200 }),
      getEmployees("nurse", { pageSize: 200 }),
      getEmployees("doctor", { pageSize: 200 }),
      getEmployees("manager", { pageSize: 200 }),
    ]);

  type EmpRow = { id: string; firstName: string; lastName: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacherList = ((teachersRes.data as any)?.employees ?? []) as EmpRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nurseList = ((nursesRes.data as any)?.employees ?? []) as EmpRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctorList = ((doctorsRes.data as any)?.employees ?? []) as EmpRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const managerList = ((managersRes.data as any)?.employees ?? []) as EmpRow[];

  // Build employee lookup for name resolution
  const empLookup = new Map<string, { name: string; role: string }>();
  for (const e of teacherList)
    empLookup.set(e.id, { name: `${e.firstName} ${e.lastName}`, role: "Teacher" });
  for (const e of nurseList)
    empLookup.set(e.id, { name: `${e.firstName} ${e.lastName}`, role: "Nurse" });
  for (const e of doctorList)
    empLookup.set(e.id, { name: `${e.firstName} ${e.lastName}`, role: "Doctor" });
  for (const e of managerList)
    empLookup.set(e.id, { name: `${e.firstName} ${e.lastName}`, role: "Manager" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawLogs = ((logsRes.data as any)?.logs ?? []) as any[];

  function formatTime(val: Date | string | null | undefined): string | null {
    if (!val) return null;
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const logs = rawLogs.map((log) => {
    const emp = empLookup.get(log.employeeId);
    return {
      id: log.id,
      employeeId: log.employeeId,
      employeeType: log.employeeType ?? "teacher",
      employeeName: emp?.name ?? log.readerName ?? "Unknown",
      date:
        log.date instanceof Date
          ? log.date.toISOString().split("T")[0]
          : new Date(log.date).toISOString().split("T")[0],
      timeIn: formatTime(log.timeIn),
      timeOut: formatTime(log.timeOut),
      status: log.status ?? null,
      readerId: log.readerId ?? null,
      readerName: log.readerName ?? null,
      cardId: log.cardId ?? null,
      note: log.note ?? null,
      createdAt:
        log.createdAt instanceof Date
          ? log.createdAt.toISOString()
          : new Date(log.createdAt).toISOString(),
    };
  });

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

  return (
    <AttendanceLogsClient
      logs={logs}
      employees={employees}
      initialDateFrom={params.from}
      initialDateTo={params.to}
      initialSearchQuery={normalizeLegacySearchQuery(params.q)}
    />
  );
}
