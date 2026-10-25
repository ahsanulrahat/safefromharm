import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { ipFromRequest } from "@/lib/request";
import { audit } from "@/lib/audit";

// Used only to keep timing roughly constant for unknown emails.
const DUMMY_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.YK8vYbQe3f7Kx3Yo9n5W2rN1q5S6";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        loginId: { label: "Email or login ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const loginId = String(credentials?.loginId ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!loginId || !password) return null;

        const ip = ipFromRequest(request);
        const normalizedLogin = loginId.toLowerCase();
        const limited = await rateLimit(
          `admin-login:${ip}:${normalizedLogin}`,
          8,
          10 * 60_000
        );
        if (!limited.success) return null;

        const admin = await prisma.adminUser.findFirst({
          where: {
            OR: [
              { loginId: { equals: normalizedLogin, mode: "insensitive" } },
              { email: { equals: normalizedLogin, mode: "insensitive" } },
            ],
          },
        });
        if (!admin) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }

        if (
          !admin.isActive ||
          admin.deletedAt ||
          (admin.lockedUntil && admin.lockedUntil > new Date())
        ) {
          await bcrypt.compare(password, admin.passwordHash);
          return null;
        }

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) {
          await prisma.$transaction(async (tx) => {
            const latest = await tx.adminUser.update({
              where: { id: admin.id },
              data: { failedLoginAttempts: { increment: 1 } },
              select: { failedLoginAttempts: true },
            });
            if (latest.failedLoginAttempts >= 5) {
              await tx.adminUser.update({
                where: { id: admin.id },
                data: { lockedUntil: new Date(Date.now() + 15 * 60_000) },
              });
            }
          });
          return null;
        }

        const sessionId = randomUUID();
        const expiresAt = new Date(Date.now() + 8 * 60 * 60_000);
        await prisma.$transaction(async (tx) => {
          await tx.adminUser.update({
            where: { id: admin.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
            },
          });
          await tx.adminSession.create({
            data: {
              id: sessionId,
              adminId: admin.id,
              expiresAt,
              ipAddress: ip.slice(0, 64),
              userAgent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
            },
          });
          await audit({
            tx,
            actorId: admin.id,
            actorEmail: admin.email,
            actorRole: admin.role,
            action: "ADMIN_LOGIN",
            targetType: "AdminSession",
            targetId: sessionId,
            after: { createdAt: new Date().toISOString(), expiresAt: expiresAt.toISOString() },
          });
        });
        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
          adminSessionId: sessionId,
          mustChangePassword: admin.mustChangePassword,
        };
      },
    }),
  ],
});
