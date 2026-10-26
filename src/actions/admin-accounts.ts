"use server";

import { AdminRole, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { getAdmin, requireAdminAction } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { localePath } from "@/i18n/locale-path";
import { wouldRemoveLastActiveSuperadmin } from "@/lib/admin-security";

export type AdminActionState = {
  error?: string;
  message?: string;
  detail?: string;
  oneTimePassword?: string;
};

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function secretField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function localeOf(formData: FormData) {
  return field(formData, "locale") === "bn" ? "bn" : "en";
}

function validLoginId(value: string) {
  if (value.length < 3 || value.length > 120) return false;
  if (value.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

function requestedRole(value: string): AdminRole | null {
  if (
    value === "SUPERADMIN" ||
    value === "CONTENT_MANAGER" ||
    value === "SAFEGUARDING_REVIEWER" ||
    value === "REPORTING_ADMIN"
  ) return value;
  return null;
}

async function verifyPassword(adminId: string, password: string) {
  const attempt = await import("@/lib/rate-limit").then(({ rateLimit }) =>
    rateLimit(`admin-reauth:${adminId}`, 8, 10 * 60_000)
  );
  if (!attempt.success) return false;
  const row = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { passwordHash: true },
  });
  return Boolean(row && password && await bcrypt.compare(password, row.passwordHash));
}

async function ensureIdentityAvailable(loginId: string, email: string, exceptId?: string) {
  const normalizedLogin = loginId.toLowerCase();
  const normalizedEmail = email.toLowerCase();
  const collision = await prisma.adminUser.findFirst({
    where: {
      ...(exceptId ? { id: { not: exceptId } } : {}),
      OR: [
        { loginId: { equals: normalizedLogin, mode: "insensitive" } },
        { email: { equals: normalizedLogin, mode: "insensitive" } },
        { loginId: { equals: normalizedEmail, mode: "insensitive" } },
        { email: { equals: normalizedEmail, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  return !collision;
}

function temporaryPassword() {
  return randomBytes(24).toString("base64url");
}

async function signOutToLogin(locale: string): Promise<never> {
  await signOut({ redirectTo: localePath(locale, "/admin/login?password-updated=1") });
  throw new Error("Sign out did not redirect");
}

export async function updateOwnAdminAccountAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await getAdmin();
  if (!admin) return { error: "SESSION_EXPIRED" };
  if (admin.mustChangePassword) return { error: "PASSWORD_CHANGE_REQUIRED" };
  const locale = localeOf(formData);
  const currentPassword = secretField(formData, "currentPassword");
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const loginId = field(formData, "loginId").toLowerCase();
  if (!await verifyPassword(admin.id, currentPassword)) return { error: "CURRENT_PASSWORD" };
  if (name.length < 2 || name.length > 120) return { error: "NAME_INVALID" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "EMAIL_INVALID" };
  if (!validLoginId(loginId)) return { error: "LOGIN_INVALID" };
  if (!await ensureIdentityAvailable(loginId, email, admin.id)) return { error: "DUPLICATE" };

  const before = await prisma.adminUser.findUnique({
    where: { id: admin.id },
    select: { name: true, email: true, loginId: true },
  });
  if (!before) return { error: "ACCOUNT_MISSING" };
  const changedCredential = email !== before.email.toLowerCase() || loginId !== before.loginId.toLowerCase();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id: admin.id },
        data: {
          name,
          email,
          loginId,
          ...(changedCredential ? { sessionVersion: { increment: 1 } } : {}),
        },
      });
      if (changedCredential) {
        await tx.adminSession.updateMany({
          where: { adminId: admin.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      await audit({
        tx,
        required: true,
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        action: "ADMIN_PROFILE_UPDATE",
        targetType: "AdminUser",
        targetId: admin.id,
        before,
        after: { name, email, loginId },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "DUPLICATE" };
    }
    throw error;
  }
  if (changedCredential) return signOutToLogin(locale);
  return { message: "updated" };
}

export async function changeOwnAdminPasswordAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const admin = await getAdmin();
  if (!admin) return { error: "SESSION_EXPIRED" };
  const locale = localeOf(formData);
  const currentPassword = secretField(formData, "currentPassword");
  const newPassword = secretField(formData, "newPassword");
  const confirmPassword = secretField(formData, "confirmPassword");
  if (!await verifyPassword(admin.id, currentPassword)) return { error: "CURRENT_PASSWORD" };
  if (newPassword.length < 12 || newPassword.length > 256) return { error: "PASSWORD_LENGTH" };
  if (newPassword !== confirmPassword) return { error: "PASSWORD_MISMATCH" };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        sessionVersion: { increment: 1 },
      },
    });
    await tx.adminSession.updateMany({
      where: { adminId: admin.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await audit({
      tx,
      required: true,
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "ADMIN_PASSWORD_CHANGE",
      targetType: "AdminUser",
      targetId: admin.id,
      before: { mustChangePassword: admin.mustChangePassword },
      after: { mustChangePassword: false, sessionsRevoked: true },
    });
  });
  return signOutToLogin(locale);
}

export async function revokeOtherAdminSessionsAction(formData: FormData) {
  const admin = await requireAdminAction();
  const locale = localeOf(formData);
  const revokedAt = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const sessions = await tx.adminSession.findMany({
      where: { adminId: admin.id, id: { not: admin.sessionId }, revokedAt: null, expiresAt: { gt: revokedAt } },
      select: { id: true },
    });
    await tx.adminSession.updateMany({
      where: { id: { in: sessions.map((session) => session.id) } },
      data: { revokedAt },
    });
    await audit({
      tx,
      required: true,
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "ADMIN_OTHER_SESSIONS_REVOKE",
      targetType: "AdminSession",
      targetId: `other-sessions:${sessions.length}`,
      before: { activeOtherSessions: sessions.length },
      after: { revoked: sessions.length },
    });
    return sessions.length;
  });
  redirect(`${localePath(locale, "/admin/account")}?revoked=${result}`);
}

export async function createAdminAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const actor = await requireAdminAction("admins:write");
  const name = field(formData, "name");
  const loginId = field(formData, "loginId").toLowerCase();
  const email = field(formData, "email").toLowerCase();
  const role = requestedRole(field(formData, "role"));
  const currentPassword = secretField(formData, "currentPassword");
  if (!await verifyPassword(actor.id, currentPassword)) return { error: "REAUTH" };
  if (name.length < 2 || name.length > 120 || !validLoginId(loginId) || !role) return { error: "ADMIN_DETAILS" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "EMAIL_INVALID" };
  if (!await ensureIdentityAvailable(loginId, email)) return { error: "DUPLICATE" };

  const password = temporaryPassword();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.adminUser.create({
        data: { name, loginId, email, role, passwordHash, mustChangePassword: true },
        select: { id: true, name: true, loginId: true, email: true, role: true },
      });
      await audit({
        tx,
        required: true,
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "ADMIN_CREATE",
        targetType: "AdminUser",
        targetId: row.id,
        after: row,
      });
      return row;
    });
    return { message: "adminCreated", detail: created.loginId, oneTimePassword: password };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "DUPLICATE" };
    throw error;
  }
}

export async function updateAdminAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const actor = await requireAdminAction("admins:write");
  const id = field(formData, "id");
  const name = field(formData, "name");
  const loginId = field(formData, "loginId").toLowerCase();
  const email = field(formData, "email").toLowerCase();
  const role = requestedRole(field(formData, "role"));
  if (!await verifyPassword(actor.id, secretField(formData, "currentPassword"))) return { error: "REAUTH" };
  if (!id || id === actor.id) return { error: "SELF_ROLE" };
  if (name.length < 2 || name.length > 120 || !validLoginId(loginId) || !role || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "ADMIN_DETAILS" };
  if (!await ensureIdentityAvailable(loginId, email, id)) return { error: "DUPLICATE" };

  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.adminUser.findUnique({
        where: { id },
        select: { id: true, name: true, loginId: true, email: true, role: true, isActive: true, deletedAt: true },
      });
      if (!before || before.deletedAt) throw new Error("ADMIN_MISSING");
      const oldRole = before.role === "SAFEGUARDING" ? "SAFEGUARDING_REVIEWER" : before.role === "VIEWER" ? "REPORTING_ADMIN" : before.role;
      const activeSuperadminCount = await tx.adminUser.count({ where: { role: "SUPERADMIN", isActive: true, deletedAt: null } });
      if (wouldRemoveLastActiveSuperadmin({ targetRole: before.role, targetActive: before.isActive, activeSuperadminCount, removePrivileges: role !== "SUPERADMIN" })) throw new Error("LAST_SUPERADMIN");
      const roleChanged = oldRole !== role;
      await tx.adminUser.update({
        where: { id },
        data: { name, loginId, email, role, ...(roleChanged ? { sessionVersion: { increment: 1 } } : {}) },
      });
      if (roleChanged || loginId !== before.loginId || email !== before.email) {
        await tx.adminSession.updateMany({ where: { adminId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await audit({
        tx,
        required: true,
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "ADMIN_UPDATE",
        targetType: "AdminUser",
        targetId: id,
        before,
        after: { id, name, loginId, email, role, isActive: before.isActive, deletedAt: before.deletedAt },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return { message: "adminUpdated" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "DUPLICATE" };
    if (error instanceof Error && (error.message === "LAST_SUPERADMIN" || error.message === "ADMIN_MISSING")) return { error: error.message };
    throw error;
  }
}

export async function setAdminActiveAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireAdminAction("admins:write");
  const id = field(formData, "id");
  const locale = localeOf(formData);
  const enable = field(formData, "enable") === "true";
  if (!await verifyPassword(actor.id, secretField(formData, "currentPassword"))) return { error: "REAUTH" };
  if (!id || id === actor.id) return { error: "SELF_ACCESS" };
  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.adminUser.findUnique({ where: { id }, select: { id: true, email: true, role: true, isActive: true, deletedAt: true } });
      if (!before || before.deletedAt) throw new Error("ADMIN_MISSING");
      const activeSuperadminCount = await tx.adminUser.count({ where: { role: "SUPERADMIN", isActive: true, deletedAt: null } });
      if (wouldRemoveLastActiveSuperadmin({ targetRole: before.role, targetActive: before.isActive, activeSuperadminCount, removePrivileges: !enable })) throw new Error("LAST_SUPERADMIN");
      await tx.adminUser.update({ where: { id }, data: { isActive: enable, ...(before.isActive !== enable ? { sessionVersion: { increment: 1 } } : {}) } });
      if (!enable) await tx.adminSession.updateMany({ where: { adminId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await audit({
        tx,
        required: true,
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: enable ? "ADMIN_ENABLE" : "ADMIN_DISABLE",
        targetType: "AdminUser",
        targetId: id,
        before,
        after: { ...before, isActive: enable },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Error && (error.message === "LAST_SUPERADMIN" || error.message === "ADMIN_MISSING")) return { error: error.message };
    throw error;
  }
  redirect(`${localePath(locale, "/admin/admins")}?updated=1`);
}

export async function softDeleteAdminAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const actor = await requireAdminAction("admins:write");
  const id = field(formData, "id");
  const locale = localeOf(formData);
  if (!await verifyPassword(actor.id, secretField(formData, "currentPassword"))) return { error: "REAUTH" };
  if (!id || id === actor.id) return { error: "SELF_ACCESS" };
  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.adminUser.findUnique({ where: { id }, select: { id: true, email: true, role: true, isActive: true, deletedAt: true } });
      if (!before || before.deletedAt) throw new Error("ADMIN_MISSING");
      const activeSuperadminCount = await tx.adminUser.count({ where: { role: "SUPERADMIN", isActive: true, deletedAt: null } });
      if (wouldRemoveLastActiveSuperadmin({ targetRole: before.role, targetActive: before.isActive, activeSuperadminCount, removePrivileges: true })) throw new Error("LAST_SUPERADMIN");
      const deletedAt = new Date();
      await tx.adminUser.update({ where: { id }, data: { isActive: false, deletedAt, sessionVersion: { increment: 1 } } });
      await tx.adminSession.updateMany({ where: { adminId: id, revokedAt: null }, data: { revokedAt: deletedAt } });
      await audit({
        tx,
        required: true,
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "ADMIN_SOFT_DELETE",
        targetType: "AdminUser",
        targetId: id,
        before,
        after: { id, isActive: false, deletedAt: deletedAt.toISOString() },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Error && (error.message === "LAST_SUPERADMIN" || error.message === "ADMIN_MISSING")) return { error: error.message };
    throw error;
  }
  redirect(`${localePath(locale, "/admin/admins")}?deleted=1`);
}

export async function resetAdminPasswordAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const actor = await requireAdminAction("admins:write");
  const id = field(formData, "id");
  if (!await verifyPassword(actor.id, secretField(formData, "currentPassword"))) return { error: "REAUTH" };
  if (!id || id === actor.id) return { error: "SELF_ROLE" };
  const password = temporaryPassword();
  const passwordHash = await bcrypt.hash(password, 12);
  const before = await prisma.adminUser.findUnique({ where: { id }, select: { id: true, email: true, isActive: true, deletedAt: true } });
  if (!before || !before.isActive || before.deletedAt) return { error: "ADMIN_INACTIVE" };
  await prisma.$transaction(async (tx) => {
    await tx.adminUser.update({ where: { id }, data: { passwordHash, mustChangePassword: true, failedLoginAttempts: 0, lockedUntil: null, sessionVersion: { increment: 1 } } });
    await tx.adminSession.updateMany({ where: { adminId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit({
      tx,
      required: true,
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action: "ADMIN_PASSWORD_RESET",
      targetType: "AdminUser",
      targetId: id,
      before: { isActive: before.isActive },
      after: { mustChangePassword: true, sessionsRevoked: true },
    });
  });
  return { message: "resetReady", oneTimePassword: password };
}
