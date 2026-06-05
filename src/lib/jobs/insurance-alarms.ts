import { db } from "@/lib/db";

export interface InsuranceGenerationSummary {
  branchesScanned: number;
  formsScanned: number;
  formsMatched: number;
  alarmsCreated: number;
  notificationsCreated: number;
  skippedExisting: number;
  skippedDisabledBranches: number;
  skippedNoInsurance: number;
  skippedInvalidExpiry: number;
  skippedOutsideWindow: number;
}

function startOfToday(now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function readString(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function readBoolean(data: Record<string, unknown> | null, keys: string[]) {
  for (const key of keys) {
    const value = data?.[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["yes", "true", "1", "y"].includes(normalized)) return true;
      if (["no", "false", "0", "n"].includes(normalized)) return false;
    }
  }
  return false;
}

function parseLegacyDate(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "0000-00-00") return null;

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const legacy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (legacy) {
    const [, day, month, year] = legacy;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(365, Math.floor(parsed)));
}

function legacyDataExpiryDate(legacyData: unknown) {
  const data = asRecord(legacyData);
  const direct = data?.insuranceExpiryDate ?? data?.expiryDate ?? data?.ins_expdate;
  if (typeof direct === "string" && direct.trim() !== "") {
    const parsed = parseLegacyDate(direct);
    return parsed ? dateKey(parsed) : direct.trim();
  }
  return null;
}

function renderNotificationText(
  text: string,
  variables: Record<string, string | number | null | undefined>,
) {
  return text.replace(
    /(\[\[([a-zA-Z0-9_]+)\]\]|\{\{\s*([a-zA-Z0-9_]+)\s*\}\})/g,
    (
      match,
      _token,
      squareKey: string | undefined,
      braceKey: string | undefined,
    ) => {
      const key = squareKey ?? braceKey;
      const value = key ? variables[key] : undefined;
      return value === null || typeof value === "undefined" ? match : String(value);
    },
  );
}

function emptySummary(): InsuranceGenerationSummary {
  return {
    branchesScanned: 0,
    formsScanned: 0,
    formsMatched: 0,
    alarmsCreated: 0,
    notificationsCreated: 0,
    skippedExisting: 0,
    skippedDisabledBranches: 0,
    skippedNoInsurance: 0,
    skippedInvalidExpiry: 0,
    skippedOutsideWindow: 0,
  };
}

export async function generateInsuranceAlarmsForOrganization(params: {
  organizationId: string;
  branchId?: string | null;
  now?: Date;
}): Promise<InsuranceGenerationSummary> {
  const now = params.now ?? new Date();
  const today = startOfToday(now);

  const branchRows = await db.branch.findMany({
    where: {
      organizationId: params.organizationId,
      ...(params.branchId ? { id: params.branchId } : {}),
    },
    select: { id: true },
  });
  const branchIds = branchRows.map((branch) => branch.id);

  const summary = emptySummary();
  summary.branchesScanned = branchIds.length;

  const settings = await db.settings.findMany({
    where: {
      branchId: { in: branchIds },
      key: { in: ["alarm.insurance.enabled", "alarm.insurance.threshold"] },
    },
  });
  const settingsByBranch = new Map<string, Record<string, string>>();
  for (const setting of settings) {
    const branchSettings = settingsByBranch.get(setting.branchId) ?? {};
    branchSettings[setting.key] = setting.value;
    settingsByBranch.set(setting.branchId, branchSettings);
  }

  const enabledBranchIds = branchIds.filter((id) => {
    const enabled = settingsByBranch.get(id)?.["alarm.insurance.enabled"];
    return enabled === undefined || enabled === "true";
  });
  summary.skippedDisabledBranches = branchIds.length - enabledBranchIds.length;
  if (enabledBranchIds.length === 0) return summary;

  const maxWindow = Math.max(
    0,
    ...enabledBranchIds.map((id) =>
      parsePositiveInteger(settingsByBranch.get(id)?.["alarm.insurance.threshold"], 7),
    ),
  );
  if (maxWindow === 0) return summary;

  const forms = await db.medicalForm.findMany({
    where: {
      formType: "GENERAL",
      status: { not: "DRAFT" },
      child: {
        isActive: true,
        isDraft: false,
        branchId: { in: enabledBranchIds },
        branch: { organizationId: params.organizationId },
      },
    },
    select: {
      id: true,
      data: true,
      child: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          branchId: true,
          classId: true,
          branch: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  summary.formsScanned = forms.length;

  const candidates = [];
  for (const form of forms) {
    const data = asRecord(form.data);
    const hasInsurance = readBoolean(data, ["hasInsurance", "has_insurance"]);
    if (!hasInsurance) {
      summary.skippedNoInsurance += 1;
      continue;
    }

    const expiryRaw = readString(data, ["insuranceExpiry", "ins_expdate"]);
    const expiryDate = parseLegacyDate(expiryRaw);
    if (!expiryDate) {
      summary.skippedInvalidExpiry += 1;
      continue;
    }

    const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / 86_400_000);
    const threshold = parsePositiveInteger(
      settingsByBranch.get(form.child.branchId)?.["alarm.insurance.threshold"],
      7,
    );
    if (daysUntil < 0 || daysUntil > threshold) {
      summary.skippedOutsideWindow += 1;
      continue;
    }

    const insuranceType = readString(data, ["insuranceType", "insurance"]);
    candidates.push({
      form,
      expiryDate,
      expiryRaw,
      expiryKey: dateKey(expiryDate),
      daysUntil,
      insuranceType,
    });
  }

  summary.formsMatched = candidates.length;
  if (candidates.length === 0) return summary;

  const childIds = candidates.map((candidate) => candidate.form.child.id);
  const existingAlarms = await db.alarm.findMany({
    where: {
      type: "INSURANCE",
      referenceType: "Child",
      referenceId: { in: childIds },
      isActive: true,
    },
    select: { referenceId: true, dueDate: true, message: true, legacyData: true },
  });

  const existingExpiryKeys = new Set<string>();
  const existingMessageKeys = new Set<string>();
  for (const alarm of existingAlarms) {
    if (!alarm.referenceId) continue;
    const expiryFromLegacy = legacyDataExpiryDate(alarm.legacyData);
    if (expiryFromLegacy) {
      existingExpiryKeys.add(`${alarm.referenceId}:${expiryFromLegacy}`);
    }
    if (alarm.dueDate) {
      existingExpiryKeys.add(`${alarm.referenceId}:${dateKey(alarm.dueDate)}`);
    }
    if (alarm.message) {
      existingMessageKeys.add(`${alarm.referenceId}:${normalizeText(alarm.message)}`);
    }
  }

  const [users, template] = await Promise.all([
    db.user.findMany({
      where: {
        isActive: true,
        organizationId: params.organizationId,
        OR: [
          { branchId: { in: enabledBranchIds } },
          { branchId: null, role: "ADMIN" },
        ],
      },
      select: { id: true, branchId: true, role: true },
    }),
    db.notificationTemplate.findUnique({
      where: {
        organizationId_category: {
          organizationId: params.organizationId,
          category: "INSURANCE",
        },
      },
    }),
  ]);

  const branchAdminIds = users
    .filter((user) => user.branchId === null && user.role === "ADMIN")
    .map((user) => user.id);
  const userIdsByBranch = new Map<string, string[]>();
  for (const user of users) {
    if (!user.branchId) continue;
    const branchUsers = userIdsByBranch.get(user.branchId) ?? [];
    branchUsers.push(user.id);
    userIdsByBranch.set(user.branchId, branchUsers);
  }

  const templateEnabled = template?.enabled ?? true;
  const subjectTemplate = template?.subject || "Insurance Expiring";
  const bodyTemplate =
    template?.body ||
    "Insurance for [[child_name]] expires on [[date]]. Please notify [[parent_name]] to renew.";

  for (const candidate of candidates) {
    const { form, expiryDate, expiryRaw, expiryKey, daysUntil, insuranceType } = candidate;
    const child = form.child;
    const childName = `${child.firstName} ${child.lastName}`;
    const variables = {
      child_name: childName,
      parent_name: "Parent",
      class_name: child.class?.name ?? "",
      branch_name: child.branch.name,
      date: expiryKey,
      expiry_date: expiryKey,
      days_until: daysUntil,
      insurance_type: insuranceType ?? "",
    };
    const message = renderNotificationText(bodyTemplate, variables);
    const expiryDedupeKey = `${child.id}:${expiryKey}`;
    const messageDedupeKey = `${child.id}:${normalizeText(message)}`;

    if (
      existingExpiryKeys.has(expiryDedupeKey) ||
      existingMessageKeys.has(messageDedupeKey)
    ) {
      summary.skippedExisting += 1;
      continue;
    }

    await db.alarm.create({
      data: {
        type: "INSURANCE",
        referenceId: child.id,
        referenceType: "Child",
        message,
        dueDate: expiryDate,
        branchId: child.branchId,
        isActive: true,
        legacyData: {
          sourceTable: "t_alarms_insurance",
          modernGenerator: "generateInsuranceAlarms",
          legacyMethod: "Data::AlarmsInsurance",
          medicalFormId: form.id,
          childId: child.id,
          classId: child.classId,
          currDate: dateKey(today),
          insuranceExpiryDate: expiryKey,
          rawInsuranceExpiry: expiryRaw,
          insuranceType,
          daysUntil,
          href: "alarmsInsurance.php",
          windowEndDate: dateKey(addDays(today, maxWindow)),
        },
      },
    });
    existingExpiryKeys.add(expiryDedupeKey);
    existingMessageKeys.add(messageDedupeKey);
    summary.alarmsCreated += 1;

    if (!templateEnabled) continue;

    const recipientIds = Array.from(
      new Set([...(userIdsByBranch.get(child.branchId) ?? []), ...branchAdminIds]),
    );
    if (recipientIds.length === 0) continue;

    const title = renderNotificationText(subjectTemplate, variables);
    const body = renderNotificationText(bodyTemplate, variables);
    const created = await db.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        title,
        body,
        type: "INSURANCE",
        category: "INSURANCE",
        isRead: false,
      })),
    });
    summary.notificationsCreated += created.count;
  }

  return summary;
}
