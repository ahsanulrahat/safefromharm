import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { ipFromRequest } from "@/lib/request";

// Used only to keep timing roughly constant for unknown emails.
const DUMMY_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.YK8vYbQe3f7Kx3Yo9n5W2rN1q5S6";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const ip = ipFromRequest(request);
        const limited = await rateLimit(`admin-login:${ip}:${email}`, 8, 10 * 60_000);
        if (!limited.success) return null;

        const admin = await prisma.adminUser.findUnique({ where: { email } });
        if (!admin) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        };
      },
    }),
  ],
});
