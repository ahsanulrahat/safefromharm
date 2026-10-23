import type { AdminRole } from "@prisma/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { AdminSessionUser } from "@/lib/roles";

/**
 * Server-side authorization. Pages redirect to login; actions throw.
 * Middleware is only a first gate — every admin page/action re-checks here.
 */
export async function getAdmin(): Promise<AdminSessionUser | null> {
  const session = await auth();
  if (!session?.user?.email || !session.user.role) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function requireAdmin(locale = "bn", roles?: AdminRole[]) {
  const admin = await getAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);
  if (roles && !roles.includes(admin.role)) {
    redirect(`/${locale}/admin?forbidden=1`);
  }
  return admin;
}

/** For server actions: throw instead of redirecting. */
export async function requireAdminAction(roles?: AdminRole[]) {
  const admin = await getAdmin();
  if (!admin) throw new Error("Unauthorized");
  if (roles && !roles.includes(admin.role)) throw new Error("Forbidden");
  return admin;
}
