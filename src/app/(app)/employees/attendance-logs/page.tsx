import { getAttendanceLogs } from "@/lib/actions/employee-events";
import { getEmployees } from "@/lib/actions/employees";
import { normalizeLegacySearchQuery } from "@/lib/legacy-query";
import { AttendanceLogsClient } from "./attendance-logs-client";

export default async function AttendanceLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    cardId?: string | string[];
    datetime?: string | string[];
    from?: string;
    id?: string | string[];
    logDate?: string | string[];
    logTime?: string | string[];
    note?: string | string[];
    q?: string | string[];
    reader?: string | string[];
    readerId?: string | string[];
    status?: string | string[];
    teacherNo?: string | string[];
    to?: string;
  }>;
}) {
  const params = await searchParams;
  // Fetch logs and employees in parallel
  const [logsRes, teachersRes, nursesRes, doctorsRes, managersRes] =
    await Promise.all([
      getAttendanceLogs({ pageSize: 1000 }),
      getEmployees("teacher", { pageSize: 1000 }),
      getEmployees("nurse", { pageSize: 1000 }),
      getEmployees("doctor", { pageSize: 1000 }),
      getEmployees("manager", { pageSize: 1000 }),
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

  function formatDate(val: Date | string | null | undefined): string {
    if (!val) return "";
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  }

  function readRecord(value: unknown): Record<string, unknown> {
    if (!value) return {};
    if (typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    if (typeof value !== "string") return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  function readText(record: Record<string, unknown>, key: string) {
    const value = record[key];
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text || null;
  }

  function readNumber(record: Record<string, unknown>, key: string) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const logs = rawLogs.map((log) => {
    const emp = empLookup.get(log.employeeId);
    const noteRecord = readRecord(log.note);
    const legacyData = readRecord(noteRecord.legacyData);
    const legacyId =
      readNumber(noteRecord, "legacyId") ?? readNumber(legacyData, "atid");
    const date = formatDate(log.date);
    const createdAt = log.createdAt instanceof Date
      ? log.createdAt.toISOString()
      : new Date(log.createdAt).toISOString();

    return {
      id: log.id,
      legacyId,
      employeeId: log.employeeId,
      employeeType: log.employeeType ?? "teacher",
      employeeName: emp?.name ?? log.readerName ?? "Unknown",
      date,
      timeIn: formatTime(log.timeIn),
      timeOut: formatTime(log.timeOut),
      status: log.status ?? null,
      readerId: log.readerId ?? null,
      readerName: log.readerName ?? null,
      cardId: log.cardId ?? null,
      note: log.note ?? null,
      legacyReaderId: readText(legacyData, "readerid") ?? log.readerId ?? null,
      legacyReaderName: readText(legacyData, "readername") ?? log.readerName ?? null,
      legacyDate: readText(legacyData, "tdate") ?? date,
      legacyTime: readText(legacyData, "ttime") ?? formatTime(log.timeIn) ?? formatTime(log.timeOut),
      legacyStatus: readText(noteRecord, "legacyStatus") ?? readText(legacyData, "status") ?? log.status ?? null,
      legacyCardId: readText(legacyData, "cardid") ?? log.cardId ?? null,
      legacyTeacherNo:
        readText(noteRecord, "legacyTeacherName") ??
        readText(legacyData, "teacher_id") ??
        emp?.name ??
        null,
      legacyDefault: readText(noteRecord, "legacyDefault") ?? readText(legacyData, "tdefault"),
      legacyDatetime: readText(legacyData, "datetime") ?? createdAt,
      createdAt,
    };
  });

  return (
    <AttendanceLogsClient
      logs={logs}
      initialDateFrom={params.from}
      initialDateTo={params.to}
      initialFilters={{
        q: normalizeLegacySearchQuery(params.q),
        log: normalizeLegacySearchQuery(params.id),
        readerId: normalizeLegacySearchQuery(params.readerId),
        reader: normalizeLegacySearchQuery(params.reader),
        logDate: normalizeLegacySearchQuery(params.logDate),
        logTime: normalizeLegacySearchQuery(params.logTime),
        status: normalizeLegacySearchQuery(params.status),
        cardId: normalizeLegacySearchQuery(params.cardId),
        teacherNo: normalizeLegacySearchQuery(params.teacherNo),
        note: normalizeLegacySearchQuery(params.note),
        datetime: normalizeLegacySearchQuery(params.datetime),
      }}
    />
  );
}
