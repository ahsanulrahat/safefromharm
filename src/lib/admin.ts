import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeAdminRole, hasAdminPermission } from "@/lib/roles";
import type { AdminPermission, AdminSessionUser } from "@/lib/roles";
import { isAdminSessionUsable } from "@/lib/admin-security";
import { redirect } from "next/navigation";
import { localePath } from "@/i18n/locale-path";

/** Validate every JWT against the live admin and revocable session row. */
export async function getAdmin(): Promise<AdminSessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  const sessionId = session?.user?.adminSessionId;
  if (!id || !sessionId) return null;

  const now = new Date();
  const [admin, activeSession] = await Promise.all([
    prisma.adminUser.findFirst({
      where: { id, isActive: true, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
      },
    }),
    prisma.adminSession.findFirst({
      where: { id: sessionId, adminId: id, revokedAt: null, expiresAt: { gt: now } },
      select: { id: true, revokedAt: true, expiresAt: true },
    }),
  ]);
  if (!admin || !isAdminSessionUsable({
    accountActive: Boolean(admin?.id),
    softDeleted: !admin,
    sessionFound: Boolean(activeSession),
    sessionRevoked: Boolean(activeSession?.revokedAt),
    sessionExpired: !activeSession || activeSession.expiresAt <= now,
  })) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: normalizeAdminRole(admin.role),
    sessionId,
    mustChangePassword: admin.mustChangePassword,
  };
}

/** Page gate. Authorization always uses the current role from the database. */
export async function requireAdmin(
  locale = "en",
  permission?: AdminPermission,
  options: { allowMustChangePassword?: boolean } = {}
) {
  const admin = await getAdmin();
  if (!admin) redirect(localePath(locale, "/admin/login"));
  if (admin.mustChangePassword && !options.allowMustChangePassword) {
    redirect(localePath(locale, "/admin/first-login-password"));
  }
  if (permission && !hasAdminPermission(admin.role, permission)) {
    redirect(localePath(locale, "/admin/access-denied"));
  }
  return admin;
}

/** Server action gate. Caller cannot gain access by bypassing the page UI. */
export async function requireAdminAction(permission?: AdminPermission) {
  const admin = await getAdmin();
  if (!admin) throw new Error("Unauthorized");
  if (admin.mustChangePassword) throw new Error("Password change required");
  if (permission && !hasAdminPermission(admin.role, permission)) {
    throw new Error("Forbidden");
  }
  return admin;
}
