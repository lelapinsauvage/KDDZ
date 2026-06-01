/**
 * Master migration script — runs all migrations in dependency order.
 *
 * Dependency order:
 *   1. Branches     (no deps — only needs Organization)
 *   2. Locations    (no deps — provides location mappings)
 *   3. Classes      (depends on Branches)
 *   4. Children     (depends on Branches, Classes, Locations)
 *   5. Parents      (depends on Children)
 *   6. Employees    (depends on Branches)
 *   7. Users        (depends on Branches, Children via Parents)
 *   8. Login Audit   (depends on Users, Parent Users when resolvable)
 *   9. Legacy Settings (optional settings/config tables)
 *  10. Daily Reports (depends on Children)
 *  11. Absences      (depends on Children, Users)
 *  12. Calls         (depends on Children, Employees, Users)
 *  13. Assessments   (depends on Children, Classes, Employees, Users, Organization)
 *  14. Medical Forms (depends on Children)
 *  15. Payments      (depends on Children)
 *  16. Food/Calendar (depends on Branches)
 *  17. Alarms        (depends on Children, Users, Parent Users, Teachers)
 *  18. Messages      (depends on Users)
 *
 * Usage:
 *   pnpm tsx src/scripts/migration/migrate-all.ts [--dry-run] [--step=N]
 *
 * Flags:
 *   --dry-run   Preview what would be migrated without writing to DB
 *   --step=N    Run only step N (1-18) and all its dependencies
 *   --from=N    Start from step N (skip earlier steps, assumes they ran)
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { closeMysqlPool } from "./lib/mysql-client";
import { isDryRun, log, logError } from "./lib/utils";

import { migrateBranches } from "./migrate-branches";
import { migrateLocations } from "./migrate-locations";
import { migrateClasses } from "./migrate-classes";
import { migrateChildren } from "./migrate-children";
import { migrateParents } from "./migrate-parents";
import { migrateEmployees } from "./migrate-employees";
import { migrateUsers } from "./migrate-users";
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
    name: "3. Classes",
    run: async (prisma) => {
      await migrateClasses(prisma);
    },
  },
  {
    name: "4. Children",
    run: async (prisma) => {
      await migrateChildren(prisma);
    },
  },
  {
    name: "5. Parents",
    run: async (prisma) => {
      await migrateParents(prisma);
    },
  },
  {
    name: "6. Employees",
    run: async (prisma) => {
      await migrateEmployees(prisma);
    },
  },
  {
    name: "7. Users",
    run: async (prisma) => {
      await migrateUsers(prisma);
    },
  },
  {
    name: "8. Login Audit",
    run: async (prisma) => {
      await migrateLoginAudit(prisma);
    },
  },
  {
    name: "9. Legacy Settings",
    run: async (prisma) => {
      await migrateLegacySettings(prisma);
    },
  },
  {
    name: "10. Daily Reports",
    run: async (prisma) => {
      await migrateDailyReports(prisma);
    },
  },
  {
    name: "11. Absences",
    run: async (prisma) => {
      await migrateAbsences(prisma);
    },
  },
  {
    name: "12. Calls",
    run: async (prisma) => {
      await migrateCalls(prisma);
    },
  },
  {
    name: "13. Assessments",
    run: async (prisma, orgId) => {
      await migrateAssessments(prisma, orgId);
    },
  },
  {
    name: "14. Medical Forms",
    run: async (prisma) => {
      await migrateMedical(prisma);
    },
  },
  {
    name: "15. Payments",
    run: async (prisma) => {
      await migratePayments(prisma);
    },
  },
  {
    name: "16. Food, Calendar & Holidays",
    run: async (prisma, orgId) => {
      await migrateFoodCalendar(prisma, orgId);
    },
  },
  {
    name: "17. Alarms & Notifications",
    run: async (prisma) => {
      await migrateAlarms(prisma);
    },
  },
  {
    name: "18. Messages",
    run: async (prisma) => {
      await migrateMessages(prisma);
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
