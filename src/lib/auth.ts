import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { compare, hash } from "bcryptjs";
import { authConfig } from "./auth.config";

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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // Dynamic import to avoid loading Prisma at build time
          const { db } = await import("./db");
          const user = await db.user.findUnique({
            where: { email },
            include: { branch: { select: { organizationId: true } } },
          });

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

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
            organizationId: user.organizationId ?? user.branch?.organizationId ?? null,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
