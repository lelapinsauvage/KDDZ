import assert from "node:assert/strict";
import {
  attendancePreselectTarget,
  normalizeAttendancePreselectedEmployeeId,
} from "@/lib/legacy-attendance-preselect-contract";

const employees = [{ id: "teacher-1" }, { id: "teacher with space" }];

assert.equal(
  attendancePreselectTarget("teacher with space"),
  "/employees/attendance?employeeId=teacher%20with%20space",
);
assert.equal(
  normalizeAttendancePreselectedEmployeeId("teacher-1", employees),
  "teacher-1",
);
assert.equal(
  normalizeAttendancePreselectedEmployeeId(" teacher-1 ", employees),
  "teacher-1",
);
assert.equal(
  normalizeAttendancePreselectedEmployeeId("missing", employees),
  "ALL",
);
assert.equal(normalizeAttendancePreselectedEmployeeId(undefined, employees), "ALL");

console.log("legacy attendance preselect contract ok");
