import { db } from "@/lib/db";
import { AttendanceLogsClient } from "./attendance-logs-client";

export default async function AttendanceLogsPage() {
  // No dedicated EmployeeAttendance model exists in the schema.
  // Fetch recent alarms as log entries instead.
  const alarms = await db.alarm.findMany({
    where: {
      isActive: true,
    },
    include: {
      branch: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const logs = alarms.map((alarm) => ({
    id: alarm.id,
    employee: alarm.branch?.name ?? "System",
    type: alarm.type,
    message: alarm.message ?? "",
    dueDate: alarm.dueDate?.toISOString() ?? null,
    createdAt: alarm.createdAt.toISOString(),
  }));

  return <AttendanceLogsClient logs={logs} />;
}
