import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log("=== Backfill: Multi-tenancy org assignment ===\n");

  // Step 1: Find or create the default organization
  let org = await db.organization.findFirst();

  if (!org) {
    org = await db.organization.create({
      data: { name: "KiddzOnline", slug: "kiddzoline" },
    });
    console.log(`Created organization "${org.name}" (${org.id})`);
  } else {
    console.log(`Found existing organization "${org.name}" (${org.id})`);
    if (!org.slug) {
      org = await db.organization.update({
        where: { id: org.id },
        data: { slug: "kiddzoline" },
      });
      console.log(`  Updated slug to "kiddzoline"`);
    }
  }

  const orgId = org.id;

  // Step 2: Bulk-update all models with organizationId = NULL
  const userResult = await db.user.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId },
  });
  console.log(`Users updated: ${userResult.count}`);

  const schoolYearResult = await db.schoolYear.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId },
  });
  console.log(`SchoolYears updated: ${schoolYearResult.count}`);

  const foodResult = await db.food.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId },
  });
  console.log(`Foods updated: ${foodResult.count}`);

  const eventTypeResult = await db.eventType.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId },
  });
  console.log(`EventTypes updated: ${eventTypeResult.count}`);

  const messageResult = await db.message.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId },
  });
  console.log(`Messages updated: ${messageResult.count}`);

  const threadResult = await db.messageThread.updateMany({
    where: { organizationId: null },
    data: { organizationId: orgId },
  });
  console.log(`MessageThreads updated: ${threadResult.count}`);

  // Step 3: Backfill branchId on EmployeeEvents
  const employeeEvents = await db.employeeEvent.findMany({
    where: { branchId: null },
  });
  console.log(`\nEmployeeEvents without branchId: ${employeeEvents.length}`);

  let eeUpdated = 0;
  for (const event of employeeEvents) {
    const branchId = await lookupEmployeeBranch(
      event.employeeId,
      event.employeeType
    );
    if (branchId) {
      await db.employeeEvent.update({
        where: { id: event.id },
        data: { branchId },
      });
      eeUpdated++;
    } else {
      console.log(
        `  WARNING: No branch found for EmployeeEvent ${event.id} (employeeId=${event.employeeId}, type=${event.employeeType})`
      );
    }
  }
  console.log(`EmployeeEvents backfilled: ${eeUpdated}`);

  // Step 4: Backfill branchId on TeacherAttendance
  const attendances = await db.teacherAttendance.findMany({
    where: { branchId: null },
  });
  console.log(`\nTeacherAttendance without branchId: ${attendances.length}`);

  let taUpdated = 0;
  for (const att of attendances) {
    const type = att.employeeType || "teacher";
    const branchId = await lookupEmployeeBranch(att.employeeId, type);
    if (branchId) {
      await db.teacherAttendance.update({
        where: { id: att.id },
        data: { branchId },
      });
      taUpdated++;
    } else {
      console.log(
        `  WARNING: No branch found for TeacherAttendance ${att.id} (employeeId=${att.employeeId}, type=${type})`
      );
    }
  }
  console.log(`TeacherAttendance backfilled: ${taUpdated}`);

  console.log("\n=== Backfill complete ===");
}

async function lookupEmployeeBranch(
  employeeId: string,
  employeeType: string
): Promise<string | null> {
  const type = employeeType.toLowerCase();

  if (type === "teacher") {
    const t = await db.teacher.findUnique({
      where: { id: employeeId },
      select: { branchId: true },
    });
    return t?.branchId ?? null;
  }
  if (type === "nurse") {
    const n = await db.nurse.findUnique({
      where: { id: employeeId },
      select: { branchId: true },
    });
    return n?.branchId ?? null;
  }
  if (type === "doctor") {
    const d = await db.doctor.findUnique({
      where: { id: employeeId },
      select: { branchId: true },
    });
    return d?.branchId ?? null;
  }
  if (type === "manager") {
    const m = await db.manager.findUnique({
      where: { id: employeeId },
      select: { branchId: true },
    });
    return m?.branchId ?? null;
  }

  console.log(`  WARNING: Unknown employeeType "${employeeType}"`);
  return null;
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
