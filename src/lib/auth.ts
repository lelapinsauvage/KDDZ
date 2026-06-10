import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import { createHash } from "crypto";
import { compare, hash } from "bcryptjs";
import { authConfig } from "./auth.config";
import { getLegacyAccessSessionSnapshot } from "./legacy-access-permissions";
import {
  getLegacyLoginSessionContext,
  getLegacyLoginDisabledStatus,
  type LegacyLoginSessionContext,
  resolveStaffLoginIdentity,
} from "./legacy-auth-identity";
import {
  configuredLegacyOAuthProviders,
  createLegacySocialSignupPrefill,
  isLegacySocialAuthProvider,
  recordLegacySocialLoginAudit,
  resolveLegacySocialAuthIdentity,
} from "./legacy-social-auth";

type AppDb = typeof import("./db").db;
type AuthProvider = NonNullable<NextAuthConfig["providers"]>[number];
const LEGACY_REMEMBER_SESSION_MS = 100 * 24 * 60 * 60 * 1000;

function legacyBool(value: string | null | undefined) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function credentialFlag(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function legacySettingsTable(legacyLogin: LegacyLoginSessionContext | null) {
  return legacyLogin?.legacyTable === "login_users_man"
    ? "login_settings_man"
    : "login_settings";
}

async function defaultSessionMinutes(
  db: AppDb,
  legacyLogin: LegacyLoginSessionContext | null,
) {
  if (!legacyLogin) return null;
  const setting = await db.legacySetting.findFirst({
    where: {
      sourceDatabase: legacyLogin.sourceDatabase,
      legacyTable: legacySettingsTable(legacyLogin),
      settingKey: "default_session",
    },
    orderBy: [{ legacyId: "desc" }],
    select: { settingValue: true },
  });
  const minutes = Number.parseInt(setting?.settingValue ?? "", 10);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
}

async function legacySessionPolicy(
  db: AppDb,
  legacyLogin: LegacyLoginSessionContext | null,
  remember: boolean,
) {
  if (remember) {
    return {
      legacySessionMode: "remember" as const,
      legacySessionExpiresAt: new Date(
        Date.now() + LEGACY_REMEMBER_SESSION_MS,
      ).toISOString(),
    };
  }

  const minutes = await defaultSessionMinutes(db, legacyLogin);
  if (minutes === null) {
    return {
      legacySessionMode: "modern_default" as const,
      legacySessionExpiresAt: null,
    };
  }
  if (minutes === 0) {
    return {
      legacySessionMode: "browser_session" as const,
      legacySessionExpiresAt: null,
    };
  }

  return {
    legacySessionMode: "default_session" as const,
    legacySessionExpiresAt: new Date(
      Date.now() + minutes * 60 * 1000,
    ).toISOString(),
  };
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

function legacyOAuthProviders(): AuthProvider[] {
  return configuredLegacyOAuthProviders().flatMap<AuthProvider>((provider) => {
    const options = {
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
    };
    if (provider.authProviderId === "facebook") return [Facebook(options)];
    if (provider.authProviderId === "google") return [Google(options)];
    if (provider.authProviderId === "twitter") return [Twitter(options)];
    return [];
  });
}

async function legacySocialSessionPayload(params: {
  provider: string;
  providerAccountId?: string | null;
  email?: string | null;
}) {
  const { db } = await import("./db");
  const identity = await resolveLegacySocialAuthIdentity(params);
  if (!identity?.user) return null;

  const disabledStatus = await getLegacyLoginDisabledStatus(db, identity);
  if (disabledStatus.isDisabled) return null;

  const legacyLogin = await getLegacyLoginSessionContext(db, identity);
  const sessionPolicy = await legacySessionPolicy(db, legacyLogin, false);
  const legacyAccess = await getLegacyAccessSessionSnapshot(identity.user.id);

  await recordLegacySocialLoginAudit({
    identity,
    provider: params.provider,
    providerAccountId: params.providerAccountId,
  });
  await recordLegacyLoginTimestamp(db, identity.user.id, new Request("http://localhost"));

  return {
    user: identity.user,
    legacyLogin,
    legacyAccess,
    sessionPolicy,
  };
}

/**
 * Full auth config WITH providers and database logic.
 * Used by API routes and server components (NOT middleware).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    async signIn({ account, user, profile }) {
      if (!isLegacySocialAuthProvider(account?.provider)) return true;
      const { db } = await import("./db");
      const identity = await resolveLegacySocialAuthIdentity({
        provider: account?.provider ?? "",
        providerAccountId: account?.providerAccountId,
        email: user.email,
      });
      if (!identity?.user) {
        const username =
          typeof profile?.login === "string"
            ? profile.login
            : typeof profile?.username === "string"
              ? profile.username
              : typeof profile?.screen_name === "string"
                ? profile.screen_name
                : null;
        const prefillKey = await createLegacySocialSignupPrefill({
          provider: account?.provider ?? "",
          providerAccountId: account?.providerAccountId,
          email: user.email,
          name: user.name,
          username,
        });
        return prefillKey
          ? `/signup?new_social=1&social=${encodeURIComponent(prefillKey)}`
          : false;
      }

      const disabledStatus = await getLegacyLoginDisabledStatus(db, identity);
      return !disabledStatus.isDisabled;
    },
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      const { account, user } = params;
      if (!isLegacySocialAuthProvider(account?.provider)) return token;

      const payload = await legacySocialSessionPayload({
        provider: account?.provider ?? "",
        providerAccountId: account?.providerAccountId,
        email: user?.email,
      });
      if (!payload) return token;

      token.id = payload.user.id;
      token.email = payload.user.email;
      token.name = payload.user.name;
      token.picture = payload.user.image;
      token.role = payload.user.role;
      token.branchId = payload.user.branchId;
      token.organizationId =
        payload.user.organizationId ?? payload.user.branch?.organizationId ?? null;
      token.legacyLogin = payload.legacyLogin;
      token.legacyAccess = payload.legacyAccess;
      token.legacySessionMode = payload.sessionPolicy.legacySessionMode;
      token.legacySessionExpiresAt =
        payload.sessionPolicy.legacySessionExpiresAt;

      return token;
    },
    session: authConfig.callbacks.session,
    authorized: authConfig.callbacks.authorized,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Username or email", type: "text" },
        password: { label: "Password", type: "password" },
        remember: { label: "Stay signed in", type: "checkbox" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const identifier = String(credentials.email).trim();
        const password = credentials.password as string;
        const remember = credentialFlag(credentials.remember);

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

          const legacyLogin = await getLegacyLoginSessionContext(db, identity);
          const sessionPolicy = await legacySessionPolicy(
            db,
            legacyLogin,
            remember,
          );
          const legacyAccess = await getLegacyAccessSessionSnapshot(user.id);
          await recordLegacyLoginTimestamp(db, user.id, request);

          return {
            id: user.id,
            email: user.email,
            image: user.image,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
            organizationId: user.organizationId ?? user.branch?.organizationId ?? null,
            legacyLogin,
            legacyAccess,
            ...sessionPolicy,
          };
        } catch (error) {
          console.error("credentials authorize error:", error);
          return null;
        }
      },
    }),
    ...legacyOAuthProviders(),
  ],
});
