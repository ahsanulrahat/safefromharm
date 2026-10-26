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
    signIn: "/admin/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.adminId = user.id;
        token.role = (user as { role?: string }).role ?? "VIEWER";
        token.adminSessionId = (user as { adminSessionId?: string }).adminSessionId;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.adminId as string | undefined) ?? "";
        session.user.role = (token.role as
          | "SUPERADMIN"
          | "CONTENT_MANAGER"
          | "SAFEGUARDING_REVIEWER"
          | "REPORTING_ADMIN"
          | "SAFEGUARDING"
          | "VIEWER"
          | undefined) ?? "VIEWER";
        session.user.adminSessionId = typeof token.adminSessionId === "string" ? token.adminSessionId : "";
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
