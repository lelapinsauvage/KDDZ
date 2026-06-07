import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { compare, hash } from "bcryptjs";
import { authConfig } from "./auth.config";
import {
  getLegacyLoginDisabledStatus,
  resolveStaffLoginIdentity,
} from "./legacy-auth-identity";

type AppDb = typeof import("./db").db;

function legacyBool(value: string | null | undefined) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function clientIpAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null
  );
}

function legacyAuditConfig(recordType: string) {
  return recordType === "manager_login_user"
    ? {
        legacyTable: "login_timestamps_man",
        principalType: "MANAGER_USER",
      }
    : {
        legacyTable: "login_timestamps",
        principalType: "USER",
      };
}

async function recordLegacyLoginTimestamp(
  db: AppDb,
  userId: string,
  request: Request,
) {
  try {
    const records = await db.legacyAuthRecord.findMany({
      where: {
        userId,
        recordType: { in: ["login_user", "manager_login_user"] },
      },
      orderBy: [{ sourceDatabase: "desc" }, { legacyId: "desc" }],
      select: {
        sourceDatabase: true,
        legacyId: true,
        recordType: true,
        legacyUserId: true,
      },
    });
    const record =
      records.find((row) => row.recordType === "login_user") ??
      records.find((row) => row.recordType === "manager_login_user");

    if (!record) return;

    const setting = await db.legacySetting.findFirst({
      where: {
        sourceDatabase: record.sourceDatabase,
        legacyTable: { in: ["login_settings", "login_settings_man"] },
        settingKey: "profile-timestamps-enable",
      },
      orderBy: [{ legacyId: "desc" }],
      select: { settingValue: true },
    });
    if (!legacyBool(setting?.settingValue)) return;

    const config = legacyAuditConfig(record.recordType);
    const maxTimestamp = await db.legacyLoginTimestamp.findFirst({
      where: {
        sourceDatabase: record.sourceDatabase,
        legacyTable: config.legacyTable,
      },
      orderBy: { legacyId: "desc" },
      select: { legacyId: true },
    });
    const legacyUserId = record.legacyUserId ?? record.legacyId;
    const legacyId = (maxTimestamp?.legacyId ?? 0) + 1;
    const occurredAt = new Date();
    const ipAddress = clientIpAddress(request);

    await db.legacyLoginTimestamp.create({
      data: {
        sourceDatabase: record.sourceDatabase,
        legacyTable: config.legacyTable,
        legacyId,
        legacyUserId,
        userId,
        principalType: config.principalType,
        ipAddress,
        occurredAt,
        legacyData: {
          id: legacyId,
          user_id: legacyUserId,
          ip: ipAddress,
          timestamp: occurredAt.toISOString(),
          inserted_from: "modern_login",
        },
      },
    });
  } catch (error) {
    console.error("recordLegacyLoginTimestamp error:", error);
  }
}

/**
 * Full auth config WITH providers and database logic.
 * Used by API routes and server components (NOT middleware).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Username or email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const identifier = String(credentials.email).trim();
        const password = credentials.password as string;

        try {
          // Dynamic import to avoid loading Prisma at build time
          const { db } = await import("./db");
          const identity = await resolveStaffLoginIdentity(db, identifier);
          const disabledStatus = await getLegacyLoginDisabledStatus(
            db,
            identity,
          );
          if (disabledStatus.isDisabled) return null;

          const user = identity?.user ?? null;

          if (!user || !user.isActive || !user.passwordHash) {
            return null;
          }

          const isPasswordValid = await compare(password, user.passwordHash);
          const legacyMd5 = createHash("md5").update(password).digest("hex");
          const isLegacyPasswordValid =
            !isPasswordValid &&
            (await compare(`md5:${legacyMd5}`, user.passwordHash));

          if (!isPasswordValid && !isLegacyPasswordValid) {
            return null;
          }

          if (isLegacyPasswordValid) {
            await db.user.update({
              where: { id: user.id },
              data: { passwordHash: await hash(password, 12) },
            });
          }

          await recordLegacyLoginTimestamp(db, user.id, request);

          return {
            id: user.id,
            email: user.email,
            image: user.image,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
            organizationId: user.organizationId ?? user.branch?.organizationId ?? null,
          };
        } catch (error) {
          console.error("credentials authorize error:", error);
          return null;
        }
      },
    }),
  ],
});
