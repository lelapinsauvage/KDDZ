/**
 * Migration: t_branch → Branch
 *
 * Field mapping:
 *   t_branch.brid        → (old ID, mapped to UUID)
 *   t_branch.brname      → Branch.name
 *   t_branch.brlocation  → Branch.address
 *   t_branch.mobile      → Branch.phone
 *   t_branch.tel         → Branch.email (stored as secondary; old DB has no email field)
 *   t_branch.active      → Branch.isActive
 *   t_branch.datetime    → Branch.createdAt
 *   t_branch.prefix      → (stored in metadata, not in new schema directly)
 *   t_branch.image       → (not migrated — file reference)
 *
 * Prerequisites: Organization must exist in new DB.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import { queryMysql, closeMysqlPool } from "./lib/mysql-client";
import {
  generateUUID,
  setMapping,
  isDryRun,
  toBool,
  log,
  logError,
  logProgress,
} from "./lib/utils";

interface OldBranch {
  brid: number;
  brname: string;
  brlocation: string;
  mobile: string;
  tel: string;
  active: number;
  datetime: string;
  prefix: string;
  image: string;
}

export async function migrateBranches(
  prisma: PrismaClient,
  organizationId: string
) {
  log("=== Migrating Branches ===");
  const dryRun = isDryRun();

  const oldRows = await queryMysql<OldBranch>(
    "SELECT * FROM t_branch ORDER BY brid"
  );
  log(`Found ${oldRows.length} branches in old DB`);

  let migrated = 0;
  let skipped = 0;

  for (const row of oldRows) {
    // Idempotency: check if already migrated by looking for name match
    const existing = await prisma.branch.findFirst({
      where: { organizationId, name: row.brname },
    });

    if (existing) {
      setMapping("branch", row.brid, existing.id);
      skipped++;
      continue;
    }

    const newId = generateUUID();

    if (!dryRun) {
      await prisma.branch.create({
        data: {
          id: newId,
          organizationId,
          name: row.brname,
          address: row.brlocation || null,
          phone: row.mobile || row.tel || null,
          email: null,
          isActive: toBool(row.active),
          createdAt: row.datetime ? new Date(row.datetime) : new Date(),
        },
      });
    }

    setMapping("branch", row.brid, newId);
    migrated++;
    logProgress(migrated, oldRows.length, "Branches");
  }

  log(
    `Branches: ${migrated} migrated, ${skipped} skipped (already exist)${dryRun ? " [DRY RUN]" : ""}`
  );
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      // Resolve the organization — use the first one or create one
      let org = await prisma.organization.findFirst();
      if (!org) {
        log("No organization found. Creating default organization...");
        if (!isDryRun()) {
          org = await prisma.organization.create({
            data: { name: "Kiddz Online" },
          });
        } else {
          log("[DRY RUN] Would create default organization");
          return;
        }
      }
      await migrateBranches(prisma, org.id);
    } catch (err) {
      logError("Branch migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
