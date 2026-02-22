/**
 * Migration: login_users → User
 *            parent_login_users → ParentUser
 *
 * === login_users → User ===
 *   user_id     → (old ID, mapped to UUID)
 *   username    → (used for matching, not stored directly)
 *   name        → name
 *   email       → email
 *   password    → passwordHash (MD5 → bcrypt rehash)
 *   user_level  → role (PHP serialized array → UserRole enum)
 *   restricted  → isActive (inverted)
 *   usites      → branchId (branch mapping if applicable)
 *   timestamp   → createdAt
 *
 * Role mapping from user_level PHP serialized values:
 *   Level 1 = Admin    → ADMIN
 *   Level 4 = Owner    → ADMIN
 *   Level 5 = Manager  → MANAGER
 *   Level 6 = Teacher  → TEACHER
 *
 * Password handling:
 *   Old passwords are MD5 hashes. We rehash them with bcrypt using a
 *   known prefix so the app can detect and handle legacy auth:
 *   - Store as bcrypt hash of the MD5 hash
 *   - On first login, the app should verify password → MD5 → bcrypt check
 *   - After successful login, rehash with direct bcrypt
 *
 * === parent_login_users → ParentUser ===
 *   user_id   → (old ID, mapped to UUID)
 *   username  → username
 *   password  → passwordHash (MD5 → bcrypt)
 *   name      → (not stored in ParentUser — used for reference)
 *   usites    → childId (resolve via child mapping)
 *
 * Prerequisites: Branches and Children must be migrated first.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "./lib/prisma-client";
import bcrypt from "bcryptjs";
import { queryMysql, closeMysqlPool } from "./lib/mysql-client";
import {
  generateUUID,
  setMapping,
  getMapping,
  isDryRun,
  toBool,
  cleanString,
  log,
  logError,
  logProgress,
} from "./lib/utils";

interface OldUser {
  user_id: number;
  user_level: string;
  restricted: number;
  username: string;
  name: string;
  email: string;
  password: string;
  db_id: number;
  timestamp: string;
  usites: string;
  uclasses: string;
  uchild: string;
}

interface OldParentUser {
  user_id: number;
  user_level: string;
  restricted: number;
  username: string;
  name: string;
  email: string;
  password: string;
  timestamp: string;
  usites: string;
}

type UserRole = "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";

/**
 * Parse PHP serialized array like 'a:2:{i:0;s:1:"1";i:1;s:1:"4";}'
 * to extract level numbers.
 */
function parsePhpLevels(serialized: string): number[] {
  const levels: number[] = [];
  const matches = serialized.matchAll(/s:\d+:"(\d+)"/g);
  for (const m of matches) {
    levels.push(parseInt(m[1], 10));
  }
  return levels;
}

function mapUserRole(userLevel: string): UserRole {
  const levels = parsePhpLevels(userLevel);

  // Priority: Admin (1) > Owner (4) > Manager (5) > Teacher (6)
  if (levels.includes(1) || levels.includes(4)) return "ADMIN";
  if (levels.includes(5)) return "MANAGER";
  if (levels.includes(6)) return "TEACHER";

  // Fallback based on simple string check
  if (userLevel.includes("1")) return "ADMIN";
  return "TEACHER";
}

/**
 * Rehash an MD5 password hash with bcrypt.
 * The old system stored passwords as plain MD5.
 * We wrap the MD5 hash in bcrypt so we can verify later:
 *   bcrypt(md5(plaintext)) — app needs to check this way on first login.
 */
async function rehashMd5ToBcrypt(md5Hash: string): Promise<string> {
  // Prefix with "md5:" so the app knows this is a legacy hash
  const prefixed = `md5:${md5Hash}`;
  return bcrypt.hash(prefixed, 10);
}

export async function migrateUsers(prisma: PrismaClient) {
  log("=== Migrating Users ===");
  const dryRun = isDryRun();

  // --- login_users → User ---
  const oldUsers = await queryMysql<OldUser>(
    "SELECT * FROM login_users ORDER BY user_id"
  );
  log(`Found ${oldUsers.length} users in login_users`);

  let migrated = 0;
  let skipped = 0;

  for (const row of oldUsers) {
    const email = row.email?.trim();
    if (!email) {
      logError(`User ${row.user_id} "${row.username}" has no email — skipping`);
      continue;
    }

    // Idempotency: check by email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      setMapping("user", row.user_id, existing.id);
      skipped++;
      continue;
    }

    const role = mapUserRole(row.user_level);
    const passwordHash = await rehashMd5ToBcrypt(row.password);

    // Map branch assignment: usites is a branch ID or "0"
    let branchId: string | null = null;
    if (row.usites && row.usites !== "0") {
      branchId = getMapping("branch", row.usites);
    }

    const newId = generateUUID();

    if (!dryRun) {
      await prisma.user.create({
        data: {
          id: newId,
          email,
          name: row.name || row.username,
          passwordHash,
          role,
          isActive: !toBool(row.restricted),
          branchId,
          createdAt: row.timestamp ? new Date(row.timestamp) : new Date(),
        },
      });
    }

    setMapping("user", row.user_id, newId);
    migrated++;
    logProgress(migrated, oldUsers.length, "Users");
  }

  log(`Users: ${migrated} migrated, ${skipped} skipped`);

  // --- parent_login_users → ParentUser ---
  await migrateParentUsers(prisma, dryRun);

  log(`=== User migration complete ===${dryRun ? " [DRY RUN]" : ""}`);
}

async function migrateParentUsers(prisma: PrismaClient, dryRun: boolean) {
  const oldRows = await queryMysql<OldParentUser>(
    "SELECT * FROM parent_login_users ORDER BY user_id"
  );
  log(`Found ${oldRows.length} parent users in parent_login_users`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of oldRows) {
    const username = row.username?.trim();
    if (!username) continue;

    // Idempotency: check by username
    const existing = await prisma.parentUser.findUnique({
      where: { username },
    });
    if (existing) {
      setMapping("parent_user", row.user_id, existing.id);
      skipped++;
      continue;
    }

    // Parent users are linked to children via usites or other means
    // In the old system, parent_login_users.usites often stores the branch,
    // and the child link is through t_parents.parent_email matching
    // For now, we try to find a child by matching parent email
    let childId: string | null = null;

    // Try to find a child whose parent has this email
    if (row.email) {
      const parentRecord = await prisma.parent.findFirst({
        where: { email: row.email.trim() },
        select: { childId: true },
      });
      if (parentRecord) {
        childId = parentRecord.childId;
      }
    }

    if (!childId) {
      // Fallback: try to find by parent name matching
      if (row.name) {
        const nameParts = row.name.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          const parentRecord = await prisma.parent.findFirst({
            where: {
              firstName: nameParts[0],
              lastName: nameParts[nameParts.length - 1],
            },
            select: { childId: true },
          });
          if (parentRecord) {
            childId = parentRecord.childId;
          }
        }
      }
    }

    if (!childId) {
      logError(
        `Parent user ${row.user_id} "${username}" — could not resolve child link`
      );
      errors++;
      continue;
    }

    const passwordHash = await rehashMd5ToBcrypt(row.password);
    const newId = generateUUID();

    if (!dryRun) {
      await prisma.parentUser.create({
        data: {
          id: newId,
          username,
          passwordHash,
          isActive: !toBool(row.restricted),
          childId,
          createdAt: row.timestamp ? new Date(row.timestamp) : new Date(),
        },
      });
    }

    setMapping("parent_user", row.user_id, newId);
    migrated++;
    logProgress(migrated, oldRows.length, "Parent Users");
  }

  log(
    `Parent Users: ${migrated} migrated, ${skipped} skipped, ${errors} unresolved`
  );
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------
if (require.main === module) {
  (async () => {
    const prisma = createPrismaClient();
    try {
      await migrateUsers(prisma);
    } catch (err) {
      logError("User migration failed", err);
      process.exit(1);
    } finally {
      await closeMysqlPool();
      await prisma.$disconnect();
    }
  })();
}
