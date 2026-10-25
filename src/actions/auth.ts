"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { getTranslations } from "next-intl/server";
import { safeAdminCallback } from "@/lib/admin-callback";
import { localePath } from "@/i18n/locale-path";
import { getAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const locale = String(formData.get("locale") ?? "bn") === "en" ? "en" : "bn";
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeAdminCallback(locale, formData.get("callbackUrl"));
  const t = await getTranslations({ locale, namespace: "admin.login" });

  if (!loginId || !password) return { error: t("error") };

  try {
    await signIn("credentials", {
      loginId,
      password,
      redirectTo,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t("error") };
    }
    throw error;
  }
}

export async function logoutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "bn") === "en" ? "en" : "bn";
  const admin = await getAdmin();
  if (admin) {
    const revokedAt = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.adminSession.updateMany({
        where: { id: admin.sessionId, adminId: admin.id, revokedAt: null },
        data: { revokedAt },
      });
      await audit({
        tx,
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        action: "ADMIN_LOGOUT",
        targetType: "AdminSession",
        targetId: admin.sessionId,
        after: { revokedAt: revokedAt.toISOString() },
      });
    });
  }
  await signOut({ redirectTo: localePath(locale, "/admin/login") });
}
