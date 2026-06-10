import { db } from "@/lib/db";
import { requireOrg, type OrgContext } from "@/lib/require-org";
import { isAdminRole } from "@/lib/require-role";

type LegacyDirectApprovalRow = {
  sourceDatabase: string;
  legacyId: number;
  settingValue: string | null;
};

function legacyToggleEnabled(value: string | null | undefined, fallback = true) {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return fallback;
}

function sortRows(rows: LegacyDirectApprovalRow[]) {
  return [...rows].sort((a, b) => {
    const sourceCompare = a.sourceDatabase.localeCompare(b.sourceDatabase);
    if (sourceCompare !== 0) return sourceCompare;
    return b.legacyId - a.legacyId;
  });
}

function chooseDirectApprovalRow(
  rows: LegacyDirectApprovalRow[],
  sourceDatabases: Set<string>,
) {
  const exactRows = rows.filter((row) => sourceDatabases.has(row.sourceDatabase));
  if (exactRows.length > 0) return sortRows(exactRows)[0];

  return (
    rows.find((row) => row.sourceDatabase.toLowerCase().includes("29sept")) ??
    rows.find((row) => !row.sourceDatabase.toLowerCase().includes("2018")) ??
    rows[0]
  );
}

export function canSubmitDailyReportDirectly(
  role: OrgContext["role"],
  directApprovalEnabled: boolean,
) {
  return isAdminRole(role) || directApprovalEnabled;
}

export async function getLegacyDailyReportDirectApprovalEnabled(
  organizationId: string,
) {
  const [branches, rows] = await Promise.all([
    db.branch.findMany({
      where: { organizationId, sourceDatabase: { not: null } },
      select: { sourceDatabase: true },
    }),
    db.legacySetting.findMany({
      where: {
        legacyTable: "t_settings",
        settingKey: "direct_approval",
      },
      select: {
        sourceDatabase: true,
        legacyId: true,
        settingValue: true,
      },
      orderBy: [{ sourceDatabase: "asc" }, { legacyId: "desc" }],
    }),
  ]);

  const sourceDatabases = new Set(
    branches.flatMap((branch) =>
      branch.sourceDatabase ? [branch.sourceDatabase] : [],
    ),
  );
  const setting = chooseDirectApprovalRow(rows, sourceDatabases);
  return legacyToggleEnabled(setting?.settingValue, true);
}

export async function resolveDailyReportDirectSubmitPermission(ctx: OrgContext) {
  const directApprovalEnabled = await getLegacyDailyReportDirectApprovalEnabled(
    ctx.organizationId,
  );
  return canSubmitDailyReportDirectly(ctx.role, directApprovalEnabled);
}

export async function getCurrentDailyReportDirectSubmitPermission() {
  try {
    const ctx = await requireOrg();
    return resolveDailyReportDirectSubmitPermission(ctx);
  } catch {
    return true;
  }
}

export async function getCurrentLegacyDailyReportDirectApprovalEnabled() {
  try {
    const ctx = await requireOrg();
    return getLegacyDailyReportDirectApprovalEnabled(ctx.organizationId);
  } catch {
    return true;
  }
}
