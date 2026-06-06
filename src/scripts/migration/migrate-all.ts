/**
 * Master migration script — runs all migrations in dependency order.
 *
 * Dependency order:
 *   1. Branches     (no deps — only needs Organization)
 *   2. Locations    (no deps — provides location mappings)
 *   3. School Years (depends on Organization)
 *   4. Classes      (depends on Branches)
 *   5. Children     (depends on Branches, Classes, Locations, School Years)
 *   6. Garderie Profile (depends on Branches, Children)
 *   7. Parents      (depends on Children)
 *   8. Employees    (depends on Branches)
 *   9. Garderie Misc (depends on Branches, Children, Employees)
 *  10. Users        (depends on Branches, Children via Parents)
 *  11. Control Plane (depends on Users when user grants are resolvable)
 *  12. Auth Metadata (depends on Users)
 *  13. Login Audit   (depends on Users, Parent Users when resolvable)
 *  14. Legacy Settings (optional settings/config tables)
 *  15. Daily Reports (depends on Children)
 *  16. Absences      (depends on Children, Users)
 *  17. Calls         (depends on Children, Employees, Users)
 *  18. Assessments   (depends on Children, Classes, Employees, Users, Organization)
 *  19. Medical Forms (depends on Children)
 *  20. Payments      (depends on Children)
 *  21. Food/Calendar (depends on Branches)
 *  22. Alarms        (depends on Children, Users, Parent Users, Teachers)
 *  23. Messages      (depends on Users)
 *
 * Usage:
 *   pnpm tsx src/scripts/migration/migrate-all.ts [--dry-run] [--step=N]
 *
 * Flags:
 *   --dry-run   Preview what would be migrated without writing to DB
 *   --step=N    Run only step N (1-23) and all its dependencies
 *   --from=N    Start from step N (skip earlier steps, assumes they ran)
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { closeMysqlPool } from "./lib/mysql-client";
import { isDryRun, log, logError } from "./lib/utils";

import { migrateBranches } from "./migrate-branches";
import { migrateLocations } from "./migrate-locations";
import { migrateSchoolYears } from "./migrate-school-years";
import { migrateClasses } from "./migrate-classes";
import { migrateChildren } from "./migrate-children";
import { migrateGarderieProfile } from "./migrate-garderie-profile";
import { migrateParents } from "./migrate-parents";
import { migrateEmployees } from "./migrate-employees";
import { migrateGarderieMisc } from "./migrate-garderie-misc";
import { migrateUsers } from "./migrate-users";
import { migrateControlPlane } from "./migrate-control-plane";
import { migrateAuthMetadata } from "./migrate-auth-metadata";
import { migrateLoginAudit } from "./migrate-login-audit";
import { migrateLegacySettings } from "./migrate-settings";
import { migrateDailyReports } from "./migrate-daily-reports";
import { migrateAbsences } from "./migrate-absences";
import { migrateCalls } from "./migrate-calls";
import { migrateAssessments } from "./migrate-assessments";
import { migrateMedical } from "./migrate-medical";
import { migratePayments } from "./migrate-payments";
import { migrateFoodCalendar } from "./migrate-food-calendar";
import { migrateAlarms } from "./migrate-alarms";
import { migrateMessages } from "./migrate-messages";

interface MigrationStep {
  name: string;
  run: (prisma: PrismaClient, orgId: string) => Promise<void>;
}

const steps: MigrationStep[] = [
  {
    name: "1. Branches",
    run: async (prisma, orgId) => {
      await migrateBranches(prisma, orgId);
    },
  },
  {
    name: "2. Locations",
    run: async (prisma) => {
      await migrateLocations(prisma);
    },
  },
  {
    name: "3. School Years",
    run: async (prisma, orgId) => {
      await migrateSchoolYears(prisma, orgId);
    },
  },
  {
    name: "4. Classes",
    run: async (prisma) => {
      await migrateClasses(prisma);
    },
  },
  {
    name: "5. Children",
    run: async (prisma) => {
      await migrateChildren(prisma);
    },
  },
  {
    name: "6. Garderie Profile",
    run: async (prisma) => {
      await migrateGarderieProfile(prisma);
    },
  },
  {
    name: "7. Parents",
    run: async (prisma) => {
      await migrateParents(prisma);
    },
  },
  {
    name: "8. Employees",
    run: async (prisma) => {
      await migrateEmployees(prisma);
    },
  },
  {
    name: "9. Garderie Misc",
    run: async (prisma, orgId) => {
      await migrateGarderieMisc(prisma, orgId);
    },
  },
  {
    name: "10. Users",
    run: async (prisma) => {
      await migrateUsers(prisma);
    },
  },
  {
    name: "11. Control Plane",
    run: async (prisma) => {
      await migrateControlPlane(prisma);
    },
  },
  {
    name: "12. Auth Metadata",
    run: async (prisma) => {
      await migrateAuthMetadata(prisma);
    },
  },
  {
    name: "13. Login Audit",
    run: async (prisma) => {
      await migrateLoginAudit(prisma);
    },
  },
  {
    name: "14. Legacy Settings",
    run: async (prisma) => {
      await migrateLegacySettings(prisma);
    },
  },
  {
    name: "15. Daily Reports",
    run: async (prisma) => {
      await migrateDailyReports(prisma);
    },
  },
  {
    name: "16. Absences",
    run: async (prisma) => {
      await migrateAbsences(prisma);
    },
  },
  {
    name: "17. Calls",
    run: async (prisma) => {
      await migrateCalls(prisma);
    },
  },
  {
    name: "18. Assessments",
    run: async (prisma, orgId) => {
      await migrateAssessments(prisma, orgId);
    },
  },
  {
    name: "19. Medical Forms",
    run: async (prisma) => {
      await migrateMedical(prisma);
    },
  },
  {
    name: "20. Payments",
    run: async (prisma) => {
      await migratePayments(prisma);
    },
  },
  {
    name: "21. Food, Calendar & Holidays",
    run: async (prisma, orgId) => {
      await migrateFoodCalendar(prisma, orgId);
    },
  },
  {
    name: "22. Alarms & Notifications",
    run: async (prisma) => {
      await migrateAlarms(prisma);
    },
  },
  {
    name: "23. Messages",
    run: async (prisma, orgId) => {
      await migrateMessages(prisma, orgId);
    },
  },
];

function getArg(name: string): number | null {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return null;
  const val = parseInt(arg.split("=")[1], 10);
  return isNaN(val) ? null : val;
}

async function main() {
  const dryRun = isDryRun();
  const stepOnly = getArg("step");
  const fromStep = getArg("from");

  log("╔══════════════════════════════════════════════════╗");
  log("║     Garderie Data Migration: MySQL → PostgreSQL  ║");
  log("╚══════════════════════════════════════════════════╝");
  log("");

  if (dryRun) {
    log("🔍 DRY RUN MODE — no data will be written");
    log("");
  }

  const prisma = createPrismaClient();

  try {
    // Ensure organization exists
    let org = await prisma.organization.findFirst();
    if (!org) {
      log("Creating default organization 'Kiddz Online'...");
      if (!dryRun) {
        org = await prisma.organization.create({
          data: { name: "Kiddz Online", slug: "kiddz-online" },
        });
      } else {
        log("[DRY RUN] Would create organization");
        // Use a placeholder for dry run
        org = { id: "dry-run-org-id" } as unknown as typeof org;
      }
    }
    const orgId = org!.id;

    const startIdx = fromStep ? fromStep - 1 : 0;
    const stepsToRun = stepOnly
      ? steps.slice(0, stepOnly) // Run up to and including the requested step
      : steps.slice(startIdx);

    const totalSteps = stepsToRun.length;
    log(`Running ${totalSteps} migration step(s)...`);
    log("");

    const startTime = Date.now();

    for (let i = 0; i < stepsToRun.length; i++) {
      const step = stepsToRun[i];
      const stepStart = Date.now();

      log(`━━━ Step ${step.name} ━━━`);
      try {
        await step.run(prisma, orgId);
      } catch (err) {
        logError(`Step ${step.name} FAILED`, err);
        log("Migration aborted. Fix the error and re-run.");
        log(
          "Already-migrated records will be skipped on re-run (idempotent)."
        );
        process.exit(1);
      }

      const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1);
      log(`Step ${step.name} completed in ${elapsed}s`);
      log("");
    }

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log("══════════════════════════════════════════════════");
    log(`Migration complete in ${totalElapsed}s${dryRun ? " [DRY RUN]" : ""}`);
    log("══════════════════════════════════════════════════");
  } catch (err) {
    logError("Migration failed", err);
    process.exit(1);
  } finally {
    await closeMysqlPool();
    await prisma.$disconnect();
  }
}

main();
