"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { getTranslations } from "next-intl/server";
import { safeAdminCallback } from "@/lib/admin-callback";
import { localePath } from "@/i18n/locale-path";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const locale = String(formData.get("locale") ?? "bn") === "en" ? "en" : "bn";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeAdminCallback(locale, formData.get("callbackUrl"));
  const t = await getTranslations({ locale, namespace: "admin.login" });

  if (!email || !password) return { error: t("error") };

  try {
    await signIn("credentials", {
      email,
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
  await signOut({ redirectTo: localePath(locale, "/admin/login") });
}
