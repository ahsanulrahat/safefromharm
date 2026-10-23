import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config shared by middleware and the Node auth instance.
 * The Credentials provider (which needs Prisma + bcrypt) lives in auth.ts.
 */
export const authConfig = {
  providers: [],
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/bn/admin/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.adminId = user.id;
        token.role = (user as { role?: string }).role ?? "VIEWER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.adminId as string | undefined) ?? "";
        session.user.role =
          (token.role as "SUPERADMIN" | "SAFEGUARDING" | "VIEWER" | undefined) ??
          "VIEWER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
