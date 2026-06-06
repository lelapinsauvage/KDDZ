"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireOrg, requireOrgSafe } from "@/lib/require-org";
import { verifyBranchAccess } from "@/lib/verify-org-access";
import type { AlarmType } from "@/generated/prisma/enums";
import {
  generateBirthdayAlarmsForOrganization,
  type BirthdayGenerationSummary,
} from "@/lib/jobs/birthday-alarms";
import {
  generateAssessmentAlarmsForOrganization,
  getAssessmentDueAlarmCandidates,
  type AssessmentDueAlarm,
  type AssessmentGenerationSummary,
} from "@/lib/jobs/assessment-alarms";
import {
  generateMedicineAlarmsForOrganization,
  type MedicineGenerationSummary,
} from "@/lib/jobs/medicine-alarms";
import {
  generateInsuranceAlarmsForOrganization,
  type InsuranceGenerationSummary,
} from "@/lib/jobs/insurance-alarms";
import {
  generateVaccinationAlarmsForOrganization,
  getVaccinationDueAlarmCandidates,
  type VaccinationDueAlarm,
  type VaccinationGenerationSummary,
} from "@/lib/jobs/vaccination-alarms";
import {
  generatePaymentAlarmsForOrganization,
  type PaymentGenerationSummary,
} from "@/lib/jobs/payment-alarms";
import {
  generateHolidayAlarmsForOrganization,
  type HolidayGenerationSummary,
} from "@/lib/jobs/holiday-alarms";
import {
  generateEventAlarmsForOrganization,
  type EventGenerationSummary,
} from "@/lib/jobs/event-alarms";
import {
  generateContractAlarmsForOrganization,
  type ContractGenerationSummary,
} from "@/lib/jobs/contract-alarms";

export type { AssessmentDueAlarm, AssessmentGenerationSummary } from "@/lib/jobs/assessment-alarms";
export type { MedicineGenerationSummary } from "@/lib/jobs/medicine-alarms";
export type { InsuranceGenerationSummary } from "@/lib/jobs/insurance-alarms";
export type {
  VaccinationDueAlarm,
  VaccinationGenerationSummary,
} from "@/lib/jobs/vaccination-alarms";
export type { PaymentGenerationSummary } from "@/lib/jobs/payment-alarms";
export type { HolidayGenerationSummary } from "@/lib/jobs/holiday-alarms";
export type { EventGenerationSummary } from "@/lib/jobs/event-alarms";
export type { ContractGenerationSummary } from "@/lib/jobs/contract-alarms";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AlarmListParams {
  type?: AlarmType;
  branchId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

interface AlarmData {
  type: AlarmType;
  referenceId?: string | null;
  referenceType?: string | null;
  message?: string | null;
  dueDate?: Date | string | null;
  branchId?: string | null;
  isActive?: boolean;
}

type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateOrNull(
  value: Date | string | null | undefined,
): Date | null {
  if (!value) return null;
  return typeof value === "string" ? new Date(value) : value;
}

// ---------------------------------------------------------------------------
// generateBirthdayAlarms
// ---------------------------------------------------------------------------

export async function generateBirthdayAlarms(
  branchId?: string,
): Promise<ActionResult<BirthdayGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const summary = await generateBirthdayAlarmsForOrganization({
      organizationId: ctx.organizationId,
      branchId,
    });

    revalidatePath("/alarms");
    revalidatePath("/alarms/birthdays");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate birthday alarms:", error);
    return { success: false, error: "Failed to generate birthday alarms" };
  }
}

// ---------------------------------------------------------------------------
// generateAssessmentAlarms
// ---------------------------------------------------------------------------

export async function generateAssessmentAlarms(
  branchId?: string,
): Promise<ActionResult<AssessmentGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const summary = await generateAssessmentAlarmsForOrganization({
      organizationId: ctx.organizationId,
      branchId,
    });

    revalidatePath("/alarms");
    revalidatePath("/alarms/assessments");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate assessment alarms:", error);
    return { success: false, error: "Failed to generate assessment alarms" };
  }
}

// ---------------------------------------------------------------------------
// generateMedicineAlarms
// ---------------------------------------------------------------------------

export async function generateMedicineAlarms(
  branchId?: string,
): Promise<ActionResult<MedicineGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const summary = await generateMedicineAlarmsForOrganization({
      organizationId: ctx.organizationId,
      branchId,
    });

    revalidatePath("/alarms");
    revalidatePath("/alarms/medicine");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate medicine alarms:", error);
    return { success: false, error: "Failed to generate medicine alarms" };
  }
}

// ---------------------------------------------------------------------------
// generateInsuranceAlarms
// ---------------------------------------------------------------------------

export async function generateInsuranceAlarms(
  branchId?: string,
): Promise<ActionResult<InsuranceGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const summary = await generateInsuranceAlarmsForOrganization({
      organizationId: ctx.organizationId,
      branchId,
    });

    revalidatePath("/alarms");
    revalidatePath("/alarms/insurance");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate insurance alarms:", error);
    return { success: false, error: "Failed to generate insurance alarms" };
  }
}

// ---------------------------------------------------------------------------
// generateVaccinationAlarms
// ---------------------------------------------------------------------------

export async function generateVaccinationAlarms(
  branchId?: string,
): Promise<ActionResult<VaccinationGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const summary = await generateVaccinationAlarmsForOrganization({
      organizationId: ctx.organizationId,
      branchId,
    });

    revalidatePath("/alarms");
    revalidatePath("/alarms/vaccinations");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate vaccination alarms:", error);
    return { success: false, error: "Failed to generate vaccination alarms" };
  }
}

// ---------------------------------------------------------------------------
// getVaccinationDueAlarms
// ---------------------------------------------------------------------------

export async function getVaccinationDueAlarms(
  branchId?: string,
): Promise<ActionResult<VaccinationDueAlarm[]>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const alarms = await getVaccinationDueAlarmCandidates({
      organizationId: ctx.organizationId,
      branchId,
    });

    return { success: true, data: alarms };
  } catch (error) {
    console.error("Failed to fetch vaccination due alarms:", error);
    return { success: false, error: "Failed to fetch vaccination due alarms" };
  }
}

// ---------------------------------------------------------------------------
// generatePaymentAlarms
// ---------------------------------------------------------------------------

export async function generatePaymentAlarms(
  branchId?: string,
): Promise<ActionResult<PaymentGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const summary = await generatePaymentAlarmsForOrganization({
      organizationId: ctx.organizationId,
      branchId,
    });

    revalidatePath("/alarms");
    revalidatePath("/alarms/payments");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate payment alarms:", error);
    return { success: false, error: "Failed to generate payment alarms" };
  }
}

// ---------------------------------------------------------------------------
// generateHolidayAlarms
// ---------------------------------------------------------------------------

export async function generateHolidayAlarms(
  branchId?: string,
): Promise<ActionResult<HolidayGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const summary = await generateHolidayAlarmsForOrganization({
      organizationId: ctx.organizationId,
      branchId,
    });

    revalidatePath("/alarms");
    revalidatePath("/alarms/events");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate holiday alarms:", error);
    return { success: false, error: "Failed to generate holiday alarms" };
  }
}

// ---------------------------------------------------------------------------
// generateEventAlarms
// ---------------------------------------------------------------------------

export async function generateEventAlarms(
  branchId?: string,
): Promise<ActionResult<EventGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const summary = await generateEventAlarmsForOrganization({
      organizationId: ctx.organizationId,
      branchId,
    });

    revalidatePath("/alarms");
    revalidatePath("/alarms/events");
    revalidatePath("/settings/events");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate event alarms:", error);
    return { success: false, error: "Failed to generate event alarms" };
  }
}

// ---------------------------------------------------------------------------
// generateContractAlarms
// ---------------------------------------------------------------------------

export async function generateContractAlarms(
  branchId?: string,
): Promise<ActionResult<ContractGenerationSummary>> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { ctx } = result;

    if (branchId && !(await verifyBranchAccess(branchId, ctx.organizationId))) {
      return { success: false, error: "Branch not found in your organization" };
    }

    const summary = await generateContractAlarmsForOrganization({
      organizationId: ctx.organizationId,
      branchId,
    });

    revalidatePath("/alarms");
    revalidatePath("/alarms/contracts");
    revalidatePath("/");

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to generate contract alarms:", error);
    return { success: false, error: "Failed to generate contract alarms" };
  }
}

// ---------------------------------------------------------------------------
// getAlarms
// ---------------------------------------------------------------------------

export async function getAlarms(
  params: AlarmListParams = {},
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();
    const { type, branchId, isActive, page = 1, pageSize = 20 } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      OR: [
        { branch: { organizationId: orgId } },
        { branchId: null },
      ],
    };

    if (type) where.type = type;
    if (branchId) where.branchId = branchId;
    if (typeof isActive === "boolean") where.isActive = isActive;

    const skip = (page - 1) * pageSize;

    const [alarms, total] = await Promise.all([
      db.alarm.findMany({
        where,
        include: { branch: true },
        orderBy: { dueDate: "asc" },
        skip,
        take: pageSize,
      }),
      db.alarm.count({ where }),
    ]);

    return {
      success: true,
      data: {
        alarms,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("Failed to fetch alarms:", error);
    return { success: false, error: "Failed to fetch alarms" };
  }
}

// ---------------------------------------------------------------------------
// createAlarm
// ---------------------------------------------------------------------------

export async function createAlarm(data: AlarmData): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    if (data.branchId) {
      const hasAccess = await verifyBranchAccess(data.branchId, orgId);
      if (!hasAccess) return { success: false, error: "Branch not found in your organization" };
    }

    const alarm = await db.alarm.create({
      data: {
        type: data.type,
        referenceId: data.referenceId ?? null,
        referenceType: data.referenceType ?? null,
        message: data.message ?? null,
        dueDate: toDateOrNull(data.dueDate),
        branchId: data.branchId ?? null,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/alarms");

    return { success: true, data: alarm };
  } catch (error) {
    console.error("Failed to create alarm:", error);
    return { success: false, error: "Failed to create alarm" };
  }
}

// ---------------------------------------------------------------------------
// updateAlarm
// ---------------------------------------------------------------------------

export async function updateAlarm(
  id: string,
  data: Partial<AlarmData>,
): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    const existing = await db.alarm.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing || existing.branch?.organizationId !== orgId) {
      return { success: false, error: "Alarm not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.referenceId !== undefined)
      updateData.referenceId = data.referenceId;
    if (data.referenceType !== undefined)
      updateData.referenceType = data.referenceType;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.dueDate !== undefined)
      updateData.dueDate = toDateOrNull(data.dueDate);
    if (data.branchId !== undefined) updateData.branchId = data.branchId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const alarm = await db.alarm.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/alarms");

    return { success: true, data: alarm };
  } catch (error) {
    console.error("Failed to update alarm:", error);
    return { success: false, error: "Failed to update alarm" };
  }
}

// ---------------------------------------------------------------------------
// dismissAlarm — set isActive=false
// ---------------------------------------------------------------------------

export async function dismissAlarm(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    const existing = await db.alarm.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing || existing.branch?.organizationId !== orgId) {
      return { success: false, error: "Alarm not found" };
    }

    await db.alarm.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/alarms");

    return { success: true };
  } catch (error) {
    console.error("Failed to dismiss alarm:", error);
    return { success: false, error: "Failed to dismiss alarm" };
  }
}

// ---------------------------------------------------------------------------
// deleteAlarm
// ---------------------------------------------------------------------------

export async function deleteAlarm(id: string): Promise<ActionResult> {
  try {
    const result = await requireOrgSafe();
    if (!result.ok) return { success: false, error: result.error };
    const { organizationId: orgId } = result.ctx;

    const existing = await db.alarm.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing || existing.branch?.organizationId !== orgId) {
      return { success: false, error: "Alarm not found" };
    }

    await db.alarm.delete({ where: { id } });

    revalidatePath("/alarms");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete alarm:", error);
    return { success: false, error: "Failed to delete alarm" };
  }
}

// ---------------------------------------------------------------------------
// getUpcomingBirthdays
// ---------------------------------------------------------------------------

export async function getUpcomingBirthdays(
  branchId?: string,
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
      dateOfBirth: { not: null },
      branch: { organizationId: orgId },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const children = await db.child.findMany({
      where,
      include: { branch: true, class: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const birthdays = children
      .map((child) => {
        const dob = child.dateOfBirth!;
        // Calculate next birthday
        const nextBirthday = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate(),
        );

        // If the birthday already passed this year, use next year
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = nextBirthday.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate age at next birthday
        const age = nextBirthday.getFullYear() - dob.getFullYear();

        return {
          child,
          daysUntil,
          age,
          nextBirthday,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return { success: true, data: birthdays };
  } catch (error) {
    console.error("Failed to fetch upcoming birthdays:", error);
    return { success: false, error: "Failed to fetch upcoming birthdays" };
  }
}

// ---------------------------------------------------------------------------
// getOverdueVaccinations
// ---------------------------------------------------------------------------

export async function getOverdueVaccinations(
  branchId?: string,
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      nextDueDate: { lt: today },
      child: { branch: { organizationId: orgId } },
    };

    if (branchId) {
      where.child = { ...where.child, branchId };
    }

    const vaccinations = await db.vaccination.findMany({
      where,
      include: {
        child: {
          include: { branch: true, class: true },
        },
      },
      orderBy: { nextDueDate: "asc" },
    });

    return { success: true, data: vaccinations };
  } catch (error) {
    console.error("Failed to fetch overdue vaccinations:", error);
    return { success: false, error: "Failed to fetch overdue vaccinations" };
  }
}

// ---------------------------------------------------------------------------
// getUpcomingAssessments
// ---------------------------------------------------------------------------

export async function getUpcomingAssessments(
  branchId?: string,
): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      scheduledDate: { gte: today },
      branch: { organizationId: orgId },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const assessmentDates = await db.assessmentDate.findMany({
      where,
      include: { branch: true },
      orderBy: { scheduledDate: "asc" },
    });

    return { success: true, data: assessmentDates };
  } catch (error) {
    console.error("Failed to fetch upcoming assessments:", error);
    return { success: false, error: "Failed to fetch upcoming assessments" };
  }
}

// ---------------------------------------------------------------------------
// getAssessmentDueAlarms — legacy-style child assessment reminders
// ---------------------------------------------------------------------------

export async function getAssessmentDueAlarms(
  branchId?: string,
): Promise<ActionResult<AssessmentDueAlarm[]>> {
  try {
    const { organizationId: orgId } = await requireOrg();
    const alarms = await getAssessmentDueAlarmCandidates({
      organizationId: orgId,
      branchId,
    });

    return { success: true, data: alarms };
  } catch (error) {
    console.error("Failed to fetch assessment due alarms:", error);
    return { success: false, error: "Failed to fetch assessment due alarms" };
  }
}

// ---------------------------------------------------------------------------
// getAlarmOverviewCounts — counts per alarm type for overview page
// ---------------------------------------------------------------------------

export interface AlarmCountItem {
  type: string;
  label: string;
  count: number;
  href: string;
  color: string;
  icon: string;
}

export async function getAlarmOverviewCounts(): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      birthdayCount,
      assessmentCount,
      vaccinationCount,
      medicalCount,
      medicineCount,
      eventCount,
      insuranceCount,
      paymentCount,
      requestCount,
      contractCount,
      otherCount,
    ] = await Promise.all([
      // Birthdays: children with birthday in the next 30 days
      db.child.findMany({
        where: { isActive: true, dateOfBirth: { not: null }, branch: { organizationId: orgId } },
        select: { dateOfBirth: true },
      }).then((children) => {
        return children.filter((c) => {
          const dob = c.dateOfBirth!;
          const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          if (next < today) next.setFullYear(today.getFullYear() + 1);
          return next <= thirtyDaysFromNow;
        }).length;
      }),
      // Assessments: upcoming assessment dates
      db.assessmentDate.count({
        where: { scheduledDate: { gte: today }, branch: { organizationId: orgId } },
      }),
      // Vaccinations: overdue
      db.vaccination.count({
        where: { nextDueDate: { lt: today }, child: { branch: { organizationId: orgId } } },
      }),
      // Medical: active alarms
      db.alarm.count({
        where: { type: "MEDICAL", isActive: true, branch: { organizationId: orgId } },
      }),
      // Medicine: active alarms
      db.alarm.count({
        where: { type: "MEDICINE", isActive: true, branch: { organizationId: orgId } },
      }),
      // Events: upcoming active events
      Promise.all([
        db.event.count({
          where: {
            isActive: true,
            date: { gte: today },
            OR: [{ branch: { organizationId: orgId } }, { branchId: null }],
          },
        }),
        db.alarm.count({
          where: {
            type: "EVENT",
            isActive: true,
            OR: [{ branch: { organizationId: orgId } }, { branchId: null }],
          },
        }),
      ]).then(([events, alarms]) => events + alarms),
      // Insurance: active alarms
      db.alarm.count({
        where: { type: "INSURANCE", isActive: true, branch: { organizationId: orgId } },
      }),
      // Payments: overdue
      db.payment.count({
        where: {
          status: "OVERDUE",
          deletedAt: null,
          child: { branch: { organizationId: orgId } },
        },
      }),
      // Requests: active alarms
      db.alarm.count({
        where: { type: "REQUEST", isActive: true, branch: { organizationId: orgId } },
      }),
      // Contracts: active alarms
      db.alarm.count({
        where: { type: "CONTRACT", isActive: true, branch: { organizationId: orgId } },
      }),
      // Other: active alarms
      db.alarm.count({
        where: { type: "OTHER", isActive: true, branch: { organizationId: orgId } },
      }),
    ]);

    const counts: AlarmCountItem[] = [
      { type: "BIRTHDAY", label: "Birthdays", count: birthdayCount, href: "/alarms/birthdays", color: "bg-pink-100 text-pink-600", icon: "Cake" },
      { type: "ASSESSMENT", label: "Assessments", count: assessmentCount, href: "/alarms/assessments", color: "bg-teal-100 text-teal-600", icon: "ClipboardCheck" },
      { type: "VACCINATION", label: "Vaccinations", count: vaccinationCount, href: "/alarms/vaccinations", color: "bg-blue-100 text-blue-600", icon: "Syringe" },
      { type: "MEDICAL", label: "Medical", count: medicalCount, href: "/alarms/medical", color: "bg-red-100 text-red-600", icon: "Stethoscope" },
      { type: "MEDICINE", label: "Medicine", count: medicineCount, href: "/alarms/medicine", color: "bg-purple-100 text-purple-600", icon: "Pill" },
      { type: "EVENT", label: "Events", count: eventCount, href: "/alarms/events", color: "bg-teal-100 text-teal-600", icon: "CalendarDays" },
      { type: "INSURANCE", label: "Insurance", count: insuranceCount, href: "/alarms/insurance", color: "bg-blue-100 text-blue-600", icon: "Shield" },
      { type: "PAYMENT", label: "Payments", count: paymentCount, href: "/alarms/payments", color: "bg-amber-100 text-amber-600", icon: "DollarSign" },
      { type: "REQUEST", label: "Requests", count: requestCount, href: "/alarms/requests", color: "bg-blue-100 text-blue-600", icon: "MessageSquare" },
      { type: "CONTRACT", label: "Contracts", count: contractCount, href: "/alarms/contracts", color: "bg-teal-100 text-teal-600", icon: "FileText" },
      { type: "OTHER", label: "Others", count: otherCount, href: "/alarms/others", color: "bg-orange-100 text-orange-600", icon: "Bell" },
    ];

    const totalActive = counts.reduce((sum, c) => sum + c.count, 0);

    return { success: true, data: { counts, totalActive } };
  } catch (error) {
    console.error("Failed to fetch alarm overview counts:", error);
    return { success: false, error: "Failed to fetch alarm overview counts" };
  }
}

// ---------------------------------------------------------------------------
// getNotifications — for a specific user
// ---------------------------------------------------------------------------

export async function getNotifications(params: {
  userId?: string;
  isRead?: boolean;
  limit?: number;
} = {}): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = params.userId ?? session.user.id;
    const limit = params.limit ?? 20;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId };
    if (typeof params.isRead === "boolean") where.isRead = params.isRead;

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { success: true, data: { notifications, unreadCount } };
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

// ---------------------------------------------------------------------------
// getUnreadNotificationCount — lightweight count for header badge
// ---------------------------------------------------------------------------

export async function getUnreadNotificationCount(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: true, data: 0 };
    }

    const count = await db.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return { success: true, data: count };
  } catch (error) {
    console.error("Failed to fetch notification count:", error);
    return { success: true, data: 0 };
  }
}

// ---------------------------------------------------------------------------
// markNotificationRead
// ---------------------------------------------------------------------------

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

// ---------------------------------------------------------------------------
// markAllNotificationsRead
// ---------------------------------------------------------------------------

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await db.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return {
      success: false,
      error: "Failed to mark all notifications as read",
    };
  }
}

// ---------------------------------------------------------------------------
// getHeaderAlarmCounts — lightweight counts for header notification badges
// ---------------------------------------------------------------------------

export async function getHeaderAlarmCounts(): Promise<ActionResult> {
  try {
    const { organizationId: orgId } = await requireOrg();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [birthdayResult, assessmentCount, medicalCount, totalAlarmCount] =
      await Promise.all([
        // Birthdays in next 7 days — single DB count with org filter
        db.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM children
          WHERE "isActive" = true AND "dateOfBirth" IS NOT NULL
          AND "branchId" IN (SELECT id FROM branches WHERE "organizationId" = cast(${orgId} as uuid))
          AND (EXTRACT(MONTH FROM "dateOfBirth") * 100 + EXTRACT(DAY FROM "dateOfBirth"))
          IN (
            SELECT EXTRACT(MONTH FROM d) * 100 + EXTRACT(DAY FROM d)
            FROM generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', '1 day') AS d
          )
        `,
        // Upcoming assessments
        db.assessmentDate.count({
          where: { scheduledDate: { gte: today }, branch: { organizationId: orgId } },
        }),
        // Active medical alarms
        db.alarm.count({
          where: { type: "MEDICAL", isActive: true, branch: { organizationId: orgId } },
        }),
        // Total active alarms across all types
        db.alarm.count({
          where: { isActive: true, branch: { organizationId: orgId } },
        }),
      ]);

    const birthdayCount = Number(birthdayResult[0]?.count ?? 0);

    return {
      success: true,
      data: {
        birthdays: birthdayCount,
        assessments: assessmentCount,
        medical: medicalCount,
        totalAlarms: totalAlarmCount,
      },
    };
  } catch (error) {
    console.error("Failed to fetch header alarm counts:", error);
    return {
      success: true,
      data: { birthdays: 0, assessments: 0, medical: 0, totalAlarms: 0 },
    };
  }
}
