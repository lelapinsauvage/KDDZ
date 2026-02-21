import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
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
          });

          if (!user || !user.isActive || !user.passwordHash) {
            return null;
          }

          const isPasswordValid = await compare(password, user.passwordHash);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
          };
        } catch {
          // DB not connected yet — allow demo login
          if (email === "admin@garderie.com" && password === "admin123") {
            return {
              id: "demo-admin",
              email: "admin@garderie.com",
              name: "Admin",
              role: "ADMIN",
              branchId: null,
            };
          }
          return null;
        }
      },
    }),
  ],
});
