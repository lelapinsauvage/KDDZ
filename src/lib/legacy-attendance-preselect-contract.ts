export interface AttendancePreselectEmployee {
  id: string;
}

export function attendancePreselectTarget(employeeId: string) {
  return `/employees/attendance?employeeId=${encodeURIComponent(employeeId)}`;
}

export function normalizeAttendancePreselectedEmployeeId(
  employeeId: string | null | undefined,
  employees: AttendancePreselectEmployee[],
) {
  const normalized = employeeId?.trim();
  if (!normalized) return "ALL";
  return employees.some((employee) => employee.id === normalized)
    ? normalized
    : "ALL";
}
