"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";
import {
  nurserySettingsSchema,
  type NurserySettingsValues,
} from "@/lib/validations/settings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HolidayData {
  name: string;
  description?: string | null;
  date: Date | string;
  endDate?: Date | string | null;
  repeated?: boolean;
  type?: string;
  isActive?: boolean;
  notificationTitle?: string | null;
  notificationMessage?: string | null;
  daysBefore?: number;
  informTeachers?: boolean;
  sendVia?: string;
  branchId?: string | null;
}

interface EventTypeData {
  name: string;
  color?: string | null;
}

interface EventData {
  title: string;
  description?: string | null;
  customSubject?: string | null;
  customBody?: string | null;
  date: Date | string;
  endDate?: Date | string | null;
  eventTypeId?: string | null;
  branchId?: string | null;
  notificationBranchIds?: string[] | null;
  notificationDaysBefore?: number[] | null;
  isActive?: boolean;
}

interface EventListParams {
  branchId?: string;
  eventTypeId?: string;
  isActive?: boolean;
  from?: Date | string;
  to?: Date | string;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

function normalizeStringArray(value: string[] | null | undefined) {
  return Array.from(
    new Set((value ?? []).map((item) => item.trim()).filter(Boolean)),
  );
}

function normalizeDaysBefore(value: number[] | null | undefined) {
  return Array.from(
    new Set(
      (value ?? [])
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 1 && item <= 10),
    ),
  ).sort((a, b) => a - b);
}

function stringListFromJson(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "")
    : [];
}

async function verifyBranchListAccess(branchIds: string[], organizationId: string) {
  if (branchIds.length === 0) return true;
  const count = await db.branch.count({
    where: { id: { in: branchIds }, organizationId },
  });
  return count === branchIds.length;
}

function revalidateLocationPages() {
  revalidatePath("/settings/regions");
  revalidatePath("/settings/zones");
  revalidatePath("/settings/areas");
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS (key-value per branch)
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// getSettings
// ---------------------------------------------------------------------------

export async function getSettings(
  branchId: string,
): Promise<ActionResult<Record<string, string>>> {
  try {
    const { organizationId: orgId } = await requireOrg();

    if (!(await verifyBranchAccess(branchId, orgId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const rows = await db.settings.findMany({
      where: { branchId },
    });

    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }

    return { success: true, data: map };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return { success: false, error: "Failed to fetch settings" };
  }
}

// ---------------------------------------------------------------------------
// setSetting (upsert by branchId + key)
// ---------------------------------------------------------------------------

export async function setSetting(
  branchId: string,
  key: string,
  value: string,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (!(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const setting = await db.settings.upsert({
      where: { branchId_key: { branchId, key } },
      update: { value },
      create: { branchId, key, value },
    });

    revalidatePath("/settings");

    return { success: true, data: setting };
  } catch (error) {
    console.error("Failed to set setting:", error);
    return { success: false, error: "Failed to set setting" };
  }
}

// ---------------------------------------------------------------------------
// updateNurserySettings (bulk upsert with validation)
// ---------------------------------------------------------------------------

export async function updateNurserySettings(
  branchId: string,
  values: NurserySettingsValues,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (!(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const parsed = nurserySettingsSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const entries = Object.entries(parsed.data) as [string, string][];
    await db.$transaction(
      entries.map(([key, value]) =>
        db.settings.upsert({
          where: { branchId_key: { branchId, key } },
          update: { value },
          create: { branchId, key, value },
        })
      )
    );

    revalidatePath("/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to update nursery settings:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION HIERARCHY (Province > District > Region)
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// getRegions — full nested hierarchy
// ---------------------------------------------------------------------------

export async function getRegions(): Promise<ActionResult> {
  try {
    const provinces = await db.province.findMany({
      include: {
        districts: {
          include: {
            regions: {
              include: {
                _count: { select: { childAddresses: true } },
              },
              orderBy: { name: "asc" },
            },
            _count: { select: { regions: true } },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: provinces };
  } catch (error) {
    console.error("Failed to fetch regions:", error);
    return { success: false, error: "Failed to fetch regions" };
  }
}

// ---------------------------------------------------------------------------
// Province CRUD
// ---------------------------------------------------------------------------

export async function createProvince(name: string, referenceNumber?: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    const province = await db.province.create({
      data: { name, referenceNumber: referenceNumber || null },
    });

    revalidateLocationPages();

    return { success: true, data: province };
  } catch (error) {
    console.error("Failed to create province:", error);
    return { success: false, error: "Failed to create province" };
  }
}

export async function updateProvince(
  id: string,
  name: string,
  referenceNumber?: string,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    const province = await db.province.update({
      where: { id },
      data: { name, referenceNumber: referenceNumber || null },
    });

    revalidateLocationPages();

    return { success: true, data: province };
  } catch (error) {
    console.error("Failed to update province:", error);
    return { success: false, error: "Failed to update province" };
  }
}

export async function deleteProvince(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    await db.province.delete({ where: { id } });

    revalidateLocationPages();

    return { success: true };
  } catch (error) {
    console.error("Failed to delete province:", error);
    return { success: false, error: "Failed to delete province" };
  }
}

// ---------------------------------------------------------------------------
// District CRUD
// ---------------------------------------------------------------------------

export async function createDistrict(
  name: string,
  provinceId: string,
  referenceNumber?: string,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    const district = await db.district.create({
      data: { name, provinceId, referenceNumber: referenceNumber || null },
    });

    revalidateLocationPages();

    return { success: true, data: district };
  } catch (error) {
    console.error("Failed to create district:", error);
    return { success: false, error: "Failed to create district" };
  }
}

export async function updateDistrict(
  id: string,
  name: string,
  referenceNumber?: string,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    const district = await db.district.update({
      where: { id },
      data: { name, referenceNumber: referenceNumber || null },
    });

    revalidateLocationPages();

    return { success: true, data: district };
  } catch (error) {
    console.error("Failed to update district:", error);
    return { success: false, error: "Failed to update district" };
  }
}

export async function deleteDistrict(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    await db.district.delete({ where: { id } });

    revalidateLocationPages();

    return { success: true };
  } catch (error) {
    console.error("Failed to delete district:", error);
    return { success: false, error: "Failed to delete district" };
  }
}

// ---------------------------------------------------------------------------
// Region CRUD
// ---------------------------------------------------------------------------

export async function createRegion(
  name: string,
  districtId: string,
  referenceNumber?: string,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    const region = await db.region.create({
      data: { name, districtId, referenceNumber: referenceNumber || null },
    });

    revalidateLocationPages();

    return { success: true, data: region };
  } catch (error) {
    console.error("Failed to create region:", error);
    return { success: false, error: "Failed to create region" };
  }
}

export async function updateRegion(
  id: string,
  name: string,
  referenceNumber?: string,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    const region = await db.region.update({
      where: { id },
      data: { name, referenceNumber: referenceNumber || null },
    });

    revalidateLocationPages();

    return { success: true, data: region };
  } catch (error) {
    console.error("Failed to update region:", error);
    return { success: false, error: "Failed to update region" };
  }
}

export async function deleteRegion(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };

    await db.region.delete({ where: { id } });

    revalidateLocationPages();

    return { success: true };
  } catch (error) {
    console.error("Failed to delete region:", error);
    return { success: false, error: "Failed to delete region" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HOLIDAYS
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// getHolidays
// ---------------------------------------------------------------------------

export async function getHolidays(branchId?: string): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      OR: [
        { branch: { organizationId: orgId } },
        { branchId: null },
      ],
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const holidays = await db.holiday.findMany({
      where,
      include: { branch: true },
      orderBy: { date: "asc" },
    });

    return { success: true, data: holidays };
  } catch (error) {
    console.error("Failed to fetch holidays:", error);
    return { success: false, error: "Failed to fetch holidays" };
  }
}

// ---------------------------------------------------------------------------
// createHoliday
// ---------------------------------------------------------------------------

export async function createHoliday(data: HolidayData): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (data.branchId && !(await verifyBranchAccess(data.branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const holiday = await db.holiday.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        date: toDate(data.date),
        endDate: data.endDate ? toDate(data.endDate) : null,
        repeated: data.repeated ?? false,
        type: data.type ?? "HOLIDAY",
        isActive: data.isActive ?? true,
        notificationTitle: data.notificationTitle ?? null,
        notificationMessage: data.notificationMessage ?? null,
        daysBefore: data.daysBefore ?? 0,
        informTeachers: data.informTeachers ?? false,
        sendVia: data.sendVia ?? "BOTH",
        branchId: data.branchId ?? null,
      },
    });

    revalidatePath("/settings/holidays");

    return { success: true, data: holiday };
  } catch (error) {
    console.error("Failed to create holiday:", error);
    return { success: false, error: "Failed to create holiday" };
  }
}

// ---------------------------------------------------------------------------
// updateHoliday
// ---------------------------------------------------------------------------

export async function updateHoliday(
  id: string,
  data: Partial<HolidayData>,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const existing = await db.holiday.findFirst({
      where: {
        id,
        OR: [
          { branch: { organizationId: ctx.organizationId } },
          { branchId: null },
        ],
      },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Holiday not found in your organization" };
    }

    if (data.branchId && !(await verifyBranchAccess(data.branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = toDate(data.date);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? toDate(data.endDate) : null;
    if (data.repeated !== undefined) updateData.repeated = data.repeated;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.notificationTitle !== undefined) updateData.notificationTitle = data.notificationTitle;
    if (data.notificationMessage !== undefined) updateData.notificationMessage = data.notificationMessage;
    if (data.daysBefore !== undefined) updateData.daysBefore = data.daysBefore;
    if (data.informTeachers !== undefined) updateData.informTeachers = data.informTeachers;
    if (data.sendVia !== undefined) updateData.sendVia = data.sendVia;
    if (data.branchId !== undefined) updateData.branchId = data.branchId;

    const holiday = await db.holiday.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/settings/holidays");

    return { success: true, data: holiday };
  } catch (error) {
    console.error("Failed to update holiday:", error);
    return { success: false, error: "Failed to update holiday" };
  }
}

// ---------------------------------------------------------------------------
// deleteHoliday
// ---------------------------------------------------------------------------

export async function deleteHoliday(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const existing = await db.holiday.findFirst({
      where: {
        id,
        OR: [
          { branch: { organizationId: ctx.organizationId } },
          { branchId: null },
        ],
      },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Holiday not found in your organization" };
    }

    await db.holiday.delete({ where: { id } });

    revalidatePath("/settings/holidays");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete holiday:", error);
    return { success: false, error: "Failed to delete holiday" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// getEventTypes
// ---------------------------------------------------------------------------

export async function getEventTypes(): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const eventTypes = await db.eventType.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { events: true } },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: eventTypes };
  } catch (error) {
    console.error("Failed to fetch event types:", error);
    return { success: false, error: "Failed to fetch event types" };
  }
}

// ---------------------------------------------------------------------------
// createEventType
// ---------------------------------------------------------------------------

export async function createEventType(
  data: EventTypeData,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const eventType = await db.eventType.create({
      data: {
        name: data.name,
        color: data.color ?? null,
        organizationId: ctx.organizationId,
      },
    });

    revalidatePath("/settings/event-types");

    return { success: true, data: eventType };
  } catch (error) {
    console.error("Failed to create event type:", error);
    return { success: false, error: "Failed to create event type" };
  }
}

// ---------------------------------------------------------------------------
// updateEventType
// ---------------------------------------------------------------------------

export async function updateEventType(
  id: string,
  data: Partial<EventTypeData>,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const existing = await db.eventType.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Event type not found in your organization" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;

    const eventType = await db.eventType.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/settings/event-types");

    return { success: true, data: eventType };
  } catch (error) {
    console.error("Failed to update event type:", error);
    return { success: false, error: "Failed to update event type" };
  }
}

// ---------------------------------------------------------------------------
// deleteEventType
// ---------------------------------------------------------------------------

export async function deleteEventType(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const existing = await db.eventType.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Event type not found in your organization" };
    }

    await db.eventType.delete({ where: { id } });

    revalidatePath("/settings/event-types");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete event type:", error);
    return { success: false, error: "Failed to delete event type" };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════════

// ---------------------------------------------------------------------------
// getEvents
// ---------------------------------------------------------------------------

export async function getEvents(
  params: EventListParams = {},
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      OR: [
        { organizationId: orgId },
        { branch: { organizationId: orgId } },
        { organizationId: null, branchId: null },
      ],
    };

    if (params.eventTypeId) {
      where.eventTypeId = params.eventTypeId;
    }

    if (typeof params.isActive === "boolean") {
      where.isActive = params.isActive;
    }

    if (params.from || params.to) {
      where.date = {};
      if (params.from) where.date.gte = toDate(params.from);
      if (params.to) where.date.lte = toDate(params.to);
    }

    const events = await db.event.findMany({
      where,
      include: {
        eventType: true,
        branch: true,
      },
      orderBy: { date: "asc" },
    });

    const filteredEvents = params.branchId
      ? events.filter((event) => {
          const notificationBranchIds = stringListFromJson(event.notificationBranchIds);
          return (
            event.branchId === params.branchId ||
            notificationBranchIds.includes(params.branchId!) ||
            (!event.branchId && notificationBranchIds.length === 0)
          );
        })
      : events;

    return { success: true, data: filteredEvents };
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return { success: false, error: "Failed to fetch events" };
  }
}

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------

export async function createEvent(data: EventData): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const notificationBranchIds = normalizeStringArray(data.notificationBranchIds);
    const notificationDaysBefore = normalizeDaysBefore(data.notificationDaysBefore);
    const scopedBranchId =
      data.branchId ?? (notificationBranchIds.length === 1 ? notificationBranchIds[0] : null);

    if (scopedBranchId && !(await verifyBranchAccess(scopedBranchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }
    if (!(await verifyBranchListAccess(notificationBranchIds, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const event = await db.event.create({
      data: {
        organizationId: ctx.organizationId,
        title: data.title,
        description: data.description ?? null,
        customSubject: data.customSubject ?? data.title,
        customBody: data.customBody ?? data.description ?? null,
        date: toDate(data.date),
        endDate: data.endDate ? toDate(data.endDate) : null,
        eventTypeId: data.eventTypeId ?? null,
        branchId: scopedBranchId,
        notificationBranchIds,
        notificationDaysBefore,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/settings/events");

    return { success: true, data: event };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

// ---------------------------------------------------------------------------
// updateEvent
// ---------------------------------------------------------------------------

export async function updateEvent(
  id: string,
  data: Partial<EventData>,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const existing = await db.event.findFirst({
      where: {
        id,
        OR: [
          { organizationId: ctx.organizationId },
          { branch: { organizationId: ctx.organizationId } },
          { organizationId: null, branchId: null },
        ],
      },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Event not found in your organization" };
    }

    const notificationBranchIds =
      data.notificationBranchIds === undefined
        ? undefined
        : normalizeStringArray(data.notificationBranchIds);
    const notificationDaysBefore =
      data.notificationDaysBefore === undefined
        ? undefined
        : normalizeDaysBefore(data.notificationDaysBefore);
    const scopedBranchId =
      data.branchId ??
      (notificationBranchIds && notificationBranchIds.length === 1
        ? notificationBranchIds[0]
        : data.branchId);

    if (scopedBranchId && !(await verifyBranchAccess(scopedBranchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }
    if (
      notificationBranchIds &&
      !(await verifyBranchListAccess(notificationBranchIds, ctx.organizationId))
    ) {
      return { success: false, error: "Branch not found in your organization" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.customSubject !== undefined)
      updateData.customSubject = data.customSubject;
    if (data.customBody !== undefined)
      updateData.customBody = data.customBody;
    if (data.date !== undefined) updateData.date = toDate(data.date);
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate ? toDate(data.endDate) : null;
    if (data.eventTypeId !== undefined)
      updateData.eventTypeId = data.eventTypeId;
    if (data.branchId !== undefined || notificationBranchIds !== undefined) {
      updateData.branchId = scopedBranchId ?? null;
    }
    if (notificationBranchIds !== undefined)
      updateData.notificationBranchIds = notificationBranchIds;
    if (notificationDaysBefore !== undefined)
      updateData.notificationDaysBefore = notificationDaysBefore;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    updateData.organizationId = ctx.organizationId;

    const event = await db.event.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/settings/events");

    return { success: true, data: event };
  } catch (error) {
    console.error("Failed to update event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

// ---------------------------------------------------------------------------
// deleteEvent
// ---------------------------------------------------------------------------

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    const existing = await db.event.findFirst({
      where: {
        id,
        OR: [
          { organizationId: ctx.organizationId },
          { branch: { organizationId: ctx.organizationId } },
          { organizationId: null, branchId: null },
        ],
      },
      select: { id: true },
    });
    if (!existing) {
      return { success: false, error: "Event not found in your organization" };
    }

    await db.event.delete({ where: { id } });

    revalidatePath("/settings/events");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
