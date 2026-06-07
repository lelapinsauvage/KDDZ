import { getEmployees } from "@/lib/actions/employees";
import { getBranches } from "@/lib/actions/branches";
import { AttendanceClient } from "./attendance-client";

export default async function EmployeeAttendancePage() {
  // Fetch all employee types in parallel
  const [teachersRes, nursesRes, doctorsRes, managersRes, branchesRes] = await Promise.all([
    getEmployees("teacher", { pageSize: "all" }),
    getEmployees("nurse", { pageSize: "all" }),
    getEmployees("doctor", { pageSize: "all" }),
    getEmployees("manager", { pageSize: "all" }),
    getBranches(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teachers = ((teachersRes.data as any)?.employees ?? []) as Array<{
    id: string;
    legacyId: number | null;
    legacyKey: string | null;
    firstName: string;
    lastName: string;
    isActive: boolean;
    branch: { name: string };
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nurses = ((nursesRes.data as any)?.employees ?? []) as Array<{
    id: string;
    legacyId: number | null;
    legacyKey: string | null;
    firstName: string;
    lastName: string;
    isActive: boolean;
    branch: { name: string };
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctors = ((doctorsRes.data as any)?.employees ?? []) as Array<{
    id: string;
    legacyId: number | null;
    legacyKey: string | null;
    firstName: string;
    lastName: string;
    isActive: boolean;
    branch: { name: string };
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const managers = ((managersRes.data as any)?.employees ?? []) as Array<{
    id: string;
    legacyId: number | null;
    legacyKey: string | null;
    firstName: string;
    lastName: string;
    isActive: boolean;
    branch: { name: string };
  }>;

  // Combine into unified attendance list
  const employees = [
    ...teachers.map((e) => ({
      id: e.id,
      legacyId: e.legacyId,
      legacyKey: e.legacyKey,
      employeeName: `${e.firstName} ${e.lastName}`,
      role: "Teacher",
      branch: e.branch.name,
      isActive: e.isActive,
    })),
    ...nurses.map((e) => ({
      id: e.id,
      legacyId: e.legacyId,
      legacyKey: e.legacyKey,
      employeeName: `${e.firstName} ${e.lastName}`,
      role: "Nurse",
      branch: e.branch.name,
      isActive: e.isActive,
    })),
    ...doctors.map((e) => ({
      id: e.id,
      legacyId: e.legacyId,
      legacyKey: e.legacyKey,
      employeeName: `${e.firstName} ${e.lastName}`,
      role: "Doctor",
      branch: e.branch.name,
      isActive: e.isActive,
    })),
    ...managers.map((e) => ({
      id: e.id,
      legacyId: e.legacyId,
      legacyKey: e.legacyKey,
      employeeName: `${e.firstName} ${e.lastName}`,
      role: "Manager",
      branch: e.branch.name,
      isActive: e.isActive,
    })),
  ];

  const branches = ((branchesRes.data ?? []) as Array<{ id: string; name: string }>).map((b) => ({
    id: b.id,
    name: b.name,
  }));

  return <AttendanceClient employees={employees} branches={branches} />;
}
