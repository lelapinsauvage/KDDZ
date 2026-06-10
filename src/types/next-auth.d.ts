import { type DefaultSession } from "next-auth";

type LegacyLoginSessionContext = {
  sourceDatabase: string;
  legacyTable: string;
  legacyUserId: number | null;
  legacyDbId: number | null;
  legacyDatabaseName: string | null;
  legacySelectedYear: string | null;
};

type LegacySessionMode =
  | "remember"
  | "default_session"
  | "browser_session"
  | "modern_default";

type LegacyAccessSessionSnapshot = {
  generatedAt: string;
  levels: Array<{
    sourceDatabase: string;
    legacyTable: "login_users" | "login_users_man";
    legacyUserId: number | null;
    legacyLevelIds: number[];
  }>;
  configuredActionKeys: string[];
  allowedActionKeys: string[];
  directUserActionKeys: string[];
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
      branchId: string | null;
      organizationId: string | null;
      legacyLogin: LegacyLoginSessionContext | null;
      legacyAccess: LegacyAccessSessionSnapshot | null;
      legacySessionMode: LegacySessionMode | null;
      legacySessionExpiresAt: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
    branchId: string | null;
    organizationId: string | null;
    legacyLogin?: LegacyLoginSessionContext | null;
    legacyAccess?: LegacyAccessSessionSnapshot | null;
    legacySessionMode?: LegacySessionMode | null;
    legacySessionExpiresAt?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
    branchId: string | null;
    organizationId: string | null;
    legacyLogin?: LegacyLoginSessionContext | null;
    legacyAccess?: LegacyAccessSessionSnapshot | null;
    legacySessionMode?: LegacySessionMode | null;
    legacySessionExpiresAt?: string | null;
  }
}
